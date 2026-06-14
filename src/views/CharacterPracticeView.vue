<script setup>
import { ref, computed, nextTick } from 'vue'
import { pinyin } from 'pinyin-pro'

const inputChars = ref('')
const repeatCount = ref(8)
const showGuideChar = ref(true)
const guideStyle = ref('outline')
const showPinyin = ref(true)
const gridType = ref('tian')
const paperDirection = ref('portrait')
const showResult = ref(false)

const gridTypeOptions = [
  { value: 'tian', label: '田字格' },
  { value: 'mi', label: '米字格' },
  { value: 'jiu', label: '九宫格' }
]

const guideStyleOptions = [
  { value: 'outline', label: '描红（浅色底字）' },
  { value: 'dot', label: '点阵（虚线点字）' },
  { value: 'none', label: '空白格' }
]

const chars = computed(() => {
  const text = inputChars.value.replace(/[^\u4e00-\u9fa5]/g, '')
  return [...new Set([...text])]
})

const charCount = computed(() => chars.value.length)

const generateSheet = () => {
  if (!chars.value.length) {
    alert('请输入至少一个汉字')
    return
  }
  showResult.value = true
}

const clearAll = () => {
  inputChars.value = ''
  showResult.value = false
}

const getCharPinyin = (char) => {
  try {
    return pinyin(char, { toneType: 'symbol', type: 'string' })
  } catch {
    return ''
  }
}

const printSheet = () => {
  const el = document.getElementById('sheet-content')
  if (!el) return

  const printIframe = document.getElementById('print-iframe')
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
      @page { size: A4 ${dir}; margin: 15mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'KaiTi','STKaiti','FangSong','STFangsong','SimSun',serif; }
      .sheet-title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 12px; color: #333; }
      .sheet-subtitle { text-align: center; font-size: 12px; color: #999; margin-bottom: 16px; }
      .char-section { margin-bottom: 20px; page-break-inside: avoid; }
      .char-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
      .char-pinyin { font-size: 16px; color: #e11d48; font-weight: 500; }
      .char-label { font-size: 14px; color: #666; }
      .grid-row { display: flex; gap: 4px; flex-wrap: wrap; }
      .grid-cell {
        width: 72px; height: 72px; position: relative;
        border: 1px solid #bbb; flex-shrink: 0;
      }
      .grid-cell .guide-char {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        font-size: 52px; font-family: 'KaiTi','STKaiti','FangSong','STFangsong','SimSun',serif;
        line-height: 1;
      }
      .guide-outline { color: rgba(220, 38, 38, 0.18); }
      .guide-dot {
        color: rgba(220, 38, 38, 0.25);
        -webkit-text-fill-color: transparent;
        -webkit-text-stroke: 0.8px rgba(220, 38, 38, 0.3);
        text-shadow: 0 0 1px rgba(220, 38, 38, 0.2);
      }
      .grid-cell .tian-h, .grid-cell .tian-v {
        position: absolute; background: #d4d4d4;
      }
      .tian-h { top: 50%; left: 0; right: 0; height: 1px; transform: translateY(-0.5px); }
      .tian-v { left: 50%; top: 0; bottom: 0; width: 1px; transform: translateX(-0.5px); }
      .grid-cell .mi-d1, .grid-cell .mi-d2 {
        position: absolute; background: #d4d4d4; height: 1px; width: 141%;
        top: 50%; left: 50%;
      }
      .mi-d1 { transform: translate(-50%, -50%) rotate(45deg); }
      .mi-d2 { transform: translate(-50%, -50%) rotate(-45deg); }
      .grid-cell .jiu-h1, .grid-cell .jiu-h2, .grid-cell .jiu-v1, .grid-cell .jiu-v2 {
        position: absolute; background: #d4d4d4;
      }
      .jiu-h1 { top: 33.33%; left: 0; right: 0; height: 1px; }
      .jiu-h2 { top: 66.66%; left: 0; right: 0; height: 1px; }
      .jiu-v1 { left: 33.33%; top: 0; bottom: 0; width: 1px; }
      .jiu-v2 { left: 66.66%; top: 0; bottom: 0; width: 1px; }
      .stroke-hint {
        position: absolute; bottom: 2px; right: 3px;
        font-size: 9px; color: #aaa;
      }
    </style></head><body>
    <div class="sheet-title">生字练习字帖</div>
    <div class="sheet-subtitle">姓名：________　　日期：________</div>
    ${chars.value.map(char => {
      const py = showPinyin.value ? getCharPinyin(char) : ''
      const guideClass = guideStyle.value === 'outline' ? 'guide-outline' : guideStyle.value === 'dot' ? 'guide-dot' : ''
      const showGuide = showGuideChar.value && guideStyle.value !== 'none'
      const grid = gridType.value
      let gridLines = ''
      if (grid === 'tian') gridLines = '<div class="tian-h"></div><div class="tian-v"></div>'
      else if (grid === 'mi') gridLines = '<div class="tian-h"></div><div class="tian-v"></div><div class="mi-d1"></div><div class="mi-d2"></div>'
      else if (grid === 'jiu') gridLines = '<div class="jiu-h1"></div><div class="jiu-h2"></div><div class="jiu-v1"></div><div class="jiu-v2"></div>'

      const cells = []
      for (let i = 0; i < repeatCount.value; i++) {
        const isFirst = i === 0
        const showThisGuide = showGuide && (isFirst || guideStyle.value !== 'outline')
        cells.push(`<div class="grid-cell">${gridLines}${showThisGuide ? `<div class="guide-char ${guideClass}">${char}</div>` : ''}</div>`)
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
    <div class="max-w-4xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">生字字帖生成器</h1>
        <p class="text-gray-600 dark:text-gray-400">输入生字，自动生成可打印的田字格/米字格字帖</p>
      </div>

      <!-- 输入区 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">输入生字</h2>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            已输入 {{ charCount }} 个不重复汉字
          </span>
        </div>

        <textarea
          v-model="inputChars"
          class="w-full h-28 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xl tracking-widest"
          placeholder="请输入要练习的汉字，例如：天地人和春夏秋冬"
        ></textarea>

        <!-- 设置区 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">纸张方向</label>
            <select v-model="paperDirection"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500">
              <option value="portrait">纵向（A4）</option>
              <option value="landscape">横向（A4）</option>
            </select>
          </div>
          <div class="flex items-center gap-4 pt-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="showGuideChar" class="w-4 h-4 text-primary-600 rounded" />
              <span class="text-sm text-gray-700 dark:text-gray-300">显示引导字</span>
            </label>
          </div>
          <div class="flex items-center gap-4 pt-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="showPinyin" class="w-4 h-4 text-primary-600 rounded" />
              <span class="text-sm text-gray-700 dark:text-gray-300">显示拼音</span>
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

      <!-- 预览区 -->
      <div v-if="showResult && chars.length" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">字帖预览</h2>
          <button @click="printSheet"
            class="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            打印字帖
          </button>
        </div>

        <div id="sheet-content" class="p-6 bg-white rounded-lg border border-gray-200">
          <div class="text-center mb-4">
            <div class="text-xl font-bold text-gray-800">生字练习字帖</div>
            <div class="text-xs text-gray-400 mt-1">姓名：________　　日期：________</div>
          </div>

          <div v-for="(char, idx) in chars" :key="idx" class="char-section mb-5">
            <div class="flex items-baseline gap-2 mb-1">
              <span v-if="showPinyin" class="text-base text-rose-500 font-medium">{{ getCharPinyin(char) }}</span>
              <span class="text-sm text-gray-500">{{ char }}</span>
            </div>
            <div class="flex gap-1 flex-wrap">
              <div v-for="i in repeatCount" :key="i" class="grid-cell"
                :class="gridType">
                <!-- 田字格辅助线 -->
                <template v-if="gridType === 'tian'">
                  <div class="tian-h"></div>
                  <div class="tian-v"></div>
                </template>
                <!-- 米字格辅助线 -->
                <template v-else-if="gridType === 'mi'">
                  <div class="tian-h"></div>
                  <div class="tian-v"></div>
                  <div class="mi-d1"></div>
                  <div class="mi-d2"></div>
                </template>
                <!-- 九宫格辅助线 -->
                <template v-else-if="gridType === 'jiu'">
                  <div class="jiu-h1"></div>
                  <div class="jiu-h2"></div>
                  <div class="jiu-v1"></div>
                  <div class="jiu-v2"></div>
                </template>
                <!-- 引导字 -->
                <span v-if="showGuideChar && guideStyle !== 'none' && (i === 1 || guideStyle !== 'outline')"
                  class="guide-char"
                  :class="guideStyle === 'outline' ? 'guide-outline' : 'guide-dot'"
                >{{ char }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">使用说明</h3>
          <ul class="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• 输入要练习的汉字，自动去重，仅保留汉字字符</li>
            <li>• 支持田字格、米字格、九宫格三种格式</li>
            <li>• 描红模式：第一个格显示浅色底字，后续空白供书写</li>
            <li>• 点阵模式：所有格显示虚线点字，适合初学描摹</li>
            <li>• 点击"打印字帖"可直接打印，建议选择A4纸张</li>
          </ul>
        </div>
      </div>
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

.grid-cell .tian-h,
.grid-cell .tian-v {
  position: absolute;
  background: #d4d4d4;
}
.tian-h { top: 50%; left: 0; right: 0; height: 1px; transform: translateY(-0.5px); }
.tian-v { left: 50%; top: 0; bottom: 0; width: 1px; transform: translateX(-0.5px); }

.grid-cell .mi-d1,
.grid-cell .mi-d2 {
  position: absolute;
  background: #d4d4d4;
  height: 1px;
  width: 141%;
  top: 50%;
  left: 50%;
}
.mi-d1 { transform: translate(-50%, -50%) rotate(45deg); }
.mi-d2 { transform: translate(-50%, -50%) rotate(-45deg); }

.grid-cell .jiu-h1,
.grid-cell .jiu-h2,
.grid-cell .jiu-v1,
.grid-cell .jiu-v2 {
  position: absolute;
  background: #d4d4d4;
}
.jiu-h1 { top: 33.33%; left: 0; right: 0; height: 1px; }
.jiu-h2 { top: 66.66%; left: 0; right: 0; height: 1px; }
.jiu-v1 { left: 33.33%; top: 0; bottom: 0; width: 1px; }
.jiu-v2 { left: 66.66%; top: 0; bottom: 0; width: 1px; }

.guide-char {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52px;
  font-family: 'KaiTi', 'STKaiti', 'FangSong', 'STFangsong', 'SimSun', serif;
  line-height: 1;
  user-select: none;
}

.guide-outline {
  color: rgba(220, 38, 38, 0.18);
}

.guide-dot {
  color: rgba(220, 38, 38, 0.25);
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 0.8px rgba(220, 38, 38, 0.3);
  text-shadow: 0 0 1px rgba(220, 38, 38, 0.2);
}
</style>
