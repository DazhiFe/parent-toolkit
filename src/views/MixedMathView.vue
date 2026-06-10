<script setup>
import { ref, computed } from 'vue'

// 题目数量设置
const withinHundredCount = ref(12)
const threeDigitCount = ref(12)

const generatedProblems = ref([])
const showResults = ref(false)

const currentDate = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
})

const totalCount = computed(() => {
  const w = Math.max(0, Math.min(50, withinHundredCount.value || 0))
  const t = Math.max(0, Math.min(50, threeDigitCount.value || 0))
  return w + t
})

const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ==================== 百以内随机生成 ====================
const withinHundredGenerators = [
  // 相同数相加
  () => {
    const digits = [5, 6, 7, 8, 9]
    const digit = digits[randomInt(0, digits.length - 1)]
    let t1 = randomInt(1, 9), t2 = randomInt(1, 9)
    while (t1 * 10 + digit + t2 * 10 + digit >= 100) { t1 = randomInt(1, 9); t2 = randomInt(1, 9) }
    const a = t1 * 10 + digit, b = t2 * 10 + digit
    return { a, b, operator: '+', answer: a + b, type: '百以内加法' }
  },
  // 相邻数相加
  () => {
    const pairs = [[5, 6], [6, 7], [7, 8], [8, 9]]
    const p = pairs[randomInt(0, pairs.length - 1)]
    let t1 = randomInt(1, 9), t2 = randomInt(1, 9)
    while (t1 * 10 + p[0] + t2 * 10 + p[1] >= 100) { t1 = randomInt(1, 9); t2 = randomInt(1, 9) }
    const a = t1 * 10 + p[0], b = t2 * 10 + p[1]
    return { a, b, operator: '+', answer: a + b, type: '百以内加法' }
  },
  // 5+n加法
  () => {
    const pairs = [[5, 7], [5, 8], [5, 9]]
    const p = pairs[randomInt(0, pairs.length - 1)]
    let t1 = randomInt(1, 9), t2 = randomInt(1, 9)
    while (t1 * 10 + p[0] + t2 * 10 + p[1] >= 100) { t1 = randomInt(1, 9); t2 = randomInt(1, 9) }
    const a = t1 * 10 + p[0], b = t2 * 10 + p[1]
    return { a, b, operator: '+', answer: a + b, type: '百以内加法' }
  },
  // 9+n加法
  () => {
    const n = randomInt(1, 8)
    let t1 = randomInt(1, 9), t2 = randomInt(1, 9)
    while (t1 * 10 + 9 + t2 * 10 + n >= 100) { t1 = randomInt(1, 9); t2 = randomInt(1, 9) }
    const a = t1 * 10 + 9, b = t2 * 10 + n
    return { a, b, operator: '+', answer: a + b, type: '百以内加法' }
  },
  // 8+n加法
  () => {
    const pairs = [[8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7]]
    const p = pairs[randomInt(0, pairs.length - 1)]
    let t1 = randomInt(1, 9), t2 = randomInt(1, 9)
    while (t1 * 10 + p[0] + t2 * 10 + p[1] >= 100) { t1 = randomInt(1, 9); t2 = randomInt(1, 9) }
    const a = t1 * 10 + p[0], b = t2 * 10 + p[1]
    return { a, b, operator: '+', answer: a + b, type: '百以内加法' }
  },
  // 5+n逆运算（减法）
  () => {
    const pairs = [[1, 5], [1, 6], [2, 5], [2, 7], [3, 5], [3, 8], [4, 5], [4, 9]]
    const p = pairs[randomInt(0, pairs.length - 1)]
    const t1 = randomInt(1, 9), t2 = randomInt(1, 9)
    const a = t1 * 10 + p[0], b = t2 * 10 + p[1]
    if (a > b && a < 100 && b < 100) return { a, b, operator: '-', answer: a - b, type: '百以内减法' }
    return null
  },
  // 9+n逆运算（减法）
  () => {
    const pairs = [[0, 1], [0, 9], [1, 2], [1, 9], [2, 3], [2, 9], [3, 4], [3, 9], [4, 5], [4, 9], [5, 6], [5, 9], [6, 7], [6, 9], [7, 8], [7, 9], [8, 9]]
    const p = pairs[randomInt(0, pairs.length - 1)]
    const t1 = randomInt(1, 9), t2 = randomInt(1, 9)
    const a = t1 * 10 + p[0], b = t2 * 10 + p[1]
    if (a > b && a < 100 && b < 100) return { a, b, operator: '-', answer: a - b, type: '百以内减法' }
    return null
  },
  // 8+n逆运算（减法）
  () => {
    const pairs = [[0, 2], [0, 8], [1, 3], [1, 8], [2, 4], [2, 8], [3, 5], [3, 8], [4, 6], [4, 8], [5, 7], [5, 8], [6, 8]]
    const p = pairs[randomInt(0, pairs.length - 1)]
    const t1 = randomInt(1, 9), t2 = randomInt(1, 9)
    const a = t1 * 10 + p[0], b = t2 * 10 + p[1]
    if (a > b && a < 100 && b < 100) return { a, b, operator: '-', answer: a - b, type: '百以内减法' }
    return null
  },
  // 相同数相加逆运算（减法）
  () => {
    const pairs = [[0, 5], [2, 6], [4, 7]]
    const p = pairs[randomInt(0, pairs.length - 1)]
    const t1 = randomInt(1, 9), t2 = randomInt(1, 9)
    const a = t1 * 10 + p[0], b = t2 * 10 + p[1]
    if (a > b) return { a, b, operator: '-', answer: a - b, type: '百以内减法' }
    return null
  },
  // 相邻数相加逆运算（减法）
  () => {
    const pairs = [[3, 6], [3, 7]]
    const p = pairs[randomInt(0, pairs.length - 1)]
    const t1 = randomInt(1, 9), t2 = randomInt(1, 9)
    const a = t1 * 10 + p[0], b = t2 * 10 + p[1]
    if (a > b && a < 100 && b < 100) return { a, b, operator: '-', answer: a - b, type: '百以内减法' }
    return null
  }
]

const withinHundredAddGenerators = withinHundredGenerators.filter((_, i) => i < 5)  // 前5个是加法
const withinHundredSubGenerators = withinHundredGenerators.filter((_, i) => i >= 5) // 后5个是减法

const generateRandomWithinHundred = (forceAdd = null) => {
  const isAdd = forceAdd !== null ? forceAdd : Math.random() < 0.4
  const gens = isAdd ? withinHundredAddGenerators : withinHundredSubGenerators
  let problem = null
  let attempts = 0
  while (!problem && attempts < 50) {
    const gen = gens[randomInt(0, gens.length - 1)]
    problem = gen()
    attempts++
  }
  return problem
}

// ==================== 三位数随机生成 ====================
const threeDigitGenerators = [
  // 整百数加三位数
  () => {
    const hundreds = [100, 200, 300, 400, 500, 600, 700, 800, 900]
    const a = hundreds[randomInt(0, 8)]
    const b = randomInt(100, Math.min(999, 1000 - a))
    return { a, b, operator: '+', answer: a + b, type: '三位数加法' }
  },
  // 只有个位进位
  () => {
    const a1 = randomInt(0, 9), a2 = randomInt(0, 8), a3 = randomInt(1, 8)
    const b1 = randomInt(10 - a1, 9), b2 = randomInt(0, 9 - a2 - 1), b3 = randomInt(1, 9 - a3)
    const a = a3 * 100 + a2 * 10 + a1, b = b3 * 100 + b2 * 10 + b1
    return { a, b, operator: '+', answer: a + b, type: '三位数加法' }
  },
  // 只有十位进位
  () => {
    const a1 = randomInt(0, 9), b1 = randomInt(0, 9 - a1)
    const a2 = randomInt(1, 9), b2 = randomInt(10 - a2, 9)
    const a3 = randomInt(1, 8), b3 = randomInt(1, 8 - a3)
    const a = a3 * 100 + a2 * 10 + a1, b = b3 * 100 + b2 * 10 + b1
    return { a, b, operator: '+', answer: a + b, type: '三位数加法' }
  },
  // 个位十位连续进位
  () => {
    const a1 = randomInt(0, 8), a2 = randomInt(0, 8), a3 = randomInt(1, 7)
    const b1 = randomInt(10 - a1, 9), b2 = randomInt(10 - a2, 9), b3 = randomInt(1, 8 - a3)
    const a = a3 * 100 + a2 * 10 + a1, b = b3 * 100 + b2 * 10 + b1
    return { a, b, operator: '+', answer: a + b, type: '三位数加法' }
  },
  // 整百数减三位数
  () => {
    const hundreds = [200, 300, 400, 500, 600, 700, 800, 900]
    const a = hundreds[randomInt(0, 7)]
    const b = randomInt(100, a - 1)
    return { a, b, operator: '-', answer: a - b, type: '三位数减法' }
  },
  // 只有个位退位
  () => {
    const a1 = randomInt(0, 8), a2 = randomInt(1, 9), a3 = randomInt(2, 9)
    const b1 = randomInt(a1 + 1, 9), b2 = randomInt(0, a2 - 1), b3 = randomInt(1, a3 - 1)
    const a = a3 * 100 + a2 * 10 + a1, b = b3 * 100 + b2 * 10 + b1
    return { a, b, operator: '-', answer: a - b, type: '三位数减法' }
  },
  // 只有十位退位
  () => {
    const a1 = randomInt(1, 9), a2 = randomInt(0, 8), a3 = randomInt(2, 9)
    const b1 = randomInt(0, a1 - 1), b2 = randomInt(a2 + 1, 9), b3 = randomInt(1, a3 - 1)
    const a = a3 * 100 + a2 * 10 + a1, b = b3 * 100 + b2 * 10 + b1
    return { a, b, operator: '-', answer: a - b, type: '三位数减法' }
  },
  // 个位十位连续退位
  () => {
    const a1 = randomInt(0, 7), a2 = randomInt(0, 7), a3 = randomInt(2, 9)
    const b1 = randomInt(a1 + 1, 9), b2 = randomInt(a2 + 1, 9), b3 = randomInt(1, a3 - 1)
    const a = a3 * 100 + a2 * 10 + a1, b = b3 * 100 + b2 * 10 + b1
    return { a, b, operator: '-', answer: a - b, type: '三位数减法' }
  }
]

const threeDigitAddGenerators = threeDigitGenerators.filter((_, i) => i < 4)  // 前4个是加法
const threeDigitSubGenerators = threeDigitGenerators.filter((_, i) => i >= 4) // 后4个是减法

const generateRandomThreeDigit = (forceAdd = null) => {
  const isAdd = forceAdd !== null ? forceAdd : Math.random() < 0.4
  const gens = isAdd ? threeDigitAddGenerators : threeDigitSubGenerators
  const gen = gens[randomInt(0, gens.length - 1)]
  return gen()
}

// ==================== 一键生成 ====================
const generateProblems = () => {
  const wCount = Math.max(0, Math.min(50, withinHundredCount.value || 0))
  const tCount = Math.max(0, Math.min(50, threeDigitCount.value || 0))

  if (wCount === 0 && tCount === 0) return

  const allProblems = []

  // 生成百以内题目：加法40%、减法60%
  const wAddCount = Math.round(wCount * 0.4)
  const wSubCount = wCount - wAddCount
  for (let i = 0; i < wAddCount; i++) {
    const p = generateRandomWithinHundred(true)
    if (p) allProblems.push(p)
  }
  for (let i = 0; i < wSubCount; i++) {
    const p = generateRandomWithinHundred(false)
    if (p) allProblems.push(p)
  }

  // 生成三位数题目：加法40%、减法60%
  const tAddCount = Math.round(tCount * 0.4)
  const tSubCount = tCount - tAddCount
  for (let i = 0; i < tAddCount; i++) {
    const p = generateRandomThreeDigit(true)
    if (p) allProblems.push(p)
  }
  for (let i = 0; i < tSubCount; i++) {
    const p = generateRandomThreeDigit(false)
    if (p) allProblems.push(p)
  }

  generatedProblems.value = allProblems
  showResults.value = true
}

const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 打印用：列优先穿插排列，确保每列加减法均匀分布
const printProblemsOrdered = computed(() => {
  const all = [...generatedProblems.value]
  if (all.length === 0) return []

  // 分离加减法并各自乱序
  const adds = shuffleArray(all.filter(p => p.operator === '+'))
  const subs = shuffleArray(all.filter(p => p.operator === '-'))

  // 加权随机穿插：按剩余数量比例随机抽取，避免固定规律
  const interleaved = []
  const addPool = [...adds]
  const subPool = [...subs]
  while (addPool.length > 0 || subPool.length > 0) {
    // 按剩余数量比例 + 随机扰动决定从哪个池抽
    const totalRemaining = addPool.length + subPool.length
    const addWeight = totalRemaining > 0 ? addPool.length / totalRemaining : 0
    const pickAdd = Math.random() < addWeight && addPool.length > 0
    if (pickAdd || subPool.length === 0) {
      interleaved.push(addPool.shift())
    } else {
      interleaved.push(subPool.shift())
    }
  }

  // 按列优先重排（4列），使每列自上而下也有均匀的加减分布
  const cols = 4
  const rows = Math.ceil(interleaved.length / cols)
  const result = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = c * rows + r
      if (idx < interleaved.length) result.push(interleaved[idx])
    }
  }
  return result
})

const printProblems = () => {
  window.print()
}
</script>

<template>
  <div class="px-4 py-8 max-w-5xl mx-auto">
    <div class="mb-8 print:hidden text-center">
      <h1 class="text-3xl font-bold dark:text-white">百以内+三位数加减混合</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">随机生成百以内与三位数加减混合练习题</p>
    </div>

    <!-- 设置区域 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 print:hidden">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <!-- 百以内加减 -->
        <div class="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-blue-900 dark:text-blue-200">百以内加减法</h3>
              <p class="text-xs text-blue-600 dark:text-blue-400">两位数加减，涵盖进退位各类题型</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <label class="text-sm font-medium text-blue-800 dark:text-blue-300">题目数量</label>
            <input
              type="number"
              v-model.number="withinHundredCount"
              min="0"
              max="50"
              class="w-20 px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg text-center text-lg font-semibold dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span class="text-sm text-blue-600 dark:text-blue-400">题</span>
          </div>
        </div>

        <!-- 三位数加减 -->
        <div class="p-5 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-purple-900 dark:text-purple-200">三位数加减法</h3>
              <p class="text-xs text-purple-600 dark:text-purple-400">三位数加减，涵盖进退位各类题型</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <label class="text-sm font-medium text-purple-800 dark:text-purple-300">题目数量</label>
            <input
              type="number"
              v-model.number="threeDigitCount"
              min="0"
              max="50"
              class="w-20 px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-lg text-center text-lg font-semibold dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <span class="text-sm text-purple-600 dark:text-purple-400">题</span>
          </div>
        </div>
      </div>

      <!-- 总计提示 -->
      <div class="text-center mb-4">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          共计 <span class="font-bold text-gray-800 dark:text-gray-200 text-base">{{ totalCount }}</span> 题
        </span>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-4 justify-center">
        <button
          @click="generateProblems"
          :disabled="totalCount === 0"
          :class="[
            'px-8 py-3 rounded-lg font-medium transition-colors text-lg',
            totalCount > 0
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600'
          ]"
        >
          一键生成
        </button>
        <button
          @click="printProblems"
          :disabled="!showResults"
          :class="[
            'px-8 py-3 rounded-lg font-medium transition-colors text-lg',
            showResults
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600'
          ]"
        >
          打印
        </button>
      </div>
    </div>

    <!-- 题目展示区域 -->
    <div v-if="showResults" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 print-area">
      <h2 class="text-xl font-semibold mb-4 dark:text-white print:text-center print:hidden">练习题</h2>
      <!-- 打印专用标题 -->
      <div class="hidden print:block print-header">
        <h1 class="print-title">{{ currentDate }}</h1>
      </div>
      <!-- 打印专用题目列表（随机打乱顺序） -->
      <div class="hidden print:block print-problems-container">
        <div class="print-problems-grid">
          <div
            v-for="(problem, index) in printProblemsOrdered"
            :key="index"
            class="print-problem-item"
          >
            <span class="print-problem-content">{{ problem.a }} {{ problem.operator }} {{ problem.b }} =</span>
          </div>
        </div>
      </div>
      <!-- 屏幕显示题目列表 -->
      <div class="print:hidden">
        <!-- 百以内题目 -->
        <div v-if="generatedProblems.some(p => p.type === '百以内加法' || p.type === '百以内减法')" class="mb-6">
          <h3 class="text-lg font-semibold mb-3 dark:text-white flex items-center gap-2">
            <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
            百以内加减法（{{ generatedProblems.filter(p => p.type === '百以内加法' || p.type === '百以内减法').length }}题）
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="(problem, index) in generatedProblems.filter(p => p.type === '百以内加法' || p.type === '百以内减法')"
              :key="'w' + index"
              class="p-3 border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg"
            >
              <div class="text-lg font-medium dark:text-white whitespace-nowrap">
                {{ index + 1 }}. {{ problem.a }} {{ problem.operator }} {{ problem.b }} =
              </div>
              <div class="text-xs text-blue-500 dark:text-blue-400 mt-1 text-right">{{ problem.type }}</div>
            </div>
          </div>
        </div>
        <!-- 三位数题目 -->
        <div v-if="generatedProblems.some(p => p.type.startsWith('三位数'))">
          <h3 class="text-lg font-semibold mb-3 dark:text-white flex items-center gap-2">
            <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
            三位数加减法（{{ generatedProblems.filter(p => p.type.startsWith('三位数')).length }}题）
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="(problem, index) in generatedProblems.filter(p => p.type.startsWith('三位数'))"
              :key="'t' + index"
              class="p-3 border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg"
            >
              <div class="text-lg font-medium dark:text-white whitespace-nowrap">
                {{ index + 1 }}. {{ problem.a }} {{ problem.operator }} {{ problem.b }} =
              </div>
              <div class="text-xs text-purple-500 dark:text-purple-400 mt-1 text-right">{{ problem.type }}</div>
            </div>
          </div>
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
    margin: 0 !important;
    padding: 0 !important;
  }

  .dark {
    background: white !important;
  }

  /* 彻底隐藏非打印区域，不占空间 */
  .print\:hidden {
    display: none !important;
  }

  .px-4.py-8.max-w-5xl.mx-auto {
    padding: 0 !important;
    max-width: 100% !important;
  }

  .print-area {
    box-shadow: none !important;
    padding: 0 !important;
    background: white !important;
    page-break-inside: avoid;
  }

  .print-header {
    text-align: center;
    margin-bottom: 40px;
    display: block !important;
    page-break-after: avoid;
  }

  .print-title {
    font-size: 24pt;
    font-weight: bold;
    margin: 0;
  }

  .print-problems-container {
    width: calc(100% - 2px);
    border: 1px solid #aaa;
    padding: 10px 15px;
    border-radius: 0;
    display: block !important;
    page-break-inside: avoid;
    margin: 0 1px;
  }

  .print-problems-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 0 30px;
  }

  .print-problem-item {
    display: flex !important;
    align-items: center;
    justify-content: flex-start;
    font-size: 24pt;
    font-family: "Calibri", sans-serif;
    padding: 14px 8px;
    line-height: 1.5;
    text-align: left;
  }

  .print-problem-content {
    flex: 1;
    text-align: left;
  }
}
</style>
