# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development with hot reload
npm run dev

# Production build  
npm run build

# Run production server
npm start

# Run tests (Jest framework)
npm test

# Lint TypeScript code
npm run lint
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `OPENROUTER_API_KEY` - Required for OpenRouter API access
- `OPENROUTER_BASE_URL` - Defaults to https://openrouter.ai/api/v1
- `OPENROUTER_SITE_URL` - Your site URL for API attribution
- `OPENROUTER_APP_NAME` - Application name for API headers

## Architecture Overview

This is a **Model Context Protocol (MCP) server** written in TypeScript that provides Claude access to 400+ AI models through OpenRouter's API.

### Core Architecture

**Single-file implementation**: `src/server.ts` contains the complete `OpenRouterMCPServer` class

**MCP Tools Provided**:
- `list_models` - Get available OpenRouter models
- `chat_with_model` - Send messages to specific models  
- `compare_models` - Compare responses from multiple models
- `get_model_info` - Get detailed model information

**MCP Resources Exposed**:
- `model_pricing` - Pricing information for models
- `model_capabilities` - Model capabilities and features
- `usage_stats` - Usage statistics (placeholder)

### Key Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `axios` - HTTP client for OpenRouter API
- `zod` - Runtime type validation and schemas
- `dotenv` - Environment variable management

### Testing

- **Framework**: Jest (configured but no tests implemented yet)
- **Setup**: Dependencies must be installed first (`npm install`)
- **ES Modules**: Requires TypeScript + ESM Jest configuration

### Claude Desktop Integration

Use `examples/claude-config.json` as a template for Claude Desktop MCP server configuration. The server communicates via stdio transport following MCP protocol standards.

## Code Patterns

- **Schema-first design**: All API requests/responses validated with Zod schemas
- **Error handling**: Comprehensive try-catch blocks around external API calls
- **Async/await**: Consistent async pattern with Promise.all for parallel requests
- **Environment-based config**: Secure API key management through environment variables

## Development Best Practices

- Remember to always use yarn to install run dependencies.
- For build and run command as well use yarn