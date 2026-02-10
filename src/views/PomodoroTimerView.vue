<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const WORK_TIME = 25
const SHORT_BREAK = 5
const LONG_BREAK = 15

const timerType = ref('work')
const timeLeft = ref(WORK_TIME * 60)
const isRunning = ref(false)
const completedPomodoros = ref(0)
const currentTask = ref('')
const taskHistory = ref([])
const toast = ref({
  show: false,
  message: '',
  type: 'error'
})

let timerInterval = null
let startTime = null
let pausedTimeLeft = null
let toastTimeout = null

const STORAGE_KEY = 'pomodoro-timer-history'

const showToast = (message, type = 'error') => {
  toast.value = {
    show: true,
    message,
    type
  }
  
  if (toastTimeout) {
    clearTimeout(toastTimeout)
  }
  
  toastTimeout = setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      taskHistory.value = data.taskHistory || []
      completedPomodoros.value = data.completedPomodoros || 0
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
  }
}

const saveToStorage = () => {
  try {
    const data = {
      taskHistory: taskHistory.value,
      completedPomodoros: completedPomodoros.value
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

const deleteTask = (index) => {
  const taskToDelete = taskHistory.value[index]
  
  if (taskToDelete.status === 'in-progress') {
    pauseTimer()
    startTime = null
    pausedTimeLeft = null
    
    switch (timerType.value) {
      case 'work':
        timeLeft.value = WORK_TIME * 60
        break
      case 'shortBreak':
        timeLeft.value = SHORT_BREAK * 60
        break
      case 'longBreak':
        timeLeft.value = LONG_BREAK * 60
        break
    }
  }
  
  taskHistory.value.splice(index, 1)
  saveToStorage()
}

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const timerTypeLabel = computed(() => {
  switch (timerType.value) {
    case 'work':
      return '专注时间'
    case 'shortBreak':
      return '短休息'
    case 'longBreak':
      return '长休息'
    default:
      return '专注时间'
  }
})

const timerTypeColor = computed(() => {
  switch (timerType.value) {
    case 'work':
      return 'bg-red-500'
    case 'shortBreak':
      return 'bg-green-500'
    case 'longBreak':
      return 'bg-blue-500'
    default:
      return 'bg-red-500'
  }
})

const progress = computed(() => {
  let totalTime
  switch (timerType.value) {
    case 'work':
      totalTime = WORK_TIME * 60
      break
    case 'shortBreak':
      totalTime = SHORT_BREAK * 60
      break
    case 'longBreak':
      totalTime = LONG_BREAK * 60
      break
    default:
      totalTime = WORK_TIME * 60
  }
  return ((totalTime - timeLeft.value) / totalTime) * 100
})

const startTimer = () => {
  if (isRunning.value) return
  
  if (timerType.value === 'work' && !currentTask.value.trim()) {
    showToast('请先输入任务名称')
    return
  }
  
  isRunning.value = true
  startTime = Date.now()
  
  const initialTimeLeft = timeLeft.value
  
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    const remaining = initialTimeLeft - elapsed
    
    if (remaining > 0) {
      timeLeft.value = remaining
    } else {
      timeLeft.value = 0
      completeTimer()
    }
  }, 100)
}

const pauseTimer = () => {
  isRunning.value = false
  pausedTimeLeft = timeLeft.value
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const resetTimer = () => {
  pauseTimer()
  pausedTimeLeft = null
  
  const inProgressTask = taskHistory.value.find(item => item.status === 'in-progress')
  if (inProgressTask) {
    inProgressTask.status = 'cancelled'
    inProgressTask.completedAt = new Date().toLocaleString('zh-CN')
    saveToStorage()
  }
  
  switch (timerType.value) {
    case 'work':
      timeLeft.value = WORK_TIME * 60
      break
    case 'shortBreak':
      timeLeft.value = SHORT_BREAK * 60
      break
    case 'longBreak':
      timeLeft.value = LONG_BREAK * 60
      break
  }
}

const completeTimer = () => {
  pauseTimer()
  startTime = null
  pausedTimeLeft = null
  
  if (timerType.value === 'work') {
    completedPomodoros.value++
    
    const inProgressTask = taskHistory.value.find(item => item.status === 'in-progress')
    if (inProgressTask) {
      inProgressTask.status = 'completed'
      inProgressTask.completedAt = new Date().toLocaleString('zh-CN')
    } else {
      taskHistory.value.unshift({
        task: '未命名任务',
        completedAt: new Date().toLocaleString('zh-CN'),
        duration: '25分钟',
        status: 'completed'
      })
    }
    
    saveToStorage()
    
    if (completedPomodoros.value % 4 === 0) {
      setTimerType('longBreak')
    } else {
      setTimerType('shortBreak')
    }
  } else {
    setTimerType('work')
  }
  
  playNotificationSound()
}

const setTimerType = (type) => {
  timerType.value = type
  pausedTimeLeft = null
  switch (type) {
    case 'work':
      timeLeft.value = WORK_TIME * 60
      break
    case 'shortBreak':
      timeLeft.value = SHORT_BREAK * 60
      break
    case 'longBreak':
      timeLeft.value = LONG_BREAK * 60
      break
  }
}

const playNotificationSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.value = 800
  oscillator.type = 'sine'
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.5)
}

const handleTaskInput = () => {
  if (currentTask.value.trim() && !isRunning.value) {
    const taskName = currentTask.value.trim()
    
    taskHistory.value.unshift({
      task: taskName,
      completedAt: null,
      duration: '25分钟',
      status: 'in-progress'
    })
    
    currentTask.value = ''
    saveToStorage()
    startTimer()
  }
}

const clearTaskHistory = () => {
  taskHistory.value = []
  completedPomodoros.value = 0
  saveToStorage()
}

watch([taskHistory, completedPomodoros], () => {
  saveToStorage()
}, { deep: true })

onMounted(() => {
  loadFromStorage()
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  if (toastTimeout) {
    clearTimeout(toastTimeout)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2 dark:text-white">番茄时钟</h1>
        <p class="text-gray-600 dark:text-gray-400">使用番茄工作法提高专注力和效率</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
        <div class="flex justify-center gap-2 sm:gap-4 mb-8 flex-wrap">
          <button
            @click="setTimerType('work')"
            :class="[
              'px-3 sm:px-6 py-2 sm:py-3 rounded-full font-medium transition-all whitespace-nowrap text-sm sm:text-base',
              timerType === 'work' 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            ]"
          >
            专注 (25分钟)
          </button>
          <button
            @click="setTimerType('shortBreak')"
            :class="[
              'px-3 sm:px-6 py-2 sm:py-3 rounded-full font-medium transition-all whitespace-nowrap text-sm sm:text-base',
              timerType === 'shortBreak' 
                ? 'bg-green-500 text-white shadow-lg' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            ]"
          >
            短休息 (5分钟)
          </button>
          <button
            @click="setTimerType('longBreak')"
            :class="[
              'px-3 sm:px-6 py-2 sm:py-3 rounded-full font-medium transition-all whitespace-nowrap text-sm sm:text-base',
              timerType === 'longBreak' 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            ]"
          >
            长休息 (15分钟)
          </button>
        </div>

        <div class="relative mb-8">
          <div class="w-72 h-72 mx-auto relative">
            <svg class="w-full h-full transform -rotate-90">
              <circle
                cx="144"
                cy="144"
                r="130"
                stroke="currentColor"
                stroke-width="12"
                fill="none"
                class="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="144"
                cy="144"
                r="130"
                :stroke="timerTypeColor"
                stroke-width="12"
                fill="none"
                :stroke-dasharray="816.8"
                :stroke-dashoffset="816.8 - (816.8 * progress) / 100"
                stroke-linecap="round"
                class="transition-all duration-1000 ease-in-out"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-6xl font-bold dark:text-white">{{ formattedTime }}</span>
              <span class="text-xl text-gray-600 dark:text-gray-400 mt-2">{{ timerTypeLabel }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-center gap-2 sm:gap-4 mb-8 flex-wrap">
          <button
            @click="startTimer"
            :disabled="isRunning"
            :class="[
              'px-4 sm:px-8 py-2 sm:py-3 rounded-full font-medium transition-all whitespace-nowrap text-sm sm:text-base',
              isRunning 
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed' 
                : 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl'
            ]"
          >
            开始
          </button>
          <button
            @click="pauseTimer"
            :disabled="!isRunning"
            :class="[
              'px-4 sm:px-8 py-2 sm:py-3 rounded-full font-medium transition-all whitespace-nowrap text-sm sm:text-base',
              !isRunning 
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed' 
                : 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg hover:shadow-xl'
            ]"
          >
            暂停
          </button>
          <button
            @click="resetTimer"
            class="px-4 sm:px-8 py-2 sm:py-3 rounded-full font-medium bg-gray-500 text-white hover:bg-gray-600 shadow-lg hover:shadow-xl transition-all whitespace-nowrap text-sm sm:text-base"
          >
            重置
          </button>
        </div>

        <div class="text-center">
          <div class="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span class="text-lg font-semibold dark:text-white">已完成 {{ completedPomodoros }} 个番茄钟</span>
          </div>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-8">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 class="text-xl font-bold mb-4 dark:text-white">当前任务</h2>
          <input
            v-model="currentTask"
            type="text"
            placeholder="输入你要专注的任务，回车开始计时..."
            @keyup.enter="handleTaskInput"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-4"
          />
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 class="font-semibold mb-2 dark:text-white">使用提示：</h3>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• 每个番茄钟专注25分钟</li>
              <li>• 休息5分钟（短休息）</li>
              <li>• 完成4个番茄钟后休息15分钟</li>
              <li>• 避免中断，保持专注</li>
            </ul>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold dark:text-white">完成记录</h2>
            <button
              @click="clearTaskHistory"
              v-if="taskHistory.length > 0"
              class="text-sm text-red-500 hover:text-red-600"
            >
              清空记录
            </button>
          </div>
          <div v-if="taskHistory.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            暂无完成记录
          </div>
          <div v-else class="space-y-3 max-h-64 overflow-y-auto">
            <div
              v-for="(item, index) in taskHistory"
              :key="index"
              :class="[
                'flex items-start gap-3 p-3 rounded-lg transition-all',
                item.status === 'in-progress' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600' 
                  : item.status === 'cancelled'
                  ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-600'
                  : 'bg-gray-50 dark:bg-gray-700'
              ]"
            >
              <div 
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  item.status === 'in-progress' 
                    ? 'bg-blue-500' 
                    : item.status === 'cancelled'
                    ? 'bg-red-500'
                    : 'bg-green-500'
                ]"
              >
                <svg v-if="item.status === 'in-progress'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white animate-spin" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                </svg>
                <svg v-else-if="item.status === 'cancelled'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium dark:text-white truncate">{{ item.task }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span 
                    :class="[
                      'text-xs px-2 py-1 rounded-full',
                      item.status === 'in-progress' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : item.status === 'cancelled'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    ]"
                  >
                    {{ item.status === 'in-progress' ? '进行中' : item.status === 'cancelled' ? '已取消' : '已完成' }}
                  </span>
                  <span class="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">{{ item.duration }}</span>
                  <span v-if="item.completedAt" class="text-sm text-gray-500 dark:text-gray-400">{{ item.completedAt }}</span>
                  <span v-else class="text-sm text-blue-500 dark:text-blue-400">计时中...</span>
                </div>
              </div>
              <button
                @click="deleteTask(index)"
                class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="删除记录"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="transform translate-y-[-20px] opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-[-20px] opacity-0"
    >
      <div
        v-if="toast.show"
        :class="[
          'fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3',
          toast.type === 'error' 
            ? 'bg-red-500 text-white' 
            : 'bg-green-500 text-white'
        ]"
      >
        <svg v-if="toast.type === 'error'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span class="font-medium">{{ toast.message }}</span>
      </div>
    </transition>
  </div>
</template>
