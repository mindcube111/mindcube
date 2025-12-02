/**
 * 批量导入链接页面
 * 支持从 Excel/CSV 文件批量导入链接
 */

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { importLinksFromFile, generateImportTemplate, ImportResult } from '@/utils/batchImport'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/contexts/AuthContext'
import { addAuditLog } from '@/utils/audit'
import { useLoading } from '@/hooks/useLoading'
import toast from 'react-hot-toast'
import VirtualList from '@/components/VirtualList'

export default function BatchImportLinks() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showAlert, DialogComponent } = useConfirmDialog()
  const { isLoading, withLoading } = useLoading()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = async (file: File) => {
    // 验证文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ]

    if (!allowedTypes.includes(file.type)) {
      await showAlert('文件格式错误', '请上传 Excel (.xlsx, .xls) 或 CSV (.csv) 格式的文件', 'alert')
      return
    }

    try {
      const result = await withLoading(
        () => importLinksFromFile(file, user?.id),
        '正在导入链接...'
      )

      setImportResult(result)

      // 记录操作日志
      if (user) {
        addAuditLog({
          userId: user.id,
          username: user.name,
          action: '批量导入链接',
          target: `${result.success}个链接`,
          targetType: 'link',
          details: {
            success: result.success,
            failed: result.failed,
            total: result.success + result.failed,
          },
        })
      }

      if (result.success > 0) {
        toast.success(`成功导入 ${result.success} 个链接`)
        // 触发链接更新事件
        window.dispatchEvent(new Event('links-updated'))
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} 个链接导入失败`)
      }
    } catch (error) {
      await showAlert('导入失败', error instanceof Error ? error.message : '文件解析失败，请检查文件格式', 'alert')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // 清空文件输入，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDownloadTemplate = () => {
    generateImportTemplate()
    toast.success('模板已下载')
  }

  return (
    <div className="space-y-6">
      {DialogComponent}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">批量导入链接</h1>
        <p className="text-gray-600 mt-2">从 Excel 或 CSV 文件批量导入链接数据</p>
      </div>

      {/* 使用说明 */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">导入说明</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>支持 Excel (.xlsx, .xls) 和 CSV (.csv) 格式</li>
          <li>必需字段：问卷类型</li>
          <li>可选字段：链接、状态、创建时间、使用时间、报告ID</li>
          <li>可以下载模板文件查看格式要求</li>
        </ul>
        <button
          onClick={handleDownloadTemplate}
          className="btn-secondary mt-4 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          下载导入模板
        </button>
      </div>

      {/* 文件上传区域 */}
      <div className="card">
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            拖拽文件到此处或点击选择
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            支持 Excel 和 CSV 格式
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            disabled={isLoading}
          />
          <label
            htmlFor="file-upload"
            className="btn-primary inline-flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isLoading ? '导入中...' : '选择文件'}
          </label>
        </div>
      </div>

      {/* 导入结果 */}
      {importResult && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">导入结果</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
              <div className="text-sm text-gray-600">成功</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
              <div className="text-sm text-gray-600">失败</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileSpreadsheet className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {importResult.success + importResult.failed}
              </div>
              <div className="text-sm text-gray-600">总计</div>
            </div>
          </div>

          {/* 错误列表 */}
          {importResult.errors.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                错误详情
              </h4>
              <VirtualList
                items={importResult.errors}
                height={Math.min(importResult.errors.length * 60, 320)}
                itemHeight={60}
                renderItem={(error, index) => (
                  <div key={`${error.row}-${index}`} className="text-sm text-gray-700 p-3 bg-gray-50 rounded border border-gray-100">
                    <span className="font-semibold">第 {error.row} 行：</span>
                    {error.message}
                  </div>
                )}
              />
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setImportResult(null)
                navigate('/links/manage')
              }}
              className="btn-primary flex-1"
            >
              查看导入的链接
            </button>
            <button
              onClick={() => setImportResult(null)}
              className="btn-secondary"
            >
              继续导入
            </button>
          </div>
        </div>
      )}
    </div>
  )
}