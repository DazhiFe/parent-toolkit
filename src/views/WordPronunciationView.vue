<script setup>
import { ref, computed } from 'vue'

const inputText = ref('')
const words = ref([])
const speakingIndex = ref(-1)
const loadingIndex = ref(-1)
const errorMessage = ref('')

// 顺序/循环播放相关
const isSequentialPlaying = ref(false)
const isLoopMode = ref(false)
const playInterval = ref(1500) // 单词间隔 ms

// 使用Web Speech API进行语音合成
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

// 解析输入文本，去重生成单词列表
const parseWords = () => {
  errorMessage.value = ''
  const text = inputText.value.trim()

  if (!text) {
    errorMessage.value = '请输入英文单词'
    return
  }

  const rawWords = text.split(/[\s,;\t\n]+/).filter(w => w.trim() !== '')

  const seen = new Set()
  const uniqueWords = []
  for (const w of rawWords) {
    const lower = w.toLowerCase().trim()
    if (lower && /^[a-zA-Z]+$/.test(lower) && !seen.has(lower)) {
      seen.add(lower)
      uniqueWords.push(lower)
    }
  }

  if (uniqueWords.length === 0) {
    errorMessage.value = '未检测到有效的英文单词，请检查输入'
    return
  }

  words.value = uniqueWords
  inputText.value = ''
}

// 拼读单词
const speakWord = (word, index) => {
  if (!synth) {
    errorMessage.value = '您的浏览器不支持语音合成功能'
    return
  }

  synth.cancel()

  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  utterance.rate = 0.8
  utterance.pitch = 1

  const voices = synth.getVoices()
  const enVoice = voices.find(v => v.lang.startsWith('en'))
  if (enVoice) {
    utterance.voice = enVoice
  }

  loadingIndex.value = index
  speakingIndex.value = -1

  utterance.onstart = () => {
    loadingIndex.value = -1
    speakingIndex.value = index
  }

  utterance.onend = () => {
    speakingIndex.value = -1
    loadingIndex.value = -1
  }

  utterance.onerror = () => {
    speakingIndex.value = -1
    loadingIndex.value = -1
    errorMessage.value = '发音失败，请重试'
  }

  synth.speak(utterance)
}

// 顺序播放
const sequentialPlayIndex = ref(-1)

const startSequentialPlay = () => {
  if (words.value.length === 0 || !synth) return

  isSequentialPlaying.value = true
  sequentialPlayIndex.value = 0
  playSequentialWord()
}

const playSequentialWord = () => {
  if (!isSequentialPlaying.value) return
  if (sequentialPlayIndex.value >= words.value.length) {
    if (isLoopMode.value) {
      sequentialPlayIndex.value = 0
    } else {
      stopSequentialPlay()
      return
    }
  }

  const index = sequentialPlayIndex.value
  const word = words.value[index]

  synth.cancel()

  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  utterance.rate = 0.8
  utterance.pitch = 1

  const voices = synth.getVoices()
  const enVoice = voices.find(v => v.lang.startsWith('en'))
  if (enVoice) {
    utterance.voice = enVoice
  }

  loadingIndex.value = index
  speakingIndex.value = -1

  utterance.onstart = () => {
    loadingIndex.value = -1
    speakingIndex.value = index
  }

  utterance.onend = () => {
    speakingIndex.value = -1
    loadingIndex.value = -1
    if (isSequentialPlaying.value) {
      sequentialPlayIndex.value++
      setTimeout(() => {
        playSequentialWord()
      }, playInterval.value)
    }
  }

  utterance.onerror = () => {
    speakingIndex.value = -1
    loadingIndex.value = -1
    if (isSequentialPlaying.value) {
      sequentialPlayIndex.value++
      setTimeout(() => {
        playSequentialWord()
      }, playInterval.value)
    }
  }

  synth.speak(utterance)
}

const pauseSequentialPlay = () => {
  isSequentialPlaying.value = false
  synth?.cancel()
  speakingIndex.value = -1
  loadingIndex.value = -1
}

const resumeSequentialPlay = () => {
  if (sequentialPlayIndex.value >= words.value.length) {
    sequentialPlayIndex.value = 0
  }
  isSequentialPlaying.value = true
  playSequentialWord()
}

const stopSequentialPlay = () => {
  isSequentialPlaying.value = false
  sequentialPlayIndex.value = -1
  synth?.cancel()
  speakingIndex.value = -1
  loadingIndex.value = -1
}

const toggleSequentialPlay = () => {
  if (isSequentialPlaying.value) {
    pauseSequentialPlay()
  } else if (sequentialPlayIndex.value >= 0 && sequentialPlayIndex.value < words.value.length) {
    resumeSequentialPlay()
  } else {
    startSequentialPlay()
  }
}

// 删除单个单词
const removeWord = (index) => {
  if (speakingIndex.value === index || loadingIndex.value === index) {
    synth?.cancel()
    speakingIndex.value = -1
    loadingIndex.value = -1
  }
  // 如果正在顺序播放，删除当前或之前的单词需要调整索引
  if (isSequentialPlaying.value || sequentialPlayIndex.value >= 0) {
    if (index < sequentialPlayIndex.value) {
      sequentialPlayIndex.value--
    } else if (index === sequentialPlayIndex.value) {
      stopSequentialPlay()
    }
  }
  words.value.splice(index, 1)
}

// 清空列表
const clearWords = () => {
  stopSequentialPlay()
  words.value = []
}

// 统计信息
const wordCount = computed(() => words.value.length)

// 播放进度文本
const playProgress = computed(() => {
  if (sequentialPlayIndex.value < 0) return ''
  const current = Math.min(sequentialPlayIndex.value + 1, words.value.length)
  return `${current} / ${words.value.length}`
})
</script>

<template>
  <div class="px-4 py-8 max-w-4xl mx-auto">
      <!-- 标题区 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold dark:text-white">单词拼读</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">输入英文单词，点击喇叭图标听发音</p>
      </div>

      <!-- 输入区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          输入英文单词（空格、逗号或换行分隔）
        </label>
        <textarea
          v-model="inputText"
          rows="4"
          class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none text-base"
          placeholder="例如：apple banana orange grape"
          @keydown.ctrl.enter="parseWords"
          @keydown.meta.enter="parseWords"
        ></textarea>
        <div class="flex items-center justify-between mt-3">
          <span class="text-xs text-gray-400">Ctrl + Enter 快速添加</span>
          <button
            @click="parseWords"
            class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            添加单词
          </button>
        </div>
        <!-- 错误提示 -->
        <div v-if="errorMessage" class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-red-600 dark:text-red-400 text-sm">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- 单词列表 -->
      <div v-if="words.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <!-- 列表头部 -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold dark:text-white">单词列表</h2>
            <span class="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
              {{ wordCount }} 个单词
            </span>
          </div>
          <button
            @click="clearWords"
            class="px-4 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            清空列表
          </button>
        </div>

        <!-- 播放控制栏 -->
        <div class="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <!-- 播放/暂停按钮 -->
          <button
            @click="toggleSequentialPlay"
            class="p-2.5 rounded-full transition-colors"
            :class="isSequentialPlaying
              ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
              : 'bg-purple-600 hover:bg-purple-700 text-white'"
            :title="isSequentialPlaying ? '暂停' : '顺序播放'"
          >
            <!-- 暂停图标 -->
            <svg v-if="isSequentialPlaying" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd" />
            </svg>
            <!-- 播放图标 -->
            <svg v-else class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
            </svg>
          </button>

          <!-- 停止按钮 -->
          <button
            v-if="sequentialPlayIndex >= 0"
            @click="stopSequentialPlay"
            class="p-2.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            title="停止"
          >
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fill-rule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clip-rule="evenodd" />
            </svg>
          </button>

          <!-- 播放进度 -->
          <span v-if="sequentialPlayIndex >= 0" class="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {{ playProgress }}
          </span>

          <div class="flex-1"></div>

          <!-- 循环播放开关 -->
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <span class="text-sm text-gray-500 dark:text-gray-400">循环</span>
            <div class="relative">
              <input type="checkbox" v-model="isLoopMode" class="sr-only peer">
              <div class="w-9 h-5 bg-gray-300 dark:bg-gray-600 peer-checked:bg-purple-500 rounded-full transition-colors"></div>
              <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
            </div>
          </label>

          <!-- 间隔设置 -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">间隔</span>
            <select
              v-model.number="playInterval"
              class="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-purple-500"
            >
              <option :value="800">0.8秒</option>
              <option :value="1000">1秒</option>
              <option :value="1500">1.5秒</option>
              <option :value="2000">2秒</option>
              <option :value="3000">3秒</option>
            </select>
          </div>
        </div>

        <!-- 单词网格 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div
            v-for="(word, index) in words"
            :key="index"
            :class="[
              'flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200',
              speakingIndex === index || sequentialPlayIndex === index && isSequentialPlaying
                ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-600'
                : loadingIndex === index
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600'
                  : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-gray-400 dark:text-gray-500 text-sm w-6 text-right flex-shrink-0">{{ index + 1 }}</span>
              <span class="text-lg font-medium dark:text-white truncate">{{ word }}</span>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0 ml-2">
              <!-- 拼读按钮 -->
              <button
                @click="stopSequentialPlay(); speakWord(word, index)"
                class="p-2 rounded-full transition-colors"
                :class="speakingIndex === index
                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
                  : 'hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-400 hover:text-purple-500 dark:hover:text-purple-400'"
                :title="speakingIndex === index ? '正在播放' : '点击拼读'"
              >
                <!-- 加载中动画 -->
                <svg v-if="loadingIndex === index" class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <!-- 播放中动画 -->
                <svg v-else-if="speakingIndex === index" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                  <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                </svg>
                <!-- 默认喇叭图标 -->
                <svg v-else class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
                </svg>
              </button>
              <!-- 删除按钮 -->
              <button
                @click="removeWord(index)"
                class="p-1.5 rounded-full text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="删除单词"
              >
                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
        <svg class="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p class="text-gray-400 dark:text-gray-500 text-lg">在上方输入英文单词开始拼读</p>
        <p class="text-gray-300 dark:text-gray-600 text-sm mt-2">支持空格、逗号或换行分隔多个单词</p>
      </div>
    </div>
</template>
