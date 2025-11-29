/**
 * Cloudflare Pages Middleware for SPA routing
 * 优化版本 - 更健壮的错误处理和静态资源检测
 * 
 * 功能：
 * - 处理 SPA 路由，将所有非静态资源请求重定向到 index.html
 * - 静态资源直接通过，不受中间件影响
 * - 完善的错误处理，防止连接关闭
 */
export async function onRequest(context) {
  const { request, next } = context
  
  try {
    // 安全地解析 URL
    let url
    let pathname
    
    try {
      url = new URL(request.url)
      pathname = url.pathname
    } catch (urlError) {
      // 如果 URL 解析失败，直接返回原始响应
      console.error('URL parsing error:', urlError)
      return next()
    }
    
    // 更完善的静态资源检测
    const staticExtensions = [
      '.js', '.css', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico',
      '.woff', '.woff2', '.ttf', '.eot', '.json', '.map', '.webp',
      '.mp4', '.mp3', '.pdf', '.zip', '.txt', '.xml', '.wasm'
    ]
    
    const isStaticFile = 
      staticExtensions.some(ext => pathname.toLowerCase().endsWith(ext)) ||
      pathname.startsWith('/assets/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/_static/') ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml'
    
    // 如果是静态文件，直接通过
    if (isStaticFile) {
      return next()
    }
    
    // 如果是 index.html 本身，直接返回
    if (pathname === '/index.html') {
      return next()
    }
    
    // 对于所有其他路径（SPA 路由），返回 index.html
    // 创建一个新的请求指向 index.html
    const indexUrl = new URL('/index.html', url.origin)
    
    // 创建一个新的 Request 对象，保留原始请求的头部（但移除一些可能导致问题的头部）
    const indexRequest = new Request(indexUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        // 保留原始请求的其他重要头部
        ...Object.fromEntries(
          Array.from(request.headers.entries())
            .filter(([key]) => 
              !['host', 'referer'].includes(key.toLowerCase())
            )
        ),
      },
    })
    
    try {
      // 获取 index.html 的响应
      const indexResponse = await next(indexRequest)
      
      // 确保响应有效
      if (indexResponse && indexResponse.ok) {
        // 返回 index.html 的内容，状态码为 200
        return new Response(indexResponse.body, {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            // 保留原始响应中的其他头部
            ...Object.fromEntries(
              Array.from(indexResponse.headers.entries())
                .filter(([key]) => 
                  !['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())
                )
            ),
          },
        })
      }
    } catch (indexError) {
      // 如果获取 index.html 失败，记录错误但继续
      console.error('Error fetching index.html:', indexError)
    }
    
    // 如果无法获取 index.html，尝试返回原始响应
    return next()
    
  } catch (error) {
    // 任何未预期的错误，记录并返回原始响应
    console.error('Middleware error:', error)
    try {
      return next()
    } catch (fallbackError) {
      // 如果 next() 也失败，返回一个基本的错误响应
      console.error('Fallback error:', fallbackError)
      return new Response('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    }
  }
}
