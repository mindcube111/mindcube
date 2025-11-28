/**
 * Cloudflare Pages Middleware for SPA routing
 * 最简版本 - 确保连接不会关闭
 */
export async function onRequest(context) {
  const { request, next } = context
  const url = new URL(request.url)
  const pathname = url.pathname
  
  // 静态资源直接通过
  const staticExtensions = ['.js', '.css', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json', '.map', '.webp']
  const isStaticFile = 
    staticExtensions.some(ext => pathname.endsWith(ext)) ||
    pathname.startsWith('/assets/') ||
    pathname === '/index.html' ||
    pathname.startsWith('/favicon')
  
  if (isStaticFile) {
    return next()
  }
  
  // 对于所有其他路径，返回 index.html
  const indexUrl = new URL('/index.html', url.origin)
  const indexRequest = new Request(indexUrl, {
    method: 'GET',
    headers: request.headers,
  })
  
  try {
    const response = await next(indexRequest)
    if (response && response.ok) {
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }
  } catch (error) {
    // 出错时返回原始响应
  }
  
  return next()
}
