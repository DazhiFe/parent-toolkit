export async function onRequest(context) {
  const url = new URL(context.request.url)
  
  // 如果访问的是 fankui 子域，重定向到主域名的反馈后台
  if (url.hostname === 'fankui.bama.help' || url.hostname === 'fankui.bamahelp.com') {
    const mainHost = url.hostname === 'fankui.bamahelp.com' ? 'bamahelp.com' : 'bama.help'
    return Response.redirect(`https://${mainHost}/feedback-admin`, 301)
  }
  
  const response = await context.next()
  
  // 为所有响应添加安全头
  const newHeaders = new Headers(response.headers)
  newHeaders.set('X-Frame-Options', 'SAMEORIGIN')
  newHeaders.set('Content-Security-Policy', "frame-ancestors 'self'")
  newHeaders.set('X-Content-Type-Options', 'nosniff')
  newHeaders.set('X-Content-Protection', '1; mode=block')
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}
