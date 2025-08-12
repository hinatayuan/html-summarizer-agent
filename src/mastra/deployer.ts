/*
 * @Author: liuweiyuan_a liuweiyuan_a@aspirecn.com
 * @Date: 2025-08-12 16:00:27
 * @LastEditors: liuweiyuan_a liuweiyuan_a@aspirecn.com
 * @LastEditTime: 2025-08-12 16:09:28
 * @FilePath: \html-summarizer-agent\src\mastra\deployer.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { CloudflareDeployer } from '@mastra/deployer-cloudflare'

export const deployer = new CloudflareDeployer({
  scope:
    process.env.CLOUDFLARE_ACCOUNT_ID || '4f626c727482ce1b73d26bb9f9244d79',
  apiToken:
    process.env.CLOUDFLARE_API_TOKEN ||
    'nludYXBjgyYP4lQvfMiqb061Hk6juU9rwmWjs56q',
  name: 'html-summarizer-agent',
  // 可选配置
  compatibility: {
    date: '2024-08-01',
    flags: []
  },
  env: {
    DEEPSEEK_API_KEY:
      process.env.DEEPSEEK_API_KEY || 'sk-1edd0944d3d24a76b3ded1aa0298e20f'
  }
})
