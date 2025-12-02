/**
 * 通知管理 API
 * 包括获取通知列表、标记已读、删除通知等
 */

import apiClient from './client'
import type { ApiResponse } from './types'
import type { Notification, NotificationType } from '@/types'

// 使用统一的类型定义
export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
  page: number
  pageSize: number
}

export interface NotificationListParams {
  page?: number
  pageSize?: number
  type?: NotificationType
  read?: boolean
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
  page: number
  pageSize: number
}

export interface MarkReadRequest {
  notificationIds: string[]
}

export interface MarkAllReadResponse {
  markedCount: number
}

/**
 * 获取通知列表
 */
export async function getNotificationList(
  params?: NotificationListParams
): Promise<ApiResponse<NotificationListResponse>> {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
  if (params?.type) queryParams.append('type', params.type)
  if (params?.read !== undefined) queryParams.append('read', params.read.toString())

  const endpoint = `/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  return apiClient.get<NotificationListResponse>(endpoint)
}

/**
 * 获取未读通知数量
 */
export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  return apiClient.get<{ count: number }>('/notifications/unread-count')
}

/**
 * 标记通知为已读
 */
export async function markNotificationRead(
  notificationId: string
): Promise<ApiResponse<void>> {
  return apiClient.patch(`/notifications/${notificationId}/read`)
}

/**
 * 批量标记通知为已读
 */
export async function markNotificationsRead(
  data: MarkReadRequest
): Promise<{ success: boolean; message?: string; data?: MarkAllReadResponse }> {
  const response = await apiClient.patch<MarkAllReadResponse>('/notifications/mark-read', data)
  return {
    success: response.success,
    message: response.message || (response.success ? '批量标记成功' : '批量标记失败'),
    data: response.data,
  }
}

/**
 * 标记所有通知为已读
 */
export async function markAllNotificationsRead(): Promise<ApiResponse<MarkAllReadResponse>> {
  return apiClient.post<MarkAllReadResponse>('/notifications/mark-all-read')
}

/**
 * 删除通知
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.delete(`/notifications/${notificationId}`)
  return {
    success: response.success,
    message: response.message || (response.success ? '通知删除成功' : '通知删除失败'),
  }
}

/**
 * 批量删除通知
 */
export async function batchDeleteNotifications(
  notificationIds: string[]
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.post('/notifications/batch-delete', { notificationIds })
  return {
    success: response.success,
    message: response.message || (response.success ? '批量删除成功' : '批量删除失败'),
  }
}

