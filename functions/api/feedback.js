export async function onRequest(context) {
  const { request, env } = context

  // CORS headers — 白名单限制
  const requestOrigin = request.headers.get('Origin') || ''
  const allowedOrigins = ['https://bama.help', 'https://www.bama.help', 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173']
  const corsOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : 'https://bama.help'
  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (request.method === 'POST') {
    try {
      const data = await request.json()
      const { type = 'suggestion', content = '', contact = '' } = data

      if (!content || content.trim().length === 0) {
        return new Response(JSON.stringify({ success: false, error: '反馈内容不能为空' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      if (content.length > 2000) {
        return new Response(JSON.stringify({ success: false, error: '反馈内容不能超过2000字' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      const KV = env.FEEDBACK
      if (!KV) {
        return new Response(JSON.stringify({ success: false, error: 'KV 未绑定' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const entry = {
        id,
        type,
        content: content.trim(),
        contact: contact.trim(),
        timestamp: new Date().toISOString(),
        url: request.headers.get('Referer') || '',
        ua: request.headers.get('User-Agent') || '',
      }

      await KV.put(`feedback:${id}`, JSON.stringify(entry), {
        expirationTtl: 90 * 24 * 60 * 60, // 90 days
      })

      return new Response(JSON.stringify({ success: true, id }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
  }

  if (request.method === 'GET') {
    // 简单的健康检查
    return new Response(JSON.stringify({ success: true, message: 'Feedback API is running' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
