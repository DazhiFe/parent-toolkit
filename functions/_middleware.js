export async function onRequest(context) {
  const response = await context.next()

  // 为所有响应添加安全头
  // 注：fankui.bama.help → bama.help/feedback-admin 的重定向已由 Cloudflare Redirect Rules 处理，更高效
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
