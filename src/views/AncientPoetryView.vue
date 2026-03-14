<script setup>
import { ref, computed } from 'vue'
import { pinyin } from 'pinyin-pro'
import { searchPoemByTitle, getRequiredPoems, getPoemsByLevel } from '../data/poems.js'

const poemName = ref('')
const loading = ref(false)
const result = ref(null)
const error = ref('')
const requiredPoems = getRequiredPoems()
const activeTab = ref('original') // 当前选中的 Tab：original, translation, appreciation, keywords
const selectedLevel = ref('all') // 当前选中的学段：all, 小学, 初中, 高中

// 各学段古诗数量
const levelCounts = computed(() => ({
  all: requiredPoems.length,
  小学: getPoemsByLevel('小学').length,
  初中: getPoemsByLevel('初中').length,
  高中: getPoemsByLevel('高中').length
}))

// 根据学段获取古诗列表
const filteredPoems = computed(() => {
  if (selectedLevel.value === 'all') {
    return requiredPoems
  }
  return getPoemsByLevel(selectedLevel.value)
})

// 生成拼音
const generatePinyin = (text) => {
  // 只提取汉字
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []
  
  // 逐个汉字转换拼音，避免整句转换时的多音字和格式问题
  const pinyinList = chineseChars.map(char => {
    return pinyin(char, {
      toneType: 'symbol',
      type: 'string'
    })
  })
  
  // 确保拼音数量和汉字数量一致
  if (pinyinList.length !== chineseChars.length) {
    console.warn('拼音数量和汉字数量不匹配', { text, pinyinList, chineseChars })
  }
  
  return pinyinList
}

// 解析诗句，生成带拼音的字符数组
const parsePoemLine = (line) => {
  const chars = []
  const pinyinArray = generatePinyin(line)
  let pinyinIndex = 0
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    // 检查是否是汉字
    if (/[\u4e00-\u9fa5]/.test(char)) {
      chars.push({
        char: char,
        pinyin: pinyinArray[pinyinIndex] || ''
      })
      pinyinIndex++
    } else {
      // 标点符号
      chars.push({
        char: char,
        pinyin: null,
        isPunctuation: true
      })
    }
  }
  
  return chars
}

const searchPoem = () => {
  if (!poemName.value.trim()) {
    error.value = '请输入古诗名称。目前收录227首古诗词，涵盖小学、初中、高中三个学段。'
    return
  }

  loading.value = true
  error.value = ''
  result.value = null

  // 本地数据查询，无需延迟
  const poem = searchPoemByTitle(poemName.value.trim())
  
  if (!poem) {
    error.value = '未找到该古诗，请检查诗名是否正确。目前收录了227首古诗词，涵盖小学（75首）、初中（85首）、高中（67首）三个学段，如：静夜思、木兰诗、将进酒等。'
    loading.value = false
    return
  }

  // 解析每行诗句的拼音
  // 对于长文（如阿房宫赋），需要按句（。！？）进一步分割
  const poemLines = []
  poem.content.forEach(line => {
    // 按句读符号分割，但保留符号
    const sentences = line.split(/([。！？；])/)
    let currentSentence = ''
    sentences.forEach(part => {
      if (part) {
        currentSentence += part
        // 如果遇到句读符号，完成当前句
        if (/[。！？；]/.test(part)) {
          poemLines.push({
            text: currentSentence,
            chars: parsePoemLine(currentSentence)
          })
          currentSentence = ''
        }
      }
    })
    // 处理最后可能没有标点的部分
    if (currentSentence.trim()) {
      poemLines.push({
        text: currentSentence,
        chars: parsePoemLine(currentSentence)
      })
    }
  })

  // 判断是否为散文/赋/文言文（综合多种因素）
  const isProse = (() => {
    // 1. 标题关键词判断（文体特征）
    const proseKeywords = ['赋', '序', '记', '说', '论', '辞', '表', '铭', '谏', '传', '列传', '世家', '本纪', '书', '志']
    const hasProseKeyword = proseKeywords.some(keyword => poem.title.includes(keyword))
    
    // 2. 作者/出处判断（经典著作或史书）
    const classicAuthors = ['论语', '孟子', '礼记', '孔子', '孟子', '司马迁', '史记', '左传', '战国策', '国语']
    const isClassic = classicAuthors.some(author => 
      poem.author.includes(author) || poem.title.includes(author)
    )
    
    // 3. 内容特征判断（检查是否包含大量对话体特征）
    const contentText = poem.content.join('')
    const dialoguePatterns = ['子曰', '孟子曰', '曾子曰', '子贡曰', '子路曰', '谓之', '曰：']
    const hasDialogue = dialoguePatterns.some(pattern => contentText.includes(pattern))
    
    // 4. 先秦散文（朝代+内容长度）
    const isPreQinProse = poem.dynasty === '先秦' && poem.content.length > 3
    
    // 5. 史书体例（汉代+长文+特定作者）
    const isHistoryProse = poem.dynasty === '汉' && 
                           (poem.author.includes('司马迁') || poem.title.includes('列传') || poem.title.includes('世家')) &&
                           poem.content.length > 3
    
    // 满足任一条件即为散文
    return hasProseKeyword || isClassic || hasDialogue || isPreQinProse || isHistoryProse
  })()

  // 将译文按原文段落数分段（如果是长文/散文）
  const translationParagraphs = (() => {
    if (!poem.translation) return []
    const totalLength = poem.translation.length
    const paragraphCount = poem.content.length
    if (paragraphCount <= 1) return [poem.translation]
    
    // 按字数大致均分译文
    const avgLength = Math.ceil(totalLength / paragraphCount)
    const paragraphs = []
    let start = 0
    
    for (let i = 0; i < paragraphCount; i++) {
      if (i === paragraphCount - 1) {
        // 最后一段，取剩余所有内容
        paragraphs.push(poem.translation.slice(start))
      } else {
        // 寻找合适的分割点（在句号、问号、感叹号后）
        let end = start + avgLength
        // 向后查找最近的句读符号
        let searchEnd = Math.min(end + 50, totalLength)
        let bestEnd = end
        for (let j = end; j < searchEnd; j++) {
          if ('。！？；'.includes(poem.translation[j])) {
            bestEnd = j + 1
            break
          }
        }
        paragraphs.push(poem.translation.slice(start, bestEnd))
        start = bestEnd
      }
    }
    return paragraphs
  })()

  // 为普通诗歌生成逐句对照的译文
  // 按句读符号（。！？；等，不包括逗号）分割句子，一句原文对应一句译文
  const lineByLineTranslation = (() => {
    if (!poem.translation || isProse) return []

    // 将原文按句读符号分割成句子（不包括逗号）
    const originalText = poem.content.join('')
    const originalSentences = []
    let currentSentence = ''
    for (let i = 0; i < originalText.length; i++) {
      currentSentence += originalText[i]
      // 遇到句读符号（不包括逗号），完成一个句子
      if (/[。！？；]/.test(originalText[i])) {
        originalSentences.push(currentSentence.trim())
        currentSentence = ''
      }
    }
    // 处理最后可能剩余的内容
    if (currentSentence.trim()) {
      originalSentences.push(currentSentence.trim())
    }

    // 将译文按句读符号分割成句子（不包括逗号）
    const translationSentences = []
    currentSentence = ''
    for (let i = 0; i < poem.translation.length; i++) {
      currentSentence += poem.translation[i]
      // 遇到句读符号（不包括逗号），完成一个句子
      if (/[。！？；]/.test(poem.translation[i])) {
        translationSentences.push(currentSentence.trim())
        currentSentence = ''
      }
    }
    // 处理最后可能剩余的内容
    if (currentSentence.trim()) {
      translationSentences.push(currentSentence.trim())
    }

    // 一句原文对应一句译文
    const pairs = []
    const maxLen = Math.max(originalSentences.length, translationSentences.length)
    for (let i = 0; i < maxLen; i++) {
      pairs.push({
        original: originalSentences[i] || '',
        translation: translationSentences[i] || ''
      })
    }

    return pairs
  })()

  result.value = {
    title: poem.title,
    author: `${poem.dynasty}·${poem.author}`,
    poemLines: poemLines,
    originalParagraphs: poem.content, // 原始段落，用于长文显示
    isProse: isProse, // 是否为散文/赋/文言文
    translation: poem.translation,
    translationParagraphs: translationParagraphs, // 分段后的译文（散文用）
    lineByLineTranslation: lineByLineTranslation, // 逐句对照译文（诗词用）
    appreciation: poem.appreciation,
    keywords: poem.keywords
  }
  
  // 查询成功后重置Tab到原文
  activeTab.value = 'original'
  
  loading.value = false
}

const clearResult = () => {
  poemName.value = ''
  result.value = null
  error.value = ''
}

// 快速选择古诗
const selectPoem = (poem) => {
  poemName.value = poem.title
  searchPoem()
}
</script>

<template>
  <div class="flex justify-center">
    <div class="flex-1 max-w-6xl px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold dark:text-white">古诗词讲解速查</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">收录227首古诗词，涵盖小学、初中、高中三个学段，提供译文、赏析、重点字词</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <input 
              v-model="poemName"
              type="text"
              placeholder="请输入古诗名称，如：静夜思、春晓、登鹳雀楼、木兰诗、将进酒..."
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
              @keyup.enter="searchPoem"
            />
          </div>
          <button 
            @click="searchPoem" 
            :disabled="loading"
            class="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium text-lg flex items-center justify-center min-w-[120px]"
          >
            <svg v-if="loading" class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? '查询中...' : '查询' }}
          </button>
          <button 
            v-if="result"
            @click="clearResult"
            class="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            清空
          </button>
        </div>
      </div>

      <!-- 快速选择 -->
      <div v-if="!result" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">快速选择</h3>
          <!-- 学段筛选 -->
          <div class="flex gap-2">
            <button
              @click="selectedLevel = 'all'"
              :class="[
                'px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5',
                selectedLevel === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
            >
              全部
              <span class="text-xs opacity-80">({{ levelCounts.all }})</span>
            </button>
            <button
              @click="selectedLevel = '小学'"
              :class="[
                'px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5',
                selectedLevel === '小学'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
            >
              小学
              <span class="text-xs opacity-80">({{ levelCounts['小学'] }})</span>
            </button>
            <button
              @click="selectedLevel = '初中'"
              :class="[
                'px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5',
                selectedLevel === '初中'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
            >
              初中
              <span class="text-xs opacity-80">({{ levelCounts['初中'] }})</span>
            </button>
            <button
              @click="selectedLevel = '高中'"
              :class="[
                'px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5',
                selectedLevel === '高中'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
            >
              高中
              <span class="text-xs opacity-80">({{ levelCounts['高中'] }})</span>
            </button>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="poem in filteredPoems"
            :key="poem.id"
            @click="selectPoem(poem)"
            class="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900 text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-300 rounded-lg transition-colors text-sm"
          >
            {{ poem.title }}
          </button>
        </div>
      </div>

      <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <div v-if="result" class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <!-- 古诗标题和作者 -->
        <div class="px-6 py-5 text-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-1">{{ result.title }}</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm">{{ result.author }}</p>
        </div>

        <!-- Tab 选项卡导航 -->
        <div class="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            @click="activeTab = 'original'"
            :class="[
              'flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2',
              activeTab === 'original'
                ? 'text-red-600 border-b-2 border-red-600 bg-white dark:bg-gray-800 dark:text-red-400'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            原文
          </button>
          <button
            @click="activeTab = 'translation'"
            :class="[
              'flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2',
              activeTab === 'translation'
                ? 'text-green-600 border-b-2 border-green-600 bg-white dark:bg-gray-800 dark:text-green-400'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
            </svg>
            译文
          </button>
          <button
            @click="activeTab = 'appreciation'"
            :class="[
              'flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2',
              activeTab === 'appreciation'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-800 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            赏析
          </button>
          <button
            @click="activeTab = 'keywords'"
            :class="[
              'flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2',
              activeTab === 'keywords'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-white dark:bg-gray-800 dark:text-purple-400'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
            </svg>
            字词
          </button>
        </div>

        <!-- Tab 内容区域 -->
        <div class="p-6 min-h-[300px]">
          <!-- 原文 -->
          <div v-if="activeTab === 'original'">
            <!-- 散文/赋/文言文使用普通文章排版 -->
            <div v-if="result.isProse" class="max-w-none">
              <div v-for="(paragraph, pIndex) in result.originalParagraphs" :key="pIndex" class="mb-4 text-lg leading-loose text-gray-800 dark:text-gray-200 indent-8">
                {{ paragraph }}
              </div>
            </div>
            <!-- 诗词使用字-拼音对齐排版 -->
            <div v-else-if="result.poemLines && result.poemLines.length > 0" class="flex flex-col items-center">
              <div v-for="(line, lineIndex) in result.poemLines" :key="lineIndex" class="flex justify-center mb-4 last:mb-0">
                <div v-for="(char, charIndex) in line.chars" :key="charIndex"
                     class="flex flex-col items-center justify-end"
                     :style="char.isPunctuation ? 'width: 1.5rem; min-width: 1.5rem;' : 'width: 2.5rem; min-width: 2.5rem;'">
                  <div class="text-xs text-gray-500 dark:text-gray-400 mb-1 h-5 flex items-end justify-center w-full overflow-hidden">{{ char.pinyin || '' }}</div>
                  <div class="text-2xl text-gray-800 dark:text-white text-center w-full">{{ char.char }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 译文 -->
          <div v-if="activeTab === 'translation' && result.translation">
            <!-- 散文/长文使用分段显示 -->
            <div v-if="result.isProse && result.translationParagraphs && result.translationParagraphs.length > 1" class="space-y-4">
              <p 
                v-for="(para, index) in result.translationParagraphs" 
                :key="index"
                class="text-gray-700 dark:text-gray-300 leading-relaxed text-lg indent-8"
              >
                {{ para }}
              </p>
            </div>
            <!-- 诗词使用逐句对照显示 -->
            <div v-else-if="result.lineByLineTranslation && result.lineByLineTranslation.length > 0" class="space-y-6">
              <div 
                v-for="(pair, index) in result.lineByLineTranslation" 
                :key="index"
                class="space-y-2"
              >
                <p class="text-gray-500 dark:text-gray-400 text-base">{{ pair.original }}</p>
                <p v-if="pair.translation" class="text-gray-700 dark:text-gray-300 text-lg">{{ pair.translation }}</p>
              </div>
            </div>
            <!-- 默认整体显示 -->
            <p v-else class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-lg">{{ result.translation }}</p>
          </div>

          <!-- 赏析 -->
          <div v-if="activeTab === 'appreciation' && result.appreciation">
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-lg">{{ result.appreciation }}</p>
          </div>

          <!-- 重点字词解释 -->
          <div v-if="activeTab === 'keywords' && result.keywords">
            <div class="space-y-3">
              <div 
                v-for="(item, index) in (() => {
                  const keywords = result.keywords
                  const parts = []
                  // 找到所有包含：的位置
                  const matches = [...keywords.matchAll(/：/g)]
                  for (let i = 0; i < matches.length; i++) {
                    // 当前：的位置
                    const colonPos = matches[i].index
                    // 找到当前词的开始位置
                    let wordStart = 0
                    if (i > 0) {
                      // 从上一个：的位置往后找，找到。之后的位置作为词的开始
                      const prevColonPos = matches[i - 1].index
                      // 在上一个：和当前：之间找最后一个。
                      let lastPeriodBeforeCurrent = prevColonPos
                      for (let j = colonPos - 1; j > prevColonPos; j--) {
                        if (keywords[j] === '。') {
                          lastPeriodBeforeCurrent = j
                          break
                        }
                      }
                      wordStart = lastPeriodBeforeCurrent + 1
                    }
                    const word = keywords.slice(wordStart, colonPos).trim()
                    
                    // 找到解释的结束位置（下一个词的开始位置之前）
                    let explanationEnd = keywords.length
                    if (i < matches.length - 1) {
                      const nextColonPos = matches[i + 1].index
                      // 在当前：和下一个：之间找最后一个。
                      for (let j = nextColonPos - 1; j > colonPos; j--) {
                        if (keywords[j] === '。') {
                          explanationEnd = j
                          break
                        }
                      }
                    }
                    const explanation = keywords.slice(colonPos + 1, explanationEnd).trim()
                    if (word && explanation) {
                      parts.push({ word, explanation })
                    }
                  }
                  return parts
                })()" 
                :key="index"
                class="flex items-start gap-2"
              >
                <span class="text-purple-600 dark:text-purple-400 font-semibold whitespace-nowrap">{{ item.word }}</span>
                <span class="text-gray-400 flex-shrink-0">：</span>
                <span class="text-gray-700 dark:text-gray-300 leading-relaxed">{{ item.explanation }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!result && !loading && !error" class="text-center py-16">
        <svg class="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
        <p class="text-gray-500 dark:text-gray-400 text-lg">输入古诗名称，开始探索古诗词的魅力</p>
        <p class="text-gray-400 dark:text-gray-500 text-sm mt-2">收录227首古诗词，涵盖小学、初中、高中三个学段</p>
      </div>
    </div>
  </div>
</template>
