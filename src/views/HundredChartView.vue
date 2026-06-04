<script setup>
import { ref, computed } from 'vue'

// 配置参数
const startNum = ref(1)
const endNum = ref(100)
const cols = ref(10)
const highlightMode = ref('none')
const customHighlightNums = ref('')
const showNumber = ref(true)

// 高亮模式选项
const highlightModes = [
  { value: 'none', label: '无高亮' },
  { value: 'even', label: '偶数' },
  { value: 'odd', label: '奇数' },
  { value: 'multiple3', label: '3的倍数' },
  { value: 'multiple5', label: '5的倍数' },
  { value: 'multiple10', label: '10的倍数' },
  { value: 'prime', label: '质数' },
  { value: 'custom', label: '自定义' }
]

// 质数判断
const isPrime = (n) => {
  if (n < 2) return false
  if (n === 2) return true
  if (n % 2 === 0) return false
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false
  }
  return true
}

// 判断数字是否需要高亮
const shouldHighlight = (num) => {
  switch (highlightMode.value) {
    case 'even': return num % 2 === 0
    case 'odd': return num % 2 !== 0
    case 'multiple3': return num % 3 === 0
    case 'multiple5': return num % 5 === 0
    case 'multiple10': return num % 10 === 0
    case 'prime': return isPrime(num)
    case 'custom': {
      const nums = customHighlightNums.value
        .split(/[,，\s]+/)
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n))
      return nums.includes(num)
    }
    default: return false
  }
}

// 生成表格数据
const tableData = computed(() => {
  const start = Math.max(1, Math.min(startNum.value, endNum.value))
  const end = Math.min(999, Math.max(startNum.value, endNum.value))
  const c = Math.max(1, Math.min(cols.value, 20))
  const rows = []
  for (let i = start; i <= end; i += c) {
    const row = []
    for (let j = 0; j < c; j++) {
      const num = i + j
      row.push(num <= end ? num : null)
    }
    rows.push(row)
  }
  return rows
})

// 高亮颜色
const highlightColorClass = 'bg-teal-100 dark:bg-teal-800/40 text-teal-700 dark:text-teal-300 font-bold'

// 打印
const handlePrint = () => {
  window.print()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <!-- 标题 -->
      <div class="text-center mb-8 print:hidden">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white">百数表生成器</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">生成1-100数字表格，支持高亮和自定义范围</p>
      </div>

      <!-- 配置区 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 print:hidden">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">参数设置</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 左列：范围和列数 -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">数字范围</label>
              <div class="flex items-center gap-2">
                <input v-model.number="startNum" type="number" min="1" max="999"
                       class="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                <span class="text-gray-500 dark:text-gray-400">至</span>
                <input v-model.number="endNum" type="number" min="1" max="999"
                       class="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">每行列数</label>
              <div class="flex items-center gap-2">
                <input v-model.number="cols" type="range" min="5" max="15" step="1"
                       class="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-teal-600">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-center">{{ cols }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <input v-model="showNumber" type="checkbox" id="showNumber"
                     class="w-4 h-4 text-teal-600 rounded focus:ring-teal-500">
              <label for="showNumber" class="text-sm font-medium text-gray-700 dark:text-gray-300">显示数字</label>
            </div>
          </div>

          <!-- 右列：高亮设置 -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">高亮模式</label>
              <div class="grid grid-cols-2 gap-2">
                <button v-for="mode in highlightModes" :key="mode.value"
                        @click="highlightMode = mode.value"
                        :class="[
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          highlightMode === mode.value
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        ]">
                  {{ mode.label }}
                </button>
              </div>
            </div>

            <div v-if="highlightMode === 'custom'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">自定义高亮数字（用逗号或空格分隔）</label>
              <input v-model="customHighlightNums" type="text" placeholder="例如：2, 4, 6, 8, 10"
                     class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent">
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button @click="handlePrint"
                  class="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            打印
          </button>
          <button @click="startNum = 1; endNum = 100; cols = 10; highlightMode = 'none'; showNumber = true"
                  class="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors">
            重置
          </button>
        </div>
      </div>

      <!-- 百数表展示区 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 print:p-0 print:shadow-none">
        <h2 class="hidden print:block text-center text-3xl font-bold mb-6 text-gray-900">百数表</h2>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <tbody>
              <tr v-for="(row, rIdx) in tableData" :key="rIdx">
                <td v-for="(num, cIdx) in row" :key="cIdx"
                    :class="[
                      'border border-gray-300 dark:border-gray-600 text-center py-3 px-2 transition-colors',
                      num !== null && shouldHighlight(num) ? highlightColorClass : 'text-gray-800 dark:text-gray-200',
                      num === null ? 'bg-gray-50 dark:bg-gray-800' : ''
                    ]"
                    class="min-w-[2.5rem] text-lg sm:text-xl md:text-2xl">
                  <span v-if="num !== null && showNumber">{{ num }}</span>
                  <span v-else-if="num !== null && !showNumber" class="text-gray-300 dark:text-gray-600">?</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 图例 -->
        <div v-if="highlightMode !== 'none'" class="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 print:hidden">
          <span class="inline-block w-4 h-4 rounded bg-teal-100 dark:bg-teal-800/40 border border-teal-300 dark:border-teal-700"></span>
          <span>高亮数字</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  @page {
    size: landscape;
    margin: 15mm;
  }
  body {
    background: white !important;
  }
  .min-h-screen {
    min-height: auto !important;
    padding: 0 !important;
    background: white !important;
  }
  table {
    width: 100%;
  }
  td {
    padding: 10px 6px !important;
    font-size: 22px !important;
    border: 1px solid #333 !important;
    color: #000 !important;
  }
  .bg-teal-100 {
    background-color: #ccfbf1 !important;
  }
}
</style>
