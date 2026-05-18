<script setup>
import { ref, computed } from 'vue'
import JSZip from 'jszip'

const imageFiles = ref([])
const isProcessing = ref(false)
const progress = ref(0)
const watermarkedImages = ref([])

const watermarkType = ref('text')
const watermarkText = ref('')
const watermarkImageFile = ref(null)
const watermarkImagePreview = ref('')

const position = ref('bottomRight')
const opacity = ref(50)
const size = ref(30)
const rotation = ref(0)
const color = ref('#FFFFFF')
const fontFamily = ref('Arial')
const tileMode = ref(false)
const marginX = ref(20)
const marginY = ref(20)

const POSITION_OPTIONS = [
  { value: 'topLeft', label: '左上' },
  { value: 'topCenter', label: '顶部居中' },
  { value: 'topRight', label: '右上' },
  { value: 'centerLeft', label: '左中' },
  { value: 'center', label: '居中' },
  { value: 'centerRight', label: '右中' },
  { value: 'bottomLeft', label: '左下' },
  { value: 'bottomCenter', label: '底部居中' },
  { value: 'bottomRight', label: '右下' }
]

const FONT_OPTIONS = [
  { value: 'Arial', label: 'Arial' },
  { value: '"Microsoft YaHei", sans-serif', label: '微软雅黑' },
  { value: '"SimSun", serif', label: '宋体' },
  { value: '"SimHei", sans-serif', label: '黑体' },
  { value: '"KaiTi", serif', label: '楷体' }
]

const MAX_FILES = 50
const MAX_FILE_SIZE = 10 * 1024 * 1024

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  if (!files.length) return

  if (imageFiles.value.length + files.length > MAX_FILES) {
    alert(`最多支持上传 ${MAX_FILES} 张图片，当前已有 ${imageFiles.value.length} 张`)
    return
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']
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
    preview: URL.createObjectURL(file),
    status: 'pending',
    watermarkedUrl: null,
    watermarkedSize: null
  }))

  imageFiles.value.push(...newImages)
  watermarkedImages.value = []
  progress.value = 0
}

const handleWatermarkImageSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  watermarkImageFile.value = file
  watermarkImagePreview.value = URL.createObjectURL(file)
}

const clearWatermarkImage = () => {
  if (watermarkImagePreview.value) {
    URL.revokeObjectURL(watermarkImagePreview.value)
  }
  watermarkImageFile.value = null
  watermarkImagePreview.value = ''
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
    if (img.watermarkedUrl) URL.revokeObjectURL(img.watermarkedUrl)
  })
  imageFiles.value = []
  watermarkedImages.value = []
  progress.value = 0
}

const removeImage = (index) => {
  const img = imageFiles.value[index]
  URL.revokeObjectURL(img.preview)
  if (img.watermarkedUrl) URL.revokeObjectURL(img.watermarkedUrl)
  imageFiles.value.splice(index, 1)
  if (imageFiles.value.length === 0) {
    watermarkedImages.value = []
    progress.value = 0
  }
}

const getPositionCoords = (canvasWidth, canvasHeight, watermarkWidth, watermarkHeight) => {
  const mx = marginX.value
  const my = marginY.value
  switch (position.value) {
    case 'topLeft': return { x: mx, y: my + watermarkHeight }
    case 'topCenter': return { x: (canvasWidth - watermarkWidth) / 2, y: my + watermarkHeight }
    case 'topRight': return { x: canvasWidth - watermarkWidth - mx, y: my + watermarkHeight }
    case 'centerLeft': return { x: mx, y: (canvasHeight + watermarkHeight) / 2 }
    case 'center': return { x: (canvasWidth - watermarkWidth) / 2, y: (canvasHeight + watermarkHeight) / 2 }
    case 'centerRight': return { x: canvasWidth - watermarkWidth - mx, y: (canvasHeight + watermarkHeight) / 2 }
    case 'bottomLeft': return { x: mx, y: canvasHeight - my }
    case 'bottomCenter': return { x: (canvasWidth - watermarkWidth) / 2, y: canvasHeight - my }
    case 'bottomRight': return { x: canvasWidth - watermarkWidth - mx, y: canvasHeight - my }
    default: return { x: canvasWidth - watermarkWidth - mx, y: canvasHeight - my }
  }
}

const addTextWatermark = (ctx, canvasWidth, canvasHeight) => {
  ctx.save()
  ctx.globalAlpha = opacity.value / 100
  ctx.fillStyle = color.value
  ctx.font = `${size.value * canvasWidth / 500}px ${fontFamily.value}`
  ctx.textBaseline = 'bottom'

  const text = watermarkText.value || ''
  const metrics = ctx.measureText(text)
  const textWidth = metrics.width
  const textHeight = size.value * canvasWidth / 500

  if (tileMode.value) {
    const gapX = textWidth + 100
    const gapY = textHeight * 3
    ctx.rotate((rotation.value * Math.PI) / 180)
    for (let x = -canvasWidth; x < canvasWidth * 2; x += gapX) {
      for (let y = -canvasHeight; y < canvasHeight * 2; y += gapY) {
        ctx.fillText(text, x, y)
      }
    }
  } else {
    const coords = getPositionCoords(canvasWidth, canvasHeight, textWidth, textHeight)
    ctx.translate(coords.x + textWidth / 2, coords.y - textHeight / 2)
    ctx.rotate((rotation.value * Math.PI) / 180)
    ctx.fillText(text, -textWidth / 2, textHeight / 2)
  }

  ctx.restore()
}

const addImageWatermark = (ctx, canvasWidth, canvasHeight, watermarkImg) => {
  ctx.save()
  ctx.globalAlpha = opacity.value / 100

  const scale = (size.value / 100) * (canvasWidth / watermarkImg.width)
  const watermarkWidth = watermarkImg.width * scale
  const watermarkHeight = watermarkImg.height * scale

  if (tileMode.value) {
    const gapX = watermarkWidth + 50
    const gapY = watermarkHeight + 50
    ctx.rotate((rotation.value * Math.PI) / 180)
    for (let x = -canvasWidth; x < canvasWidth * 2; x += gapX) {
      for (let y = -canvasHeight; y < canvasHeight * 2; y += gapY) {
        ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight)
      }
    }
  } else {
    const coords = getPositionCoords(canvasWidth, canvasHeight, watermarkWidth, watermarkHeight)
    ctx.translate(coords.x + watermarkWidth / 2, coords.y - watermarkHeight / 2)
    ctx.rotate((rotation.value * Math.PI) / 180)
    ctx.drawImage(watermarkImg, -watermarkWidth / 2, -watermarkHeight / 2, watermarkWidth, watermarkHeight)
  }

  ctx.restore()
}

const processImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      ctx.drawImage(img, 0, 0)

      if (watermarkType.value === 'text' && watermarkText.value) {
        addTextWatermark(ctx, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              blob,
              url: URL.createObjectURL(blob),
              name: file.name.replace(/\.[^.]+$/, '') + '_watermarked' + file.name.match(/\.[^.]+$/)[0]
            })
          } else {
            reject(new Error('处理失败'))
          }
        }, file.type, 0.95)
      } else if (watermarkType.value === 'image' && watermarkImageFile.value) {
        const wmImg = new Image()
        wmImg.onload = () => {
          addImageWatermark(ctx, canvas.width, canvas.height, wmImg)
          canvas.toBlob((blob) => {
            if (blob) {
              resolve({
                blob,
                url: URL.createObjectURL(blob),
                name: file.name.replace(/\.[^.]+$/, '') + '_watermarked' + file.name.match(/\.[^.]+$/)[0]
              })
            } else {
              reject(new Error('处理失败'))
            }
          }, file.type, 0.95)
        }
        wmImg.onerror = () => reject(new Error('水印图片加载失败'))
        wmImg.src = URL.createObjectURL(watermarkImageFile.value)
      } else {
        reject(new Error('请设置水印内容'))
      }
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}

const startProcess = async () => {
  if (imageFiles.value.length === 0) {
    alert('请先上传图片')
    return
  }

  if (watermarkType.value === 'text' && !watermarkText.value.trim()) {
    alert('请输入水印文字')
    return
  }

  if (watermarkType.value === 'image' && !watermarkImageFile.value) {
    alert('请选择水印图片')
    return
  }

  isProcessing.value = true
  progress.value = 0
  watermarkedImages.value = []

  const total = imageFiles.value.length

  for (let i = 0; i < total; i++) {
    const img = imageFiles.value[i]
    img.status = 'processing'

    try {
      const result = await processImage(img.file)
      img.watermarkedUrl = result.url
      img.watermarkedSize = result.blob.size
      img.status = 'done'
      watermarkedImages.value.push({
        name: result.name,
        url: result.url,
        blob: result.blob
      })
    } catch (error) {
      img.status = 'error'
      console.error('处理失败:', error)
    }

    progress.value = Math.round(((i + 1) / total) * 100)
  }

  isProcessing.value = false
}

const downloadAll = async () => {
  if (watermarkedImages.value.length === 0) return

  if (watermarkedImages.value.length === 1) {
    const img = watermarkedImages.value[0]
    const link = document.createElement('a')
    link.href = img.url
    link.download = img.name
    link.click()
    return
  }

  const zip = new JSZip()
  watermarkedImages.value.forEach(img => {
    zip.file(img.name, img.blob)
  })

  const content = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(content)
  link.download = `图片水印_${new Date().getTime()}.zip`
  link.click()
  URL.revokeObjectURL(link.href)
}

const downloadSingle = (index) => {
  const img = imageFiles.value[index]
  if (!img.watermarkedUrl) return
  const link = document.createElement('a')
  link.href = img.watermarkedUrl
  link.download = img.name.replace(/\.[^.]+$/, '') + '_watermarked' + img.name.match(/\.[^.]+$/)[0]
  link.click()
}

const canProcess = computed(() => {
  if (imageFiles.value.length === 0) return false
  if (watermarkType.value === 'text') return watermarkText.value.trim().length > 0
  if (watermarkType.value === 'image') return watermarkImageFile.value !== null
  return false
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-2 dark:text-white">图片水印</h1>
    <p class="text-gray-600 dark:text-gray-400 mb-8">为图片添加文字或图片水印，支持批量处理</p>

    <!-- 水印设置 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-8">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">水印设置</h2>

      <!-- 水印类型 -->
      <div class="flex gap-4 mb-6">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" v-model="watermarkType" value="text" class="text-primary-600">
          <span class="text-gray-700 dark:text-gray-300">文字水印</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" v-model="watermarkType" value="image" class="text-primary-600">
          <span class="text-gray-700 dark:text-gray-300">图片水印</span>
        </label>
      </div>

      <!-- 文字水印设置 -->
      <div v-if="watermarkType === 'text'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">水印文字</label>
          <input
            v-model="watermarkText"
            type="text"
            placeholder="请输入水印文字"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">字体</label>
            <select v-model="fontFamily" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option v-for="font in FONT_OPTIONS" :key="font.value" :value="font.value">{{ font.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">颜色</label>
            <div class="flex items-center gap-2">
              <input v-model="color" type="color" class="w-10 h-10 rounded cursor-pointer">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ color }}</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">大小: {{ size }}</label>
            <input v-model="size" type="range" min="10" max="100" class="w-full">
          </div>
        </div>
      </div>

      <!-- 图片水印设置 -->
      <div v-else class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">水印图片</label>
          <div v-if="!watermarkImageFile" class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
            <input type="file" accept="image/*" class="hidden" id="watermarkImageInput" @change="handleWatermarkImageSelect">
            <label for="watermarkImageInput" class="cursor-pointer text-primary-600 dark:text-primary-400 hover:underline">
              点击选择水印图片
            </label>
          </div>
          <div v-else class="flex items-center gap-4">
            <img :src="watermarkImagePreview" class="h-16 w-16 object-cover rounded-lg">
            <div>
              <p class="text-sm text-gray-700 dark:text-gray-300">{{ watermarkImageFile.name }}</p>
              <button @click="clearWatermarkImage" class="text-sm text-red-500 hover:text-red-700 mt-1">移除</button>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">大小比例: {{ size }}%</label>
          <input v-model="size" type="range" min="5" max="100" class="w-full">
        </div>
      </div>

      <!-- 通用设置 -->
      <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">通用设置</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">位置</label>
            <select v-model="position" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option v-for="pos in POSITION_OPTIONS" :key="pos.value" :value="pos.value">{{ pos.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">透明度: {{ opacity }}%</label>
            <input v-model="opacity" type="range" min="10" max="100" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">旋转角度: {{ rotation }}°</label>
            <input v-model="rotation" type="range" min="-180" max="180" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">水平边距: {{ marginX }}px</label>
            <input v-model="marginX" type="range" min="0" max="200" class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">垂直边距: {{ marginY }}px</label>
            <input v-model="marginY" type="range" min="0" max="200" class="w-full">
          </div>
          <div class="flex items-center">
            <input v-model="tileMode" type="checkbox" id="tileMode" class="w-4 h-4 text-primary-600 rounded">
            <label for="tileMode" class="ml-2 text-sm text-gray-700 dark:text-gray-300">平铺模式（满屏水印）</label>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传区域 -->
    <div class="mb-8">
      <div
        class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-gray-600 dark:text-gray-400 mb-2">点击或拖拽上传图片</p>
        <p class="text-sm text-gray-500 dark:text-gray-500">支持 JPG、PNG、WebP、GIF、BMP，单张不超过10MB，最多50张</p>
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

    <!-- 已上传图片列表 -->
    <div v-if="imageFiles.length > 0" class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <span class="text-gray-700 dark:text-gray-300 font-medium">已上传 {{ imageFiles.length }} 张图片</span>
        <button @click="clearFiles" class="text-red-500 hover:text-red-700 text-sm">清空全部</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div v-for="(img, index) in imageFiles" :key="index" class="relative group">
          <img :src="img.preview" class="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700">
          <button @click="removeImage(index)" class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-sm">×</button>
          <div v-if="img.status === 'processing'" class="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div v-if="img.status === 'done'" class="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center truncate">{{ img.name }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 text-center">{{ formatFileSize(img.size) }}</p>
        </div>
      </div>
    </div>

    <!-- 处理进度 -->
    <div v-if="isProcessing" class="mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <div class="flex items-center justify-between mb-2">
          <span class="text-gray-700 dark:text-gray-300">处理中...</span>
          <span class="text-primary-600 dark:text-primary-400 font-medium">{{ progress }}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div class="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-300" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 处理结果 -->
    <div v-if="watermarkedImages.length > 0" class="mb-8">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">处理结果</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="(img, index) in imageFiles.filter(i => i.status === 'done')" :key="index" class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
          <img :src="img.watermarkedUrl" class="w-full h-40 object-cover">
          <div class="p-4">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ img.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ formatFileSize(img.watermarkedSize) }}</p>
            <button @click="downloadSingle(imageFiles.indexOf(img))" class="mt-2 w-full py-1.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg text-sm hover:from-primary-700 hover:to-primary-600 transition-all">
              下载
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div v-if="imageFiles.length > 0" class="flex gap-4">
      <button
        @click="startProcess"
        :disabled="isProcessing || !canProcess"
        class="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
      >
        {{ isProcessing ? '处理中...' : '添加水印' }}
      </button>
      <button
        v-if="watermarkedImages.length > 0"
        @click="downloadAll"
        class="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-500 transition-all shadow-md hover:shadow-lg"
      >
        打包下载 ({{ watermarkedImages.length }}张)
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

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>
