/**
 * 统一响应格式工具
 */

/**
 * 成功响应
 */
export function successResponse(data, message = '操作成功') {
  return Response.json(
    {
      success: true,
      data,
      message,
    },
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
  return Response.json(
    {
      success: false,
      message,
      code,
    },
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
export function unauthorizedResponse(message = '未授权，请先登录') {
  return errorResponse(message, 401, 401)
}

/**
 * 禁止访问响应
 */
export function forbiddenResponse(message = '没有权限访问该资源') {
  return errorResponse(message, 403, 403)
}

/**
 * 未找到响应
 */
export function notFoundResponse(message = '资源不存在') {
  return errorResponse(message, 404, 404)
}

/**
 * 服务器错误响应
 */
export function serverErrorResponse(message = '服务器内部错误') {
  return errorResponse(message, 500, 500)
}

