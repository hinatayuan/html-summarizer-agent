import { CloudflareDeployer } from '@mastra/deployer-cloudflare';

export const deployer = new CloudflareDeployer({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '4f626c727482ce1b73d26bb9f9244d79',
  apiToken: process.env.CLOUDFLARE_API_TOKEN || 'nludYXBjgyYP4lQvfMiqb061Hk6juU9rwmWjs56q',
  name: 'html-summarizer-agent',
  compatibility: {
    date: '2024-08-01',
    flags: []
  },
  env: {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || 'sk-1edd0944d3d24a76b3ded1aa0298e20f'
  }
});
