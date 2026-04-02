<script setup>
import { RouterLink } from 'vue-router'
import SideNav from '../components/SideNav.vue'
</script>

<template>
  <div class="flex">
    <!-- 左侧导航 -->
    <SideNav />
    
    <!-- 右侧内容区 -->
    <div class="flex-1 lg:ml-64 px-4 py-8">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold dark:text-white">家长工具箱</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">为家长和孩子提供实用工具和资源</p>
      </div>

      <!-- 常用网站 -->
      <section id="websites" class="mb-12">
        <h2 class="text-2xl font-bold mb-6 dark:text-white">常用网站</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">教育部</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">获取官方教育政策、通知和资源</p>
            <a href="http://www.moe.gov.cn/" target="_blank" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问网站 →</a>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">人教网</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">官方教材资源和教学指导</p>
            <a href="http://www.pep.com.cn/" target="_blank" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问网站 →</a>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">学而思</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">优质的在线教育平台和资源</p>
            <a href="https://www.xueersi.com/" target="_blank" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问网站 →</a>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">慕课平台</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">高等教育优质课程资源共享</p>
            <a href="https://www.icourse163.org/" target="_blank" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问网站 →</a>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">国家图书馆</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">海量数字资源和阅读材料</p>
            <a href="http://www.nlc.cn/" target="_blank" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问网站 →</a>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">科普中国</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">权威科学知识和科普资源</p>
            <a href="http://www.kepu.gov.cn/" target="_blank" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问网站 →</a>
          </div>
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
            <div class="mb-4 flex items-center justify-center h-24 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">视频去水印</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">智能去除视频水印，保持原有画质</p>
            <RouterLink to="/video-watermark-removal" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</RouterLink>
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
            <div class="mb-4 flex items-center justify-center h-24 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">PDF转Word</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">将PDF文件转换为Word文档</p>
            <RouterLink to="/pdf-to-word" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</RouterLink>
          </div>
        </div>
      </section>

      <!-- Office格式工具 -->
      <section id="office-tools" class="mb-12">
        <h2 class="text-2xl font-bold mb-6 dark:text-white">Office格式工具</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">Word转PDF</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">将Word文档转换为PDF文件</p>
            <RouterLink to="/word-to-pdf" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</RouterLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
