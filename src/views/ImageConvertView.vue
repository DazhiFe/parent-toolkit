<script setup>
import { ref, computed } from 'vue'
import JSZip from 'jszip'

const imageFiles = ref([])
const isConverting = ref(false)
const progress = ref(0)
const convertedImages = ref([])
const globalTargetFormat = ref('png')
const showGlobalFormat = ref(true)

const SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'gif', 'bmp']
const FORMAT_LABELS = {
  jpeg: 'JPG',
  png: 'PNG',
  webp: 'WebP',
  gif: 'GIF',
  bmp: 'BMP'
}

const MAX_FILES = 50
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  if (!files.length) return

  if (imageFiles.value.length + files.length > MAX_FILES) {
    alert(`最多支持上传 ${MAX_FILES} 张图片，当前已有 ${imageFiles.value.length} 张`)
    return
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff']
  const validFiles = []

  files.forEach(file => {
    if (file.size > MAX_FILE_SIZE) {
      alert(`文件 "${file.name}" 超过 10MB 限制，已跳过`)
      return
    }
    if (!validTypes.includes(file.type)) {
      alert(`文件 "${file.name}" 格式不支持，已跳过`)
      return
    }
    validFiles.push(file)
  })

  const newImages = validFiles.map(file => ({
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    format: getFileFormat(file.name),
    preview: URL.createObjectURL(file),
    targetFormat: globalTargetFormat.value,
    status: 'pending',
    convertedUrl: null,
    convertedSize: null
  }))

  imageFiles.value.push(...newImages)
  convertedImages.value = []
  progress.value = 0
}

const getFileFormat = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  const formatMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp', gif: 'gif', bmp: 'bmp', tiff: 'tiff', tif: 'tiff' }
  return formatMap[ext] || ext
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const clearFiles = () => {
  imageFiles.value.forEach(img => {
    URL.revokeObjectURL(img.preview)
    if (img.convertedUrl) URL.revokeObjectURL(img.convertedUrl)
  })
  imageFiles.value = []
  convertedImages.value = []
  progress.value = 0
}

const removeImage = (index) => {
  const img = imageFiles.value[index]
  URL.revokeObjectURL(img.preview)
  if (img.convertedUrl) URL.revokeObjectURL(img.convertedUrl)
  imageFiles.value.splice(index, 1)
  if (imageFiles.value.length === 0) {
    convertedImages.value = []
    progress.value = 0
  }
}

const updateTargetFormat = (index, format) => {
  imageFiles.value[index].targetFormat = format
}

const updateGlobalFormat = () => {
  imageFiles.value.forEach(img => {
    img.targetFormat = globalTargetFormat.value
  })
}

const convertImage = (file, targetFormat) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      if (targetFormat === 'jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(img, 0, 0)

      let mimeType = `image/${targetFormat}`
      if (targetFormat === 'jpeg') mimeType = 'image/jpeg'

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('转换失败'))
        }
      }, mimeType, 0.95)
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}

const startConvert = async () => {
  if (imageFiles.value.length === 0) {
    alert('请先上传图片')
    return
  }

  isConverting.value = true
  progress.value = 0
  convertedImages.value = []

  const total = imageFiles.value.length

  for (let i = 0; i < total; i++) {
    const img = imageFiles.value[i]
    img.status = 'converting'

    try {
      const blob = await convertImage(img.file, img.targetFormat)
      img.convertedUrl = URL.createObjectURL(blob)
      img.convertedSize = blob.size
      img.status = 'done'
      convertedImages.value.push({
        name: img.name.replace(/\.[^.]+$/, '') + '_converted.' + img.targetFormat,
        url: img.convertedUrl,
        blob: blob
      })
    } catch (error) {
      img.status = 'error'
      console.error('转换失败:', error)
    }

    progress.value = Math.round(((i + 1) / total) * 100)
  }

  isConverting.value = false
}

const downloadAll = async () => {
  if (convertedImages.value.length === 0) return

  if (convertedImages.value.length === 1) {
    const img = convertedImages.value[0]
    const link = document.createElement('a')
    link.href = img.url
    link.download = img.name
    link.click()
    return
  }

  const zip = new JSZip()
  convertedImages.value.forEach(img => {
    zip.file(img.name, img.blob)
  })

  const content = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(content)
  link.download = `图片转换_${new Date().getTime()}.zip`
  link.click()
  URL.revokeObjectURL(link.href)
}

const downloadSingle = (index) => {
  const img = imageFiles.value[index]
  if (!img.convertedUrl) return
  const link = document.createElement('a')
  link.href = img.convertedUrl
  link.download = img.name.replace(/\.[^.]+$/, '') + '_converted.' + img.targetFormat
  link.click()
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-2 dark:text-white">图片格式转换</h1>
    <p class="text-gray-600 dark:text-gray-400 mb-8">支持 JPG、PNG、WebP、GIF、BMP、TIFF 格式互转，单次最多50张</p>

    <!-- 上传区域 -->
    <div class="mb-8">
      <div
        class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-gray-600 dark:text-gray-400 mb-2">点击或拖拽上传图片</p>
        <p class="text-sm text-gray-500 dark:text-gray-500">支持 JPG、PNG、GIF、BMP、WebP、TIFF，单张不超过10MB，最多50张</p>
        <input
          type="file"
          multiple
          accept="image/*"
          class="hidden"
          id="imageInput"
          @change="handleFileSelect"
        >
        <label
          for="imageInput"
          class="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 cursor-pointer transition-all shadow-md hover:shadow-lg"
        >
          选择图片
        </label>
      </div>
    </div>

    <!-- 全局格式设置 -->
    <div v-if="imageFiles.length > 0" class="mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-4">
          <span class="text-gray-700 dark:text-gray-300 font-medium">已上传 {{ imageFiles.length }} 张图片</span>
          <button
            @click="clearFiles"
            class="text-red-500 hover:text-red-700 text-sm"
          >
            清空全部
          </button>
        </div>
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="showGlobalFormat" class="rounded">
            <span class="text-sm text-gray-600 dark:text-gray-400">统一设置格式</span>
          </label>
          <select
            v-if="showGlobalFormat"
            v-model="globalTargetFormat"
            @change="updateGlobalFormat"
            class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option v-for="(label, format) in FORMAT_LABELS" :key="format" :value="format">
              {{ label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- 图片列表 -->
    <div v-if="imageFiles.length > 0" class="mb-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(img, index) in imageFiles"
          :key="index"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700"
        >
          <div class="relative">
            <img :src="img.preview" class="w-full h-40 object-cover">
            <button
              @click="removeImage(index)"
              class="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-sm"
            >
              ×
            </button>
            <div v-if="img.status === 'converting'" class="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div v-if="img.status === 'done'" class="absolute inset-0 bg-black/50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div class="p-4">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">{{ img.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {{ img.format.toUpperCase() }} · {{ formatFileSize(img.size) }}
            </p>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">转</span>
              <select
                v-model="img.targetFormat"
                :disabled="showGlobalFormat"
                class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              >
                <option v-for="(label, format) in FORMAT_LABELS" :key="format" :value="format">
                  {{ label }}
                </option>
              </select>
            </div>
            <div v-if="img.convertedSize" class="mt-2 text-xs text-green-600 dark:text-green-400">
              转换后: {{ formatFileSize(img.convertedSize) }}
            </div>
            <button
              v-if="img.status === 'done'"
              @click="downloadSingle(index)"
              class="mt-2 w-full py-1.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg text-sm hover:from-primary-700 hover:to-primary-600 transition-all"
            >
              下载
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 转换进度 -->
    <div v-if="isConverting" class="mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <div class="flex items-center justify-between mb-2">
          <span class="text-gray-700 dark:text-gray-300">转换中...</span>
          <span class="text-primary-600 dark:text-primary-400 font-medium">{{ progress }}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            class="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-300"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div v-if="imageFiles.length > 0" class="flex gap-4">
      <button
        @click="startConvert"
        :disabled="isConverting"
        class="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
      >
        {{ isConverting ? '转换中...' : '开始转换' }}
      </button>
      <button
        v-if="convertedImages.length > 0"
        @click="downloadAll"
        class="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-500 transition-all shadow-md hover:shadow-lg"
      >
        打包下载 ({{ convertedImages.length }}张)
      </button>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
