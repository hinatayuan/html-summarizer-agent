import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const rssParserTool = createTool({
  id: 'rss-parser',
  description: '解析RSS/Atom订阅源并提取文章列表',
  inputSchema: z.object({
    url: z.string().url().describe('RSS/Atom订阅源URL'),
    limit: z.number().optional().default(10).describe('返回文章数量限制'),
    includeContent: z.boolean().optional().default(false).describe('是否包含完整文章内容')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    feedInfo: z.object({
      title: z.string(),
      description: z.string(),
      link: z.string(),
      lastUpdated: z.string().optional()
    }).optional(),
    articles: z.array(z.object({
      title: z.string(),
      link: z.string(),
      description: z.string().optional(),
      content: z.string().optional(),
      pubDate: z.string().optional(),
      author: z.string().optional(),
      categories: z.array(z.string()).optional()
    })).optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await parseRSSFeed(context.url, context.limit, context.includeContent);
  },
});

export const rssSubscriptionTool = createTool({
  id: 'rss-subscription',
  description: '管理RSS订阅列表，支持批量处理多个RSS源',
  inputSchema: z.object({
    action: z.enum(['add', 'remove', 'list', 'update']).describe('操作类型'),
    feedUrl: z.string().optional().describe('RSS源URL'),
    feedName: z.string().optional().describe('RSS源名称'),
    category: z.string().optional().describe('RSS源分类')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    subscriptions: z.array(z.object({
      name: z.string(),
      url: z.string(),
      category: z.string().optional(),
      lastChecked: z.string().optional(),
      status: z.string()
    })).optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await manageSubscriptions(context);
  },
});

// 解析RSS/Atom订阅源
const parseRSSFeed = async (feedUrl: string, limit: number = 10, includeContent: boolean = false) => {
  try {
    console.log(`正在解析RSS源: ${feedUrl}`);
    
    // 获取RSS内容
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'HTML Summarizer Agent RSS Reader/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
        'Cache-Control': 'no-cache'
      },
      timeout: 15000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    console.log('RSS内容长度:', xmlText.length);
    
    // 检测RSS类型并解析
    const feedType = detectFeedType(xmlText);
    console.log('检测到RSS类型:', feedType);
    
    let feedInfo;
    let articles;
    
    if (feedType === 'atom') {
      const parsed = parseAtomFeed(xmlText);
      feedInfo = parsed.feedInfo;
      articles = parsed.articles;
    } else {
      const parsed = parseRSSFeed2(xmlText);
      feedInfo = parsed.feedInfo;
      articles = parsed.articles;
    }
    
    // 限制文章数量
    articles = articles.slice(0, limit);
    
    // 如果需要完整内容，获取每篇文章的完整内容
    if (includeContent) {
      console.log('获取文章完整内容...');
      articles = await Promise.all(
        articles.map(async (article) => {
          try {
            const contentResult = await fetchFullArticleContent(article.link);
            return {
              ...article,
              content: contentResult.content || article.description
            };
          } catch (error) {
            console.warn(`获取文章内容失败 ${article.link}:`, error);
            return article;
          }
        })
      );
    }
    
    console.log(`RSS解析完成，找到 ${articles.length} 篇文章`);
    
    return {
      success: true,
      feedInfo,
      articles
    };
    
  } catch (error) {
    console.error('RSS解析失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'RSS parsing failed'
    };
  }
};

// 检测RSS类型
const detectFeedType = (xmlText: string): 'rss' | 'atom' => {
  if (xmlText.includes('<feed') && xmlText.includes('xmlns="http://www.w3.org/2005/Atom"')) {
    return 'atom';
  }
  return 'rss';
};

// 解析RSS 2.0格式
const parseRSSFeed2 = (xmlText: string) => {
  // 提取频道信息
  const channelMatch = xmlText.match(/<channel[^>]*>([\s\S]*?)<\/channel>/i);
  if (!channelMatch) {
    throw new Error('无效的RSS格式：未找到channel元素');
  }
  
  const channelContent = channelMatch[1];
  
  // 提取频道基本信息
  const feedInfo = {
    title: extractXMLValue(channelContent, 'title') || 'Unknown Feed',
    description: extractXMLValue(channelContent, 'description') || '',
    link: extractXMLValue(channelContent, 'link') || '',
    lastUpdated: extractXMLValue(channelContent, 'lastBuildDate') || extractXMLValue(channelContent, 'pubDate')
  };
  
  // 提取文章列表
  const itemMatches = channelContent.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) || [];
  
  const articles = itemMatches.map((itemXML) => {
    const categories = extractMultipleXMLValues(itemXML, 'category');
    
    return {
      title: extractXMLValue(itemXML, 'title') || 'Untitled',
      link: extractXMLValue(itemXML, 'link') || '',
      description: cleanHTMLFromDescription(extractXMLValue(itemXML, 'description') || ''),
      pubDate: extractXMLValue(itemXML, 'pubDate'),
      author: extractXMLValue(itemXML, 'author') || extractXMLValue(itemXML, 'dc:creator'),
      categories: categories.length > 0 ? categories : undefined
    };
  });
  
  return { feedInfo, articles };
};

// 解析Atom格式
const parseAtomFeed = (xmlText: string) => {
  // 提取feed信息
  const feedInfo = {
    title: extractXMLValue(xmlText, 'title') || 'Unknown Feed',
    description: extractXMLValue(xmlText, 'subtitle') || extractXMLValue(xmlText, 'summary') || '',
    link: extractAtomLink(xmlText) || '',
    lastUpdated: extractXMLValue(xmlText, 'updated')
  };
  
  // 提取entry列表
  const entryMatches = xmlText.match(/<entry[^>]*>([\s\S]*?)<\/entry>/gi) || [];
  
  const articles = entryMatches.map((entryXML) => {
    const categories = extractMultipleXMLValues(entryXML, 'category', 'term');
    
    return {
      title: extractXMLValue(entryXML, 'title') || 'Untitled',
      link: extractAtomLink(entryXML) || '',
      description: cleanHTMLFromDescription(
        extractXMLValue(entryXML, 'summary') || 
        extractXMLValue(entryXML, 'content') || ''
      ),
      pubDate: extractXMLValue(entryXML, 'published') || extractXMLValue(entryXML, 'updated'),
      author: extractAtomAuthor(entryXML),
      categories: categories.length > 0 ? categories : undefined
    };
  });
  
  return { feedInfo, articles };
};

// 提取XML标签值
const extractXMLValue = (xml: string, tagName: string): string | undefined => {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? decodeHTMLEntities(match[1].trim()) : undefined;
};

// 提取多个相同标签的值
const extractMultipleXMLValues = (xml: string, tagName: string, attribute?: string): string[] => {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const matches = [];
  let match;
  
  while ((match = regex.exec(xml)) !== null) {
    if (attribute) {
      // 从属性中提取值
      const attrRegex = new RegExp(`${attribute}=["']([^"']+)["']`, 'i');
      const attrMatch = match[0].match(attrRegex);
      if (attrMatch) {
        matches.push(decodeHTMLEntities(attrMatch[1]));
      }
    } else {
      matches.push(decodeHTMLEntities(match[1].trim()));
    }
  }
  
  return matches;
};

// 提取Atom链接
const extractAtomLink = (xml: string): string | undefined => {
  // 查找 rel="alternate" 的链接
  let linkMatch = xml.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i);
  if (linkMatch) return linkMatch[1];
  
  // 查找第一个链接
  linkMatch = xml.match(/<link[^>]*href=["']([^"']+)["']/i);
  return linkMatch ? linkMatch[1] : undefined;
};

// 提取Atom作者
const extractAtomAuthor = (xml: string): string | undefined => {
  const authorMatch = xml.match(/<author[^>]*>([\s\S]*?)<\/author>/i);
  if (authorMatch) {
    const name = extractXMLValue(authorMatch[1], 'name');
    const email = extractXMLValue(authorMatch[1], 'email');
    return name || email;
  }
  return undefined;
};

// 清理描述中的HTML
const cleanHTMLFromDescription = (description: string): string => {
  return description
    .replace(/<[^>]*>/g, '') // 移除HTML标签
    .replace(/\s+/g, ' ') // 合并空白字符
    .trim()
    .substring(0, 500); // 限制长度
};

// 获取文章完整内容
const fetchFullArticleContent = async (articleUrl: string): Promise<{ content: string }> => {
  try {
    // 这里可以复用现有的fetchAndExtractTool逻辑
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // 简单的内容提取（可以复用fetchAndExtract工具的逻辑）
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000);
    
    return { content };
    
  } catch (error) {
    throw new Error(`获取文章内容失败: ${error}`);
  }
};

// 管理RSS订阅
const manageSubscriptions = async (context: {
  action: 'add' | 'remove' | 'list' | 'update';
  feedUrl?: string;
  feedName?: string;
  category?: string;
}) => {
  try {
    // 使用KV存储管理订阅列表
    const SUBSCRIPTIONS_KEY = 'rss_subscriptions';
    
    // @ts-ignore
    let subscriptions = await (globalThis.CACHE_KV || mockKV).get(SUBSCRIPTIONS_KEY, { type: 'json' }) || [];
    
    switch (context.action) {
      case 'add':
        if (!context.feedUrl || !context.feedName) {
          throw new Error('添加订阅需要提供URL和名称');
        }
        
        // 检查是否已存在
        const existingIndex = subscriptions.findIndex((sub: any) => sub.url === context.feedUrl);
        if (existingIndex !== -1) {
          subscriptions[existingIndex] = {
            ...subscriptions[existingIndex],
            name: context.feedName,
            category: context.category,
            lastChecked: new Date().toISOString(),
            status: 'active'
          };
        } else {
          subscriptions.push({
            name: context.feedName,
            url: context.feedUrl,
            category: context.category || 'default',
            lastChecked: new Date().toISOString(),
            status: 'active'
          });
        }
        break;
        
      case 'remove':
        if (!context.feedUrl) {
          throw new Error('移除订阅需要提供URL');
        }
        subscriptions = subscriptions.filter((sub: any) => sub.url !== context.feedUrl);
        break;
        
      case 'update':
        // 更新所有订阅的状态
        for (const subscription of subscriptions) {
          try {
            await parseRSSFeed(subscription.url, 1, false);
            subscription.status = 'active';
            subscription.lastChecked = new Date().toISOString();
          } catch (error) {
            subscription.status = 'error';
            subscription.lastError = error instanceof Error ? error.message : 'Unknown error';
          }
        }
        break;
        
      case 'list':
        // 直接返回当前列表
        break;
    }
    
    // 保存更新后的订阅列表
    if (context.action !== 'list') {
      // @ts-ignore
      await (globalThis.CACHE_KV || mockKV).put(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
    }
    
    return {
      success: true,
      subscriptions
    };
    
  } catch (error) {
    console.error('管理RSS订阅失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Subscription management failed'
    };
  }
};

// HTML实体解码
const decodeHTMLEntities = (text: string): string => {
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