export async function onRequest(context) {
  const { request, env } = context

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // 密码保护
  const adminPassword = (env && env.ADMIN_PASSWORD) || ''
  if (adminPassword) {
    const provided = request.headers.get('x-admin-password') || ''
    if (provided !== adminPassword) {
      return new Response(JSON.stringify({ success: false, error: '密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
  }

  try {
    const KV = env.FEEDBACK
    if (!KV) {
      return new Response(JSON.stringify({ success: false, error: 'KV 未绑定' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const keys = await KV.list({ prefix: 'feedback:' })
    const items = []

    for (const key of keys.keys || []) {
      try {
        const value = await KV.get(key.name)
        if (value) {
          const entry = JSON.parse(value)
          items.push(entry)
        }
      } catch (e) {
        // skip invalid entries
      }
    }

    // 按时间倒序排列
    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    return new Response(JSON.stringify({ success: true, data: items, count: items.length }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
}
