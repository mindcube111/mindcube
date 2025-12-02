/**
 * 题库管理 API
 * 包括导入、获取、上架/下架、重命名等
 */

import apiClient from './client'
import { QuestionnaireData, QuestionnaireType } from '@/types'

export interface ImportQuestionnaireRequest {
  type: QuestionnaireType
  questions: QuestionnaireData
  description?: string
}

export interface ImportQuestionnaireResponse {
  type: QuestionnaireType
  questionCount: number
  importedAt: string
}

export interface QuestionnaireInfo {
  type: QuestionnaireType
  title: string
  description: string
  questionCount: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface QuestionnaireListResponse {
  questionnaires: QuestionnaireInfo[]
  total: number
}

export interface UpdatePublishStatusRequest {
  type: QuestionnaireType
  isPublished: boolean
}

export interface RenameQuestionnaireRequest {
  oldType: QuestionnaireType
  newType: QuestionnaireType
}

/**
 * 导入问卷题库
 */
export async function importQuestionnaire(
  data: ImportQuestionnaireRequest
): Promise<{ success: boolean; message?: string; data?: ImportQuestionnaireResponse }> {
  const response = await apiClient.post<ImportQuestionnaireResponse>(
    '/admin/questionnaires/import',
    data
  )
  return {
    success: response.success,
    message: response.message || (response.success ? '题库导入成功' : '题库导入失败'),
    data: response.data,
  }
}

/**
 * 获取问卷题库列表
 */
export async function getQuestionnaireList(params?: {
  page?: number
  pageSize?: number
  search?: string
  isPublished?: boolean
}): Promise<{ success: boolean; data?: QuestionnaireListResponse; message?: string }> {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
  if (params?.search) queryParams.append('search', params.search)
  if (params?.isPublished !== undefined)
    queryParams.append('isPublished', params.isPublished.toString())

  const endpoint = `/admin/questionnaires${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  const response = await apiClient.get<QuestionnaireListResponse>(endpoint)

  return {
    success: response.success,
    data: response.data,
    message: response.message,
  }
}

/**
 * 获取单个问卷题库详情
 */
export async function getQuestionnaire(
  type: QuestionnaireType
): Promise<{ success: boolean; data?: QuestionnaireData; message?: string }> {
  const response = await apiClient.get<QuestionnaireData>(`/admin/questionnaires/${encodeURIComponent(type)}`)
  return {
    success: response.success,
    data: response.data,
    message: response.message,
  }
}

/**
 * 更新问卷上架状态
 */
export async function updatePublishStatus(
  data: UpdatePublishStatusRequest
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.patch(
    `/admin/questionnaires/${encodeURIComponent(data.type)}/publish-status`,
    { isPublished: data.isPublished }
  )
  return {
    success: response.success,
    message:
      response.message ||
      (response.success
        ? `问卷已${data.isPublished ? '上架' : '下架'}`
        : '状态更新失败'),
  }
}

/**
 * 重命名问卷类型
 */
export async function renameQuestionnaire(
  data: RenameQuestionnaireRequest
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.patch(
    `/admin/questionnaires/${encodeURIComponent(data.oldType)}/rename`,
    { newType: data.newType }
  )
  return {
    success: response.success,
    message: response.message || (response.success ? '问卷重命名成功' : '问卷重命名失败'),
  }
}

/**
 * 删除问卷题库
 */
export async function deleteQuestionnaire(
  type: QuestionnaireType
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.delete(`/admin/questionnaires/${encodeURIComponent(type)}`)
  return {
    success: response.success,
    message: response.message || (response.success ? '问卷删除成功' : '问卷删除失败'),
  }
}

/**
 * 获取可用的问卷类型列表（仅已上架的）
 */
export async function getAvailableQuestionnaires(): Promise<{
  success: boolean
  data?: QuestionnaireInfo[]
  message?: string
}> {
  const response = await apiClient.get<QuestionnaireInfo[]>('/questionnaires/available')
  return {
    success: response.success,
    data: response.data,
    message: response.message,
  }
}

