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
    highlights: z.array(z.object({
      text: z.string(),
      importance: z.string(),
      category: z.string()
    })).optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await extractWebContent(context.url);
  },
});

// HTML实体解码
const decodeHtmlEntities = (text: string): string => {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' '
  };
  
  return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
};

// 智能标题提取
const extractTitle = (html: string): string => {
  // 1. Open Graph标题 (最高优先级)
  let titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (titleMatch) {
    const title = decodeHtmlEntities(titleMatch[1].trim());
    if (title.length > 0 && title.length <= 200) return title;
  }
  
  // 2. Twitter Card标题
  titleMatch = html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
  if (titleMatch) {
    const title = decodeHtmlEntities(titleMatch[1].trim());
    if (title.length > 0 && title.length <= 200) return title;
  }
  
  // 3. 基本title标签
  titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    const title = decodeHtmlEntities(titleMatch[1].trim());
    if (title.length > 0 && title.length <= 200) return title;
  }
  
  // 4. 第一个h1标签作为备选
  titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (titleMatch) {
    const title = decodeHtmlEntities(titleMatch[1].trim());
    if (title.length > 0 && title.length <= 200) return title;
  }
  
  // 5. JSON-LD结构化数据
  const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      if (jsonData.headline || jsonData.name) {
        const title = decodeHtmlEntities((jsonData.headline || jsonData.name).trim());
        if (title.length > 0 && title.length <= 200) return title;
      }
    } catch (e) {
      // JSON解析失败，继续后续逻辑
    }
  }
  
  return '未知标题';
};

// 智能内容提取和高亮识别
const extractContentWithHighlights = (html: string): { content: string; highlights: Array<{text: string; importance: string; category: string}> } => {
  console.log('开始内容提取，HTML长度:', html.length);
  
  // 移除脚本和样式
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleanHtml = cleanHtml.replace(/<!--[\s\S]*?-->/gi, '');
  cleanHtml = cleanHtml.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
  
  const highlights: Array<{text: string; importance: string; category: string}> = [];
  
  console.log('清理后HTML长度:', cleanHtml.length);
  
  // 1. 更强大的主要内容区域识别 - 扩展选择器
  const contentSelectors = [
    // 语义化标签
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<section[^>]*>([\s\S]*?)<\/section>/i,
    
    // 常见内容类名 - 更宽松的匹配
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*main[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*body[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    
    // ID选择器
    /<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*id="[^"]*main[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*id="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    
    // 其他容器
    /<div[^>]*class="[^"]*container[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*wrapper[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
  ];
  
  let mainContent = '';
  let selectorUsed = '';
  
  for (let i = 0; i < contentSelectors.length; i++) {
    const selector = contentSelectors[i];
    const matches = cleanHtml.match(selector);
    if (matches) {
      // 对于多个匹配，选择最长的内容
      let bestMatch = '';
      matches.forEach(match => {
        const content = match.replace(/<[^>]*>/g, '').trim();
        if (content.length > bestMatch.length) {
          bestMatch = match;
        }
      });
      
      if (bestMatch.length > 0) {
        mainContent = bestMatch;
        selectorUsed = `selector ${i}`;
        console.log(`使用选择器 ${i} 找到内容，长度:`, bestMatch.length);
        break;
      }
    }
  }
  
  // 回退策略：如果仍然没找到，使用更简单的方法
  if (!mainContent) {
    console.log('尝试使用body内容');
    const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    mainContent = bodyMatch ? bodyMatch[1] : cleanHtml;
    selectorUsed = 'body fallback';
  }
  
  // 最后的回退：如果还是空，直接使用清理后的HTML
  if (!mainContent) {
    console.log('使用全部清理后的HTML');
    mainContent = cleanHtml;
    selectorUsed = 'full html fallback';
  }
  
  console.log('最终选择的内容源:', selectorUsed, '内容长度:', mainContent.length);
  
  // 2. 提取高亮内容 - 按重要性分类
  
  // 强调内容 (高重要性)
  const strongMatches = mainContent.match(/<strong[^>]*>([^<]+)<\/strong>/gi);
  if (strongMatches) {
    strongMatches.forEach(match => {
      const text = match.replace(/<[^>]*>/g, '').trim();
      if (text.length > 10 && text.length < 500) {
        highlights.push({ text: decodeHtmlEntities(text), importance: 'high', category: '重点强调' });
      }
    });
  }
  
  // 重要内容 (高重要性)  
  const importantMatches = mainContent.match(/<(b|em)[^>]*>([^<]+)<\/\1>/gi);
  if (importantMatches) {
    importantMatches.forEach(match => {
      const text = match.replace(/<[^>]*>/g, '').trim();
      if (text.length > 10 && text.length < 500) {
        highlights.push({ text: decodeHtmlEntities(text), importance: 'high', category: '重要内容' });
      }
    });
  }
  
  // 标记内容 (中重要性)
  const markMatches = mainContent.match(/<mark[^>]*>([^<]+)<\/mark>/gi);
  if (markMatches) {
    markMatches.forEach(match => {
      const text = match.replace(/<[^>]*>/g, '').trim();
      if (text.length > 5 && text.length < 300) {
        highlights.push({ text: decodeHtmlEntities(text), importance: 'medium', category: '标记内容' });
      }
    });
  }
  
  // 引用内容 (中重要性)
  const quoteMatches = mainContent.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi);
  if (quoteMatches) {
    quoteMatches.forEach(match => {
      const text = match.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length > 20 && text.length < 800) {
        highlights.push({ text: decodeHtmlEntities(text), importance: 'medium', category: '引用内容' });
      }
    });
  }
  
  // 副标题 (中重要性)
  const headingMatches = mainContent.match(/<h[2-6][^>]*>([^<]+)<\/h[2-6]>/gi);
  if (headingMatches) {
    headingMatches.forEach(match => {
      const text = match.replace(/<[^>]*>/g, '').trim();
      if (text.length > 5 && text.length < 200) {
        highlights.push({ text: decodeHtmlEntities(text), importance: 'medium', category: '章节标题' });
      }
    });
  }
  
  // 列表项 (低重要性，但保留结构)
  const listItemMatches = mainContent.match(/<li[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>[^<]*)*)<\/li>/gi);
  if (listItemMatches && listItemMatches.length <= 10) { // 限制列表项数量
    listItemMatches.forEach(match => {
      const text = match.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length > 10 && text.length < 300) {
        highlights.push({ text: decodeHtmlEntities(text), importance: 'low', category: '列表要点' });
      }
    });
  }
  
  // 3. 增强的文本提取和清理
  let text = extractCleanText(mainContent);
  
  console.log('提取的纯文本长度:', text.length);
  console.log('文本前100字符:', text.substring(0, 100));
  
  // 如果提取的文本仍然太短，使用备选方法
  if (text.length < 100) {
    console.log('文本太短，使用备选提取方法');
    
    // 尝试提取所有段落
    const paragraphs = mainContent.match(/<p[^>]*>(.*?)<\/p>/gi);
    if (paragraphs && paragraphs.length > 0) {
      text = paragraphs.map(p => p.replace(/<[^>]*>/g, ' ').trim()).join(' ');
      console.log('从段落提取的文本长度:', text.length);
    }
    
    // 如果段落也没有，尝试提取所有文本节点
    if (text.length < 50) {
      text = mainContent.replace(/<[^>]*>/g, ' ');
      text = text.replace(/\s+/g, ' ').trim();
      console.log('从所有节点提取的文本长度:', text.length);
    }
  }
  
  // 最终清理
  text = decodeHtmlEntities(text);
  text = text.replace(/\s+/g, ' ').trim();
  
  // 如果文本仍然为空，提供一个最小的内容
  if (!text || text.length < 10) {
    console.warn('提取的文本内容过少，可能是页面结构复杂或需要JavaScript渲染');
    text = '页面内容无法有效提取，可能需要JavaScript渲染或页面结构特殊。';
  }
  
  // 4. 去重高亮内容
  const uniqueHighlights = highlights.filter((highlight, index, array) => 
    array.findIndex(h => h.text === highlight.text) === index
  );
  
  console.log('最终返回：文本长度', text.length, '高亮数量', uniqueHighlights.length);
  
  return {
    content: text,
    highlights: uniqueHighlights.slice(0, 20) // 限制高亮内容数量
  };
};

// 增强的文本清理函数
const extractCleanText = (html: string): string => {
  // 移除导航、侧边栏、页脚等无关内容
  let cleanHtml = html.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  cleanHtml = cleanHtml.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
  cleanHtml = cleanHtml.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  cleanHtml = cleanHtml.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  
  // 移除广告和追踪相关的div
  cleanHtml = cleanHtml.replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  cleanHtml = cleanHtml.replace(/<div[^>]*class="[^"]*banner[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  cleanHtml = cleanHtml.replace(/<div[^>]*class="[^"]*sidebar[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  
  // 保留重要的文本标签，移除其他标签
  let text = cleanHtml;
  
  // 将块级元素转换为换行
  text = text.replace(/<\/?(div|p|h[1-6]|li|article|section)[^>]*>/gi, '\n');
  text = text.replace(/<br[^>]*>/gi, '\n');
  
  // 移除所有剩余的HTML标签
  text = text.replace(/<[^>]*>/g, ' ');
  
  // 清理空白字符
  text = text.replace(/\n\s*\n/g, '\n'); // 多个换行合并
  text = text.replace(/[ \t]+/g, ' '); // 多个空格合并
  text = text.replace(/^\s+|\s+$/gm, ''); // 删除每行首尾空白
  text = text.replace(/\n+/g, ' '); // 将换行转换为空格
  text = text.trim();
  
  return text;
};

const extractWebContent = async (url: string) => {
  try {
    console.log(`正在获取网页内容: ${url}`);
    
    // 获取网页内容 - 增加更多请求头和错误处理
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 15000 // 15秒超时
    });
    
    console.log('HTTP响应状态:', response.status, response.statusText);
    console.log('响应头 Content-Type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      console.error('HTTP请求失败:', errorMsg);
      throw new Error(errorMsg);
    }
    
    const html = await response.text();
    console.log('获取到HTML内容长度:', html.length);
    
    // 检查是否是有效的HTML内容
    if (!html.includes('<html') && !html.includes('<body') && !html.includes('<div')) {
      console.warn('警告：响应内容可能不是标准HTML格式');
      console.log('响应内容前200字符:', html.substring(0, 200));
    }
    
    // 智能内容提取和高亮识别
    const extractionResult = extractContentWithHighlights(html);
    const text = extractionResult.content;
    
    // 智能标题提取 - 多数据源优先级策略
    const title = extractTitle(html);
    
    console.log(`内容提取完成，标题: ${title}`);
    
    // 验证提取结果
    if (!text || text.trim().length < 10) {
      console.warn('提取的内容过短，提供调试信息');
      const debugInfo = {
        htmlLength: html.length,
        titleFound: title !== '未知标题',
        hasBody: html.includes('<body'),
        hasDiv: html.includes('<div'),
        hasParagraph: html.includes('<p'),
        extractedTextLength: text.length,
        extractedText: text.substring(0, 200)
      };
      console.log('调试信息:', debugInfo);
    }
    
    return {
      success: true,
      url,
      title,
      content: text,
      wordCount: text.split(/\s+/).length,
      extractedAt: new Date().toISOString(),
      highlights: extractionResult.highlights
    };
    
  } catch (error) {
    console.error('网页内容提取失败:', error);
    
    // 提供更详细的错误信息
    let errorMessage = 'Unknown error occurred';
    let debugInfo = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // 根据错误类型提供更有用的信息
      if (error.message.includes('fetch')) {
        errorMessage = '无法访问该网页，可能是网络问题或页面不存在';
        debugInfo = '请检查URL是否正确，或该网页是否允许跨域访问';
      } else if (error.message.includes('timeout')) {
        errorMessage = '请求超时，页面响应过慢';
        debugInfo = '建议稍后重试或检查网络连接';
      } else if (error.message.includes('HTTP 403')) {
        errorMessage = '访问被拒绝，网页可能有访问限制';
        debugInfo = '网页可能需要登录或有反爬虫机制';
      } else if (error.message.includes('HTTP 404')) {
        errorMessage = '页面未找到';
        debugInfo = '请检查URL是否正确';
      } else if (error.message.includes('HTTP 50')) {
        errorMessage = '服务器内部错误';
        debugInfo = '网页服务器出现问题，建议稍后重试';
      }
    }
    
    console.log('错误详情:', { errorMessage, debugInfo, url });
    
    return {
      success: false,
      url,
      title: '',
      content: '',
      wordCount: 0,
      extractedAt: new Date().toISOString(),
      error: `${errorMessage}${debugInfo ? ` (${debugInfo})` : ''}`
    };
  }
};
