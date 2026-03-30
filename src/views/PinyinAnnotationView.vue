<script setup>
import { ref, computed } from 'vue'
import { pinyin } from 'pinyin-pro'

const inputText = ref('')
const showResult = ref(false)

const resultHtml = computed(() => {
  if (!inputText.value.trim()) return ''
  
  const chars = inputText.value.split('')
  let html = ''
  
  chars.forEach(char => {
    if (/[\u4e00-\u9fa5]/.test(char)) {
      const py = pinyin(char, { toneType: 'symbol' })
      html += `<span class="pinyin-char"><span class="pinyin-text">${py}</span><span class="hanzi">${char}</span></span>`
    } else if (/\s/.test(char)) {
      html += `<span class="space-char">&nbsp;</span>`
    } else {
      html += `<span class="other-char"><span class="pinyin-text">&nbsp;</span><span class="hanzi">${char}</span></span>`
    }
  })
  
  return html
})

const charCount = computed(() => {
  const chineseChars = inputText.value.match(/[\u4e00-\u9fa5]/g)
  return chineseChars ? chineseChars.length : 0
})

const annotate = () => {
  if (!inputText.value.trim()) {
    alert('请输入中文内容')
    return
  }
  showResult.value = true
}

const clearAll = () => {
  inputText.value = ''
  showResult.value = false
}

const copyResult = async () => {
  if (!resultHtml.value) return
  
  try {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = resultHtml.value
    tempDiv.style.cssText = 'position: absolute; left: -9999px;'
    document.body.appendChild(tempDiv)
    
    const text = tempDiv.innerText || inputText.value
    await navigator.clipboard.writeText(text)
    
    document.body.removeChild(tempDiv)
    alert('已复制到剪贴板')
  } catch (err) {
    alert('复制失败，请手动复制')
  }
}

const copyWithPinyin = async () => {
  if (!resultHtml.value) return
  
  try {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = resultHtml.value
    document.body.appendChild(tempDiv)
    
    let textWithPinyin = ''
    const spans = tempDiv.querySelectorAll('.pinyin-char, .other-char')
    spans.forEach(span => {
      const pinyinText = span.querySelector('.pinyin-text')
      const hanzi = span.querySelector('.hanzi')
      if (pinyinText && hanzi) {
        const py = pinyinText.textContent.trim()
        const hz = hanzi.textContent
        if (py && py !== '\u00A0') {
          textWithPinyin += `${py}${hz} `
        } else {
          textWithPinyin += hz
        }
      }
    })
    
    document.body.removeChild(tempDiv)
    await navigator.clipboard.writeText(textWithPinyin.trim())
    alert('已复制拼音+汉字到剪贴板')
  } catch (err) {
    alert('复制失败，请手动复制')
  }
}

const printResult = () => {
  if (!resultHtml.value) return
  
  let printIframe = document.getElementById('print-iframe')
  if (!printIframe) {
    printIframe = document.createElement('iframe')
    printIframe.id = 'print-iframe'
    printIframe.style.cssText = 'position: absolute; width: 0; height: 0; border: none; left: -9999px;'
    document.body.appendChild(printIframe)
  }
  
  const doc = printIframe.contentDocument || printIframe.contentWindow.document
  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>拼音标注结果</title>
      <style>
        body {
          font-family: 'Microsoft YaHei', 'SimHei', sans-serif;
          padding: 40px;
          line-height: 2.5;
          font-size: 18px;
        }
        .pinyin-char, .other-char {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          margin: 0 2px;
        }
        .pinyin-text {
          font-size: 12px;
          color: #666;
          line-height: 1;
          height: 14px;
        }
        .hanzi {
          font-size: 20px;
          color: #333;
          line-height: 1.2;
        }
        .space-char {
          display: inline-block;
          width: 8px;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      ${resultHtml.value}
    </body>
    </html>
  `)
  doc.close()
  
  printIframe.contentWindow.focus()
  printIframe.contentWindow.print()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">拼音标注工具</h1>
        <p class="text-gray-600 dark:text-gray-400">输入中文文本，自动为所有汉字标注拼音</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">输入文本</h2>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            汉字数：{{ charCount }}
          </span>
        </div>
        
        <textarea
          v-model="inputText"
          class="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="请输入中文文本，例如：床前明月光，疑是地上霜。"
        ></textarea>
        
        <div class="flex gap-3 mt-4">
          <button
            @click="annotate"
            class="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            标注拼音
          </button>
          <button
            @click="clearAll"
            class="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
          >
            清空
          </button>
        </div>
      </div>

      <div v-if="showResult && resultHtml" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">标注结果</h2>
          <div class="flex gap-2">
            <button
              @click="copyResult"
              class="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              复制汉字
            </button>
            <button
              @click="copyWithPinyin"
              class="px-4 py-2 text-sm bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-lg transition-colors"
            >
              复制拼音+汉字
            </button>
            <button
              @click="printResult"
              class="px-4 py-2 text-sm bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg transition-colors"
            >
              打印
            </button>
          </div>
        </div>
        
        <div class="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-x-auto">
          <div class="result-content" v-html="resultHtml"></div>
        </div>
        
        <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">使用说明</h3>
          <ul class="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• 拼音标注符合现代汉语拼音规范，包含正确的声调标识</li>
            <li>• 支持长文本处理，可输入段落或多篇文本</li>
            <li>• 点击"复制汉字"可复制原文，点击"复制拼音+汉字"可复制带拼音的格式</li>
            <li>• 点击"打印"可打印标注结果</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-content {
  line-height: 2.5;
  font-size: 18px;
}

.result-content :deep(.pinyin-char),
.result-content :deep(.other-char) {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin: 0 2px;
}

.result-content :deep(.pinyin-text) {
  font-size: 12px;
  color: #666;
  line-height: 1;
  height: 14px;
}

.result-content :deep(.hanzi) {
  font-size: 20px;
  color: #333;
  line-height: 1.2;
}

.dark .result-content :deep(.pinyin-text) {
  color: #aaa;
}

.dark .result-content :deep(.hanzi) {
  color: #eee;
}

.result-content :deep(.space-char) {
  display: inline-block;
  width: 8px;
}
</style>
