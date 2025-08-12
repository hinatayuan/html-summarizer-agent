import { Mastra } from '@mastra/core';
import { DeepSeekLLM } from '@mastra/deepseek';
import { summarizerAgent } from './agents/summarizer.js';
import { fetchAndExtract } from './tools/fetchAndExtract.js';

// 初始化DeepSeek LLM
const deepseek = new DeepSeekLLM({
  apiKey: 'sk-1edd0944d3d24a76b3ded1aa0298e20f',
  baseURL: 'https://api.deepseek.com'
});

// 创建Mastra实例
export const mastra = new Mastra({
  name: 'html-summarizer-agent',
  
  // 注册LLM提供者
  llms: [deepseek],
  
  // 注册工具
  tools: [fetchAndExtract],
  
  // 注册Agent
  agents: [summarizerAgent],
  
  // 启用API路由
  enableRoutes: true,
});

// 导出默认实例
export default mastra;

// Cloudflare Workers入口
export { mastra as default } from './index.js';