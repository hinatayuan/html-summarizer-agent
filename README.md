# HTML Summarizer Agent

基于Mastra框架构建的AI Agent，专门用于抓取网页内容、提取主要文本并生成智能摘要。部署在Cloudflare Workers上，提供高性能的边缘计算服务。

## 功能特性

- 🚀 **智能内容提取**: 使用Cloudflare HTMLRewriter进行高效HTML解析
- 🤖 **AI驱动摘要**: 集成DeepSeek AI模型生成高质量摘要
- ⚡ **边缘计算**: 部署在Cloudflare Workers，全球低延迟访问
- 🛠️ **工具链集成**: 内置网页抓取和内容分析工具
- 📊 **结构化输出**: 返回摘要、要点、关键词和重要片段

## 技术架构

- **框架**: Mastra AI Agent Framework
- **AI模型**: DeepSeek Chat API
- **部署平台**: Cloudflare Workers
- **内容提取**: HTMLRewriter + Mozilla Readability (回退)
- **语言**: TypeScript

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入相应的API密钥：

```bash
cp .env.example .env
```

### 3. 本地开发

```bash
npm run dev
```

### 4. 构建项目

```bash
npm run build
```

### 5. 部署到Cloudflare Workers

```bash
npm run deploy
```

## API 使用

### 调用智能摘要Agent

```javascript
// 使用Mastra Client
import { MastraClient } from '@mastra/client-js';

const client = new MastraClient({
  baseUrl: 'https://html-summarizer-agent.workers.dev'
});

const result = await client.getAgent('summarizer').generate({
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

## 许可证

MIT License
