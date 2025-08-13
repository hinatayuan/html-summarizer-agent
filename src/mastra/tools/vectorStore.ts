import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const vectorStoreTool = createTool({
  id: 'vector-store',
  description: '将文档内容存储到向量数据库，用于RAG检索',
  inputSchema: z.object({
    content: z.string().describe('要存储的文档内容'),
    url: z.string().describe('文档来源URL'),
    title: z.string().describe('文档标题'),
    metadata: z.object({
      keywords: z.array(z.string()).optional(),
      category: z.string().optional(),
      language: z.string().optional(),
      extractedAt: z.string().optional()
    }).optional()
  }),
  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await storeDocument(context);
  },
});

export const vectorSearchTool = createTool({
  id: 'vector-search',
  description: '在向量数据库中搜索相关文档内容',
  inputSchema: z.object({
    query: z.string().describe('搜索查询'),
    limit: z.number().optional().default(5).describe('返回结果数量限制')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    results: z.array(z.object({
      content: z.string(),
      url: z.string(),
      title: z.string(),
      similarity: z.number(),
      metadata: z.any().optional()
    })).optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await searchDocuments(context.query, context.limit);
  },
});

// 文档存储到向量数据库
const storeDocument = async (doc: {
  content: string;
  url: string;
  title: string;
  metadata?: any;
}) => {
  try {
    // 文档分块处理
    const chunks = splitTextIntoChunks(doc.content);
    const results = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = `${generateDocumentId(doc.url)}_chunk_${i}`;
      
      // 生成embedding向量
      const embedding = await generateEmbedding(chunk);
      
      // 存储到Cloudflare Vectorize (模拟实现)
      const storeResult = await storeToVectorize({
        id: chunkId,
        values: embedding,
        metadata: {
          content: chunk,
          url: doc.url,
          title: doc.title,
          chunkIndex: i,
          totalChunks: chunks.length,
          ...doc.metadata
        }
      });
      
      results.push(storeResult);
    }
    
    console.log(`文档已分块存储，共${chunks.length}个片段`);
    
    return {
      success: true,
      id: generateDocumentId(doc.url),
      chunks: results.length
    };
    
  } catch (error) {
    console.error('向量存储失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// 搜索相关文档
const searchDocuments = async (query: string, limit: number = 5) => {
  try {
    // 生成查询向量
    const queryEmbedding = await generateEmbedding(query);
    
    // 在Vectorize中搜索
    const searchResults = await searchInVectorize(queryEmbedding, limit * 2); // 多取一些然后去重
    
    // 按文档分组并计算相似度
    const documentMap = new Map<string, any>();
    
    searchResults.forEach(result => {
      const url = result.metadata.url;
      if (!documentMap.has(url)) {
        documentMap.set(url, {
          content: result.metadata.content,
          url: result.metadata.url,
          title: result.metadata.title,
          similarity: result.similarity,
          chunks: [result],
          metadata: result.metadata
        });
      } else {
        const doc = documentMap.get(url);
        doc.chunks.push(result);
        // 取最高相似度
        doc.similarity = Math.max(doc.similarity, result.similarity);
        // 合并内容
        if (doc.content.length < 2000) {
          doc.content += ' ' + result.metadata.content;
        }
      }
    });
    
    // 转换为数组并排序
    const results = Array.from(documentMap.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(doc => ({
        content: doc.content.substring(0, 1000), // 限制长度
        url: doc.url,
        title: doc.title,
        similarity: Math.round(doc.similarity * 100) / 100,
        metadata: {
          chunks: doc.chunks.length,
          category: doc.metadata.category,
          language: doc.metadata.language
        }
      }));
    
    return {
      success: true,
      results
    };
    
  } catch (error) {
    console.error('向量搜索失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// 文本分块函数
const splitTextIntoChunks = (text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] => {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + maxChunkSize;
    
    // 如果不是最后一块，尝试在句号、问号、感叹号处分割
    if (end < text.length) {
      const sentenceEnd = text.substring(start, end).lastIndexOf('。');
      const questionEnd = text.substring(start, end).lastIndexOf('？');
      const exclamationEnd = text.substring(start, end).lastIndexOf('！');
      
      const breakPoints = [sentenceEnd, questionEnd, exclamationEnd].filter(pos => pos > 0);
      if (breakPoints.length > 0) {
        end = start + Math.max(...breakPoints) + 1;
      }
    }
    
    chunks.push(text.substring(start, end).trim());
    start = Math.max(start + maxChunkSize - overlap, end);
  }
  
  return chunks.filter(chunk => chunk.length > 50); // 过滤掉太短的块
};

// 生成embedding向量 (使用DeepSeek的embedding模型)
const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    // 使用DeepSeek的文本embedding API
    const response = await fetch('https://api.deepseek.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-embed',
        input: text,
        encoding_format: 'float'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
    
  } catch (error) {
    console.error('生成embedding失败:', error);
    // 降级到简单的词频向量 (用于开发测试)
    return generateSimpleEmbedding(text);
  }
};

// 简单的词频向量生成 (降级方案)
const generateSimpleEmbedding = (text: string): number[] => {
  const words = text.toLowerCase().match(/[\w\u4e00-\u9fa5]+/g) || [];
  const wordCount = new Map<string, number>();
  
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });
  
  // 生成1536维向量 (与embedding模型保持一致)
  const vector = new Array(1536).fill(0);
  let index = 0;
  
  for (const [word, count] of wordCount.entries()) {
    const hash = simpleHash(word) % 1536;
    vector[hash] = Math.min(vector[hash] + count / words.length, 1);
  }
  
  return vector;
};

// 简单哈希函数
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash);
};

// 存储到Cloudflare Vectorize
const storeToVectorize = async (vector: {
  id: string;
  values: number[];
  metadata: any;
}) => {
  try {
    // 在实际部署时，这里会调用Cloudflare Vectorize API
    // 现在使用模拟存储到KV
    const vectorData = {
      id: vector.id,
      values: vector.values,
      metadata: vector.metadata,
      timestamp: Date.now()
    };
    
    // 模拟存储操作
    console.log(`存储向量 ${vector.id}, 维度: ${vector.values.length}`);
    
    return { success: true, id: vector.id };
    
  } catch (error) {
    console.error('Vectorize存储失败:', error);
    throw error;
  }
};

// 在Vectorize中搜索
const searchInVectorize = async (queryVector: number[], limit: number) => {
  try {
    // 在实际部署时，这里会调用Vectorize搜索API
    // 现在返回模拟结果
    const mockResults = [
      {
        id: 'doc1_chunk_0',
        similarity: 0.85,
        metadata: {
          content: '这是一个示例文档片段，展示了向量搜索的功能...',
          url: 'https://example.com/doc1',
          title: '示例文档1',
          category: 'technology'
        }
      },
      {
        id: 'doc2_chunk_0', 
        similarity: 0.78,
        metadata: {
          content: '另一个相关的文档内容，包含了用户查询的相关信息...',
          url: 'https://example.com/doc2',
          title: '示例文档2',
          category: 'tutorial'
        }
      }
    ];
    
    console.log(`搜索完成，找到 ${mockResults.length} 个相关结果`);
    return mockResults.slice(0, limit);
    
  } catch (error) {
    console.error('Vectorize搜索失败:', error);
    throw error;
  }
};

// 生成文档ID
const generateDocumentId = (url: string): string => {
  return `doc_${simpleHash(url)}`; 
};