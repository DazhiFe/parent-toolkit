// DeepSeek API 每日治愈短句
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

// 当 API 不可用时的本地备用短句库（100+句，覆盖多主题）
const FALLBACK_QUOTES = [
  // 自我接纳
  '你已经足够好了，不需要跟任何人比较。',
  '你不必光芒万丈，但始终温暖有光。',
  '此刻的你，就是最好的你。',
  '允许一切发生，接纳所有不完美。',
  '万物皆有裂痕，那是光照进来的地方。',
  '你值得被温柔以待，尤其是被你自己。',
  '不必急着成为谁，先成为自己喜欢的样子。',
  '你的存在本身，就是一种意义。',
  '不要因为别人的光芒，就觉得自己黯淡。',
  '爱自己，是终身浪漫的开始。',
  '你不需要完美，也值得被爱着。',
  '请对自己温柔一点，你已经在尽力了。',
  '你的价值不由别人的评价定义。',
  '接纳自己的平凡，也是一种勇敢。',
  '你很好，不要总是否定自己。',
  // 反焦虑反内卷
  '人生不是百米冲刺，而是一场属于自己的马拉松。',
  '别让内卷，卷走了你的生活。',
  '焦虑是清醒者的清醒剂，但别让它成为麻醉剂。',
  '你的价值不由KPI定义，由你自己的快乐定义。',
  '慢一点，灵魂才能跟上脚步。',
  '不必焦虑未来，未来自有安排。',
  '别人跑得快，不代表你走得慢就是错。',
  '人生没有标准答案，每个人都有自己的时区。',
  '别让"别人都在努力"成为你的枷锁。',
  '躺平不是放弃，是为了更好地出发。',
  '不是所有事情都值得全力以赴。',
  '偶尔摆烂，是为了更好地充电。',
  '你不需要一直奔跑，停下来看看风景也很好。',
  '比昨天好一点点，就已经很棒了。',
  '不要让焦虑偷走你今天的快乐。',
  // 生活态度
  '停下来喘口气，不是放弃，是为了走得更远。',
  '做三四月的事，在八九月自有答案。',
  '慢慢来，比较快。',
  '今天你只管快乐，剩下的交给明天。',
  '累了就歇歇，天塌不下来。',
  '生活不是为了赶路，而是为了感受路。',
  '世界很大，别只盯着一条赛道。',
  '把期待降低，把依赖变少，你会过得很好。',
  '少一点"应该"，多一点"可以"。',
  '你已经很努力了，给自己一个大大的拥抱吧。',
  '今天的不开心，就止于此吧。',
  '生活再难，也别忘了给自己买束花。',
  '阳光免费，快乐也是。',
  '去吹吹风吧，能清醒的话，感冒也没关系。',
  '好好吃饭，好好睡觉，就是最大的自律。',
  // 温暖治愈
  '愿你被这个世界温柔以待。',
  '总会有人穿越人海来拥抱你。',
  '你是自己的太阳，无需借谁的光。',
  '心有猛虎，细嗅蔷薇。',
  '愿你眼中有光，心中有爱。',
  '所有不期而遇，都是久别重逢。',
  '世间所有的相遇，都是命中注定。',
  '愿你遍历山河，觉得人间值得。',
  '星光不问赶路人，时光不负有心人。',
  '愿你所得皆所愿，所遇皆良人。',
  '岁月漫长，然而值得等待。',
  '愿你被生活温柔以待，余生不再受伤害。',
  '世界上所有的惊喜和好运，都是你积累的温柔和善良。',
  '愿你有高跟鞋也有跑鞋，喝茶也喝酒。',
  '愿你有盔甲也有软肋，心中有傲骨也有慈悲。',
  // 亲子育儿
  '孩子不是一张白纸，而是一粒种子。',
  '最好的教育，是让孩子成为他自己。',
  '陪伴是最长情的告白，也是最好的教育。',
  '不要急着教孩子长大，童年只有一次。',
  '你的孩子，其实不是你的孩子，他们是生命对于自身渴望而诞生的孩子。',
  '与其焦虑孩子的未来，不如过好当下的每一天。',
  '做一个快乐的父母，比做一个完美的父母更重要。',
  '允许孩子慢慢来，就像你曾经也被允许一样。',
  '孩子的节奏，不是慢，是你太快了。',
  '教育不是灌满一桶水，而是点燃一把火。',
  '不要拿自己的孩子和任何人比较。',
  '你的情绪稳定，是孩子最好的起跑线。',
  '孩子不需要完美的父母，需要真实的父母。',
  '学会放手，是给孩子最好的礼物。',
  '养育孩子的过程，也是治愈自己的过程。',
  // 成长力量
  '杀不死你的，会让你更强大。',
  '每一次跌倒，都是为了更好地站起来。',
  '没有白走的路，每一步都算数。',
  '那些打不倒你的，终将使你更强大。',
  '即使身处低谷，也要仰望星空。',
  '暴风雨结束后，你不会记得自己是怎样活下来的。',
  '所谓无底深渊，下去，也是前程万里。',
  '在最深的绝望里，遇见最美的惊喜。',
  '所有的经历，都是生命的馈赠。',
  '你可以回头看，但别忘了往前走。',
  '难熬的日子总会过去，不信你回头看看。',
  '无论今天多么浑浊不堪，明天依旧如约而至。',
  '你走过的路，每一步都算数。',
  '与其诅咒黑暗，不如点燃蜡烛。',
  '成年人的世界里，没有容易二字，但也没有过不去的坎。',
  // 轻松幽默
  '人生苦短，再来一碗。',
  '只要吃得够快，体重就追不上我。',
  '生活就像骑自行车，想保持平衡就得往前走。',
  '我不是胖，只是对生活过敏导致的肿胀。',
  '如果生活欺骗了你，不要悲伤，打开美颜相机欺骗生活。',
  '条条大路通罗马，而有些人就生在罗马。但那又怎样？',
  '好看的皮囊千篇一律，有趣的灵魂万里挑一。',
  '你若盛开，清风自来；你若盛开，蚊子也是。',
  '人生不如意十之八九，剩下的一二特别不如意。',
  '间歇性踌躇满志，持续性混吃等死，这才是人生常态。',
  '不要气馁，你最擅长的东西可能现在还没被发明出来。',
  '生活就像海洋，只有意志坚强的人才能到达彼岸。而我选择漂流。',
  '不要因为别人的一句话，就丢掉一整天的快乐。',
  '做人呢，最重要的是开心。',
  '该吃吃该喝喝，遇事别往心里搁。',
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

// 随机主题列表，增加生成多样性
const THEMES = [
  '自我接纳与肯定',
  '反焦虑与放慢脚步',
  '生活态度与当下',
  '温暖治愈与希望',
  '亲子育儿与陪伴',
  '成长力量与 resilience',
  '轻松幽默与自嘲',
  '简单快乐与小确幸',
]

async function callDeepSeek(apiKey) {
  if (!apiKey) {
    throw new Error('API key not configured')
  }

  // 随机选择一个主题，增加每次生成的差异性
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)]

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
          content: `你是一个温暖治愈的助手，专门生成治愈短句。要求：
1. 一句话，25字以内；
2. 风格要求：温暖、真诚、自然，拒绝鸡汤说教；
3. 必须从"${theme}"这个角度出发，不要重复之前类似的表达；
4. 每次给出完全不同的句子，避免重复感；
5. 只返回纯文本短句，不要引号、不要编号、不要解释、不要emoji。`,
        },
        {
          role: 'user',
          content: `请从"${theme}"的角度，给我一句全新的治愈短句。`,
        },
      ],
      temperature: 1.2,
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
