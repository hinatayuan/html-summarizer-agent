import { createAgent } from '@mastra/core';
import { fetchAndExtract } from '../tools/fetchAndExtract.js';

export const summarizerAgent = createAgent({
  id: 'summarizer',
  name: '智能摘要助手',
  instructions: `你是一个专业的内容摘要和分析助手。当用户提供网页URL时，你需要：

1. 使用 fetchAndExtract 工具获取网页内容
2. 分析内容并生成结构化的摘要
3. 提取关键信息片段和要点
4. 识别重要的关键词

请按照以下格式返回结果：
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
    provider: 'DEEPSEEK',
    name: 'deepseek-chat',
    toolChoice: 'auto'
  },
  
  tools: [fetchAndExtract],
});

export default summarizerAgent;