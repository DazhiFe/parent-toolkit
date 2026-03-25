<script setup>
import { ref, nextTick } from 'vue'
import { renderAsync } from 'docx-preview'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const wordFile = ref(null)
const isConverting = ref(false)
const progress = ref(0)
const showSuccess = ref(false)

const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
    alert('请选择有效的Word文档（.doc或.docx格式）')
    return
  }

  wordFile.value = file
  progress.value = 0

  await nextTick()

  const container = document.getElementById('preview-container')
  if (!container) {
    alert('预览容器未找到')
    return
  }
  container.innerHTML = ''

  try {
    const arrayBuffer = await file.arrayBuffer()
    progress.value = 30
    
    await renderAsync(arrayBuffer, container, container, {
      className: 'docx-preview',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: true,
      experimental: false,
      trimXmlDeclaration: true,
      useBase64URL: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true
    })
    
    progress.value = 100
  } catch (error) {
    console.error('Word解析失败:', error)
    alert('Word文档解析失败: ' + error.message)
  }
}

const clearFile = () => {
  wordFile.value = null
  const container = document.getElementById('preview-container')
  if (container) {
    container.innerHTML = ''
  }
  progress.value = 0
}

const convertToPdf = async () => {
  const container = document.getElementById('preview-container')
  if (!container || !container.innerHTML || container.innerHTML.trim() === '') {
    alert('请先上传Word文档')
    return
  }

  isConverting.value = true

  try {
    const wrapper = container.querySelector('.docx-wrapper') || container
    
    const clone = wrapper.cloneNode(true)
    clone.id = 'pdf-clone'
    
    const contentWidth = wrapper.scrollWidth || wrapper.offsetWidth || 800
    const contentHeight = wrapper.scrollHeight || wrapper.offsetHeight || 1000
    
    clone.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: ${contentWidth}px;
      height: ${contentHeight}px;
      max-height: none;
      overflow: visible;
      z-index: -9999;
      background: white;
      pointer-events: none;
      display: block;
    `
    document.body.appendChild(clone)

    await new Promise(resolve => setTimeout(resolve, 300))

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pdfPageWidth = pdf.internal.pageSize.getWidth()
    const pdfPageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const pdfContentWidth = pdfPageWidth - margin * 2
    const maxPdfHeight = pdfPageHeight - margin * 2

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: contentWidth,
      height: contentHeight
    })

    document.body.removeChild(clone)

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    
    const imgWidth = pdfContentWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    if (imgHeight <= maxPdfHeight) {
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight)
    } else {
      const totalPages = Math.ceil(imgHeight / maxPdfHeight)
      const srcPageHeight = canvas.height / totalPages
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage()
        }
        
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = srcPageHeight
        
        const ctx = pageCanvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
        ctx.drawImage(
          canvas,
          0, srcPageHeight * i,
          canvas.width, srcPageHeight,
          0, 0,
          canvas.width, srcPageHeight
        )
        
        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95)
        const pageImgHeight = (srcPageHeight * imgWidth) / canvas.width
        
        pdf.addImage(pageImgData, 'JPEG', margin, margin, imgWidth, pageImgHeight)
      }
    }

    const fileName = wordFile.value?.name?.replace(/\.(doc|docx)$/i, '') || 'output'
    pdf.save(`${fileName}.pdf`)

    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('PDF生成失败:', error)
    alert('PDF生成失败: ' + error.message)
    
    const clone = document.getElementById('pdf-clone')
    if (clone) {
      document.body.removeChild(clone)
    }
  } finally {
    isConverting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">Word转PDF</h1>
        <p class="text-gray-600 dark:text-gray-400">将Word文档转换为PDF文件</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">转换设置</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">页面大小</label>
            <div class="h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white flex items-center">
              A4 (210mm × 297mm)
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">输出格式</label>
            <div class="h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white flex items-center">
              PDF
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">上传Word文档</h2>
          <button v-if="wordFile" @click="clearFile"
                  class="text-sm text-red-600 hover:text-red-700 dark:text-red-400">
            清除文件
          </button>
        </div>

        <div v-if="!wordFile" class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
          <input type="file" accept=".doc,.docx" @change="handleFileSelect"
                 class="hidden" id="wordInput">
          <label for="wordInput" class="cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-600 dark:text-gray-400">点击选择Word文档</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">支持 .doc 和 .docx 格式</p>
          </label>
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div class="flex-1">
              <p class="font-medium text-gray-800 dark:text-white">{{ wordFile.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ (wordFile.size / 1024 / 1024).toFixed(2) }} MB</p>
            </div>
          </div>

          <div v-if="progress < 100" class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" :style="{ width: `${progress}%` }"></div>
          </div>
          <p v-if="progress < 100" class="text-sm text-gray-500 dark:text-gray-400 text-center">正在解析文档... {{ progress }}%</p>

          <div class="mt-4">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">文档预览</h3>
            <div id="preview-container" class="border border-gray-200 dark:border-gray-700 rounded-lg bg-white overflow-auto max-h-[500px] p-4"></div>
          </div>
        </div>
      </div>

      <div class="flex justify-center">
        <button @click="convertToPdf"
                :disabled="progress < 100 || isConverting"
                :class="[
                  'px-8 py-3 font-medium rounded-lg transition-colors',
                  progress === 100 && !isConverting
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]">
          <span v-if="isConverting">转换中...</span>
          <span v-else>生成PDF</span>
        </button>
      </div>

      <div v-if="showSuccess"
           class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        PDF生成成功！
      </div>
      
      <div v-if="isConverting"
           class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
          <svg class="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-gray-800 dark:text-white">正在生成PDF，请稍候...</span>
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

#preview-container {
  background: white;
}

#preview-container :deep(.docx-wrapper) {
  background: white;
  padding: 20px;
}

#preview-container :deep(section) {
  margin-bottom: 20px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  background: white;
}
</style>
