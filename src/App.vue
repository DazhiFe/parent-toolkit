<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import { onMounted } from 'vue'
import './composables/useTheme.js'

onMounted(() => {
  // 确保主题在应用加载时正确应用
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 pt-16 overflow-x-hidden">
    <AppHeader />
    <main class="flex-grow">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
</style>
