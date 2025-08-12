# HTML Summarizer Agent

基于最新Mastra框架构建的AI Agent，专门用于抓取网页内容、提取主要文本并生成智能摘要。部署在Cloudflare Workers上，提供高性能的边缘计算服务。

## 功能特性

- 🚀 **智能内容提取**: 自动抓取网页并提取主要文本内容
- 🤖 **AI驱动摘要**: 集成DeepSeek AI模型生成高质量摘要
- ⚡ **边缘计算**: 部署在Cloudflare Workers，全球低延迟访问
- 🛠️ **工具链集成**: 内置网页抓取和内容分析工具
- 📊 **结构化输出**: 返回摘要、要点、关键词和重要片段

## 技术架构

- **框架**: Mastra v0.13.1+ AI Agent Framework
- **AI模型**: DeepSeek Chat API
- **部署平台**: Cloudflare Workers
- **内容提取**: 简单HTML解析器
- **语言**: TypeScript

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

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，确保包含以下配置：
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

这将启动Mastra开发服务器，通常在 `http://localhost:3000`

### 5. 测试Agent

启动后，你可以通过Mastra的Web界面或API调用智能摘要Agent。

## 项目结构

```
html-summarizer-agent/
├── src/
│   ├── mastra/
│   │   └── index.ts         # Mastra主入口文件（包含工具和代理定义）
│   ├── agents/              # 独立的Agent定义文件（可选）
│   │   └── summarizer.ts
│   ├── tools/               # 独立的工具定义文件（可选）
│   │   └── fetchAndExtract.ts
│   └── index.ts             # 通用入口文件
├── mastra.config.ts         # Mastra配置文件
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## API 使用

### 调用智能摘要Agent

```javascript
// 使用Mastra Client
import { MastraClient } from '@mastra/client-js';

const client = new MastraClient({
  baseUrl: 'http://localhost:3000' // 开发环境
  // baseUrl: 'https://html-summarizer-agent.workers.dev' // 生产环境
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

## 故障排除

### 常见问题

1. **启动失败 - 找不到入口文件**
   - 确保 `src/mastra/index.ts` 文件存在
   - 检查文件路径是否正确

2. **依赖问题**
   ```bash
   # 清理并重新安装依赖
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript错误**
   - 确保使用Node.js 20.9.0或更高版本
   - 检查tsconfig.json配置

4. **环境变量问题**
   ```bash
   # 检查环境变量是否正确加载
   cat .env
   ```

5. **API密钥无效**
   - 确认DeepSeek API密钥有效
   - 检查网络连接

### 开发模式调试

启动开发服务器后，你可以：
- 访问 Mastra Web 界面测试Agent
- 查看控制台日志
- 使用浏览器开发者工具调试

## 更新日志

### v1.2.0 (最新)
- ✅ 修复Mastra CLI路径问题
- ✅ 创建正确的 `src/mastra/index.ts` 入口文件
- ✅ 简化项目结构，避免复杂导入
- ✅ 优化HTML内容提取逻辑
- ✅ 确保 `yarn dev` 和 `npm run dev` 正常工作

### v1.1.0
- ✅ 更新到最新Mastra v0.13.1+ API
- ✅ 使用新的Tool和Agent类
- ✅ 集成zod用于类型验证
- ✅ 添加输入输出schema定义

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过GitHub Issues联系：
https://github.com/hinatayuan/html-summarizer-agent/issues

---

🎉 **现在可以成功运行 `yarn dev` 了！**
