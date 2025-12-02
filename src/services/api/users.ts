/**
 * 用户管理 API
 * 包括获取用户列表、更新用户状态、删除用户等（仅管理员）
 */

import apiClient from './client'
import { User } from '@/types'

export interface UserListParams {
  page?: number
  pageSize?: number
  search?: string
  role?: 'admin' | 'user'
  status?: 'active' | 'disabled'
}

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
}

export interface UpdateUserStatusRequest {
  userId: string
  status: 'active' | 'disabled'
}

export interface UpdateUserRequest {
  userId: string
  name?: string
  email?: string
  role?: 'admin' | 'user'
  remainingQuota?: number
  totalQuota?: number
}

/**
 * 获取用户列表
 */
export async function getUserList(
  params?: UserListParams
): Promise<{ success: boolean; data?: UserListResponse; message?: string }> {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
  if (params?.search) queryParams.append('search', params.search)
  if (params?.role) queryParams.append('role', params.role)
  if (params?.status) queryParams.append('status', params.status)

  const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  const response = await apiClient.get<UserListResponse>(endpoint)

  return {
    success: response.success,
    data: response.data,
    message: response.message,
  }
}

/**
 * 获取单个用户详情
 */
export async function getUserById(
  userId: string
): Promise<{ success: boolean; data?: User; message?: string }> {
  const response = await apiClient.get<User>(`/users/${userId}`)
  return {
    success: response.success,
    data: response.data,
    message: response.message,
  }
}

/**
 * 更新用户状态（启用/禁用）
 */
export async function updateUserStatus(
  data: UpdateUserStatusRequest
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.patch(`/users/${data.userId}/status`, {
    status: data.status,
  })
  return {
    success: response.success,
    message: response.message || (response.success ? '用户状态更新成功' : '用户状态更新失败'),
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(
  data: UpdateUserRequest
): Promise<{ success: boolean; message?: string; data?: User }> {
  const { userId, ...updateData } = data
  const response = await apiClient.put<User>(`/users/${userId}`, updateData)
  return {
    success: response.success,
    message: response.message || (response.success ? '用户信息更新成功' : '用户信息更新失败'),
    data: response.data,
  }
}

/**
 * 删除用户
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.delete(`/users/${userId}`)
  return {
    success: response.success,
    message: response.message || (response.success ? '用户删除成功' : '用户删除失败'),
  }
}

/**
 * 批量删除用户
 */
export async function batchDeleteUsers(
  userIds: string[]
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.post('/users/batch-delete', { userIds })
  return {
    success: response.success,
    message: response.message || (response.success ? '批量删除成功' : '批量删除失败'),
  }
}

/**
 * 重置用户密码（管理员操作）
 */
export async function resetUserPassword(
  userId: string
): Promise<{ success: boolean; message?: string; newPassword?: string }> {
  const response = await apiClient.post<{ newPassword: string }>(`/users/${userId}/reset-password`)
  return {
    success: response.success,
    message: response.message || (response.success ? '密码重置成功' : '密码重置失败'),
    newPassword: response.data?.newPassword,
  }
}

