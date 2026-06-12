<script setup>
import { ref, onMounted } from 'vue'

const quote = ref('')
const source = ref('')
const loading = ref(false)

// 本地备用短句库（API 不可用时使用，100+句）
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

// 根据日期 hash 取稳定短句
const getDailyFallback = () => {
  const today = new Date()
  const bjTime = new Date(today.getTime() + 8 * 60 * 60 * 1000)
  const dateStr = bjTime.toISOString().split('T')[0]
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i)
    hash |= 0
  }
  return FALLBACK_QUOTES[Math.abs(hash) % FALLBACK_QUOTES.length]
}

const getRandomFallback = () => {
  return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
}

const getCacheKey = () => {
  const today = new Date()
  const bjTime = new Date(today.getTime() + 8 * 60 * 60 * 1000)
  return 'daily-quote-' + bjTime.toISOString().split('T')[0]
}

const loadFromCache = () => {
  const key = getCacheKey()
  const cached = localStorage.getItem(key)
  if (cached) {
    try {
      const data = JSON.parse(cached)
      quote.value = data.quote
      source.value = data.source || ''
      return true
    } catch (e) {
      return false
    }
  }
  return false
}

const saveToCache = (q, s) => {
  const key = getCacheKey()
  localStorage.setItem(key, JSON.stringify({ quote: q, source: s }))
}

const useLocalQuote = (refresh) => {
  const q = refresh ? getRandomFallback() : getDailyFallback()
  quote.value = q
  source.value = 'local'
  saveToCache(q, 'local')
}

const fetchQuote = async (refresh = false) => {
  if (!refresh && loadFromCache()) {
    return
  }

  const isDev = import.meta.env.DEV
  const API_BASE = import.meta.env.VITE_API_BASE || ''

  // 本地开发且没有配置 API_BASE 时，使用本地短句（避免请求本地不存在的 API）
  if (isDev && !API_BASE) {
    useLocalQuote(refresh)
    return
  }

  loading.value = true

  try {
    // 线上使用相对路径 /api/daily-quote，本地使用配置的 API_BASE
    const apiPath = API_BASE
      ? `${API_BASE}/api/daily-quote${refresh ? '?refresh=true' : ''}`
      : `/api/daily-quote${refresh ? '?refresh=true' : ''}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(apiPath, { signal: controller.signal })
    clearTimeout(timeout)

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || '获取失败')
    }

    quote.value = data.quote
    source.value = data.source || ''
    saveToCache(data.quote, data.source)
  } catch (e) {
    if (!loadFromCache()) {
      useLocalQuote(refresh)
    }
  } finally {
    loading.value = false
  }
}

const refreshQuote = () => {
  fetchQuote(true)
}

onMounted(() => {
  fetchQuote()
})
</script>

<template>
  <div
    v-if="quote"
    class="daily-quote group flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 max-w-[220px] md:max-w-xs"
    :title="source === 'ai' ? '由 DeepSeek AI 生成' : (source === 'local' ? '每日治愈短句' : '每日治愈短句')"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-3.5 w-3.5 flex-shrink-0 text-rose-300 dark:text-rose-400"
      :class="{ 'animate-bounce': loading }"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
    <span class="truncate">{{ quote }}</span>
    <button
      @click="refreshQuote"
      :disabled="loading"
      class="flex-shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
      title="换一句"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-3 w-3"
        :class="{ 'animate-spin': loading }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.daily-quote {
  font-style: italic;
  line-height: 1.4;
}
</style>
