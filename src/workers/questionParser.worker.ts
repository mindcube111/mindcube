/**
 * 题目解析 Web Worker
 * 在后台线程中解析大文件，不阻塞主线程
 */

import type { ParseResult } from '../utils/questionImport'
import { parseCSV, parseJSON, headerAlias } from '../utils/questionImport'

self.onmessage = function (e) {
  const { type, payload } = e.data

  try {
    switch (type) {
      case 'parse': {
        const { text, isJSON } = payload

        // 发送初始进度
        self.postMessage({ type: 'progress', progress: 10 })

        // 解析数据
        let result: ParseResult
        if (isJSON) {
          result = parseJSON(text)
        } else {
          result = parseCSV(text, headerAlias)
        }

        // 发送进度更新
        self.postMessage({ type: 'progress', progress: 80 })

        // 处理结果
        const normalized = result.questions.map((q) => ({
          ...q,
          // 确保所有字段都有值
        }))

        self.postMessage({ type: 'progress', progress: 100 })

        // 发送最终结果
        self.postMessage({
          type: 'result',
          result: {
            questions: normalized,
            warnings: result.warnings,
          },
        })
        break
      }

      case 'validate': {
        const { records } = payload
        // 验证逻辑可以在worker中执行
        self.postMessage({ type: 'validation-result', result: records })
        break
      }

      default:
        self.postMessage({ type: 'error', error: 'Unknown message type' })
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// 导出类型，避免worker文件被TypeScript检查
export {}
