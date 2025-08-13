# HTML Summarizer Agent - 功能详解

## 🌟 核心功能概览

这个增强版HTML Summarizer Agent现在是一个功能强大的多模态内容分析平台，支持多种内容类型和处理模式。

## 📋 功能列表

### 1. 内容提取与解析

#### 🌐 网页内容提取 (`fetchAndExtractTool`)
- **多源标题提取**: OpenGraph、Twitter Card、title标签、h1等
- **智能高亮识别**: 自动识别强调、重要、标记、引用等内容
- **内容重要性分级**: high、medium、low三级分类
- **清理HTML标签**: 自动移除无用的脚本、样式等

```javascript
// 使用示例
const result = await agent.tools.fetchAndExtractTool.execute({
  context: { url: 'https://example.com/article' }
});
```

#### 📄 PDF文档处理 (`pdfExtractTool`)
- **PDF文本提取**: 支持标准PDF文档的文本内容提取
- **元数据获取**: 提取作者、创建时间等文档信息
- **分页处理**: 支持大文档的分页处理，可设置页数限制
- **智能标题识别**: 从PDF结构中提取文档标题

```javascript
// 使用示例
const result = await agent.tools.pdfExtractTool.execute({
  context: { 
    url: 'https://example.com/document.pdf',
    maxPages: 50
  }
});
```

#### 📡 RSS订阅管理 (`rssParserTool`, `rssSubscriptionTool`)
- **RSS/Atom解析**: 支持主流RSS和Atom格式
- **批量文章提取**: 一次性获取订阅源的多篇文章
- **订阅管理**: 添加、删除、更新RSS订阅源
- **完整内容获取**: 可选择获取文章完整内容

```javascript
// RSS解析
const result = await agent.tools.rssParserTool.execute({
  context: { 
    url: 'https://example.com/rss.xml',
    limit: 10,
    includeContent: true
  }
});

// 订阅管理
await agent.tools.rssSubscriptionTool.execute({
  context: {
    action: 'add',
    feedUrl: 'https://example.com/rss.xml',
    feedName: '技术博客',
    category: 'technology'
  }
});
```

### 2. 多语言支持

#### 🌍 智能翻译 (`translateTool`)
- **多语言支持**: 支持20+种主流语言
- **自动语言检测**: 无需指定源语言
- **AI增强翻译**: 使用DeepSeek模型提供高质量翻译
- **降级机制**: AI服务不可用时自动切换到基础翻译

```javascript
// 翻译文本
const result = await agent.tools.translateTool.execute({
  context: {
    text: 'Hello, world!',
    targetLanguage: 'zh-CN'
  }
});
```

#### 🔍 语言检测 (`detectLanguageTool`)
- **字符模式识别**: 基于字符特征检测语言
- **置信度评分**: 提供检测置信度
- **多候选结果**: 返回多个可能的语言选项

#### 📦 批量翻译 (`batchTranslateTool`)
- **并发处理**: 支持同时处理多个文本
- **速率控制**: 自动控制API调用频率
- **错误处理**: 单个翻译失败不影响整体进度

### 3. 相似度检测与去重

#### 📊 相似度计算 (`similarityDetectorTool`)
- **多种算法**: 支持余弦、Jaccard、编辑距离、语义相似度
- **智能预处理**: 自动清理和标准化文本
- **详细报告**: 提供相似度计算的详细信息

```javascript
// 计算相似度
const result = await agent.tools.similarityDetectorTool.execute({
  context: {
    text1: '第一段文本',
    text2: '第二段文本',
    method: 'cosine'
  }
});
```

#### 🔄 重复检测 (`duplicateDetectorTool`)
- **批量去重**: 在文档集合中检测重复内容
- **阈值控制**: 可调整相似度判定阈值
- **分组管理**: 将相似文档归类到同一组

#### 🔖 内容指纹 (`contentFingerprintTool`)
- **SimHash算法**: 快速生成内容指纹
- **MinHash支持**: 适用于大规模文档集合
- **Shingle Hash**: 字符级相似度检测

### 4. RAG增强检索

#### 🗄️ 向量存储 (`vectorStoreTool`)
- **自动分块**: 智能分割长文档为合适的块
- **Embedding生成**: 使用DeepSeek embedding模型
- **元数据保存**: 保留文档的上下文信息
- **Cloudflare Vectorize**: 集成云端向量数据库

```javascript
// 存储文档
await agent.tools.vectorStoreTool.execute({
  context: {
    content: '要存储的文档内容',
    url: 'https://example.com',
    title: '文档标题',
    metadata: { category: 'tech', language: 'zh' }
  }
});
```

#### 🔍 向量检索 (`vectorSearchTool`)
- **语义搜索**: 基于向量相似度的智能搜索
- **结果排序**: 按相似度自动排序
- **去重合并**: 相同文档的多个片段智能合并

```javascript
// 搜索相关内容
const results = await agent.tools.vectorSearchTool.execute({
  context: {
    query: '人工智能的发展趋势',
    limit: 5
  }
});
```

### 5. 智能缓存系统

#### ⚡ 缓存管理 (`cacheGetTool`, `cacheSetTool`)
- **Cloudflare KV**: 基于边缘存储的高速缓存
- **TTL控制**: 灵活的过期时间设置
- **智能键名**: 基于内容哈希的唯一键名生成
- **缓存统计**: 命中率和使用情况统计

```javascript
// 获取缓存
const cached = await agent.tools.cacheGetTool.execute({
  context: { url: 'https://example.com' }
});

// 设置缓存
await agent.tools.cacheSetTool.execute({
  context: {
    url: 'https://example.com',
    data: processedData,
    ttl: 3600 // 1小时
  }
});
```

#### 🧹 缓存清理 (`cacheInvalidateTool`)
- **单个清理**: 清除特定URL的缓存
- **批量清理**: 支持模式匹配的批量删除
- **智能预热**: 支持缓存预热功能

### 6. 监控与运维

#### 📈 性能监控 (`performanceMonitorTool`)
- **响应时间跟踪**: 监控各操作的执行时间
- **内存使用监控**: 实时跟踪内存消耗
- **请求统计**: 统计API调用次数和成功率
- **性能趋势**: 提供性能指标的历史趋势

#### 🚨 错误追踪 (`errorTrackingTool`)
- **错误分类**: 按严重程度分类错误
- **错误指纹**: 生成错误唯一标识符
- **相似错误检测**: 发现和归类相似错误
- **解决建议**: 基于错误类型提供解决方案

#### 📊 使用统计 (`usageStatsTool`)
- **功能使用统计**: 跟踪各功能的使用频率
- **用户行为分析**: 分析用户使用模式
- **热门功能识别**: 识别最受欢迎的功能

#### ❤️ 健康检查 (`healthCheckTool`)
- **组件状态检查**: 检查各组件的运行状态
- **依赖服务监控**: 监控外部服务可用性
- **系统整体状态**: 提供系统整体健康状态

### 7. 多模式摘要生成

#### 📝 摘要模式
1. **标准模式**: 150-200字核心摘要，适用于一般文章
2. **详细模式**: 300-500字详细摘要，适用于长文档
3. **简洁模式**: 50-100字精简摘要，适用于新闻
4. **技术模式**: 专门处理技术文档，识别代码和配置
5. **多语言模式**: 自动检测和翻译非中文内容
6. **RAG增强模式**: 结合历史相关内容生成更准确摘要

#### 🎯 智能处理流程
1. **缓存检查**: 优先使用已缓存的处理结果
2. **内容获取**: 根据URL类型选择合适的提取工具
3. **语言处理**: 自动检测语言并在需要时翻译
4. **相似度检查**: 检测是否有重复内容
5. **RAG检索**: 搜索相关历史内容增强理解
6. **摘要生成**: 选择合适模式生成摘要
7. **结果缓存**: 保存处理结果供后续使用
8. **向量存储**: 将新内容加入知识库

## 🚀 使用示例

### 基础网页摘要
```bash
curl -X POST http://localhost:3000/agents/summarizerAgent/generate \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "请分析这个网页：https://example.com/article"}]}'
```

### PDF文档分析
```bash
curl -X POST http://localhost:3000/agents/summarizerAgent/generate \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "请使用详细模式分析这个PDF：https://example.com/document.pdf"}]}'
```

### RSS订阅批量处理
```bash
curl -X POST http://localhost:3000/agents/summarizerAgent/generate \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "请分析RSS源的最新10篇文章：https://example.com/rss.xml"}]}'
```

### 多语言翻译摘要
```bash
curl -X POST http://localhost:3000/agents/summarizerAgent/generate \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "请分析并翻译这个英文页面：https://example.com/english-article"}]}'
```

## 🔧 高级配置

### 环境变量
```bash
# AI服务
DEEPSEEK_API_KEY=your-deepseek-api-key

# Cloudflare配置
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_CACHE_KV_ID=your-cache-kv-id
CLOUDFLARE_MONITORING_KV_ID=your-monitoring-kv-id
CLOUDFLARE_ERROR_KV_ID=your-error-kv-id
CLOUDFLARE_VECTOR_KV_ID=your-vector-kv-id

# 可选配置
NODE_ENV=production
LOG_LEVEL=info
```

### 性能优化建议
- 启用缓存以减少重复处理
- 使用批量API减少请求次数
- 配置合适的TTL值平衡性能和数据新鲜度
- 定期清理过期缓存释放存储空间
- 监控API使用量避免超出限制

### 部署最佳实践
- 使用Cloudflare Workers实现全球边缘部署
- 配置多个KV命名空间分离不同类型数据
- 设置适当的错误告警机制
- 定期检查系统健康状态
- 备份重要的向量数据和配置

这个增强版的HTML Summarizer Agent现在是一个功能完整的内容分析平台，可以满足各种复杂的内容处理需求。