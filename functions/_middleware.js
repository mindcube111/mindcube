/**
 * Cloudflare Pages Middleware for SPA routing
 * 处理静态资源请求和SPA路由重定向
 */
export async function onRequest(context) {
  const { request, next } = context
  
  try {
    const url = new URL(request.url)
    const pathname = url.pathname
    
    // 获取请求的 Accept 头，用于判断是否为 HTML 请求
    const acceptHeader = request.headers.get('Accept') || ''
    const isHtmlRequest = acceptHeader.includes('text/html')
    
    // 扩展的静态资源检测 - 包括所有可能的文件类型
    const hasFileExtension = /\.([a-z0-9]+)$/i.test(pathname)
    const isStaticPath = 
      pathname.startsWith('/assets/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/_static/') ||
      pathname.startsWith('/node_modules/') ||
      pathname.startsWith('/src/')
    
    const isStaticExtension = /\.(js|mjs|jsx|ts|tsx|css|scss|sass|less|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot|otf|json|map|webp|mp4|mp3|pdf|zip|txt|xml|wasm|data|bin|webm|avi|mov|flv|swf|ogg|wav|aac|flac|rss|atom|yaml|yml|toml|md|markdown|gzip|bz2|7z|rar|tar|gz)$/i.test(pathname)
    
    // 判断是否为静态文件
    const isStaticFile = 
      isStaticPath ||
      isStaticExtension ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml' ||
      pathname === '/manifest.json'
    
    // 静态文件直接通过
    if (isStaticFile) {
      const response = await next()
      // 如果404且返回的是HTML，改为纯文本响应
      if (response && (response.status === 404 || response.status === 403)) {
        const contentType = response.headers.get('Content-Type') || ''
        if (contentType.includes('text/html')) {
          return new Response('File not found', {
            status: 404,
            statusText: 'Not Found',
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache',
            },
          })
        }
      }
      return response
    }
    
    // index.html 本身直接通过
    if (pathname === '/index.html') {
      return next()
    }
    
    // 非HTML请求的文件直接返回
    if (hasFileExtension && !isHtmlRequest) {
      return next()
    }
    
    // 获取原始响应
    const originalResponse = await next()
    
    // 成功响应直接返回
    if (originalResponse && originalResponse.ok) {
      return originalResponse
    }
    
    // 404/403时，判断是否需要返回index.html用于SPA路由
    if (originalResponse && (originalResponse.status === 404 || originalResponse.status === 403)) {
      // 文件请求或非HTML请求，直接返回404
      if (hasFileExtension || !isHtmlRequest) {
        return originalResponse
      }
      
      // HTML路由请求，返回index.html
      const indexUrl = new URL('/index.html', url.origin)
      const indexRequest = new Request(indexUrl, {
        method: 'GET',
        headers: { 'Accept': 'text/html' },
      })
      
      const indexResponse = await next(indexRequest)
      if (indexResponse && indexResponse.ok) {
        const clonedResponse = indexResponse.clone()
        const body = await clonedResponse.text()
        
        return new Response(body, {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        })
      }
    }
    
    return originalResponse
    
  } catch (error) {
    // 错误时返回原始响应
    return next()
  }
}
