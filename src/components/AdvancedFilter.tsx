/**
 * 高级筛选组件
 * 支持多条件组合筛选和保存筛选条件
 */

import { useState } from 'react'
import { Filter, X, Save, Trash2 } from 'lucide-react'

export interface FilterCondition {
  field: string
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between'
  value: any
  value2?: any // 用于 between 操作符
}

export interface AdvancedFilterProps {
  conditions: FilterCondition[]
  onConditionsChange: (conditions: FilterCondition[]) => void
  fields: Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'select' | 'dateRange' }>
  selectOptions?: Record<string, Array<{ value: string; label: string }>>
  onSave?: (name: string, conditions: FilterCondition[]) => void
  savedFilters?: Array<{ name: string; conditions: FilterCondition[] }>
  onLoadSaved?: (conditions: FilterCondition[]) => void
}

export default function AdvancedFilter({
  conditions,
  onConditionsChange,
  fields,
  selectOptions = {},
  onSave,
  savedFilters = [],
  onLoadSaved,
}: AdvancedFilterProps) {
  const [showPanel, setShowPanel] = useState(false)
  const [saveFilterName, setSaveFilterName] = useState('')

  const addCondition = () => {
    onConditionsChange([
      ...conditions,
      {
        field: fields[0]?.key || '',
        operator: 'contains',
        value: '',
      },
    ])
  }

  const removeCondition = (index: number) => {
    onConditionsChange(conditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], ...updates }
    onConditionsChange(updated)
  }

  const clearAll = () => {
    onConditionsChange([])
  }

  const handleSave = () => {
    if (saveFilterName && onSave) {
      onSave(saveFilterName, conditions)
      setSaveFilterName('')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="btn-secondary flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        高级筛选
        {conditions.length > 0 && (
          <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
            {conditions.length}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg border border-gray-200 shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">筛选条件</h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 已保存的筛选条件 */}
          {savedFilters.length > 0 && (
            <div className="mb-4 pb-4 border-b">
              <p className="text-sm text-gray-600 mb-2">已保存的筛选：</p>
              <div className="space-y-1">
                {savedFilters.map((filter, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onLoadSaved?.(filter.conditions)
                      setShowPanel(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 筛选条件列表 */}
          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {conditions.map((condition, index) => {
              const fieldConfig = fields.find((f) => f.key === condition.field)
              const fieldType = fieldConfig?.type || 'text'
              const selectFieldOptions = fieldConfig && selectOptions[fieldConfig.key] ? selectOptions[fieldConfig.key] : []

              return (
                <div key={index} className="flex gap-2 items-start">
                  <select
                  value={condition.field}
                  onChange={(e) => updateCondition(index, { field: e.target.value })}
                  className="input text-sm flex-1"
                >
                  {fields.map((field) => (
                    <option key={field.key} value={field.key}>
                      {field.label}
                    </option>
                  ))}
                </select>

                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, { operator: e.target.value as any })}
                  className="input text-sm w-32"
                >
                  <option value="equals">等于</option>
                  <option value="contains">包含</option>
                  <option value="greaterThan">大于</option>
                  <option value="lessThan">小于</option>
                  <option value="between">介于</option>
                </select>

                {condition.operator === 'between' ? (
                  <div className="flex gap-1 flex-1">
                    <input
                      type={fieldType === 'date' || fieldType === 'dateRange' ? 'date' : 'text'}
                      value={condition.value || ''}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      className="input text-sm flex-1"
                    />
                    <span className="self-center text-gray-400">-</span>
                    <input
                      type={fieldType === 'date' || fieldType === 'dateRange' ? 'date' : 'text'}
                      value={condition.value2 || ''}
                      onChange={(e) => updateCondition(index, { value2: e.target.value })}
                      className="input text-sm flex-1"
                    />
                  </div>
                ) : fieldType === 'select' ? (
                  <select
                    className="input text-sm flex-1"
                    value={condition.value || ''}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                  >
                    <option value="">请选择</option>
                    {selectFieldOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={fieldType === 'date' || fieldType === 'dateRange' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
                    value={condition.value || ''}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                    className="input text-sm flex-1"
                  />
                )}

                  <button
                    onClick={() => removeCondition(index)}
                    className="text-danger hover:text-danger/80 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button onClick={addCondition} className="btn-secondary text-sm flex-1">
              添加条件
            </button>
            <button onClick={clearAll} className="btn-secondary text-sm">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* 保存筛选条件 */}
          {onSave && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveFilterName}
                  onChange={(e) => setSaveFilterName(e.target.value)}
                  placeholder="筛选条件名称"
                  className="input text-sm flex-1"
                />
                <button
                  onClick={handleSave}
                  disabled={!saveFilterName}
                  className="btn-secondary text-sm"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

