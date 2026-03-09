<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'
import { theme, toggleTheme } from '../composables/useTheme.js'

const route = useRoute()
const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

// 判断当前路由是否匹配
const isActiveRoute = (path) => {
  if (path === '/' && route.path === '/') return true
  if (path !== '/' && route.path.startsWith(path)) return true
  return false
}
</script>

<template>
  <header class="bg-white dark:bg-gray-800 shadow-sm fixed top-0 left-0 right-0 z-50">
    <nav class="w-full pl-4 pr-2 py-4 flex items-center justify-between">
      <div class="flex items-center space-x-8">
        <RouterLink to="/" class="text-xl font-bold text-primary-600 dark:text-primary-400">家长工具箱</RouterLink>
        <div class="hidden md:flex space-x-6">
          <RouterLink to="/" :class="isActiveRoute('/') ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'" class="transition-colors">首页</RouterLink>
          <RouterLink to="/study-assistant" :class="isActiveRoute('/study-assistant') ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'" class="transition-colors">学习助手</RouterLink>
          <RouterLink to="/ai-tools" :class="isActiveRoute('/ai-tools') ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'" class="transition-colors">AI工具</RouterLink>
          <RouterLink to="/about" :class="isActiveRoute('/about') ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'" class="transition-colors">关于</RouterLink>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <!-- 主题切换按钮 -->
        <button @click="toggleTheme" class="p-2 rounded-full text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors focus:outline-none" aria-label="切换主题">
          <!-- 太阳图标 (亮色模式) -->
          <svg v-if="theme === 'dark'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
          </svg>
          <!-- 月亮图标 (暗色模式) -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>
      </div>
      <div class="md:hidden ml-auto">
        <button @click="toggleMenu" class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none">
          <svg v-if="!isMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </nav>
    <!-- Mobile menu -->
    <div v-show="isMenuOpen" class="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div class="px-2 pt-2 pb-3 space-y-1">
        <RouterLink @click="toggleMenu" to="/" :class="isActiveRoute('/') ? 'text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-gray-700' : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'" class="block px-3 py-2 rounded-md text-base font-medium transition-colors">首页</RouterLink>
        <RouterLink @click="toggleMenu" to="/study-assistant" :class="isActiveRoute('/study-assistant') ? 'text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-gray-700' : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'" class="block px-3 py-2 rounded-md text-base font-medium transition-colors">学习助手</RouterLink>
        <RouterLink @click="toggleMenu" to="/ai-tools" :class="isActiveRoute('/ai-tools') ? 'text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-gray-700' : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'" class="block px-3 py-2 rounded-md text-base font-medium transition-colors">AI工具</RouterLink>
        <RouterLink @click="toggleMenu" to="/about" :class="isActiveRoute('/about') ? 'text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-gray-700' : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'" class="block px-3 py-2 rounded-md text-base font-medium transition-colors">关于</RouterLink>
      </div>
    </div>
  </header>
</template>
