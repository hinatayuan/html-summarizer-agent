import { createOpenAI } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/memory'
import { LibSQLStore } from '@mastra/libsql'
import { fetchAndExtractTool } from '../tools/fetchAndExtract'

// 安全的 DeepSeek 模型配置 - 从环境变量获取
const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com'
})

export const summarizerAgent = new Agent({
  name: 'HTML Summarizer Agent',
  instructions: `
      你是一个专业的内容摘要和分析助手。当用户提供网页URL时，你需要：

      1. 使用 fetchAndExtractTool 工具获取网页内容
      2. 分析内容并生成结构化的摘要
      3. 提取关键信息片段和要点
      4. 识别重要的关键词

      请按照以下JSON格式返回结果：
      {
        "title": "文章标题",
        "summary": "200字以内的核心摘要",
        "keyPoints": ["要点1", "要点2", "要点3"],
        "keywords": ["关键词1", "关键词2", "关键词3"],
        "highlights": [
          {
            "text": "重要片段文本",
            "importance": "high|medium|low",
            "category": "主要观点|数据|结论等"
          }
        ],
        "readingTime": "预计阅读时间（分钟）"
      }

      请确保摘要简洁明了，要点突出重点，关键词准确反映内容主题。
      
      请务必使用中文回复，并确保JSON格式正确。
  `,

  // 使用配置好的DeepSeek模型
  model: deepseek('deepseek-chat'),

  tools: { fetchAndExtractTool },

  memory: new Memory({
    storage: new LibSQLStore({
      url: ':memory:' // 使用内存存储
    })
  })
})
