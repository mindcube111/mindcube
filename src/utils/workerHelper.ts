/**
 * Web Worker 辅助工具
 * 包装 Worker 调用，提供更友好的 API
 */

export interface WorkerMessage {
  type: 'parse' | 'validate' | 'progress' | 'result' | 'error'
  payload?: any
  progress?: number
  result?: any
  error?: string
}

/**
 * 创建解析 Worker
 * 暂时禁用 Worker，直接使用主线程解析
 */
export function createParserWorker(): Worker | null {
  // 暂时禁用 Worker，避免 Vite 构建问题
  // 后续可以优化为正确的 Worker 导入方式
  return null
}

/**
 * 在主线程中解析（降级方案）
 */
export async function parseInMainThread(
  text: string,
  isJSON: boolean,
  onProgress?: (progress: number) => void
): Promise<any> {
  // 模拟进度更新
  if (onProgress) {
    onProgress(10)
    await new Promise((resolve) => setTimeout(resolve, 50))
    onProgress(50)
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  // 实际解析
  const { parseCSV, parseJSON: parseJSONUtil, headerAlias } = await import('./questionImport')
  const result = isJSON ? parseJSONUtil(text) : parseCSV(text, headerAlias)

  if (onProgress) {
    onProgress(100)
  }

  return result
}

/**
 * 使用 Worker 或主线程解析
 */
export async function parseQuestions(
  text: string,
  isJSON: boolean,
  onProgress?: (progress: number) => void
): Promise<any> {
  // 直接使用主线程解析，避免 Worker 配置问题
  // Worker 配置较复杂，暂时禁用，后续可以优化
  return parseInMainThread(text, isJSON, onProgress)
}

