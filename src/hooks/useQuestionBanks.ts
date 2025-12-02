import { useEffect, useMemo, useState } from 'react'
import {
  loadBanks,
  createBank,
  deleteBank,
  getCurrentBankId,
  setCurrentBankId,
  type QuestionBank,
} from '@/utils/questionBank'

export interface UseQuestionBanksResult {
  banks: QuestionBank[]
  currentBankId: string
  currentBank: QuestionBank | null
  setActiveBank: (bankId: string) => void
  createNewBank: (name: string, description?: string) => QuestionBank
  deleteBankById: (bankId: string) => void
}

export function useQuestionBanks(onBankChange?: (bankId: string) => void): UseQuestionBanksResult {
  const [banks, setBanks] = useState<QuestionBank[]>([])
  const [currentBankId, setCurrentId] = useState<string>('')

  const notifyChange = (bankId: string) => {
    setCurrentBankId(bankId)
    setCurrentId(bankId)
    onBankChange?.(bankId)
  }

  useEffect(() => {
    const banksList = loadBanks()
    setBanks(banksList)

    if (banksList.length === 0) {
      setCurrentId('')
      setCurrentBankId('')
      return
    }

    const storedId = getCurrentBankId()
    const exists = banksList.some((b) => b.id === storedId)
    const finalId = exists ? storedId : banksList[0].id

    notifyChange(finalId)
  }, [])

  const setActiveBank = (bankId: string) => {
    const exists = banks.some((b) => b.id === bankId)
    if (!exists) return
    notifyChange(bankId)
  }

  const createNewBank = (name: string, description?: string): QuestionBank => {
    const newBank = createBank(name, description)
    const updatedBanks = loadBanks()
    setBanks(updatedBanks)
    notifyChange(newBank.id)
    return newBank
  }

  const deleteBankById = (bankId: string) => {
    deleteBank(bankId)
    const updatedBanks = loadBanks()
    setBanks(updatedBanks)

    if (bankId === currentBankId) {
      if (updatedBanks.length > 0) {
        notifyChange(updatedBanks[0].id)
      } else {
        setCurrentId('')
        setCurrentBankId('')
        onBankChange?.('')
      }
    }
  }

  const currentBank = useMemo(
    () => banks.find((b) => b.id === currentBankId) || null,
    [banks, currentBankId],
  )

  return {
    banks,
    currentBankId,
    currentBank,
    setActiveBank,
    createNewBank,
    deleteBankById,
  }
}



