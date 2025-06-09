#!/usr/bin/env -S deno run --allow-env --allow-net

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import sgMail from "@sendgrid/mail";
import { z } from "zod";
import { load } from "@std/dotenv";
import DOMPurify from "dompurify";

// Load environment variables from .env file if it exists (for development)
try {
  await load({ export: true });
} catch {
  // .env file doesn't exist or can't be read, which is fine
}

// Email schema with enhanced validation (from address removed - now hardcoded)
const EmailSchema = z.object({
  to: z.string().email("Invalid recipient email address"),
  subject: z.string().min(1, "Subject cannot be empty"),
  text: z.string().optional(),
  html: z.string().optional(),
}).refine(
  (data) => data.text || data.html,
  {
    message: "Either text or html content must be provided",
    path: ["content"],
  }
);

type EmailRequest = z.infer<typeof EmailSchema>;

class SendGridMCPServer {
  private server: Server;
  private apiKey: string;
  private fromEmail: string;
  private toolHandlers = new Map<string, (request: any) => Promise<any>>();

  constructor(options?: { testMode?: boolean }) {
    this.server = new Server(
      {
        name: "sendgrid-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Validate API key at startup
    this.apiKey = Deno.env.get("SENDGRID_API_KEY") || "";
    if (!this.apiKey && !options?.testMode) {
      console.error("ERROR: SENDGRID_API_KEY environment variable is required");
      Deno.exit(1);
    }

    // Validate from email at startup
    this.fromEmail = Deno.env.get("SENDGRID_FROM_EMAIL") || "";
    if (!this.fromEmail && !options?.testMode) {
      console.error("ERROR: SENDGRID_FROM_EMAIL environment variable is required");
      Deno.exit(1);
    }

    // Configure SendGrid only if API key is available
    if (this.apiKey) {
      sgMail.setApiKey(this.apiKey);
    }

    // Register tool handlers
    this.toolHandlers.set("send_email", this.handleSendEmail.bind(this));

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "send_email",
          description: "Send an email using SendGrid API",
          inputSchema: {
            type: "object",
            properties: {
              to: {
                type: "string",
                format: "email",
                description: "Recipient email address",
              },
              subject: {
                type: "string",
                description: "Email subject line",
              },
              text: {
                type: "string",
                description: "Plain text email content (optional if html is provided)",
              },
              html: {
                type: "string",
                description: "HTML email content (optional if text is provided)",
              },
            },
            required: ["to", "subject"],
            additionalProperties: false,
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const handler = this.toolHandlers.get(request.params.name);
      if (!handler) {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }
      return await handler(request);
    });
  }

  private async handleSendEmail(request: any): Promise<any> {
    try {
      // Validate input with enhanced schema
      const emailData = EmailSchema.parse(request.params.arguments);
      
      // Sanitize HTML content to prevent XSS
      const sanitizedData: EmailRequest = {
        ...emailData,
        html: emailData.html ? this.sanitizeHtml(emailData.html) : undefined,
      };

      // Send email via SendGrid
      const response = await this.sendEmail(sanitizedData);

      return {
        content: [
          {
            type: "text",
            text: `Email sent successfully! Status: ${response.statusCode}, Message ID: ${response.messageId}`,
          },
        ],
      };
    } catch (error) {
      // Log the full error for debugging
      console.error("TOOL_CALL_ERROR:", {
        toolName: request.params.name,
        error: error,
        timestamp: new Date().toISOString(),
      });

      // Handle different types of errors without exposing sensitive information
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        return {
          content: [
            {
              type: "text",
              text: `Validation error: ${errorMessages}`,
            },
          ],
          isError: true,
        };
      }

      if (error && typeof error === 'object' && 'response' in error) {
        const sendGridError = error as { response?: { status?: number; body?: any } };
        const status = sendGridError.response?.status || 'unknown';
        const errorBody = sendGridError.response?.body;
        
        let errorMessage = `SendGrid API error (status: ${status})`;
        
        // Defensive error parsing with proper checks
        try {
          if (errorBody && 
              typeof errorBody === 'object' && 
              'errors' in errorBody &&
              Array.isArray(errorBody.errors) &&
              errorBody.errors.length > 0 &&
              typeof errorBody.errors[0] === 'object' &&
              'message' in errorBody.errors[0]) {
            errorMessage += `: ${errorBody.errors[0].message}`;
          }
        } catch (parseError) {
          // If error parsing fails, stick with basic error message
          console.error("Error parsing SendGrid error response:", parseError);
        }
        
        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }

      // Generic error handling
      return {
        content: [
          {
            type: "text",
            text: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async sendEmail(emailData: EmailRequest): Promise<{ statusCode: number; messageId: string }> {
    const msg: any = {
      to: emailData.to,
      from: this.fromEmail, // Use hardcoded verified sender
      subject: emailData.subject,
    };

    // Only add text/html if they exist to avoid undefined values
    if (emailData.text) {
      msg.text = emailData.text;
    }
    if (emailData.html) {
      msg.html = emailData.html;
    }

    const [response] = await sgMail.send(msg);
    
    return {
      statusCode: response.statusCode,
      messageId: response.headers['x-message-id'] as string || 'unknown',
    };
  }

  private sanitizeHtml(html: string): string {
    // Use DOMPurify for secure HTML sanitization
    return DOMPurify.sanitize(html);
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("SendGrid MCP server running on stdio");
  }
}

// Start the server if this is the main module
if (import.meta.main) {
  const server = new SendGridMCPServer();
  await server.run();
}

export { SendGridMCPServer };