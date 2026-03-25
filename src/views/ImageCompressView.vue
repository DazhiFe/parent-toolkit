<script setup>
import { ref, computed } from 'vue'

const imageFiles = ref([])
const isProcessing = ref(false)
const progress = ref(0)
const showSuccess = ref(false)
const compressedImages = ref([])

const quality = ref(80)
const maxWidth = ref(1920)
const maxHeight = ref(1080)
const outputFormat = ref('jpeg')
const maintainAspectRatio = ref(true)

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  if (!files.length) return

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']
  const validFiles = files.filter(file => validTypes.includes(file.type))

  if (validFiles.length !== files.length) {
    alert('部分文件格式不支持，已自动过滤。支持格式：JPEG、PNG、WebP、GIF、BMP')
  }

  imageFiles.value = validFiles.map(file => ({
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    preview: URL.createObjectURL(file)
  }))
  
  compressedImages.value = []
}

const clearFiles = () => {
  imageFiles.value.forEach(img => URL.revokeObjectURL(img.preview))
  imageFiles.value = []
  compressedImages.value = []
  progress.value = 0
}

const removeImage = (index) => {
  URL.revokeObjectURL(imageFiles.value[index].preview)
  imageFiles.value.splice(index, 1)
  if (imageFiles.value.length === 0) {
    compressedImages.value = []
    progress.value = 0
  }
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const compressImages = async () => {
  if (!imageFiles.value.length) {
    alert('请先上传图片')
    return
  }

  isProcessing.value = true
  progress.value = 0
  compressedImages.value = []

  try {
    for (let i = 0; i < imageFiles.value.length; i++) {
      const imgFile = imageFiles.value[i]
      
      const compressed = await compressImage(imgFile.file)
      compressedImages.value.push(compressed)
      
      progress.value = Math.round(((i + 1) / imageFiles.value.length) * 100)
    }

    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('压缩失败:', error)
    alert('图片压缩失败: ' + error.message)
  } finally {
    isProcessing.value = false
  }
}

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let width = img.width
      let height = img.height

      if (maxWidth.value > 0 && width > maxWidth.value) {
        const ratio = maxWidth.value / width
        width = maxWidth.value
        if (maintainAspectRatio.value) {
          height = Math.round(height * ratio)
        }
      }

      if (maxHeight.value > 0 && height > maxHeight.value) {
        const ratio = maxHeight.value / height
        height = maxHeight.value
        if (maintainAspectRatio.value) {
          width = Math.round(width * ratio)
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      let mimeType = 'image/jpeg'
      let extension = 'jpg'
      
      if (outputFormat.value === 'png') {
        mimeType = 'image/png'
        extension = 'png'
      } else if (outputFormat.value === 'webp') {
        mimeType = 'image/webp'
        extension = 'webp'
      }

      const qualityValue = outputFormat.value === 'png' ? undefined : quality.value / 100
      
      canvas.toBlob((blob) => {
        const originalName = file.name.replace(/\.[^/.]+$/, '')
        const newFileName = `${originalName}_compressed.${extension}`
        
        resolve({
          name: newFileName,
          originalSize: file.size,
          compressedSize: blob.size,
          blob: blob,
          url: URL.createObjectURL(blob),
          width: width,
          height: height,
          format: outputFormat.value
        })
      }, mimeType, qualityValue)
    }
    
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}

const downloadImage = (image) => {
  const a = document.createElement('a')
  a.href = image.url
  a.download = image.name
  a.click()
}

const downloadAll = () => {
  compressedImages.value.forEach((image, index) => {
    setTimeout(() => {
      downloadImage(image)
    }, index * 200)
  })
}

const totalOriginalSize = computed(() => {
  return imageFiles.value.reduce((sum, img) => sum + img.size, 0)
})

const totalCompressedSize = computed(() => {
  return compressedImages.value.reduce((sum, img) => sum + img.compressedSize, 0)
})

const compressionRatio = computed(() => {
  if (totalOriginalSize.value === 0) return 0
  return ((1 - totalCompressedSize.value / totalOriginalSize.value) * 100).toFixed(1)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">图片压缩</h1>
        <p class="text-gray-600 dark:text-gray-400">高效压缩图片，保持视觉质量平衡</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">压缩设置</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              压缩质量: {{ quality }}%
            </label>
            <input type="range" v-model="quality" min="10" max="100" step="5"
                   class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
            <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>最小</span>
              <span>最佳</span>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              最大宽度 (px)
            </label>
            <input type="number" v-model="maxWidth" min="0" max="4096"
                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500">
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">0表示不限制</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              最大高度 (px)
            </label>
            <input type="number" v-model="maxHeight" min="0" max="4096"
                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500">
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">0表示不限制</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              输出格式
            </label>
            <select v-model="outputFormat"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500">
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
        </div>
        
        <div class="mt-4 flex items-center">
          <input type="checkbox" id="aspectRatio" v-model="maintainAspectRatio"
                 class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
          <label for="aspectRatio" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
            保持宽高比
          </label>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">上传图片</h2>
          <button v-if="imageFiles.length" @click="clearFiles"
                  class="text-sm text-red-600 hover:text-red-700 dark:text-red-400">
            清除全部
          </button>
        </div>

        <div v-if="!imageFiles.length" class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
          <input type="file" accept="image/*" multiple @change="handleFileSelect"
                 class="hidden" id="imageInput">
          <label for="imageInput" class="cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-600 dark:text-gray-400">点击选择或拖拽图片到此处</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">支持 JPEG、PNG、WebP、GIF、BMP 格式，可多选</p>
          </label>
        </div>

        <div v-else class="space-y-4">
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div v-for="(img, index) in imageFiles" :key="index"
                 class="relative group">
              <img :src="img.preview" :alt="img.name"
                   class="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700">
              <button @click="removeImage(index)"
                      class="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                <p class="text-white text-xs text-center px-2 truncate">{{ img.name }}</p>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">{{ formatFileSize(img.size) }}</p>
            </div>
          </div>
          
          <div class="text-center text-sm text-gray-500 dark:text-gray-400">
            共 {{ imageFiles.length }} 张图片，总大小: {{ formatFileSize(totalOriginalSize) }}
          </div>
        </div>
      </div>

      <div v-if="compressedImages.length" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">压缩结果</h2>
          <button @click="downloadAll"
                  class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            全部下载
          </button>
        </div>
        
        <div class="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-700 dark:text-green-300 font-medium">压缩完成！</p>
              <p class="text-sm text-green-600 dark:text-green-400">
                原始大小: {{ formatFileSize(totalOriginalSize) }} → 压缩后: {{ formatFileSize(totalCompressedSize) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ compressionRatio }}%</p>
              <p class="text-xs text-green-500 dark:text-green-500">压缩率</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(img, index) in compressedImages" :key="index"
               class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div class="flex items-start gap-4">
              <img :src="img.url" :alt="img.name"
                   class="w-24 h-24 object-cover rounded-lg">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-800 dark:text-white truncate">{{ img.name }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ img.width }} × {{ img.height }} px
                </p>
                <p class="text-sm">
                  <span class="text-gray-500 dark:text-gray-400">{{ formatFileSize(img.originalSize) }}</span>
                  <span class="mx-2">→</span>
                  <span class="text-green-600 dark:text-green-400 font-medium">{{ formatFileSize(img.compressedSize) }}</span>
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  格式: {{ img.format.toUpperCase() }}
                </p>
              </div>
              <button @click="downloadImage(img)"
                      class="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
                下载
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center gap-4">
        <button @click="compressImages"
                :disabled="!imageFiles.length || isProcessing"
                :class="[
                  'px-8 py-3 font-medium rounded-lg transition-colors',
                  imageFiles.length && !isProcessing
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]">
          <span v-if="isProcessing">压缩中... {{ progress }}%</span>
          <span v-else>开始压缩</span>
        </button>
      </div>

      <div v-if="showSuccess"
           class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        压缩完成！
      </div>
      
      <div v-if="isProcessing"
           class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
          <svg class="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-gray-800 dark:text-white">正在压缩图片，请稍候...</span>
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

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}
</style>
