<script setup>
import { ref, computed, onMounted } from 'vue'

// 题目类型配置
const problemTypes = [
  { id: 'add10', name: '10以内加法', desc: '两个一位数相加，和不超过10', enabled: false, count: 8 },
  { id: 'sub10', name: '10以内减法', desc: '被减数和减数都是10以内，差不为负数', enabled: false, count: 8 },
  { id: 'mix10', name: '10以内加减混合', desc: '10以内的加法和减法混合', enabled: false, count: 8 },
  { id: 'add20no', name: '20以内不进位加法', desc: '两位数加一位数，不进位，和不超过20', enabled: false, count: 8 },
  { id: 'sub20no', name: '20以内不退位减法', desc: '两位数减一位数，不退位，被减数不超过20', enabled: false, count: 8 },
  { id: 'add20carry', name: '20以内进位加法', desc: '需要进位，和不超过20', enabled: false, count: 8 },
  { id: 'sub20borrow', name: '20以内退位减法', desc: '需要退位，被减数不超过20', enabled: false, count: 8 },
  { id: 'mix20', name: '20以内加减混合', desc: '20以内的加法和减法混合', enabled: false, count: 8 }
]

const types = ref(problemTypes)
const problems = ref([])

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// 生成题目键值（用于去重）
const getProblemKey = (a, b, operator) => `${a}${operator}${b}`

// 生成单个类型的所有不重复题目
const generateUniqueProblemsForType = (typeId, count) => {
  const uniqueProblems = new Map()
  let attempts = 0
  const maxAttempts = count * 100 // 防止无限循环

  // 判断是否为加减混合类型
  const isMixedType = typeId === 'mix10' || typeId === 'mix20'

  if (isMixedType) {
    // 加减混合：先生成一半的加法，再生成一半的减法
    const halfCount = Math.ceil(count / 2)
    let addCount = 0
    let subCount = 0

    while ((addCount < halfCount || subCount < halfCount) && attempts < maxAttempts) {
      attempts++
      const problem = generateSingleProblem(typeId)
      if (!problem) continue

      // 根据当前数量决定是否需要这种运算符
      if (problem.operator === '+' && addCount >= halfCount) continue
      if (problem.operator === '-' && subCount >= halfCount) continue

      const key = getProblemKey(problem.a, problem.b, problem.operator)

      // 检查是否已存在（包括交换律的情况，如 3+5 和 5+3 视为相同）
      let isDuplicate = uniqueProblems.has(key)

      // 对于加法，检查交换律重复
      if (!isDuplicate && problem.operator === '+') {
        const reverseKey = getProblemKey(problem.b, problem.a, problem.operator)
        isDuplicate = uniqueProblems.has(reverseKey)
      }

      if (!isDuplicate) {
        uniqueProblems.set(key, problem)
        if (problem.operator === '+') addCount++
        else subCount++
      }
    }
  } else {
    // 非混合类型：正常生成
    while (uniqueProblems.size < count && attempts < maxAttempts) {
      attempts++
      const problem = generateSingleProblem(typeId)
      if (!problem) continue

      const key = getProblemKey(problem.a, problem.b, problem.operator)

      // 检查是否已存在（包括交换律的情况，如 3+5 和 5+3 视为相同）
      let isDuplicate = uniqueProblems.has(key)

      // 对于加法，检查交换律重复
      if (!isDuplicate && problem.operator === '+') {
        const reverseKey = getProblemKey(problem.b, problem.a, problem.operator)
        isDuplicate = uniqueProblems.has(reverseKey)
      }

      if (!isDuplicate) {
        uniqueProblems.set(key, problem)
      }
    }
  }

  return Array.from(uniqueProblems.values())
}

// 生成题目
const generateProblems = () => {
  problems.value = []

  types.value.forEach(type => {
    if (!type.enabled) return
    
    const typeProblems = generateUniqueProblemsForType(type.id, type.count)
    problems.value.push(...typeProblems)
  })
  
  // 打乱顺序
  problems.value.sort(() => Math.random() - 0.5)
}

// 生成单个题目
const generateSingleProblem = (typeId) => {
  let a, b, operator, answer
  
  switch (typeId) {
    case 'add10':
      a = rand(1, 9)
      b = rand(1, 10 - a)
      operator = '+'
      answer = a + b
      break
      
    case 'sub10':
      a = rand(1, 9)
      b = rand(1, a)
      operator = '-'
      answer = a - b
      break
      
    case 'mix10':
      if (Math.random() > 0.5) {
        a = rand(1, 9)
        b = rand(1, 10 - a)
        operator = '+'
        answer = a + b
      } else {
        a = rand(1, 9)
        b = rand(1, a)
        operator = '-'
        answer = a - b
      }
      break
      
    case 'add20no':
      a = rand(11, 19)
      b = rand(1, 9 - (a % 10))
      operator = '+'
      answer = a + b
      break
      
    case 'sub20no':
      a = rand(11, 19)
      b = rand(1, a % 10)
      operator = '-'
      answer = a - b
      break
      
    case 'add20carry':
      a = rand(2, 9)
      b = rand(11 - a, 9)
      if (a + b > 20) b = 20 - a
      operator = '+'
      answer = a + b
      break
      
    case 'sub20borrow':
      a = rand(11, 19)
      b = rand((a % 10) + 1, 9)
      operator = '-'
      answer = a - b
      break
      
    case 'mix20':
      if (Math.random() > 0.5) {
        a = rand(1, 19)
        b = rand(1, 20 - a)
        operator = '+'
        answer = a + b
      } else {
        a = rand(2, 19)
        b = rand(1, a - 1)
        operator = '-'
        answer = a - b
      }
      break
  }
  
  return { a, b, operator, answer, userAnswer: '' }
}

// 打印
const printProblems = () => {
  window.print()
}

// 重置
const resetAll = () => {
  problems.value = []
  types.value.forEach(t => {
    t.enabled = false
    t.count = 8
  })
}

// 页面加载时不自动生成题目，等待用户选择
onMounted(() => {
  // 初始化空状态
})

// 将题目分组（每行4个）
const problemRows = computed(() => {
  const rows = []
  for (let i = 0; i < problems.value.length; i += 4) {
    rows.push(problems.value.slice(i, i + 4))
  }
  return rows
})

// 将题目按打印格式分组（每页24题，6行×4列），并随机打乱
const printPages = computed(() => {
  // 先打乱题目顺序
  const shuffled = [...problems.value].sort(() => Math.random() - 0.5)

  const pages = []
  for (let i = 0; i < shuffled.length; i += 24) {
    const pageProblems = shuffled.slice(i, i + 24)
    const rows = []
    for (let j = 0; j < pageProblems.length; j += 4) {
      rows.push(pageProblems.slice(j, j + 4))
    }
    pages.push({
      pageNum: Math.floor(i / 24) + 1,
      totalPages: Math.ceil(shuffled.length / 24),
      rows: rows
    })
  }
  return pages
})

// 获取当前日期
const currentDate = computed(() => {
  const date = new Date()
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <!-- 标题 -->
      <div class="text-center mb-8 print:hidden">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">20以内加减题目生成器</h1>
        <p class="text-gray-600 dark:text-gray-400">适合小学低年级学生练习</p>
      </div>
      
      <!-- 配置区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">题目类型设置</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="type in types" :key="type.id" 
               class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                v-model="type.enabled"
                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              >
              <div>
                <div class="font-medium text-gray-800 dark:text-white">{{ type.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ type.desc }}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">数量:</label>
              <input 
                type="number" 
                v-model.number="type.count"
                min="1" 
                max="20"
                class="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
            </div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="flex flex-wrap gap-3 mt-6">
          <button @click="generateProblems"
                  class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            生成题目
          </button>
          <button @click="printProblems"
                  :disabled="problems.length === 0"
                  :class="[
                    'px-6 py-2 font-medium rounded-lg transition-colors',
                    problems.length > 0
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  ]">
            打印题目
          </button>
          <button @click="resetAll"
                  class="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors">
            重置
          </button>
        </div>
      </div>
      
      <!-- 题目区域 -->
      <div v-if="problems.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 print-area">
        <h2 class="text-xl font-semibold mb-4 dark:text-white print:hidden">生成的题目</h2>

        <!-- 打印专用题目列表 -->
        <div class="hidden print:block">
          <div v-for="(page, pageIndex) in printPages" :key="pageIndex" class="print-page-block">
            <!-- 每页的日期标题 -->
            <div class="print-header">
              <h1 class="print-title">{{ currentDate }}</h1>
            </div>
            <!-- 每页的题目容器（带边框） -->
            <div class="print-problems-container">
              <table class="print-table">
                <tbody>
                  <tr v-for="(row, rowIndex) in page.rows" :key="rowIndex">
                    <td v-for="(problem, colIndex) in row" :key="colIndex" class="print-problem-cell">
                      <span>{{ problem.a }} {{ problem.operator }} {{ problem.b }} = </span>
                    </td>
                    <td v-for="emptyIndex in Math.max(0, 4 - row.length)" :key="'empty-' + emptyIndex" class="print-problem-cell"></td>
                  </tr>
                  <tr v-for="emptyRow in Math.max(0, 6 - page.rows.length)" :key="'empty-row-' + emptyRow">
                    <td v-for="col in 4" :key="col" class="print-problem-cell"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 屏幕显示题目列表 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
          <div v-for="(problem, index) in problems" :key="index"
               class="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <span class="text-gray-500 dark:text-gray-400 text-sm w-6">{{ index + 1 }}.</span>
            <span class="text-lg font-mono dark:text-white">{{ problem.a }} {{ problem.operator }} {{ problem.b }} = </span>
            <input
              v-model="problem.userAnswer"
              type="number"
              class="w-14 px-2 py-1 text-center border-2 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            >
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">
        请点击"重新生成"按钮生成题目
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>

<style>
@media print {
  @page {
    size: landscape;
    margin: 15mm;
  }

  /* 隐藏所有非打印内容 */
  .print\:hidden,
  aside,
  nav,
  .side-nav,
  header,
  footer,
  button,
  input,
  .bg-white.dark\:bg-gray-800.rounded-xl.shadow-lg.p-6.mb-6 {
    display: none !important;
  }

  .hidden.print\:block {
    display: block !important;
  }

  /* 重置页面布局 */
  body {
    background: white !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .dark {
    background: white !important;
  }

  /* 打印区域样式 */
  .print-area {
    box-shadow: none !important;
    padding: 0 !important;
    background: white !important;
  }

  /* 打印标题样式 */
  .print-header {
    text-align: center;
    margin-bottom: 20px;
    display: block !important;
  }

  .print-title {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
  }

  /* 打印题目容器 */
  .print-problems-container {
    border: 2px solid #d1d5db;
    padding: 20px;
    border-radius: 8px;
    display: block !important;
  }

  /* 打印分页块 */
  .print-page-block {
    page-break-after: always;
  }

  .print-page-block:last-child {
    page-break-after: avoid;
  }

  /* 打印表格 */
  .print-table {
    width: 100%;
    border-collapse: collapse;
  }

  /* 打印题目单元格 - 4列布局 */
  .print-problem-cell {
    width: 25%;
    padding: 15px 10px;
    text-align: center;
    font-size: 24px;
    vertical-align: middle;
  }

  /* 隐藏flex布局的侧边栏 */
  .flex {
    display: block !important;
  }

  /* 确保打印内容全宽 */
  .flex-1 {
    width: 100% !important;
    max-width: 100% !important;
  }

  /* 移除内边距 */
  .min-h-screen {
    padding: 0 !important;
  }
}
</style>
