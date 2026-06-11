<script setup>
import { ref, nextTick, reactive, shallowRef, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import jsPDF from 'jspdf'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const pdfFile = ref(null)
const pdfDoc = shallowRef(null)
const currentPage = ref(1)
const totalPages = ref(0)
const SCALE = 1.5

const textBlocksMap = reactive({})
const pageEditsMap = reactive({})
const pageDrawingsMap = reactive({})

const editMode = ref('edit')
watch(editMode, () => { selectedAddTextIndex.value = -1 })
const isProcessing = ref(false)
const showSuccess = ref(false)
const isLoading = ref(false)
const loadProgress = ref(0)

const editingBlockIndex = ref(-1)
const editBlockText = ref('')
const editBlockFontSize = ref(16)
const editBlockColor = ref('#000000')
const editAreaHeight = ref(0)

const addTextContent = ref('')
const addTextFontSize = ref(16)
const addTextColor = ref('#000000')
const selectedAddTextIndex = ref(-1)

const drawColor = ref('#ff0000')
const drawWidth = ref(3)
const isDrawing = ref(false)
let currentDrawPath = []

// 删除页面功能
const deletedPages = reactive(new Set())
const deletedPageList = computed(() => [...deletedPages].sort((a, b) => a - b))
const remainingPages = computed(() => totalPages.value - deletedPages.size)
const isCurrentPageDeleted = computed(() => deletedPages.has(currentPage.value))

const deleteCurrentPage = () => {
  if (remainingPages.value <= 1) {
    alert('至少需要保留一页')
    return
  }
  const pageNum = currentPage.value
  deletedPages.add(pageNum)

  // 清理该页的编辑数据
  delete textBlocksMap[pageNum]
  delete pageEditsMap[pageNum]
  delete pageDrawingsMap[pageNum]

  // 跳转到下一个未删除的页面
  let next = pageNum + 1
  while (next <= totalPages.value && deletedPages.has(next)) next++
  if (next > totalPages.value) {
    next = pageNum - 1
    while (next >= 1 && deletedPages.has(next)) next--
  }
  if (next >= 1 && next <= totalPages.value) {
    currentPage.value = next
    renderCurrentPage()
  }
}

const deleteUnselectedPages = () => {
  if (selectedPages.size === 0) return

  // 找出所有未删除但未被选中的页面
  const toDelete = []
  for (let i = 1; i <= totalPages.value; i++) {
    if (!deletedPages.has(i) && !selectedPages.has(i)) {
      toDelete.push(i)
    }
  }

  if (toDelete.length === 0) {
    alert('没有可删除的页面')
    return
  }

  for (const pageNum of toDelete) {
    deletedPages.add(pageNum)
    delete textBlocksMap[pageNum]
    delete pageEditsMap[pageNum]
    delete pageDrawingsMap[pageNum]
  }
  selectedPages.clear()
  selectMode.value = false

  if (deletedPages.has(currentPage.value)) {
    let next = currentPage.value + 1
    while (next <= totalPages.value && deletedPages.has(next)) next++
    if (next > totalPages.value) {
      next = currentPage.value - 1
      while (next >= 1 && deletedPages.has(next)) next--
    }
    if (next >= 1 && next <= totalPages.value) {
      currentPage.value = next
      renderCurrentPage()
    }
  }
}

const restoreAllPages = () => {
  deletedPages.clear()
}

// 缩略图预览
const THUMB_SCALE = 0.6
const pageThumbnails = reactive({})
const thumbnailsLoaded = ref(false)
const selectedPages = reactive(new Set())
const selectMode = ref(false)

const hasSelection = computed(() => selectedPages.size > 0)

const generateAllThumbnails = async () => {
  if (!pdfDoc.value) return
  thumbnailsLoaded.value = false

  for (let i = 1; i <= totalPages.value; i++) {
    const page = await pdfDoc.value.getPage(i)
    const viewport = page.getViewport({ scale: THUMB_SCALE })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')

    await page.render({ canvasContext: ctx, viewport }).promise
    pageThumbnails[i] = canvas.toDataURL('image/jpeg', 0.92)
  }
  thumbnailsLoaded.value = true
}

const toggleSelectPage = (pageNum) => {
  if (selectedPages.has(pageNum)) {
    selectedPages.delete(pageNum)
    if (selectedPages.size === 0) selectMode.value = false
  } else {
    selectedPages.add(pageNum)
  }
}

const goToPage = (pageNum) => {
  if (deletedPages.has(pageNum)) return
  if (pageNum === currentPage.value) return
  saveBlockEdit()
  currentPage.value = pageNum
  renderCurrentPage()
}

const handleThumbnailClick = (pageNum, event) => {
  if (event.ctrlKey || event.metaKey || selectMode.value) {
    toggleSelectPage(pageNum)
  } else {
    goToPage(pageNum)
  }
}

const enterSelectMode = () => {
  selectMode.value = true
}

const exitSelectMode = () => {
  selectMode.value = false
  selectedPages.clear()
}

const selectAllPages = () => {
  for (let i = 1; i <= totalPages.value; i++) {
    if (!deletedPages.has(i)) {
      selectedPages.add(i)
    }
  }
  selectMode.value = true
}

const deleteSelectedPages = () => {
  if (selectedPages.size === 0) return
  const remaining = totalPages.value - deletedPages.size - selectedPages.size
  if (remaining < 1) {
    alert('至少需要保留一页')
    return
  }

  for (const pageNum of selectedPages) {
    deletedPages.add(pageNum)
    delete textBlocksMap[pageNum]
    delete pageEditsMap[pageNum]
    delete pageDrawingsMap[pageNum]
  }
  selectedPages.clear()
  selectMode.value = false

  // 如果当前页被删除了，跳转到最近的未删除页
  if (deletedPages.has(currentPage.value)) {
    let next = currentPage.value + 1
    while (next <= totalPages.value && deletedPages.has(next)) next++
    if (next > totalPages.value) {
      next = currentPage.value - 1
      while (next >= 1 && deletedPages.has(next)) next--
    }
    if (next >= 1 && next <= totalPages.value) {
      currentPage.value = next
      renderCurrentPage()
    }
  }
}


const mainCanvasRef = ref(null)
const drawCanvasRef = ref(null)
const containerRef = ref(null)
const inlineEditRef = ref(null)

let mainCtx = null
let drawCtx = null
let originalPageImageData = null
let displayScale = 1

const currentTextBlocks = computed(() => textBlocksMap[currentPage.value] || [])
const currentPageEdits = computed(() => pageEditsMap[currentPage.value] || [])
const currentPageDrawings = computed(() => pageDrawingsMap[currentPage.value] || [])

const editedBlockSet = computed(() => {
  return new Set(
    currentPageEdits.value
      .filter(e => e.type === 'editBlock')
      .map(e => e.blockIndex)
  )
})

const totalEditCount = computed(() => {
  return Object.values(pageEditsMap).flat().length
})

const getTextBlocks = (page) => {
  if (!textBlocksMap[page]) textBlocksMap[page] = []
  return textBlocksMap[page]
}

const getPageEdits = (page) => {
  if (!pageEditsMap[page]) pageEditsMap[page] = []
  return pageEditsMap[page]
}

const getPageDrawings = (page) => {
  if (!pageDrawingsMap[page]) pageDrawingsMap[page] = []
  return pageDrawingsMap[page]
}

const updateDisplayScale = () => {
  const canvas = mainCanvasRef.value
  const container = containerRef.value
  if (canvas && container) {
    const rect = canvas.getBoundingClientRect()
    displayScale = rect.width / canvas.width
  }
}

const wrapTextLine = (ctx, text, maxWidth) => {
  if (!text) return ['']
  if (maxWidth <= 0) return [text]

  const result = []
  let currentLine = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const testLine = currentLine + char
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && currentLine !== '') {
      result.push(currentLine)
      currentLine = char
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) {
    result.push(currentLine)
  }

  return result.length > 0 ? result : ['']
}

const getBlockOverlayStyle = (block, bIndex) => {
  const canvas = mainCanvasRef.value
  if (!canvas) return {}
  const cw = canvas.width
  const ch = canvas.height

  let height = block.height
  const edits = getPageEdits(currentPage.value)
  const existing = edits.find(e => e.type === 'editBlock' && e.blockIndex === bIndex)
  if (existing) {
    const textLines = existing.newText.split('\n')
    const lineHeight = existing.fontSize * 1.3
    const totalLines = textLines.reduce((count, line) => {
      mainCtx.font = `${existing.fontSize}px sans-serif`
      const wrapped = wrapTextLine(mainCtx, line, block.width)
      return count + wrapped.length
    }, 0)
    const textHeight = totalLines * lineHeight + 4
    height = Math.max(height, textHeight)
  }

  return {
    left: `${(block.x / cw) * 100}%`,
    top: `${(block.y / ch) * 100}%`,
    width: `${(block.width / cw) * 100}%`,
    height: `${(height / ch) * 100}%`,
  }
}

const getInlineEditStyle = () => {
  if (editingBlockIndex.value < 0) return {}
  const block = currentTextBlocks.value[editingBlockIndex.value]
  if (!block) return {}
  const canvas = mainCanvasRef.value
  if (!canvas) return {}
  const cw = canvas.width
  const ch = canvas.height

  const displayFontSize = block.fontSize * displayScale
  const minDisplayHeight = block.height * displayScale
  const displayHeight = Math.max(minDisplayHeight, editAreaHeight.value)

  return {
    left: `${(block.x / cw) * 100}%`,
    top: `${(block.y / ch) * 100}%`,
    width: `${Math.max((block.width / cw) * 100, 30)}%`,
    height: `${(displayHeight / (ch * displayScale)) * 100}%`,
    fontSize: `${displayFontSize}px`,
    lineHeight: `${displayFontSize * 1.3}px`,
  }
}

const groupTextItems = (items) => {
  if (!items || items.length === 0) return []

  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x)

  const lines = []
  let currentLine = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i]
    const refItem = currentLine[0]
    const yThreshold = Math.max(refItem.fontSize, item.fontSize) * 0.6

    if (Math.abs(item.y - refItem.y) <= yThreshold) {
      currentLine.push(item)
    } else {
      lines.push(currentLine.sort((a, b) => a.x - b.x))
      currentLine = [item]
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.sort((a, b) => a.x - b.x))
  }

  const blocks = []
  if (lines.length === 0) return blocks

  let currentBlockLines = [lines[0]]

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const prevLine = currentBlockLines[currentBlockLines.length - 1]
    const avgFontSize = (line[0].fontSize + prevLine[0].fontSize) / 2
    const lineSpacing = line[0].y - prevLine[0].y
    const maxSpacing = avgFontSize * 2.2

    const xDiff = Math.abs(line[0].x - prevLine[0].x)
    const xThreshold = avgFontSize * 3

    if (lineSpacing <= maxSpacing && xDiff <= xThreshold) {
      currentBlockLines.push(line)
    } else {
      blocks.push(finalizeBlock(currentBlockLines))
      currentBlockLines = [line]
    }
  }
  blocks.push(finalizeBlock(currentBlockLines))

  return blocks
}

const finalizeBlock = (lines) => {
  const allItems = lines.flat()
  const minX = Math.min(...allItems.map(i => i.x))
  const minY = Math.min(...allItems.map(i => i.y))
  const maxX = Math.max(...allItems.map(i => i.x + i.width))
  const maxY = Math.max(...allItems.map(i => i.y + i.height))
  const avgFontSize = allItems.reduce((sum, i) => sum + i.fontSize, 0) / allItems.length

  const lineTexts = lines.map(line => {
    let text = ''
    for (let j = 0; j < line.length; j++) {
      if (j > 0) {
        const gap = line[j].x - (line[j - 1].x + line[j - 1].width)
        const spaceThreshold = line[j].fontSize * 0.15
        if (gap > spaceThreshold) {
          text += ' '
        }
      }
      text += line[j].text
    }
    return text
  })

  const text = lineTexts.join('\n')

  const lineInfos = lines.map(line => ({
    y: line[0].y,
    x: line[0].x,
    fontSize: line[0].fontSize,
    items: line,
  }))

  return {
    text,
    lines: lineInfos,
    x: minX - 2,
    y: minY - 2,
    width: (maxX - minX) + 4,
    height: (maxY - minY) + 4,
    fontSize: avgFontSize,
    originalItems: allItems,
  }
}

const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file || file.type !== 'application/pdf') {
    alert('请选择有效的PDF文件')
    return
  }

  pdfFile.value = file
  Object.keys(textBlocksMap).forEach(k => delete textBlocksMap[k])
  Object.keys(pageEditsMap).forEach(k => delete pageEditsMap[k])
  Object.keys(pageDrawingsMap).forEach(k => delete pageDrawingsMap[k])
  editingBlockIndex.value = -1

  isLoading.value = true
  loadProgress.value = 0

  try {
    const arrayBuffer = await file.arrayBuffer()
    pdfDoc.value = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    totalPages.value = pdfDoc.value.numPages
    currentPage.value = 1
    loadProgress.value = 30
    await nextTick()
    await renderCurrentPage()
    loadProgress.value = 70
    await generateAllThumbnails()
    loadProgress.value = 100
  } catch (error) {
    console.error('PDF加载失败:', error)
    alert('PDF加载失败: ' + (error?.message || '未知错误，请重试'))
  } finally {
    isLoading.value = false
  }
}

const clearFile = () => {
  pdfFile.value = null
  pdfDoc.value = null
  Object.keys(textBlocksMap).forEach(k => delete textBlocksMap[k])
  Object.keys(pageEditsMap).forEach(k => delete pageEditsMap[k])
  Object.keys(pageDrawingsMap).forEach(k => delete pageDrawingsMap[k])
  deletedPages.clear()
  Object.keys(pageThumbnails).forEach(k => delete pageThumbnails[k])
  thumbnailsLoaded.value = false
  editingBlockIndex.value = -1
  currentPage.value = 1
  totalPages.value = 0
  originalPageImageData = null
}

const extractAndGroupText = async (pageNum) => {
  if (textBlocksMap[pageNum] && textBlocksMap[pageNum].length > 0) return textBlocksMap[pageNum]

  const page = await pdfDoc.value.getPage(pageNum)
  const viewport = page.getViewport({ scale: SCALE })
  const textContent = await page.getTextContent()

  const items = []
  for (const item of textContent.items) {
    if (!item.str || item.str.trim() === '') continue

    const tx = item.transform
    const fontSize = Math.max(Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]) * SCALE, 1)

    const [a, b, c, d, e, f] = viewport.transform
    const canvasX = a * tx[4] + c * tx[5] + e
    const canvasY = b * tx[4] + d * tx[5] + f

    const itemWidth = (item.width != null && item.width > 0)
      ? item.width * SCALE
      : fontSize * item.str.length * 0.6

    items.push({
      text: item.str,
      x: canvasX,
      y: canvasY - fontSize,
      width: Math.max(itemWidth, fontSize * 0.5),
      height: fontSize * 1.3,
      fontSize: fontSize,
      fontName: item.fontName || '',
    })
  }

  const blocks = groupTextItems(items)
  textBlocksMap[pageNum] = blocks
  return blocks
}

const renderCurrentPage = async () => {
  if (!pdfDoc.value) return

  const page = await pdfDoc.value.getPage(currentPage.value)
  const viewport = page.getViewport({ scale: SCALE })

  await nextTick()

  let canvas = mainCanvasRef.value
  if (!canvas) {
    await new Promise(resolve => setTimeout(resolve, 150))
    canvas = mainCanvasRef.value
    if (!canvas) return
  }

  canvas.width = viewport.width
  canvas.height = viewport.height
  mainCtx = canvas.getContext('2d')

  await page.render({
    canvasContext: mainCtx,
    viewport: viewport
  }).promise

  originalPageImageData = mainCtx.getImageData(0, 0, canvas.width, canvas.height)

  await extractAndGroupText(currentPage.value)

  editingBlockIndex.value = -1
  redrawPage()

  await nextTick()
  setupDrawCanvas()
  updateDisplayScale()
}

const setupDrawCanvas = () => {
  const drawCanvas = drawCanvasRef.value
  const mainCanvas = mainCanvasRef.value
  if (!drawCanvas || !mainCanvas) return

  drawCanvas.width = mainCanvas.width
  drawCanvas.height = mainCanvas.height
  drawCtx = drawCanvas.getContext('2d')
}

const redrawPage = () => {
  if (!mainCtx || !originalPageImageData) return

  mainCtx.putImageData(originalPageImageData, 0, 0)

  const edits = getPageEdits(currentPage.value)
  const drawings = getPageDrawings(currentPage.value)

  for (const edit of edits) {
    if (edit.type === 'editBlock') {
      const blocks = getTextBlocks(currentPage.value)
      const block = blocks[edit.blockIndex]
      if (!block) continue

      mainCtx.font = `${edit.fontSize}px sans-serif`

      const startX = block.lines[0].x
      const startY = block.lines[0].y + 2
      const maxWidth = block.width
      const lineHeight = edit.fontSize * 1.3

      const allWrappedLines = []
      const textLines = edit.newText.split('\n')
      for (const textLine of textLines) {
        const wrapped = wrapTextLine(mainCtx, textLine, maxWidth)
        allWrappedLines.push(...wrapped)
      }

      const textHeight = allWrappedLines.length * lineHeight

      mainCtx.fillStyle = '#ffffff'
      mainCtx.fillRect(
        block.x - 4,
        block.y - 4,
        block.width + 8,
        Math.max(block.height + 8, textHeight + 8)
      )

      mainCtx.fillStyle = edit.color
      mainCtx.textBaseline = 'top'
      allWrappedLines.forEach((line, i) => {
        mainCtx.fillText(line, startX, startY + i * lineHeight)
      })
    } else if (edit.type === 'addText') {
      mainCtx.font = `${edit.fontSize}px sans-serif`
      mainCtx.fillStyle = edit.color
      mainCtx.textBaseline = 'top'
      const lines = edit.text.split('\n')
      lines.forEach((line, i) => {
        mainCtx.fillText(line, edit.x, edit.y + i * edit.fontSize * 1.3)
      })
    }
  }

  for (const drawing of drawings) {
    if (drawing.points.length < 2) continue
    mainCtx.beginPath()
    mainCtx.strokeStyle = drawing.color
    mainCtx.lineWidth = drawing.width
    mainCtx.lineCap = 'round'
    mainCtx.lineJoin = 'round'
    mainCtx.moveTo(drawing.points[0].x, drawing.points[0].y)
    for (let i = 1; i < drawing.points.length; i++) {
      mainCtx.lineTo(drawing.points[i].x, drawing.points[i].y)
    }
    mainCtx.stroke()
  }
}

const startBlockEditing = (index) => {
  if (editMode.value !== 'edit') return
  if (editedBlockSet.value.has(index)) return

  const blocks = getTextBlocks(currentPage.value)
  const block = blocks[index]
  if (!block) return

  if (editingBlockIndex.value >= 0 && editingBlockIndex.value !== index) {
    saveBlockEdit()
  }

  editingBlockIndex.value = index
  editBlockText.value = block.text
  editBlockFontSize.value = Math.round(block.fontSize)
  editBlockColor.value = '#000000'
  editAreaHeight.value = 0

  document.addEventListener('click', handleDocumentClick, true)

  nextTick(() => {
    updateDisplayScale()
    if (inlineEditRef.value) {
      inlineEditRef.value.focus()
      autoResizeTextarea()
    }
  })
}

const startReEditing = (index) => {
  if (editMode.value !== 'edit') return

  const edits = getPageEdits(currentPage.value)
  const existing = edits.find(e => e.type === 'editBlock' && e.blockIndex === index)
  if (!existing) return

  if (editingBlockIndex.value >= 0 && editingBlockIndex.value !== index) {
    saveBlockEdit()
  }

  const blocks = getTextBlocks(currentPage.value)
  const block = blocks[index]
  if (!block) return

  editingBlockIndex.value = index
  editBlockText.value = existing.newText
  editBlockFontSize.value = existing.fontSize
  editBlockColor.value = existing.color
  editAreaHeight.value = 0

  document.addEventListener('click', handleDocumentClick, true)

  nextTick(() => {
    updateDisplayScale()
    if (inlineEditRef.value) {
      inlineEditRef.value.focus()
      autoResizeTextarea()
    }
  })
}

const saveBlockEdit = () => {
  if (editingBlockIndex.value < 0) return

  const blocks = getTextBlocks(currentPage.value)
  const block = blocks[editingBlockIndex.value]
  if (!block) {
    editingBlockIndex.value = -1
    document.removeEventListener('click', handleDocumentClick, true)
    return
  }

  const newText = editBlockText.value
  if (newText !== block.text) {
    const edits = getPageEdits(currentPage.value)
    const existingIdx = edits.findIndex(
      e => e.type === 'editBlock' && e.blockIndex === editingBlockIndex.value
    )

    const entry = {
      type: 'editBlock',
      blockIndex: editingBlockIndex.value,
      originalText: block.text,
      newText: newText,
      fontSize: editBlockFontSize.value,
      color: editBlockColor.value,
    }

    if (existingIdx >= 0) {
      edits[existingIdx] = entry
    } else {
      edits.push(entry)
    }
  }

  editingBlockIndex.value = -1
  document.removeEventListener('click', handleDocumentClick, true)
  redrawPage()
}

const cancelBlockEdit = () => {
  editingBlockIndex.value = -1
  document.removeEventListener('click', handleDocumentClick, true)
}

const currentAddTextEdits = computed(() => {
  return getPageEdits(currentPage.value).filter(e => e.type === 'addText')
})

const getAddTextOverlayStyle = (edit) => {
  const canvas = mainCanvasRef.value
  if (!canvas) return {}
  const cw = canvas.width
  const ch = canvas.height

  mainCtx.font = `${edit.fontSize}px sans-serif`
  const lines = edit.text.split('\n')
  let maxWidth = 0
  for (const line of lines) {
    const w = mainCtx.measureText(line).width
    if (w > maxWidth) maxWidth = w
  }
  const height = lines.length * edit.fontSize * 1.3

  return {
    left: `${(edit.x / cw) * 100}%`,
    top: `${(edit.y / ch) * 100}%`,
    width: `${((maxWidth + 8) / cw) * 100}%`,
    height: `${((height + 4) / ch) * 100}%`,
  }
}

const deleteAddText = (editIndex) => {
  const edits = getPageEdits(currentPage.value)
  const addTextEdits = edits.filter(e => e.type === 'addText')
  const target = addTextEdits[editIndex]
  if (!target) return
  const idx = edits.indexOf(target)
  if (idx >= 0) {
    edits.splice(idx, 1)
    selectedAddTextIndex.value = -1
    redrawPage()
  }
}

const startEditAddText = (editIndex) => {
  const addTextEdits = currentAddTextEdits.value
  const edit = addTextEdits[editIndex]
  if (!edit) return
  addTextContent.value = edit.text
  addTextFontSize.value = edit.fontSize
  addTextColor.value = edit.color
  deleteAddText(editIndex)
}

const handleInlineKeydown = (event) => {
  if (event.key === 'Escape') {
    cancelBlockEdit()
  }
}

const autoResizeTextarea = () => {
  const textarea = inlineEditRef.value
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
  editAreaHeight.value = textarea.scrollHeight
}

const handleInlineBlur = () => {
  // Don't save on blur - we use document click detection instead
}

const handleDocumentClick = (event) => {
  if (editingBlockIndex.value < 0) return

  const editContainer = document.getElementById('inline-edit-container')
  if (editContainer && editContainer.contains(event.target)) return

  saveBlockEdit()
}

const getCanvasCoords = (event) => {
  const canvas = mainCanvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  }
}

const handleAddTextClick = (event) => {
  if (editMode.value !== 'addText') return
  if (!addTextContent.value.trim()) return

  const coords = getCanvasCoords(event)
  if (!coords) return

  getPageEdits(currentPage.value).push({
    type: 'addText',
    text: addTextContent.value,
    x: coords.x,
    y: coords.y,
    fontSize: addTextFontSize.value,
    color: addTextColor.value
  })
  redrawPage()
}

const handleDrawMouseDown = (event) => {
  if (editMode.value !== 'draw') return
  const coords = getCanvasCoords(event)
  if (!coords) return

  isDrawing.value = true
  currentDrawPath = [{ x: coords.x, y: coords.y }]
}

const handleDrawMouseMove = (event) => {
  if (!isDrawing.value || editMode.value !== 'draw') return
  const coords = getCanvasCoords(event)
  if (!coords) return

  currentDrawPath.push({ x: coords.x, y: coords.y })

  if (drawCtx && currentDrawPath.length >= 2) {
    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height)

    const drawings = getPageDrawings(currentPage.value)
    for (const drawing of drawings) {
      if (drawing.points.length < 2) continue
      drawCtx.beginPath()
      drawCtx.strokeStyle = drawing.color
      drawCtx.lineWidth = drawing.width
      drawCtx.lineCap = 'round'
      drawCtx.lineJoin = 'round'
      drawCtx.moveTo(drawing.points[0].x, drawing.points[0].y)
      for (let i = 1; i < drawing.points.length; i++) {
        drawCtx.lineTo(drawing.points[i].x, drawing.points[i].y)
      }
      drawCtx.stroke()
    }

    drawCtx.beginPath()
    drawCtx.strokeStyle = drawColor.value
    drawCtx.lineWidth = drawWidth.value
    drawCtx.lineCap = 'round'
    drawCtx.lineJoin = 'round'
    drawCtx.moveTo(currentDrawPath[0].x, currentDrawPath[0].y)
    for (let i = 1; i < currentDrawPath.length; i++) {
      drawCtx.lineTo(currentDrawPath[i].x, currentDrawPath[i].y)
    }
    drawCtx.stroke()
  }
}

const handleDrawMouseUp = () => {
  if (isDrawing.value && currentDrawPath.length >= 2) {
    getPageDrawings(currentPage.value).push({
      color: drawColor.value,
      width: drawWidth.value,
      points: [...currentDrawPath]
    })
    redrawPage()
  }
  isDrawing.value = false
  currentDrawPath = []

  if (drawCtx) {
    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height)
  }
}

const prevPage = async () => {
  saveBlockEdit()
  let target = currentPage.value - 1
  while (target >= 1 && deletedPages.has(target)) target--
  if (target >= 1) {
    currentPage.value = target
    await renderCurrentPage()
  }
}

const nextPage = async () => {
  saveBlockEdit()
  let target = currentPage.value + 1
  while (target <= totalPages.value && deletedPages.has(target)) target++
  if (target <= totalPages.value) {
    currentPage.value = target
    await renderCurrentPage()
  }
}

const undoLast = () => {
  const edits = getPageEdits(currentPage.value)
  const drawings = getPageDrawings(currentPage.value)

  if (drawings.length > 0) {
    drawings.pop()
  } else if (edits.length > 0) {
    edits.pop()
  }

  editingBlockIndex.value = -1
  redrawPage()
}

const clearPageEdits = () => {
  pageEditsMap[currentPage.value] = []
  pageDrawingsMap[currentPage.value] = []
  editingBlockIndex.value = -1
  redrawPage()
}

const exportPdf = async () => {
  if (!pdfDoc.value) return

  saveBlockEdit()
  isProcessing.value = true

  try {
    const savedPage = currentPage.value
    const firstPage = await pdfDoc.value.getPage(1)
    const firstViewport = firstPage.getViewport({ scale: SCALE })

    const pdf = new jsPDF({
      orientation: firstViewport.width > firstViewport.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [firstViewport.width, firstViewport.height]
    })

    let isFirstNonDeletedPage = true

    for (let i = 1; i <= totalPages.value; i++) {
      // 跳过已删除的页面
      if (deletedPages.has(i)) continue

      if (isFirstNonDeletedPage) {
        isFirstNonDeletedPage = false
      } else {
        const p = await pdfDoc.value.getPage(i)
        const vp = p.getViewport({ scale: SCALE })
        pdf.addPage([vp.width, vp.height])
      }

      currentPage.value = i
      await renderCurrentPage()
      await nextTick()

      const canvas = mainCanvasRef.value
      if (canvas) {
        const imgData = canvas.toDataURL('image/png')
        const page = await pdfDoc.value.getPage(i)
        const viewport = page.getViewport({ scale: SCALE })
        pdf.addImage(imgData, 'JPEG', 0, 0, viewport.width, viewport.height)
      }
    }

    currentPage.value = savedPage
    await renderCurrentPage()

    const fileName = pdfFile.value?.name?.replace('.pdf', '') || 'edited'
    pdf.save(`${fileName}_edited.pdf`)

    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('PDF导出失败:', error)
    alert('PDF导出失败，请重试')
  } finally {
    isProcessing.value = false
  }
}

let resizeObserver = null

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    updateDisplayScale()
  })
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">PDF编辑</h1>
        <p class="text-gray-600 dark:text-gray-400">像WPS一样直接编辑PDF中的文字内容，点击段落即可修改</p>
      </div>

      <div v-if="showSuccess"
           class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        PDF导出成功！
      </div>

      <div v-if="isProcessing"
           class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
          <svg class="animate-spin h-6 w-6 text-violet-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-gray-800 dark:text-white">正在导出PDF，请稍候...</span>
        </div>
      </div>

      <div v-if="isLoading"
           class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-3">
          <svg class="animate-spin h-6 w-6 text-violet-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-gray-800 dark:text-white">正在加载PDF...</span>
          <div class="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="bg-violet-600 h-2 rounded-full transition-all duration-300" :style="{ width: `${loadProgress}%` }"></div>
          </div>
        </div>
      </div>

      <div v-if="!pdfFile" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-violet-500 dark:hover:border-violet-400 transition-colors">
          <input type="file" accept="application/pdf" @change="handleFileSelect"
                 class="hidden" id="pdfEditInput">
          <label for="pdfEditInput" class="cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-violet-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p class="text-lg text-gray-600 dark:text-gray-400 mb-2">点击选择PDF文件</p>
            <p class="text-sm text-gray-400 dark:text-gray-500">上传后可直接编辑PDF中的文字</p>
          </label>
        </div>
      </div>

      <div v-else>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-4">
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span class="text-sm font-medium text-gray-800 dark:text-white truncate max-w-[200px]">{{ pdfFile.name }}</span>
            </div>

            <div class="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

            <div class="flex items-center gap-1">
              <button @click="saveBlockEdit(); editMode = 'edit'"
                      :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', editMode === 'edit' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700']">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                编辑文字
              </button>
              <button @click="saveBlockEdit(); editMode = 'addText'"
                      :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', editMode === 'addText' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700']">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                添加文字
              </button>
              <button @click="saveBlockEdit(); editMode = 'draw'"
                      :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', editMode === 'draw' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700']">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                绘图
              </button>
            </div>

            <div class="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

            <div v-if="editMode === 'edit'" class="flex items-center gap-2">
              <span class="text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-1 rounded">
                点击文字段落即可编辑，Esc取消
              </span>
            </div>

            <div v-if="editMode === 'addText'" class="flex items-center gap-2">
              <input v-model="addTextContent" type="text" placeholder="输入要添加的文字..."
                     class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white w-40">
              <input v-model="addTextColor" type="color" class="w-8 h-8 rounded cursor-pointer border-0">
              <select v-model="addTextFontSize"
                      class="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                <option :value="12">12px</option>
                <option :value="14">14px</option>
                <option :value="16">16px</option>
                <option :value="20">20px</option>
                <option :value="24">24px</option>
                <option :value="32">32px</option>
              </select>
              <span class="text-xs text-gray-500 dark:text-gray-400">点击页面放置文字</span>
            </div>

            <div v-if="editMode === 'draw'" class="flex items-center gap-2">
              <input v-model="drawColor" type="color" class="w-8 h-8 rounded cursor-pointer border-0">
              <select v-model="drawWidth"
                      class="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                <option :value="1">细线</option>
                <option :value="3">中等</option>
                <option :value="5">粗线</option>
                <option :value="8">特粗</option>
              </select>
              <span class="text-xs text-gray-500 dark:text-gray-400">在页面上拖拽绘图</span>
            </div>

            <div class="flex-1"></div>

            <button @click="undoLast"
                    class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              撤销
            </button>
            <button @click="clearPageEdits"
                    class="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              清除本页
            </button>
            <button @click="clearFile"
                    class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              更换文件
            </button>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-4">
          <div class="flex justify-center overflow-auto">
            <div ref="containerRef" class="relative inline-block" style="max-width: 100%;">
              <canvas ref="mainCanvasRef" class="block max-w-full h-auto"></canvas>

              <div v-if="editMode === 'edit'"
                   class="absolute inset-0"
                   style="pointer-events: none;">

                <div v-for="(block, bIndex) in currentTextBlocks" :key="'block-'+bIndex"
                     v-show="editingBlockIndex !== bIndex"
                     class="absolute"
                     :class="[
                       editedBlockSet.has(bIndex)
                         ? 'cursor-pointer border border-dashed border-green-400/50 bg-green-50/10 hover:bg-green-100/20'
                         : 'cursor-text border border-transparent hover:border-violet-400/60 hover:bg-violet-100/20'
                     ]"
                     :style="getBlockOverlayStyle(block, bIndex)"
                     style="pointer-events: auto;"
                     @click.stop="editedBlockSet.has(bIndex) ? startReEditing(bIndex) : startBlockEditing(bIndex)">
                </div>

                <div v-for="(edit, eIndex) in currentAddTextEdits" :key="'addtext-edit-'+eIndex"
                     class="absolute border border-dashed border-orange-400/60 bg-orange-50/20 hover:bg-orange-100/30 cursor-pointer"
                     :style="getAddTextOverlayStyle(edit)"
                     style="pointer-events: auto;"
                     @click.stop="selectedAddTextIndex = selectedAddTextIndex === eIndex ? -1 : eIndex">
                  <div v-if="selectedAddTextIndex === eIndex"
                       class="absolute -top-6 left-0 flex items-center gap-1 bg-white dark:bg-gray-800 rounded shadow-md px-2 py-0.5 border border-gray-200 dark:border-gray-700 z-10">
                    <button @click.stop="deleteAddText(eIndex)"
                            class="text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded hover:bg-red-600">删除</button>
                  </div>
                </div>

                <div v-if="editingBlockIndex >= 0"
                     id="inline-edit-container"
                     class="absolute z-30"
                     :style="getInlineEditStyle()"
                     style="pointer-events: auto;">
                  <textarea ref="inlineEditRef"
                            v-model="editBlockText"
                            class="w-full px-1 py-0.5 bg-white/95 dark:bg-gray-800/95 border-2 border-violet-500 rounded outline-none text-gray-900 dark:text-white resize-none shadow-lg overflow-hidden"
                            :style="{
                              fontSize: 'inherit',
                              lineHeight: 'inherit',
                              fontFamily: 'sans-serif',
                              minHeight: '100%',
                            }"
                            @input="autoResizeTextarea"
                            @keydown="handleInlineKeydown"></textarea>
                  <div class="absolute -top-7 left-0 flex items-center gap-2 bg-white dark:bg-gray-800 rounded shadow-md px-2 py-1 border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-1">
                      <label class="text-[10px] text-gray-500">字号</label>
                      <select v-model="editBlockFontSize"
                              class="text-[10px] border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                        <option :value="10">10</option>
                        <option :value="12">12</option>
                        <option :value="14">14</option>
                        <option :value="16">16</option>
                        <option :value="18">18</option>
                        <option :value="20">20</option>
                        <option :value="24">24</option>
                        <option :value="28">28</option>
                        <option :value="32">32</option>
                        <option :value="36">36</option>
                        <option :value="42">42</option>
                        <option :value="48">48</option>
                      </select>
                    </div>
                    <div class="flex items-center gap-1">
                      <label class="text-[10px] text-gray-500">颜色</label>
                      <input v-model="editBlockColor" type="color"
                             class="w-4 h-4 rounded cursor-pointer border-0">
                    </div>
                    <span class="text-[10px] text-gray-400 ml-1">Esc取消 · 点击外部保存</span>
                  </div>
                </div>
              </div>

              <div v-if="editMode === 'addText'"
                   class="absolute inset-0 cursor-crosshair"
                   @click="handleAddTextClick">
                <div v-for="(edit, eIndex) in currentAddTextEdits" :key="'addtext-'+eIndex"
                     class="absolute border border-dashed border-orange-400/60 bg-orange-50/20 hover:bg-orange-100/30 cursor-pointer"
                     :style="getAddTextOverlayStyle(edit)"
                     @click.stop="selectedAddTextIndex = selectedAddTextIndex === eIndex ? -1 : eIndex">
                  <div v-if="selectedAddTextIndex === eIndex"
                       class="absolute -top-6 left-0 flex items-center gap-1 bg-white dark:bg-gray-800 rounded shadow-md px-2 py-0.5 border border-gray-200 dark:border-gray-700 z-10">
                    <button @click.stop="startEditAddText(eIndex)"
                            class="text-[10px] px-1.5 py-0.5 bg-violet-500 text-white rounded hover:bg-violet-600">编辑</button>
                    <button @click.stop="deleteAddText(eIndex)"
                            class="text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded hover:bg-red-600">删除</button>
                  </div>
                </div>
              </div>

              <canvas v-if="editMode === 'draw'"
                      ref="drawCanvasRef"
                      class="absolute top-0 left-0 w-full h-full cursor-crosshair"
                      @mousedown="handleDrawMouseDown"
                      @mousemove="handleDrawMouseMove"
                      @mouseup="handleDrawMouseUp"
                      @mouseleave="handleDrawMouseUp"></canvas>
            </div>
          </div>
        </div>

        <!-- 缩略图预览（下方，3列网格） -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">页面预览</span>
            <div class="flex items-center gap-2">
              <button v-if="!selectMode" @click="enterSelectMode"
                      class="px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                多选模式
              </button>
              <template v-if="selectMode">
                <button @click="selectAllPages"
                        class="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  全选
                </button>
                <button @click="deleteSelectedPages" :disabled="selectedPages.size === 0"
                        :class="[
                          'px-3 py-1 text-xs font-medium rounded-lg transition-colors',
                          selectedPages.size > 0
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                        ]">
                  删除所选({{ selectedPages.size }})
                </button>
                <button @click="deleteUnselectedPages" :disabled="selectedPages.size === 0"
                        :class="[
                          'px-3 py-1 text-xs font-medium rounded-lg transition-colors',
                          selectedPages.size > 0
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                        ]">
                  保留所选(删其余)
                </button>
                <button @click="exitSelectMode"
                        class="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  取消
                </button>
              </template>
              <span v-if="!selectMode" class="text-[11px] text-gray-400 dark:text-gray-500">Ctrl+点击可多选</span>
            </div>
          </div>

          <div v-if="!thumbnailsLoaded" class="flex items-center justify-center h-24 text-xs text-gray-400">
            <svg class="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            加载中...
          </div>
          <div v-else class="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
            <div v-for="n in totalPages" :key="'thumb-'+n"
                 @click="handleThumbnailClick(n, $event)"
                 :class="[
                   'relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all',
                   selectedPages.has(n)
                     ? 'border-blue-500 shadow-md ring-2 ring-blue-300 dark:ring-blue-600'
                     : currentPage === n && !selectMode
                       ? 'border-violet-500 shadow-md ring-1 ring-violet-300 dark:ring-violet-600'
                       : 'border-gray-200 dark:border-gray-600 hover:border-violet-400',
                   deletedPages.has(n) ? 'opacity-30' : ''
                 ]">
              <img :src="pageThumbnails[n]" :alt="'第'+n+'页'"
                   class="w-full h-auto block pointer-events-none"
                   :class="deletedPages.has(n) ? 'grayscale' : ''" />
              <!-- 选择复选框 -->
              <div v-if="selectMode"
                   :class="[
                     'absolute top-1.5 left-1.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                     selectedPages.has(n)
                       ? 'bg-blue-500 border-blue-500'
                       : 'bg-white/80 border-gray-400'
                   ]">
                <svg v-if="selectedPages.has(n)" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <!-- 页码 -->
              <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                第{{ n }}页
              </div>
              <!-- 删除状态标记 -->
              <div v-if="deletedPages.has(n)"
                   class="absolute inset-0 flex items-center justify-center bg-red-500/20">
                <span class="text-red-600 text-xs font-bold bg-white/90 px-1.5 py-0.5 rounded">已删除</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button @click="prevPage" :disabled="currentPage <= 1"
                      :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', currentPage <= 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700']">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                上一页
              </button>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ currentPage }} / {{ totalPages }}
                <span v-if="deletedPages.size > 0" class="text-red-500 ml-1">(已删{{ deletedPages.size }}页)</span>
              </span>
              <button @click="nextPage" :disabled="currentPage >= totalPages"
                      :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', currentPage >= totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700']">
                下一页
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div class="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

              <button @click="deleteCurrentPage"
                      class="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                删除本页
              </button>
              <button v-if="deletedPages.size > 0" @click="restoreAllPages"
                      class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                撤销删除
              </button>
            </div>

            <div class="flex items-center gap-3">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                已编辑 {{ totalEditCount }} 处
              </span>
              <button @click="exportPdf"
                      :disabled="isProcessing"
                      :class="[
                        'px-6 py-2 font-medium rounded-lg transition-colors',
                        !isProcessing
                          ? 'bg-violet-600 hover:bg-violet-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      ]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出PDF
              </button>
            </div>
          </div>
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
