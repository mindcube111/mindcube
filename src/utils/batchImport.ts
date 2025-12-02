/**
 * 批量导入工具
 * 支持从 Excel/CSV 批量导入链接
 */

import * as XLSX from 'xlsx'
import { Link, QuestionnaireType } from '@/types'
import { generateId, generateTestLink } from './formatters'
import { saveLinks } from './links'
import { STORAGE_KEYS } from '@/constants'

export interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; message: string }>
  links: Link[]
}

/**
 * 从 Excel/CSV 文件导入链接
 */
export async function importLinksFromFile(file: File, createdBy?: string): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet)

        const result: ImportResult = {
          success: 0,
          failed: 0,
          errors: [],
          links: [],
        }

        jsonData.forEach((row, index) => {
          try {
            // 验证必需字段
            const questionnaireType = row['问卷类型'] || row['questionnaireType'] || row['type']
            if (!questionnaireType) {
              result.failed++
              result.errors.push({
                row: index + 2, // +2 因为第一行是表头，索引从1开始
                message: '缺少问卷类型',
              })
              return
            }

            // 创建链接
            const link: Link = {
              id: generateId(),
              url: row['链接'] || row['url'] || generateTestLink(generateId()),
              questionnaireType: questionnaireType as QuestionnaireType,
              status: (row['状态'] || row['status'] || 'unused') as Link['status'],
              createdAt: row['创建时间'] || row['createdAt'] || new Date().toISOString(),
              usedAt: row['使用时间'] || row['usedAt'] || undefined,
              reportId: row['报告ID'] || row['reportId'] || undefined,
              createdBy, // 记录创建者
            }

            result.links.push(link)
            result.success++
          } catch (error) {
            result.failed++
            result.errors.push({
              row: index + 2,
              message: error instanceof Error ? error.message : '导入失败',
            })
          }
        })

        // 保存成功的链接
        if (result.links.length > 0) {
          const existingLinks = JSON.parse(
            localStorage.getItem(STORAGE_KEYS.LINKS) || '[]'
          )
          const allLinks = [...existingLinks, ...result.links]
          saveLinks(allLinks)
        }

        resolve(result)
      } catch (error) {
        reject(new Error(`文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * 生成导入模板 Excel
 */
export function generateImportTemplate(): void {
  const template = [
    {
      问卷类型: 'SCL-90',
      链接: 'http://example.com/test/xxx',
      状态: 'unused',
      创建时间: new Date().toISOString(),
    },
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '链接导入模板')
  XLSX.writeFile(wb, '链接导入模板.xlsx')
}


