<script setup>
import { ref, computed } from 'vue'
import SideNav from '../components/SideNav.vue'
import { aiTools, aiToolCategories } from '../data/aiTools'
import { useAiToolClicks } from '../composables/useAiToolClicks'

const { recordClick, isFrequent, getSortedTools, hideTool, showTool, isHidden, isDead, reportDead, restoreDead } = useAiToolClicks()

const showManagePanel = ref(false)

// 过滤掉 'all' 分类，只保留实际分组（用于分区展示）
const sectionCategories = computed(() => aiToolCategories.filter(c => c.id !== 'all'))

// 每个分类对应的工具列表（已隐藏不显示，按热度+tag排序）
const toolsByCategory = computed(() => {
  const map = {}
  for (const cat of sectionCategories.value) {
    const tools = aiTools.filter(t => t.category === cat.id && !isHidden(t.id))
    map[cat.id] = getSortedTools(tools)
  }
  return map
})

// 锚点 id 与 SideNav 一致
const sectionIdMap = {
  chat: 'ai-chat',
  news: 'ai-news',
  image: 'ai-image',
  video: 'ai-video',
  learning: 'ai-learning',
  audio: 'ai-audio',
}

const hiddenTools = computed(() => aiTools.filter(t => isHidden(t.id)))
const deadTools = computed(() => aiTools.filter(t => isDead(t.id)))
const totalVisible = computed(() => aiTools.filter(t => !isHidden(t.id)).length)

const handleToolClick = (toolId) => {
  recordClick(toolId)
}

// 文字头像背景色映射
const letterBgMap = {
  blue:   'bg-gradient-to-br from-blue-400 to-blue-600',
  purple: 'bg-gradient-to-br from-purple-400 to-purple-600',
  indigo: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
  red:    'bg-gradient-to-br from-red-400 to-red-600',
  cyan:   'bg-gradient-to-br from-cyan-400 to-cyan-600',
  orange: 'bg-gradient-to-br from-orange-400 to-orange-600',
  green:  'bg-gradient-to-br from-green-400 to-green-600',
  pink:   'bg-gradient-to-br from-pink-400 to-pink-600',
  amber:  'bg-gradient-to-br from-amber-400 to-amber-600',
}

const getLetterBg = (color) => letterBgMap[color] || letterBgMap.blue

// tag 标签颜色（与 HomeView 一致）
const tagColors = {
  '热门': 'bg-red-500 text-white',
  '官方': 'bg-blue-500 text-white',
  '免费': 'bg-green-500 text-white',
}
</script>

<template>
  <div class="flex min-h-screen">
    <SideNav />

    <div class="flex-1 min-w-0 lg:ml-64 px-4 py-8">
      <!-- 页面标题 -->
      <div class="flex items-start justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 class="text-3xl font-bold dark:text-white">AI工具箱</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">探索各种AI工具，助力孩子学习和成长</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-400 dark:text-gray-500">{{ totalVisible }} 个工具</span>
          <button @click="showManagePanel = !showManagePanel"
            :class="['text-sm px-3 py-1 rounded-lg border transition-colors',
              showManagePanel ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-primary-500']">
            管理
          </button>
        </div>
      </div>

      <!-- 管理面板 -->
      <div v-if="showManagePanel" class="mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div v-if="hiddenTools.length" class="mb-4">
          <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">已隐藏的工具</h4>
          <div class="flex flex-wrap gap-2">
            <button v-for="tool in hiddenTools" :key="'hidden-'+tool.id" @click="showTool(tool.id)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:border-green-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              <span>{{ tool.name }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
          </div>
        </div>
        <div v-if="deadTools.length">
          <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">已标记失效</h4>
          <div class="flex flex-wrap gap-2">
            <button v-for="tool in deadTools" :key="'dead-'+tool.id" @click="restoreDead(tool.id)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 hover:border-green-300 hover:text-green-600 transition-colors">
              <span class="line-through">{{ tool.name }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          </div>
        </div>
        <div v-if="!hiddenTools.length && !deadTools.length" class="text-sm text-gray-400 dark:text-gray-500">
          暂无隐藏或失效的工具。鼠标悬停在工具卡片上可看到操作按钮。
        </div>
      </div>

      <!-- 按分类分区展示，左侧导航锚点跳转 -->
      <section v-for="cat in sectionCategories" :key="cat.id" :id="sectionIdMap[cat.id]" class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 dark:text-white">{{ cat.name }}</h2>

        <div v-if="toolsByCategory[cat.id] && toolsByCategory[cat.id].length"
          class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div v-for="tool in toolsByCategory[cat.id]" :key="tool.id"
            class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 relative group">
            <!-- 常用角标 -->
            <div v-if="isFrequent(tool.id)" class="absolute top-1.5 left-1.5 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-400 drop-shadow" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <!-- 失效标记 -->
            <div v-if="isDead(tool.id)" class="absolute top-1.5 left-1.5 z-10">
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500 text-white">失效</span>
            </div>
            <!-- tag 标签 -->
            <div v-if="tool.tag && !isDead(tool.id)" :class="['absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium z-10', tagColors[tool.tag] || 'bg-gray-500 text-white']">
              {{ tool.tag }}
            </div>
            <!-- 操作按钮（hover显示） -->
            <div class="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" :style="tool.tag && !isDead(tool.id) ? 'top:8px;right:8px' : ''">
              <button v-if="!isDead(tool.id)" @click.stop="reportDead(tool.id)" title="报告工具失效"
                class="w-6 h-6 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-700/90 text-gray-400 hover:text-red-500 shadow-sm border border-gray-200 dark:border-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
              </button>
              <button @click.stop="hideTool(tool.id)" title="隐藏此工具"
                class="w-6 h-6 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-700/90 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="mb-4 flex items-center justify-center h-24 rounded-lg">
              <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg', getLetterBg(tool.color)]">
                <span class="text-white text-2xl font-bold">{{ tool.letter }}</span>
              </div>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white" :class="{ 'line-through text-gray-400': isDead(tool.id) }">{{ tool.name }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate" :title="tool.description">{{ tool.description }}</p>
            <a :href="tool.url" target="_blank" rel="noopener noreferrer" @click="handleToolClick(tool.id)"
              class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
              访问工具 →
            </a>
          </div>
        </div>

        <!-- 该分类无工具时的占位 -->
        <div v-else class="text-sm text-gray-400 dark:text-gray-500 py-6 text-center bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
          该分类暂无工具
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
</style>
