<script setup>
import { ref, computed } from 'vue'
import SideNav from '../components/SideNav.vue'

const chineseTools = [
  {
    id: 1,
    name: '古诗词讲解速查',
    description: '输入古诗名称，AI智能讲解译文、赏析、重点字词',
    url: '/ancient-poetry',
    color: 'red',
    icon: 'poetry'
  },
  {
    id: 2,
    name: '拼音标注工具',
    description: '输入中文文本，自动为所有汉字标注拼音',
    url: '/pinyin-annotation',
    color: 'orange',
    icon: 'pinyin'
  }
]

const mathTools = [
  {
    id: 1,
    name: '20以内题目生成器',
    description: '生成20以内的加减法练习题',
    url: '/math-within-20',
    color: 'cyan',
    icon: 'calculator'
  },
  {
    id: 2,
    name: '百以内题目生成器',
    description: '生成100以内的加减法练习题',
    url: '/math-within-100',
    color: 'blue',
    icon: 'calculator'
  },
  {
    id: 3,
    name: '三位数加减题目生成器',
    description: '生成三位数的加减法练习题',
    url: '/math-three-digit',
    color: 'indigo',
    icon: 'calculator'
  },
  {
    id: 4,
    name: '百数表生成',
    description: '生成1-100百数表，支持高亮和自定义范围',
    url: '/hundred-chart',
    color: 'teal',
    icon: 'grid'
  },
  {
    id: 5,
    name: '百以内+三位数加减混合',
    description: '混合生成百以内和三位数加减法练习题',
    url: '/mixed-math',
    color: 'pink',
    icon: 'mix'
  }
]

const englishTools = [
  {
    id: 1,
    name: '单词记忆',
    description: '小学英语单词表、图片记忆法、单词测试',
    url: '#',
    color: 'green',
    icon: 'word'
  },
  {
    id: 2,
    name: '单词拼读',
    description: '输入英文单词，点击听发音，支持连续拼读',
    url: '/word-pronunciation',
    color: 'purple',
    icon: 'speaker'
  }
]

const getIcon = (iconName) => {
  const icons = {
    poetry: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>`,
    calculator: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>`,
    word: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>`,
    pinyin: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>`,
    grid: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>`,
    speaker: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>`,
    mix: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>`
  }
  return icons[iconName] || icons.poetry
}

const getColorClass = (color) => {
  const colors = {
    red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
    teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
    pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400' }
  }
  return colors[color] || colors.blue
}
</script>

<template>
  <div class="flex">
    <SideNav />
    
    <div class="flex-1 lg:ml-64 px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold dark:text-white">学习助手</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">为孩子提供各学科学习资源和辅导工具</p>
      </div>

      <section id="math" class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 dark:text-white">数学</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div v-for="tool in mathTools" :key="tool.id" class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div :class="['mb-4 flex items-center justify-center h-24 rounded-lg', getColorClass(tool.color).bg]">
              <div :class="getColorClass(tool.color).text" v-html="getIcon(tool.icon)"></div>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">{{ tool.name }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">{{ tool.description }}</p>
            <RouterLink :to="tool.url" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问工具 →</RouterLink>
          </div>
        </div>
      </section>
      
      <section id="chinese" class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 dark:text-white">语文</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div v-for="tool in chineseTools" :key="tool.id" class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div :class="['mb-4 flex items-center justify-center h-24 rounded-lg', getColorClass(tool.color).bg]">
              <div :class="getColorClass(tool.color).text" v-html="getIcon(tool.icon)"></div>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">{{ tool.name }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">{{ tool.description }}</p>
            <RouterLink :to="tool.url" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问工具 →</RouterLink>
          </div>
        </div>
      </section>
      
      <section id="english" class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 dark:text-white">英语</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div v-for="tool in englishTools" :key="tool.id" class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div :class="['mb-4 flex items-center justify-center h-24 rounded-lg', getColorClass(tool.color).bg]">
              <div :class="getColorClass(tool.color).text" v-html="getIcon(tool.icon)"></div>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">{{ tool.name }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">{{ tool.description }}</p>
            <RouterLink :to="tool.url" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问工具 →</RouterLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
