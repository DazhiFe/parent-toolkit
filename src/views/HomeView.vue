<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import SideNav from '../components/SideNav.vue'
import { websiteCategories, websites } from '../data/websites'
import { useWebsiteClicks } from '../composables/useWebsiteClicks'

const { recordClick, getClickCount, isFrequent, getSortedSites, hideSite, showSite, isHidden, isDead, reportDead, restoreDead, hiddenIds, deadIds } = useWebsiteClicks()

const activeCategory = ref('all')
const isExpanded = ref(false)
const showManagePanel = ref(false)
const DEFAULT_SHOW_COUNT = 8

const visibleSites = computed(() => {
  const sites = activeCategory.value === 'all'
    ? websites
    : websites.filter(s => s.category === activeCategory.value)
  // 排除已隐藏的
  const visible = sites.filter(s => !isHidden(s.id))
  return getSortedSites(visible)
})

const displayedSites = computed(() => {
  if (isExpanded.value) return visibleSites.value
  return visibleSites.value.slice(0, DEFAULT_SHOW_COUNT)
})

const hasMore = computed(() => visibleSites.value.length > DEFAULT_SHOW_COUNT)

const hiddenSites = computed(() => {
  return websites.filter(s => isHidden(s.id))
})

const deadSites = computed(() => {
  return websites.filter(s => isDead(s.id))
})

const handleSiteClick = (siteId) => {
  recordClick(siteId)
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// ─── 颜色映射 ───
const colorMap = {
  blue:    { bg: 'from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20', text: 'text-blue-600 dark:text-blue-400' },
  green:   { bg: 'from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20', text: 'text-green-600 dark:text-green-400' },
  amber:   { bg: 'from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20', text: 'text-amber-600 dark:text-amber-400' },
  indigo:  { bg: 'from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/20', text: 'text-indigo-600 dark:text-indigo-400' },
  pink:    { bg: 'from-pink-100 to-pink-50 dark:from-pink-900/30 dark:to-pink-800/20', text: 'text-pink-600 dark:text-pink-400' },
  cyan:    { bg: 'from-cyan-100 to-cyan-50 dark:from-cyan-900/30 dark:to-cyan-800/20', text: 'text-cyan-600 dark:text-cyan-400' },
  orange:  { bg: 'from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20', text: 'text-orange-600 dark:text-orange-400' },
  red:     { bg: 'from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20', text: 'text-red-600 dark:text-red-400' },
}

const getColorClass = (color) => colorMap[color] || colorMap.blue

// ─── 图标映射 ───
const iconMap = {
  building: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
  book: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
  academic: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>`,
  'play-circle': `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  'book-open': `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>`,
  search: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`,
  beaker: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>`,
  globe: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  camera: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
  heart: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`,
  puzzle: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/></svg>`,
  document: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  qr: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>`,
  mindmap: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
  image: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
  newspaper: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>`,
  shield: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
  clipboard: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`,
  'id-card': `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/></svg>`,
  grid: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`,
  wrench: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
}

const getIcon = (iconName) => iconMap[iconName] || iconMap.globe

// tag 标签颜色
const tagColors = {
  '热门': 'bg-red-500 text-white',
  '官方': 'bg-blue-500 text-white',
  '免费': 'bg-green-500 text-white',
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- 左侧导航 -->
    <SideNav />
    
    <!-- 右侧内容区 -->
    <div class="flex-1 min-w-0 lg:ml-64 px-4 py-8">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold dark:text-white">爸妈工具箱</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">为爸妈和孩子提供实用工具和资源</p>
      </div>

      <!-- 常用网站 -->
      <section id="websites" class="mb-12">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-2xl font-bold dark:text-white">常用网站</h2>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-400 dark:text-gray-500">{{ visibleSites.length }} 个网站</span>
            <button @click="showManagePanel = !showManagePanel"
              :class="['text-sm px-3 py-1 rounded-lg border transition-colors',
                showManagePanel ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-primary-500']">
              管理
            </button>
          </div>
        </div>

        <!-- 管理面板 -->
        <div v-if="showManagePanel" class="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <!-- 已隐藏的网站 -->
          <div v-if="hiddenSites.length" class="mb-4">
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">已隐藏的网站</h4>
            <div class="flex flex-wrap gap-2">
              <button v-for="site in hiddenSites" :key="'hidden-'+site.id" @click="showSite(site.id)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:border-green-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                <span>{{ site.name }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </button>
            </div>
          </div>
          <!-- 失效的网站 -->
          <div v-if="deadSites.length">
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">已标记失效</h4>
            <div class="flex flex-wrap gap-2">
              <button v-for="site in deadSites" :key="'dead-'+site.id" @click="restoreDead(site.id)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 hover:border-green-300 hover:text-green-600 transition-colors">
                <span class="line-through">{{ site.name }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
            </div>
          </div>
          <div v-if="!hiddenSites.length && !deadSites.length" class="text-sm text-gray-400 dark:text-gray-500">
            暂无隐藏或失效的网站。点击网站卡片上的关闭按钮可隐藏，点击报告按钮可标记失效。
          </div>
        </div>

        <!-- 分类筛选 -->
        <div class="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button v-for="cat in websiteCategories" :key="cat.id" @click="activeCategory = cat.id"
            :class="['px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border',
              activeCategory === cat.id
                ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary-300']">
            {{ cat.name }}
          </button>
        </div>

        <!-- 网站卡片网格 -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div v-for="site in displayedSites" :key="site.id"
            class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 relative group">
            <!-- 常用角标 -->
            <div v-if="isFrequent(site.id)" class="absolute top-1.5 left-1.5 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-400 drop-shadow" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <!-- 失效标记 -->
            <div v-if="isDead(site.id)" class="absolute top-1.5 left-1.5 z-10">
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500 text-white">失效</span>
            </div>
            <!-- tag 标签 -->
            <div v-if="site.tag && !isDead(site.id)" :class="['absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium z-10', tagColors[site.tag] || 'bg-gray-500 text-white']">
              {{ site.tag }}
            </div>
            <!-- 操作按钮（hover显示） -->
            <div class="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" :style="site.tag && !isDead(site.id) ? 'top:8px;right:8px' : ''">
              <button v-if="!isDead(site.id)" @click.stop="reportDead(site.id)" title="报告网站失效"
                class="w-6 h-6 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-700/90 text-gray-400 hover:text-red-500 shadow-sm border border-gray-200 dark:border-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
              </button>
              <button v-if="isDead(site.id)" @click.stop="restoreDead(site.id)" title="恢复网站"
                class="w-6 h-6 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-700/90 text-green-500 shadow-sm border border-gray-200 dark:border-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
              <button @click.stop="hideSite(site.id)" title="隐藏此网站"
                class="w-6 h-6 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-700/90 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <!-- 图标区 -->
            <div :class="['mb-4 flex items-center justify-center h-24 bg-gradient-to-br rounded-lg', isDead(site.id) ? 'opacity-40 grayscale' : '', getColorClass(site.color).bg]">
              <span :class="getColorClass(site.color).text" v-html="getIcon(site.icon)"></span>
            </div>
            <h3 class="text-base font-semibold mb-1.5 dark:text-white truncate" :class="{ 'line-through opacity-50': isDead(site.id) }" :title="site.name">{{ site.name }}</h3>
            <p class="text-gray-500 dark:text-gray-400 text-xs mb-3 truncate" :title="site.description">{{ site.description }}</p>
            <a v-if="!isDead(site.id)" :href="site.url" target="_blank" rel="noopener noreferrer" @click="handleSiteClick(site.id)"
              class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问网站 →</a>
            <span v-else class="text-red-400 text-sm">网站不可用</span>
          </div>
        </div>

        <!-- 展开/收起按钮 -->
        <div v-if="hasMore" class="mt-4 text-center">
          <button @click="toggleExpand"
            class="px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 mx-auto">
            <template v-if="isExpanded">
              收起
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
            </template>
            <template v-else>
              查看全部 {{ visibleSites.length }} 个网站
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </template>
          </button>
        </div>
      </section>
      
      <!-- 常用工具 -->
      <section id="tools" class="mb-12">
        <h2 class="text-2xl font-bold mb-6 dark:text-white">常用工具</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">番茄时钟</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">番茄工作法，提高专注力和学习效率</p>
            <RouterLink to="/pomodoro-timer" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</RouterLink>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">视频下载</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">支持B站等平台视频解析下载</p>
            <RouterLink to="/video-download" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</RouterLink>
          </div>

          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">公众号文章打印</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">粘贴公众号链接，一键预览并打印或保存为PDF</p>
            <RouterLink to="/wechat-article-print" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</RouterLink>
          </div>
        </div>
      </section>

      <!-- 图片格式工具 -->
      <section id="image-tools" class="mb-12">
        <h2 class="text-2xl font-bold mb-6 dark:text-white">图片格式工具</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">图片转PDF</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">将多张图片合并转换为PDF文件</p>
            <RouterLink to="/image-to-pdf" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</RouterLink>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">图片压缩</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">高效压缩图片，保持视觉质量平衡</p>
            <RouterLink to="/image-compress" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</RouterLink>
          </div>

          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">图片转换</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">支持 JPG、PNG、GIF、BMP、WebP、TIFF 格式互转</p>
            <RouterLink to="/image-convert" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</RouterLink>
          </div>

          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">图片水印</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">为图片添加文字或图片水印，支持批量处理</p>
            <RouterLink to="/image-watermark" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</RouterLink>
          </div>

          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">批量调整尺寸</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">预设证件照规格或自定义宽高，自动旋转裁剪</p>
            <RouterLink to="/image-resize" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</RouterLink>
          </div>
        </div>
      </section>

      <!-- PDF格式工具 -->
      <section id="pdf-tools" class="mb-12">
        <h2 class="text-2xl font-bold mb-6 dark:text-white">PDF格式工具</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">PDF转PPT</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">将PDF文件转换为PPT演示文稿</p>
            <RouterLink to="/pdf-to-ppt" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</RouterLink>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">PDF编辑</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">在线编辑PDF，支持添加文字、绘图标注</p>
            <RouterLink to="/pdf-edit" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</RouterLink>
          </div>
        </div>
      </section>

      <!-- 格式转换 -->
      <section id="convert-tools" class="mb-12">
        <h2 class="text-2xl font-bold mb-6 dark:text-white">格式转换</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">千问格式转换</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">AI文件格式转换工具，支持PDF、图片互转</p>
            <a href="https://www.tongyi.com/discover/convert" target="_blank" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问工具 →</a>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.tool-card {
  @apply shadow-md;
  border-radius: 0.5rem;
  padding: 1rem;
}

.tool-card:hover {
  transform: translateY(-4px);
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
