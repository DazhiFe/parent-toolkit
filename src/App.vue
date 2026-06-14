<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import './composables/useTheme.js'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-16 overflow-x-hidden">
    <AppHeader />
    <main class="flex-grow">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
</style>
