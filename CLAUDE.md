# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
# Development and testing
deno task dev          # Start server with auto-restart on changes
deno task test         # Run full test suite
deno task start        # Start production server

# JSR publishing
deno task publish:check # Test package for JSR publishing
deno task publish       # Publish to JSR

# Direct execution (requires explicit permissions)
deno run --allow-env --allow-net --allow-read main.ts

# Run from JSR
deno run --allow-env --allow-net --allow-read jsr:@cong/sendgrid-mcp

# Debug with MCP Inspector
npx @modelcontextprotocol/inspector deno run --allow-env --allow-net --allow-read main.ts
```

## Architecture Overview

This is a **Model Context Protocol (MCP) server** that provides email sending capabilities via SendGrid. The architecture follows a security-first design:

### Core Components

1. **SendGridMCPServer Class** (`main.ts:40-70`): Main server implementation
   - Validates `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` at startup (exits with code 1 if missing)
   - Supports `testMode` option to disable validation during testing
   - Uses `StdioServerTransport` for MCP communication
   - Implements Map-based tool handler pattern for scalability

2. **Validation Pipeline** (`main.ts:20-32`): Zod schema with custom refinement
   - Validates email format for `to` field (from address now hardcoded)
   - Enforces that either `text` or `html` content is provided
   - Custom error messages for each validation rule

3. **Security Layer** (`main.ts:sanitizeHtml`): DOMPurify-based HTML sanitization
   - Uses battle-tested DOMPurify library instead of regex patterns
   - Comprehensive XSS protection while preserving safe formatting
   - Applied automatically to all HTML content before sending

### MCP Tool Implementation

The server exposes a single tool: `send_email`
- **Schema**: Defined in `setupHandlers()` method with JSON Schema format
- **Handler**: Processes requests, validates input, sanitizes content, calls SendGrid API
- **Error Handling**: Returns structured responses without exposing sensitive information

## Environment Configuration

### Required Environment Variables
- `SENDGRID_API_KEY`: SendGrid API key with "Mail Send > Full Access" permissions
- `SENDGRID_FROM_EMAIL`: Verified sender email address for all outgoing emails
- Server validates both at startup (non-test mode)

### Deno Permissions
- `--allow-env`: Read environment variables and .env files
- `--allow-net`: HTTP requests to SendGrid API
- `--allow-read`: Load .env file (gracefully handles missing files)

### .env File Support
Optional `.env` file loading with error handling (`main.ts:14-18`). Missing files are silently ignored.

## Testing Strategy

### Test Mode Pattern
Tests use `testMode: true` option to bypass API key validation:
```typescript
const server = new SendGridMCPServer({ testMode: true });
```

### Test Coverage
- **Validation**: Email format, required fields, content requirements
- **Security**: HTML sanitization with XSS prevention
- **Error Handling**: Various SendGrid API error scenarios
- **Schema**: MCP tool schema validation

### Running Specific Tests
```bash
# Run single test file
deno test --allow-env --allow-net --allow-read main_test.ts

# Run with specific test name filter
deno test --allow-env --allow-net --allow-read --filter "HTML sanitization"
```

## Key Implementation Details

### SendGrid Message Construction
Messages are built conditionally to avoid `undefined` values:
- Base message with required fields (`to`, hardcoded `from`, `subject`)
- `from` address comes from `SENDGRID_FROM_EMAIL` environment variable
- Conditionally add `text` and `html` properties only if they exist
- Uses `any` type to satisfy SendGrid's strict TypeScript requirements

### Error Response Format
All errors return MCP-compatible responses with `isError: true` flag:
- **Validation errors**: Zod error messages with field paths
- **SendGrid errors**: Status codes without exposing API details
- **Generic errors**: Safe error messages without sensitive information

### Security Considerations
- API key and from email never logged or exposed in error messages
- HTML content automatically sanitized using DOMPurify before sending
- Email addresses validated at schema level
- SendGrid API errors parsed defensively without exposing internal details
- From address hardcoded server-side to prevent unauthorized sender spoofing

### Development Notes
- Server runs indefinitely on stdio transport (typical for MCP servers)
- Uses ES modules with npm: specifiers for Node.js packages
- Strict TypeScript configuration with exact optional property types
- All async operations properly awaited with error handling

### MCP Inspector for Development
The MCP Inspector provides a web-based debugging interface:
- Accessible at `http://localhost:5173` when running
- Interactive tool testing without Claude Desktop setup
- Real-time protocol message inspection
- Schema validation and error debugging
- Useful for development and troubleshooting integration issues