import { Mastra } from '@mastra/core/mastra'
import { CloudflareDeployer } from '@mastra/deployer-cloudflare'
import { PinoLogger } from '@mastra/loggers'
import { summarizerAgent } from './agents/summarizer'

export const mastra = new Mastra({
  agents: { summarizerAgent },
  // 在 Cloudflare Workers 环境中使用内存存储，避免 LibSQL 文件协议问题
  logger: new PinoLogger({
    name: 'HTMLSummarizer',
    level: 'info'
  }),
  deployer: new CloudflareDeployer({
    // 从环境变量获取配置，避免硬编码
    scope: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    projectName: process.env.CLOUDFLARE_PROJECT_NAME || 'html-summarizer-agent',
    auth: {
      apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
      apiEmail: process.env.CLOUDFLARE_EMAIL || ''
    },
    env: {
      // 生产环境变量配置
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
      NODE_ENV: 'production'
    },
    kvNamespaces: [
      // 缓存存储命名空间
      {
        binding: 'CACHE_KV',
        id: process.env.CLOUDFLARE_CACHE_KV_ID || '',
      },
      // 监控数据存储命名空间  
      {
        binding: 'MONITORING_KV',
        id: process.env.CLOUDFLARE_MONITORING_KV_ID || '',
      },
      // 错误追踪存储命名空间
      {
        binding: 'ERROR_KV', 
        id: process.env.CLOUDFLARE_ERROR_KV_ID || '',
      },
      // 向量索引存储命名空间（如果使用KV模拟）
      {
        binding: 'VECTOR_KV',
        id: process.env.CLOUDFLARE_VECTOR_KV_ID || '',
      }
    ],
    routes: [
      // 可选：自定义域名路由
      // {
      //   pattern: 'news-api.yourdomain.com/*',
      //   zone_name: 'yourdomain.com',
      //   custom_domain: true,
      // },
    ]
  })
})
