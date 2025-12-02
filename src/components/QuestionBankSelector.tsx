import { Database, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuestionBanks } from '@/hooks/useQuestionBanks'

interface QuestionBankSelectorProps {
  onBankChange?: (bankId: string) => void
}

export default function QuestionBankSelector({ onBankChange }: QuestionBankSelectorProps) {
  const {
    banks,
    currentBankId,
    currentBank,
    setActiveBank,
    createNewBank,
    deleteBankById,
  } = useQuestionBanks(onBankChange)

  const handleBankChange = (bankId: string) => {
    setActiveBank(bankId)
    toast.success('已切换到新题库')
  }

  const handleCreateBank = () => {
    const name = prompt('请输入题库名称：')
    if (!name?.trim()) return

    const description = prompt('请输入题库描述（可选）：') || undefined
    const newBank = createNewBank(name, description)
    toast.success(`已创建题库「${newBank.name}」并切换`)
  }

  const handleDeleteBank = (bankId: string) => {
    const bank = banks.find((b) => b.id === bankId)
    if (!bank) return

    if (confirm(`确定删除题库「${bank.name}」吗？此操作将删除该题库中的所有题目。`)) {
      deleteBankById(bankId)
      toast.success('题库已删除')
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">当前题库</h3>
        </div>
        <button
          type="button"
          onClick={handleCreateBank}
          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"
          title="创建新题库"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {banks.length > 0 ? (
        <div className="space-y-2">
          <select
            value={currentBankId || banks[0]?.id || ''}
            onChange={(e) => handleBankChange(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name}（{bank.questionCount} 题）
              </option>
            ))}
          </select>

          {currentBank && (
            <>
              {currentBank.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentBank.description}</p>
              )}

              {banks.length > 1 && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => handleDeleteBank(currentBankId)}
                    className="flex-1 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg border border-red-200 dark:border-red-500/40 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    删除当前题库
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
          暂无题库
        </div>
      )}
    </div>
  )
}