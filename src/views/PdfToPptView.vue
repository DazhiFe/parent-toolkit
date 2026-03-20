<script setup>
import { ref } from 'vue'
import PptxGenJS from 'pptxgenjs'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const pdfFile = ref(null)
const pdfPages = ref([])
const isConverting = ref(false)
const progress = ref(0)
const slideLayout = ref('actual')
const showSuccess = ref(false)

const layouts = [
  { value: 'fit', label: '适应页面' },
  { value: 'fill', label: '填充页面' },
  { value: 'actual', label: '实际大小' }
]

const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file || file.type !== 'application/pdf') {
    alert('请选择有效的PDF文件')
    return
  }

  pdfFile.value = file
  pdfPages.value = []
  progress.value = 0

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1 })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const scale = 2
    canvas.width = viewport.width * scale
    canvas.height = viewport.height * scale

    await page.render({
      canvasContext: context,
      viewport: page.getViewport({ scale })
    }).promise

    pdfPages.value.push({
      pageNum: i,
      image: canvas.toDataURL('image/png'),
      width: viewport.width,
      height: viewport.height
    })

    progress.value = Math.round((i / pdf.numPages) * 100)
  }
}

const clearFile = () => {
  pdfFile.value = null
  pdfPages.value = []
  progress.value = 0
}

const convertToPpt = async () => {
  if (pdfPages.value.length === 0) return

  isConverting.value = true

  try {
    const pptx = new PptxGenJS()
    pptx.layout = 'LAYOUT_16x9'
    pptx.title = pdfFile.value?.name?.replace('.pdf', '') || 'PDF转PPT'

    for (const page of pdfPages.value) {
      const slide = pptx.addSlide()

      if (slideLayout.value === 'fit') {
        slide.addImage({
          data: page.image,
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
          sizing: { type: 'contain', w: '100%', h: '100%' }
        })
      } else if (slideLayout.value === 'fill') {
        slide.addImage({
          data: page.image,
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
          sizing: { type: 'cover', w: '100%', h: '100%' }
        })
      } else {
        const slideWidth = 10
        const slideHeight = 5.625
        const imgRatio = page.width / page.height
        const slideRatio = slideWidth / slideHeight

        let w, h, x, y
        if (imgRatio > slideRatio) {
          w = slideWidth
          h = slideWidth / imgRatio
        } else {
          h = slideHeight
          w = slideHeight * imgRatio
        }
        x = (slideWidth - w) / 2
        y = (slideHeight - h) / 2

        slide.addImage({
          data: page.image,
          x: x,
          y: y,
          w: w,
          h: h
        })
      }
    }

    await pptx.writeFile({ fileName: `${pdfFile.value?.name?.replace('.pdf', '') || 'output'}.pptx` })
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('PPT生成失败:', error)
    alert('PPT生成失败，请重试')
  } finally {
    isConverting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">PDF转PPT</h1>
        <p class="text-gray-600 dark:text-gray-400">将PDF文件的每一页转换为PPT幻灯片</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">转换设置</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">幻灯片布局</label>
            <select v-model="slideLayout"
                    class="w-full h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
              <option v-for="layout in layouts" :key="layout.value" :value="layout.value">{{ layout.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">输出格式</label>
            <div class="h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white flex items-center">
              PPTX (PowerPoint 2007+)
            </div>
          </div>
        </div>
      </div>

      <!-- 成功提示 -->
      <div v-if="showSuccess"
           class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        PPT生成成功！
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">上传PDF文件</h2>
          <button v-if="pdfFile" @click="clearFile"
                  class="text-sm text-red-600 hover:text-red-700 dark:text-red-400">
            清除文件
          </button>
        </div>

        <div v-if="!pdfFile" class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
          <input type="file" accept="application/pdf" @change="handleFileSelect"
                 class="hidden" id="pdfInput">
          <label for="pdfInput" class="cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-600 dark:text-gray-400">点击选择PDF文件</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">支持 PDF 格式</p>
          </label>
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div class="flex-1">
              <p class="font-medium text-gray-800 dark:text-white">{{ pdfFile.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ (pdfFile.size / 1024 / 1024).toFixed(2) }} MB</p>
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ pdfPages.length }} 页</span>
          </div>

          <div v-if="progress < 100" class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="bg-indigo-600 h-2 rounded-full transition-all duration-300" :style="{ width: `${progress}%` }"></div>
          </div>
          <p v-if="progress < 100" class="text-sm text-gray-500 dark:text-gray-400 text-center">正在解析PDF... {{ progress }}%</p>

          <div v-if="pdfPages.length > 0 && progress === 100" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-4">
            <div v-for="page in pdfPages" :key="page.pageNum"
                 class="aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded overflow-hidden relative group">
              <img :src="page.image" :alt="`第${page.pageNum}页`"
                   class="w-full h-full object-cover">
              <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 text-center">
                {{ page.pageNum }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center">
        <button @click="convertToPpt"
                :disabled="pdfPages.length === 0 || isConverting || progress < 100"
                :class="[
                  'px-8 py-3 font-medium rounded-lg transition-colors',
                  pdfPages.length > 0 && !isConverting && progress === 100
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]">
          <span v-if="isConverting">转换中...</span>
          <span v-else>生成PPT ({{ pdfPages.length }}页)</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
