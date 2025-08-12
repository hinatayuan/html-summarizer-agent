import { createTool } from '@mastra/core';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

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

// 回退方案：使用 Readability
async function extractWithReadability(html: string, url: string): Promise<string> {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    return article?.textContent || '';
  } catch (error) {
    console.warn('Readability extraction failed:', error);
    // 简单的HTML标签去除作为最终回退
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

export const fetchAndExtract = createTool({
  id: 'fetchAndExtract',
  description: '获取网页内容并提取主要文本内容',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: '要抓取和提取内容的网页URL'
      }
    },
    required: ['url']
  },
  
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
        extractedText = await extractWithReadability(html, url);
      }
      
      return {
        success: true,
        url,
        title: extractedText.split('\n')[0] || 'Unknown Title',
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