# OpenRouter MCP 服务器

一个模型上下文协议 (MCP) 服务器，通过 Claude 提供对 OpenRouter 400 多种 AI 模型的访问，并集成 Google Gemini 直连 API 智能回退机制以获得最佳性能。

## 功能

- 🤖 访问 400 多种语言模型，包括 GPT-4、Claude、Gemini、Llama 等
- 🔍 列出和搜索可用模型及其定价信息
- 💬 通过统一接口与任何模型聊天
- 🔄 并排比较多个模型的响应
- 🎨 **智能图像生成和编辑** 自动回退机制 (Gemini 直连 → OpenRouter)
- 🚀 **更快的响应速度** 通过 Gemini 直连 API 集成
- 🌐 **代理支持** 适合中国大陆及其他地区用户
- 📊 获取模型的详细信息，包括上下文限制和功能
- 🔧 与 Claude Desktop 和 Claude Code 无缝集成

## 安装

```bash
# 克隆仓库
git clone https://github.com/th3nolo/openrouter-mcp.git
cd openrouter-mcp

# 安装依赖
npm install
# 或
yarn install

# 构建 TypeScript 代码
npm run build
# 或
yarn build
```

## 配置

1. **获取您的 API 密钥:**
   - 从 [OpenRouter](https://openrouter.ai/keys) 获取 OpenRouter API 密钥
   - (可选但推荐) 从 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取 Gemini API 密钥

2. 复制 `.env.example` 到 `.env`:
   ```bash
   cp .env.example .env
   ```

3. 编辑 `.env` 并添加您的 API 密钥:
   ```env
   # 必需: OpenRouter API 密钥 (回退选项)
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   
   # 可选但推荐: Gemini API 密钥 (图像任务的首选)
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # 可选: 代理设置 (适合中国大陆用户)
   HTTP_PROXY=http://127.0.0.1:7890
   HTTPS_PROXY=http://127.0.0.1:7890
   ```

### 配置选项

- **最佳体验**: 配置两个 API 密钥以获得最佳性能和可靠性
- **速度优先**: 仅配置 `GEMINI_API_KEY` 以获得最快的图像生成/编辑速度
- **兼容模式**: 仅配置 `OPENROUTER_API_KEY` 使用传统的 OpenRouter 模式

## 使用方法

### 可用的 MCP 工具

- **`list_models`** - 获取所有可用模型的列表及其定价
- **`chat_with_model`** - 向特定模型发送消息
  - 参数: `model`, `message`, `max_tokens`, `temperature`, `system_prompt`
- **`compare_models`** - 比较多个模型的响应
  - 参数: `models[]`, `message`, `max_tokens`
- **`generate_image`** - 使用 OpenRouter 图像模型生成图像
  - 参数: `prompt` (必需), `model` (可选, 默认为 google/gemini-2.5-flash-image-preview:free), `max_tokens`, `temperature`, `save_directory`
- **`edit_image`** - 使用 OpenRouter 图像模型编辑图像 (支持多张图像)
  - 参数: `instruction`, `images[]` (必需), `model` (可选, 默认为 google/gemini-2.5-flash-image-preview:free), `max_tokens`, `temperature`, `save_directory`
- **`get_model_info`** - 获取特定模型的详细信息
  - 参数: `model`
- **`gemini_direct_edit`** - 直接使用 Google Gemini API 编辑图像 (绕过 OpenRouter)
  - 参数: `text_prompt`, `image_path`, `output_path` (可选, 默认为 "gemini-edited-image.png"), `api_key` (可选), `proxy_url` (可选)
- **`gemini_native_generate`** - 直接使用 Google Gemini API 生成图像 (绕过 OpenRouter)
  - 参数: `text_prompt`, `output_path` (可选, 默认为 "gemini-native-image.png"), `api_key` (可选), `proxy_url` (可选)

### 可用的 MCP 资源

- **`openrouter://models`** - 所有可用模型及其定价的列表
- **`openrouter://pricing`** - 所有模型的当前定价信息
- **`openrouter://usage`** - 您的 OpenRouter 使用统计信息

### Claude Code 集成

将服务器添加到 Claude Code:

```bash
claude mcp add openrouter -s user \
  -e OPENROUTER_API_KEY=your_openrouter_api_key_here \
  -- node /path/to/openrouter-mcp/dist/server.js
```

或者手动添加到您的 Claude Desktop 配置中:

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

## 使用示例

配置完成后，您可以在 Claude 中使用这些命令:

```
"列出所有可用的 Gemma 模型"
"与 gpt-4 聊天，让它解释量子计算"
"比较 claude-3-opus 和 gpt-4 对气候变化的响应"
"使用 google/gemini-2.5-flash-image-preview:free 生成山脉上的日落图像"
"编辑此图像，使其更亮并添加更多云彩"
"获取 google/gemini-pro 的详细信息"
"使用 gemini_direct_edit 编辑这只猫的图像，给它戴上帽子"
"使用 gemini_native_generate 生成一张以 Gemini 为主题的纳米香蕉菜肴在高级餐厅中的图像"
```

## 开发

```bash
# 以开发模式运行
npm run dev

# 运行测试
npm test

# 代码检查
npm run lint

# 类型检查
npm run typecheck
```

## 环境变量

- `OPENROUTER_API_KEY` - 您的 OpenRouter API 密钥 (必需)
- `OPENROUTER_BASE_URL` - API 基础 URL (默认: https://openrouter.ai/api/v1)
- `OPENROUTER_SITE_URL` - 您的站点 URL，用于 API 归属
- `OPENROUTER_APP_NAME` - 用于 API 头部的应用程序名称

## 安全

- API 密钥仅存储在环境变量中
- `.env` 文件已从版本控制中排除
- 永远不要将您的 API 密钥提交到仓库中

## 许可证

MIT

## 贡献

欢迎贡献！请随时提交 Pull Request。