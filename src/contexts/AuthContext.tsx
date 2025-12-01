import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { User } from '@/types'
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
} from '@/services/api/auth'
import {
  getUserList,
  updateUserStatus as apiUpdateUserStatus,
  updateUser as apiUpdateUser,
  batchDeleteUsers,
} from '@/services/api/users'

interface RegisterPayload {
  username: string
  email: string
  password: string
  name?: string
}

interface RegisterResult {
  success: boolean
  message: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  accounts: User[]
  accountsLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (payload: RegisterPayload) => Promise<RegisterResult>
  logout: () => Promise<void>
  fetchAccounts: () => Promise<void>
  clearCustomUsers: () => Promise<{ success: boolean; message?: string }>
  updateUserStatus: (id: string, status: 'active' | 'disabled') => Promise<{ success: boolean; message?: string }>
  updateUserQuota: (id: string, amount: number) => Promise<{ success: boolean; message?: string }>
  updateUserUsedQuota: (id: string, amount: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const persistUser = (value: User | null) => {
  if (!value) {
    localStorage.removeItem('user')
    return
  }
  localStorage.setItem('user', JSON.stringify(value))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accounts, setAccounts] = useState<User[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true)
      try {
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
          const parsed: User = JSON.parse(savedUser)
          setUser(parsed)
          const me = await getCurrentUser()
          if (me.success && me.data) {
            const merged: User = { ...me.data, token: parsed.token }
            setUser(merged)
            persistUser(merged)
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error)
        persistUser(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    bootstrap()
  }, [])

  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true)
    try {
      const response = await apiLogin({ username, password })
      if (response.success && response.data) {
        const userWithToken: User = {
          ...response.data.user,
          token: response.data.token,
        }
        setUser(userWithToken)
        persistUser(userWithToken)
        if (userWithToken.role === 'admin') {
          await fetchAccounts()
        }
        return { success: true }
      }
      return { success: false, message: response.message || '登录失败，请稍后重试' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: '登录失败，请稍后重试' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (payload: RegisterPayload): Promise<RegisterResult> => {
    const response = await apiRegister(payload)
    return {
      success: response.success,
      message: response.message || (response.success ? '注册成功，请等待管理员审核' : '注册失败'),
    }
  }

  const logout = async () => {
    try {
      await apiLogout()
    } finally {
      setUser(null)
      persistUser(null)
      setAccounts([])
    }
  }

  const fetchAccounts = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setAccounts([])
      return
    }
    setAccountsLoading(true)
    try {
      const response = await getUserList({ page: 1, pageSize: 500 })
      if (response.success && response.data) {
        setAccounts(response.data.users)
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      setAccountsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAccounts()
    } else {
      setAccounts([])
    }
  }, [user?.role, fetchAccounts])

  const updateUserStatus = async (
    id: string,
    status: 'active' | 'disabled'
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await apiUpdateUserStatus({ userId: id, status })
      if (result.success) {
        setAccounts((prev) => prev.map((acc) => (acc.id === id ? { ...acc, status } : acc)))
        if (user?.id === id) {
          const updatedUser = { ...user, status }
          setUser(updatedUser)
          persistUser(updatedUser)
        }
      }
      return { success: result.success, message: result.message }
    } catch (error) {
      console.error('Failed to update user status:', error)
      return { success: false, message: '用户状态更新失败，请稍后重试' }
    }
  }

  const updateUserQuota = async (
    id: string,
    amount: number
  ): Promise<{ success: boolean; message?: string }> => {
    const target = accounts.find((acc) => acc.id === id) || (user?.id === id ? user : undefined)
    if (!target) {
      return { success: false, message: '未找到用户' }
    }
    if (target.role === 'admin') {
      return { success: false, message: '管理员额度无需修改' }
    }

    const currentQuota = target.remainingQuota ?? 0
    const newQuota = Math.max(0, currentQuota + amount)
    const newTotalQuota = Math.max(target.totalQuota ?? currentQuota, newQuota)

    try {
      const response = await apiUpdateUser({
        userId: id,
        remainingQuota: newQuota,
        totalQuota: newTotalQuota,
      })
      if (response.success) {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === id
              ? {
                  ...acc,
                  remainingQuota: newQuota,
                  totalQuota: newTotalQuota,
                }
              : acc
          )
        )
        if (user?.id === id) {
          const updatedUser = { ...user, remainingQuota: newQuota, totalQuota: newTotalQuota }
          setUser(updatedUser)
          persistUser(updatedUser)
        }
      }
      return { success: response.success, message: response.message }
    } catch (error) {
      console.error('Failed to update user quota:', error)
      return { success: false, message: '额度更新失败，请稍后重试' }
    }
  }

  const updateUserUsedQuota = (id: string, amount: number) => {
    if (!user || user.id !== id) return
    const currentQuota = user.remainingQuota ?? 0
    const newQuota = Math.max(0, currentQuota - amount)
    const updatedUser = { ...user, remainingQuota: newQuota }
    setUser(updatedUser)
    persistUser(updatedUser)
  }

  const clearCustomUsers = async (): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== 'admin') {
      return { success: false, message: '需要管理员权限' }
    }

    try {
      const targetIds = accounts.filter((acc) => acc.role === 'user').map((acc) => acc.id)
      if (targetIds.length === 0) {
        return { success: true, message: '当前没有可清理的注册用户' }
      }
      const result = await batchDeleteUsers(targetIds)
      if (result.success) {
        setAccounts((prev) => prev.filter((acc) => acc.role !== 'user'))
      }
      return { success: result.success, message: result.message }
    } catch (error) {
      console.error('Failed to clear users:', error)
      return { success: false, message: '清理注册用户失败，请稍后重试' }
    }
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      accounts,
      accountsLoading,
      login,
      register,
      logout,
      fetchAccounts,
      clearCustomUsers,
      updateUserStatus,
      updateUserQuota,
      updateUserUsedQuota,
    }),
    [
      user,
      isLoading,
      accounts,
      accountsLoading,
      login,
      register,
      logout,
      fetchAccounts,
      clearCustomUsers,
      updateUserStatus,
      updateUserQuota,
      updateUserUsedQuota,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}








