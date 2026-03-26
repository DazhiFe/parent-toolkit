<script setup>
import { ref } from 'vue'
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
    
    const slideRelsMap = {}
    for (let i = 1; i <= slideFiles.length; i++) {
      const relsPath = `ppt/slides/_rels/slide${i}.xml.rels`
      const relsFile = zip.file(relsPath)
      if (relsFile) {
        const relsXml = await relsFile.async('string')
        const relsDoc = new DOMParser().parseFromString(relsXml, 'text/xml')
        const relationships = relsDoc.querySelectorAll('Relationship')
        const rels = {}
        relationships.forEach(rel => {
          const id = rel.getAttribute('Id')
          const target = rel.getAttribute('Target')
          if (id && target) {
            rels[id] = target.replace('../media/', 'ppt/media/')
          }
        })
        slideRelsMap[i] = rels
      }
    }
    
    progress.value = 50
    
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = zip.file(slideFiles[i])
      if (!slideFile) continue
      
      const slideXml = await slideFile.async('string')
      const slideNum = i + 1
      const slideRels = slideRelsMap[slideNum] || {}
      const slideContent = parseSlideXml(slideXml, mediaFiles, slideRels)
      
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

const parseSlideXml = (xml, mediaFiles, slideRels) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  
  const shapes = []
  const texts = []
  const images = []
  
  const spElements = doc.querySelectorAll('p\\:sp, sp')
  spElements.forEach(sp => {
    const shape = parseShape(sp, mediaFiles, slideRels)
    if (shape) {
      shapes.push(shape)
      if (shape.texts) {
        texts.push(...shape.texts)
      }
      if (shape.image) {
        images.push(shape.image)
      }
    }
  })
  
  const picElements = doc.querySelectorAll('p\\:pic, pic')
  picElements.forEach(pic => {
    const img = parsePicture(pic, mediaFiles, slideRels)
    if (img) {
      shapes.push(img)
      images.push(img.image)
    }
  })
  
  const graphicElements = doc.querySelectorAll('a\\:graphic, graphic')
  graphicElements.forEach(graphic => {
    const img = parseGraphic(graphic, mediaFiles, slideRels)
    if (img) {
      shapes.push(img)
      images.push(img.image)
    }
  })
  
  return { shapes, texts, images }
}

const parseShape = (sp, mediaFiles, slideRels) => {
  const nvSpPr = sp.querySelector('p\\:nvSpPr, nvSpPr')
  const spPr = sp.querySelector('p\\:spPr, spPr')
  const txBody = sp.querySelector('p\\:txBody, txBody')
  
  const shape = {
    type: 'shape',
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    texts: [],
    fill: null
  }
  
  if (spPr) {
    const xfrm = spPr.querySelector('a\\:xfrm, xfrm')
    if (xfrm) {
      const off = xfrm.querySelector('a\\:off, off')
      const ext = xfrm.querySelector('a\\:ext, ext')
      if (off) {
        shape.x = parseInt(off.getAttribute('x') || 0) / 914400
        shape.y = parseInt(off.getAttribute('y') || 0) / 914400
      }
      if (ext) {
        shape.width = parseInt(ext.getAttribute('cx') || 9144000) / 914400
        shape.height = parseInt(ext.getAttribute('cy') || 4572000) / 914400
      }
    }
    
    const solidFill = spPr.querySelector('a\\:solidFill, solidFill')
    if (solidFill) {
      const srgbClr = solidFill.querySelector('a\\:srgbClr, srgbClr')
      if (srgbClr) {
        shape.fill = '#' + (srgbClr.getAttribute('val') || 'FFFFFF')
      }
    }
  }
  
  if (txBody) {
    const paragraphs = txBody.querySelectorAll('a\\:p, p')
    paragraphs.forEach(p => {
      const textRuns = p.querySelectorAll('a\\:r, r')
      let paraText = ''
      textRuns.forEach(r => {
        const t = r.querySelector('a\\:t, t')
        if (t && t.textContent) {
          paraText += t.textContent
        }
      })
      if (paraText.trim()) {
        const fontSize = getFontSize(p)
        shape.texts.push({
          text: paraText.trim(),
          fontSize: fontSize
        })
        if (!shape.fill) {
          shape.fill = '#FFFFFF'
        }
      }
    })
  }
  
  if (shape.texts.length === 0 && !shape.fill) {
    return null
  }
  
  return shape
}

const getFontSize = (p) => {
  const defRPr = p.querySelector('a\\:defRPr, defRPr')
  if (defRPr) {
    const sz = defRPr.getAttribute('sz')
    if (sz) {
      return parseInt(sz) / 100
    }
  }
  const rPr = p.querySelector('a\\:rPr, rPr')
  if (rPr) {
    const sz = rPr.getAttribute('sz')
    if (sz) {
      return parseInt(sz) / 100
    }
  }
  return 18
}

const parsePicture = (pic, mediaFiles, slideRels) => {
  const nvPicPr = pic.querySelector('p\\:nvPicPr, nvPicPr')
  const blipFill = pic.querySelector('p\\:blipFill, blipFill')
  const spPr = pic.querySelector('p\\:spPr, spPr')
  
  const shape = {
    type: 'image',
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    image: null
  }
  
  if (spPr) {
    const xfrm = spPr.querySelector('a\\:xfrm, xfrm')
    if (xfrm) {
      const off = xfrm.querySelector('a\\:off, off')
      const ext = xfrm.querySelector('a\\:ext, ext')
      if (off) {
        shape.x = parseInt(off.getAttribute('x') || 0) / 914400
        shape.y = parseInt(off.getAttribute('y') || 0) / 914400
      }
      if (ext) {
        shape.width = parseInt(ext.getAttribute('cx') || 9144000) / 914400
        shape.height = parseInt(ext.getAttribute('cy') || 4572000) / 914400
      }
    }
  }
  
  if (blipFill) {
    const blip = blipFill.querySelector('a\\:blip, blip')
    if (blip) {
      const embed = blip.getAttribute('r:embed') || blip.getAttribute('embed')
      if (embed && slideRels[embed]) {
        const mediaPath = slideRels[embed]
        if (mediaFiles[mediaPath]) {
          shape.image = mediaFiles[mediaPath]
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

const parseGraphic = (graphic, mediaFiles, slideRels) => {
  const graphicData = graphic.querySelector('a\\:graphicData, graphicData')
  if (!graphicData) return null
  
  const pic = graphicData.querySelector('pic\\:pic, pic')
  if (pic) {
    return parsePicture(pic, mediaFiles, slideRels)
  }
  
  return null
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
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    const pdfPageWidth = pdf.internal.pageSize.getWidth()
    const pdfPageHeight = pdf.internal.pageSize.getHeight()
    const slideWidth = 338.667
    const slideHeight = 190.5
    const marginX = (pdfPageWidth - slideWidth) / 2
    const marginY = (pdfPageHeight - slideHeight) / 2

    for (let i = 0; i < slides.value.length; i++) {
      if (i > 0) {
        pdf.addPage()
      }

      const slide = slides.value[i]
      pdf.setFillColor(255, 255, 255)
      pdf.rect(marginX, marginY, slideWidth, slideHeight, 'F')
      pdf.setDrawColor(200, 200, 200)
      pdf.rect(marginX, marginY, slideWidth, slideHeight, 'S')

      pdf.setFontSize(10)
      pdf.setTextColor(150, 150, 150)
      pdf.text(`第 ${slide.index} 页`, marginX + 2, marginY + 5)

      let currentY = marginY + 15
      
      for (const shape of slide.shapes) {
        if (shape.type === 'image' && shape.image) {
          try {
            const imgX = marginX + (shape.x * slideWidth / 338.667)
            const imgY = marginY + (shape.y * slideHeight / 190.5)
            const imgW = shape.width * slideWidth / 338.667
            const imgH = shape.height * slideHeight / 190.5
            
            pdf.addImage(shape.image, 'JPEG', imgX, imgY, imgW, imgH)
          } catch (e) {
            console.warn('图片添加失败:', e)
          }
        } else if (shape.texts && shape.texts.length > 0) {
          for (const textItem of shape.texts) {
            if (currentY < marginY + slideHeight - 10) {
              const fontSize = Math.min(textItem.fontSize * 0.3, 12)
              pdf.setFontSize(fontSize)
              pdf.setTextColor(50, 50, 50)
              
              const textX = marginX + 5
              const maxWidth = slideWidth - 10
              const lines = pdf.splitTextToSize(textItem.text, maxWidth)
              
              for (const line of lines.slice(0, 3)) {
                if (currentY < marginY + slideHeight - 10) {
                  pdf.text(line, textX, currentY)
                  currentY += fontSize * 0.5
                }
              }
              currentY += 2
            }
          }
        }
      }
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
    <div class="max-w-5xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">PPT转PDF</h1>
        <p class="text-gray-600 dark:text-gray-400">将PPT演示文稿转换为PDF文件</p>
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
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">幻灯片预览</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div v-for="(slide, index) in slides" :key="index"
                   class="aspect-video bg-white border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm overflow-hidden">
                <div class="text-xs text-gray-400 mb-2">第 {{ slide.index }} 页</div>
                <div class="space-y-1 overflow-hidden">
                  <p v-for="(text, tIndex) in slide.texts.slice(0, 4)" :key="tIndex"
                     class="text-xs text-gray-700 dark:text-gray-300 truncate">
                    {{ text.text }}
                  </p>
                  <p v-if="slide.texts.length > 4" class="text-xs text-gray-400">
                    ... 还有 {{ slide.texts.length - 4 }} 条内容
                  </p>
                </div>
                <div v-if="slide.images.length > 0" class="flex gap-1 mt-2 flex-wrap">
                  <div v-for="(img, imgIndex) in slide.images.slice(0, 2)" :key="imgIndex"
                       class="h-6 w-6 bg-gray-100 rounded overflow-hidden">
                    <img :src="img" class="h-full w-full object-cover" />
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
