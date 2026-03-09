<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()

// 判断是否需要为左侧导航栏留出空间
const hasSideNav = computed(() => {
  return ['/', '/ai-tools', '/study-assistant', '/growth-tools'].includes(route.path)
})
</script>

<template>
  <footer class="bg-gray-800 dark:bg-gray-950 text-white py-8 w-full lg:left-0" :class="{ 'lg:ml-64 lg:w-[calc(100%-16rem)]': hasSideNav }">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 class="text-lg font-semibold mb-4">家长工具箱</h3>
          <p class="text-gray-300 dark:text-gray-400">为家长提供AI工具导航和育儿辅助工具，助力孩子健康成长。</p>
        </div>
        <div>
          <h3 class="text-lg font-semibold mb-4">快速链接</h3>
          <ul class="space-y-2">
            <li><RouterLink to="/ai-tools" class="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">AI工具</RouterLink></li>
          </ul>
        </div>
        <div>
          <h3 class="text-lg font-semibold mb-4">联系我们</h3>
          <p class="text-gray-300 dark:text-gray-400">邮箱：contact@parent-toolkit.com</p>
          <div class="mt-4 flex space-x-4">
            <a href="#" class="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </a>
            <a href="#" class="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div class="mt-8 pt-8 border-t border-gray-700 dark:border-gray-800 text-center text-gray-400 dark:text-gray-500">
        <p>&copy; {{ new Date().getFullYear() }} 家长工具箱. 保留所有权利.</p>
      </div>
    </div>
  </footer>
</template>
