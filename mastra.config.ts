import { Mastra } from '@mastra/core';
import { fetchAndExtractTool } from './src/tools/fetchAndExtract.js';
import { summarizerAgent } from './src/agents/summarizer.js';

export default new Mastra({
  name: 'html-summarizer-agent',
  
  // 配置DeepSeek LLM
  llms: [
    {
      name: 'deepseek',
      provider: 'openai',
      config: {
        baseURL: 'https://api.deepseek.com/v1',
        apiKey: process.env.DEEPSEEK_API_KEY || 'sk-1edd0944d3d24a76b3ded1aa0298e20f',
        model: 'deepseek-chat'
      }
    }
  ],

  // 注册工具
  tools: [fetchAndExtractTool],

  // 注册代理
  agents: [summarizerAgent],

  // 配置内存存储
  memory: {
    provider: 'libsql',
    config: {
      url: ':memory:'
    }
  },

  // 配置日志
  logger: {
    provider: 'console',
    level: 'info'
  }
});
