# SendGrid MCP Server

A Model Context Protocol (MCP) server implementation that provides email sending capabilities using the SendGrid API. Built with Deno and TypeScript.

## Features

- 🚀 **MCP Integration**: Full Model Context Protocol server implementation
- 📧 **Email Sending**: Send emails via SendGrid API with both text and HTML content
- 🔒 **Security**: Input validation, HTML sanitization, and secure API key handling
- ✅ **Validation**: Comprehensive input validation using Zod schemas
- 🧪 **Testing**: Complete test suite with mocking capabilities
- 🦕 **Deno Native**: Built specifically for the Deno runtime

## Prerequisites

1. **Deno**: Install Deno from [deno.land](https://deno.land/)
2. **SendGrid Account**: Sign up at [sendgrid.com](https://sendgrid.com/)
3. **SendGrid API Key**: Create an API key with "Mail Send > Full Access" permissions
4. **Verified Sender**: Configure a verified sender identity in SendGrid

## Installation

### Option 1: From JSR (Recommended)

```bash
# Install from JSR
deno add jsr:@cong/sendgrid-mcp

# Or use directly without installation
deno run --allow-env --allow-net --allow-read jsr:@cong/sendgrid-mcp
```

### Option 2: From Source

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd sendgrid-mcp
   ```

2. Set up your SendGrid configuration:
   ```bash
   export SENDGRID_API_KEY="your-sendgrid-api-key"
   export SENDGRID_FROM_EMAIL="sender@yourdomain.com"
   ```

   Or create a `.env` file:
   ```env
   SENDGRID_API_KEY=your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=sender@yourdomain.com
   ```

## Usage

### Running the Server

Start the MCP server:
```bash
deno task start
```

Or with development mode (auto-restart on changes):
```bash
deno task dev
```

### Running Tests

Execute the test suite:
```bash
deno task test
```

### Direct Execution

You can also run the server directly:
```bash
deno run --allow-env --allow-net --allow-read main.ts
```

### Development & Debugging

For development and debugging, you can use the MCP Inspector:

```bash
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector

# Run the server with MCP Inspector
npx @modelcontextprotocol/inspector deno run --allow-env --allow-net --allow-read main.ts
```

This will start a web interface at `http://localhost:5173` where you can:
- Test the `send_email` tool interactively
- View server logs and debug information
- Inspect tool schemas and responses
- Debug MCP protocol communication

## MCP Tool: send_email

The server provides a single MCP tool called `send_email` with the following schema:

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string (email) | Yes | Recipient email address |
| `subject` | string | Yes | Email subject line |
| `text` | string | No* | Plain text email content |
| `html` | string | No* | HTML email content |

*Note: Either `text` or `html` (or both) must be provided. The `from` address is now configured server-side via the `SENDGRID_FROM_EMAIL` environment variable.

### Example Usage

```json
{
  "name": "send_email",
  "arguments": {
    "to": "recipient@example.com",
    "subject": "Welcome to our service!",
    "text": "Welcome! Thanks for signing up.",
    "html": "<h1>Welcome!</h1><p>Thanks for signing up.</p>"
  }
}
```

### Response Format

**Success Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Email sent successfully! Status: 202, Message ID: abc123def456"
    }
  ]
}
```

**Error Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Validation error: to: Invalid recipient email address"
    }
  ],
  "isError": true
}
```

## Security Features

### Input Validation
- Email address format validation using Zod schemas
- Required field validation
- Content requirement validation (text or HTML must be provided)

### HTML Sanitization
The server automatically sanitizes HTML content using DOMPurify to prevent XSS attacks. This provides comprehensive protection against malicious HTML content while preserving safe formatting tags.

### API Key Security
- API key loaded from environment variables only
- No hardcoded credentials in source code
- API key validation at server startup
- Error messages never expose API key information

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SENDGRID_API_KEY` | Yes | Your SendGrid API key with Mail Send permissions |
| `SENDGRID_FROM_EMAIL` | Yes | Verified sender email address for all outgoing emails |

### Deno Permissions

The server requires the following Deno permissions:
- `--allow-env`: To read environment variables
- `--allow-net`: To make HTTP requests to SendGrid API

## Project Structure

```
sendgrid-mcp/
├── main.ts           # Main server implementation
├── main_test.ts      # Comprehensive test suite
├── deno.json         # Deno configuration and dependencies
├── README.md         # This documentation
└── .env              # Environment variables (optional, for development)
```

## Dependencies

- `@modelcontextprotocol/sdk`: MCP TypeScript SDK
- `@sendgrid/mail`: SendGrid's Node.js email library
- `zod`: TypeScript-first schema validation
- `@std/assert`: Deno standard library assertions
- `@std/dotenv`: Environment variable loading
- `dompurify`: Secure HTML sanitization library

## Error Handling

The server handles various error scenarios:

1. **Validation Errors**: Invalid email formats, missing required fields
2. **SendGrid API Errors**: Authentication failures, rate limits, invalid recipients
3. **Network Errors**: Connection timeouts, DNS resolution failures
4. **Configuration Errors**: Missing API key, invalid environment setup

All errors are returned in a structured format without exposing sensitive information.

## Development

### Adding New Features

1. Modify the server class in `main.ts`
2. Add corresponding tests in `main_test.ts`
3. Update this README if needed
4. Run tests to ensure everything works

### Testing Strategy

The test suite covers:
- Input validation with various edge cases
- HTML sanitization functionality
- Error handling scenarios
- Schema validation
- Mock SendGrid API responses

## SendGrid Setup

1. **Create Account**: Sign up at [sendgrid.com](https://sendgrid.com/)
2. **Enable 2FA**: Enable two-factor authentication for security
3. **Create API Key**: 
   - Go to Settings > API Keys
   - Create a new API key with "Mail Send > Full Access" permissions
   - Save the key securely
4. **Verify Sender**: 
   - Go to Settings > Sender Authentication
   - Verify your sender email address or domain
   - Use verified addresses in the `from` field

## Claude Desktop Integration

### Setup for Claude Desktop

1. **Install the MCP Server**: Choose one of the installation methods above

2. **Configure Claude Desktop**: Add the following configuration to your Claude Desktop MCP settings file:

#### For macOS:
```bash
# Location: ~/Library/Application Support/Claude/claude_desktop_config.json
```

#### For Windows:
```bash
# Location: %APPDATA%/Claude/claude_desktop_config.json
```

#### Configuration Example:

```json
{
  "mcpServers": {
    "sendgrid": {
      "command": "deno",
      "args": [
        "run",
        "--allow-env",
        "--allow-net",
        "--allow-read",
        "jsr:@cong/sendgrid-mcp"
      ],
      "env": {
        "SENDGRID_API_KEY": "your-sendgrid-api-key-here",
        "SENDGRID_FROM_EMAIL": "your-verified-sender@yourdomain.com"
      }
    }
  }
}
```

#### Alternative: Using Local Installation

If you've cloned the repository locally:

```json
{
  "mcpServers": {
    "sendgrid": {
      "command": "deno",
      "args": [
        "run",
        "--allow-env",
        "--allow-net",
        "--allow-read",
        "/path/to/sendgrid-mcp/main.ts"
      ],
      "env": {
        "SENDGRID_API_KEY": "your-sendgrid-api-key-here",
        "SENDGRID_FROM_EMAIL": "your-verified-sender@yourdomain.com"
      }
    }
  }
}
```

### Using with Claude Desktop

Once configured, restart Claude Desktop. You'll now have access to the `send_email` tool:

#### Example Usage in Claude:

**You:** "Send a welcome email to new-user@example.com with the subject 'Welcome to Our Platform!' and include both a text and HTML version."

**Claude:** I'll send that welcome email for you using the SendGrid MCP server.

```
Using send_email tool:
{
  "to": "new-user@example.com",
  "subject": "Welcome to Our Platform!",
  "text": "Welcome to our platform! We're excited to have you on board. If you have any questions, please don't hesitate to reach out to our support team.",
  "html": "<h1>Welcome to Our Platform!</h1><p>We're excited to have you on board.</p><p>If you have any questions, please don't hesitate to reach out to our support team.</p>"
}
```

**Claude:** ✅ Email sent successfully! Status: 202, Message ID: abc123def456

#### Features Available to Claude:

- **Send Text Emails**: Plain text email content
- **Send HTML Emails**: Rich formatted email content with HTML
- **Automatic Sanitization**: HTML content is automatically sanitized for security
- **Validation**: Email addresses and content are validated before sending
- **Error Handling**: Clear error messages for troubleshooting

### Security Notes for Claude Desktop

- **Environment Variables**: Store sensitive information like API keys in the environment configuration, not in conversation history
- **Verified Senders**: Only emails from your verified SendGrid sender address will be sent
- **HTML Sanitization**: All HTML content is automatically sanitized to prevent XSS attacks
- **No API Key Exposure**: API keys are never exposed in error messages or logs

### Troubleshooting Claude Desktop Integration

**Server Not Starting:**
- Verify Deno is installed and accessible from your PATH
- Check that the configuration file syntax is valid JSON
- Ensure all required environment variables are set

**Permission Errors:**
- Verify the Deno flags include `--allow-env`, `--allow-net`, and `--allow-read`
- Check that Claude Desktop has permission to execute Deno

**Email Not Sending:**
- Verify your SendGrid API key has "Mail Send" permissions
- Ensure the sender email address is verified with SendGrid
- Check the Claude Desktop logs for detailed error messages
- Use MCP Inspector to test the tool directly: `npx @modelcontextprotocol/inspector deno run --allow-env --allow-net --allow-read main.ts`

## Troubleshooting

### Common Issues

**Server won't start:**
- Check that `SENDGRID_API_KEY` is set
- Verify the API key has correct permissions
- Ensure Deno has network permissions

**Email not sending:**
- Verify the `from` address is verified with SendGrid
- Check SendGrid API key permissions
- Review SendGrid activity logs for detailed error information

**Permission errors:**
- Ensure you're running with `--allow-env --allow-net` flags
- Check that the API key environment variable is accessible

### Debug Mode

For additional debugging, you can modify the error handling in `main.ts` to log more detailed information during development.

### Using MCP Inspector for Debugging

The MCP Inspector provides a powerful web interface for testing and debugging:

```bash
# Set up environment variables
export SENDGRID_API_KEY="your-sendgrid-api-key"
export SENDGRID_FROM_EMAIL="your-verified-sender@domain.com"

# Start the inspector
npx @modelcontextprotocol/inspector deno run --allow-env --allow-net --allow-read main.ts
```

The inspector allows you to:
- **Test Tools**: Send test emails with different parameters
- **View Schemas**: Inspect the tool's input/output schemas
- **Monitor Logs**: See real-time server logs and errors
- **Debug Protocol**: Examine MCP protocol messages
- **Validate Setup**: Ensure your environment is configured correctly

## Publishing to JSR

This package is published to the JavaScript Registry (JSR). To publish a new version:

1. **Update Version**: Update the version in `deno.json`
2. **Test Package**: Run the publish check
   ```bash
   deno task publish:check
   ```
3. **Publish**: Publish to JSR
   ```bash
   deno task publish
   ```

### Development Workflow

```bash
# Install dependencies and run tests
deno task test

# Check for publishing issues
deno task publish:check

# Start development server
deno task dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Run `deno task publish:check` to verify package structure
6. Submit a pull request

## License

This project is open source. Please check the repository for license details.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review SendGrid documentation
3. Check MCP documentation at [modelcontextprotocol.io](https://modelcontextprotocol.io/)
4. Open an issue in the repository

---

Built with ❤️ using Deno and TypeScript