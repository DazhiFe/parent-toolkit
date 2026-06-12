export async function onRequest(context) {
  const url = new URL(context.request.url)
  
  // 如果访问的是 fankui.bama.help，重定向到主域名的反馈后台
  if (url.hostname === 'fankui.bama.help') {
    return Response.redirect('https://bama.help/feedback-admin', 301)
  }
  
  return context.next()
}
