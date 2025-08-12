# HTML Summarizer Agent

基于Mastra框架构建的AI Agent，专门用于抓取网页内容、提取主要文本并生成智能摘要。

## 功能特性

- 🚀 **智能内容提取**: 自动抓取网页并提取主要文本内容
- 🤖 **AI驱动摘要**: 集成DeepSeek AI模型生成高质量摘要
- ⚡ **边缘计算**: 可部署在Cloudflare Workers，全球低延迟访问
- 🛠️ **工具链集成**: 内置网页抓取和内容分析工具
- 📊 **结构化输出**: 返回摘要、要点、关键词和重要片段

## 技术架构

- **框架**: Mastra v0.13.1+ AI Agent Framework
- **AI模型**: DeepSeek Chat API（通过OpenAI兼容接口）
- **部署平台**: Cloudflare Workers（可选）
- **内容提取**: 简单HTML解析器
- **语言**: TypeScript

## 项目结构

```\nhtml-summarizer-agent/\n├── src/\n│   └── mastra/                 # Mastra项目主目录\n│       ├── index.ts            # Mastra入口文件\n│       ├── agents/             # AI代理定义\n│       │   └── summarizer.ts   # 智能摘要代理\n│       └── tools/              # 工具定义\n│           └── fetchAndExtract.ts # 网页内容提取工具\n├── package.json\n├── tsconfig.json\n├── .env.example\n├── .gitignore\n└── README.md\n```\n\n## 快速开始\n\n### 环境要求\n- Node.js >= 20.9.0\n- npm 或 yarn\n\n### 1. 克隆项目\n\n```bash\ngit clone https://github.com/hinatayuan/html-summarizer-agent.git\ncd html-summarizer-agent\n```\n\n### 2. 安装依赖\n\n```bash\nnpm install\n# 或者\nyarn install\n```\n\n### 3. 配置环境变量\n\n```bash\ncp .env.example .env\n```\n\n编辑 `.env` 文件：\n```env\nDEEPSEEK_API_KEY=sk-1edd0944d3d24a76b3ded1aa0298e20f\nCLOUDFLARE_ACCOUNT_ID=4f626c727482ce1b73d26bb9f9244d79\nCLOUDFLARE_API_TOKEN=nludYXBjgyYP4lQvfMiqb061Hk6juU9rwmWjs56q\nNODE_ENV=development\n```\n\n### 4. 启动开发服务器\n\n```bash\nnpm run dev\n# 或者\nyarn dev\n```\n\n服务器将在 `http://localhost:3000` 启动\n\n## API 使用\n\n### 通过Mastra Web界面\n\n启动开发服务器后，访问 `http://localhost:3000` 使用Web界面测试Agent。\n\n### 通过API调用\n\n```javascript\n// 使用Mastra Client\nimport { MastraClient } from '@mastra/client-js';\n\nconst client = new MastraClient({\n  baseUrl: 'http://localhost:3000' // 开发环境\n});\n\n// 调用摘要Agent\nconst result = await client.agents.summarizer.generate({\n  url: 'https://example.com/article'\n});\n\nconsole.log(result);\n```\n\n### 返回数据格式\n\n```json\n{\n  \"title\": \"文章标题\",\n  \"summary\": \"核心摘要内容\",\n  \"keyPoints\": [\"要点1\", \"要点2\", \"要点3\"],\n  \"keywords\": [\"关键词1\", \"关键词2\"],\n  \"highlights\": [\n    {\n      \"text\": \"重要片段文本\",\n      \"importance\": \"high\",\n      \"category\": \"主要观点\"\n    }\n  ],\n  \"readingTime\": \"5分钟\"\n}\n```\n\n## 构建和部署\n\n### 构建项目\n\n```bash\nnpm run build\n```\n\n### 部署到Cloudflare Workers\n\n```bash\nnpm run deploy\n```\n\n## 开发说明\n\n### 项目结构说明\n\n- **src/mastra/index.ts**: Mastra框架的主入口文件，配置LLM、工具和代理\n- **src/mastra/tools/**: 存放所有工具定义\n- **src/mastra/agents/**: 存放所有AI代理定义\n- **无mastra.config.ts**: 按照官方模板，不需要根目录配置文件\n\n### 添加新工具\n\n1. 在 `src/mastra/tools/` 中创建新工具文件\n2. 在 `src/mastra/index.ts` 中导入并注册工具\n\n### 添加新代理\n\n1. 在 `src/mastra/agents/` 中创建新代理文件\n2. 在 `src/mastra/index.ts` 中导入并注册代理\n\n## 故障排除\n\n### 常见问题\n\n1. **语法错误**\n   - 确保正则表达式中的反斜杠正确转义\n   - 检查TypeScript语法\n\n2. **依赖问题**\n   ```bash\n   rm -rf node_modules package-lock.json\n   npm install\n   ```\n\n3. **环境变量问题**\n   ```bash\n   cat .env  # 检查环境变量\n   ```\n\n4. **Node.js版本**\n   ```bash\n   node --version  # 需要 >= 20.9.0\n   ```\n\n## 更新日志\n\n### v1.3.0 (最新)\n- ✅ 按照Mastra官方模板重新组织项目结构\n- ✅ 修复正则表达式语法错误\n- ✅ 移除不必要的根目录配置文件\n- ✅ 将agents和tools移入mastra目录\n- ✅ 简化项目结构，提高可维护性\n\n### v1.2.0\n- ✅ 修复Mastra CLI路径问题\n- ✅ 创建正确的入口文件结构\n\n### v1.1.0\n- ✅ 更新到最新Mastra v0.13.1+ API\n- ✅ 使用新的Tool和Agent类\n\n## 许可证\n\nMIT License\n\n## 联系方式\n\n如有问题或建议，请通过GitHub Issues联系：\nhttps://github.com/hinatayuan/html-summarizer-agent/issues\n\n---\n\n🎉 **现在可以成功运行 `yarn dev` 了！**\n