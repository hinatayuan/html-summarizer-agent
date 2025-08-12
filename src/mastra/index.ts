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
      // 可选：添加 KV 存储命名空间
      // {
      //   binding: 'NEWS_CACHE',
      //   id: process.env.CLOUDFLARE_KV_NAMESPACE_ID || '',
      // },
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
