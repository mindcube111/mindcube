/**
 * Cloudflare Pages Middleware for SPA routing
 * 将所有请求重定向到 index.html，让 React Router 处理路由
 */
export async function onRequest(context) {
  const { request, next } = context
  const url = new URL(request.url)
  const pathname = url.pathname
  
  // 定义静态资源的扩展名和路径
  const staticExtensions = [
    '.js', '.css', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico',
    '.woff', '.woff2', '.ttf', '.eot', '.json', '.map', '.webp',
    '.mp4', '.mp3', '.pdf', '.zip'
  ]
  
  // 判断是否为静态文件
  const isStaticFile = 
    staticExtensions.some(ext => pathname.endsWith(ext)) ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_static/') ||
    pathname === '/favicon.ico' ||
    pathname === '/index.html' ||
    pathname === '/_redirects'
  
  // 如果是静态文件或 index.html，直接返回
  if (isStaticFile) {
    return next()
  }
  
  // 对于所有非静态文件路径，先尝试获取原始响应
  const originalResponse = await next()
  
  // 如果响应是 404 或 403，且不是静态文件，返回 index.html
  if ((originalResponse.status === 404 || originalResponse.status === 403) && !isStaticFile) {
    // 构建指向 index.html 的请求
    const indexUrl = new URL(request.url)
    indexUrl.pathname = '/index.html'
    
    // 获取 index.html
    const indexRequest = new Request(indexUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
    })
    
    try {
      const indexResponse = await next(indexRequest)
      
      // 如果成功获取 index.html，返回它
      if (indexResponse.ok) {
        return new Response(indexResponse.body, {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=0, must-revalidate',
          },
        })
      }
    } catch (error) {
      console.error('Middleware error:', error)
    }
  }
  
  // 如果无法获取 index.html，返回原始响应
  return originalResponse
}
