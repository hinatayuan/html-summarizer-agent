# HTML Summarizer Agent

基于Mastra框架构建的AI Agent，专门用于抓取网页内容、提取主要文本并生成智能摘要。支持部署到Cloudflare Workers。

## 功能特性

- 🚀 **智能内容提取**: 自动抓取网页并提取主要文本内容
- 🤖 **DeepSeek AI驱动**: 集成DeepSeek Chat模型生成高质量摘要
- ☁️ **Cloudflare Workers**: 支持部署到Cloudflare边缘网络
- 🛠️ **工具链集成**: 内置网页抓取和内容分析工具
- 📊 **结构化输出**: 返回摘要、要点、关键词和重要片段

## 快速开始

### 环境要求
- Node.js >= 20.9.0
- npm 或 yarn
- DeepSeek API密钥
- Cloudflare账号（用于部署）

### 1. 克隆并安装

```bash
git clone https://github.com/hinatayuan/html-summarizer-agent.git
cd html-summarizer-agent
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
```

### 3. 本地开发

```bash
npm run dev
```

## 部署到Cloudflare Workers

### 方法一：使用Mastra构建 + Wrangler部署

```bash
# 1. 构建项目
npm run build

# 2. 部署到Cloudflare
npm run deploy
```

### 方法二：直接使用Wrangler部署

```bash
# 安装Wrangler CLI（如果还没有）
npm install -g wrangler

# 登录Cloudflare
wrangler auth login

# 部署
npm run deploy:cloudflare
```

### 部署配置

项目包含 `wrangler.toml` 配置文件：

```toml
name = "html-summarizer-agent"
main = ".mastra/output/index.js"
compatibility_date = "2024-08-01"

[vars]
DEEPSEEK_API_KEY = "your-deepseek-api-key"
```

### 获取Cloudflare配置信息

1. **Account ID**: 在Cloudflare Dashboard右侧可见
2. **API Token**: 在 `My Profile > API Tokens` 创建，需要权限：
   - Zone:Zone:Read
   - Zone:Zone Settings:Edit  
   - Account:Cloudflare Workers:Edit

## 故障排除

### 构建失败

1. **检查Node.js版本**
   ```bash
   node --version  # 需要 >= 20.9.0
   ```

2. **清理依赖重新安装**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **检查TypeScript编译**
   ```bash
   npx tsc --noEmit
   ```

### Cloudflare部署问题

1. **检查wrangler配置**
   ```bash
   wrangler whoami
   ```

2. **验证构建输出**
   ```bash
   ls -la .mastra/output/
   ```

3. **手动部署测试**
   ```bash
   wrangler deploy --dry-run
   ```

### DeepSeek API问题

1. **测试API连接**
   ```bash
   curl -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
        https://api.deepseek.com/v1/models
   ```

## API 使用

### 本地开发

```javascript
import { MastraClient } from '@mastra/client-js';

const client = new MastraClient({
  baseUrl: 'http://localhost:3000'
});

const result = await client.agents.summarizerAgent.generate({
  messages: [
    { role: 'user', content: '请分析这个网页：https://example.com/article' }
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

## 项目结构

```
html-summarizer-agent/
├── src/
│   └── mastra/                 # Mastra项目目录
│       ├── index.ts            # 主入口文件
│       ├── agents/             # AI代理
│       │   └── summarizer.ts   # DeepSeek摘要代理
│       └── tools/              # 工具
│           └── fetchAndExtract.ts # 内容提取工具
├── wrangler.toml               # Cloudflare部署配置
├── package.json
├── .env.example
└── README.md
```

## 技术架构

- **框架**: Mastra v0.13.1+ AI Agent Framework
- **AI模型**: DeepSeek Chat API
- **部署**: Cloudflare Workers + Wrangler CLI
- **内容提取**: HTML解析器
- **语言**: TypeScript

## 更新日志

### v1.7.0 (最新)
- ✅ **修复构建问题**: 移除有问题的部署器依赖
- ✅ **Wrangler集成**: 使用传统稳定的Wrangler部署方式
- ✅ **部署配置**: 添加完整的wrangler.toml配置
- ✅ **故障排除**: 完善的错误诊断指南

### v1.6.0
- ✅ Cloudflare部署支持：添加完整的Cloudflare Workers部署配置
- ✅ 项目结构优化：删除所有冗余文件

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过GitHub Issues联系：
https://github.com/hinatayuan/html-summarizer-agent/issues

---

🎉 **现在可以稳定构建和部署了！** 

先运行 `npm run build` 测试构建，然后使用 `npm run deploy` 部署到Cloudflare。
