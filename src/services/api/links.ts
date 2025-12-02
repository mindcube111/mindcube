/**
 * 链接管理 API
 * 包括生成、查询、更新状态、删除等
 */

import apiClient from './client'
import { Link, LinkStatus, QuestionnaireType } from '@/types'

export interface GenerateLinkRequest {
  questionnaireType: QuestionnaireType
  quantity?: number // 生成数量，默认为1
  expiresAt?: string // 过期时间（ISO 8601）
  customPrefix?: string // 自定义链接前缀
}

export interface GenerateLinkResponse {
  links: Link[]
  total: number
}

export interface LinkListParams {
  page?: number
  pageSize?: number
  search?: string
  questionnaireType?: QuestionnaireType
  status?: LinkStatus
  startDate?: string
  endDate?: string
}

export interface LinkListResponse {
  links: Link[]
  total: number
  page: number
  pageSize: number
}

export interface UpdateLinkStatusRequest {
  linkId: string
  status: LinkStatus
}

export interface BatchUpdateLinkStatusRequest {
  linkIds: string[]
  status: LinkStatus
}

/**
 * 生成测试链接
 */
export async function generateLinks(
  data: GenerateLinkRequest
): Promise<{ success: boolean; data?: GenerateLinkResponse; message?: string }> {
  const response = await apiClient.post<GenerateLinkResponse>('/links/generate', data)
  return {
    success: response.success,
    data: response.data,
    message: response.message || (response.success ? '链接生成成功' : '链接生成失败'),
  }
}

/**
 * 获取链接列表
 */
export async function getLinkList(
  params?: LinkListParams
): Promise<{ success: boolean; data?: LinkListResponse; message?: string }> {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
  if (params?.search) queryParams.append('search', params.search)
  if (params?.questionnaireType)
    queryParams.append('questionnaireType', params.questionnaireType)
  if (params?.status) queryParams.append('status', params.status)
  if (params?.startDate) queryParams.append('startDate', params.startDate)
  if (params?.endDate) queryParams.append('endDate', params.endDate)

  const endpoint = `/links${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  const response = await apiClient.get<LinkListResponse>(endpoint)

  return {
    success: response.success,
    data: response.data,
    message: response.message,
  }
}

/**
 * 获取单个链接详情
 */
export async function getLinkById(
  linkId: string
): Promise<{ success: boolean; data?: Link; message?: string }> {
  const response = await apiClient.get<Link>(`/links/${linkId}`)
  return {
    success: response.success,
    data: response.data,
    message: response.message,
  }
}

/**
 * 更新链接状态
 */
export async function updateLinkStatus(
  data: UpdateLinkStatusRequest
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.patch(`/links/${data.linkId}/status`, {
    status: data.status,
  })
  return {
    success: response.success,
    message: response.message || (response.success ? '链接状态更新成功' : '链接状态更新失败'),
  }
}

/**
 * 批量更新链接状态
 */
export async function batchUpdateLinkStatus(
  data: BatchUpdateLinkStatusRequest
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.patch('/links/batch-update-status', data)
  return {
    success: response.success,
    message: response.message || (response.success ? '批量更新成功' : '批量更新失败'),
  }
}

/**
 * 删除链接
 */
export async function deleteLink(linkId: string): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.delete(`/links/${linkId}`)
  return {
    success: response.success,
    message: response.message || (response.success ? '链接删除成功' : '链接删除失败'),
  }
}

/**
 * 批量删除链接
 */
export async function batchDeleteLinks(
  linkIds: string[]
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.post('/links/batch-delete', { linkIds })
  return {
    success: response.success,
    message: response.message || (response.success ? '批量删除成功' : '批量删除失败'),
  }
}

/**
 * 获取链接统计信息
 */
export async function getLinkStats(linkId: string): Promise<{
  success: boolean
  data?: {
    totalViews: number
    totalCompletions: number
    completionRate: number
    avgCompletionTime?: number
  }
  message?: string
}> {
  const response = await apiClient.get(`/links/${linkId}/stats`)
  return {
    success: response.success,
    data: response.data,
    message: response.message,
  }
}

