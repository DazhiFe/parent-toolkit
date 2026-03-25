<script setup>
import { ref } from 'vue'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { Document, Packer, Paragraph, ImageRun, convertInchesToTwip } from 'docx'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const pdfFile = ref(null)
const isConverting = ref(false)
const progress = ref(0)
const showSuccess = ref(false)
const pagePreviews = ref([])

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.name.endsWith('.pdf')) {
    alert('请选择有效的PDF文件')
    return
  }

  pdfFile.value = file
  pagePreviews.value = []
}

const clearFile = () => {
  pdfFile.value = null
  pagePreviews.value = []
  progress.value = 0
}

const convertToWord = async () => {
  if (!pdfFile.value) {
    alert('请先上传PDF文件')
    return
  }

  isConverting.value = true
  progress.value = 0
  pagePreviews.value = []

  try {
    const arrayBuffer = await pdfFile.value.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    
    const totalPages = pdf.numPages
    const pageImages = []

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i)
      const scale = 2
      const viewport = page.getViewport({ scale })
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
      
      const imageData = canvas.toDataURL('image/png')
      pageImages.push({
        pageNumber: i,
        imageData: imageData,
        width: viewport.width,
        height: viewport.height
      })

      if (i <= 3) {
        pagePreviews.value.push({
          pageNumber: i,
          imageData: imageData
        })
      }
      
      progress.value = Math.round((i / totalPages) * 50)
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.5),
              height: convertInchesToTwip(11)
            },
            margin: {
              top: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5)
            }
          }
        },
        children: pageImages.map((page, index) => {
          const maxWidth = 7.5
          const maxHeight = 10
          
          let imgWidth = page.width / 96
          let imgHeight = page.height / 96
          
          if (imgWidth > maxWidth) {
            const ratio = maxWidth / imgWidth
            imgWidth = maxWidth
            imgHeight = imgHeight * ratio
          }
          
          if (imgHeight > maxHeight) {
            const ratio = maxHeight / imgHeight
            imgHeight = maxHeight
            imgWidth = imgWidth * ratio
          }
          
          return new Paragraph({
            children: [
              new ImageRun({
                data: dataUrlToArrayBuffer(page.imageData),
                transformation: {
                  width: imgWidth * 96,
                  height: imgHeight * 96
                },
                type: 'png'
              })
            ],
            spacing: {
              after: index < pageImages.length - 1 ? 200 : 0
            }
          })
        })
      }]
    })

    progress.value = 80

    const blob = await Packer.toBlob(doc)
    
    const fileName = pdfFile.value?.name?.replace('.pdf', '') || 'output'
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.docx`
    a.click()
    URL.revokeObjectURL(url)

    progress.value = 100
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('转换失败:', error)
    alert('转换失败: ' + error.message)
  } finally {
    isConverting.value = false
  }
}

const dataUrlToArrayBuffer = (dataUrl) => {
  const base64 = dataUrl.split(',')[1]
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">PDF转Word</h1>
        <p class="text-gray-600 dark:text-gray-400">将PDF文件转换为Word文档，100%保留原始格式</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">转换设置</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">输出格式</label>
            <div class="h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white flex items-center">
              Word (.docx)
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">转换模式</label>
            <div class="h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white flex items-center">
              图片模式（100%保留格式）
            </div>
          </div>
        </div>
        <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p class="text-sm text-blue-700 dark:text-blue-300">
            <strong>提示：</strong>图片模式会将PDF每页转换为图片插入Word，完美保留原始格式、排版和样式，但内容不可编辑。
          </p>
        </div>
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
          <input type="file" accept=".pdf" @change="handleFileSelect"
                 class="hidden" id="pdfInput">
          <label for="pdfInput" class="cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-600 dark:text-gray-400">点击选择PDF文件</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">支持 .pdf 格式</p>
          </label>
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div class="flex-1">
              <p class="font-medium text-gray-800 dark:text-white">{{ pdfFile.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ (pdfFile.size / 1024 / 1024).toFixed(2) }} MB</p>
            </div>
          </div>

          <div v-if="progress > 0 && progress < 100" class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" :style="{ width: `${progress}%` }"></div>
          </div>
          <p v-if="progress > 0 && progress < 100" class="text-sm text-gray-500 dark:text-gray-400 text-center">
            {{ progress < 50 ? '正在渲染PDF页面...' : '正在生成Word文档...' }} {{ progress }}%
          </p>

          <div v-if="pagePreviews.length > 0" class="mt-4">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">页面预览（前3页）</h3>
            <div class="grid grid-cols-3 gap-4">
              <div v-for="page in pagePreviews" :key="page.pageNumber" class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <img :src="page.imageData" :alt="`第${page.pageNumber}页`" class="w-full h-auto" />
                <p class="text-xs text-center text-gray-500 dark:text-gray-400 py-1">第 {{ page.pageNumber }} 页</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center">
        <button @click="convertToWord"
                :disabled="!pdfFile || isConverting"
                :class="[
                  'px-8 py-3 font-medium rounded-lg transition-colors',
                  pdfFile && !isConverting
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]">
          <span v-if="isConverting">转换中...</span>
          <span v-else>转换为Word文档</span>
        </button>
      </div>

      <div v-if="showSuccess"
           class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Word文档生成成功！
      </div>
      
      <div v-if="isConverting"
           class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
          <svg class="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-gray-800 dark:text-white">正在处理，请稍候...</span>
        </div>
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
