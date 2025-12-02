import type { ImportedQuestion } from './questionImport'
import { templateQuestions, csvHeader } from './questionTemplateData'

export interface QuestionTemplateField {
  key: string
  label: string
  required?: boolean
}

export interface QuestionTemplate {
  id: string
  name: string
  description?: string
  fields: QuestionTemplateField[]
  sampleData: Array<ImportedQuestion>
  csvHeader?: string[]
  createdAt: string
}

const STORAGE_KEY = 'question_templates'
const hasWindow = typeof window !== 'undefined'

function readTemplates(): QuestionTemplate[] {
  if (!hasWindow) return getDefaultTemplates()
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return getDefaultTemplates()
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultTemplates()
  } catch {
    return getDefaultTemplates()
  }
}

function persistTemplates(templates: QuestionTemplate[]) {
  if (!hasWindow) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

function getDefaultTemplates(): QuestionTemplate[] {
  return [
    {
      id: 'default-template',
      name: '标准题库模板',
      description: '包含示例题目的标准模板，可直接导出为 CSV',
      fields: [
        { key: 'title', label: '题目', required: true },
        { key: 'type', label: '题型', required: true },
        { key: 'options', label: '选项' },
        { key: 'answer', label: '答案' },
        { key: 'tags', label: '标签' },
        { key: 'difficulty', label: '难度' },
        { key: 'analysis', label: '解析' },
      ],
      sampleData: templateQuestions,
      csvHeader,
      createdAt: new Date().toISOString(),
    },
  ]
}

export function loadTemplates(): QuestionTemplate[] {
  return readTemplates()
}

export function saveTemplate(template: QuestionTemplate) {
  const templates = readTemplates()
  const index = templates.findIndex((item) => item.id === template.id)
  if (index >= 0) {
    templates[index] = template
  } else {
    templates.unshift(template)
  }
  persistTemplates(templates)
}

export function deleteTemplate(id: string) {
  const templates = readTemplates().filter((template) => template.id !== id)
  persistTemplates(templates)
}

export function createTemplate(
  name: string,
  header: string[] | undefined,
  fields: string[],
  sampleData: ImportedQuestion[],
  description?: string
): QuestionTemplate {
  return {
    id: `template_${Date.now()}`,
    name,
    description,
    csvHeader: header,
    fields: fields.map((field) => ({ key: field, label: field })),
    sampleData,
    createdAt: new Date().toISOString(),
  }
}

export function downloadTemplate(template: QuestionTemplate) {
  const data = template.csvHeader
    ? [
        template.csvHeader,
        ...template.sampleData.map((question) => [
          question.title,
          question.type,
          question.options.join('|'),
          question.answer,
          question.tags.join(','),
          question.difficulty ?? '',
          question.analysis ?? '',
        ]),
      ]
          .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
          .join('\n')
    : JSON.stringify(template.sampleData, null, 2)

  const blob = new Blob([data], {
    type: template.csvHeader ? 'text/csv;charset=utf-8' : 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${template.name}.${template.csvHeader ? 'csv' : 'json'}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}








