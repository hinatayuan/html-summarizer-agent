import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const cacheGetTool = createTool({
  id: 'cache-get',
  description: '从缓存中获取已处理的内容',
  inputSchema: z.object({
    key: z.string().describe('缓存键名'),
    url: z.string().optional().describe('原始URL，用于生成缓存键')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.any().optional(),
    cached: z.boolean(),
    cacheAge: z.number().optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const cacheKey = context.key || generateCacheKey(context.url!);
    return await getCachedContent(cacheKey);
  },
});

export const cacheSetTool = createTool({
  id: 'cache-set', 
  description: '将处理结果保存到缓存',
  inputSchema: z.object({
    key: z.string().describe('缓存键名'),
    data: z.any().describe('要缓存的数据'),
    url: z.string().optional().describe('原始URL，用于生成缓存键'),
    ttl: z.number().optional().default(86400).describe('缓存过期时间（秒），默认24小时')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    key: z.string(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const cacheKey = context.key || generateCacheKey(context.url!);
    return await setCachedContent(cacheKey, context.data, context.ttl);
  },
});

export const cacheInvalidateTool = createTool({
  id: 'cache-invalidate',
  description: '清除指定的缓存内容',
  inputSchema: z.object({
    key: z.string().optional().describe('缓存键名'),
    url: z.string().optional().describe('原始URL'),
    pattern: z.string().optional().describe('批量清除的模式')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    deletedCount: z.number().optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    if (context.pattern) {
      return await invalidateCacheByPattern(context.pattern);
    }
    const cacheKey = context.key || generateCacheKey(context.url!);
    return await invalidateCache(cacheKey);
  },
});

// 生成缓存键
const generateCacheKey = (url: string, type: string = 'summary'): string => {
  // 使用URL哈希生成唯一键名
  const urlHash = simpleHash(url);
  const timestamp = Math.floor(Date.now() / 3600000); // 按小时分组
  return `${type}:${urlHash}:${timestamp}`;
};

// 获取缓存内容
const getCachedContent = async (cacheKey: string) => {
  try {
    // 在Cloudflare Workers环境中，使用KV存储
    // @ts-ignore - Cloudflare Workers全局变量
    const cachedData = await (globalThis.CACHE_KV || mockKV).get(cacheKey, { type: 'json' });
    
    if (!cachedData) {
      return {
        success: true,
        cached: false
      };
    }
    
    // 检查是否过期
    const now = Date.now();
    const cacheAge = (now - cachedData.timestamp) / 1000; // 秒
    const isExpired = cachedData.ttl && cacheAge > cachedData.ttl;
    
    if (isExpired) {
      console.log(`缓存已过期: ${cacheKey}, 年龄: ${cacheAge}秒`);
      return {
        success: true,
        cached: false,
        cacheAge
      };
    }
    
    console.log(`缓存命中: ${cacheKey}, 年龄: ${cacheAge}秒`);
    return {
      success: true,
      data: cachedData.content,
      cached: true,
      cacheAge
    };
    
  } catch (error) {
    console.error('获取缓存失败:', error);
    return {
      success: false,
      cached: false,
      error: error instanceof Error ? error.message : 'Cache get failed'
    };
  }
};

// 设置缓存内容
const setCachedContent = async (cacheKey: string, data: any, ttl: number = 86400) => {
  try {
    const cacheData = {
      content: data,
      timestamp: Date.now(),
      ttl: ttl
    };
    
    // 在Cloudflare Workers环境中，使用KV存储
    // @ts-ignore - Cloudflare Workers全局变量
    await (globalThis.CACHE_KV || mockKV).put(cacheKey, JSON.stringify(cacheData), {
      expirationTtl: ttl
    });
    
    console.log(`缓存已设置: ${cacheKey}, TTL: ${ttl}秒`);
    return {
      success: true,
      key: cacheKey
    };
    
  } catch (error) {
    console.error('设置缓存失败:', error);
    return {
      success: false,
      key: cacheKey,
      error: error instanceof Error ? error.message : 'Cache set failed'
    };
  }
};

// 清除单个缓存
const invalidateCache = async (cacheKey: string) => {
  try {
    // @ts-ignore - Cloudflare Workers全局变量
    await (globalThis.CACHE_KV || mockKV).delete(cacheKey);
    
    console.log(`缓存已清除: ${cacheKey}`);
    return {
      success: true,
      deletedCount: 1
    };
    
  } catch (error) {
    console.error('清除缓存失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cache invalidation failed'
    };
  }
};

// 按模式批量清除缓存
const invalidateCacheByPattern = async (pattern: string) => {
  try {
    // 注意：KV存储不支持通配符删除，这里提供模拟实现
    // 在实际使用中，可能需要维护键名列表或使用其他策略
    
    console.log(`批量清除缓存模式: ${pattern}`);
    
    // 模拟批量删除
    let deletedCount = 0;
    
    // 在实际实现中，你可能需要：
    // 1. 维护所有键名的列表
    // 2. 使用前缀匹配策略
    // 3. 或者定期全量清理过期缓存
    
    return {
      success: true,
      deletedCount
    };
    
  } catch (error) {
    console.error('批量清除缓存失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Batch cache invalidation failed'
    };
  }
};

// 缓存统计工具
export const getCacheStats = async (): Promise<{
  totalKeys: number;
  memoryUsage: string;
  hitRate: number;
}> => {
  try {
    // 在实际环境中，从KV存储获取统计信息
    // 这里提供模拟数据
    return {
      totalKeys: 150,
      memoryUsage: '2.5MB',
      hitRate: 0.73
    };
  } catch (error) {
    console.error('获取缓存统计失败:', error);
    return {
      totalKeys: 0,
      memoryUsage: '0MB', 
      hitRate: 0
    };
  }
};

// 智能缓存策略
export const shouldCache = (url: string, contentLength: number): boolean => {
  // 缓存策略：
  // 1. 内容长度大于500字符
  // 2. 不是动态参数很多的URL
  // 3. 不是API端点
  
  if (contentLength < 500) {
    return false;
  }
  
  // 检查URL是否包含很多查询参数（可能是动态内容）
  const urlObj = new URL(url);
  const paramCount = Array.from(urlObj.searchParams).length;
  if (paramCount > 5) {
    return false;
  }
  
  // 排除API端点
  const apiPatterns = ['/api/', '/v1/', '/v2/', '.json', '.xml'];
  if (apiPatterns.some(pattern => url.includes(pattern))) {
    return false;
  }
  
  return true;
};

// 缓存预热功能
export const warmupCache = async (urls: string[]): Promise<{ success: boolean; processed: number }> => {
  let processed = 0;
  
  try {
    for (const url of urls) {
      // 检查缓存是否已存在
      const cacheKey = generateCacheKey(url);
      const cached = await getCachedContent(cacheKey);
      
      if (!cached.cached) {
        // 触发内容提取和缓存
        console.log(`预热缓存: ${url}`);
        // 这里可以调用主要的内容提取流程
        processed++;
      }
    }
    
    return { success: true, processed };
    
  } catch (error) {
    console.error('缓存预热失败:', error);
    return { success: false, processed };
  }
};

// 简单哈希函数
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// Mock KV for development
const mockKV = {
  async get(key: string, options?: { type?: 'json' | 'text' }) {
    // 开发环境模拟
    const mockData = {
      'summary:abc123:123456': {
        content: {
          title: 'Mock Cached Title',
          summary: 'This is a mock cached summary',
          keywords: ['mock', 'cache', 'test']
        },
        timestamp: Date.now() - 3600000, // 1小时前
        ttl: 86400
      }
    };
    
    const data = mockData[key as keyof typeof mockData];
    return data ? (options?.type === 'json' ? data : JSON.stringify(data)) : null;
  },
  
  async put(key: string, value: string, options?: { expirationTtl?: number }) {
    console.log(`Mock KV PUT: ${key}`, { ttl: options?.expirationTtl });
    return;
  },
  
  async delete(key: string) {
    console.log(`Mock KV DELETE: ${key}`);
    return;
  }
};