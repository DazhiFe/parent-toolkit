<script setup>
import { ref, computed } from 'vue'
import SideNav from '../components/SideNav.vue'

const chineseTools = [
  {
    id: 1,
    name: '古诗词学习',
    description: '小学必背古诗词75首，带拼音、注释和赏析',
    url: '#',
    color: 'red'
  },
  {
    id: 2,
    name: '作文素材库',
    description: '优秀作文范文、写作技巧、好词好句积累',
    url: '#',
    color: 'orange'
  },
  {
    id: 3,
    name: '字词练习',
    description: '生字词听写、组词造句、成语积累',
    url: '#',
    color: 'pink'
  },
  {
    id: 4,
    name: '阅读理解',
    description: '小学各年级阅读理解训练，提升阅读能力',
    url: '#',
    color: 'rose'
  }
]

const mathTools = [
  {
    id: 1,
    name: '百以内题目生成器',
    description: '生成100以内的加减法练习题',
    url: '/math-within-100',
    color: 'blue'
  },
  {
    id: 2,
    name: '三位数加减题目生成器',
    description: '生成三位数的加减法练习题',
    url: '/math-three-digit',
    color: 'indigo'
  }
]

const englishTools = [
  {
    id: 1,
    name: '单词记忆',
    description: '小学英语单词表、图片记忆法、单词测试',
    url: '#',
    color: 'green'
  },
  {
    id: 2,
    name: '英语绘本',
    description: '精选英语绘本阅读、配套音频跟读',
    url: '#',
    color: 'emerald'
  },
  {
    id: 3,
    name: '语法基础',
    description: '小学英语语法知识点、例句讲解',
    url: '#',
    color: 'teal'
  },
  {
    id: 4,
    name: '口语练习',
    description: '英语口语跟读、发音纠正、对话练习',
    url: '#',
    color: 'lime'
  }
]
</script>

<template>
  <div class="flex">
    <SideNav />
    
    <div class="flex-1 lg:ml-64 px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold dark:text-white">学习助手</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">为孩子提供各学科学习资源和辅导工具</p>
      </div>
      
      <section id="chinese" class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 dark:text-white">语文</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div v-for="tool in chineseTools" :key="tool.id" class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div :class="['mb-4 flex items-center justify-center h-24 rounded-lg', `bg-${tool.color}-50 dark:bg-${tool.color}-900/20`]">
              <div :class="['font-bold text-lg', `text-${tool.color}-600 dark:text-${tool.color}-400`]">{{ tool.name }}</div>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">{{ tool.name }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">{{ tool.description }}</p>
            <RouterLink :to="tool.url" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问工具 →</RouterLink>
          </div>
        </div>
      </section>
      
      <section id="math" class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 dark:text-white">数学</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div v-for="tool in mathTools" :key="tool.id" class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div :class="['mb-4 flex items-center justify-center h-24 rounded-lg', `bg-${tool.color}-50 dark:bg-${tool.color}-900/20`]">
              <div :class="['font-bold text-lg', `text-${tool.color}-600 dark:text-${tool.color}-400`]">{{ tool.name }}</div>
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
            <div :class="['mb-4 flex items-center justify-center h-24 rounded-lg', `bg-${tool.color}-50 dark:bg-${tool.color}-900/20`]">
              <div :class="['font-bold text-lg', `text-${tool.color}-600 dark:text-${tool.color}-400`]">{{ tool.name }}</div>
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
