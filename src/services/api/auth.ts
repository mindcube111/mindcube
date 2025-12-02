/**
 * 认证相关 API
 * 包括登录、注册、登出、获取用户信息等
 */

import apiClient from './client'
import { User } from '@/types'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  expiresIn?: number
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  name?: string
}

export interface RegisterResponse {
  message: string
  userId?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

/**
 * 用户登录
 */
export async function login(
  credentials: LoginRequest
): Promise<{ success: boolean; message?: string; data?: LoginResponse }> {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials, {
    skipAuth: true,
  })

  if (response.success && response.data) {
    // 保存 token
    apiClient.setAuthToken(response.data.token)
    // 保存用户信息
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return {
      success: true,
      data: response.data,
    }
  }

  return {
    success: false,
    message: response.message || '登录失败，请稍后重试',
  }
}

/**
 * 用户注册
 */
export async function register(
  data: RegisterRequest
): Promise<{ success: boolean; message?: string; data?: RegisterResponse }> {
  const response = await apiClient.post<RegisterResponse>('/auth/register', data, {
    skipAuth: true,
  })

  return {
    success: response.success,
    message: response.message || (response.success ? '注册成功，请等待管理员审核' : '注册失败'),
    data: response.data,
  }
}

/**
 * 用户登出
 */
export async function logout(): Promise<{ success: boolean; message?: string }> {
  try {
    await apiClient.post('/auth/logout')
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // 无论接口是否成功，都清除本地数据
    apiClient.clearAuthToken()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
    }
  }
  return { success: true }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<{ success: boolean; data?: User; message?: string }> {
  const response = await apiClient.get<User>('/auth/me')
  return {
    success: response.success,
    data: response.data,
    message: response.message,
  }
}

/**
 * 刷新 Token
 */
export async function refreshToken(): Promise<{ success: boolean; token?: string; message?: string }> {
  const response = await apiClient.post<{ token: string }>('/auth/refresh', undefined, {
    skipAuth: true,
  })

  if (response.success && response.data) {
    apiClient.setAuthToken(response.data.token)
    return {
      success: true,
      token: response.data.token,
    }
  }

  return {
    success: false,
    message: response.message || 'Token 刷新失败',
  }
}

/**
 * 修改密码
 */
export async function changePassword(
  data: ChangePasswordRequest
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.post('/auth/change-password', data)
  return {
    success: response.success,
    message: response.message || (response.success ? '密码修改成功' : '密码修改失败'),
  }
}

