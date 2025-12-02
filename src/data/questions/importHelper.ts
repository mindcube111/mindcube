/**
 * 题目导入辅助工具
 * 用于转换和格式化题目数据
 */

import { QuestionnaireData, QuestionnaireType } from '@/types'

/**
 * 转换题目数据格式
 * 将不同格式的题目数据转换为标准格式
 */
export function convertQuestions(
  rawData: any,
  type: QuestionnaireType
): QuestionnaireData {
  // 如果已经是正确格式，直接返回
  if (rawData.type && rawData.questions && Array.isArray(rawData.questions)) {
    return rawData as QuestionnaireData
  }

  // 转换格式
  const normalizedType = (type || rawData.type || 'Custom').toString()

  const converted: QuestionnaireData = {
    type: normalizedType,
    title: rawData.title || `${normalizedType} 问卷`,
    description: rawData.description || '',
    questions: [],
    dimensions: rawData.dimensions || [],
  }

  // 转换题目
  if (Array.isArray(rawData.questions)) {
    converted.questions = rawData.questions.map((q: any, index: number) => ({
      id: q.id || `${normalizedType.toLowerCase()}_${index + 1}`,
      number: q.number || index + 1,
      text: q.text || q.question || q.content || '',
      category: q.category || q.dimension || undefined,
      options: q.options || q.choices || undefined,
      required: q.required !== undefined ? q.required : true,
    }))
  }

  return converted
}

