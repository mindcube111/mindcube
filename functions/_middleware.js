/**
 * Cloudflare Pages Middleware for SPA routing
 * 超简版本 - 避免任何可能导致连接关闭的操作
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
    
    // 静态资源直接通过
    if (
      pathname.startsWith('/assets/') ||
      pathname === '/index.html' ||
      pathname.startsWith('/favicon') ||
      /\.(js|css|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot|json|map|webp)$/.test(pathname)
    ) {
      return next()
    }
    
    // 对于所有其他路径，返回 index.html
    const response = await next(new Request(new URL('/index.html', url.origin), request))
    
    if (response && response.ok) {
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }
    
    return response
  } catch (error) {
    // 任何错误都直接返回原始响应
    return next()
  }
}
