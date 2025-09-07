# 智能回退机制

本文档说明 OpenRouter MCP Server 中图像生成和编辑工具的智能回退机制。

## 🎯 设计目标

由于 OpenRouter 免费模型有时效限制，我们实现了智能回退机制：
1. **优先使用** Google Gemini 直连 API（更快、更稳定）
2. **自动回退** 到 OpenRouter（如果 Gemini 失败）

## 🔧 受影响的工具

### `generate_image` - 图像生成
- **第一选择**：Gemini 2.5 Flash 直连 API
- **回退选择**：OpenRouter 指定模型

### `edit_image` - 图像编辑/分析
- **第一选择**：Gemini 2.5 Flash 直连 API（仅处理第一张图片）
- **回退选择**：OpenRouter 指定模型（支持多图片）

## 🚀 工作流程

### 图像生成流程
```
用户调用 generate_image
    ↓
检查 GEMINI_API_KEY 是否存在
    ↓
存在 → 尝试 Gemini 直连 API
    ↓
成功 → 返回结果 ✅ (标记: "Gemini Direct")
    ↓
失败 → 回退到 OpenRouter
    ↓
成功 → 返回结果 (标记: "OpenRouter (fallback)")
    ↓
失败 → 抛出错误
```

### 图像编辑流程
```
用户调用 edit_image
    ↓
检查 GEMINI_API_KEY 和图片数量
    ↓
条件满足 → 下载第一张图片到临时文件
    ↓
尝试 Gemini 直连 API
    ↓
成功 → 清理临时文件 → 返回结果 ✅
    ↓
失败 → 清理临时文件 → 回退到 OpenRouter
    ↓
成功 → 返回结果 (标记: "OpenRouter (fallback)")
    ↓
失败 → 抛出错误
```

## 📊 响应标识

### Gemini 直连成功
```
**API:** Gemini Direct ✅
**Model:** gemini-2.5-flash-image-preview
**Proxy:** http://127.0.0.1:7890 (如果使用代理)
```

### OpenRouter 回退
```
**API:** OpenRouter (fallback)
**Model:** google/gemini-2.5-flash-image-preview:free
**Usage:** 详细的 token 使用信息
```

## 🔧 配置要求

### 环境变量
```bash
# Gemini 直连（优先）
GEMINI_API_KEY=your_gemini_api_key

# OpenRouter 回退
OPENROUTER_API_KEY=your_openrouter_api_key

# 代理支持（可选）
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

### Claude 配置示例
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

## 💡 使用建议

### 最佳实践
1. **同时配置两个 API 密钥**以获得最佳体验
2. **仅配置 GEMINI_API_KEY** 可获得最快速度（无回退）
3. **仅配置 OPENROUTER_API_KEY** 将直接使用 OpenRouter

### 性能优化
- **Gemini 直连**：通常更快，支持代理
- **OpenRouter 回退**：模型选择更多，但可能有时效限制

### 错误处理
- 系统会自动处理 API 失败并尝试回退
- 临时文件会自动清理
- 详细的错误日志帮助调试

## 🔍 故障排除

### 常见问题

**Q: 为什么总是使用 OpenRouter？**
A: 检查 `GEMINI_API_KEY` 环境变量是否正确设置

**Q: Gemini 直连失败怎么办？**
A: 系统会自动回退到 OpenRouter，无需手动干预

**Q: 如何确认使用了哪个 API？**
A: 查看响应中的 `**API:**` 标识

**Q: 代理设置不生效？**
A: 代理仅对 Gemini 直连生效，OpenRouter 不支持代理

## 🎉 优势总结

- ✅ **更快的响应速度**（Gemini 直连）
- ✅ **避免免费模型时效限制**
- ✅ **自动故障转移**
- ✅ **代理支持**（适合中国大陆用户）
- ✅ **向后兼容**（现有工具调用方式不变）
- ✅ **清晰的状态反馈**