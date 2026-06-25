<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <!-- 标题 -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">图片多次裁剪</h1>
        <p class="text-gray-600 dark:text-gray-400 text-sm">
          上传图片，在画布上拖拽绘制多个裁剪区域，批量导出图片或PDF
        </p>
      </div>

      <!-- 上传区 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div
          v-if="!originalImage"
          class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-10 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          @click="fileInput.click()"
        >
          <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p class="text-gray-600 dark:text-gray-400">点击上传图片</p>
          <p class="text-gray-400 dark:text-gray-500 text-xs mt-1">支持 JPG、PNG、WebP</p>
        </div>
        <div v-else class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img :src="previewUrl" class="w-full h-full object-cover" />
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ uploadedFile?.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ originalWidth }} × {{ originalHeight }} px</p>
            </div>
          </div>
          <button @click="replaceImage" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">更换图片</button>
        </div>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleUpload" />
      </div>

      <!-- 画布区 -->
      <div v-if="originalImage" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">绘制裁剪区域</h2>
          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            <span>拖拽绘制</span><span>·</span><span>点击选中</span><span>·</span><span>拖拽移动</span><span>·</span><span>边缘调整大小</span><span>·</span><span>Delete 删除</span>
          </div>
        </div>
        <div ref="canvasContainerRef" class="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
          <canvas
            ref="canvasRef"
            class="block w-full cursor-crosshair touch-none"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
          ></canvas>
        </div>
      </div>

      <!-- 裁剪区列表 -->
      <div v-if="cropRegions.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          裁剪区域列表（{{ cropRegions.length }} 个）
        </h2>
        <div class="space-y-3">
          <div
            v-for="(region, index) in cropRegions"
            :key="region.id"
            class="flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer"
            :class="selectedId === region.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'"
            @click="selectRegion(region.id)"
          >
            <div class="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0" :style="{ backgroundColor: region.color }">
              {{ index + 1 }}
            </div>
            <div class="flex-1 grid grid-cols-4 gap-2 text-sm">
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400">X</label>
                <input type="number" v-model.number="region.x" @change="updateRegionFromInput(region)" class="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400">Y</label>
                <input type="number" v-model.number="region.y" @change="updateRegionFromInput(region)" class="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400">宽</label>
                <input type="number" v-model.number="region.width" @change="updateRegionFromInput(region)" class="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400">高</label>
                <input type="number" v-model.number="region.height" @change="updateRegionFromInput(region)" class="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
              </div>
            </div>
            <button @click.stop="deleteRegion(region.id)" class="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="originalImage" class="flex flex-wrap gap-3 mb-6">
        <button
          @click="processCrop"
          :disabled="isProcessing || cropRegions.length === 0"
          class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg v-if="isProcessing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span v-if="!isProcessing">开始裁剪</span>
          <span v-else>处理中...</span>
        </button>
        <button @click="clearRegions" class="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors">
          清空裁剪区
        </button>
        <button
          @click="downloadZip"
          :disabled="croppedResults.length === 0"
          class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          下载 ZIP
        </button>
        <button
          @click="exportPdf"
          :disabled="croppedResults.length === 0"
          class="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          导出 PDF
        </button>
      </div>

      <!-- 结果预览 -->
      <div v-if="croppedResults.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          裁剪结果（{{ croppedResults.length }} 张）
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div
            v-for="item in croppedResults"
            :key="item.id"
            class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900"
          >
            <div class="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <img :src="item.url" class="max-w-full max-h-full object-contain" />
            </div>
            <div class="p-2 flex items-center justify-between gap-2">
              <span class="text-xs text-gray-500 dark:text-gray-400 truncate min-w-0">{{ Math.round(item.width) }}×{{ Math.round(item.height) }}</span>
              <button @click="downloadSingle(item)" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0">下载</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import jsPDF from 'jspdf'
import JSZip from 'jszip'
import { useToast } from '../composables/useToast'

const { success, warning } = useToast()

const fileInput = ref(null)
const uploadedFile = ref(null)
const previewUrl = ref('')
const originalImage = ref(null)
const originalWidth = ref(0)
const originalHeight = ref(0)
const canvasRef = ref(null)
const canvasContainerRef = ref(null)

const REGION_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'
]
const cropRegions = ref([])
let regionIdCounter = 1
const selectedId = ref(null)
const isDrawing = ref(false)
const drawStart = ref({ x: 0, y: 0 })
const previewRect = ref(null)
const isResizing = ref(false)
const resizeHandle = ref(null)
const resizeStartData = ref(null)
const isMoving = ref(false)
const moveStartData = ref(null)
const croppedResults = ref([])
const isProcessing = ref(false)
const canvasDisplayWidth = ref(0)
const canvasDisplayHeight = ref(0)

const scale = computed(() => {
  if (!canvasDisplayWidth.value || !originalWidth.value) return 1
  return originalWidth.value / canvasDisplayWidth.value
})

function getCanvasPos(evt) {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
  }
}

function pointInRegion(px, py, region) {
  const sx = region.x / scale.value
  const sy = region.y / scale.value
  const sw = region.width / scale.value
  const sh = region.height / scale.value
  return px >= sx && px <= sx + sw && py >= sy && py <= sy + sh
}

function getResizeHandle(px, py, region) {
  const sx = region.x / scale.value
  const sy = region.y / scale.value
  const sw = region.width / scale.value
  const sh = region.height / scale.value
  const handles = [
    { name: 'nw', x: sx, y: sy },
    { name: 'n', x: sx + sw / 2, y: sy },
    { name: 'ne', x: sx + sw, y: sy },
    { name: 'e', x: sx + sw, y: sy + sh / 2 },
    { name: 'se', x: sx + sw, y: sy + sh },
    { name: 's', x: sx + sw / 2, y: sy + sh },
    { name: 'sw', x: sx, y: sy + sh },
    { name: 'w', x: sx, y: sy + sh / 2 },
  ]
  for (const h of handles) {
    if (Math.abs(px - h.x) < 8 && Math.abs(py - h.y) < 8) return h.name
  }
  return null
}

const HANDLE_CURSORS = {
  nw: 'nwse-resize', se: 'nwse-resize',
  ne: 'nesw-resize', sw: 'nesw-resize',
  n: 'ns-resize', s: 'ns-resize',
  e: 'ew-resize', w: 'ew-resize',
}

function redrawCanvas() {
  const canvas = canvasRef.value
  if (!canvas || !originalImage.value) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(originalImage.value, 0, 0, canvas.width, canvas.height)

  cropRegions.value.forEach((region, index) => {
    const sx = region.x / scale.value
    const sy = region.y / scale.value
    const sw = region.width / scale.value
    const sh = region.height / scale.value

    ctx.fillStyle = region.color + '14'
    ctx.fillRect(sx, sy, sw, sh)

    ctx.strokeStyle = region.color
    ctx.lineWidth = selectedId.value === region.id ? 3 : 2
    ctx.setLineDash([])
    ctx.strokeRect(sx, sy, sw, sh)

    ctx.fillStyle = region.color
    ctx.fillRect(sx, sy, 24, 20)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(index + 1), sx + 12, sy + 10)

    if (selectedId.value === region.id) {
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = region.color
      ctx.lineWidth = 2
      const pts = [
        [sx, sy], [sx + sw / 2, sy], [sx + sw, sy],
        [sx + sw, sy + sh / 2], [sx + sw, sy + sh],
        [sx + sw / 2, sy + sh], [sx, sy + sh], [sx, sy + sh / 2]
      ]
      pts.forEach(([hx, hy]) => {
        ctx.beginPath()
        ctx.arc(hx, hy, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      })
    }
  })

  if (previewRect.value) {
    const { x, y, width, height } = previewRect.value
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(x, y, width, height)
    ctx.setLineDash([])
  }
}

function onPointerDown(evt) {
  evt.preventDefault()
  if (!originalImage.value) return
  // 捕获指针：鼠标移出 canvas 也能继续接收事件
  if (evt.pointerId !== undefined) {
    try { evt.target.setPointerCapture(evt.pointerId) } catch (e) {}
  }
  const pos = getCanvasPos(evt)

  for (let i = cropRegions.value.length - 1; i >= 0; i--) {
    const region = cropRegions.value[i]
    const handle = getResizeHandle(pos.x, pos.y, region)
    if (handle) {
      selectedId.value = region.id
      isResizing.value = true
      resizeHandle.value = handle
      resizeStartData.value = { startX: pos.x, startY: pos.y, region: { ...region } }
      redrawCanvas()
      return
    }
  }

  for (let i = cropRegions.value.length - 1; i >= 0; i--) {
    const region = cropRegions.value[i]
    if (pointInRegion(pos.x, pos.y, region)) {
      selectedId.value = region.id
      isMoving.value = true
      moveStartData.value = { startX: pos.x, startY: pos.y, region: { ...region } }
      redrawCanvas()
      return
    }
  }

  selectedId.value = null
  isDrawing.value = true
  drawStart.value = pos
  previewRect.value = null
  redrawCanvas()
}

function onPointerMove(evt) {
  evt.preventDefault()
  if (!originalImage.value) return
  const pos = getCanvasPos(evt)

  if (isDrawing.value) {
    const x = Math.min(drawStart.value.x, pos.x)
    const y = Math.min(drawStart.value.y, pos.y)
    const width = Math.abs(pos.x - drawStart.value.x)
    const height = Math.abs(pos.y - drawStart.value.y)
    previewRect.value = { x, y, width, height }
    redrawCanvas()
    return
  }

  if (isResizing.value && resizeStartData.value) {
    const { region, startX, startY } = resizeStartData.value
    const dx = (pos.x - startX) * scale.value
    const dy = (pos.y - startY) * scale.value
    const r = cropRegions.value.find(cr => cr.id === region.id)
    if (!r) return
    const old = { ...region }

    switch (resizeHandle.value) {
      case 'se':
        r.width = Math.max(10, old.width + dx)
        r.height = Math.max(10, old.height + dy)
        break
      case 'nw':
        r.x = Math.min(old.x + old.width - 10, old.x + dx)
        r.y = Math.min(old.y + old.height - 10, old.y + dy)
        r.width = old.width + old.x - r.x
        r.height = old.height + old.y - r.y
        break
      case 'ne':
        r.y = Math.min(old.y + old.height - 10, old.y + dy)
        r.width = Math.max(10, old.width + dx)
        r.height = old.height + old.y - r.y
        break
      case 'sw':
        r.x = Math.min(old.x + old.width - 10, old.x + dx)
        r.width = old.width + old.x - r.x
        r.height = Math.max(10, old.height + dy)
        break
      case 'e':
        r.width = Math.max(10, old.width + dx)
        break
      case 'w':
        r.x = Math.min(old.x + old.width - 10, old.x + dx)
        r.width = old.width + old.x - r.x
        break
      case 's':
        r.height = Math.max(10, old.height + dy)
        break
      case 'n':
        r.y = Math.min(old.y + old.height - 10, old.y + dy)
        r.height = old.height + old.y - r.y
        break
    }
    redrawCanvas()
    return
  }

  if (isMoving.value && moveStartData.value) {
    const { region, startX, startY } = moveStartData.value
    const dx = (pos.x - startX) * scale.value
    const dy = (pos.y - startY) * scale.value
    const r = cropRegions.value.find(cr => cr.id === region.id)
    if (!r) return
    r.x = Math.max(0, Math.round(region.x + dx))
    r.y = Math.max(0, Math.round(region.y + dy))
    redrawCanvas()
    return
  }

  // 空闲状态：检测鼠标悬停位置，更新光标样式
  const canvas = canvasRef.value
  if (canvas) {
    let cursor = 'crosshair'
    for (let i = cropRegions.value.length - 1; i >= 0; i--) {
      const region = cropRegions.value[i]
      const handle = getResizeHandle(pos.x, pos.y, region)
      if (handle) {
        cursor = HANDLE_CURSORS[handle] || 'pointer'
        break
      }
      if (pointInRegion(pos.x, pos.y, region)) {
        cursor = 'move'
        break
      }
    }
    canvas.style.cursor = cursor
  }
}

function onPointerUp(evt) {
  // 释放指针捕获
  if (evt && evt.pointerId !== undefined && evt.target) {
    try { evt.target.releasePointerCapture(evt.pointerId) } catch (e) {}
  }
  if (isDrawing.value) {
    isDrawing.value = false
    if (previewRect.value && previewRect.value.width > 10 && previewRect.value.height > 10) {
      const color = REGION_COLORS[(cropRegions.value.length) % REGION_COLORS.length]
      cropRegions.value.push({
        id: regionIdCounter++,
        x: Math.round(previewRect.value.x * scale.value),
        y: Math.round(previewRect.value.y * scale.value),
        width: Math.round(previewRect.value.width * scale.value),
        height: Math.round(previewRect.value.height * scale.value),
        color
      })
      success(`已添加裁剪区域 #${regionIdCounter - 1}`)
    }
    previewRect.value = null
    redrawCanvas()
  }
  isResizing.value = false
  resizeHandle.value = null
  resizeStartData.value = null
  isMoving.value = false
  moveStartData.value = null
}

function handleUpload(evt) {
  const file = evt.target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    warning('请选择图片文件')
    return
  }
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  cropRegions.value = []
  croppedResults.value = []
  selectedId.value = null
  regionIdCounter = 1

  uploadedFile.value = file
  previewUrl.value = URL.createObjectURL(file)

  const img = new Image()
  img.onload = () => {
    originalImage.value = img
    originalWidth.value = img.naturalWidth
    originalHeight.value = img.naturalHeight
    nextTick(() => setupCanvas())
  }
  img.src = previewUrl.value
}

function replaceImage() {
  fileInput.value.click()
}

function setupCanvas() {
  const container = canvasContainerRef.value
  const canvas = canvasRef.value
  if (!container || !canvas || !originalImage.value) return
  const containerWidth = container.clientWidth
  const ratio = originalHeight.value / originalWidth.value
  const displayWidth = containerWidth
  const displayHeight = containerWidth * ratio

  canvas.width = displayWidth
  canvas.height = displayHeight
  canvasDisplayWidth.value = displayWidth
  canvasDisplayHeight.value = displayHeight

  redrawCanvas()
}

function deleteRegion(id) {
  const idx = cropRegions.value.findIndex(r => r.id === id)
  if (idx !== -1) {
    cropRegions.value.splice(idx, 1)
    if (selectedId.value === id) selectedId.value = null
    redrawCanvas()
  }
}

function clearRegions() {
  cropRegions.value = []
  selectedId.value = null
  regionIdCounter = 1
  croppedResults.value.forEach(item => {
    if (item.url) URL.revokeObjectURL(item.url)
  })
  croppedResults.value = []
  redrawCanvas()
  warning('已清空所有裁剪区域')
}

function onKeyDown(evt) {
  if (evt.key === 'Delete' && selectedId.value !== null) {
    deleteRegion(selectedId.value)
  }
}

async function processCrop() {
  if (!originalImage.value || cropRegions.value.length === 0) {
    warning('请先上传图片并添加裁剪区域')
    return
  }
  isProcessing.value = true
  croppedResults.value.forEach(item => {
    if (item.url) URL.revokeObjectURL(item.url)
  })
  croppedResults.value = []

  const mimeType = uploadedFile.value?.type || 'image/png'
  const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png'

  for (let i = 0; i < cropRegions.value.length; i++) {
    const region = cropRegions.value[i]
    const canvas = document.createElement('canvas')
    canvas.width = region.width
    canvas.height = region.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(originalImage.value, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height)

    const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, 0.95))
    if (blob) {
      croppedResults.value.push({
        id: region.id,
        index: i + 1,
        blob,
        url: URL.createObjectURL(blob),
        width: region.width,
        height: region.height,
        ext
      })
    }
  }

  isProcessing.value = false
  success(`已裁剪 ${croppedResults.value.length} 张图片`)
}

function downloadSingle(item) {
  const baseName = uploadedFile.value?.name.replace(/\.[^/.]+$/, '') || '裁剪'
  const a = document.createElement('a')
  a.href = item.url
  a.download = `${baseName}_${item.index}.${item.ext}`
  a.click()
}

async function downloadZip() {
  if (croppedResults.value.length === 0) {
    warning('请先执行裁剪')
    return
  }
  const zip = new JSZip()
  const baseName = uploadedFile.value?.name.replace(/\.[^/.]+$/, '') || '裁剪'
  croppedResults.value.forEach(item => {
    zip.file(`${baseName}_${item.index}.${item.ext}`, item.blob)
  })
  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = `${baseName}_裁剪结果.zip`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

async function exportPdf() {
  if (croppedResults.value.length === 0) {
    warning('请先执行裁剪')
    return
  }
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 10
  const pageW = pdf.internal.pageSize.getWidth() - margin * 2
  const pageH = pdf.internal.pageSize.getHeight() - margin * 2

  for (let i = 0; i < croppedResults.value.length; i++) {
    const item = croppedResults.value[i]
    if (i > 0) pdf.addPage()
    const imgRatio = item.width / item.height
    const pageRatio = pageW / pageH
    let finalW, finalH
    if (imgRatio > pageRatio) {
      finalW = pageW
      finalH = pageW / imgRatio
    } else {
      finalH = pageH
      finalW = pageH * imgRatio
    }
    const x = margin + (pageW - finalW) / 2
    const y = margin + (pageH - finalH) / 2
    pdf.addImage(item.url, item.ext === 'png' ? 'PNG' : 'JPEG', x, y, finalW, finalH)
  }

  const blob = pdf.output('blob')
  const url = URL.createObjectURL(blob)
  const baseName = uploadedFile.value?.name.replace(/\.[^/.]+$/, '') || '裁剪'
  const a = document.createElement('a')
  a.href = url
  a.download = `${baseName}_裁剪结果.pdf`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

function selectRegion(id) {
  selectedId.value = id
  redrawCanvas()
}

function updateRegionFromInput(region) {
  region.width = Math.max(10, Math.round(region.width))
  region.height = Math.max(10, Math.round(region.height))
  region.x = Math.max(0, Math.round(region.x))
  region.y = Math.max(0, Math.round(region.y))
  redrawCanvas()
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', setupCanvas)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('resize', setupCanvas)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  croppedResults.value.forEach(item => {
    if (item.url) URL.revokeObjectURL(item.url)
  })
})
</script>