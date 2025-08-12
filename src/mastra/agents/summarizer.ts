import { Agent } from '@mastra/core';
import { z } from 'zod';
import { fetchAndExtractTool } from '../tools/fetchAndExtract.js';

// 智能摘要代理
export const summarizerAgent = new Agent({
  name: 'summarizer',
  instructions: `你是一个专业的内容摘要和分析助手。当用户提供网页URL时，你需要：

1. 使用 fetchAndExtract 工具获取网页内容
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

请确保摘要简洁明了，要点突出重点，关键词准确反映内容主题。`,
  
  model: {
    provider: 'deepseek',
    name: 'deepseek-chat'
  },
  
  tools: [fetchAndExtractTool],
  
  // 定义输入schema
  inputSchema: z.object({
    url: z.string().url().describe('要分析的网页URL')
  }),
  
  // 定义输出schema
  outputSchema: z.object({
    title: z.string().describe('文章标题'),
    summary: z.string().describe('核心摘要'),
    keyPoints: z.array(z.string()).describe('关键要点'),
    keywords: z.array(z.string()).describe('关键词'),
    highlights: z.array(z.object({
      text: z.string().describe('重要片段文本'),
      importance: z.enum(['high', 'medium', 'low']).describe('重要性级别'),
      category: z.string().describe('片段类别')
    })).describe('重要片段高亮'),
    readingTime: z.string().describe('预计阅读时间')
  })
});
