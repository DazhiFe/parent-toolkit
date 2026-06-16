<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import ToastNotification from './components/ToastNotification.vue'
import './composables/useTheme.js'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-16 overflow-x-clip">
    <AppHeader />
    <main class="flex-grow">
      <RouterView />
    </main>
    <AppFooter />
    <ToastNotification />
  </div>
</template>

<style>
/* 防文字选择（仅生产环境，通过 body class 控制） */
body.protected {
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
body.protected input,
body.protected textarea,
body.protected [contenteditable="true"] {
  -webkit-user-select: text;
  -moz-user-select: text;
  user-select: text;
}

/* 全局输入框焦点样式 - 替换默认黑色边框 */
input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}
input:focus:not(:focus-visible),
textarea:focus:not(:focus-visible),
select:focus:not(:focus-visible) {
  box-shadow: none;
}
</style>

<style scoped>
</style>
