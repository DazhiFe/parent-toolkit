export default async function handler(req, res) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { url } = req.query

  if (!url) {
    return res.status(400).json({ success: false, error: 'Missing url parameter' })
  }

  // 校验URL必须是微信公众号文章
  if (!/^https?:\/\/mp\.weixin\.qq\.com\/s[\/?]/i.test(url)) {
    return res.status(400).json({ success: false, error: 'Invalid WeChat article URL' })
  }

  try {
    // 伪装微信内置浏览器User-Agent
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI Language/zh_CN ABI/arm64',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://mp.weixin.qq.com/'
      },
      redirect: 'follow'
    })

    if (!response.ok) {
      return res.status(502).json({ success: false, error: `Fetch failed: HTTP ${response.status}` })
    }

    const html = await response.text()

    // 解析文章内容
    const article = parseWechatArticle(html)

    if (!article) {
      return res.status(422).json({ success: false, error: 'Failed to parse article content' })
    }

    // 设置CORS头，允许前端跨域访问
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')

    return res.status(200).json({
      success: true,
      ...article
    })
  } catch (e) {
    console.error('Fetch error:', e)
    return res.status(500).json({ success: false, error: e.message || 'Internal server error' })
  }
}

function parseWechatArticle(html) {
  try {
    // 提取标题
    let title = ''
    const titleMatch = html.match(/id="activity-name"[^>]*>([\s\S]*?)<\/h1>/)
    if (titleMatch) {
      title = titleMatch[1].trim()
    }
    if (!title) {
      const ogTitleMatch = html.match(/property="og:title"\s+content="([^"]*)"/)
      if (ogTitleMatch) title = ogTitleMatch[1].trim()
    }
    if (!title) {
      const titleTagMatch = html.match(/<title>([\s\S]*?)<\/title>/)
      if (titleTagMatch) title = titleTagMatch[1].replace(/_-_/g, '-').split('-')[0].trim()
    }

    // 提取作者
    let author = ''
    const authorMatch = html.match(/id="js_name"[^>]*>([\s\S]*?)<\/a>/)
    if (authorMatch) {
      author = authorMatch[1].trim()
    }
    if (!author) {
      const nicknameMatch = html.match(/class="rich_media_meta_nickname"[^>]*>([\s\S]*?)<\/a>/)
      if (nicknameMatch) author = nicknameMatch[1].trim()
    }

    // 提取发布时间
    let publishTime = ''
    const timeMatch = html.match(/id="publish_time"[^>]*>([\s\S]*?)<\/em>/)
    if (timeMatch) {
      publishTime = timeMatch[1].trim()
    }

    // 提取正文内容
    const contentMatch = html.match(/id="js_content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/)
    if (!contentMatch) {
      // 尝试更宽松的匹配
      const looseMatch = html.match(/id="js_content"[^>]*>([\s\S]*?)<script/)
      if (!looseMatch) return null
      return {
        title: title || '未命名文章',
        author,
        publishTime,
        contentHtml: cleanHtml(looseMatch[1])
      }
    }

    return {
      title: title || '未命名文章',
      author,
      publishTime,
      contentHtml: cleanHtml(contentMatch[1])
    }
  } catch (e) {
    console.error('Parse error:', e)
    return null
  }
}

function cleanHtml(html) {
  // 移除script和style标签
  let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '')
  // 移除iframe
  cleaned = cleaned.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
  // 处理图片懒加载：data-src -> src
  cleaned = cleaned.replace(/data-src="([^"]*)"/g, 'src="$1"')
  // 移除data-w和data-ratio属性
  cleaned = cleaned.replace(/\sdata-w="[^"]*"/g, '')
  cleaned = cleaned.replace(/\sdata-ratio="[^"]*"/g, '')
  // 给图片添加最大宽度样式
  cleaned = cleaned.replace(/<img /g, '<img style="max-width:100%;height:auto;" ')
  return cleaned
}
