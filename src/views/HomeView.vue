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
            <div class="mb-4 flex items-center justify-center h-24 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">课程表生成器</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">快速创建个性化的学习课程表</p>
            <button class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</button>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">习惯打卡表</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">帮助孩子养成良好习惯的打卡工具</p>
            <button class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</button>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">时间管理器</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">番茄工作法和学习时间规划</p>
            <button class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</button>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">成绩统计表</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">记录和分析孩子的学习成绩变化</p>
            <button class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</button>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">屏幕时间管理</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">合理规划孩子的屏幕使用时间</p>
            <button class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</button>
          </div>
          
          <div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-center h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">家庭任务分配</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">合理分配家庭任务，培养责任感</p>
            <button class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">使用工具 →</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
