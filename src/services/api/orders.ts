import apiClient from './client'
import type { Order, OrderListResponse, ApiResponse } from './types'

// 重新导出类型，保持向后兼容
export type { Order, OrderListResponse }

export async function getMyOrders(): Promise<ApiResponse<OrderListResponse>> {
  return apiClient.get<OrderListResponse>('/orders')
}

/**
 * 根据订单号获取订单详情
 */
export async function getOrderByOutTradeNo(outTradeNo: string): Promise<ApiResponse<Order>> {
  return apiClient.get<Order>(`/orders/${outTradeNo}`)
}


