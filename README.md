# Enhanced HTML Summarizer Agent

🤖 **功能强大的多模态AI Agent** - 基于Mastra框架构建，支持网页、PDF、RSS等多种内容源的智能分析和摘要生成。

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/hinatayuan/html-summarizer-agent)

## ✨ 核心功能

### 📄 多格式内容支持
- 🌐 **HTML网页解析**: 智能提取网页标题、正文和高亮内容
- 📄 **PDF文档处理**: 支持PDF文档的文本提取和元数据获取
- 📡 **RSS订阅管理**: 解析RSS/Atom源，批量处理订阅内容
- 🔍 **智能内容识别**: 自动识别文章结构、重要段落和关键信息

### 🌍 多语言处理
- 🔤 **自动语言检测**: 智能识别内容语言
- 🌐 **多语言翻译**: 支持20+主流语言的AI翻译
- 📝 **批量翻译**: 高效处理大量文本的翻译需求
- 🎯 **本地化摘要**: 生成符合目标语言习惯的摘要

### 🧠 RAG增强检索
- 🗄️ **向量存储**: 使用Cloudflare Vectorize存储文档向量
- 🔍 **语义搜索**: 基于向量相似度的智能内容检索
- 💡 **知识增强**: 结合历史相关内容生成更准确摘要
- 🔗 **内容关联**: 自动发现和链接相关主题

### 🎯 相似度检测
- 📊 **多算法支持**: 余弦、Jaccard、编辑距离、语义相似度
- 🔄 **重复内容检测**: 智能识别和去除重复内容
- 🔖 **内容指纹**: 快速生成文档指纹用于去重
- 📈 **相似度分析**: 详细的相似度计算报告

### ⚡ 智能缓存
- 🚀 **边缘缓存**: 基于Cloudflare KV的高速缓存系统
- ⏰ **TTL控制**: 灵活的缓存过期时间设置
- 🧹 **缓存管理**: 支持缓存清理和预热功能
- 📊 **缓存统计**: 命中率和性能监控

### 📈 监控运维
- 🔍 **性能监控**: 实时跟踪响应时间和资源使用
- 🚨 **错误追踪**: 智能错误分类和解决建议
- 📊 **使用统计**: 详细的功能使用分析
- ❤️ **健康检查**: 全面的系统状态监控

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
# AI服务配置
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here

# Cloudflare基础配置
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_PROJECT_NAME=html-summarizer-agent

# KV存储命名空间ID（可选，用于缓存和监控）
CLOUDFLARE_CACHE_KV_ID=your-cache-kv-namespace-id
CLOUDFLARE_MONITORING_KV_ID=your-monitoring-kv-namespace-id
CLOUDFLARE_ERROR_KV_ID=your-error-kv-namespace-id
CLOUDFLARE_VECTOR_KV_ID=your-vector-kv-namespace-id

# 可选配置
NODE_ENV=development
LOG_LEVEL=info
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
