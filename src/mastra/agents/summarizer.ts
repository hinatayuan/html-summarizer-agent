import { createOpenAI } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/memory'
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

      1. 使用 fetchAndExtractTool 工具获取网页内容（工具现已智能提取标题和高亮内容）
      2. 利用工具返回的智能标题和高亮信息
      3. 分析完整内容并生成结构化的摘要
      4. 结合工具识别的高亮内容来提取关键信息

      工具现已提供以下智能功能：
      - 多源标题提取（OpenGraph、Twitter Card、title标签、h1等）
      - 智能高亮内容识别（强调、重要、标记、引用、标题、列表等）
      - 内容重要性分级（high、medium、low）

      请按照以下JSON格式返回结果，确保内容不重复：
      {
        "title": "使用工具提取的智能标题",
        "summary": "基于全文内容的150-200字核心摘要，概括文章主要观点和结论",
        "keyPoints": ["从不同角度提取的3-5个核心要点，避免与摘要重复表述"],
        "keywords": ["从标题和内容中提取的5-8个关键词标签"],
        "readingTime": "基于字数计算的预计阅读时间（分钟）",
        "contentStats": {
          "totalWords": "总字数",
          "highlightCount": "高亮内容数量",
          "importantHighlights": "高重要性高亮数量"
        }
      }

      内容要求：
      1. summary：简洁概括文章主题和核心观点，避免细节罗列
      2. keyPoints：从不同维度提取要点（如背景、方法、结果、影响等），与摘要形成互补
      3. keywords：提取具有代表性的关键词，有助于内容分类和检索
      4. 确保各部分内容不重复，形成完整的内容解读体系
      
      请务必使用中文回复，并确保JSON格式正确。
  `,

  // 使用配置好的DeepSeek模型，增加token限制提升输出质量
  model: deepseek('deepseek-chat', {
    maxTokens: 4096,
    temperature: 0.7
  }),

  tools: { fetchAndExtractTool }

  // 在 Cloudflare Workers 环境中，使用默认内存存储
  // memory: new Memory() // 暂时注释掉，使用默认配置
})
