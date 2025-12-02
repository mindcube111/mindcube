/**
 * Dashboard 统计 API
 * 包括各种统计数据和图表数据
 */

import apiClient from './client'
import type { ApiResponse } from './types'
import type { DashboardStats } from '@/types'

export interface DashboardStatsResponse extends DashboardStats {
  questionnaireSummary: Array<{
    type: string
    totalLinks: number
    usedLinks: number
    completionRate: number
  }>
}

export interface ChartDataPoint {
  name: string
  链接数: number
  使用率: number
}

export interface ChartDataResponse {
  data: ChartDataPoint[]
  period: '7d' | '15d' | '30d'
}

/**
 * 获取 Dashboard 统计数据
 */
export async function getDashboardStats(): Promise<ApiResponse<DashboardStatsResponse>> {
  return apiClient.get<DashboardStatsResponse>('/dashboard/stats')
}

/**
 * 获取图表数据
 */
export async function getChartData(
  period: '7d' | '15d' | '30d' = '7d'
): Promise<ApiResponse<ChartDataResponse>> {
  return apiClient.get<ChartDataResponse>(`/dashboard/chart?period=${period}`)
}

/**
 * 获取实时数据（WebSocket 或轮询）
 * 注：实际实现可能需要 WebSocket 连接
 */
export async function getRealtimeStats(): Promise<ApiResponse<Partial<DashboardStatsResponse>>> {
  return apiClient.get<Partial<DashboardStatsResponse>>('/dashboard/realtime')
}

