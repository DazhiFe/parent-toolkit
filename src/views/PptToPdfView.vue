<script setup>
import { ref, nextTick } from 'vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'

const pptFile = ref(null)
const slides = ref([])
const isConverting = ref(false)
const progress = ref(0)
const showSuccess = ref(false)

const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const fileName = file.name.toLowerCase()
  if (!fileName.endsWith('.pptx')) {
    alert('目前仅支持 .pptx 格式，请转换后上传')
    return
  }

  pptFile.value = file
  slides.value = []
  progress.value = 0

  try {
    const arrayBuffer = await file.arrayBuffer()
    progress.value = 10
    
    const zip = await JSZip.loadAsync(arrayBuffer)
    progress.value = 20
    
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)[1])
        const numB = parseInt(b.match(/slide(\d+)/)[1])
        return numA - numB
      })
    
    if (slideFiles.length === 0) {
      throw new Error('未找到幻灯片内容，请确保文件格式正确')
    }
    
    progress.value = 30
    
    const mediaFiles = {}
    const mediaEntries = Object.keys(zip.files).filter(name => name.startsWith('ppt/media/'))
    for (const mediaName of mediaEntries) {
      const mediaFile = zip.file(mediaName)
      if (mediaFile) {
        try {
          const blob = await mediaFile.async('blob')
          mediaFiles[mediaName] = URL.createObjectURL(blob)
        } catch (e) {
          console.warn('媒体文件加载失败:', mediaName)
        }
      }
    }
    
    progress.value = 40
    
    const allRels = {}
    Object.keys(zip.files).forEach(name => {
      if (name.endsWith('.rels')) {
        const relsFile = zip.file(name)
        if (relsFile) {
          relsFile.async('string').then(xml => {
            const doc = new DOMParser().parseFromString(xml, 'text/xml')
            doc.querySelectorAll('Relationship').forEach(rel => {
              const id = rel.getAttribute('Id')
              const target = rel.getAttribute('Target')
              if (id && target) {
                let basePath = name.replace('_rels/', '').replace('.rels', '')
                if (target.startsWith('../')) {
                  const parts = basePath.split('/')
                  parts.pop()
                  target.split('/').forEach(part => {
                    if (part === '..') {
                      parts.pop()
                    } else {
                      parts.push(part)
                    }
                  })
                  allRels[`${basePath}:${id}`] = parts.join('/')
                } else {
                  allRels[`${basePath}:${id}`] = basePath.substring(0, basePath.lastIndexOf('/') + 1) + target
                }
              }
            })
          })
        }
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    progress.value = 50
    
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = zip.file(slideFiles[i])
      if (!slideFile) continue
      
      const slideXml = await slideFile.async('string')
      const slideNum = i + 1
      const slidePath = slideFiles[i].replace('.xml', '')
      const slideContent = parseSlideXml(slideXml, mediaFiles, allRels, slidePath)
      
      slides.value.push({
        index: slideNum,
        shapes: slideContent.shapes,
        texts: slideContent.texts,
        images: slideContent.images
      })
      
      progress.value = 50 + Math.floor((i + 1) / slideFiles.length * 45)
    }
    
    progress.value = 100
  } catch (error) {
    console.error('PPT解析失败:', error)
    alert('PPT文件解析失败: ' + error.message)
    pptFile.value = null
    progress.value = 0
  }
}

const parseSlideXml = (xml, mediaFiles, allRels, slidePath) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  
  const shapes = []
  const texts = []
  const images = []
  
  const spTree = doc.querySelector('p\\:spTree, spTree')
  if (!spTree) return { shapes, texts, images }
  
  const allElements = spTree.children
  for (const elem of allElements) {
    const localName = elem.localName || elem.tagName.split(':').pop()
    
    if (localName === 'sp') {
      const shape = parseShape(elem, mediaFiles, allRels, slidePath)
      if (shape) {
        shapes.push(shape)
        if (shape.texts) {
          texts.push(...shape.texts)
        }
      }
    } else if (localName === 'pic') {
      const img = parsePicture(elem, mediaFiles, allRels, slidePath)
      if (img) {
        shapes.push(img)
        images.push(img.image)
      }
    } else if (localName === 'graphicFrame') {
      const graphicShapes = parseGraphicFrame(elem, mediaFiles, allRels, slidePath)
      graphicShapes.forEach(shape => {
        shapes.push(shape)
        if (shape.texts) {
          texts.push(...shape.texts)
        }
      })
    }
  }
  
  return { shapes, texts, images }
}

const getPosition = (elem) => {
  const result = { x: 0, y: 0, width: 100, height: 50 }
  
  const xfrm = elem.querySelector('a\\:xfrm, xfrm')
  if (xfrm) {
    const off = xfrm.querySelector('a\\:off, off')
    const ext = xfrm.querySelector('a\\:ext, ext')
    if (off) {
      result.x = parseInt(off.getAttribute('x') || 0) / 914400
      result.y = parseInt(off.getAttribute('y') || 0) / 914400
    }
    if (ext) {
      result.width = parseInt(ext.getAttribute('cx') || 9144000) / 914400
      result.height = parseInt(ext.getAttribute('cy') || 4572000) / 914400
    }
  }
  
  return result
}

const parseShape = (sp, mediaFiles, allRels, slidePath) => {
  const txBody = sp.querySelector('p\\:txBody, txBody')
  const pos = getPosition(sp.querySelector('p\\:spPr, spPr'))
  
  const shape = {
    type: 'shape',
    ...pos,
    texts: [],
    fill: '#FFFFFF'
  }
  
  const spPr = sp.querySelector('p\\:spPr, spPr')
  if (spPr) {
    const solidFill = spPr.querySelector('a\\:solidFill, solidFill')
    if (solidFill) {
      const srgbClr = solidFill.querySelector('a\\:srgbClr, srgbClr')
      const schemeClr = solidFill.querySelector('a\\:schemeClr, schemeClr')
      if (srgbClr) {
        shape.fill = '#' + srgbClr.getAttribute('val')
      } else if (schemeClr) {
        const colorMap = {
          'lt1': '#FFFFFF', 'lt2': '#E6E6E6', 'dk1': '#000000', 'dk2': '#1F497D',
          'accent1': '#4472C4', 'accent2': '#ED7D31', 'accent3': '#A5A5A5',
          'accent4': '#FFC000', 'accent5': '#5B9BD5', 'accent6': '#70AD47',
          'hlink': '#0563C1', 'folHlink': '#954F72', 'tx1': '#000000', 'tx2': '#1F497D'
        }
        shape.fill = colorMap[schemeClr.getAttribute('val')] || '#FFFFFF'
      }
    }
  }
  
  if (txBody) {
    const paragraphs = txBody.querySelectorAll('a\\:p, p')
    paragraphs.forEach(p => {
      const textContent = extractTextFromParagraph(p)
      if (textContent.text.trim()) {
        shape.texts.push({
          text: textContent.text.trim(),
          fontSize: textContent.fontSize,
          bold: textContent.bold,
          color: textContent.color
        })
      }
    })
  }
  
  if (shape.texts.length === 0) {
    return null
  }
  
  return shape
}

const extractTextFromParagraph = (p) => {
  let text = ''
  let fontSize = 18
  let bold = false
  let color = '#000000'
  
  const defRPr = p.querySelector('a\\:defRPr, defRPr')
  if (defRPr) {
    const sz = defRPr.getAttribute('sz')
    if (sz) fontSize = parseInt(sz) / 100
    bold = defRPr.getAttribute('b') === '1'
  }
  
  const textRuns = p.querySelectorAll('a\\:r, r')
  textRuns.forEach(r => {
    const rPr = r.querySelector('a\\:rPr, rPr')
    if (rPr) {
      const sz = rPr.getAttribute('sz')
      if (sz) fontSize = parseInt(sz) / 100
      bold = rPr.getAttribute('b') === '1'
      
      const solidFill = rPr.querySelector('a\\:solidFill, solidFill')
      if (solidFill) {
        const srgbClr = solidFill.querySelector('a\\:srgbClr, srgbClr')
        if (srgbClr) {
          color = '#' + srgbClr.getAttribute('val')
        }
      }
    }
    
    const t = r.querySelector('a\\:t, t')
    if (t && t.textContent) {
      text += t.textContent
    }
  })
  
  return { text, fontSize, bold, color }
}

const parsePicture = (pic, mediaFiles, allRels, slidePath) => {
  const blipFill = pic.querySelector('p\\:blipFill, blipFill')
  const pos = getPosition(pic.querySelector('p\\:spPr, spPr'))
  
  const shape = {
    type: 'image',
    ...pos,
    image: null
  }
  
  if (blipFill) {
    const blip = blipFill.querySelector('a\\:blip, blip')
    if (blip) {
      const embed = blip.getAttribute('r:embed') || blip.getAttribute('embed')
      if (embed) {
        const mediaPath = allRels[`${slidePath}:${embed}`]
        if (mediaPath && mediaFiles[mediaPath]) {
          shape.image = mediaFiles[mediaPath]
        } else {
          const matchingKey = Object.keys(mediaFiles).find(key => 
            key.toLowerCase().includes(embed.toLowerCase())
          )
          if (matchingKey) {
            shape.image = mediaFiles[matchingKey]
          }
        }
      }
    }
  }
  
  if (!shape.image) {
    const mediaKeys = Object.keys(mediaFiles)
    if (mediaKeys.length > 0) {
      shape.image = mediaFiles[mediaKeys[0]]
    }
  }
  
  return shape.image ? shape : null
}

const parseGraphicFrame = (gf, mediaFiles, allRels, slidePath) => {
  const shapes = []
  const graphic = gf.querySelector('a\\:graphic, graphic')
  if (!graphic) return shapes
  
  const graphicData = graphic.querySelector('a\\:graphicData, graphicData')
  if (!graphicData) return shapes
  
  const uri = graphicData.getAttribute('uri')
  
  if (uri === 'http://schemas.openxmlformats.org/drawingml/2006/chart') {
    const chart = graphicData.querySelector('c\\:chart, chart')
    if (chart) {
      const shape = {
        type: 'chart',
        ...getPosition(gf.querySelector('p\\:xfrm, xfrm') || gf),
        texts: [{ text: '[图表]', fontSize: 14, bold: false, color: '#666666' }]
      }
      shapes.push(shape)
    }
  } else if (uri === 'http://schemas.openxmlformats.org/drawingml/2006/table') {
    const tbl = graphicData.querySelector('a\\:tbl, tbl')
    if (tbl) {
      const rows = tbl.querySelectorAll('a\\:tr, tr')
      let tableText = ''
      rows.forEach((row, ri) => {
        const cells = row.querySelectorAll('a\\:tc, tc')
        cells.forEach(cell => {
          const cellText = extractTextFromCell(cell)
          if (cellText) tableText += cellText + ' | '
        })
        if (tableText) tableText = tableText.slice(0, -3) + '\n'
      })
      if (tableText.trim()) {
        const shape = {
          type: 'table',
          ...getPosition(gf.querySelector('p\\:xfrm, xfrm') || gf),
          texts: [{ text: tableText.trim(), fontSize: 12, bold: false, color: '#000000' }]
        }
        shapes.push(shape)
      }
    }
  }
  
  return shapes
}

const extractTextFromCell = (tc) => {
  const txBody = tc.querySelector('a\\:txBody, txBody')
  if (!txBody) return ''
  
  let text = ''
  const paragraphs = txBody.querySelectorAll('a\\:p, p')
  paragraphs.forEach(p => {
    const textRuns = p.querySelectorAll('a\\:r, r')
    textRuns.forEach(r => {
      const t = r.querySelector('a\\:t, t')
      if (t && t.textContent) {
        text += t.textContent
      }
    })
  })
  return text.trim()
}

const clearFile = () => {
  pptFile.value = null
  slides.value = []
  progress.value = 0
}

const convertToPdf = async () => {
  if (slides.value.length === 0) {
    alert('请先上传PPT文件')
    return
  }

  isConverting.value = true

  try {
    await nextTick()
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    const pdfPageWidth = pdf.internal.pageSize.getWidth()
    const pdfPageHeight = pdf.internal.pageSize.getHeight()

    for (let i = 0; i < slides.value.length; i++) {
      if (i > 0) {
        pdf.addPage()
      }

      const slideEl = document.getElementById(`slide-preview-${i}`)
      if (!slideEl) continue

      const canvas = await html2canvas(slideEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const imgWidth = pdfPageWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const marginX = 10
      const marginY = (pdfPageHeight - imgHeight) / 2

      pdf.addImage(imgData, 'JPEG', marginX, marginY, imgWidth, imgHeight)
    }

    const fileName = pptFile.value?.name?.replace(/\.(ppt|pptx)$/i, '') || 'output'
    pdf.save(`${fileName}.pdf`)

    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('PDF生成失败:', error)
    alert('PDF生成失败: ' + error.message)
  } finally {
    isConverting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">PPT转PDF</h1>
        <p class="text-gray-600 dark:text-gray-400">将PPT演示文稿转换为PDF文件（仅支持.pptx格式）</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">转换设置</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">页面方向</label>
            <div class="h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white flex items-center">
              横向 (A4)
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
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">上传PPT文件</h2>
          <button v-if="pptFile" @click="clearFile"
                  class="text-sm text-red-600 hover:text-red-700 dark:text-red-400">
            清除文件
          </button>
        </div>

        <div v-if="!pptFile" class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
          <input type="file" accept=".pptx" @change="handleFileSelect"
                 class="hidden" id="pptInput">
          <label for="pptInput" class="cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-600 dark:text-gray-400">点击选择PPT文件</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">仅支持 .pptx 格式</p>
          </label>
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div class="flex-1">
              <p class="font-medium text-gray-800 dark:text-white">{{ pptFile.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ (pptFile.size / 1024 / 1024).toFixed(2) }} MB · {{ slides.length }} 张幻灯片</p>
            </div>
          </div>

          <div v-if="progress < 100" class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="bg-orange-600 h-2 rounded-full transition-all duration-300" :style="{ width: `${progress}%` }"></div>
          </div>
          <p v-if="progress < 100" class="text-sm text-gray-500 dark:text-gray-400 text-center">正在解析文件... {{ progress }}%</p>

          <div v-if="slides.length > 0" class="mt-4">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">幻灯片预览（点击生成PDF）</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-for="(slide, index) in slides" :key="index"
                   :id="`slide-preview-${index}`"
                   class="bg-white border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
                   style="aspect-ratio: 16/9;">
                <div class="w-full h-full p-6 flex flex-col relative">
                  <div class="absolute top-2 left-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-500">
                    第 {{ slide.index }} 页
                  </div>
                  
                  <div class="flex-1 overflow-hidden pt-4">
                    <div v-for="(shape, sIdx) in slide.shapes" :key="sIdx" class="mb-2">
                      <div v-if="shape.type === 'image' && shape.image" class="mb-2">
                        <img :src="shape.image" class="max-h-20 object-contain rounded" />
                      </div>
                      <div v-else-if="shape.texts && shape.texts.length > 0">
                        <p v-for="(textItem, tIdx) in shape.texts" :key="tIdx"
                           :style="{ fontSize: Math.min(textItem.fontSize * 0.8, 16) + 'px', fontWeight: textItem.bold ? 'bold' : 'normal', color: textItem.color }"
                           class="mb-1 leading-tight">
                          {{ textItem.text }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center">
        <button @click="convertToPdf"
                :disabled="progress < 100 || isConverting || slides.length === 0"
                :class="[
                  'px-8 py-3 font-medium rounded-lg transition-colors',
                  progress === 100 && !isConverting && slides.length > 0
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
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
          <svg class="animate-spin h-6 w-6 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
</style>
