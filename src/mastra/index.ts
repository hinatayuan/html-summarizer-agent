
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { summarizerAgent } from './agents/summarizer';
import { deployer } from './deployer';

export const mastra = new Mastra({
  agents: { summarizerAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'HTMLSummarizer',
    level: 'info',
  }),
  // 添加Cloudflare部署配置
  deployer,
});
