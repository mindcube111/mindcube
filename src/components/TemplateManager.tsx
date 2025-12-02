/**
 * 模板管理组件
 */

import { useState } from 'react'
import { Plus, Trash2, Download } from 'lucide-react'
import {
  loadTemplates,
  saveTemplate,
  deleteTemplate,
  createTemplate,
  downloadTemplate,
  type QuestionTemplate,
} from '@/utils/questionTemplate'
import { templateQuestions, csvHeader } from '@/utils/questionTemplateData'
import CollapsiblePanel from './CollapsiblePanel'
import toast from 'react-hot-toast'

export default function TemplateManager() {
  const [templates, setTemplates] = useState<QuestionTemplate[]>(() => loadTemplates())

  const handleDelete = (id: string) => {
    if (confirm('确定删除此模板吗？')) {
      deleteTemplate(id)
      setTemplates(loadTemplates())
      toast.success('模板已删除')
    }
  }

  const handleDownload = (template: QuestionTemplate) => {
    downloadTemplate(template)
    toast.success('模板已下载')
  }

  const handleCreateFromCurrent = () => {
    const name = prompt('请输入模板名称：')
    if (!name) return

    const template = createTemplate(
      name,
      csvHeader,
      ['题目', '类型', '选项', '答案', '标签', '难度', '解析'],
      templateQuestions
    )
    saveTemplate(template)
    setTemplates(loadTemplates())
    toast.success('模板已创建')
  }

  return (
    <CollapsiblePanel title="模板管理" defaultExpanded={false}>
      <div className="space-y-3 mt-4">
        <button
          type="button"
          onClick={handleCreateFromCurrent}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          从当前模板创建
        </button>

        {templates.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">暂无自定义模板</div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-3 hover:border-primary-300 transition-colors dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">{template.name}</h4>
                    {template.description && (
                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{template.sampleData.length} 道示例题</span>
                      <span>{template.fields.length} 个字段</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(template)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 rounded"
                      title="下载模板"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(template.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                      title="删除模板"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsiblePanel>
  )
}

