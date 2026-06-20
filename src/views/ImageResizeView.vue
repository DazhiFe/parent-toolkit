<script setup>
import { ref, computed, onUnmounted } from 'vue'
import JSZip from 'jszip'
import { useToast } from '../composables/useToast'

const { success, warning, error } = useToast()

const imageFiles = ref([])
const processedImages = ref([])
const isProcessing = ref(false)
const progress = ref(0)

// 设置项
const targetWidth = ref(413)
const targetHeight = ref(579)
const outputFormat = ref('jpeg') // jpeg / png / webp
const quality = ref(92)
const autoRotate = ref(true) // 方向不一致时自动旋转

// 预设尺寸（常用证件照/照片规格）
// physW/physH 为照片物理尺寸（mm），用于打印排版
const presetSizes = [
  { name: '1寸', width: 295, height: 413, desc: '25×35mm', physW: 25, physH: 35 },
  { name: '小1寸', width: 260, height: 378, desc: '22×32mm', physW: 22, physH: 32 },
  { name: '大1寸', width: 390, height: 567, desc: '33×48mm', physW: 33, physH: 48 },
  { name: '2寸', width: 413, height: 579, desc: '35×49mm', physW: 35, physH: 49 },
  { name: '小2寸', width: 354, height: 472, desc: '30×40mm', physW: 30, physH: 40 },
  { name: '护照', width: 390, height: 567, desc: '33×48mm', physW: 33, physH: 48 },
  { name: '5寸', width: 1050, height: 1500, desc: '89×127mm', physW: 89, physH: 127 },
  { name: '6寸', width: 1200, height: 1800, desc: '102×152mm', physW: 102, physH: 152 },
  { name: '方图', width: 600, height: 600, desc: '50×50mm', physW: 50, physH: 50 }
]

const FORMAT_OPTIONS = [
  { value: 'jpeg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' }
]

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']

// 是否显示质量滑块（仅 JPG/WebP）
const showQuality = computed(() => outputFormat.value === 'jpeg' || outputFormat.value === 'webp')

// 当前目标方向
const targetOrientation = computed(() => {
  if (targetHeight.value > targetWidth.value) return 'portrait'
  if (targetWidth.value > targetHeight.value) return 'landscape'
  return 'square'
})

const applyPreset = (preset) => {
  targetWidth.value = preset.width
  targetHeight.value = preset.height
}

const swapWH = () => {
  const tmp = targetWidth.value
  targetWidth.value = targetHeight.value
  targetHeight.value = tmp
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  if (!files.length) return

  const validFiles = files.filter(file => SUPPORTED_TYPES.includes(file.type))
  const skipped = files.length - validFiles.length
  if (skipped > 0) {
    warning(`已过滤 ${skipped} 个不支持的文件格式`)
  }

  const newImages = validFiles.map(file => ({
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    preview: URL.createObjectURL(file),
    originalWidth: null,
    originalHeight: null,
    orientation: null, // landscape / portrait / square
    status: 'pending', // pending / processing / done / error
    resultUrl: null,
    resultSize: null,
    rotated: false
  }))

  imageFiles.value.push(...newImages)
  processedImages.value = []
  progress.value = 0

  // 异步读取每张图的原始尺寸和方向
  newImages.forEach((imgItem) => {
    const img = new Image()
    img.onload = () => {
      imgItem.originalWidth = img.width
      imgItem.originalHeight = img.height
      if (img.height > img.width) {
        imgItem.orientation = 'portrait'
      } else if (img.width > img.height) {
        imgItem.orientation = 'landscape'
      } else {
        imgItem.orientation = 'square'
      }
    }
    img.src = imgItem.preview
  })

  // 清空 input 以便重复选择同一文件
  event.target.value = ''
}

const formatFileSize = (bytes) => {
  if (bytes === 0 || bytes == null) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const orientationLabel = (orientation) => {
  if (orientation === 'portrait') return '竖版'
  if (orientation === 'landscape') return '横版'
  if (orientation === 'square') return '方图'
  return '-'
}

const orientationColor = (orientation) => {
  if (orientation === 'portrait') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
  if (orientation === 'landscape') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  if (orientation === 'square') return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
}

const removeImage = (index) => {
  const img = imageFiles.value[index]
  URL.revokeObjectURL(img.preview)
  if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
  imageFiles.value.splice(index, 1)
  if (imageFiles.value.length === 0) {
    processedImages.value = []
    progress.value = 0
  }
}

const clearAll = () => {
  imageFiles.value.forEach(img => {
    URL.revokeObjectURL(img.preview)
    if (img.resultUrl) URL.revokeObjectURL(img.resultUrl)
  })
  imageFiles.value = []
  processedImages.value = []
  progress.value = 0
}

// 根据输出格式设置获取 MIME 类型
const getOutputMime = () => {
  if (outputFormat.value === 'jpeg') return 'image/jpeg'
  if (outputFormat.value === 'png') return 'image/png'
  if (outputFormat.value === 'webp') return 'image/webp'
  return 'image/jpeg'
}

// 根据输出格式获取扩展名
const getOutputExtension = () => {
  if (outputFormat.value === 'jpeg') return 'jpg'
  if (outputFormat.value === 'png') return 'png'
  if (outputFormat.value === 'webp') return 'webp'
  return 'jpg'
}

// 生成输出文件名：原名_WxH.扩展名
const getOutputName = (originalName) => {
  const baseName = originalName.replace(/\.[^/.]+$/, '')
  const ext = getOutputExtension()
  return `${baseName}_${targetWidth.value}x${targetHeight.value}.${ext}`
}

// 处理单张图片：cover 策略（填满目标 + 居中裁剪，不变形）
// 若原图方向与目标方向不一致且开启自动旋转，则旋转 90 度
const processImage = (imgItem) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const TW = Math.max(1, Math.round(targetWidth.value))
      const TH = Math.max(1, Math.round(targetHeight.value))

      let srcW = img.width
      let srcH = img.height
      let rotated = false

      // 方向不一致时旋转 90 度（顺时针）
      if (autoRotate.value) {
        const srcOri = srcH > srcW ? 'portrait' : (srcW > srcH ? 'landscape' : 'square')
        const tgtOri = TH > TW ? 'portrait' : (TW > TH ? 'landscape' : 'square')
        if (srcOri !== tgtOri && srcOri !== 'square' && tgtOri !== 'square') {
          // 旋转 90 度：宽高互换
          const tmp = srcW
          srcW = srcH
          srcH = tmp
          rotated = true
        }
      }

      // cover 策略：缩放比取较大值，确保完全填满目标
      const scale = Math.max(TW / srcW, TH / srcH)
      const scaledW = srcW * scale
      const scaledH = srcH * scale

      // 绘制到 canvas：先按旋转后的方向缩放绘制到 (scaledW, scaledH)，再居中裁剪到 (TW, TH)
      const canvas = document.createElement('canvas')
      canvas.width = TW
      canvas.height = TH
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      const mime = getOutputMime()
      // JPG 不支持透明，填充白底
      if (mime === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, TW, TH)
      }

      // 居中绘制
      const dx = (TW - scaledW) / 2
      const dy = (TH - scaledH) / 2

      if (rotated) {
        // 旋转 90 度顺时针：原 (x,y) → 新坐标系
        // 使用 transform：先平移到目标中心，旋转 90 度，再平移回来
        ctx.save()
        ctx.translate(TW / 2, TH / 2)
        ctx.rotate(Math.PI / 2)
        // 旋转后，原图在旋转坐标系中需要以 (scaledH, scaledW) 尺寸绘制并居中
        // 旋转坐标系下 x 轴指向原 y 轴反方向，绘制时宽高互换
        const drawW = scaledH // 旋转后水平方向对应原垂直方向
        const drawH = scaledW
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
        ctx.restore()
      } else {
        ctx.drawImage(img, dx, dy, scaledW, scaledH)
      }

      const qualityValue = (mime === 'image/jpeg' || mime === 'image/webp') ? quality.value / 100 : undefined
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('图片处理失败'))
          return
        }
        resolve({
          blob,
          url: URL.createObjectURL(blob),
          width: TW,
          height: TH,
          name: getOutputName(imgItem.name),
          rotated
        })
      }, mime, qualityValue)
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = imgItem.preview
  })
}

const processAll = async () => {
  if (!imageFiles.value.length) {
    warning('请先上传图片')
    return
  }

  // 校验目标尺寸
  if (targetWidth.value <= 0 || targetHeight.value <= 0) {
    error('请输入有效的目标宽高')
    return
  }

  // 检查是否有图片尚未读取尺寸
  const notReady = imageFiles.value.filter(img => img.originalWidth === null)
  if (notReady.length > 0) {
    warning('部分图片仍在加载中，请稍候再试')
    return
  }

  isProcessing.value = true
  progress.value = 0
  processedImages.value = []

  // 清理旧的结果 URL
  imageFiles.value.forEach(img => {
    if (img.resultUrl) {
      URL.revokeObjectURL(img.resultUrl)
    }
    img.resultUrl = null
    img.resultSize = null
    img.rotated = false
    img.status = 'pending'
  })

  const total = imageFiles.value.length
  let successCount = 0

  for (let i = 0; i < total; i++) {
    const imgItem = imageFiles.value[i]
    imgItem.status = 'processing'
    try {
      const result = await processImage(imgItem)
      imgItem.resultUrl = result.url
      imgItem.resultSize = result.blob.size
      imgItem.rotated = result.rotated
      imgItem.status = 'done'
      successCount++
      processedImages.value.push({
        name: result.name,
        url: result.url,
        blob: result.blob,
        width: result.width,
        height: result.height,
        size: result.blob.size,
        rotated: result.rotated
      })
    } catch (err) {
      console.error('处理失败:', err)
      imgItem.status = 'error'
    }
    progress.value = Math.round(((i + 1) / total) * 100)
  }

  isProcessing.value = false

  if (successCount > 0) {
    success(`已处理 ${successCount} 张`)
  }
  if (total - successCount > 0) {
    error(`${total - successCount} 张处理失败`)
  }
}

const downloadOne = (index) => {
  const img = imageFiles.value[index]
  if (!img.resultUrl) return
  const a = document.createElement('a')
  a.href = img.resultUrl
  a.download = getOutputName(img.name)
  a.click()
}

const downloadAll = async () => {
  if (processedImages.value.length === 0) {
    warning('没有可下载的图片')
    return
  }

  // 单张直接下载
  if (processedImages.value.length === 1) {
    const img = processedImages.value[0]
    const link = document.createElement('a')
    link.href = img.url
    link.download = img.name
    link.click()
    return
  }

  // 多张打包 ZIP
  const zip = new JSZip()
  processedImages.value.forEach(img => {
    zip.file(img.name, img.blob)
  })
  const content = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(content)
  link.download = `批量调整尺寸_${targetWidth.value}x${targetHeight.value}_${new Date().getTime()}.zip`
  link.click()
  URL.revokeObjectURL(link.href)
}

// 统计信息
const totalOriginalSize = computed(() => {
  return imageFiles.value.reduce((sum, img) => sum + (img.size || 0), 0)
})

// === 打印排版模块 ===
const showPrintLayout = ref(false)
const paperSize = ref('a4')
const paperMargin = ref(5) // 纸张边距 mm
const photoGap = ref(3) // 照片间距 mm

// 照片纸预设（mm）
const paperPresets = [
  { id: 'a4', name: 'A4', width: 210, height: 297 },
  { id: 'a5', name: 'A5', width: 148, height: 210 },
  { id: 'a6', name: 'A6', width: 105, height: 148 },
  { id: '4x6', name: '4×6英寸', width: 102, height: 152 },
  { id: '5x7', name: '5×7英寸', width: 127, height: 178 },
  { id: '6x8', name: '6×8英寸', width: 152, height: 203 },
  { id: '3.5x5', name: '3.5×5英寸', width: 89, height: 127 }
]

// 当前选中纸张
const currentPaper = computed(() => {
  return paperPresets.find(p => p.id === paperSize.value) || paperPresets[0]
})

// 当前照片物理尺寸（mm）
// 优先匹配预设，否则按 300 DPI 换算
const photoPhysSize = computed(() => {
  const match = presetSizes.find(p =>
    p.width === targetWidth.value && p.height === targetHeight.value
  )
  if (match) return { width: match.physW, height: match.physH }
  const dpi = 300
  return {
    width: +(targetWidth.value / dpi * 25.4).toFixed(1),
    height: +(targetHeight.value / dpi * 25.4).toFixed(1)
  }
})

// 排版计算：每页可放几张、共几页
const layout = computed(() => {
  if (!processedImages.value.length) return null
  const paper = currentPaper.value
  const photo = photoPhysSize.value
  const margin = paperMargin.value
  const gap = photoGap.value

  const availW = paper.width - 2 * margin
  const availH = paper.height - 2 * margin

  if (availW < photo.width || availH < photo.height) {
    return {
      cols: 0, rows: 0, perPage: 0, pages: 0,
      pageData: [], photoW: photo.width, photoH: photo.height,
      fits: false
    }
  }

  const cols = Math.floor((availW + gap) / (photo.width + gap))
  const rows = Math.floor((availH + gap) / (photo.height + gap))
  const perPage = Math.max(1, cols * rows)
  const total = processedImages.value.length
  const pages = Math.ceil(total / perPage)

  // 分页数据
  const pageData = []
  for (let p = 0; p < pages; p++) {
    const photos = []
    for (let i = 0; i < perPage; i++) {
      const idx = p * perPage + i
      if (idx >= total) break
      photos.push(processedImages.value[idx])
    }
    pageData.push(photos)
  }

  return {
    cols, rows, perPage, pages, pageData,
    photoW: photo.width, photoH: photo.height,
    fits: true
  }
})

const togglePrintLayout = () => {
  if (processedImages.value.length === 0) {
    warning('请先处理图片')
    return
  }
  showPrintLayout.value = !showPrintLayout.value
}

const doPrint = () => {
  if (!layout.value || !layout.value.fits) {
    warning('当前照片无法放入所选纸张，请调整尺寸')
    return
  }
  window.print()
}

const totalProcessedSize = computed(() => {
  return processedImages.value.reduce((sum, img) => sum + (img.size || 0), 0)
})

const orientationStats = computed(() => {
  const stats = { landscape: 0, portrait: 0, square: 0 }
  imageFiles.value.forEach(img => {
    if (img.orientation) stats[img.orientation]++
  })
  return stats
})

// 组件卸载时清理所有 object URL
onUnmounted(() => {
  imageFiles.value.forEach(img => {
    URL.revokeObjectURL(img.preview)
    if (img.resultUrl) {
      URL.revokeObjectURL(img.resultUrl)
    }
  })
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <!-- 标题 -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">批量照片尺寸调整</h1>
        <p class="text-gray-600 dark:text-gray-400">横竖混合上传，自动旋转方向，cover 填充无空白</p>
      </div>

      <!-- 设置区 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">目标尺寸</h2>

        <!-- 预设尺寸 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            常用预设
          </label>
          <div class="flex flex-wrap gap-2">
            <button v-for="preset in presetSizes" :key="preset.name"
                    @click="applyPreset(preset)"
                    :class="[
                      'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                      targetWidth === preset.width && targetHeight === preset.height
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:text-primary-600 dark:hover:border-primary-400'
                    ]">
              <span class="font-medium">{{ preset.name }}</span>
              <span class="ml-1 text-xs opacity-75">{{ preset.width }}×{{ preset.height }}</span>
            </button>
          </div>
        </div>

        <!-- 自定义宽高 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              目标宽度 (px)
            </label>
            <input type="number" v-model="targetWidth" min="1" max="8000"
                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              目标高度 (px)
            </label>
            <input type="number" v-model="targetHeight" min="1" max="8000"
                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              输出格式
            </label>
            <select v-model="outputFormat"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option v-for="opt in FORMAT_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG 不支持透明</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span v-if="showQuality">质量: {{ quality }}%</span>
              <span v-else class="text-gray-400 dark:text-gray-500">质量（仅 JPG/WebP）</span>
            </label>
            <input type="range" v-model="quality" min="10" max="100" step="5" :disabled="!showQuality"
                   :class="[
                     'w-full h-2 rounded-lg appearance-none cursor-pointer',
                     showQuality ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                   ]">
          </div>
        </div>

        <!-- 辅助操作 -->
        <div class="mt-4 flex flex-wrap items-center gap-4">
          <button @click="swapWH"
                  class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            宽高互换
          </button>
          <div class="flex items-center">
            <input type="checkbox" id="autoRotate" v-model="autoRotate"
                   class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
            <label for="autoRotate" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              方向不一致时自动旋转 90°
            </label>
          </div>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            当前目标方向：
            <span :class="['ml-1 px-1.5 py-0.5 rounded', orientationColor(targetOrientation)]">
              {{ orientationLabel(targetOrientation) }}
            </span>
          </span>
        </div>

        <!-- 策略说明 -->
        <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p class="text-xs text-blue-700 dark:text-blue-300">
            <strong>cover 填充策略：</strong>所有图片将按比例缩放并居中裁剪，完全填满 {{ targetWidth }}×{{ targetHeight }} 区域，无空白、无变形。
            <span v-if="autoRotate">原图方向与目标不一致时自动旋转 90°。</span>
          </p>
        </div>
      </div>

      <!-- 上传区 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">上传图片</h2>
          <button v-if="imageFiles.length" @click="clearAll"
                  class="text-sm text-red-600 hover:text-red-700 dark:text-red-400">
            清空全部
          </button>
        </div>

        <div v-if="!imageFiles.length" class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
          <input type="file" accept="image/*" multiple @change="handleFileSelect"
                 class="hidden" id="imageInput">
          <label for="imageInput" class="cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-600 dark:text-gray-400">点击选择图片（可多选）</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">支持 JPEG、PNG、WebP、GIF、BMP，横版竖版可混合上传</p>
          </label>
        </div>

        <div v-else>
          <!-- 统计信息 -->
          <div class="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <span class="text-gray-600 dark:text-gray-400">共 {{ imageFiles.length }} 张</span>
            <span v-if="orientationStats.landscape" class="px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">横版 {{ orientationStats.landscape }}</span>
            <span v-if="orientationStats.portrait" class="px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">竖版 {{ orientationStats.portrait }}</span>
            <span v-if="orientationStats.square" class="px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">方图 {{ orientationStats.square }}</span>
            <span class="text-gray-500 dark:text-gray-400">总大小: {{ formatFileSize(totalOriginalSize) }}</span>
          </div>

          <!-- 文件列表 -->
          <div class="space-y-3">
            <div v-for="(img, index) in imageFiles" :key="index"
                 class="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <!-- 缩略图 -->
              <img :src="img.preview" :alt="img.name"
                   class="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-200 dark:border-gray-700">

              <!-- 信息 -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 dark:text-white truncate">{{ img.name }}</p>
                <div class="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span v-if="img.originalWidth" class="text-gray-600 dark:text-gray-300">{{ img.originalWidth }} × {{ img.originalHeight }}</span>
                  <span v-else class="text-gray-400">读取中...</span>
                  <span v-if="img.orientation" :class="['px-1.5 py-0.5 rounded text-xs', orientationColor(img.orientation)]">
                    {{ orientationLabel(img.orientation) }}
                  </span>
                  <span>{{ formatFileSize(img.size) }}</span>
                </div>
                <!-- 处理后信息 -->
                <div v-if="img.resultSize" class="flex flex-wrap items-center gap-2 mt-1 text-xs">
                  <span class="text-green-600 dark:text-green-400">→ {{ targetWidth }} × {{ targetHeight }}</span>
                  <span class="text-green-600 dark:text-green-400">{{ formatFileSize(img.resultSize) }}</span>
                  <span v-if="img.rotated" class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">已旋转 90°</span>
                </div>
              </div>

              <!-- 状态 -->
              <div class="flex-shrink-0">
                <span v-if="img.status === 'processing'" class="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1">
                  <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  处理中
                </span>
                <span v-else-if="img.status === 'done'" class="text-xs text-green-600 dark:text-green-400">已完成</span>
                <span v-else-if="img.status === 'error'" class="text-xs text-red-500">失败</span>
                <button v-if="img.resultUrl"
                        @click="downloadOne(index)"
                        class="ml-2 px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded transition-colors">
                  下载
                </button>
              </div>

              <!-- 删除 -->
              <button @click="removeImage(index)"
                      class="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 添加更多 -->
          <div class="mt-4">
            <input type="file" accept="image/*" multiple @change="handleFileSelect"
                   class="hidden" id="imageInputMore">
            <label for="imageInputMore"
                   class="inline-block px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg cursor-pointer hover:border-primary-500 hover:text-primary-600 dark:hover:border-primary-400 dark:hover:text-primary-400 transition-colors text-sm">
              + 添加更多图片
            </label>
          </div>
        </div>
      </div>

      <!-- 进度条 -->
      <div v-if="isProcessing" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-gray-700 dark:text-gray-300">正在处理...</span>
          <span class="text-primary-600 dark:text-primary-400 font-medium">{{ progress }}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div class="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-300"
               :style="{ width: progress + '%' }"></div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="imageFiles.length" class="flex flex-col sm:flex-row gap-4">
        <button @click="processAll"
                :disabled="isProcessing"
                :class="[
                  'flex-1 py-3 font-medium rounded-lg transition-colors',
                  isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                ]">
          <span v-if="isProcessing">处理中... {{ progress }}%</span>
          <span v-else>开始处理（{{ targetWidth }}×{{ targetHeight }}）</span>
        </button>
        <button v-if="processedImages.length" @click="downloadAll"
                class="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
          打包下载 ({{ processedImages.length }}张)
        </button>
      </div>

      <!-- 处理结果汇总 -->
      <div v-if="processedImages.length && !isProcessing" class="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg no-print">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-700 dark:text-green-300 font-medium">处理完成！</p>
            <p class="text-sm text-green-600 dark:text-green-400">
              原始总大小: {{ formatFileSize(totalOriginalSize) }} → 处理后: {{ formatFileSize(totalProcessedSize) }}
            </p>
          </div>
          <button @click="togglePrintLayout"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            {{ showPrintLayout ? '收起打印排版' : '打印排版' }}
          </button>
        </div>
      </div>

      <!-- 打印排版模块 -->
      <div v-if="showPrintLayout && processedImages.length" class="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 no-print">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">打印排版</h2>

        <!-- 纸张选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">照片纸尺寸</label>
          <div class="flex flex-wrap gap-2">
            <button v-for="paper in paperPresets" :key="paper.id"
                    @click="paperSize = paper.id"
                    :class="[
                      'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                      paperSize === paper.id
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-500'
                    ]">
              <span class="font-medium">{{ paper.name }}</span>
              <span class="ml-1 text-xs opacity-75">{{ paper.width }}×{{ paper.height }}mm</span>
            </button>
          </div>
        </div>

        <!-- 边距与间距 -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              纸张边距: {{ paperMargin }}mm
            </label>
            <input type="range" v-model="paperMargin" min="0" max="20" step="1"
                   class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              照片间距: {{ photoGap }}mm
            </label>
            <input type="range" v-model="photoGap" min="0" max="10" step="1"
                   class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
          </div>
        </div>

        <!-- 排版信息 -->
        <div v-if="layout" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
          <p class="text-blue-700 dark:text-blue-300">
            <span v-if="layout.fits">
              照片物理尺寸: {{ layout.photoW }}×{{ layout.photoH }}mm ｜
              每页排列: {{ layout.cols }}列 × {{ layout.rows }}行 = {{ layout.perPage }}张 ｜
              共需 {{ layout.pages }} 页（{{ processedImages.length }}张照片）
            </span>
            <span v-else class="text-red-600 dark:text-red-400">
              照片（{{ layout.photoW }}×{{ layout.photoH }}mm）大于可用区域，请更换更大的纸张或减小边距
            </span>
          </p>
        </div>

        <!-- 打印按钮 -->
        <div class="mb-4 flex gap-3">
          <button @click="doPrint" :disabled="!layout || !layout.fits"
                  :class="[
                    'px-6 py-2.5 font-medium rounded-lg transition-colors',
                    (layout && layout.fits)
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700'
                  ]">
            打印（{{ layout && layout.fits ? layout.pages : 0 }}页）
          </button>
        </div>

        <!-- 预览说明 -->
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
          预览按真实物理比例显示，打印时每页对应一张纸。建议在打印对话框选择「实际尺寸」、关闭缩放。
        </p>

        <!-- 预览区域 -->
        <div v-if="layout && layout.fits" class="overflow-auto bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
          <div class="flex flex-wrap gap-6 justify-center">
            <div v-for="(pagePhotos, pageIdx) in layout.pageData" :key="pageIdx"
                 class="print-page bg-white shadow-lg flex flex-col"
                 :style="{
                   width: currentPaper.width + 'mm',
                   minHeight: currentPaper.height + 'mm',
                   padding: paperMargin + 'mm'
                 }">
              <div class="text-center text-xs text-gray-400 mb-1 no-print">第 {{ pageIdx + 1 }} 页 / 共 {{ layout.pages }} 页</div>
              <div class="flex flex-wrap grow content-start"
                   :style="{ gap: photoGap + 'mm' }">
                <div v-for="(photo, idx) in pagePhotos" :key="idx"
                     class="overflow-hidden border border-gray-200"
                     :style="{
                       width: layout.photoW + 'mm',
                       height: layout.photoH + 'mm'
                     }">
                  <img :src="photo.url" class="w-full h-full object-cover" alt="">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 打印区域（仅打印时可见） -->
      <div v-if="showPrintLayout && layout && layout.fits" class="print-only">
        <div v-for="(pagePhotos, pageIdx) in layout.pageData" :key="'p' + pageIdx"
             class="print-page"
             :style="{
               width: currentPaper.width + 'mm',
               height: currentPaper.height + 'mm',
               padding: paperMargin + 'mm',
               boxSizing: 'border-box'
             }">
          <div class="flex flex-wrap" :style="{ gap: photoGap + 'mm' }">
            <div v-for="(photo, idx) in pagePhotos" :key="idx"
                 :style="{
                   width: layout.photoW + 'mm',
                   height: layout.photoH + 'mm'
                 }">
              <img :src="photo.url" :style="{ width: '100%', height: '100%', objectFit: 'cover' }" alt="">
            </div>
          </div>
        </div>
      </div>
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

input[type="range"]:disabled::-webkit-slider-thumb {
  background: #9ca3af;
  cursor: not-allowed;
}

input[type="range"]:disabled::-moz-range-thumb {
  background: #9ca3af;
  cursor: not-allowed;
}

/* 打印区域默认隐藏 */
.print-only {
  display: none;
}

/* 打印时：仅显示打印区域，隐藏其他所有内容 */
@media print {
  /* 隐藏整个应用的非打印内容 */
  body * {
    visibility: hidden;
  }

  /* 显示打印区域及其子元素 */
  .print-only,
  .print-only * {
    visibility: visible;
  }

  /* 打印区域定位到页面左上角 */
  .print-only {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }

  /* 每页一张纸，强制分页 */
  .print-page {
    page-break-after: always;
    break-after: page;
    margin: 0;
    box-shadow: none;
  }

  .print-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  /* 隐藏标记为 no-print 的元素 */
  .no-print {
    display: none !important;
  }

  /* 打印时图片不要边框 */
  .print-page img {
    border: none;
  }
}
</style>
