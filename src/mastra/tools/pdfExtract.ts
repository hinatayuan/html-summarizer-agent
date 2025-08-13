import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const pdfExtractTool = createTool({
  id: 'pdf-extract',
  description: '提取PDF文档内容并解析文本和元数据',
  inputSchema: z.object({
    url: z.string().describe('PDF文档的URL地址或base64数据'),
    maxPages: z.number().optional().default(50).describe('最大处理页数，默认50页'),
    isBase64: z.boolean().optional().default(false).describe('是否为base64编码数据')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    url: z.string(),
    title: z.string(),
    content: z.string(),
    pageCount: z.number(),
    wordCount: z.number(),
    metadata: z.object({
      author: z.string().optional(),
      subject: z.string().optional(),
      creator: z.string().optional(),
      creationDate: z.string().optional(),
      modificationDate: z.string().optional()
    }).optional(),
    extractedAt: z.string(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    return await extractPDFContent(context.url, context.maxPages, context.isBase64);
  },
});

// PDF内容提取函数 - 使用PDFLib在Edge环境中解析
const extractPDFContent = async (url: string, maxPages: number = 50, isBase64: boolean = false) => {
  try {
    console.log(`正在获取PDF文档: ${isBase64 ? 'Base64数据' : url}`);
    
    let pdfBytes: ArrayBuffer;
    
    if (isBase64) {
      // 处理base64数据
      if (url.startsWith('data:application/pdf;base64,')) {
        const base64Data = url.split(',')[1];
        pdfBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
      } else {
        throw new Error('无效的base64 PDF格式');
      }
    } else {
      // 获取PDF文件
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/pdf,*/*',
          'Cache-Control': 'no-cache'
        },
        timeout: 30000 // 30秒超时，PDF可能较大
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      pdfBytes = await response.arrayBuffer();
    }

    // 验证内容类型（仅对URL进行验证）
    if (!isBase64) {
      const contentType = (response as Response).headers.get('content-type') || '';
      if (!contentType.includes('application/pdf') && !url.toLowerCase().endsWith('.pdf')) {
        throw new Error('URL指向的不是PDF文件');
      }
    }

    console.log('PDF文件大小:', pdfBytes.byteLength, 'bytes');

    // 使用简单的PDF文本提取（适用于Edge环境）
    const extractionResult = await extractPDFText(pdfBytes, maxPages);
    
    return {
      success: true,
      url,
      title: extractionResult.title || extractTitleFromUrl(url),
      content: extractionResult.text,
      pageCount: extractionResult.pageCount,
      wordCount: extractionResult.text.split(/\s+/).filter(word => word.length > 0).length,
      metadata: extractionResult.metadata,
      extractedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('PDF内容提取失败:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('fetch')) {
        errorMessage = '无法下载PDF文件，可能是网络问题或文件不存在';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'PDF文件下载超时，文件可能过大';
      } else if (error.message.includes('HTTP 403')) {
        errorMessage = 'PDF文件访问被拒绝，可能需要权限';
      } else if (error.message.includes('HTTP 404')) {
        errorMessage = 'PDF文件未找到';
      }
    }
    
    return {
      success: false,
      url,
      title: '',
      content: '',
      pageCount: 0,
      wordCount: 0,
      extractedAt: new Date().toISOString(),
      error: errorMessage
    };
  }
};

// 简化的PDF文本提取（适用于Edge环境）
const extractPDFText = async (pdfBuffer: ArrayBuffer, maxPages: number): Promise<{
  text: string;
  title?: string;
  pageCount: number;
  metadata?: any;
}> => {
  try {
    // 由于Cloudflare Workers环境限制，这里使用基础的PDF解析
    // 在实际部署时，可以考虑使用专门的PDF服务API
    
    // 将ArrayBuffer转换为Uint8Array进行基础解析
    const uint8Array = new Uint8Array(pdfBuffer);
    const pdfText = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    
    // 基础的PDF内容提取（简化版）
    let extractedText = '';
    let pageCount = 0;
    let title = '';
    
    // 查找PDF中的文本流
    const textObjects = [];
    let currentPos = 0;
    
    // 查找文本对象模式
    const textPattern = /\((.*?)\)\s*Tj/g;
    const titlePattern = /\/Title\s*\((.*?)\)/;
    const pagePattern = /\/Type\s*\/Page[^}]*/g;
    
    // 提取标题
    const titleMatch = pdfText.match(titlePattern);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }
    
    // 计算页数
    const pageMatches = pdfText.match(pagePattern);
    pageCount = pageMatches ? Math.min(pageMatches.length, maxPages) : 1;
    
    // 提取文本内容
    let match;
    const maxTextLength = 100000; // 限制最大文本长度
    
    while ((match = textPattern.exec(pdfText)) !== null && extractedText.length < maxTextLength) {
      const text = match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\(\(|\))/g, '$1')
        .trim();
      
      if (text.length > 0 && text.length < 1000) { // 过滤掉过长的垃圾文本
        textObjects.push(text);
      }
    }
    
    extractedText = textObjects.join(' ').trim();
    
    // 如果基础提取失败，尝试更宽泛的模式
    if (extractedText.length < 50) {
      console.log('尝试备用文本提取方法');
      
      // 查找更通用的文本模式
      const alternativePattern = /\[([^\]]+)\]/g;
      const alternativeTexts = [];
      
      while ((match = alternativePattern.exec(pdfText)) !== null) {
        const text = match[1].trim();
        if (text.length > 10 && text.length < 500 && /[a-zA-Z\u4e00-\u9fa5]/.test(text)) {
          alternativeTexts.push(text);
        }
      }
      
      if (alternativeTexts.length > 0) {
        extractedText = alternativeTexts.join(' ').trim();
      }
    }
    
    // 最后的清理
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\x00-\x7F\u4e00-\u9fa5]/g, '') // 移除特殊字符
      .trim();
    
    if (extractedText.length < 50) {
      throw new Error('PDF文本提取失败，可能是扫描版PDF或加密文档');
    }
    
    return {
      text: extractedText,
      title,
      pageCount,
      metadata: {
        extractionMethod: 'basic-regex',
        bufferSize: pdfBuffer.byteLength
      }
    };
    
  } catch (error) {
    console.error('PDF解析错误:', error);
    throw new Error(`PDF解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 从URL提取文件名作为标题
const extractTitleFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || '';
    return filename.replace(/\.pdf$/i, '') || 'PDF文档';
  } catch {
    return 'PDF文档';
  }
};