<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'

const originalImage = ref(null)
const originalUrl = ref('')
const originalWidth = ref(0)
const originalHeight = ref(0)

const isRemovingBg = ref(false)
const bgRemoved = ref(false)
const maskData = ref(null)
const tolerance = ref(35)

const selectedBgColor = ref('#438EDB')
const selectedSize = ref('one-inch')

const zoom = ref(100)
const offsetX = ref(0)
const offsetY = ref(0)

const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragStartOffsetX = ref(0)
const dragStartOffsetY = ref(0)

const showPrintLayout = ref(false)
const isGenerating = ref(false)

const SIZE_PRESETS = {
  'small-one-inch': { label: '小一寸', w: 260, h: 378, mmW: 22, mmH: 32, cols: 5, rows: 3 },
  'one-inch': { label: '一寸', w: 295, h: 413, mmW: 25, mmH: 35, cols: 4, rows: 2 },
  'big-one-inch': { label: '大一寸', w: 390, h: 567, mmW: 33, mmH: 48, cols: 3, rows: 2 },
  'small-two-inch': { label: '小二寸', w: 413, h: 531, mmW: 35, mmH: 45, cols: 2, rows: 2 },
  'two-inch': { label: '二寸', w: 413, h: 579, mmW: 35, mmH: 49, cols: 2, rows: 2 },
  'big-two-inch': { label: '大二寸', w: 413, h: 626, mmW: 35, mmH: 53, cols: 2, rows: 2 }
}

const BG_COLORS = [
  { label: '蓝色', value: '#438EDB', desc: '常用证件照' },
  { label: '红色', value: '#D50000', desc: '结婚登记等' },
  { label: '白色', value: '#FFFFFF', desc: '护照签证' },
  { label: '渐变蓝', value: 'gradient-blue', desc: '渐变背景' }
]

const currentSize = computed(() => SIZE_PRESETS[selectedSize.value])

const previewCanvas = ref(null)

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('图片大小不能超过10MB')
    return
  }

  originalImage.value = file
  originalUrl.value = URL.createObjectURL(file)
  bgRemoved.value = false
  maskData.value = null
  offsetX.value = 0
  offsetY.value = 0
  zoom.value = 100

  const img = new Image()
  img.onload = () => {
    originalWidth.value = img.width
    originalHeight.value = img.height
    nextTick(() => {
      renderOriginalPreview()
    })
  }
  img.src = originalUrl.value
}

const removeBackground = async () => {
  if (!originalUrl.value) return

  isRemovingBg.value = true

  await new Promise(resolve => setTimeout(resolve, 50))

  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = originalUrl.value
    })

    const maxProcessSize = 1200
    let processW = img.width
    let processH = img.height
    const scale = Math.min(1, maxProcessSize / Math.max(processW, processH))
    processW = Math.round(processW * scale)
    processH = Math.round(processH * scale)

    const canvas = document.createElement('canvas')
    canvas.width = processW
    canvas.height = processH
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, processW, processH)

    const imageData = ctx.getImageData(0, 0, processW, processH)
    const data = imageData.data
    const width = processW
    const height = processH

    const bgColors = detectBgColors(data, width, height)
    const mask = new Uint8Array(width * height)
    mask.fill(1)

    const tol = tolerance.value

    floodFillFromEdges(mask, data, bgColors, tol, width, height)

    fillInteriorHoles(mask, data, bgColors, tol, width, height)

    morphologicalClean(mask, width, height)

    const smoothed = gaussianSmoothMask(mask, width, height)

    maskData.value = { mask: smoothed, width, height, scale: 1 / scale }
    bgRemoved.value = true

    renderPreview()
  } catch (error) {
    console.error('背景移除失败:', error)
    alert('背景移除失败，请重试')
  } finally {
    isRemovingBg.value = false
  }
}

const colorDistance = (r1, g1, b1, r2, g2, b2) => {
  const rmean = (r1 + r2) / 2
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return Math.sqrt(
    (2 + rmean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rmean) / 256) * db * db
  )
}

const detectBgColors = (data, width, height) => {
  const colorBuckets = new Map()
  const quantize = 16

  const sampleRegion = (startX, startY, endX, endY) => {
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const pi = (y * width + x) * 4
        const r = Math.round(data[pi] / quantize) * quantize
        const g = Math.round(data[pi + 1] / quantize) * quantize
        const b = Math.round(data[pi + 2] / quantize) * quantize
        const key = `${r},${g},${b}`
        colorBuckets.set(key, (colorBuckets.get(key) || 0) + 1)
      }
    }
  }

  const edgeThickness = Math.max(3, Math.min(15, Math.floor(Math.min(width, height) * 0.03)))

  sampleRegion(0, 0, width, edgeThickness)
  sampleRegion(0, height - edgeThickness, width, height)
  sampleRegion(0, edgeThickness, edgeThickness, height - edgeThickness)
  sampleRegion(width - edgeThickness, edgeThickness, width, height - edgeThickness)

  const sorted = [...colorBuckets.entries()].sort((a, b) => b[1] - a[1])

  const results = []
  const minCount = sorted[0][1] * 0.1

  for (const [key, count] of sorted) {
    if (count < minCount) break
    const [r, g, b] = key.split(',').map(Number)
    let isSimilar = false
    for (const existing of results) {
      if (colorDistance(r, g, b, existing.r, existing.g, existing.b) < 40) {
        existing.r = Math.round((existing.r * existing.count + r * count) / (existing.count + count))
        existing.g = Math.round((existing.g * existing.count + g * count) / (existing.count + count))
        existing.b = Math.round((existing.b * existing.count + b * count) / (existing.count + count))
        existing.count += count
        isSimilar = true
        break
      }
    }
    if (!isSimilar) {
      results.push({ r, g, b, count })
    }
  }

  results.sort((a, b) => b.count - a.count)
  return results.slice(0, 3)
}

const floodFillFromEdges = (mask, data, bgColors, tol, width, height) => {
  const visited = new Uint8Array(width * height)
  const queue = []
  let qStart = 0

  for (let x = 0; x < width; x++) {
    queue.push(x)
    queue.push((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y++) {
    queue.push(y * width)
    queue.push(y * width + width - 1)
  }

  const maxDist = tol * 2.5

  while (qStart < queue.length) {
    const idx = queue[qStart++]
    if (visited[idx]) continue
    visited[idx] = 1

    const pi = idx * 4
    const pr = data[pi]
    const pg = data[pi + 1]
    const pb = data[pi + 2]

    let minDist = Infinity
    for (const bg of bgColors) {
      const dist = colorDistance(pr, pg, pb, bg.r, bg.g, bg.b)
      if (dist < minDist) minDist = dist
    }

    if (minDist <= maxDist) {
      mask[idx] = 0
      const x = idx % width
      const y = Math.floor(idx / width)
      if (x > 0 && !visited[idx - 1]) queue.push(idx - 1)
      if (x < width - 1 && !visited[idx + 1]) queue.push(idx + 1)
      if (y > 0 && !visited[idx - width]) queue.push(idx - width)
      if (y < height - 1 && !visited[idx + width]) queue.push(idx + width)
    }
  }
}

const fillInteriorHoles = (mask, data, bgColors, tol, width, height) => {
  const maxDist = tol * 2.0

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      if (mask[idx] === 0) continue

      const neighbors = [
        mask[(y - 1) * width + x],
        mask[(y + 1) * width + x],
        mask[y * width + x - 1],
        mask[y * width + x + 1]
      ]
      const bgNeighborCount = neighbors.filter(n => n === 0).length
      if (bgNeighborCount < 3) continue

      const pi = idx * 4
      let minDist = Infinity
      for (const bg of bgColors) {
        const dist = colorDistance(data[pi], data[pi + 1], data[pi + 2], bg.r, bg.g, bg.b)
        if (dist < minDist) minDist = dist
      }

      if (minDist <= maxDist * 0.8) {
        mask[idx] = 0
      }
    }
  }
}

const morphologicalClean = (mask, width, height) => {
  const eroded = new Uint8Array(width * height)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      if (mask[idx] === 1) {
        const allFg =
          mask[(y - 1) * width + x] === 1 &&
          mask[(y + 1) * width + x] === 1 &&
          mask[y * width + x - 1] === 1 &&
          mask[y * width + x + 1] === 1
        eroded[idx] = allFg ? 1 : 0
      }
    }
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      if (eroded[idx] === 1) {
        mask[(y - 1) * width + x] = 1
        mask[(y + 1) * width + x] = 1
        mask[y * width + x - 1] = 1
        mask[y * width + x + 1] = 1
        mask[idx] = 1
      }
    }
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      if (mask[idx] === 0) {
        const neighbors = [
          mask[(y - 1) * width + x],
          mask[(y + 1) * width + x],
          mask[y * width + x - 1],
          mask[y * width + x + 1]
        ]
        const fgCount = neighbors.filter(n => n === 1).length
        if (fgCount <= 1) {
          mask[idx] = 1
        }
      }
    }
  }
}

const gaussianSmoothMask = (mask, width, height) => {
  const temp = new Float32Array(width * height)
  const result = new Float32Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (mask[idx] === 1) {
        temp[idx] = 1.0
      } else {
        temp[idx] = 0.0
      }
    }
  }

  const blurPass = (src, dst, w, h, horizontal) => {
    const kernel = [0.05, 0.1, 0.2, 0.3, 0.2, 0.1, 0.05]
    const kSize = kernel.length
    const kHalf = Math.floor(kSize / 2)

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0
        let weightSum = 0
        for (let k = 0; k < kSize; k++) {
          const offset = k - kHalf
          let nx = x, ny = y
          if (horizontal) nx = x + offset
          else ny = y + offset

          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            sum += src[ny * w + nx] * kernel[k]
            weightSum += kernel[k]
          }
        }
        dst[y * w + x] = sum / weightSum
      }
    }
  }

  blurPass(temp, result, width, height, true)
  blurPass(result, temp, width, height, false)
  blurPass(temp, result, width, height, true)
  blurPass(result, temp, width, height, false)

  for (let i = 0; i < temp.length; i++) {
    result[i] = temp[i]
  }

  const edgeDist = computeEdgeDistance(mask, width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const d = edgeDist[idx]
      if (mask[idx] === 0 && d < 3) {
        const t = d / 3
        result[idx] = result[idx] * (1 - t) * (1 - t)
      } else if (mask[idx] === 1 && d < 2) {
        const t = d / 2
        result[idx] = 1 - (1 - result[idx]) * t * t
      }
    }
  }

  for (let i = 0; i < result.length; i++) {
    result[i] = Math.max(0, Math.min(1, result[i]))
  }

  return result
}

const computeEdgeDistance = (mask, width, height) => {
  const dist = new Float32Array(width * height)
  dist.fill(999)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const isEdge =
        (mask[idx] === 0 && (
          (x > 0 && mask[idx - 1] === 1) ||
          (x < width - 1 && mask[idx + 1] === 1) ||
          (y > 0 && mask[idx - width] === 1) ||
          (y < height - 1 && mask[idx + width] === 1)
        )) ||
        (mask[idx] === 1 && (
          (x > 0 && mask[idx - 1] === 0) ||
          (x < width - 1 && mask[idx + 1] === 0) ||
          (y > 0 && mask[idx - width] === 0) ||
          (y < height - 1 && mask[idx + width] === 0)
        ))

      if (isEdge) dist[idx] = 0
    }
  }

  for (let y = 1; y < height; y++) {
    for (let x = 1; x < width; x++) {
      const idx = y * width + x
      dist[idx] = Math.min(dist[idx], dist[(y - 1) * width + x] + 1, dist[y * width + x - 1] + 1)
    }
  }
  for (let y = height - 2; y >= 0; y--) {
    for (let x = width - 2; x >= 0; x--) {
      const idx = y * width + x
      dist[idx] = Math.min(dist[idx], dist[(y + 1) * width + x] + 1, dist[y * width + x + 1] + 1)
    }
  }

  return dist
}

const renderPreview = () => {
  if (!originalUrl.value || !maskData.value) return

  const canvas = previewCanvas.value
  if (!canvas) return

  const size = currentSize.value
  canvas.width = size.w
  canvas.height = size.h
  const ctx = canvas.getContext('2d')

  if (selectedBgColor.value === 'gradient-blue') {
    const grad = ctx.createLinearGradient(0, 0, 0, size.h)
    grad.addColorStop(0, '#67B2F5')
    grad.addColorStop(1, '#438EDB')
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = selectedBgColor.value
  }
  ctx.fillRect(0, 0, size.w, size.h)

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const mask = maskData.value
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = mask.width
    tempCanvas.height = mask.height
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.drawImage(img, 0, 0, mask.width, mask.height)
    const imgData = tempCtx.getImageData(0, 0, mask.width, mask.height)
    const pixels = imgData.data

    for (let i = 0; i < mask.mask.length; i++) {
      pixels[i * 4 + 3] = Math.round(mask.mask[i] * 255)
    }

    tempCtx.putImageData(imgData, 0, 0)

    const z = zoom.value / 100
    const drawW = mask.width * z * mask.scale
    const drawH = mask.height * z * mask.scale
    const drawX = (size.w - drawW) / 2 + offsetX.value
    const drawY = (size.h - drawH) / 2 + offsetY.value

    ctx.drawImage(tempCanvas, drawX, drawY, drawW, drawH)
  }
  img.src = originalUrl.value
}

const renderOriginalPreview = () => {
  if (!originalUrl.value) return

  const canvas = previewCanvas.value
  if (!canvas) return

  const size = currentSize.value
  canvas.width = size.w
  canvas.height = size.h
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#f3f4f6'
  ctx.fillRect(0, 0, size.w, size.h)

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const z = zoom.value / 100
    const drawW = img.width * z
    const drawH = img.height * z
    const drawX = (size.w - drawW) / 2 + offsetX.value
    const drawY = (size.h - drawH) / 2 + offsetY.value
    ctx.drawImage(img, drawX, drawY, drawW, drawH)
  }
  img.src = originalUrl.value
}

const onCanvasMouseDown = (e) => {
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  dragStartOffsetX.value = offsetX.value
  dragStartOffsetY.value = offsetY.value
}

const onCanvasMouseMove = (e) => {
  if (!isDragging.value) return
  offsetX.value = dragStartOffsetX.value + (e.clientX - dragStartX.value)
  offsetY.value = dragStartOffsetY.value + (e.clientY - dragStartY.value)
  if (bgRemoved.value) {
    renderPreview()
  } else {
    renderOriginalPreview()
  }
}

const onCanvasMouseUp = () => {
  isDragging.value = false
}

const onCanvasTouchStart = (e) => {
  if (e.touches.length === 1) {
    isDragging.value = true
    dragStartX.value = e.touches[0].clientX
    dragStartY.value = e.touches[0].clientY
    dragStartOffsetX.value = offsetX.value
    dragStartOffsetY.value = offsetY.value
  }
}

const onCanvasTouchMove = (e) => {
  if (!isDragging.value || e.touches.length !== 1) return
  e.preventDefault()
  offsetX.value = dragStartOffsetX.value + (e.touches[0].clientX - dragStartX.value)
  offsetY.value = dragStartOffsetY.value + (e.touches[0].clientY - dragStartY.value)
  if (bgRemoved.value) {
    renderPreview()
  } else {
    renderOriginalPreview()
  }
}

const onCanvasTouchEnd = () => {
  isDragging.value = false
}

const resetPosition = () => {
  offsetX.value = 0
  offsetY.value = 0
  zoom.value = 100
  if (bgRemoved.value) {
    renderPreview()
  } else {
    renderOriginalPreview()
  }
}

const onBgColorChange = () => {
  if (bgRemoved.value) renderPreview()
}

const onSizeChange = () => {
  if (bgRemoved.value) {
    renderPreview()
  } else {
    renderOriginalPreview()
  }
}

const onZoomChange = () => {
  if (bgRemoved.value) {
    renderPreview()
  } else {
    renderOriginalPreview()
  }
}

const onToleranceChange = () => {
  if (bgRemoved.value) {
    removeBackground()
  }
}

const generateFinalImage = (targetWidth, targetHeight) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')

    if (selectedBgColor.value === 'gradient-blue') {
      const grad = ctx.createLinearGradient(0, 0, 0, targetHeight)
      grad.addColorStop(0, '#67B2F5')
      grad.addColorStop(1, '#438EDB')
      ctx.fillStyle = grad
    } else {
      ctx.fillStyle = selectedBgColor.value
    }
    ctx.fillRect(0, 0, targetWidth, targetHeight)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const mask = maskData.value
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = mask.width
      tempCanvas.height = mask.height
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.drawImage(img, 0, 0, mask.width, mask.height)
      const imgData = tempCtx.getImageData(0, 0, mask.width, mask.height)
      const pixels = imgData.data

      for (let i = 0; i < mask.mask.length; i++) {
        pixels[i * 4 + 3] = Math.round(mask.mask[i] * 255)
      }

      tempCtx.putImageData(imgData, 0, 0)

      const z = zoom.value / 100
      const drawW = mask.width * z * mask.scale
      const drawH = mask.height * z * mask.scale
      const drawX = (targetWidth - drawW) / 2 + offsetX.value * (targetWidth / currentSize.value.w)
      const drawY = (targetHeight - drawH) / 2 + offsetY.value * (targetHeight / currentSize.value.h)

      ctx.drawImage(tempCanvas, drawX, drawY, drawW, drawH)
      resolve(canvas)
    }
    img.src = originalUrl.value
  })
}

const downloadSingle = async () => {
  if (!bgRemoved.value) return
  isGenerating.value = true
  try {
    const size = currentSize.value
    const canvas = await generateFinalImage(size.w, size.h)
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/jpeg', 0.95)
    link.download = `证件照_${size.label}_${selectedBgColor.value === 'gradient-blue' ? '渐变蓝' : selectedBgColor.value === '#FFFFFF' ? '白底' : selectedBgColor.value === '#D50000' ? '红底' : '蓝底'}.jpg`
    link.click()
  } finally {
    isGenerating.value = false
  }
}

const downloadPrintLayout = async () => {
  if (!bgRemoved.value) return
  isGenerating.value = true
  try {
    const size = currentSize.value
    const singleCanvas = await generateFinalImage(size.w, size.h)

    const A4_W = 2480
    const A4_H = 3508
    const a4Canvas = document.createElement('canvas')
    a4Canvas.width = A4_W
    a4Canvas.height = A4_H
    const a4Ctx = a4Canvas.getContext('2d')
    a4Ctx.fillStyle = '#FFFFFF'
    a4Ctx.fillRect(0, 0, A4_W, A4_H)

    const cols = size.cols
    const rows = size.rows
    const gapX = Math.round((A4_W - cols * size.w) / (cols + 1))
    const gapY = Math.round((A4_H - rows * size.h) / (rows + 1))

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = gapX + col * (size.w + gapX)
        const y = gapY + row * (size.h + gapY)
        a4Ctx.drawImage(singleCanvas, x, y, size.w, size.h)
      }
    }

    const link = document.createElement('a')
    link.href = a4Canvas.toDataURL('image/jpeg', 0.95)
    link.download = `证件照排版_${size.label}_A4.jpg`
    link.click()
  } finally {
    isGenerating.value = false
  }
}

const renderMiniPreview = (canvas) => {
  if (!bgRemoved.value || !maskData.value) return
  const size = currentSize.value
  canvas.width = size.w
  canvas.height = size.h
  const ctx = canvas.getContext('2d')

  if (selectedBgColor.value === 'gradient-blue') {
    const grad = ctx.createLinearGradient(0, 0, 0, size.h)
    grad.addColorStop(0, '#67B2F5')
    grad.addColorStop(1, '#438EDB')
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = selectedBgColor.value
  }
  ctx.fillRect(0, 0, size.w, size.h)

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const mask = maskData.value
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = mask.width
    tempCanvas.height = mask.height
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.drawImage(img, 0, 0, mask.width, mask.height)
    const imgData = tempCtx.getImageData(0, 0, mask.width, mask.height)
    const pixels = imgData.data
    for (let i = 0; i < mask.mask.length; i++) {
      pixels[i * 4 + 3] = Math.round(mask.mask[i] * 255)
    }
    tempCtx.putImageData(imgData, 0, 0)
    const z = zoom.value / 100
    const drawW = mask.width * z * mask.scale
    const drawH = mask.height * z * mask.scale
    const drawX = (size.w - drawW) / 2 + offsetX.value
    const drawY = (size.h - drawH) / 2 + offsetY.value
    ctx.drawImage(tempCanvas, drawX, drawY, drawW, drawH)
  }
  img.src = originalUrl.value
}

const clearAll = () => {
  if (originalUrl.value) URL.revokeObjectURL(originalUrl.value)
  originalImage.value = null
  originalUrl.value = ''
  originalWidth.value = 0
  originalHeight.value = 0
  bgRemoved.value = false
  maskData.value = null
  offsetX.value = 0
  offsetY.value = 0
  zoom.value = 100
}

onMounted(() => {
  window.addEventListener('mousemove', onCanvasMouseMove)
  window.addEventListener('mouseup', onCanvasMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onCanvasMouseMove)
  window.removeEventListener('mouseup', onCanvasMouseUp)
  if (originalUrl.value) URL.revokeObjectURL(originalUrl.value)
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-2 dark:text-white">证件照制作</h1>
    <p class="text-gray-600 dark:text-gray-400 mb-8">免费在线制作证件照，支持换底色、调尺寸、排版打印</p>

    <!-- 上传区域 -->
    <div v-if="!originalUrl" class="mb-8">
      <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p class="text-gray-600 dark:text-gray-400 mb-2 text-lg">上传人像照片</p>
        <p class="text-sm text-gray-500 dark:text-gray-500 mb-4">建议使用纯色背景的正面免冠照，效果更佳</p>
        <input type="file" accept="image/*" class="hidden" id="photoInput" @change="handleFileSelect">
        <label for="photoInput" class="inline-block px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 cursor-pointer transition-all shadow-md hover:shadow-lg text-lg">
          选择照片
        </label>
      </div>
    </div>

    <!-- 编辑区域 -->
    <div v-else>
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- 左侧设置面板 -->
        <div class="lg:w-80 flex-shrink-0 space-y-4">
          <!-- 抠图设置 -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md">
            <h3 class="font-semibold text-gray-800 dark:text-white mb-4">智能抠图</h3>
            <button
              @click="removeBackground"
              :disabled="isRemovingBg"
              class="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg font-medium hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 transition-all"
            >
              {{ isRemovingBg ? '抠图中...' : bgRemoved ? '重新抠图' : '一键抠图' }}
            </button>
            <div v-if="bgRemoved" class="mt-4">
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">容差: {{ tolerance }}</label>
              <input type="range" v-model="tolerance" min="10" max="60" @change="onToleranceChange" class="w-full">
              <p class="text-xs text-gray-400 mt-1">容差越大去除越多，越小保留越多</p>
            </div>
          </div>

          <!-- 背景颜色 -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md">
            <h3 class="font-semibold text-gray-800 dark:text-white mb-4">背景颜色</h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="bg in BG_COLORS"
                :key="bg.value"
                @click="selectedBgColor = bg.value; onBgColorChange()"
                :class="[
                  'p-3 rounded-lg border-2 transition-all text-left',
                  selectedBgColor === bg.value
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                ]"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-full border border-gray-200 flex-shrink-0"
                    :style="bg.value === 'gradient-blue'
                      ? 'background: linear-gradient(135deg, #67B2F5, #438EDB)'
                      : `background-color: ${bg.value}`"
                  ></div>
                  <div>
                    <p class="text-sm font-medium text-gray-800 dark:text-white">{{ bg.label }}</p>
                    <p class="text-xs text-gray-400">{{ bg.desc }}</p>
                  </div>
                </div>
              </button>
            </div>
            <div class="mt-3 flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">自定义:</label>
              <input
                type="color"
                v-model="selectedBgColor"
                @input="onBgColorChange"
                class="w-8 h-8 rounded cursor-pointer"
              >
              <span class="text-xs text-gray-400">{{ selectedBgColor }}</span>
            </div>
          </div>

          <!-- 尺寸选择 -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md">
            <h3 class="font-semibold text-gray-800 dark:text-white mb-4">照片尺寸</h3>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="(preset, key) in SIZE_PRESETS"
                :key="key"
                @click="selectedSize = key; onSizeChange()"
                :class="[
                  'py-2 px-1 rounded-lg border-2 text-center transition-all',
                  selectedSize === key
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                ]"
              >
                <p class="text-sm font-medium">{{ preset.label }}</p>
                <p class="text-xs text-gray-400">{{ preset.mmW }}×{{ preset.mmH }}mm</p>
              </button>
            </div>
          </div>

          <!-- 位置调整 -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md">
            <h3 class="font-semibold text-gray-800 dark:text-white mb-4">位置调整</h3>
            <div class="mb-3">
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">缩放: {{ zoom }}%</label>
              <input type="range" v-model="zoom" min="50" max="300" @input="onZoomChange" class="w-full">
            </div>
            <p class="text-xs text-gray-400 mb-2">拖拽预览图可调整位置</p>
            <button @click="resetPosition" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              重置位置
            </button>
          </div>

          <!-- 操作按钮 -->
          <div class="space-y-2">
            <button
              @click="downloadSingle"
              :disabled="!bgRemoved || isGenerating"
              class="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              下载证件照
            </button>
            <button
              @click="downloadPrintLayout"
              :disabled="!bgRemoved || isGenerating"
              class="w-full py-3 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              下载排版打印（A4纸）
            </button>
            <button
              @click="clearAll"
              class="w-full py-2 text-gray-500 hover:text-red-500 text-sm transition-colors"
            >
              重新上传
            </button>
          </div>
        </div>

        <!-- 右侧预览区域 -->
        <div class="flex-1">
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <h3 class="font-semibold text-gray-800 dark:text-white mb-4">预览</h3>

            <div class="flex flex-col items-center">
              <!-- 证件照预览 -->
              <div class="relative inline-block mb-6">
                <canvas
                  ref="previewCanvas"
                  class="border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-move shadow-lg"
                  :width="currentSize.w"
                  :height="currentSize.h"
                  :style="{
                    width: Math.min(currentSize.w, 400) + 'px',
                    height: Math.min(currentSize.h, 400 * currentSize.h / currentSize.w) + 'px'
                  }"
                  @mousedown="onCanvasMouseDown"
                  @touchstart="onCanvasTouchStart"
                  @touchmove="onCanvasTouchMove"
                  @touchend="onCanvasTouchEnd"
                ></canvas>
                <div v-if="!bgRemoved && originalUrl" class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                  <p class="text-white text-sm">请先点击"一键抠图"</p>
                </div>
                <div v-if="isRemovingBg" class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div class="text-center">
                    <div class="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p class="text-white text-sm">智能抠图中...</p>
                  </div>
                </div>
              </div>

              <!-- 尺寸信息 -->
              <div class="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                <p>{{ currentSize.label }} · {{ currentSize.mmW }}×{{ currentSize.mmH }}mm · {{ currentSize.w }}×{{ currentSize.h }}px</p>
              </div>

              <!-- 排版预览 -->
              <div v-if="bgRemoved" class="w-full">
                <h4 class="font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">A4排版预览 ({{ currentSize.cols }}×{{ currentSize.rows }} = {{ currentSize.cols * currentSize.rows }}张)</h4>
                <div class="flex justify-center">
                  <div class="bg-white border border-gray-300 shadow-md" style="width: 200px; height: 283px; padding: 8px; position: relative;">
                    <div
                      v-for="row in currentSize.rows"
                      :key="'row-' + row"
                      class="flex justify-center"
                      :style="{ gap: '4px', marginBottom: '4px' }"
                    >
                      <div
                        v-for="col in currentSize.cols"
                        :key="'col-' + col"
                        class="border border-gray-200 overflow-hidden"
                        :style="{
                          width: (184 - (currentSize.cols - 1) * 4) / currentSize.cols + 'px',
                          height: (267 - (currentSize.rows - 1) * 4) / currentSize.rows + 'px'
                        }"
                      >
                        <canvas
                          :ref="el => { if(el) renderMiniPreview(el) }"
                          class="w-full h-full"
                        ></canvas>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
      <h3 class="font-semibold text-gray-800 dark:text-white mb-4">使用说明</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center">
          <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <span class="text-primary-600 dark:text-primary-400 font-bold">1</span>
          </div>
          <h4 class="font-medium text-gray-800 dark:text-white mb-1">上传照片</h4>
          <p class="text-sm text-gray-500 dark:text-gray-400">选择一张正面免冠照片，建议使用纯色背景</p>
        </div>
        <div class="text-center">
          <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <span class="text-primary-600 dark:text-primary-400 font-bold">2</span>
          </div>
          <h4 class="font-medium text-gray-800 dark:text-white mb-1">抠图换底</h4>
          <p class="text-sm text-gray-500 dark:text-gray-400">一键智能抠图，选择需要的背景颜色</p>
        </div>
        <div class="text-center">
          <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <span class="text-primary-600 dark:text-primary-400 font-bold">3</span>
          </div>
          <h4 class="font-medium text-gray-800 dark:text-white mb-1">下载打印</h4>
          <p class="text-sm text-gray-500 dark:text-gray-400">下载单张证件照或A4排版图，直接打印使用</p>
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
