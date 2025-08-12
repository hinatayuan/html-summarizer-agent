# HTML Summarizer Agent

基于最新Mastra框架构建的AI Agent，专门用于抓取网页内容、提取主要文本并生成智能摘要。部署在Cloudflare Workers上，提供高性能的边缘计算服务。

## 功能特性

- 🚀 **智能内容提取**: 使用Cloudflare HTMLRewriter进行高效HTML解析
- 🤖 **AI驱动摘要**: 集成DeepSeek AI模型生成高质量摘要
- ⚡ **边缘计算**: 部署在Cloudflare Workers，全球低延迟访问
- 🛠️ **工具链集成**: 内置网页抓取和内容分析工具
- 📊 **结构化输出**: 返回摘要、要点、关键词和重要片段

## 技术架构

- **框架**: Mastra v0.13.1+ AI Agent Framework
- **AI模型**: DeepSeek Chat API
- **部署平台**: Cloudflare Workers
- **内容提取**: HTMLRewriter + 简单HTML解析器 (回退)
- **语言**: TypeScript

## 快速开始

### 环境要求
- Node.js >= 20.9.0
- npm 或 yarn

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入相应的API密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
DEEPSEEK_API_KEY=sk-1edd0944d3d24a76b3ded1aa0298e20f
CLOUDFLARE_ACCOUNT_ID=4f626c727482ce1b73d26bb9f9244d79
CLOUDFLARE_API_TOKEN=nludYXBjgyYP4lQvfMiqb061Hk6juU9rwmWjs56q
```

### 3. 本地开发

```bash
npm run dev
```

这将启动Mastra开发服务器，通常在 `http://localhost:3000`

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

const result = await client.agents.summarizer.generate({
  url: 'https://example.com/article'
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

## 项目结构

```
src/
├── agents/          # AI Agent定义
│   └── summarizer.ts
├── tools/           # 工具实现
│   └── fetchAndExtract.ts
└── index.ts         # 主入口文件
mastra.config.ts     # Mastra配置
package.json
tsconfig.json
```

## 部署配置

项目已配置自动部署到Cloudflare Workers:

- **Account ID**: `4f626c727482ce1b73d26bb9f9244d79`
- **项目名**: `html-summarizer-agent`
- **访问域名**: `https://html-summarizer-agent.workers.dev`

## 更新说明

### v1.1.0 (最新)
- ✅ 更新到最新Mastra v0.13.1+ API
- ✅ 使用新的Tool和Agent类
- ✅ 集成zod用于类型验证
- ✅ 添加输入输出schema定义
- ✅ 优化DeepSeek LLM配置
- ✅ 修复依赖问题，确保 `npm run dev` 可正常启动

### 主要变更
- 使用新的 `Tool` 和 `Agent` 类替代旧的 `createTool` 和 `createAgent`
- 更新依赖到最新版本
- 添加输入输出schema验证
- 优化错误处理和类型安全

## 故障排除

### 如果遇到依赖问题
```bash
# 清理缓存
rm -rf node_modules package-lock.json
npm install
```

### 如果遇到TypeScript错误
确保使用Node.js 20.9.0或更高版本：
```bash
node --version
```

### 如果无法启动开发服务器
检查环境变量是否正确配置：
```bash
cat .env
```

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过GitHub Issues联系：
https://github.com/hinatayuan/html-summarizer-agent/issues
