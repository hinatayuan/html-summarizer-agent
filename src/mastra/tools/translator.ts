import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const translateTool = createTool({
  id: 'translate',
  description: '翻译文本内容，支持多种语言',
  inputSchema: z.object({
    text: z.string().describe('要翻译的文本'),
    targetLanguage: z.string().describe('目标语言代码 (如: zh-CN, en, ja, ko)'),
    sourceLanguage: z.string().optional().describe('源语言代码，留空自动检测')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    translatedText: z.string().optional(),
    detectedLanguage: z.string().optional(),
    confidence: z.number().optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await translateText(context.text, context.targetLanguage, context.sourceLanguage);
  },
});

export const detectLanguageTool = createTool({
  id: 'detect-language',
  description: '检测文本的语言',
  inputSchema: z.object({
    text: z.string().describe('要检测语言的文本')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    language: z.string().optional(),
    confidence: z.number().optional(),
    supportedLanguages: z.array(z.object({
      code: z.string(),
      name: z.string(),
      probability: z.number()
    })).optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await detectLanguage(context.text);
  },
});

export const batchTranslateTool = createTool({
  id: 'batch-translate',
  description: '批量翻译多段文本',
  inputSchema: z.object({
    texts: z.array(z.string()).describe('要翻译的文本数组'),
    targetLanguage: z.string().describe('目标语言代码'),
    sourceLanguage: z.string().optional().describe('源语言代码'),
    maxConcurrent: z.number().optional().default(3).describe('最大并发数')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    results: z.array(z.object({
      original: z.string(),
      translated: z.string(),
      success: z.boolean(),
      error: z.string().optional()
    })).optional(),
    totalProcessed: z.number().optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await batchTranslate(context.texts, context.targetLanguage, context.sourceLanguage, context.maxConcurrent);
  },
});

// 支持的语言列表
const SUPPORTED_LANGUAGES = {
  'zh-CN': { name: '简体中文', patterns: [/[\u4e00-\u9fa5]/] },
  'zh-TW': { name: '繁体中文', patterns: [/[\u4e00-\u9fa5]/] },
  'en': { name: 'English', patterns: [/[a-zA-Z]/] },
  'ja': { name: '日本語', patterns: [/[\u3040-\u309f\u30a0-\u30ff]/] },
  'ko': { name: '한국어', patterns: [/[\uac00-\ud7af]/] },
  'es': { name: 'Español', patterns: [/[a-zA-ZñáéíóúüÑÁÉÍÓÚÜ]/] },
  'fr': { name: 'Français', patterns: [/[a-zA-ZàâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/] },
  'de': { name: 'Deutsch', patterns: [/[a-zA-ZäöüßÄÖÜ]/] },
  'ru': { name: 'Русский', patterns: [/[\u0400-\u04ff]/] },
  'ar': { name: 'العربية', patterns: [/[\u0600-\u06ff]/] },
  'pt': { name: 'Português', patterns: [/[a-zA-ZãáàâäéêëíîïóôõöúûüçÃÁÀÂÄÉÊËÍÎÏÓÔÕÖÚÛÜÇ]/] },
  'it': { name: 'Italiano', patterns: [/[a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]/] },
  'hi': { name: 'हिन्दी', patterns: [/[\u0900-\u097f]/] },
  'th': { name: 'ไทย', patterns: [/[\u0e00-\u0e7f]/] },
  'vi': { name: 'Tiếng Việt', patterns: [/[a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/] }
};

// 翻译文本
const translateText = async (text: string, targetLang: string, sourceLang?: string) => {
  try {
    console.log(`翻译文本: ${text.substring(0, 100)}... -> ${targetLang}`);
    
    // 1. 检测源语言（如果未指定）
    let detectedLang = sourceLang;
    if (!sourceLang) {
      const detection = await detectLanguage(text);
      if (detection.success && detection.language) {
        detectedLang = detection.language;
      }
    }
    
    // 2. 检查是否需要翻译
    if (detectedLang === targetLang) {
      return {
        success: true,
        translatedText: text,
        detectedLanguage: detectedLang,
        confidence: 1.0
      };
    }
    
    // 3. 使用AI模型进行翻译
    let translatedText = '';
    let confidence = 0;
    
    try {
      // 优先使用DeepSeek进行翻译
      const aiTranslation = await translateWithAI(text, targetLang, detectedLang);
      translatedText = aiTranslation.text;
      confidence = aiTranslation.confidence;
    } catch (error) {
      console.warn('AI翻译失败，使用词典翻译:', error);
      // 降级到基础翻译
      const basicTranslation = await basicTranslate(text, targetLang, detectedLang);
      translatedText = basicTranslation.text;
      confidence = basicTranslation.confidence;
    }
    
    return {
      success: true,
      translatedText,
      detectedLanguage: detectedLang,
      confidence: Math.round(confidence * 100) / 100
    };
    
  } catch (error) {
    console.error('翻译失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Translation failed'
    };
  }
};

// 使用AI模型翻译
const translateWithAI = async (text: string, targetLang: string, sourceLang?: string): Promise<{text: string; confidence: number}> => {
  const targetLangName = SUPPORTED_LANGUAGES[targetLang as keyof typeof SUPPORTED_LANGUAGES]?.name || targetLang;
  const sourceLangName = sourceLang ? (SUPPORTED_LANGUAGES[sourceLang as keyof typeof SUPPORTED_LANGUAGES]?.name || sourceLang) : '自动检测';
  
  const prompt = `请将以下文本从${sourceLangName}翻译为${targetLangName}。请只返回翻译结果，不要包含任何解释或其他内容：

原文：${text}

译文：`;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: Math.min(text.length * 2, 4000),
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const translatedText = data.choices[0].message.content.trim();
  
  return {
    text: translatedText,
    confidence: 0.9 // AI翻译置信度较高
  };
};

// 基础翻译（降级方案）
const basicTranslate = async (text: string, targetLang: string, sourceLang?: string): Promise<{text: string; confidence: number}> => {
  // 简单的翻译逻辑，主要处理常见词汇
  const translations: Record<string, Record<string, string>> = {
    'en': {
      'hello': 'Hello',
      'world': 'World',
      'title': 'Title',
      'content': 'Content',
      'summary': 'Summary',
      'article': 'Article',
      'news': 'News'
    },
    'zh-CN': {
      'hello': '你好',
      'world': '世界',
      'title': '标题',
      'content': '内容',
      'summary': '摘要',
      'article': '文章',
      'news': '新闻'
    },
    'ja': {
      'hello': 'こんにちは',
      'world': '世界',
      'title': 'タイトル',
      'content': 'コンテンツ',
      'summary': '要約',
      'article': '記事',
      'news': 'ニュース'
    }
  };
  
  const targetDict = translations[targetLang] || {};
  let translatedText = text;
  
  // 简单的词汇替换
  Object.entries(targetDict).forEach(([key, value]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    translatedText = translatedText.replace(regex, value);
  });
  
  return {
    text: translatedText,
    confidence: 0.3 // 基础翻译置信度较低
  };
};

// 检测语言
const detectLanguage = async (text: string) => {
  try {
    const detectionResults: Array<{code: string; name: string; probability: number}> = [];
    
    // 基于字符特征检测语言
    for (const [code, info] of Object.entries(SUPPORTED_LANGUAGES)) {
      let matches = 0;
      let totalChars = 0;
      
      for (const pattern of info.patterns) {
        const patternMatches = (text.match(pattern) || []).length;
        matches += patternMatches;
      }
      
      totalChars = text.replace(/\s/g, '').length;
      const probability = totalChars > 0 ? matches / totalChars : 0;
      
      if (probability > 0) {
        detectionResults.push({
          code,
          name: info.name,
          probability: Math.round(probability * 100) / 100
        });
      }
    }
    
    // 排序并选择最可能的语言
    detectionResults.sort((a, b) => b.probability - a.probability);
    
    const topResult = detectionResults[0];
    
    if (!topResult || topResult.probability < 0.1) {
      // 如果检测置信度太低，默认为英语
      return {
        success: true,
        language: 'en',
        confidence: 0.5,
        supportedLanguages: detectionResults.slice(0, 5)
      };
    }
    
    return {
      success: true,
      language: topResult.code,
      confidence: topResult.probability,
      supportedLanguages: detectionResults.slice(0, 5)
    };
    
  } catch (error) {
    console.error('语言检测失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Language detection failed'
    };
  }
};

// 批量翻译
const batchTranslate = async (texts: string[], targetLang: string, sourceLang?: string, maxConcurrent: number = 3) => {
  try {
    console.log(`批量翻译 ${texts.length} 个文本`);
    
    const results = [];
    let processed = 0;
    
    // 分批处理，控制并发数
    for (let i = 0; i < texts.length; i += maxConcurrent) {
      const batch = texts.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (text) => {
        try {
          const result = await translateText(text, targetLang, sourceLang);
          return {
            original: text,
            translated: result.translatedText || text,
            success: result.success,
            error: result.error
          };
        } catch (error) {
          return {
            original: text,
            translated: text,
            success: false,
            error: error instanceof Error ? error.message : 'Translation failed'
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      processed += batchResults.length;
      
      console.log(`已处理 ${processed}/${texts.length} 个文本`);
      
      // 避免API速率限制
      if (i + maxConcurrent < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`批量翻译完成，成功: ${successCount}/${texts.length}`);
    
    return {
      success: true,
      results,
      totalProcessed: processed
    };
    
  } catch (error) {
    console.error('批量翻译失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Batch translation failed'
    };
  }
};

// 获取支持的语言列表
export const getSupportedLanguages = () => {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
    code,
    name: info.name
  }));
};

// 语言代码规范化
export const normalizeLanguageCode = (langCode: string): string => {
  const normalized = langCode.toLowerCase().replace('_', '-');
  
  // 常见语言代码映射
  const mappings: Record<string, string> = {
    'zh': 'zh-CN',
    'chinese': 'zh-CN',
    'english': 'en',
    'japanese': 'ja',
    'korean': 'ko',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'russian': 'ru',
    'arabic': 'ar'
  };
  
  return mappings[normalized] || normalized;
};