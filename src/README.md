# OpenRouter MCP Server - Modular Structure

This directory contains the refactored OpenRouter MCP Server, split into multiple focused TypeScript files for better maintainability and organization.

## File Structure

```
src/
├── server.ts              # Main entry point (simplified)
├── server-class.ts        # Main server class
├── config.ts              # Configuration and environment setup
├── types.ts               # Type definitions and Zod schemas
├── index.ts               # Main exports for library usage
├── handlers/
│   ├── resources.ts       # Resource handlers (models, pricing, usage)
│   └── tools.ts           # Tool handlers (chat, compare, generate, etc.)
└── utils/
    └── image.ts           # Image handling utilities
```

## Key Components

### `server.ts`
- **Purpose**: Main entry point for the application
- **Content**: Simple import and server instantiation
- **Size**: ~6 lines (reduced from 739 lines)

### `server-class.ts`
- **Purpose**: Main server class definition
- **Content**: Server initialization, error handling, and handler setup
- **Responsibilities**: 
  - MCP Server setup
  - Error handling
  - Process signal handling
  - Handler registration

### `config.ts`
- **Purpose**: Configuration management
- **Content**: Environment variables, OpenRouter API configuration
- **Features**: 
  - Environment variable loading
  - API key validation
  - Default configuration values

### `types.ts`
- **Purpose**: Type definitions and validation schemas
- **Content**: Zod schemas for request validation, TypeScript types
- **Schemas**:
  - `ChatRequestSchema`
  - `ImageGenerationSchema`
  - `CompareModelsSchema`
  - Content schemas for multimodal support

### `handlers/resources.ts`
- **Purpose**: MCP resource handlers
- **Content**: Resource listing and reading logic
- **Resources**:
  - `openrouter://models` - Available models
  - `openrouter://pricing` - Model pricing
  - `openrouter://usage` - Usage statistics

### `handlers/tools.ts`
- **Purpose**: MCP tool handlers
- **Content**: Tool definitions and execution logic
- **Tools**:
  - `list_models` - List available models
  - `chat_with_model` - Chat with specific model
  - `compare_models` - Compare multiple models
  - `generate_image` - Generate images
  - `get_model_info` - Get model details

### `utils/image.ts`
- **Purpose**: Image handling utilities
- **Content**: Base64 image saving, response image processing
- **Functions**:
  - `saveBase64Image()` - Save base64 data to file
  - `saveResponseImages()` - Process and save response images

### `index.ts`
- **Purpose**: Main exports for library usage
- **Content**: Clean exports of all public APIs
- **Usage**: Allows importing specific components when using as a library

## Benefits of This Structure

1. **Separation of Concerns**: Each file has a single, clear responsibility
2. **Maintainability**: Easier to find and modify specific functionality
3. **Testability**: Individual components can be tested in isolation
4. **Reusability**: Components can be imported and used independently
5. **Readability**: Smaller, focused files are easier to understand
6. **Scalability**: Easy to add new handlers, tools, or utilities

## Usage

The server can still be started the same way:

```bash
node src/server.ts
```

For library usage, you can import specific components:

```typescript
import { OpenRouterMCPServer, OPENROUTER_CONFIG } from './src/index.js';
import { ChatRequestSchema } from './src/types.js';
import { saveBase64Image } from './src/utils/image.js';
```

## Migration Notes

- All functionality remains the same
- No breaking changes to the public API
- Environment variables and configuration work identically
- All tools and resources function as before
- Image handling behavior is preserved