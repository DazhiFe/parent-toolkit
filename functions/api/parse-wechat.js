export async function onRequest(context) {
  const { request } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  if (request.method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
  }

  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')

  if (!targetUrl) {
    return jsonResponse({ success: false, error: 'Missing url parameter' }, 400)
  }

  if (!/^https?:\/\/mp\.weixin\.qq\.com\/s[\/?]/i.test(targetUrl)) {
    return jsonResponse({ success: false, error: 'Invalid WeChat article URL' }, 400)
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI Language/zh_CN ABI/arm64',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://mp.weixin.qq.com/',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return jsonResponse({ success: false, error: `Fetch failed: HTTP ${response.status}` }, 502)
    }

    const html = await response.text()
    const article = parseWechatArticle(html)

    if (!article) {
      return jsonResponse({ success: false, error: 'Failed to parse article content' }, 422)
    }

    return jsonResponse({ success: true, ...article }, 200, {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    })
  } catch (e) {
    return jsonResponse({ success: false, error: e.message || 'Internal server error' }, 500)
  }
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  })
}

function parseWechatArticle(html) {
  try {
    let title = ''
    const titleMatch = html.match(/id="activity-name"[^>]*>([\s\S]*?)<\/h1>/)
    if (titleMatch) title = titleMatch[1].trim()
    if (!title) {
      const ogMatch = html.match(/property="og:title"\s+content="([^"]*)"/)
      if (ogMatch) title = ogMatch[1].trim()
    }
    if (!title) {
      const tagMatch = html.match(/<title>([\s\S]*?)<\/title>/)
      if (tagMatch) title = tagMatch[1].replace(/_-_/g, '-').split('-')[0].trim()
    }

    let author = ''
    const authorMatch = html.match(/id="js_name"[^>]*>([\s\S]*?)<\/a>/)
    if (authorMatch) author = authorMatch[1].trim()
    if (!author) {
      const nickMatch = html.match(/class="rich_media_meta_nickname"[^>]*>([\s\S]*?)<\/a>/)
      if (nickMatch) author = nickMatch[1].trim()
    }

    let publishTime = ''
    const timeMatch = html.match(/id="publish_time"[^>]*>([\s\S]*?)<\/em>/)
    if (timeMatch) publishTime = timeMatch[1].trim()

    const contentMatch = html.match(/id="js_content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/)
    if (!contentMatch) {
      const looseMatch = html.match(/id="js_content"[^>]*>([\s\S]*?)<script/)
      if (!looseMatch) return null
      return { title: title || '未命名文章', author, publishTime, contentHtml: cleanHtml(looseMatch[1]) }
    }

    return { title: title || '未命名文章', author, publishTime, contentHtml: cleanHtml(contentMatch[1]) }
  } catch (e) {
    return null
  }
}

function cleanHtml(html) {
  let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '')
  cleaned = cleaned.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
  cleaned = cleaned.replace(/data-src="([^"]*)"/g, 'src="$1"')
  cleaned = cleaned.replace(/\sdata-w="[^"]*"/g, '')
  cleaned = cleaned.replace(/\sdata-ratio="[^"]*"/g, '')
  cleaned = cleaned.replace(/<img /g, '<img style="max-width:100%;height:auto;" ')
  return cleaned
}
