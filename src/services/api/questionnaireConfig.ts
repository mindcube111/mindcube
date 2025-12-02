/**
 * 问卷配置 API
 * 管理问卷上架状态、自定义问卷类型、系统问卷覆盖配置等
 */

import apiClient from './client'
import { QuestionnaireConfig } from '@/utils/questionnaireConfig'

export interface QuestionnaireConfigResponse {
  questionnaires: QuestionnaireConfig[]
  publishState: Record<string, boolean>
  customTypes: QuestionnaireConfig[]
  systemOverrides: Record<string, Partial<QuestionnaireConfig>>
}

export interface UpdatePublishStateRequest {
  value: string
  isPublished: boolean
}

export interface BatchUpdatePublishStateRequest {
  states: Record<string, boolean>
}

export interface UpdateQuestionnaireConfigRequest {
  value: string
  updates: Partial<Omit<QuestionnaireConfig, 'value' | 'isCustom'>>
}

/**
 * 获取所有问卷配置（包括上架状态、自定义类型、系统覆盖等）
 */
export async function getQuestionnaireConfig(): Promise<{
  success: boolean
  data?: QuestionnaireConfigResponse
  message?: string
}> {
  const response = await apiClient.get<QuestionnaireConfigResponse>('/admin/questionnaire-config')
  return {
    success: response.success,
    data: response.data,
    message: response.message,
  }
}

/**
 * 获取已上架的问卷列表（公开接口，无需认证）
 */
export async function getPublishedQuestionnaires(): Promise<{
  success: boolean
  data?: QuestionnaireConfig[]
  message?: string
}> {
  const response = await apiClient.get<QuestionnaireConfig[]>('/questionnaires/published', {
    skipAuth: true,
  })
  return {
    success: response.success,
    data: response.data,
    message: response.message,
  }
}

/**
 * 更新单个问卷的上架状态
 */
export async function updatePublishState(
  data: UpdatePublishStateRequest
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.patch(
    `/admin/questionnaire-config/publish-state/${encodeURIComponent(data.value)}`,
    { isPublished: data.isPublished }
  )
  return {
    success: response.success,
    message: response.message || (response.success ? '状态更新成功' : '状态更新失败'),
  }
}

/**
 * 批量更新问卷上架状态
 */
export async function batchUpdatePublishState(
  data: BatchUpdatePublishStateRequest
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.patch('/admin/questionnaire-config/publish-state/batch', data)
  return {
    success: response.success,
    message: response.message || (response.success ? '批量更新成功' : '批量更新失败'),
  }
}

/**
 * 更新问卷配置（标签、描述、价格等）
 */
export async function updateQuestionnaireConfig(
  data: UpdateQuestionnaireConfigRequest
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.patch(
    `/admin/questionnaire-config/${encodeURIComponent(data.value)}`,
    data.updates
  )
  return {
    success: response.success,
    message: response.message || (response.success ? '配置更新成功' : '配置更新失败'),
  }
}

/**
 * 添加自定义问卷类型
 */
export async function addCustomQuestionnaire(
  config: QuestionnaireConfig
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.post('/admin/questionnaire-config/custom', config)
  return {
    success: response.success,
    message: response.message || (response.success ? '添加成功' : '添加失败'),
  }
}

/**
 * 删除自定义问卷类型
 */
export async function deleteCustomQuestionnaire(
  value: string
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.delete(`/admin/questionnaire-config/custom/${encodeURIComponent(value)}`)
  return {
    success: response.success,
    message: response.message || (response.success ? '删除成功' : '删除失败'),
  }
}






