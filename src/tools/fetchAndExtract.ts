import { Tool } from '@mastra/core';
import { z } from 'zod';

// 检查是否在Cloudflare Workers环境中
function isCloudflareWorkers(): boolean {
  return typeof globalThis.HTMLRewriter !== 'undefined';
}

// Cloudflare Workers HTML内容提取
async function extractWithHTMLRewriter(html: string): Promise<string> {
  let extractedText = '';
  
  const rewriter = new HTMLRewriter()
    .on('title', {
      text(text: any) {
        extractedText += text.text + '\n';
      }
    })
    .on('h1, h2, h3, h4, h5, h6', {
      text(text: any) {
        extractedText += text.text + '\n';
      }
    })
    .on('p', {
      text(text: any) {
        extractedText += text.text + ' ';
      }
    })
    .on('article', {
      text(text: any) {
        extractedText += text.text + ' ';
      }
    })
    .on('div.content, div.article, div.post', {
      text(text: any) {
        extractedText += text.text + ' ';
      }
    });

  const response = new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
  
  await rewriter.transform(response);
  return extractedText.trim();
}

// 回退方案：简单的HTML标签去除
function extractWithSimpleParser(html: string): string {
  // 移除script和style标签及其内容
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // 移除所有HTML标签
  text = text.replace(/<[^>]*>/g, ' ');
  
  // 清理多余的空白字符
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

export const fetchAndExtractTool = new Tool({
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
      let extractedText: string;
      
      // 根据环境选择提取方法
      if (isCloudflareWorkers()) {
        extractedText = await extractWithHTMLRewriter(html);
      } else {
        extractedText = extractWithSimpleParser(html);
      }
      
      // 提取标题（通常是第一行非空内容）
      const lines = extractedText.split('\n').filter(line => line.trim());
      const title = lines[0] || 'Unknown Title';
      
      return {
        success: true,
        url,
        title,
        content: extractedText,
        wordCount: extractedText.split(' ').length,
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
