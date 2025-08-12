import { Mastra, Tool, Agent } from '@mastra/core';
import { z } from 'zod';

// ============ 工具定义 ============
const fetchAndExtractTool = new Tool({
  id: 'fetchAndExtract',
  description: '获取网页内容并提取主要文本内容',
  inputSchema: z.object({
    url: z.string().url().describe('要抓取和提取内容的网页URL')
  }),
  
  async execute({ url }) {
    try {
      // 获取网页内容
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // 简单的HTML内容提取
      let text = html.replace(/<script[^>]*>[\\s\\S]*?<\\/script>/gi, '');
      text = text.replace(/<style[^>]*>[\\s\\S]*?<\\/style>/gi, '');
      text = text.replace(/<[^>]*>/g, ' ');
      text = text.replace(/\\s+/g, ' ').trim();
      
      // 提取标题
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '未知标题';
      
      return {
        success: true,
        url,
        title,
        content: text,
        wordCount: text.split(' ').length,
        extractedAt: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        success: false,
        url,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        extractedAt: new Date().toISOString()
      };
    }
  }
});

// ============ 代理定义 ============
const summarizerAgent = new Agent({
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
  
  // 定义输入输出schema
  inputSchema: z.object({
    url: z.string().url().describe('要分析的网页URL')
  }),
  
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

// ============ Mastra实例 ============
const mastra = new Mastra({
  name: 'html-summarizer-agent',
  
  // 配置DeepSeek LLM
  llms: [
    {
      name: 'deepseek',
      provider: 'openai',
      config: {
        baseURL: 'https://api.deepseek.com/v1',
        apiKey: process.env.DEEPSEEK_API_KEY || 'sk-1edd0944d3d24a76b3ded1aa0298e20f',
        model: 'deepseek-chat'
      }
    }
  ],

  // 注册工具
  tools: [fetchAndExtractTool],

  // 注册代理
  agents: [summarizerAgent],

  // 配置内存存储
  memory: {
    provider: 'libsql',
    config: {
      url: ':memory:'
    }
  },

  // 配置日志
  logger: {
    provider: 'console',
    level: 'info'
  }
});

// 导出实例
export default mastra;
