# HTML Summarizer Agent

基于Mastra框架构建的AI Agent，专门用于抓取网页内容、提取主要文本并生成智能摘要。支持部署到Cloudflare Workers。

## 功能特性

- 🚀 **智能内容提取**: 自动抓取网页并提取主要文本内容
- 🤖 **DeepSeek AI驱动**: 集成DeepSeek Chat模型生成高质量摘要
- ☁️ **Cloudflare Workers**: 支持一键部署到Cloudflare边缘网络
- 🛠️ **工具链集成**: 内置网页抓取和内容分析工具
- 📊 **结构化输出**: 返回摘要、要点、关键词和重要片段

## 技术架构

- **框架**: Mastra v0.13.1+ AI Agent Framework
- **AI模型**: DeepSeek Chat API（通过@ai-sdk/openai兼容接口）
- **部署平台**: Cloudflare Workers
- **部署工具**: @mastra/deployer-cloudflare
- **内容提取**: 简单HTML解析器
- **语言**: TypeScript

## 项目结构（已优化）

```
html-summarizer-agent/
├── src/
│   └── mastra/                 # 唯一的Mastra目录
│       ├── index.ts            # 主入口文件
│       ├── deployer.ts         # Cloudflare部署配置
│       ├── agents/             # AI代理
│       │   └── summarizer.ts   # 智能摘要代理（DeepSeek配置）
│       └── tools/              # 工具
│           └── fetchAndExtract.ts # 网页内容提取工具
├── package.json                # 包含Cloudflare部署依赖
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

**清理说明**: 已删除所有冗余文件（`mastra.config.ts`、`src/index.ts`、重复的agents和tools目录），完全符合官方模板规范。

## 快速开始

### 环境要求
- Node.js >= 20.9.0
- npm 或 yarn
- DeepSeek API密钥
- Cloudflare账号（用于部署）

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

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# DeepSeek AI配置
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here

# Cloudflare配置（用于部署）
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token

# 项目配置
NODE_ENV=development
```

### 4. 本地开发

```bash
npm run dev
# 或者
yarn dev
```

服务器将在 `http://localhost:3000` 启动

## Cloudflare部署

### 一键部署

```bash
# 构建并部署到Cloudflare Workers
npm run deploy
# 或者
yarn deploy
```

### 部署配置

项目已配置Cloudflare部署器（`src/mastra/deployer.ts`）：

```typescript
export const deployer = cloudflareDeployer({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  name: 'html-summarizer-agent',
  compatibility: {
    date: '2024-08-01',
    flags: []
  },
  env: {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY
  }
});
```

### 获取Cloudflare配置

1. **Account ID**: 登录Cloudflare Dashboard，在右侧可以看到Account ID
2. **API Token**: 在 `My Profile > API Tokens` 中创建自定义令牌，需要以下权限：
   - Zone:Zone:Read
   - Zone:Zone Settings:Edit
   - Account:Cloudflare Workers:Edit

### 部署后访问

部署成功后，您的Agent将可以通过以下地址访问：
```
https://html-summarizer-agent.your-subdomain.workers.dev
```

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

### 本地开发

```javascript
import { MastraClient } from '@mastra/client-js';

const client = new MastraClient({
  baseUrl: 'http://localhost:3000'
});

const result = await client.agents.summarizerAgent.generate({
  messages: [
    {
      role: 'user',
      content: '请分析这个网页：https://example.com/article'
    }
  ]
});
```

### 生产环境

```javascript
const client = new MastraClient({
  baseUrl: 'https://html-summarizer-agent.your-subdomain.workers.dev'
});
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

## 开发说明

### 项目结构优化

✅ **已清理的冗余文件**:
- 删除了根目录 `mastra.config.ts`（官方模板不需要）
- 删除了 `src/index.ts`（与 `src/mastra/index.ts` 重复）
- 删除了 `src/agents/` 和 `src/tools/`（与mastra目录下的重复）

✅ **Cloudflare部署支持**:
- 添加了 `@mastra/deployer-cloudflare` 依赖
- 创建了 `src/mastra/deployer.ts` 配置文件
- 更新了部署脚本

### 部署流程

1. `npm run build` - 构建项目
2. `npm run deploy` - 部署到Cloudflare Workers
3. 自动配置环境变量和域名

## 故障排除

### Cloudflare部署问题

1. **API Token权限不足**
   ```bash
   # 确保API Token有正确的权限
   curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
        -H "Authorization: Bearer YOUR_API_TOKEN"
   ```

2. **Account ID错误**
   - 检查Cloudflare Dashboard右侧的Account ID

3. **环境变量未设置**
   ```bash
   # 检查环境变量
   cat .env | grep CLOUDFLARE
   ```

### DeepSeek相关问题

1. **API密钥错误**
   ```bash
   cat .env | grep DEEPSEEK_API_KEY
   ```

2. **网络连接测试**
   ```bash
   curl -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
        https://api.deepseek.com/v1/models
   ```

## 更新日志

### v1.6.0 (最新)
- ✅ **Cloudflare部署支持**: 添加完整的Cloudflare Workers部署配置
- ✅ **项目结构优化**: 删除所有冗余文件，符合官方模板规范
- ✅ **一键部署**: 支持 `npm run deploy` 一键部署
- ✅ **环境变量管理**: 优化生产环境配置

### v1.5.0
- ✅ 优化DeepSeek配置：使用正确的OpenAI兼容接口设置
- ✅ API密钥管理：改进环境变量配置和文档

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过GitHub Issues联系：
https://github.com/hinatayuan/html-summarizer-agent/issues

---

🎉 **现在支持完整的Cloudflare Workers部署！** 

使用 `npm run deploy` 即可一键部署到全球边缘网络。
