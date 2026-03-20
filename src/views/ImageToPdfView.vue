<script setup>
import { ref } from 'vue'
import jsPDF from 'jspdf'

const images = ref([])
const isConverting = ref(false)
const pageSize = ref('a4')
const orientation = ref('portrait')
const imageQuality = ref(0.92)
const draggedIndex = ref(null)
const previewImage = ref(null)

const pageSizes = [
  { value: 'a4', label: 'A4' },
  { value: 'a3', label: 'A3' },
  { value: 'letter', label: 'Letter' }
]

const orientations = [
  { value: 'portrait', label: '纵向' },
  { value: 'landscape', label: '横向' }
]

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        images.value.push({
          id: Date.now() + Math.random(),
          name: file.name,
          data: e.target.result,
          file: file
        })
      }
      reader.readAsDataURL(file)
    }
  })
  event.target.value = ''
}

const removeImage = (id) => {
  images.value = images.value.filter(img => img.id !== id)
}

const clearAll = () => {
  images.value = []
}

const handleDragStart = (e, index) => {
  draggedIndex.value = index
  e.dataTransfer.effectAllowed = 'move'
}

const handleDragOver = (e, index) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}

const handleDrop = (e, targetIndex) => {
  e.preventDefault()
  if (draggedIndex.value !== null && draggedIndex.value !== targetIndex) {
    const items = [...images.value]
    const draggedItem = items[draggedIndex.value]
    items.splice(draggedIndex.value, 1)
    items.splice(targetIndex, 0, draggedItem)
    images.value = items
  }
  draggedIndex.value = null
}

const handleDragEnd = () => {
  draggedIndex.value = null
}

const openPreview = (img) => {
  previewImage.value = img
}

const closePreview = () => {
  previewImage.value = null
}

const convertToPdf = async () => {
  if (images.value.length === 0) return

  isConverting.value = true

  try {
    const pdf = new jsPDF({
      orientation: orientation.value,
      unit: 'mm',
      format: pageSize.value
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    for (let i = 0; i < images.value.length; i++) {
      if (i > 0) {
        pdf.addPage()
      }

      const img = images.value[i]
      const imgElement = new Image()
      imgElement.src = img.data

      await new Promise((resolve) => {
        imgElement.onload = () => {
          const imgWidth = imgElement.width
          const imgHeight = imgElement.height
          const imgRatio = imgWidth / imgHeight

          let finalWidth, finalHeight, x, y

          if (imgRatio > pageWidth / pageHeight) {
            finalWidth = pageWidth - 20
            finalHeight = finalWidth / imgRatio
          } else {
            finalHeight = pageHeight - 20
            finalWidth = finalHeight * imgRatio
          }

          x = (pageWidth - finalWidth) / 2
          y = (pageHeight - finalHeight) / 2

          pdf.addImage(img.data, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'MEDIUM')
          resolve()
        }
      })
    }

    const pdfBlob = pdf.output('blob')
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `images_${Date.now()}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF生成失败:', error)
    alert('PDF生成失败，请重试')
  } finally {
    isConverting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">图片转PDF</h1>
        <p class="text-gray-600 dark:text-gray-400">将多张图片合并转换为一个PDF文件</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">PDF设置</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">页面大小</label>
            <select v-model="pageSize"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
              <option v-for="size in pageSizes" :key="size.value" :value="size.value">{{ size.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">页面方向</label>
            <select v-model="orientation"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
              <option v-for="ori in orientations" :key="ori.value" :value="ori.value">{{ ori.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">图片质量</label>
            <input type="range" v-model="imageQuality" min="0.1" max="1" step="0.1"
                   class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ Math.round(imageQuality * 100) }}%</span>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">上传图片</h2>
          <button v-if="images.length > 0" @click="clearAll"
                  class="text-sm text-red-600 hover:text-red-700 dark:text-red-400">
            清空全部
          </button>
        </div>

        <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
          <input type="file" multiple accept="image/*" @change="handleFileSelect"
                 class="hidden" id="imageInput">
          <label for="imageInput" class="cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-600 dark:text-gray-400">点击或拖拽图片到此处上传</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">支持 JPG、PNG、GIF 等格式</p>
          </label>
        </div>

        <div v-if="images.length > 0" class="mt-6">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">已上传图片 ({{ images.length }}张) - 拖拽可调整顺序，点击可放大</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div v-for="(img, index) in images" :key="img.id"
                 draggable="true"
                 @dragstart="handleDragStart($event, index)"
                 @dragover="handleDragOver($event, index)"
                 @drop="handleDrop($event, index)"
                 @dragend="handleDragEnd"
                 @click="openPreview(img)"
                 class="relative group cursor-move">
              <div class="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary-500 transition-colors">
                <img :src="img.data" :alt="img.name"
                     class="w-full h-full object-cover pointer-events-none">
              </div>
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button @click.stop="removeImage(img.id)"
                        class="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transform scale-90 group-hover:scale-100 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate text-center">{{ index + 1 }}. {{ img.name }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center">
        <button @click="convertToPdf"
                :disabled="images.length === 0 || isConverting"
                :class="[
                  'px-8 py-3 font-medium rounded-lg transition-colors',
                  images.length > 0 && !isConverting
                    ? 'bg-pink-600 hover:bg-pink-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]">
          <span v-if="isConverting">转换中...</span>
          <span v-else>生成PDF ({{ images.length }}张图片)</span>
        </button>
      </div>

      <!-- 图片预览弹窗 -->
      <div v-if="previewImage"
           @click="closePreview"
           class="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 cursor-zoom-out">
        <button @click="closePreview"
                class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img :src="previewImage.data" :alt="previewImage.name"
             class="max-w-full max-h-full object-contain"
             @click.stop>
        <div class="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
          {{ previewImage.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
