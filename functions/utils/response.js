/**
 * 通用响应构造工具
 * 所有 API 返回统一的 JSON 结构：
 * { success: boolean, data?: any, message?: string, code?: number }
 */

/**
 * 统一封装 JSON 响应
 * @param {Object} payload 响应体对象
 * @param {number} [status=200] HTTP 状态码
 * @param {Record<string,string>} [extraHeaders] 额外响应头
 * @returns {Response}
 */
function jsonResponse(payload, status = 200, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  }
  return new Response(JSON.stringify(payload), {
    status,
    headers,
  })
}

/**
 * 成功响应
 * @param {any} data 业务数据
 * @param {string} [message] 提示信息
 * @param {number} [status=200] HTTP 状态码
 * @returns {Response}
 */
export function successResponse(data = null, message = '', status = 200) {
  const body = {
    success: true,
    ...(data !== undefined && data !== null ? { data } : {}),
    ...(message ? { message } : {}),
  }
  return jsonResponse(body, status)
}

/**
 * 错误响应
 * @param {string} message 错误提示
 * @param {number} [status=400] HTTP 状态码
 * @param {number} [code] 业务错误码
 * @returns {Response}
 */
export function errorResponse(message = '请求失败', status = 400, code) {
  const body = {
    success: false,
    message,
    code: typeof code === 'number' ? code : status, // 确保总是有 code 字段
  }
  return jsonResponse(body, status)
}

/**
 * 未授权/未登录
 * @param {string} message 提示信息
 * @returns {Response}
 */
export function unauthorizedResponse(message = '未授权') {
  return errorResponse(message, 401, 401)
}

/**
 * 资源不存在
 * @param {string} message 提示信息
 * @returns {Response}
 */
export function notFoundResponse(message = '资源不存在') {
  return errorResponse(message || '资源不存在', 404, 404)
}


