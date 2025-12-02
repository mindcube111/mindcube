/**
 * 统一的响应格式工具函数
 */

/**
 * 成功响应
 */
export function successResponse(data, message = '操作成功') {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

/**
 * 错误响应
 */
export function errorResponse(message, code = 400, status = 400) {
  return new Response(
    JSON.stringify({
      success: false,
      message,
      code,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

/**
 * 未授权响应
 */
export function unauthorizedResponse(message = '未授权访问') {
  return errorResponse(message, 401, 401)
}

/**
 * 未找到响应
 */
export function notFoundResponse(message = '资源未找到') {
  return errorResponse(message, 404, 404)
}

/**
 * 禁止访问响应
 */
export function forbiddenResponse(message = '没有权限访问该资源') {
  return errorResponse(message, 403, 403)
}
