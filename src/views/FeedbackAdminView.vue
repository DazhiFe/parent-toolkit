<script setup>
import { ref, computed } from 'vue'

const password = ref('')
const isAuthenticated = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const feedbackList = ref([])
const filterType = ref('all')

const typeMap = {
  suggestion: { label: '功能建议', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  bug: { label: '问题反馈', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  other: { label: '其他', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' },
}

const filteredList = computed(() => {
  if (filterType.value === 'all') return feedbackList.value
  return feedbackList.value.filter(item => item.type === filterType.value)
})

async function login() {
  if (!password.value.trim()) return
  await fetchList()
}

async function fetchList() {
  loading.value = true
  errorMsg.value = ''
  try {
    const API_BASE = import.meta.env.VITE_API_BASE || ''
    const res = await fetch(`${API_BASE}/api/feedback-list`, {
      headers: {
        'x-admin-password': password.value,
      },
    })
    const data = await res.json()
    if (data.success) {
      feedbackList.value = data.data
      isAuthenticated.value = true
    } else {
      errorMsg.value = data.error || '获取失败'
    }
  } catch (e) {
    errorMsg.value = '网络错误'
  } finally {
    loading.value = false
  }
}

function formatDate(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatType(type) {
  return typeMap[type] || { label: type, color: 'bg-gray-100 text-gray-700' }
}

function refresh() {
  fetchList()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12">
    <div class="max-w-5xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white">反馈管理后台</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">查看和管理用户反馈</p>
      </div>

      <!-- 密码验证 -->
      <div v-if="!isAuthenticated" class="max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
        <div class="text-center mb-6">
          <div class="text-4xl mb-2">🔐</div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">请输入管理密码</h2>
        </div>
        <input
          v-model="password"
          type="password"
          placeholder="管理密码"
          @keyup.enter="login"
          class="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-700 outline-none mb-4"
        />
        <p v-if="errorMsg" class="text-red-500 text-sm mb-3">{{ errorMsg }}</p>
        <button
          @click="login"
          :disabled="loading"
          class="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {{ loading ? '验证中...' : '进入后台' }}
        </button>
      </div>

      <!-- 反馈列表 -->
      <div v-else>
        <!-- 统计和筛选 -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">共 {{ feedbackList.length }} 条反馈</span>
            <button @click="refresh" class="text-primary-500 hover:text-primary-600 text-sm flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </button>
          </div>
          <div class="flex gap-2">
            <button
              v-for="opt in [['all', '全部'], ['suggestion', '功能建议'], ['bug', '问题反馈'], ['other', '其他']]"
              :key="opt[0]"
              @click="filterType = opt[0]"
              :class="filterType === opt[0] ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm border border-gray-200 dark:border-gray-600"
            >
              {{ opt[1] }}
            </button>
          </div>
        </div>

        <!-- 表格 -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 w-24">类型</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">反馈内容</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 w-32">联系方式</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 w-36">时间</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 w-24">来源页面</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredList" :key="item.id" class="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td class="px-4 py-3">
                    <span :class="formatType(item.type).color" class="px-2 py-1 rounded-md text-xs font-medium">
                      {{ formatType(item.type).label }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-md">
                    <p class="break-words">{{ item.content }}</p>
                  </td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {{ item.contact || '-' }}
                  </td>
                  <td class="px-4 py-3 text-gray-500 dark:text-gray-500 whitespace-nowrap">
                    {{ formatDate(item.timestamp) }}
                  </td>
                  <td class="px-4 py-3 text-gray-500 dark:text-gray-500">
                    <a v-if="item.url" :href="item.url" target="_blank" class="text-primary-500 hover:text-primary-600 text-xs truncate max-w-[100px] inline-block">
                      查看
                    </a>
                    <span v-else class="text-gray-400">-</span>
                  </td>
                </tr>
                <tr v-if="filteredList.length === 0">
                  <td colspan="5" class="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                    暂无反馈数据
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
