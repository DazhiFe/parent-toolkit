<script setup>
import { computed } from 'vue'
import SideNav from '../components/SideNav.vue'
import { studyToolCategories, studyTools, defaultFrequentToolIds } from '../data/studyTools'
import { useStudyToolClicks } from '../composables/useStudyToolClicks'

const { clicks, recordClick, isFrequent, getSortedTools } = useStudyToolClicks()

const toolsByCategory = computed(() => {
  const map = {}
  for (const category of studyToolCategories) {
    map[category.id] = getSortedTools(studyTools.filter(tool => tool.category === category.id))
  }
  return map
})

const frequentTools = computed(() => {
  const hasClicks = Object.keys(clicks.value).length > 0
  if (hasClicks) {
    return getSortedTools(studyTools).slice(0, 4)
  }
  return defaultFrequentToolIds
    .map(id => studyTools.find(tool => tool.id === id))
    .filter(Boolean)
})

const handleToolClick = (toolId) => {
  recordClick(toolId)
}

const getIcon = (iconName, size = 'h-12 w-12') => {
  const icons = {
    poetry: `<svg xmlns="http://www.w3.org/2000/svg" class="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
    calculator: `<svg xmlns="http://www.w3.org/2000/svg" class="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`,
    pinyin: `<svg xmlns="http://www.w3.org/2000/svg" class="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>`,
    grid: `<svg xmlns="http://www.w3.org/2000/svg" class="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/></svg>`,
    speaker: `<svg xmlns="http://www.w3.org/2000/svg" class="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>`,
    mix: `<svg xmlns="http://www.w3.org/2000/svg" class="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>`,
    pen: `<svg xmlns="http://www.w3.org/2000/svg" class="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>`,
  }
  return icons[iconName] || icons.calculator
}

const colorMap = {
  red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' }
}

const getColorClass = (color) => colorMap[color] || colorMap.blue
</script>

<template>
  <div class="flex min-h-screen">
    <SideNav />

    <div class="flex-1 min-w-0 lg:ml-64 px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold dark:text-white">AI学习助手</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">为孩子提供口算练习、语文打印、古诗速查和英语听读等高频学习工具</p>
      </div>

      <section class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold dark:text-white">最近 / 常用工具</h2>
          <span class="text-xs text-gray-400 dark:text-gray-500">点击越多越靠前</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <RouterLink v-for="tool in frequentTools" :key="tool.id" :to="tool.url" @click="handleToolClick(tool.id)"
            class="group flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 p-3 transition-all relative">
            <div v-if="isFrequent(tool.id)" class="absolute top-1.5 left-1.5 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-400 drop-shadow" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            </div>
            <div :class="['w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0', getColorClass(tool.color).bg]">
              <span :class="getColorClass(tool.color).text" v-html="getIcon(tool.icon, 'h-6 w-6')"></span>
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400" :title="tool.name">{{ tool.name }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate" :title="tool.description">{{ tool.description }}</p>
            </div>
          </RouterLink>
        </div>
      </section>

      <section v-for="category in studyToolCategories" :key="category.id" :id="category.id" class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 dark:text-white">{{ category.name }}</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div v-for="tool in toolsByCategory[category.id]" :key="tool.id" class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 relative">
            <div v-if="isFrequent(tool.id)" class="absolute top-1.5 left-1.5 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-400 drop-shadow" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            </div>
            <div :class="['mb-4 flex items-center justify-center h-24 rounded-lg', getColorClass(tool.color).bg]">
              <div :class="getColorClass(tool.color).text" v-html="getIcon(tool.icon)"></div>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white truncate" :title="tool.name">{{ tool.name }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate" :title="tool.description">{{ tool.description }}</p>
            <div class="flex flex-wrap gap-1.5 mb-3 min-h-[22px]">
              <span v-for="tag in tool.tags" :key="tag" class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[11px] text-gray-500 dark:text-gray-300">{{ tag }}</span>
              <span v-for="grade in tool.grades" :key="grade" class="px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-[11px] text-primary-600 dark:text-primary-400">{{ grade }}</span>
            </div>
            <RouterLink :to="tool.url" @click="handleToolClick(tool.id)" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问工具 →</RouterLink>
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
</style>
