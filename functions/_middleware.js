/**
 * Cloudflare Pages Middleware for SPA routing
 * 修复版本 - 正确处理所有路由和静态资源
 */
export async function onRequest(context) {
  const { request, next } = context
  
  try {
    const url = new URL(request.url)
    const pathname = url.pathname
    
    // API 路由直接通过，不处理
    if (pathname.startsWith('/api/')) {
      return next()
    }
    
    // 静态资源直接通过（包括 logo-cube.jpg）
    if (
      pathname.startsWith('/assets/') ||
      pathname === '/index.html' ||
      pathname.startsWith('/favicon') ||
      pathname === '/logo-cube.jpg' ||
      /\.(js|css|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot|json|map|webp)$/.test(pathname)
    ) {
      return next()
    }
    
    // 对于所有其他路径（SPA 路由），返回 index.html
    // 创建一个新的请求，但保持原始请求的方法和头部
    const indexUrl = new URL('/index.html', url.origin)
    const indexRequest = new Request(indexUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    })
    
    const response = await next(indexRequest)
    
    // 如果成功获取到 index.html，返回它
    if (response && response.ok) {
      return new Response(response.body, {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...Object.fromEntries(response.headers.entries()),
        },
      })
    }
    
    // 如果获取失败，尝试直接返回原始响应
    return response || next()
  } catch (error) {
    // 任何错误都直接返回原始响应，避免连接关闭
    console.error('Middleware error:', error)
    return next()
  }
}
