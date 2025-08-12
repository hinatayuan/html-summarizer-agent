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
- **AI模型**: DeepSeek Chat API（通过@ai-sdk/openai）
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
│       │   └── summarizer.ts   # 智能摘要代理
│       └── tools/              # 工具定义
│           └── fetchAndExtract.ts # 网页内容提取工具
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

**重要**: 此项目结构严格按照Mastra官方模板组织，无需根目录配置文件。

## 快速开始

### 环境要求
- Node.js >= 20.9.0
- npm 或 yarn

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
DEEPSEEK_API_KEY=sk-1edd0944d3d24a76b3ded1aa0298e20f
NODE_ENV=development
```

### 4. 启动开发服务器

```bash
npm run dev
# 或者
yarn dev
```

服务器将在 `http://localhost:3000` 启动

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

### 按照官方模板的关键差异

1. **导入路径**: 使用 `@mastra/core/mastra`、`@mastra/core/agent`、`@mastra/core/tools`
2. **Agent配置**: 使用 `@ai-sdk/openai` 和 `Memory` 类
3. **工具定义**: 使用 `createTool` 函数并包含 `execute` 函数
4. **Mastra实例**: 使用 `LibSQLStore` 和 `PinoLogger`

### 与之前版本的主要改进

- ✅ **完全按照官方模板重构**: 参考您的my-mastra-app仓库
- ✅ **正确的导入路径**: 使用官方的模块路径
- ✅ **Agent Memory**: 添加了Memory功能用于上下文记忆
- ✅ **工具API**: 使用正确的createTool API
- ✅ **日志系统**: 使用PinoLogger进行日志记录

## 故障排除

### 常见问题

1. **语法错误**
   - ✅ 已修复：按照官方模板重写所有文件
   - 使用正确的API和导入路径

2. **模块导入错误**
   - ✅ 已修复：使用官方的导入路径
   - 例如：`@mastra/core/mastra`、`@mastra/core/agent`

3. **依赖问题**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **环境变量问题**
   ```bash
   cat .env  # 检查环境变量
   ```

## 更新日志

### v1.4.0 (最新)
- ✅ **完全重构**: 严格按照官方my-mastra-app模板重写
- ✅ **修复导入路径**: 使用正确的@mastra/core子模块
- ✅ **Agent Memory**: 添加Memory功能用于对话上下文
- ✅ **工具API**: 使用createTool正确API
- ✅ **日志系统**: 集成PinoLogger
- ✅ **DeepSeek集成**: 通过@ai-sdk/openai正确配置

### v1.3.0
- ✅ 修复正则表达式语法错误
- ✅ 按照Mastra官方模板重新组织项目结构

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过GitHub Issues联系：
https://github.com/hinatayuan/html-summarizer-agent/issues

---

🎉 **现在应该可以完美运行 `yarn dev` 了！** 

这次完全按照您的官方模板重构，确保兼容性。
