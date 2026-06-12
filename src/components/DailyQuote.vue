<script setup>
import { ref, onMounted } from 'vue'

const quote = ref('')
const source = ref('')
const loading = ref(false)

// 本地备用短句库（API 不可用时使用）
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
