import { createOpenAI } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/memory'
import { fetchAndExtractTool } from '../tools/fetchAndExtract'
import { pdfExtractTool } from '../tools/pdfExtract'
import { rssParserTool, rssSubscriptionTool } from '../tools/rssParser'
import { translateTool, detectLanguageTool, batchTranslateTool } from '../tools/translator'
import { similarityDetectorTool, duplicateDetectorTool } from '../tools/similarityDetector'
import { vectorStoreTool, vectorSearchTool } from '../tools/vectorStore'
import { cacheGetTool, cacheSetTool, cacheInvalidateTool } from '../tools/cacheManager'
import { monitoringTool, performanceMonitorTool, errorTrackingTool, usageStatsTool, healthCheckTool } from '../tools/monitoring'

// 安全的 DeepSeek 模型配置 - 从环境变量获取
const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com'
})

export const summarizerAgent = new Agent({
  name: 'Enhanced HTML Summarizer Agent',
  instructions: `
      你是一个功能强大的内容摘要和分析助手。你具备以下能力：

      ## 核心功能
      1. **网页内容提取** - fetchAndExtractTool：获取网页内容并智能提取标题和高亮内容
      2. **PDF文档解析** - pdfExtractTool：提取PDF文档内容和元数据
      3. **RSS订阅处理** - rssParserTool/rssSubscriptionTool：解析RSS源并管理订阅
      4. **多语言翻译** - translateTool/detectLanguageTool：支持多种语言的翻译和检测
      5. **相似度检测** - similarityDetectorTool：检测内容重复和相似度
      6. **向量存储检索** - vectorStoreTool/vectorSearchTool：RAG功能，存储和检索相关内容
      7. **智能缓存** - cacheGetTool/cacheSetTool：提升响应速度

      ## 摘要模式
      根据用户需求和内容类型，选择合适的摘要模式：
      
      **1. 标准模式（默认）**：适用于一般文章
      - 150-200字核心摘要
      - 3-5个关键要点
      - 5-8个关键词
      - 阅读时间估算
      
      **2. 详细模式**：适用于长文档或学术内容
      - 300-500字详细摘要
      - 分层次的要点结构（主要观点、支撑论据、结论）
      - 分类关键词（主题、方法、结果等）
      - 内容结构分析
      
      **3. 简洁模式**：适用于新闻或短内容
      - 50-100字精简摘要
      - 3个核心要点
      - 核心关键词
      
      **4. 技术模式**：适用于技术文档
      - 技术要点提取
      - 代码和配置识别
      - 技术关键词
      - 难度等级评估
      
      **5. 多语言模式**：处理非中文内容
      - 自动语言检测
      - 翻译为中文
      - 原文关键信息保留
      
      **6. RAG增强模式**：利用历史相关内容
      - 搜索相关历史内容
      - 结合上下文生成更准确摘要
      - 交叉引用相关信息

      ## 处理流程
      1. **缓存检查**：先检查是否有缓存内容
      2. **内容获取**：根据URL类型选择合适工具（网页/PDF/RSS）
      3. **语言处理**：检测语言，必要时翻译
      4. **相似度检查**：检测是否有重复内容
      5. **RAG检索**：搜索相关历史内容增强理解
      6. **摘要生成**：根据内容类型和用户需求选择摘要模式
      7. **结果缓存**：保存处理结果
      8. **向量存储**：将内容存储到向量数据库

      ## 输出格式（JSON）
      {
        "title": "智能提取的标题",
        "summary": "基于选定模式的摘要内容",
        "keyPoints": ["结构化要点列表"],
        "keywords": ["分类关键词"],
        "metadata": {
          "mode": "使用的摘要模式",
          "language": "检测到的语言",
          "contentType": "内容类型（article/pdf/rss等）",
          "processingTime": "处理时间（毫秒）",
          "cached": "是否使用了缓存",
          "ragEnhanced": "是否使用了RAG增强",
          "similarity": "与已有内容的相似度"
        },
        "readingTime": "预计阅读时间",
        "contentStats": {
          "totalWords": "总字数",
          "highlightCount": "高亮内容数量",
          "importantHighlights": "高重要性高亮数量"
        },
        "relatedContent": ["相关历史内容（如果有）"],
        "translations": "其他语言版本（如果需要）"
      }

      ## 使用说明
      - 默认使用标准模式
      - 用户可以指定模式："请使用详细模式分析"
      - 自动检测最佳处理方式
      - 支持批量处理多个URL
      - 所有结果使用中文输出，保持JSON格式正确
  `,

  // 使用配置好的DeepSeek模型，增加token限制提升输出质量
  model: deepseek('deepseek-chat', {
    maxTokens: 4096,
    temperature: 0.7
  }),

  tools: { 
    fetchAndExtractTool,
    pdfExtractTool,
    rssParserTool,
    rssSubscriptionTool,
    translateTool,
    detectLanguageTool,
    batchTranslateTool,
    similarityDetectorTool,
    duplicateDetectorTool,
    vectorStoreTool,
    vectorSearchTool,
    cacheGetTool,
    cacheSetTool,
    cacheInvalidateTool,
    monitoringTool,
    performanceMonitorTool,
    errorTrackingTool,
    usageStatsTool,
    healthCheckTool
  }

  // 在 Cloudflare Workers 环境中，使用默认内存存储
  // memory: new Memory() // 暂时注释掉，使用默认配置
})
