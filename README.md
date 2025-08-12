# HTML Summarizer Agent

基于Mastra框架构建的AI Agent，专门用于抓取网页内容、提取主要文本并生成智能摘要。

## 功能特性

- 🚀 **智能内容提取**: 自动抓取网页并提取主要文本内容
- 🤖 **DeepSeek AI驱动**: 集成DeepSeek Chat模型生成高质量摘要
- ⚡ **边缘计算**: 可部署在Cloudflare Workers，全球低延迟访问
- 🛠️ **工具链集成**: 内置网页抓取和内容分析工具
- 📊 **结构化输出**: 返回摘要、要点、关键词和重要片段

## 技术架构

- **框架**: Mastra v0.13.1+ AI Agent Framework
- **AI模型**: DeepSeek Chat API（通过@ai-sdk/openai兼容接口）
- **API端点**: https://api.deepseek.com/v1
- **部署平台**: Cloudflare Workers（可选）
- **内容提取**: 简单HTML解析器
- **语言**: TypeScript

## 项目结构

```
html-summarizer-agent/
├── src/
│   └── mastra/                 # Mastra项目主目录
│       ├── index.ts            # Mastra入口文件
│       ├── agents/             # AI代理定义
│       │   └── summarizer.ts   # 智能摘要代理（DeepSeek配置）
│       └── tools/              # 工具定义
│           └── fetchAndExtract.ts # 网页内容提取工具
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## 快速开始

### 环境要求
- Node.js >= 20.9.0
- npm 或 yarn
- DeepSeek API密钥

### 1. 克隆项目

```bash
git clone https://github.com/hinatayuan/html-summarizer-agent.git
cd html-summarizer-agent
```

### 2. 安装依赖

```bash
npm install
# 或者
yarn install
```

### 3. 配置DeepSeek API

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置您的DeepSeek API密钥：
```env
# DeepSeek AI配置
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here

# 项目配置
NODE_ENV=development
```

**重要**: 确保您有有效的DeepSeek API密钥。访问 [DeepSeek官网](https://platform.deepseek.com) 获取API密钥。

### 4. 启动开发服务器

```bash
npm run dev
# 或者
yarn dev
```

服务器将在 `http://localhost:3000` 启动

## DeepSeek集成说明

### API配置

项目使用DeepSeek的OpenAI兼容接口：

```typescript
const deepseek = openai({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// 使用DeepSeek Chat模型
model: deepseek('deepseek-chat')
```

### 支持的模型

- **deepseek-chat**: 对话模型，适合摘要和分析任务
- **deepseek-coder**: 代码模型（可选）

### API费用

DeepSeek提供性价比极高的API服务：
- 输入：¥0.14/百万tokens
- 输出：¥0.28/百万tokens

## API 使用

### 通过Mastra Web界面

启动开发服务器后，访问 `http://localhost:3000` 使用Web界面测试Agent。

### 通过API调用

```javascript
// 使用Mastra Client
import { MastraClient } from '@mastra/client-js';

const client = new MastraClient({
  baseUrl: 'http://localhost:3000' // 开发环境
});

// 调用摘要Agent
const result = await client.agents.summarizerAgent.generate({
  messages: [
    {
      role: 'user',
      content: '请分析这个网页：https://example.com/article'
    }
  ]
});

console.log(result);
```

### 返回数据格式

DeepSeek AI将返回结构化的JSON格式：

```json
{
  "title": "文章标题",
  "summary": "核心摘要内容",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "keywords": ["关键词1", "关键词2"],
  "highlights": [
    {
      "text": "重要片段文本",
      "importance": "high",
      "category": "主要观点"
    }
  ],
  "readingTime": "5分钟"
}
```

## 开发说明

### DeepSeek配置优化

1. **正确的OpenAI兼容设置**:
   ```typescript
   const deepseek = openai({
     baseURL: 'https://api.deepseek.com/v1',
     apiKey: process.env.DEEPSEEK_API_KEY,
   });
   ```

2. **模型调用**:
   ```typescript
   model: deepseek('deepseek-chat')
   ```

3. **中文优化**: Agent指令专门针对中文回复进行了优化

### 与官方模板的关键差异

- ✅ **DeepSeek集成**: 通过@ai-sdk/openai兼容接口使用DeepSeek
- ✅ **中文优化**: 针对中文内容分析和摘要优化
- ✅ **成本效益**: 使用DeepSeek降低API调用成本

## 故障排除

### DeepSeek相关问题

1. **API密钥错误**
   ```bash
   # 检查API密钥是否正确
   cat .env | grep DEEPSEEK_API_KEY
   ```

2. **网络连接问题**
   ```bash
   # 测试DeepSeek API连接
   curl -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
        https://api.deepseek.com/v1/models
   ```

3. **模型调用失败**
   - 确保API密钥有效且有足够余额
   - 检查网络是否能访问DeepSeek API

### 常见问题

1. **依赖问题**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **环境变量问题**
   ```bash
   cat .env  # 检查环境变量
   ```

## 更新日志

### v1.5.0 (最新)
- ✅ **优化DeepSeek配置**: 使用正确的OpenAI兼容接口设置
- ✅ **API密钥管理**: 改进环境变量配置和文档
- ✅ **中文优化**: 专门针对中文内容分析优化Agent指令
- ✅ **成本说明**: 添加DeepSeek API费用说明

### v1.4.0
- ✅ 完全重构：严格按照官方my-mastra-app模板重写
- ✅ 修复导入路径：使用正确的@mastra/core子模块

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过GitHub Issues联系：
https://github.com/hinatayuan/html-summarizer-agent/issues

---

🎉 **现在可以完美使用DeepSeek运行 `yarn dev`！** 

专为DeepSeek API优化，提供高性价比的AI摘要服务。
