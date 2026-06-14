<script setup>
import { ref, computed, onMounted, nextTick, watch, onBeforeUnmount } from 'vue'
import { pinyin } from 'pinyin-pro'
import HanziWriter from 'hanzi-writer'

// ─── 数据加载 ───
const grades = ref([])
const dataLoading = ref(true)
const dataError = ref('')

onMounted(async () => {
  try {
    const res = await fetch('/data/characters.json')
    if (!res.ok) throw new Error('加载失败')
    const data = await res.json()
    grades.value = data.grades
  } catch (e) {
    dataError.value = '生字数据加载失败，请刷新页面重试'
  } finally {
    dataLoading.value = false
  }
})

// ─── 选择状态 ───
const selectedGradeId = ref('')
const selectedLessonId = ref('')
const customChars = ref('')
const inputMode = ref('grade')

const selectedGrade = computed(() => grades.value.find(g => g.id === selectedGradeId.value))
const lessons = computed(() => selectedGrade.value?.lessons || [])
const selectedLesson = computed(() => lessons.value.find(l => l.id === selectedLessonId.value))

// 当前要练习的生字列表
const practiceChars = computed(() => {
  if (inputMode.value === 'custom') {
    const text = customChars.value.replace(/[^\u4e00-\u9fa5]/g, '')
    return [...new Set([...text])]
  }
  return selectedLesson.value?.chars || []
})

// ─── 字帖设置 ───
const gridType = ref('tian')
const repeatCount = ref(8)
const showPinyin = ref(true)
const showStrokeOrder = ref(true)
const guideStyle = ref('outline')
const paperDirection = ref('portrait')

const gridTypeOptions = [
  { value: 'tian', label: '田字格' },
  { value: 'mi', label: '米字格' },
  { value: 'jiu', label: '九宫格' }
]

const guideStyleOptions = [
  { value: 'outline', label: '描红（首格浅色底字）' },
  { value: 'dot', label: '点阵（虚线描摹）' },
  { value: 'half', label: '半描红（前半描红后半空白）' },
  { value: 'none', label: '空白格' }
]

// ─── 预览 ───
const showResult = ref(false)

const getCharPinyin = (char) => {
  try { return pinyin(char, { toneType: 'symbol', type: 'string' }) } catch { return '' }
}

const generateSheet = () => {
  if (!practiceChars.value.length) {
    alert('请先选择课文或输入生字')
    return
  }
  showResult.value = true
}

const clearAll = () => {
  customChars.value = ''
  showResult.value = false
}

// ─── 笔顺动画 ───
const strokeAnimChar = ref('')
const strokeAnimTarget = ref(null)
let writerInstance = null

const showStrokeAnim = async (char) => {
  strokeAnimChar.value = char
  await nextTick()
  const target = document.getElementById('stroke-anim-target')
  if (!target) return
  target.innerHTML = ''

  try {
    writerInstance = HanziWriter.create(target, char, {
      width: 200,
      height: 200,
      padding: 10,
      showOutline: true,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 200,
      strokeColor: '#333333',
      outlineColor: '#ddd',
      drawingColor: '#e11d48',
      radicalColor: '#168F16',
      charDataLoader: (char, onComplete) => {
        fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${char}.json`)
          .then(res => { if (!res.ok) throw new Error(); return res.json() })
          .then(data => onComplete(data))
          .catch(() => {
            target.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:80px;color:#ccc;font-family:KaiTi,STKaiti,serif;">${char}</div>`
          })
      }
    })
  } catch {
    target.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:80px;color:#ccc;font-family:KaiTi,STKaiti,serif;">${char}</div>`
  }
}

const animateStroke = () => {
  if (writerInstance) writerInstance.animateCharacter()
}

const quizStroke = () => {
  if (writerInstance) writerInstance.quiz({
    onComplete: (summary) => {
      if (summary.totalMistakes === 0) {
        alert('太棒了！笔顺完全正确！')
      }
    }
  })
}

onBeforeUnmount(() => {
  writerInstance = null
})

const shouldShowGuide = (index) => {
  if (guideStyle.value === 'none') return false
  if (guideStyle.value === 'outline' && index === 1) return true
  if (guideStyle.value === 'dot') return true
  if (guideStyle.value === 'half' && index <= Math.ceil(repeatCount.value / 2)) return true
  return false
}

// ─── 打印 ───
const printSheet = () => {
  const el = document.getElementById('sheet-content')
  if (!el) return

  let printIframe = document.getElementById('print-iframe')
  if (printIframe) document.body.removeChild(printIframe)

  const iframe = document.createElement('iframe')
  iframe.id = 'print-iframe'
  iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;left:-9999px;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow.document
  const dir = paperDirection.value === 'landscape' ? 'landscape' : 'portrait'

  doc.open()
  doc.write(`<!DOCTYPE html><html><head><title>生字字帖</title>
<style>
@page { size: A4 ${dir}; margin: 12mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'KaiTi','STKaiti','FangSong','STFangsong','SimSun',serif; }
.sheet-title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #333; }
.sheet-info { text-align: center; font-size: 11px; color: #999; margin-bottom: 14px; display: flex; justify-content: center; gap: 40px; }
.char-section { margin-bottom: 16px; page-break-inside: avoid; }
.char-header { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; }
.char-pinyin { font-size: 14px; color: #e11d48; font-weight: 500; }
.char-label { font-size: 13px; color: #666; }
.char-stroke-hint { font-size: 10px; color: #aaa; margin-left: 8px; }
.grid-row { display: flex; gap: 3px; flex-wrap: wrap; }
.grid-cell { width: 68px; height: 68px; position: relative; border: 1px solid #bbb; flex-shrink: 0; }
.grid-cell .guide-char { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 48px; font-family: 'KaiTi','STKaiti','FangSong','STFangsong','SimSun',serif; line-height: 1; }
.guide-outline { color: rgba(220, 38, 38, 0.15); }
.guide-dot { color: rgba(220, 38, 38, 0.22); -webkit-text-fill-color: transparent; -webkit-text-stroke: 0.6px rgba(220, 38, 38, 0.25); }
.tian-h { position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #d4d4d4; }
.tian-v { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: #d4d4d4; }
.mi-d1, .mi-d2 { position: absolute; background: #d4d4d4; height: 1px; width: 141%; top: 50%; left: 50%; }
.mi-d1 { transform: translate(-50%, -50%) rotate(45deg); }
.mi-d2 { transform: translate(-50%, -50%) rotate(-45deg); }
.jiu-h1 { position: absolute; top: 33.33%; left: 0; right: 0; height: 1px; background: #d4d4d4; }
.jiu-h2 { position: absolute; top: 66.66%; left: 0; right: 0; height: 1px; background: #d4d4d4; }
.jiu-v1 { position: absolute; left: 33.33%; top: 0; bottom: 0; width: 1px; background: #d4d4d4; }
.jiu-v2 { position: absolute; left: 66.66%; top: 0; bottom: 0; width: 1px; background: #d4d4d4; }
</style></head><body>
<div class="sheet-title">生字练习字帖</div>
<div class="sheet-info"><span>姓名：________</span><span>日期：________</span><span>评价：☆☆☆</span></div>
${practiceChars.value.map(char => {
  const py = showPinyin.value ? getCharPinyin(char) : ''
  const guideClass = guideStyle.value === 'outline' ? 'guide-outline' : guideStyle.value === 'dot' ? 'guide-dot' : ''
  const grid = gridType.value
  let gridLines = ''
  if (grid === 'tian') gridLines = '<div class="tian-h"></div><div class="tian-v"></div>'
  else if (grid === 'mi') gridLines = '<div class="tian-h"></div><div class="tian-v"></div><div class="mi-d1"></div><div class="mi-d2"></div>'
  else if (grid === 'jiu') gridLines = '<div class="jiu-h1"></div><div class="jiu-h2"></div><div class="jiu-v1"></div><div class="jiu-v2"></div>'

  const halfCount = guideStyle.value === 'half' ? Math.ceil(repeatCount.value / 2) : 0
  const cells = []
  for (let i = 0; i < repeatCount.value; i++) {
    let showGuide = false
    if (guideStyle.value === 'outline' && i === 0) showGuide = true
    if (guideStyle.value === 'dot') showGuide = true
    if (guideStyle.value === 'half' && i < halfCount) showGuide = true
    cells.push(`<div class="grid-cell">${gridLines}${showGuide ? `<div class="guide-char ${guideClass}">${char}</div>` : ''}</div>`)
  }
  return `<div class="char-section">
    <div class="char-header">
      ${py ? `<span class="char-pinyin">${py}</span>` : ''}
      <span class="char-label">${char}</span>
    </div>
    <div class="grid-row">${cells.join('')}</div>
  </div>`
}).join('')}
</body></html>`)
  doc.close()

  nextTick(() => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
  })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <!-- 标题 -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">生字字帖生成器</h1>
        <p class="text-gray-600 dark:text-gray-400">按年级课文选择或自由输入，生成田字格字帖，支持笔顺动画</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="dataLoading" class="text-center py-20 text-gray-500 dark:text-gray-400">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mb-3"></div>
        <p>正在加载生字数据…</p>
      </div>
      <div v-else-if="dataError" class="text-center py-20 text-red-500">{{ dataError }}</div>

      <template v-else>
        <!-- 选择模式 -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div class="flex gap-2 mb-5">
            <button @click="inputMode = 'grade'"
              :class="['px-5 py-2 rounded-lg font-medium transition-colors', inputMode === 'grade' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300']">
              按年级选择
            </button>
            <button @click="inputMode = 'custom'"
              :class="['px-5 py-2 rounded-lg font-medium transition-colors', inputMode === 'custom' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300']">
              自由输入
            </button>
          </div>

          <!-- 按年级选择 -->
          <div v-if="inputMode === 'grade'" class="space-y-4">
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button v-for="g in grades" :key="g.id" @click="selectedGradeId = g.id; selectedLessonId = ''"
                :class="['px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
                  selectedGradeId === g.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary-300']">
                {{ g.name }}
              </button>
            </div>

            <div v-if="lessons.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <button v-for="l in lessons" :key="l.id" @click="selectedLessonId = l.id"
                :class="['px-3 py-2 rounded-lg text-sm transition-colors border',
                  selectedLessonId === l.id
                    ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-amber-300']">
                {{ l.name }}
              </button>
            </div>

            <div v-if="practiceChars.length" class="flex flex-wrap gap-2 pt-2">
              <span v-for="c in practiceChars" :key="c"
                class="inline-flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg text-lg font-medium text-gray-800 dark:text-gray-200">
                {{ c }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400 self-center ml-2">共 {{ practiceChars.length }} 字</span>
            </div>
          </div>

          <!-- 自由输入 -->
          <div v-else>
            <textarea
              v-model="customChars"
              class="w-full h-24 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xl tracking-widest"
              placeholder="请输入要练习的汉字，例如：天地人和春夏秋冬"
            ></textarea>
            <p v-if="practiceChars.length" class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              已识别 {{ practiceChars.length }} 个不重复汉字：{{ practiceChars.join(' ') }}
            </p>
          </div>
        </div>

        <!-- 字帖设置 -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">字帖设置</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">格子类型</label>
              <select v-model="gridType"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500">
                <option v-for="opt in gridTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">引导方式</label>
              <select v-model="guideStyle"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500">
                <option v-for="opt in guideStyleOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">每字重复次数</label>
              <select v-model.number="repeatCount"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500">
                <option :value="4">4 次</option>
                <option :value="6">6 次</option>
                <option :value="8">8 次</option>
                <option :value="10">10 次</option>
                <option :value="12">12 次</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">纸张方向</label>
              <select v-model="paperDirection"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500">
                <option value="portrait">纵向（A4）</option>
                <option value="landscape">横向（A4）</option>
              </select>
            </div>
            <div class="flex items-center gap-6 pt-6">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="showPinyin" class="w-4 h-4 text-primary-600 rounded" />
                <span class="text-sm text-gray-700 dark:text-gray-300">显示拼音</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="showStrokeOrder" class="w-4 h-4 text-primary-600 rounded" />
                <span class="text-sm text-gray-700 dark:text-gray-300">笔顺演示</span>
              </label>
            </div>
          </div>

          <div class="flex gap-3 mt-5">
            <button @click="generateSheet"
              class="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">
              生成字帖
            </button>
            <button @click="clearAll"
              class="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors">
              清空
            </button>
          </div>
        </div>

        <!-- 字帖预览 + 笔顺演示 -->
        <div v-if="showResult && practiceChars.length" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- 笔顺演示区 -->
          <div v-if="showStrokeOrder" class="lg:col-span-1">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24">
              <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">笔顺演示</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">点击生字查看笔顺动画</p>

              <!-- 生字选择 -->
              <div class="flex flex-wrap gap-2 mb-4 max-h-40 overflow-y-auto">
                <button v-for="c in practiceChars" :key="c" @click="showStrokeAnim(c)"
                  :class="['w-10 h-10 rounded-lg text-lg font-medium transition-all border',
                    strokeAnimChar === c
                      ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-400 text-primary-700 dark:text-primary-300 scale-110'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-300']">
                  {{ c }}
                </button>
              </div>

              <!-- 动画区域 -->
              <div v-if="strokeAnimChar" class="flex flex-col items-center">
                <div class="bg-white rounded-xl border-2 border-gray-200 p-2 mb-3">
                  <div id="stroke-anim-target"></div>
                </div>
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-2xl font-bold text-gray-800 dark:text-white">{{ strokeAnimChar }}</span>
                  <span class="text-sm text-rose-500">{{ getCharPinyin(strokeAnimChar) }}</span>
                </div>
                <div class="flex gap-2">
                  <button @click="animateStroke"
                    class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
                    播放笔顺
                  </button>
                  <button @click="quizStroke"
                    class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors">
                    笔顺测验
                  </button>
                </div>
              </div>
              <div v-else class="text-center py-10 text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                <p class="text-sm">点击上方生字开始</p>
              </div>
            </div>
          </div>

          <!-- 字帖内容 -->
          <div :class="[showStrokeOrder ? 'lg:col-span-2' : 'lg:col-span-3']">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-gray-800 dark:text-white">字帖预览</h2>
                <button @click="printSheet"
                  class="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  打印字帖
                </button>
              </div>

              <div id="sheet-content" class="p-6 bg-white rounded-lg border border-gray-200">
                <!-- 标题栏 -->
                <div class="text-center mb-5">
                  <div class="text-xl font-bold text-gray-800">生字练习字帖</div>
                  <div class="flex justify-center gap-8 mt-2 text-xs text-gray-400">
                    <span>姓名：________</span>
                    <span>日期：________</span>
                    <span>评价：☆☆☆</span>
                  </div>
                </div>

                <!-- 每个字的练习区 -->
                <div v-for="(char, idx) in practiceChars" :key="idx" class="char-section mb-6">
                  <div class="flex items-baseline gap-2 mb-1">
                    <span v-if="showPinyin" class="text-base text-rose-500 font-medium">{{ getCharPinyin(char) }}</span>
                    <span class="text-sm text-gray-500">{{ char }}</span>
                    <button v-if="showStrokeOrder" @click="showStrokeAnim(char)"
                      class="text-xs text-primary-500 hover:text-primary-700 ml-2">看笔顺</button>
                  </div>
                  <div class="flex gap-1 flex-wrap">
                    <div v-for="i in repeatCount" :key="i" class="grid-cell" :class="gridType">
                      <!-- 田字格 -->
                      <template v-if="gridType === 'tian'">
                        <div class="tian-h"></div><div class="tian-v"></div>
                      </template>
                      <!-- 米字格 -->
                      <template v-else-if="gridType === 'mi'">
                        <div class="tian-h"></div><div class="tian-v"></div>
                        <div class="mi-d1"></div><div class="mi-d2"></div>
                      </template>
                      <!-- 九宫格 -->
                      <template v-else-if="gridType === 'jiu'">
                        <div class="jiu-h1"></div><div class="jiu-h2"></div>
                        <div class="jiu-v1"></div><div class="jiu-v2"></div>
                      </template>
                      <!-- 引导字 -->
                      <span v-if="shouldShowGuide(i)" class="guide-char" :class="guideStyle === 'dot' ? 'guide-dot' : 'guide-outline'">{{ char }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 使用说明 -->
              <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">使用说明</h3>
                <ul class="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• 支持按年级/课文选择生字，也可自由输入</li>
                  <li>• 点击"看笔顺"可查看该字的笔顺动画演示</li>
                  <li>• 笔顺测验模式：按正确笔顺在格子里书写</li>
                  <li>• 描红模式：首格显示浅色底字，后续空白供书写</li>
                  <li>• 点阵模式：所有格显示虚线描摹字，适合初学</li>
                  <li>• 半描红：前半描红，后半空白，循序渐进</li>
                  <li>• 点击"打印字帖"可直接打印，建议选择A4纸张</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.char-section {
  page-break-inside: avoid;
}

.grid-cell {
  width: 72px;
  height: 72px;
  position: relative;
  border: 1px solid #bbb;
  flex-shrink: 0;
}

.grid-cell .tian-h, .grid-cell .tian-v { position: absolute; background: #d4d4d4; }
.tian-h { top: 50%; left: 0; right: 0; height: 1px; transform: translateY(-0.5px); }
.tian-v { left: 50%; top: 0; bottom: 0; width: 1px; transform: translateX(-0.5px); }

.grid-cell .mi-d1, .grid-cell .mi-d2 { position: absolute; background: #d4d4d4; height: 1px; width: 141%; top: 50%; left: 50%; }
.mi-d1 { transform: translate(-50%, -50%) rotate(45deg); }
.mi-d2 { transform: translate(-50%, -50%) rotate(-45deg); }

.grid-cell .jiu-h1, .grid-cell .jiu-h2, .grid-cell .jiu-v1, .grid-cell .jiu-v2 { position: absolute; background: #d4d4d4; }
.jiu-h1 { top: 33.33%; left: 0; right: 0; height: 1px; }
.jiu-h2 { top: 66.66%; left: 0; right: 0; height: 1px; }
.jiu-v1 { left: 33.33%; top: 0; bottom: 0; width: 1px; }
.jiu-v2 { left: 66.66%; top: 0; bottom: 0; width: 1px; }

.guide-char {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 52px;
  font-family: 'KaiTi', 'STKaiti', 'FangSong', 'STFangsong', 'SimSun', serif;
  line-height: 1; user-select: none;
}

.guide-outline { color: rgba(220, 38, 38, 0.15); }

.guide-dot {
  color: rgba(220, 38, 38, 0.22);
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 0.6px rgba(220, 38, 38, 0.25);
}
</style>
