<script setup>
import { ref, computed } from 'vue'

const additionTypes = ref([
  { id: 'add-hundred', name: '整百数加三位数', example: '如 500+123', count: 1 },
  { id: 'add-carry-one', name: '只有个位进位', example: '如 238+325', count: 1 },
  { id: 'add-carry-ten', name: '只有十位进位', example: '如 238+381', count: 2 },
  { id: 'add-carry-both', name: '个位、十位连续进位', example: '如 238+383', count: 2 }
])

const subtractionTypes = ref([
  { id: 'sub-hundred', name: '整百数减三位数', example: '如 500-123', count: 1 },
  { id: 'sub-borrow-one', name: '只有个位退位', example: '如 538-329', count: 1 },
  { id: 'sub-borrow-ten', name: '只有十位退位', example: '如 538-381', count: 2 },
  { id: 'sub-borrow-both', name: '个位、十位连续退位', example: '如 538-389', count: 2 }
])

const allowOverThousand = ref(false)
const overThousandCount = ref(1)

const generatedProblems = ref([])
const showResults = ref(false)

// 当前日期，格式：YYYY年MM月DD日
const currentDate = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
})

const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const generateHundredAddition = (maxSum = 1000) => {
  const hundreds = [100, 200, 300, 400, 500, 600, 700, 800, 900]
  const a = hundreds[randomInt(0, 8)]
  const maxB = Math.min(999, maxSum - a)
  const b = randomInt(100, Math.max(100, maxB))
  return { a, b, operator: '+', answer: a + b, type: '整百数加三位数' }
}

const generateCarryOneAddition = (maxSum = 1000) => {
  const a1 = randomInt(0, 9)
  const a2 = randomInt(0, 8)
  const a3 = randomInt(1, 8)
  const b1 = randomInt(10 - a1, 9)
  const b2 = randomInt(0, 9 - a2 - 1)
  const b3 = randomInt(1, 9 - a3)
  const a = a3 * 100 + a2 * 10 + a1
  const b = b3 * 100 + b2 * 10 + b1
  return { a, b, operator: '+', answer: a + b, type: '只有个位进位' }
}

const generateCarryTenAddition = (maxSum = 1000) => {
  // 只有十位进位：个位不进位，十位进位，百位不进位
  // 个位：a1 + b1 < 10
  // 十位：a2 + b2 >= 10
  // 百位：a3 + b3 + 1(十位进位) < 10，即 a3 + b3 <= 8
  const a1 = randomInt(0, 9)
  const b1 = randomInt(0, 9 - a1) // 确保 a1 + b1 <= 9，不进位
  
  const a2 = randomInt(1, 9) // a2 至少为1，确保可以进位
  const b2 = randomInt(10 - a2, 9) // 确保 a2 + b2 >= 10，进位
  
  const a3 = randomInt(1, 8) // a3 至少为1
  const b3 = randomInt(1, 8 - a3) // b3 至少为1，确保b是三位数；确保 a3 + b3 + 1(进位) <= 9
  
  const a = a3 * 100 + a2 * 10 + a1
  const b = b3 * 100 + b2 * 10 + b1
  return { a, b, operator: '+', answer: a + b, type: '只有十位进位' }
}

const generateCarryBothAddition = (maxSum = 1000) => {
  const a1 = randomInt(0, 8)
  const a2 = randomInt(0, 8)
  const a3 = randomInt(1, 7)
  const b1 = randomInt(10 - a1, 9)
  const b2 = randomInt(10 - a2, 9)
  const b3 = randomInt(1, 8 - a3)
  const a = a3 * 100 + a2 * 10 + a1
  const b = b3 * 100 + b2 * 10 + b1
  return { a, b, operator: '+', answer: a + b, type: '个位、十位连续进位' }
}

const generateOverThousandAddition = () => {
  // 确保生成的和大于1000且不超过1100
  // 策略：让百位之和 >= 10，或者百位之和 = 9 且十位有进位
  // 同时限制百位之和不超过10，确保和 <= 1100
  const type = randomInt(0, 3)
  let a, b, typeName
  
  switch (type) {
    case 0: // 整百数 + 三位数，1000 < 和 <= 1100
      const hundreds = [200, 300, 400, 500, 600, 700, 800, 900]
      a = hundreds[randomInt(0, 7)]
      // 1000 - a + 1 <= b <= min(999, 1100 - a)
      const minB = 1000 - a + 1
      const maxB = Math.min(999, 1100 - a)
      b = randomInt(minB, maxB)
      typeName = '整百数加三位数(>1000)'
      break
    case 1: // 只有个位进位，1000 < 和 <= 1100
      const a1_1 = randomInt(0, 9)
      const a2_1 = randomInt(0, 8)
      // 百位之和 = 10，确保和 > 1000 且 <= 1100
      const a3_1 = randomInt(1, 9)
      const b3_1 = 10 - a3_1
      const b1_1 = randomInt(10 - a1_1, 9)
      const b2_1 = randomInt(0, 9 - a2_1 - 1)
      a = a3_1 * 100 + a2_1 * 10 + a1_1
      b = b3_1 * 100 + b2_1 * 10 + b1_1
      typeName = '只有个位进位(>1000)'
      break
    case 2: // 只有十位进位，1000 < 和 <= 1100
      const a1_2 = randomInt(0, 8)
      const a2_2 = randomInt(1, 9) // a2至少为1，确保可以进位
      // 百位之和 = 9，加上十位进位后 = 10
      const a3_2 = randomInt(1, 8) // a3最大为8，确保b3至少为1
      const b3_2 = 9 - a3_2 // b3_2 范围是 1-8
      const b1_2 = randomInt(0, 9 - a1_2 - 1)
      const b2_2 = randomInt(10 - a2_2, 9)
      a = a3_2 * 100 + a2_2 * 10 + a1_2
      b = b3_2 * 100 + b2_2 * 10 + b1_2
      typeName = '只有十位进位(>1000)'
      break
    case 3: // 个位十位连续进位，1000 < 和 <= 1100
      const a1_3 = randomInt(0, 8)
      const a2_3 = randomInt(0, 8)
      // 百位之和 = 9，加上进位后 = 10
      const a3_3 = randomInt(1, 8) // a3最大为8，确保b3至少为1
      const b3_3 = 9 - a3_3 // b3_3 范围是 1-8
      const b1_3 = randomInt(10 - a1_3, 9)
      const b2_3 = randomInt(10 - a2_3, 9)
      a = a3_3 * 100 + a2_3 * 10 + a1_3
      b = b3_3 * 100 + b2_3 * 10 + b1_3
      typeName = '个位、十位连续进位(>1000)'
      break
  }
  
  return { a, b, operator: '+', answer: a + b, type: typeName }
}

const generateHundredSubtraction = () => {
  const hundreds = [200, 300, 400, 500, 600, 700, 800, 900]
  const a = hundreds[randomInt(0, 7)]
  const b = randomInt(100, a - 1)
  return { a, b, operator: '-', answer: a - b, type: '整百数减三位数' }
}

const generateBorrowOneSubtraction = () => {
  const a1 = randomInt(0, 8)
  const a2 = randomInt(1, 9)
  const a3 = randomInt(2, 9)
  const b1 = randomInt(a1 + 1, 9)
  const b2 = randomInt(0, a2 - 1)
  const b3 = randomInt(1, a3 - 1)
  const a = a3 * 100 + a2 * 10 + a1
  const b = b3 * 100 + b2 * 10 + b1
  return { a, b, operator: '-', answer: a - b, type: '只有个位退位' }
}

const generateBorrowTenSubtraction = () => {
  const a1 = randomInt(1, 9)
  const a2 = randomInt(0, 8)
  const a3 = randomInt(2, 9)
  const b1 = randomInt(0, a1 - 1)
  const b2 = randomInt(a2 + 1, 9)
  const b3 = randomInt(1, a3 - 1)
  const a = a3 * 100 + a2 * 10 + a1
  const b = b3 * 100 + b2 * 10 + b1
  return { a, b, operator: '-', answer: a - b, type: '只有十位退位' }
}

const generateBorrowBothSubtraction = () => {
  const a1 = randomInt(0, 7)
  const a2 = randomInt(0, 7)
  const a3 = randomInt(2, 9)
  const b1 = randomInt(a1 + 1, 9)
  const b2 = randomInt(a2 + 1, 9)
  const b3 = randomInt(1, a3 - 1)
  const a = a3 * 100 + a2 * 10 + a1
  const b = b3 * 100 + b2 * 10 + b1
  return { a, b, operator: '-', answer: a - b, type: '个位、十位连续退位' }
}

const generateProblems = () => {
  generatedProblems.value = []
  const additionProblems = []
  
  // 先生成所有加法题目
  additionTypes.value.forEach(type => {
    const count = type.count || 0
    for (let i = 0; i < count; i++) {
      let problem
      switch (type.id) {
        case 'add-hundred':
          problem = generateHundredAddition()
          break
        case 'add-carry-one':
          problem = generateCarryOneAddition()
          break
        case 'add-carry-ten':
          problem = generateCarryTenAddition()
          break
        case 'add-carry-both':
          problem = generateCarryBothAddition()
          break
      }
      if (problem) {
        additionProblems.push(problem)
      }
    }
  })
  
  // 如果启用了和大于1000，替换掉一部分题目
  if (allowOverThousand.value && overThousandCount.value > 0) {
    const replaceCount = Math.min(overThousandCount.value, additionProblems.length)
    const replacedIndices = new Set()
    
    for (let i = 0; i < replaceCount; i++) {
      // 随机选择一个未被替换的位置
      let randomIndex
      do {
        randomIndex = randomInt(0, additionProblems.length - 1)
      } while (replacedIndices.has(randomIndex))
      
      replacedIndices.add(randomIndex)
      additionProblems[randomIndex] = generateOverThousandAddition()
    }
  }
  
  // 收集所有减法题目
  const subtractionProblems = []
  subtractionTypes.value.forEach(type => {
    const count = type.count || 0
    for (let i = 0; i < count; i++) {
      let problem
      switch (type.id) {
        case 'sub-hundred':
          problem = generateHundredSubtraction()
          break
        case 'sub-borrow-one':
          problem = generateBorrowOneSubtraction()
          break
        case 'sub-borrow-ten':
          problem = generateBorrowTenSubtraction()
          break
        case 'sub-borrow-both':
          problem = generateBorrowBothSubtraction()
          break
      }
      if (problem) {
        subtractionProblems.push(problem)
      }
    }
  })
  
  // 合并所有题目（保持原有顺序：先加法后减法）
  const allProblems = [...additionProblems, ...subtractionProblems]
  
  generatedProblems.value = allProblems
  showResults.value = true
}

// 打乱数组的辅助函数
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const printProblems = () => {
  window.print()
}
</script>

<template>
  <div class="px-4 py-8 max-w-5xl mx-auto">
    <div class="mb-8 print:hidden text-center">
      <h1 class="text-3xl font-bold dark:text-white">三位数加减题目生成器</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">生成三位数加减法练习题</p>
    </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 print:hidden">
        <h2 class="text-xl font-semibold mb-4 dark:text-white">加法题目</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div v-for="type in additionTypes" :key="type.id" class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex-1">
              <div class="font-medium dark:text-white">{{ type.name }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">{{ type.example }}</div>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">数量:</label>
              <input
                type="number"
                v-model.number="type.count"
                min="0"
                max="20"
                class="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center dark:bg-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>
        
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6">
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="allowOverThousand"
                class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span class="font-medium dark:text-white">和大于1000</span>
            </label>
            <div v-if="allowOverThousand" class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">题数:</label>
              <input
                type="number"
                v-model.number="overThousandCount"
                min="1"
                max="20"
                class="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center dark:bg-gray-600 dark:text-white"
              />
            </div>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2" v-if="allowOverThousand">
            生成和大于1000的加法题目（随机类型）
          </p>
        </div>
        
        <h2 class="text-xl font-semibold mb-4 dark:text-white">减法题目</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div v-for="type in subtractionTypes" :key="type.id" class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex-1">
              <div class="font-medium dark:text-white">{{ type.name }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">{{ type.example }}</div>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">数量:</label>
              <input
                type="number"
                v-model.number="type.count"
                min="0"
                max="20"
                class="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center dark:bg-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>
        
        <div class="flex gap-4">
          <button
            @click="generateProblems"
            class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            一键生成
          </button>
          <button
            @click="printProblems"
            :disabled="!showResults"
            :class="[
              'px-6 py-2 rounded-lg font-medium transition-colors',
              showResults
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            打印
          </button>
        </div>
      </div>
      
      <div v-if="showResults" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 print-area">
        <h2 class="text-xl font-semibold mb-4 dark:text-white print:text-center print:hidden">三位数加减练习题</h2>
        <!-- 打印专用标题 -->
        <div class="hidden print:block print-header">
          <h1 class="print-title">{{ currentDate }}</h1>
        </div>
        <!-- 打印专用题目列表（随机打乱顺序） -->
        <div class="hidden print:block print-problems-container">
          <div class="print-problems-grid">
            <div
              v-for="(problem, index) in shuffleArray(generatedProblems)"
              :key="index"
              class="print-problem-item"
            >
              <span class="print-problem-content">{{ problem.a }} {{ problem.operator }} {{ problem.b }} =</span>
            </div>
          </div>
        </div>
        <!-- 屏幕显示题目列表 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
          <div
            v-for="(problem, index) in generatedProblems"
            :key="index"
            class="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
          >
            <div class="text-lg font-medium dark:text-white whitespace-nowrap">
              <span>{{ index + 1 }}. {{ problem.a }} {{ problem.operator }} {{ problem.b }} =</span>
            </div>
            <div class="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">{{ problem.type }}</div>
          </div>
        </div>
      </div>
  </div>
</template>

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
  .bg-white.dark\:bg-gray-800.rounded-lg.shadow.p-6.mb-6 {
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
  
  /* 打印题目网格 - 两列布局 */
  .print-problems-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    gap: 15px 40px;
  }
  
  /* 打印题目项 */
  .print-problem-item {
    display: flex !important;
    align-items: center;
    font-size: 28px;
    padding: 15px 0;
  }
  
  .print-problem-content {
    flex: 1;
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
  .px-4.py-8 {
    padding: 0 !important;
  }
}
</style>
