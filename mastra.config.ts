import { Mastra } from '@mastra/core';
import { CloudflareDeployer } from '@mastra/cloudflare';

export default {
  name: 'html-summarizer-agent',
  agents: [
    {
      name: 'summarizer',
      instructions: '你是一个专业的内容摘要助手。请分析提供的网页内容，生成简洁的摘要和关键信息片段。',
      model: {
        provider: 'DEEPSEEK',
        name: 'deepseek-chat'
      },
      tools: ['fetchAndExtract']
    }
  ],
  tools: [
    {
      name: 'fetchAndExtract'
    }
  ],
  deploy: {
    cloudflare: {
      accountId: '4f626c727482ce1b73d26bb9f9244d79',
      projectName: 'html-summarizer-agent',
      routes: ['https://html-summarizer-agent.workers.dev/*'],
      auth: {
        apiToken: 'nludYXBjgyYP4lQvfMiqb061Hk6juU9rwmWjs56q'
      }
    }
  }
} satisfies Mastra;
