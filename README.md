# OpenRouter MCP Server

A Model Context Protocol (MCP) server that provides access to OpenRouter's extensive collection of 400+ AI models through Claude.

[中文说明](README_cn.md)

## Features

- 🤖 Access to 400+ language models including GPT-4, Claude, Gemini, Llama, and more
- 🔍 List and search available models with pricing information
- 💬 Chat with any model through a unified interface
- 🔄 Compare responses from multiple models side-by-side
- 🎨 Generate and edit images using OpenRouter's image models
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

1. Get your OpenRouter API key from [OpenRouter](https://openrouter.ai/keys)
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and add your API key:
   ```env
   OPENROUTER_API_KEY=your_api_key_here
   ```

## Usage

### Available MCP Tools

- **`list_models`** - Get a list of all available models with pricing
- **`chat_with_model`** - Send a message to a specific model
  - Parameters: `model`, `message`, `max_tokens`, `temperature`, `system_prompt`
- **`compare_models`** - Compare responses from multiple models
  - Parameters: `models[]`, `message`, `max_tokens`
- **`generate_image`** - Generate images using OpenRouter image models
  - Parameters: `prompt` (required), `model` (optional, defaults to google/gemini-2.5-flash-image-preview:free), `max_tokens`, `temperature`, `save_directory`
- **`edit_image`** - Edit images using OpenRouter image models (supports multiple images)
  - Parameters: `instruction`, `images[]` (required), `model` (optional, defaults to google/gemini-2.5-flash-image-preview:free), `max_tokens`, `temperature`, `save_directory`
- **`get_model_info`** - Get detailed information about a specific model
  - Parameters: `model`
- **`gemini_direct_edit`** - Directly edit images using Google Gemini API (bypasses OpenRouter)
  - Parameters: `text_prompt`, `image_path`, `output_path` (optional, defaults to "gemini-edited-image.png"), `api_key` (optional), `proxy_url` (optional)
- **`gemini_native_generate`** - Generate images directly using Google Gemini API (bypasses OpenRouter)
  - Parameters: `text_prompt`, `output_path` (optional, defaults to "gemini-native-image.png"), `api_key` (optional), `proxy_url` (optional)

### Available MCP Resources

- **`openrouter://models`** - List of all available models with pricing
- **`openrouter://pricing`** - Current pricing information for all models
- **`openrouter://usage`** - Your OpenRouter usage statistics

### Claude Code Integration

Add the server to Claude Code:

```bash
claude mcp add openrouter -s user \
  -e OPENROUTER_API_KEY=your_openrouter_api_key_here \
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
        "OPENROUTER_API_KEY": "your_api_key_here"
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
"Generate an image of a sunset over mountains using google/gemini-2.5-flash-image-preview:free"
"Edit this image to make it brighter and add more clouds"
"Get detailed information about google/gemini-pro"
"Edit this image of a cat to make it wear a hat using gemini_direct_edit"
"Generate an image of a nano banana dish in a fancy restaurant with a Gemini theme using gemini_native_generate"
```

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

- `OPENROUTER_API_KEY` - Your OpenRouter API key (required)
- `OPENROUTER_BASE_URL` - API base URL (default: https://openrouter.ai/api/v1)
- `OPENROUTER_SITE_URL` - Your site URL for API attribution
- `OPENROUTER_APP_NAME` - Application name for API headers

## Security

- API keys are stored in environment variables only
- The `.env` file is excluded from version control
- Never commit your API keys to the repository

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.