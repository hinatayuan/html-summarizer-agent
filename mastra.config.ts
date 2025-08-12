import { Mastra } from '@mastra/core';

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

  // 配置工具
  tools: [],

  // 配置代理
  agents: [],

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
