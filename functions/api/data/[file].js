// 数据文件代理 API — Referer 白名单保护，防止直接 URL 下载
const ALLOWED_ORIGINS = [
  'bama.help',
  'www.bama.help',
  'localhost',
  '127.0.0.1',
]

const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'baiduspider',
  'yandexbot',
  'duckduckbot',
  'slurp',
  'sogou',
  '360spider',
]

// 允许的数据文件白名单
const ALLOWED_FILES = {
  'characters': '/data/_protected/characters.json',
  'poems': '/data/_protected/poems.json',
}

function isAllowedOrigin(request) {
  const referer = request.headers.get('Referer') || ''
  const origin = request.headers.get('Origin') || ''
  const source = referer || origin

  // 无 Referer/Origin 时放行（可能是直接 API 调用或隐私模式）
  // 但对于数据保护，我们要求必须有合法来源
  if (!source) return false

  try {
    const url = new URL(source)
    const hostname = url.hostname
    return ALLOWED_ORIGINS.some(allowed => hostname === allowed || hostname.endsWith('.' + allowed))
  } catch {
    return false
  }
}

function isSearchBot(request) {
  const ua = (request.headers.get('User-Agent') || '').toLowerCase()
  return BOT_USER_AGENTS.some(bot => ua.includes(bot))
}

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const fileName = url.pathname.split('/').pop()

  // 检查文件是否在白名单中
  const filePath = ALLOWED_FILES[fileName]
  if (!filePath) {
    return new Response(JSON.stringify({ error: '文件不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 本地开发环境放行
  const hostname = url.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return fetchProtectedFile(filePath, url)
  }

  // 搜索引擎爬虫放行
  if (isSearchBot(request)) {
    return fetchProtectedFile(filePath, url)
  }

  // Referer/Origin 白名单校验
  if (!isAllowedOrigin(request)) {
    return new Response(JSON.stringify({ error: '访问被拒绝' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return fetchProtectedFile(filePath, url)
}

async function fetchProtectedFile(filePath, url) {
  // 构建静态文件的完整 URL
  const fileUrl = `${url.protocol}//${url.host}${filePath}`

  try {
    const response = await fetch(fileUrl)
    if (!response.ok) {
      return new Response(JSON.stringify({ error: '文件加载失败' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: '文件读取失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
