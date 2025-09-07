# OpenRouter MCP Server

A Model Context Protocol (MCP) server that provides access to OpenRouter's extensive collection of 400+ AI models through Claude, with intelligent fallback to Google Gemini direct API for optimal performance.

[中文说明](README_cn.md)

## Features

- 🤖 Access to 400+ language models including GPT-4, Claude, Gemini, Llama, and more
- 🔍 List and search available models with pricing information
- 💬 Chat with any model through a unified interface
- 🔄 Compare responses from multiple models side-by-side
- 🎨 **Smart image generation and editing** with automatic fallback (Gemini Direct → OpenRouter)
- 🚀 **Faster response times** with Gemini direct API integration
- 🌐 **Proxy support** for users in China and other regions
- 📊 Get detailed model information including context limits and capabilities
- 🔧 Seamless integration with Claude Desktop and Claude Code

## Installation

```bash
# Clone the repository
git clone https://github.com/th3nolo/openrouter-mcp.git
cd openrouter-mcp

# Install dependencies
npm install
# or
yarn install

# Build the TypeScript code
npm run build
# or
yarn build
```

## Configuration

1. **Get your API keys:**
   - OpenRouter API key from [OpenRouter](https://openrouter.ai/keys)
   - (Optional but recommended) Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your API keys:
   ```env
   # Required: OpenRouter API key (fallback)
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   
   # Optional but recommended: Gemini API key (primary for image tasks)
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Optional: Proxy settings (useful for users in China)
   HTTP_PROXY=http://127.0.0.1:7890
   HTTPS_PROXY=http://127.0.0.1:7890
   ```

### Configuration Options

- **Best Experience**: Configure both API keys for optimal performance and reliability
- **Speed Priority**: Configure only `GEMINI_API_KEY` for fastest image generation/editing
- **Compatibility**: Configure only `OPENROUTER_API_KEY` for traditional OpenRouter-only mode

## Usage

### Available MCP Tools

- **`list_models`** - Get a list of all available models with pricing
- **`chat_with_model`** - Send a message to a specific model
  - Parameters: `model`, `message`, `max_tokens`, `temperature`, `system_prompt`
- **`compare_models`** - Compare responses from multiple models
  - Parameters: `models[]`, `message`, `max_tokens`
- **`generate_image`** - 🚀 **Smart image generation** with automatic fallback (Gemini Direct → OpenRouter)
  - Parameters: `prompt` (required), `model` (optional, for OpenRouter fallback), `max_tokens`, `temperature`, `save_directory`
  - **Behavior**: Tries Gemini direct API first, falls back to OpenRouter if needed
- **`edit_image`** - 🚀 **Smart image editing/analysis** with automatic fallback (Gemini Direct → OpenRouter)
  - Parameters: `instruction`, `images[]` (required), `model` (optional, for OpenRouter fallback), `max_tokens`, `temperature`, `save_directory`
  - **Behavior**: Tries Gemini direct API first (single image), falls back to OpenRouter (supports multiple images)
- **`get_model_info`** - Get detailed information about a specific model
  - Parameters: `model`

### Available MCP Resources

- **`openrouter://models`** - List of all available models with pricing
- **`openrouter://pricing`** - Current pricing information for all models
- **`openrouter://usage`** - Your OpenRouter usage statistics

### Claude Code Integration

Add the server to Claude Code:

```bash
claude mcp add openrouter -s user \
  -e OPENROUTER_API_KEY=your_openrouter_api_key_here \
  -e GEMINI_API_KEY=your_gemini_api_key_here \
  -e HTTP_PROXY=http://127.0.0.1:7890 \
  -- node /path/to/openrouter-mcp/dist/server.js
```

Or add it manually to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "openrouter": {
      "command": "node",
      "args": ["/path/to/openrouter-mcp/dist/server.js"],
      "env": {
        "OPENROUTER_API_KEY": "your_openrouter_api_key_here",
        "GEMINI_API_KEY": "your_gemini_api_key_here",
        "HTTP_PROXY": "http://127.0.0.1:7890",
        "HTTPS_PROXY": "http://127.0.0.1:7890"
      }
    }
  }
}
```

## Example Usage

Once configured, you can use these commands in Claude:

```
"List all available Gemma models"
"Chat with gpt-4 and ask it to explain quantum computing"
"Compare responses from claude-3-opus and gpt-4 about climate change"
"Generate an image of a sunset over mountains" (automatically uses Gemini Direct → OpenRouter fallback)
"Edit this image to make it brighter and add more clouds" (automatically uses Gemini Direct → OpenRouter fallback)
"Get detailed information about google/gemini-pro"
```

### Smart Fallback in Action

The system automatically chooses the best API:

- **With GEMINI_API_KEY**: `generate_image` and `edit_image` try Gemini direct API first ⚡
- **Fallback**: If Gemini fails, automatically switches to OpenRouter 🛡️
- **Status feedback**: Clear indicators show which API was used
  - `✅ Gemini Direct` - Fast direct API
  - `🔄 OpenRouter (fallback)` - Reliable fallback

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run typecheck
```

## Environment Variables

### Core API Keys
- `OPENROUTER_API_KEY` - Your OpenRouter API key (required for fallback)
- `GEMINI_API_KEY` - Your Gemini API key (optional but recommended for faster image operations)

### OpenRouter Configuration
- `OPENROUTER_BASE_URL` - API base URL (default: https://openrouter.ai/api/v1)
- `OPENROUTER_SITE_URL` - Your site URL for API attribution
- `OPENROUTER_APP_NAME` - Application name for API headers

### Proxy Configuration (Optional)
- `HTTP_PROXY` - HTTP proxy URL (e.g., http://127.0.0.1:7890)
- `HTTPS_PROXY` - HTTPS proxy URL (e.g., http://127.0.0.1:7890)

### Configuration Strategies

| Strategy | OPENROUTER_API_KEY | GEMINI_API_KEY | Result |
|----------|-------------------|----------------|---------|
| **Best Experience** | ✅ | ✅ | Fast Gemini + Reliable fallback |
| **Speed Priority** | ❌ | ✅ | Fast Gemini only |
| **Compatibility** | ✅ | ❌ | OpenRouter only (traditional mode) |

## Security

- API keys are stored in environment variables only
- The `.env` file is excluded from version control
- Never commit your API keys to the repository

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.