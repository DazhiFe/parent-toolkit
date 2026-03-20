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
              <div class="text-blue-600 dark:text-blue-400 font-bold text-lg">教育部</div>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">中华人民共和国教育部</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">获取官方教育政策、通知和资源</p>
            <a href="http://www.moe.gov.cn/" target="_blank" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问网站 →</a>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div class="text-green-600 dark:text-green-400 font-bold text-lg">人教网</div>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">人民教育出版社</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">官方教材资源和教学指导</p>
            <a href="http://www.pep.com.cn/" target="_blank" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问网站 →</a>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div class="text-purple-600 dark:text-purple-400 font-bold text-lg">学而思</div>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">学而思网校</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">优质的在线教育平台和资源</p>
            <a href="https://www.xueersi.com/" target="_blank" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问网站 →</a>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div class="text-red-600 dark:text-red-400 font-bold text-lg">中国大学MOOC</div>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">慕课平台</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">高等教育优质课程资源共享</p>
            <a href="https://www.icourse163.org/" target="_blank" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问网站 →</a>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div class="text-yellow-600 dark:text-yellow-400 font-bold text-lg">国家图书馆</div>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">中国国家数字图书馆</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">海量数字资源和阅读材料</p>
            <a href="http://www.nlc.cn/" target="_blank" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问网站 →</a>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div class="text-indigo-600 dark:text-indigo-400 font-bold text-lg">科普中国</div>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">科普中国网</h3>
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
        </div>
      </section>
    </div>
  </div>
</template>
