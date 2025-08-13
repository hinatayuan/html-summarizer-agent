import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const similarityDetectorTool = createTool({
  id: 'similarity-detector',
  description: '检测两个文档或文本的相似度',
  inputSchema: z.object({
    text1: z.string().describe('第一个文本'),
    text2: z.string().describe('第二个文本'),
    method: z.enum(['cosine', 'jaccard', 'levenshtein', 'semantic']).optional().default('cosine').describe('相似度计算方法')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    similarity: z.number().optional(),
    method: z.string().optional(),
    details: z.object({
      commonWords: z.number().optional(),
      totalWords: z.number().optional(),
      textLength1: z.number().optional(),
      textLength2: z.number().optional(),
      semanticScore: z.number().optional()
    }).optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await calculateSimilarity(context.text1, context.text2, context.method);
  },
});

export const duplicateDetectorTool = createTool({
  id: 'duplicate-detector',
  description: '在文档集合中检测重复或近似重复的内容',
  inputSchema: z.object({
    documents: z.array(z.object({
      id: z.string(),
      content: z.string(),
      title: z.string().optional()
    })).describe('文档集合'),
    threshold: z.number().optional().default(0.8).describe('相似度阈值，超过此值认为是重复'),
    method: z.enum(['cosine', 'jaccard', 'semantic']).optional().default('cosine')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    duplicateGroups: z.array(z.object({
      documents: z.array(z.string()),
      similarity: z.number(),
      representative: z.string()
    })).optional(),
    uniqueDocuments: z.array(z.string()).optional(),
    totalProcessed: z.number().optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await detectDuplicates(context.documents, context.threshold, context.method);
  },
});

export const contentFingerprintTool = createTool({
  id: 'content-fingerprint',
  description: '为内容生成指纹用于快速重复检测',
  inputSchema: z.object({
    content: z.string().describe('要生成指纹的内容'),
    method: z.enum(['simhash', 'minhash', 'shingle']).optional().default('simhash').describe('指纹算法')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    fingerprint: z.string().optional(),
    method: z.string().optional(),
    contentLength: z.number().optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await generateContentFingerprint(context.content, context.method);
  },
});

// 计算两个文本的相似度
const calculateSimilarity = async (text1: string, text2: string, method: string = 'cosine') => {
  try {
    console.log(`计算文本相似度，方法: ${method}`);
    
    // 预处理文本
    const processed1 = preprocessText(text1);
    const processed2 = preprocessText(text2);
    
    let similarity = 0;
    let details: any = {
      textLength1: text1.length,
      textLength2: text2.length
    };
    
    switch (method) {
      case 'cosine':
        similarity = calculateCosineSimilarity(processed1, processed2);
        details.commonWords = getCommonWords(processed1, processed2).length;
        details.totalWords = new Set([...processed1.split(/\s+/), ...processed2.split(/\s+/)]).size;
        break;
        
      case 'jaccard':
        similarity = calculateJaccardSimilarity(processed1, processed2);
        const words1 = new Set(processed1.split(/\s+/));
        const words2 = new Set(processed2.split(/\s+/));
        details.commonWords = new Set([...words1].filter(x => words2.has(x))).size;
        details.totalWords = new Set([...words1, ...words2]).size;
        break;
        
      case 'levenshtein':
        similarity = 1 - (calculateLevenshteinDistance(text1, text2) / Math.max(text1.length, text2.length));
        break;
        
      case 'semantic':
        similarity = await calculateSemanticSimilarity(text1, text2);
        details.semanticScore = similarity;
        break;
        
      default:
        throw new Error(`不支持的相似度计算方法: ${method}`);
    }
    
    return {
      success: true,
      similarity: Math.round(similarity * 10000) / 10000, // 保留4位小数
      method,
      details
    };
    
  } catch (error) {
    console.error('相似度计算失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Similarity calculation failed'
    };
  }
};

// 检测重复文档
const detectDuplicates = async (documents: Array<{id: string; content: string; title?: string}>, threshold: number = 0.8, method: string = 'cosine') => {
  try {
    console.log(`检测 ${documents.length} 个文档的重复内容，阈值: ${threshold}`);
    
    const duplicateGroups: Array<{documents: string[]; similarity: number; representative: string}> = [];
    const processed = new Set<string>();
    const uniqueDocuments: string[] = [];
    
    for (let i = 0; i < documents.length; i++) {
      if (processed.has(documents[i].id)) continue;
      
      const currentGroup = [documents[i].id];
      let maxSimilarity = 0;
      
      for (let j = i + 1; j < documents.length; j++) {
        if (processed.has(documents[j].id)) continue;
        
        const similarityResult = await calculateSimilarity(
          documents[i].content,
          documents[j].content,
          method
        );
        
        if (similarityResult.success && similarityResult.similarity! >= threshold) {
          currentGroup.push(documents[j].id);
          processed.add(documents[j].id);
          maxSimilarity = Math.max(maxSimilarity, similarityResult.similarity!);
        }
      }
      
      processed.add(documents[i].id);
      
      if (currentGroup.length > 1) {
        // 找到重复组
        duplicateGroups.push({
          documents: currentGroup,
          similarity: maxSimilarity,
          representative: documents[i].id // 使用第一个作为代表
        });
      } else {
        // 唯一文档
        uniqueDocuments.push(documents[i].id);
      }
    }
    
    console.log(`检测完成，发现 ${duplicateGroups.length} 个重复组，${uniqueDocuments.length} 个唯一文档`);
    
    return {
      success: true,
      duplicateGroups,
      uniqueDocuments,
      totalProcessed: documents.length
    };
    
  } catch (error) {
    console.error('重复检测失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Duplicate detection failed'
    };
  }
};

// 生成内容指纹
const generateContentFingerprint = async (content: string, method: string = 'simhash') => {
  try {
    console.log(`生成内容指纹，方法: ${method}, 长度: ${content.length}`);
    
    let fingerprint = '';
    
    switch (method) {
      case 'simhash':
        fingerprint = generateSimhash(content);
        break;
        
      case 'minhash':
        fingerprint = generateMinhash(content);
        break;
        
      case 'shingle':
        fingerprint = generateShingleHash(content);
        break;
        
      default:
        throw new Error(`不支持的指纹算法: ${method}`);
    }
    
    return {
      success: true,
      fingerprint,
      method,
      contentLength: content.length
    };
    
  } catch (error) {
    console.error('指纹生成失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fingerprint generation failed'
    };
  }
};

// 预处理文本
const preprocessText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ') // 保留中文字符
    .replace(/\s+/g, ' ')
    .trim();
};

// 余弦相似度
const calculateCosineSimilarity = (text1: string, text2: string): number => {
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);
  
  // 创建词频向量
  const allWords = new Set([...words1, ...words2]);
  const vector1: number[] = [];
  const vector2: number[] = [];
  
  for (const word of allWords) {
    vector1.push(words1.filter(w => w === word).length);
    vector2.push(words2.filter(w => w === word).length);
  }
  
  // 计算余弦相似度
  const dotProduct = vector1.reduce((sum, a, i) => sum + a * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, a) => sum + a * a, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, a) => sum + a * a, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
};

// Jaccard相似度
const calculateJaccardSimilarity = (text1: string, text2: string): number => {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
};

// Levenshtein距离
const calculateLevenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

// 语义相似度（使用embedding）
const calculateSemanticSimilarity = async (text1: string, text2: string): Promise<number> => {
  try {
    // 这里可以集成向量数据库中的embedding功能
    // 简化版本：基于关键词重叠度
    const keywords1 = extractKeywords(text1);
    const keywords2 = extractKeywords(text2);
    
    const commonKeywords = keywords1.filter(kw => keywords2.includes(kw));
    const totalKeywords = new Set([...keywords1, ...keywords2]).size;
    
    return totalKeywords === 0 ? 0 : commonKeywords.length / totalKeywords;
    
  } catch (error) {
    console.warn('语义相似度计算失败，使用基础方法:', error);
    return calculateJaccardSimilarity(text1, text2);
  }
};

// 提取关键词
const extractKeywords = (text: string): string[] => {
  const words = preprocessText(text).split(/\s+/);
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by']);
  
  // 词频统计
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    if (word.length > 2 && !stopWords.has(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  });
  
  // 返回高频词作为关键词
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);
};

// 获取共同词汇
const getCommonWords = (text1: string, text2: string): string[] => {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  return [...words1].filter(word => words2.has(word));
};

// SimHash指纹生成
const generateSimhash = (content: string): string => {
  const words = preprocessText(content).split(/\s+/);
  const hashBits = 64;
  const vector = new Array(hashBits).fill(0);
  
  words.forEach(word => {
    const hash = simpleHash(word);
    for (let i = 0; i < hashBits; i++) {
      const bit = (hash >> i) & 1;
      vector[i] += bit ? 1 : -1;
    }
  });
  
  // 转换为二进制字符串
  return vector.map(v => v >= 0 ? '1' : '0').join('');
};

// MinHash指纹生成
const generateMinhash = (content: string): string => {
  const words = new Set(preprocessText(content).split(/\s+/));
  const numHashes = 128;
  const minHashes: number[] = [];
  
  for (let i = 0; i < numHashes; i++) {
    let minHash = Infinity;
    for (const word of words) {
      const hash = simpleHash(word + i); // 使用不同的盐值
      minHash = Math.min(minHash, hash);
    }
    minHashes.push(minHash);
  }
  
  // 转换为十六进制字符串
  return minHashes.map(h => h.toString(16).padStart(8, '0')).join('').substring(0, 32);
};

// Shingle Hash指纹生成
const generateShingleHash = (content: string, shingleSize: number = 3): string => {
  const text = preprocessText(content);
  const shingles = new Set<string>();
  
  // 生成字符级shingle
  for (let i = 0; i <= text.length - shingleSize; i++) {
    shingles.add(text.substring(i, i + shingleSize));
  }
  
  // 对shingles进行哈希并取最小值
  let minHash = Infinity;
  for (const shingle of shingles) {
    const hash = simpleHash(shingle);
    minHash = Math.min(minHash, hash);
  }
  
  return minHash.toString(16).padStart(8, '0');
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

// 批量相似度比较
export const batchSimilarityCheck = async (
  baseDocument: string,
  documents: string[],
  threshold: number = 0.7,
  method: string = 'cosine'
): Promise<Array<{index: number; similarity: number; isMatch: boolean}>> => {
  const results = [];
  
  for (let i = 0; i < documents.length; i++) {
    const result = await calculateSimilarity(baseDocument, documents[i], method);
    const similarity = result.success ? result.similarity! : 0;
    
    results.push({
      index: i,
      similarity,
      isMatch: similarity >= threshold
    });
  }
  
  return results.sort((a, b) => b.similarity - a.similarity);
};