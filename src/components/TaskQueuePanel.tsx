/**
 * 导入任务队列面板
 */

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, X, Trash2 } from 'lucide-react'
import { loadTasks, deleteTask, type ImportTask } from '@/utils/importTaskQueue'
import { formatDate, formatSize } from '@/utils/questionImport'
import CollapsiblePanel from './CollapsiblePanel'
import ProgressBar from './ProgressBar'

export default function TaskQueuePanel() {
  const [tasks, setTasks] = useState<ImportTask[]>(() => loadTasks())

  useEffect(() => {
    // 定期刷新任务状态
    const interval = setInterval(() => {
      setTasks(loadTasks())
    }, 1000)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  const handleDelete = (id: string) => {
    if (confirm('确定删除此任务记录吗？')) {
      deleteTask(id)
      setTasks(loadTasks())
    }
  }

  const statusIcons: Record<ImportTask['status'], JSX.Element> = {
    pending: <Clock className="w-4 h-4 text-gray-400" />,
    processing: <Clock className="w-4 h-4 text-primary-600 animate-spin" />,
    completed: <CheckCircle className="w-4 h-4 text-emerald-600" />,
    failed: <XCircle className="w-4 h-4 text-red-600" />,
    cancelled: <XCircle className="w-4 h-4 text-gray-400" />,
  }

  const activeTasks = tasks.filter((t) => t.status === 'processing' || t.status === 'pending')
  const completedTasks = tasks.filter((t) => t.status === 'completed').slice(0, 5)
  const failedTasks = tasks.filter((t) => t.status === 'failed').slice(0, 5)

  if (tasks.length === 0) {
    return null
  }

  return (
    <CollapsiblePanel title={`任务队列 (${activeTasks.length} 进行中)`} defaultExpanded={activeTasks.length > 0}>
      <div className="space-y-3 mt-4">
        {/* 进行中的任务 */}
        {activeTasks.length > 0 && (
          <div className="space-y-2">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="border border-primary-200 bg-primary-50 rounded-lg p-3 dark:border-primary-500/40 dark:bg-primary-500/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {statusIcons[task.status]}
                    <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {task.fileName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <ProgressBar progress={task.progress} variant="default" />
                <div className="text-xs text-gray-500 mt-2">{formatSize(task.fileSize)}</div>
              </div>
            ))}
          </div>
        )}

        {/* 已完成的任务 */}
        {completedTasks.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase">最近完成</div>
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="border border-gray-200 rounded-lg p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {statusIcons[task.status]}
                      <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {task.fileName}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {task.questionCount} 题 | +{task.added} ~{task.updated} |{' '}
                      {task.completedAt && formatDate(task.completedAt)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="p-1 text-gray-400 hover:text-red-500 ml-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 失败的任务 */}
        {failedTasks.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase">失败任务</div>
            {failedTasks.map((task) => (
              <div
                key={task.id}
                className="border border-red-200 bg-red-50 rounded-lg p-3 dark:border-red-500/40 dark:bg-red-500/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {statusIcons[task.status]}
                      <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {task.fileName}
                      </span>
                    </div>
                    {task.error && (
                      <div className="text-xs text-red-600 mt-1">{task.error}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="p-1 text-gray-400 hover:text-red-500 ml-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsiblePanel>
  )
}

