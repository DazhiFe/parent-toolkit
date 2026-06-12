// DeepSeek API 每日治愈短句
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

// 当 API 不可用时的本地备用短句库
const FALLBACK_QUOTES = [
  '你已经足够好了，不需要跟任何人比较。',
  '人生不是百米冲刺，而是一场属于自己的马拉松。',
  '停下来喘口气，不是放弃，是为了走得更远。',
  '做三四月的事，在八九月自有答案。',
  '别让内卷，卷走了你的生活。',
  '你不必光芒万丈，但始终温暖有光。',
  '慢慢来，比较快。',
  '焦虑是清醒者的清醒剂，但别让它成为麻醉剂。',
  '今天你只管快乐，剩下的交给明天。',
  '你的价值不由KPI定义，由你自己的快乐定义。',
  '允许一切发生，接纳所有不完美。',
  '累了就歇歇，天塌不下来。',
  '生活不是为了赶路，而是为了感受路。',
  '你已经很努力了，给自己一个大大的拥抱吧。',
  '世界很大，别只盯着一条赛道。',
  '此刻的你，就是最好的你。',
  '把期待降低，把依赖变少，你会过得很好。',
  '不必焦虑未来，未来自有安排。',
  '少一点"应该"，多一点"可以"。',
  '万物皆有裂痕，那是光照进来的地方。',
]

// 根据日期选取稳定的备用短句
function getFallbackQuote(dateStr) {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % FALLBACK_QUOTES.length
  return FALLBACK_QUOTES[index]
}

// 随机选取一条备用短句（用于刷新）
function getRandomFallback() {
  return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
}

async function callDeepSeek(apiKey) {
  if (!apiKey) {
    throw new Error('API key not configured')
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个温暖治愈的助手，专门生成"反焦虑、反内卷"主题的短句。要求：1. 一句话，30字以内；2. 温暖、治愈、有力量；3. 不要鸡汤说教，要真诚自然；4. 每次给不同的句子，不要重复；5. 只返回纯文本短句，不要引号、不要编号、不要解释、不要emoji。',
        },
        {
          role: 'user',
          content: '请给我一句反焦虑、反内卷的治愈短句。',
        },
      ],
      temperature: 0.9,
      max_tokens: 60,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`)
  }

  const data = await response.json()
  const quote = data.choices?.[0]?.message?.content?.trim()

  if (!quote || quote.length > 60) {
    throw new Error('Invalid quote response')
  }

  return quote
}

export async function onRequest(context) {
  const { request, env } = context
  const DEEPSEEK_API_KEY = (env && env.DEEPSEEK_API_KEY) || ''

  // 获取当前日期（北京时间）
  const now = new Date()
  const bjTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const dateStr = bjTime.toISOString().split('T')[0]

  const url = new URL(request.url)
  const forceRefresh = url.searchParams.get('refresh') === 'true'

  try {
    let quote, source

    if (DEEPSEEK_API_KEY) {
      try {
        quote = await callDeepSeek(DEEPSEEK_API_KEY)
        source = 'ai'
      } catch (e) {
        console.warn('DeepSeek API failed, using fallback:', e.message)
        quote = forceRefresh ? getRandomFallback() : getFallbackQuote(dateStr)
        source = 'fallback'
      }
    } else {
      quote = forceRefresh ? getRandomFallback() : getFallbackQuote(dateStr)
      source = 'fallback'
    }

    const result = {
      success: true,
      quote,
      date: dateStr,
      source,
    }

    // 非刷新模式：CDN 缓存到当天 23:59
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    }

    if (!forceRefresh) {
      // 计算到当天结束的秒数
      const endOfDay = new Date(bjTime)
      endOfDay.setHours(23, 59, 59, 999)
      const maxAge = Math.max(60, Math.floor((endOfDay - now) / 1000))
      headers['Cache-Control'] = `public, max-age=${maxAge}`
    } else {
      headers['Cache-Control'] = 'no-cache'
    }

    return new Response(JSON.stringify(result), { status: 200, headers })
  } catch (e) {
    return new Response(JSON.stringify({
      success: false,
      error: e.message || 'Internal server error',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
