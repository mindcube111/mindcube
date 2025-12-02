import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { User } from '@/types'

interface RegisterPayload {
  username: string
  email: string
  password: string
}

interface RegisterResult {
  success: boolean
  message: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (payload: RegisterPayload) => Promise<RegisterResult>
  accounts: StoredAccount[]
  clearCustomUsers: () => void
  updateUserStatus: (id: string, status: 'active' | 'disabled') => void
  updateUserQuota: (id: string, amount: number) => void // 添加额度（可以是正数或负数）
  updateUserUsedQuota: (id: string, amount: number) => void // 更新使用额度（生成链接时调用）
  logout: () => void
  isLoading: boolean
}

interface StoredAccount {
  id: string
  username: string
  email: string
  password: string
  role: 'admin' | 'user'
  name: string
  createdAt: string
  status: 'active' | 'disabled'
  isDefault?: boolean
  remainingQuota: number
  lastLoginAt?: string // 最近一次在线日期
  totalRecharge?: number // 累计充值金额（单位：元）
  totalUsedQuota?: number // 累计使用额度
  totalQuota?: number // 累计总额度（初始额度 + 所有添加的额度）
}

import { STORAGE_KEYS } from '@/constants'
const CUSTOM_USERS_KEY = STORAGE_KEYS.CUSTOM_USERS

const defaultAccounts: StoredAccount[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    name: '管理员',
    createdAt: '2024-01-01T00:00:00.000Z',
    status: 'active',
    isDefault: true,
    remainingQuota: 9999,
  },
  {
    id: '2',
    username: 'user',
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
    name: '测试用户',
    createdAt: '2024-01-01T00:00:00.000Z',
    status: 'active',
    isDefault: true,
    remainingQuota: 300,
  },
]

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [customUsers, setCustomUsers] = useState<StoredAccount[]>([])
  const [defaultLoginTimesVersion, setDefaultLoginTimesVersion] = useState(0) // 用于触发默认账号登录时间更新

  useEffect(() => {
    // 从 localStorage 恢复登录状态
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        setUser({
          ...parsed,
          remainingQuota: parsed?.remainingQuota ?? 0,
        })
      } catch (error) {
        console.error('Failed to parse saved user:', error)
        localStorage.removeItem('user')
      }
    }

    const savedCustomUsers = localStorage.getItem(CUSTOM_USERS_KEY)
    if (savedCustomUsers) {
      try {
        setCustomUsers(JSON.parse(savedCustomUsers))
      } catch (error) {
        console.error('Failed to parse custom users:', error)
        localStorage.removeItem(CUSTOM_USERS_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const persistCustomUsers = (users: StoredAccount[]) => {
    localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(users))
  }

  // 合并默认账号和注册用户，并为默认账号添加 lastLoginAt 和 totalRecharge 从独立存储
  const accounts = useMemo(() => {
    // 从 localStorage 加载默认账号的最后登录时间
    const defaultLoginTimes = (() => {
      if (typeof window === 'undefined') return {}
      try {
        const stored = localStorage.getItem('default_accounts_login_times')
        return stored ? JSON.parse(stored) : {}
      } catch {
        return {}
      }
    })()

    // 从 localStorage 加载默认账号的累计充值金额
    const defaultRechargeAmounts = (() => {
      if (typeof window === 'undefined') return {}
      try {
        const stored = localStorage.getItem('default_accounts_recharge')
        return stored ? JSON.parse(stored) : {}
      } catch {
        return {}
      }
    })()

    // 从 localStorage 加载默认账号的额度
    const defaultQuotas = (() => {
      if (typeof window === 'undefined') return {}
      try {
        const stored = localStorage.getItem('default_accounts_quota')
        return stored ? JSON.parse(stored) : {}
      } catch {
        return {}
      }
    })()

    // 从 localStorage 加载默认账号的累计使用额度
    const defaultUsedQuotas = (() => {
      if (typeof window === 'undefined') return {}
      try {
        const stored = localStorage.getItem('default_accounts_used_quota')
        return stored ? JSON.parse(stored) : {}
      } catch {
        return {}
      }
    })()

    // 从 localStorage 加载默认账号的累计总额度
    const defaultTotalQuotas = (() => {
      if (typeof window === 'undefined') return {}
      try {
        const stored = localStorage.getItem('default_accounts_total_quota')
        return stored ? JSON.parse(stored) : {}
      } catch {
        return {}
      }
    })()

    const defaultWithExtras = defaultAccounts.map(acc => {
      // 对于管理员账号，如果 localStorage 中没有数据，使用默认值 9999
      // 对于普通默认账号，如果 localStorage 中没有数据，使用默认值
      let remaining = defaultQuotas[acc.id] !== undefined ? defaultQuotas[acc.id] : acc.remainingQuota
      
      // 如果是管理员账号且没有 localStorage 数据，确保使用默认值 9999
      if (acc.role === 'admin' && defaultQuotas[acc.id] === undefined) {
        remaining = 9999
      }
      
      const totalUsed = defaultUsedQuotas[acc.id] || 0
      const totalQuota = defaultTotalQuotas[acc.id] !== undefined ? defaultTotalQuotas[acc.id] : acc.remainingQuota
      
      return {
        ...acc,
        lastLoginAt: defaultLoginTimes[acc.id] || acc.lastLoginAt,
        totalRecharge: defaultRechargeAmounts[acc.id] || acc.totalRecharge || 0,
        remainingQuota: remaining,
        totalUsedQuota: totalUsed,
        totalQuota: totalQuota
      }
    })

    return [...defaultWithExtras, ...customUsers]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customUsers, defaultLoginTimesVersion])

  const findAccount = (username: string, password: string) => {
    return accounts.find(
      (account) => account.username === username && account.password === password,
    )
  }

  const updateUserStatus = (id: string, status: 'active' | 'disabled') => {
    setCustomUsers(prev => {
      const updated = prev.map((account) =>
        account.id === id ? { ...account, status } : account,
      )
      persistCustomUsers(updated)
      return updated
    })
  }

  const updateUserQuota = (id: string, amount: number) => {
    // 查找账号
    const account = accounts.find(acc => acc.id === id)
    if (!account) return

    // 管理员账号额度为无限，不允许修改
    if (account.role === 'admin') {
      return
    }

    const currentQuota = account.remainingQuota || 0
    const newQuota = Math.max(0, currentQuota + amount) // 确保不小于0
    // 累计总额度 = 当前累计总额度（如果没有则使用初始剩余额度） + 添加的额度
    const currentTotalQuota = account.totalQuota !== undefined 
      ? account.totalQuota 
      : (account.remainingQuota || 0)
    const newTotalQuota = currentTotalQuota + amount // 累计总额度增加

    if (account.isDefault) {
      // 更新默认账号的额度（存储在独立的 localStorage 键中）
      try {
        const stored = localStorage.getItem('default_accounts_quota')
        const quotaData = stored ? JSON.parse(stored) : {}
        quotaData[account.id] = newQuota
        
        // 更新累计总额度
        const totalQuotaData = localStorage.getItem('default_accounts_total_quota')
        const totalQuota = totalQuotaData ? JSON.parse(totalQuotaData) : {}
        totalQuota[account.id] = newTotalQuota
        
        localStorage.setItem('default_accounts_quota', JSON.stringify(quotaData))
        localStorage.setItem('default_accounts_total_quota', JSON.stringify(totalQuota))
        
        // 触发 accounts 重新计算（通过更新版本号）
        setDefaultLoginTimesVersion(prev => prev + 1)
      } catch (error) {
        console.error('Failed to update default account quota:', error)
      }
    } else {
      // 更新注册用户的额度
      setCustomUsers(prev => {
        const updated = prev.map((acc) =>
          acc.id === id ? { 
            ...acc, 
            remainingQuota: newQuota,
            totalQuota: newTotalQuota
          } : acc
        )
        persistCustomUsers(updated)
        return updated
      })
    }

    // 如果更新的是当前登录用户，同步更新 user 状态
    if (user && user.id === id) {
      setUser({
        ...user,
        remainingQuota: newQuota,
      })
      localStorage.setItem('user', JSON.stringify({
        ...user,
        remainingQuota: newQuota,
      }))
    }
  }

  // 更新用户使用额度（生成链接时调用）
  const updateUserUsedQuota = (id: string, amount: number) => {
    // 查找账号
    const account = accounts.find(acc => acc.id === id)
    if (!account) return

    // 管理员账号不受限制
    if (account.role === 'admin') {
      return
    }

    const currentUsedQuota = account.totalUsedQuota || 0
    const newUsedQuota = currentUsedQuota + amount
    const currentQuota = account.remainingQuota || 0
    const newQuota = Math.max(0, currentQuota - amount)

    if (account.isDefault) {
      // 更新默认账号的使用额度
      try {
        const storedUsed = localStorage.getItem('default_accounts_used_quota')
        const usedQuotaData = storedUsed ? JSON.parse(storedUsed) : {}
        usedQuotaData[account.id] = newUsedQuota
        
        const storedQuota = localStorage.getItem('default_accounts_quota')
        const quotaData = storedQuota ? JSON.parse(storedQuota) : {}
        quotaData[account.id] = newQuota
        
        localStorage.setItem('default_accounts_used_quota', JSON.stringify(usedQuotaData))
        localStorage.setItem('default_accounts_quota', JSON.stringify(quotaData))
        
        // 触发 accounts 重新计算
        setDefaultLoginTimesVersion(prev => prev + 1)
      } catch (error) {
        console.error('Failed to update default account used quota:', error)
      }
    } else {
      // 更新注册用户的使用额度
      setCustomUsers(prev => {
        const updated = prev.map((acc) =>
          acc.id === id ? { 
            ...acc, 
            remainingQuota: newQuota,
            totalUsedQuota: newUsedQuota
          } : acc
        )
        persistCustomUsers(updated)
        return updated
      })
    }

    // 如果更新的是当前登录用户，同步更新 user 状态
    if (user && user.id === id) {
      setUser({
        ...user,
        remainingQuota: newQuota,
      })
      localStorage.setItem('user', JSON.stringify({
        ...user,
        remainingQuota: newQuota,
      }))
    }
  }

  const clearCustomUsers = () => {
    setCustomUsers([])
    persistCustomUsers([])
  }

  const login = async (
    username: string,
    password: string,
  ): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true)
    try {
      // 模拟登录API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      const account = findAccount(username, password)
      if (!account) {
        setIsLoading(false)
        return { success: false, message: '用户名或密码错误' }
      }

      if (account.status !== 'active') {
        setIsLoading(false)
        return {
          success: false,
          message: '该账号尚未通过管理员审核或已被禁用，请联系管理员',
        }
      }

      // 更新最近登录时间
      const now = new Date().toISOString()
      let finalAccount = account // 用于存储最终的账号数据
      
      if (account.isDefault) {
        // 更新默认账号的登录时间（持久化到独立的 localStorage 键）
        try {
          const stored = localStorage.getItem('default_accounts_login_times')
          const loginTimes = stored ? JSON.parse(stored) : {}
          loginTimes[account.id] = now
          localStorage.setItem('default_accounts_login_times', JSON.stringify(loginTimes))
          
          // 如果是管理员账号且没有初始化额度数据，初始化默认额度
          if (account.role === 'admin') {
            const quotaStored = localStorage.getItem('default_accounts_quota')
            const quotaData = quotaStored ? JSON.parse(quotaStored) : {}
            // 如果没有管理员额度数据，初始化默认值 9999
            if (quotaData[account.id] === undefined) {
              quotaData[account.id] = 9999
              localStorage.setItem('default_accounts_quota', JSON.stringify(quotaData))
              // 更新 finalAccount 使用新的额度值
              finalAccount = { ...account, remainingQuota: 9999 }
            }
            // 初始化累计总额度
            const totalQuotaStored = localStorage.getItem('default_accounts_total_quota')
            const totalQuotaData = totalQuotaStored ? JSON.parse(totalQuotaStored) : {}
            if (totalQuotaData[account.id] === undefined) {
              totalQuotaData[account.id] = 9999
              localStorage.setItem('default_accounts_total_quota', JSON.stringify(totalQuotaData))
            }
          }
          
          // 触发 accounts 重新计算
          setDefaultLoginTimesVersion(prev => prev + 1)
        } catch (error) {
          console.error('Failed to save default account login time:', error)
        }
      } else {
        // 更新注册用户的登录时间（持久化到 customUsers）
        setCustomUsers(prev => {
          const updated = prev.map((acc) =>
            acc.id === account.id ? { ...acc, lastLoginAt: now } : acc
          )
          persistCustomUsers(updated)
          return updated
        })
      }

      // 使用 finalAccount 对象（如果初始化了管理员数据，已包含正确的额度）
      const userData: User = {
        id: finalAccount.id,
        username: finalAccount.username,
        email: finalAccount.email,
        name: finalAccount.name || finalAccount.username,
        role: finalAccount.role,
        createdAt: finalAccount.createdAt,
        remainingQuota: finalAccount.remainingQuota,
      }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      setIsLoading(false)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      return { success: false, message: '登录失败，请稍后重试' }
    }
  }

  const register = async ({ username, email, password }: RegisterPayload): Promise<RegisterResult> => {
    await new Promise(resolve => setTimeout(resolve, 800))

    const exists = [...defaultAccounts, ...customUsers].some(
      (account) => account.username.toLowerCase() === username.toLowerCase(),
    )
    if (exists) {
      return { success: false, message: '用户名已存在，请更换后重试' }
    }

    const newUser: StoredAccount = {
      id: Date.now().toString(),
      username,
      email,
      password,
      role: 'user',
      name: username,
      createdAt: new Date().toISOString(),
      status: 'disabled',
      remainingQuota: 0,
    }

    const updatedUsers = [...customUsers, newUser]
    setCustomUsers(updatedUsers)
    persistCustomUsers(updatedUsers)
    return { success: true, message: '注册成功，请等待管理员审核后再登录' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        accounts,
        clearCustomUsers,
        updateUserStatus,
        updateUserQuota,
        updateUserUsedQuota,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}








