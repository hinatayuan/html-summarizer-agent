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

**注意**: 根据Mastra官方模板，项目**不需要**根目录的 `mastra.config.ts` 文件。

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
CLOUDFLARE_ACCOUNT_ID=4f626c727482ce1b73d26bb9f9244d79
CLOUDFLARE_API_TOKEN=nludYXBjgyYP4lQvfMiqb061Hk6juU9rwmWjs56q
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

## 构建和部署

### 构建项目

```bash
npm run build
```

### 部署到Cloudflare Workers

```bash
npm run deploy
```

## 开发说明

### 项目结构说明

- **src/mastra/index.ts**: Mastra框架的主入口文件，配置LLM、工具和代理
- **src/mastra/tools/**: 存放所有工具定义
- **src/mastra/agents/**: 存放所有AI代理定义
- **无mastra.config.ts**: 按照官方模板，不需要根目录配置文件

### 添加新工具

1. 在 `src/mastra/tools/` 中创建新工具文件
2. 在 `src/mastra/index.ts` 中导入并注册工具

### 添加新代理

1. 在 `src/mastra/agents/` 中创建新代理文件
2. 在 `src/mastra/index.ts` 中导入并注册代理

## 故障排除

### 常见问题

1. **语法错误 "c"**
   - ✅ 已修复：正则表达式中的反斜杠转义问题
   - 确保使用正确的转义序列

2. **入口文件找不到**
   - ✅ 已修复：创建了正确的 `src/mastra/index.ts` 文件
   - Mastra CLI会自动查找这个路径

3. **依赖问题**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **环境变量问题**
   ```bash
   cat .env  # 检查环境变量
   ```

### 与官方模板的区别

- ✅ **正确的目录结构**: `src/mastra/` 作为主目录
- ✅ **无根配置文件**: 不需要根目录的 `mastra.config.ts`
- ✅ **工具和代理组织**: 分别放在 `tools/` 和 `agents/` 子目录中
- ✅ **统一入口点**: 所有配置都在 `src/mastra/index.ts` 中

## 更新日志

### v1.3.0 (最新)
- ✅ 修复正则表达式语法错误（第28行的 "c" 错误）
- ✅ 按照Mastra官方模板重新组织项目结构
- ✅ 移除不必要的根目录 `mastra.config.ts` 文件
- ✅ 将agents和tools移入 `src/mastra/` 目录
- ✅ 简化项目结构，提高可维护性

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过GitHub Issues联系：
https://github.com/hinatayuan/html-summarizer-agent/issues

---

🎉 **现在应该可以成功运行 `yarn dev` 了！**
