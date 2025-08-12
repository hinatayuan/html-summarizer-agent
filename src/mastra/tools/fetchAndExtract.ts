import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const fetchAndExtractTool = createTool({
  id: 'fetch-and-extract',
  description: '获取网页内容并提取主要文本内容',
  inputSchema: z.object({
    url: z.string().url().describe('要抓取和提取内容的网页URL')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    url: z.string(),
    title: z.string(),
    content: z.string(),
    wordCount: z.number(),
    extractedAt: z.string(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await extractWebContent(context.url);
  },
});

const extractWebContent = async (url: string) => {
  try {
    console.log(`正在获取网页内容: ${url}`);
    
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
    
    console.log(`内容提取完成，标题: ${title}`);
    
    return {
      success: true,
      url,
      title,
      content: text,
      wordCount: text.split(' ').length,
      extractedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('网页内容提取失败:', error);
    
    return {
      success: false,
      url,
      title: '',
      content: '',
      wordCount: 0,
      extractedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
