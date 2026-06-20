<script setup>
import { ref, computed, nextTick } from 'vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// 模式切换：link=链接模式（默认），paste=粘贴模式
const mode = ref('link')
const inputUrl = ref('')
const pasteHtml = ref('')
const loading = ref(false)
const errorMessage = ref('')
const article = ref(null) // { title, author, publishTime, contentHtml, sourceUrl }

// 打印选项
const fontSize = ref('medium') // small / medium / large
const showImages = ref(false)
const removeAds = ref(true)
const showHeaderFooter = ref(true)

// PDF 导出选项
const pdfPageSize = ref('a4') // a4 / a5 / letter
const pdfOrientation = ref('portrait') // portrait / landscape
const pdfImageQuality = ref(0.92) // 0.1 - 1.0
const isExporting = ref(false)
const exportProgress = ref('')

const PDF_PAGE_SIZES = [
  { value: 'a4', label: 'A4' },
  { value: 'a5', label: 'A5' },
  { value: 'letter', label: 'Letter' }
]

const PDF_ORIENTATIONS = [
  { value: 'portrait', label: '纵向' },
  { value: 'landscape', label: '横向' }
]

// API地址（部署Vercel后替换为实际地址）
const API_BASE = import.meta.env.VITE_API_BASE || ''

// 校验微信文章URL
const isValidWechatUrl = (url) => {
  return /^https?:\/\/mp\.weixin\.qq\.com\/s[\/?]/i.test(url.trim())
}

// 去除HTML标签
const stripHtml = (text) => {
  if (!text) return ''
  return text.replace(/<[^>]+>/g, '').trim()
}

const handleImageError = (event) => {
  const img = event.target
  img.dataset.printBroken = '1'
  img.remove()
}

// ========== 链接模式：通过API抓取 ==========
const fetchArticle = async () => {
  errorMessage.value = ''
  article.value = null

  const url = inputUrl.value.trim()
  if (!url) {
    errorMessage.value = '请粘贴公众号文章链接'
    return
  }

  if (!isValidWechatUrl(url)) {
    errorMessage.value = '请输入有效的微信公众号文章链接 (mp.weixin.qq.com/s/...)'
    return
  }

  loading.value = true

  try {
    const apiUrl = API_BASE
      ? `${API_BASE}/?url=${encodeURIComponent(url)}`
      : `/api/parse-wechat?url=${encodeURIComponent(url)}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const response = await fetch(apiUrl, { signal: controller.signal })
    clearTimeout(timeout)
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || '抓取失败')
    }

    article.value = {
      title: stripHtml(data.title || '未命名文章'),
      author: stripHtml(data.author || ''),
      publishTime: data.publishTime || '',
      contentHtml: data.contentHtml || '',
      sourceUrl: url
    }
  } catch (e) {
    errorMessage.value = `API抓取失败：${e.message}。请切换到"粘贴模式"手动复制文章内容`
  } finally {
    loading.value = false
  }
}

// ========== 粘贴模式：用户手动粘贴 ==========
const pasteMode = ref('richtext') // richtext=富文本粘贴, source=源码粘贴

const parseFromPaste = () => {
  errorMessage.value = ''
  article.value = null

  const raw = pasteHtml.value.trim()
  if (!raw) {
    errorMessage.value = '请粘贴文章内容'
    return
  }

  if (pasteMode.value === 'source') {
    // 源码模式：直接当HTML解析
    const parsed = parseWechatArticle(raw)
    if (parsed) {
      article.value = parsed
    } else {
      errorMessage.value = '无法从源码中解析出文章内容，请确认粘贴的是完整的页面源代码'
    }
  } else {
    // 富文本模式：从剪贴板获取的HTML或纯文本
    // 判断是否包含HTML标签
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(raw)

    if (hasHtmlTags) {
      // 含HTML标签，尝试解析微信文章结构
      const parsed = parseWechatArticle(raw)
      if (parsed) {
        article.value = parsed
      } else {
        // 不是完整微信页面，但包含HTML格式，直接作为正文
        article.value = {
          title: '粘贴的文章',
          author: '',
          publishTime: '',
          contentHtml: raw,
          sourceUrl: ''
        }
      }
    } else {
      // 纯文本，将换行转为段落
      const paragraphs = raw.split(/\n\s*\n|\n/).filter(p => p.trim())
      const contentHtml = paragraphs.map(p => `<p>${p.trim()}</p>`).join('')
      article.value = {
        title: '粘贴的文章',
        author: '',
        publishTime: '',
        contentHtml,
        sourceUrl: ''
      }
    }
  }
}

// 从剪贴板粘贴
const pasteFromClipboard = async (target) => {
  try {
    // 优先尝试读取HTML格式
    if (navigator.clipboard && navigator.clipboard.read) {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        if (item.types.includes('text/html')) {
          const blob = await item.getType('text/html')
          const htmlText = await blob.text()
          if (target === 'paste') {
            pasteHtml.value = htmlText
          } else {
            inputUrl.value = htmlText
          }
          return
        }
      }
    }
    // 降级为纯文本
    const text = await navigator.clipboard.readText()
    if (target === 'paste') {
      pasteHtml.value = text
    } else {
      inputUrl.value = text
    }
  } catch (e) {
    errorMessage.value = '无法读取剪贴板，请手动粘贴'
  }
}

// 解析微信文章HTML
const parseWechatArticle = (html) => {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // 提取标题
    let title = doc.querySelector('#activity-name')?.textContent?.trim()
                || doc.querySelector('meta[property="og:title"]')?.getAttribute('content')
                || doc.querySelector('title')?.textContent?.replace(/_-_/g, '-').split('-')[0].trim()
                || ''

    // 提取作者
    let author = doc.querySelector('#js_name')?.textContent?.trim()
                 || doc.querySelector('.rich_media_meta_nickname')?.textContent?.trim()
                 || doc.querySelector('meta[name="author"]')?.getAttribute('content')
                 || ''

    // 提取发布时间
    let publishTime = doc.querySelector('#publish_time')?.textContent?.trim()
                      || doc.querySelector('em.rich_media_meta_text')?.textContent?.trim()
                      || ''

    // 提取正文
    const contentNode = doc.querySelector('#js_content')
    if (!contentNode) return null

    // 处理图片懒加载：data-src -> src
    contentNode.querySelectorAll('img').forEach(img => {
      const dataSrc = img.getAttribute('data-src')
      if (dataSrc) img.setAttribute('src', dataSrc)
      img.removeAttribute('data-w')
      img.removeAttribute('data-ratio')
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
    })

    // 移除脚本和样式
    contentNode.querySelectorAll('script, style, iframe, video, mpvoice, mpcheckbox').forEach(el => el.remove())

    // 显示隐藏内容
    contentNode.querySelectorAll('[style*="visibility: hidden"], [style*="display: none"]').forEach(el => {
      el.removeAttribute('style')
    })

    return {
      title: title || '未命名文章',
      author,
      publishTime,
      contentHtml: contentNode.innerHTML,
      sourceUrl: inputUrl.value.trim() || ''
    }
  } catch (e) {
    console.error('解析失败:', e)
    return null
  }
}

// 清理广告/关注引导
const cleanedContent = computed(() => {
  if (!article.value) return ''
  let html = article.value.contentHtml

  const temp = document.createElement('div')
  temp.innerHTML = html

  if (removeAds.value) {
    const removeSelectors = [
      '.qr_code_pc_outer', '.qr_code_pc',
      '.weui-msg', '.weui_msg',
      '.rich_media_extra', '.rich_media_tool',
      '[data-pluginname="mpprofile"]', '[data-pluginname="weapp_card"]',
      'mp-common-profile', 'mp-common-mpaudio',
      '.js_card_image', '.profile_card_wrp',
      'section[data-tools]'
    ]
    removeSelectors.forEach(sel => {
      temp.querySelectorAll(sel).forEach(el => el.remove())
    })

    const guideKeywords = ['长按二维码', '扫码关注', '点击上方', '点击上面', '关注我们', '点击下方', '点击关注']
    temp.querySelectorAll('p, section, div').forEach(el => {
      const text = el.textContent || ''
      if (text.length < 50 && guideKeywords.some(k => text.includes(k))) {
        el.remove()
      }
    })
  }

  temp.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || ''
    if (!showImages.value || img.dataset.printBroken === '1' || !src.trim()) {
      img.remove()
    }
  })

  return temp.innerHTML
})

// 字号映射
const fontSizeStyle = computed(() => {
  const sizes = {
    small: { fontSize: '14px', lineHeight: '1.7' },
    medium: { fontSize: '16px', lineHeight: '1.8' },
    large: { fontSize: '18px', lineHeight: '1.9' }
  }
  return sizes[fontSize.value] || sizes.medium
})

const removeBrokenImagesInPrintArea = () => {
  document.querySelectorAll('#print-area img').forEach(img => {
    const src = img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src') || ''
    if (!src.trim() || (img.complete && img.naturalWidth === 0)) {
      img.remove()
    }
  })
}

// 触发打印
const handlePrint = () => {
  if (!article.value) return
  nextTick(() => {
    removeBrokenImagesInPrintArea()
    window.print()
  })
}

// 导出 PDF（整页渲染 + 智能切片：切片位置向上寻找白色行，避免切到文字）
const exportToPdf = async () => {
  if (!article.value) return
  isExporting.value = true
  errorMessage.value = ''
  exportProgress.value = '正在渲染页面...'

  try {
    await nextTick()
    removeBrokenImagesInPrintArea()

    const element = document.getElementById('print-area')
    if (!element) throw new Error('未找到打印区域')

    // 整页渲染为高分辨率 canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000
    })

    exportProgress.value = '正在生成 PDF...'

    const pdf = new jsPDF({
      orientation: pdfOrientation.value,
      unit: 'mm',
      format: pdfPageSize.value
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 8
    const contentWidth = pageWidth - margin * 2
    const contentHeight = pageHeight - margin * 2

    // 像素与 mm 比值
    const pxPerMm = canvas.width / contentWidth
    const pageHeightPx = Math.floor(contentHeight * pxPerMm) // 单页对应的源图像素高度

    // 准备像素数据用于"白色行"检测
    const ctx = canvas.getContext('2d')
    // 阈值：超过此值视为"接近白色"
    const WHITE_THRESHOLD = 240
    // 单页可向上回退的最大像素数（避免无限回退导致页面太空）
    const MAX_LOOKBACK = Math.floor(pageHeightPx * 0.15)

    // 判断指定 y 行是否为"白色行"（整行无明显文字像素）
    const isWhiteRow = (y) => {
      if (y < 0 || y >= canvas.height) return true
      const data = ctx.getImageData(0, y, canvas.width, 1).data
      for (let i = 0; i < data.length; i += 4) {
        // 忽略完全透明像素
        if (data[i + 3] < 10) continue
        if (data[i] < WHITE_THRESHOLD || data[i + 1] < WHITE_THRESHOLD || data[i + 2] < WHITE_THRESHOLD) {
          return false
        }
      }
      return true
    }

    // 从 targetY 向上寻找一段连续白色行作为安全切割位置
    // 返回切割位置（源图 y 像素），找不到则返回 targetY（按原计划切）
    const findSafeCutY = (targetY) => {
      if (targetY >= canvas.height) return canvas.height
      // 需要至少连续 2 行白才认为是安全位置
      const NEED_WHITE = 2
      let whiteCount = 0
      const minY = Math.max(0, targetY - MAX_LOOKBACK)
      for (let y = targetY; y >= minY; y--) {
        if (isWhiteRow(y)) {
          whiteCount++
          if (whiteCount >= NEED_WHITE) {
            return y + NEED_WHITE // 切在白带的下边缘
          }
        } else {
          whiteCount = 0
        }
      }
      // 找不到安全位置，返回原目标
      return targetY
    }

    // 逐页切片
    let cursorY = 0
    let pageIdx = 0
    while (cursorY < canvas.height) {
      pageIdx++
      let cutY
      if (cursorY + pageHeightPx >= canvas.height) {
        // 最后一页，全部剩余
        cutY = canvas.height
      } else {
        exportProgress.value = `正在分析第 ${pageIdx} 页切割位置...`
        cutY = findSafeCutY(cursorY + pageHeightPx)
        // 防御：cutY 不能小于等于 cursorY（极端长内容时强制原位切）
        if (cutY <= cursorY) cutY = cursorY + pageHeightPx
      }

      const sliceHeightPx = cutY - cursorY
      // 创建切片 canvas
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceHeightPx
      const sctx = sliceCanvas.getContext('2d')
      sctx.fillStyle = '#ffffff'
      sctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
      sctx.drawImage(canvas, 0, -cursorY)

      const sliceMmHeight = sliceHeightPx / pxPerMm
      const sliceData = sliceCanvas.toDataURL('image/jpeg', pdfImageQuality.value)

      if (pageIdx > 1) pdf.addPage()
      pdf.addImage(sliceData, 'JPEG', margin, margin, contentWidth, sliceMmHeight)

      cursorY = cutY
    }

    exportProgress.value = '正在保存...'

    // 生成文件名（去除文件名非法字符 + emoji + 控制字符；为空则兜底）
    const rawTitle = article.value.title || '公众号文章'
    let safeTitle = rawTitle
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .replace(/\p{Extended_Pictographic}/gu, '')
      .trim()
    if (!safeTitle) safeTitle = '公众号文章'
    if (safeTitle.length > 80) safeTitle = safeTitle.slice(0, 80)
    const fileName = `${safeTitle}.pdf`

    // 用 blob + a 标签手动触发下载
    try {
      const blob = pdf.output('blob')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 1000)
    } catch (saveErr) {
      console.error('blob 下载失败，回退 pdf.save:', saveErr)
      pdf.save(fileName)
    }
  } catch (e) {
    console.error('PDF导出失败:', e)
    errorMessage.value = `PDF导出失败：${e.message}。图片可能因跨域无法渲染，可尝试关闭图片后导出`
  } finally {
    isExporting.value = false
    exportProgress.value = ''
  }
}

// 重置
const reset = () => {
  inputUrl.value = ''
  pasteHtml.value = ''
  article.value = null
  errorMessage.value = ''
}
</script>

<template>
  <div class="px-4 py-8 max-w-5xl mx-auto">
    <!-- 标题区 -->
    <div class="mb-8 no-print">
      <h1 class="text-3xl font-bold dark:text-white">公众号文章打印</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">粘贴公众号文章链接或内容，预览后一键打印或保存为PDF</p>
    </div>

    <!-- 输入区 -->
    <div v-if="!article" class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 no-print">
      <!-- 模式切换 -->
      <div class="flex mb-5 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          @click="mode = 'link'"
          :class="[
            'flex-1 py-2.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
            mode === 'link'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          ]"
        >
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          链接抓取
        </button>
        <button
          @click="mode = 'paste'"
          :class="[
            'flex-1 py-2.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
            mode === 'paste'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          ]"
        >
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          手动粘贴
        </button>
      </div>

      <!-- 链接模式 -->
      <div v-if="mode === 'link'">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          公众号文章链接
        </label>
        <div class="flex gap-2">
          <input
            v-model="inputUrl"
            type="url"
            class="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-base"
            placeholder="https://mp.weixin.qq.com/s/..."
            @keydown.enter="fetchArticle"
          />
          <button
            @click="pasteFromClipboard('link')"
            class="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            粘贴
          </button>
        </div>
        <div class="flex items-center justify-between mt-4">
          <!-- <p class="text-xs text-gray-400">需要部署API服务，未部署请使用手动粘贴模式</p> -->
          <button
            @click="fetchArticle"
            :disabled="loading"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg v-if="loading" class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ loading ? '抓取中...' : '获取文章' }}
          </button>
        </div>
      </div>

      <!-- 粘贴模式 -->
      <div v-if="mode === 'paste'">
        <!-- 粘贴子模式切换 -->
        <div class="flex mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1">
          <button
            @click="pasteMode = 'richtext'"
            :class="[
              'flex-1 py-2 rounded-md text-sm font-medium transition-all',
              pasteMode === 'richtext'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            复制文章内容（推荐）
          </button>
          <button
            @click="pasteMode = 'source'"
            :class="[
              'flex-1 py-2 rounded-md text-sm font-medium transition-all',
              pasteMode === 'source'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            粘贴页面源码
          </button>
        </div>

        <!-- 富文本模式说明 -->
        <div v-if="pasteMode === 'richtext'" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p class="text-sm font-medium text-green-800 dark:text-green-300 mb-1.5">操作步骤：</p>
          <ol class="text-xs text-green-700 dark:text-green-400 space-y-1 list-decimal list-inside">
            <li>在微信中打开公众号文章</li>
            <li>长按文章正文 → 点击<strong>「全选」</strong> → 点击<strong>「复制」</strong></li>
            <li>回到本页面，点击下方<strong>「从剪贴板粘贴」</strong>按钮，或按 Ctrl+V 粘贴</li>
          </ol>
          <p class="text-xs text-green-600 dark:text-green-500 mt-2">提示：复制的是文章的<strong>文字和图片</strong>（富文本），不是页面源代码</p>
        </div>

        <!-- 源码模式说明 -->
        <div v-if="pasteMode === 'source'" class="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p class="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1.5">操作步骤：</p>
          <ol class="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
            <li>在电脑浏览器中打开公众号文章</li>
            <li>按 <strong>F12</strong> 打开开发者工具 → 点击 <strong>Elements</strong>（元素）标签</li>
            <li>右键点击 <strong>&lt;html&gt;</strong> 标签 → 选择<strong>「Copy → Copy outerHTML」</strong></li>
            <li>回到本页面，按 Ctrl+V 粘贴到下方文本框</li>
          </ol>
          <p class="text-xs text-amber-600 dark:text-amber-500 mt-2">提示：粘贴的是网页的<strong>HTML源代码</strong>，能更完整地保留排版和图片</p>
        </div>

        <div class="flex gap-2 mb-3">
          <button
            v-if="pasteMode === 'richtext'"
            @click="pasteFromClipboard('paste')"
            class="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            从剪贴板粘贴
          </button>
          <button
            @click="pasteHtml = ''"
            class="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            清空
          </button>
        </div>
        <textarea
          v-model="pasteHtml"
          rows="8"
          class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none text-sm font-mono"
          :placeholder="pasteMode === 'richtext'
            ? '点击上方「从剪贴板粘贴」按钮，或按 Ctrl+V 粘贴复制的文章内容...'
            : '粘贴从浏览器开发者工具复制的HTML源代码...'"
        ></textarea>
        <div class="flex items-center justify-between mt-4">
          <span class="text-xs text-gray-400">{{ pasteHtml.length > 0 ? `已输入 ${pasteHtml.length} 字符` : '' }}</span>
          <button
            @click="parseFromPaste"
            :disabled="!pasteHtml.trim()"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            解析文章
          </button>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p class="text-red-600 dark:text-red-400 text-sm">{{ errorMessage }}</p>
      </div>

      <!-- 使用提示 -->
      <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 class="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">使用说明</h3>
        <div v-if="mode === 'link'" class="text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <p>1. 在微信公众号文章页面，点击右上角「...」→「复制链接」</p>
          <p>2. 链接模式需要部署API服务端，未部署请使用手动粘贴模式</p>
          <p>3. 部分文章可能因微信风控无法抓取，可切换手动粘贴模式</p>
        </div>
        <div v-else class="text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <p v-if="pasteMode === 'richtext'"><strong>复制文章内容</strong>：直接复制微信中的文字和图片，操作最简单，推荐普通用户使用</p>
          <p v-else><strong>粘贴页面源码</strong>：从浏览器开发者工具复制完整HTML，排版还原度最高，适合有一定技术基础的用户</p>
          <p>两种方式都能解析出文章内容，区别在于排版还原程度不同</p>
        </div>
      </div>
    </div>

    <!-- 预览与打印 -->
    <div v-if="article" class="flex flex-col lg:flex-row gap-6">
      <!-- 左侧预览 -->
      <div class="flex-1 min-w-0">
        <div id="print-area" class="bg-white shadow-md mx-auto print-paper" :style="fontSizeStyle">
          <!-- 页眉 -->
          <header v-if="showHeaderFooter" class="print-header text-xs text-gray-500 border-b border-gray-200 pb-2 mb-6">
            {{ article.title }}
          </header>

          <!-- 文章标题 -->
          <h1 class="text-2xl font-bold text-gray-900 mb-3 leading-tight">{{ article.title }}</h1>

          <!-- 作者/日期 -->
          <div v-if="article.author || article.publishTime" class="text-sm text-gray-500 mb-6 pb-4 border-b border-gray-200">
            <span v-if="article.author">{{ article.author }}</span>
            <span v-if="article.author && article.publishTime"> · </span>
            <span v-if="article.publishTime">{{ article.publishTime }}</span>
          </div>

          <!-- 文章正文 -->
          <article class="article-content text-gray-800" @error.capture="handleImageError" v-html="cleanedContent"></article>

          <!-- 页脚 -->
          <footer v-if="showHeaderFooter" class="print-footer text-xs text-gray-400 border-t border-gray-200 pt-2 mt-8">
            <div>{{ article.author }} · {{ article.publishTime }}</div>
            <div v-if="article.sourceUrl" class="truncate">原文：{{ article.sourceUrl }}</div>
          </footer>
        </div>
      </div>

      <!-- 右侧设置面板 -->
      <div class="lg:w-72 flex-shrink-0 no-print">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 sticky top-4">
          <h3 class="text-lg font-semibold dark:text-white mb-4">打印设置</h3>

          <!-- 字号 -->
          <div class="mb-5">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">字号大小</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="opt in [{v:'small',l:'小'},{v:'medium',l:'中'},{v:'large',l:'大'}]"
                :key="opt.v"
                @click="fontSize = opt.v"
                :class="[
                  'py-2 rounded-lg text-sm transition-colors border',
                  fontSize === opt.v
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                ]"
              >
                {{ opt.l }}
              </button>
            </div>
          </div>

          <!-- 开关项 -->
          <div class="space-y-3 mb-5">
            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-gray-700 dark:text-gray-300">打印图片（默认关闭）</span>
              <div class="relative">
                <input type="checkbox" v-model="showImages" class="sr-only peer">
                <div class="w-9 h-5 bg-gray-300 dark:bg-gray-600 peer-checked:bg-blue-500 rounded-full transition-colors"></div>
                <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
              </div>
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-gray-700 dark:text-gray-300">去除引导/广告</span>
              <div class="relative">
                <input type="checkbox" v-model="removeAds" class="sr-only peer">
                <div class="w-9 h-5 bg-gray-300 dark:bg-gray-600 peer-checked:bg-blue-500 rounded-full transition-colors"></div>
                <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
              </div>
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-gray-700 dark:text-gray-300">页眉页脚</span>
              <div class="relative">
                <input type="checkbox" v-model="showHeaderFooter" class="sr-only peer">
                <div class="w-9 h-5 bg-gray-300 dark:bg-gray-600 peer-checked:bg-blue-500 rounded-full transition-colors"></div>
                <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
              </div>
            </label>
          </div>

          <!-- PDF 导出设置 -->
          <div class="mb-5 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">导出 PDF 设置</h4>
            <div class="space-y-3">
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">页面大小</label>
                <select v-model="pdfPageSize"
                        class="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option v-for="size in PDF_PAGE_SIZES" :key="size.value" :value="size.value">{{ size.label }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">页面方向</label>
                <select v-model="pdfOrientation"
                        class="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option v-for="ori in PDF_ORIENTATIONS" :key="ori.value" :value="ori.value">{{ ori.label }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  图片质量: {{ Math.round(pdfImageQuality * 100) }}%
                </label>
                <input type="range" v-model="pdfImageQuality" min="0.3" max="1" step="0.02"
                       class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer">
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              @click="handlePrint"
              class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M7.875 1.5C6.839 1.5 6 2.34 6 3.375v2.99c-.426.053-.851.11-1.274.174-1.454.218-2.476 1.483-2.476 2.917v6.294a3 3 0 003 3h.27l-.155 1.705A1.875 1.875 0 007.232 22.5h9.536a1.875 1.875 0 001.867-2.045l-.155-1.705h.27a3 3 0 003-3V9.456c0-1.434-1.022-2.7-2.476-2.917A48.716 48.716 0 0018 6.366V3.375c0-1.036-.84-1.875-1.875-1.875h-8.25zM16.5 6.205v-2.83A.375.375 0 0016.125 3h-8.25a.375.375 0 00-.375.375v2.83a49.353 49.353 0 019 0zm-.217 8.265c.178.018.317.16.333.337l.526 5.784a.375.375 0 01-.374.409H7.232a.375.375 0 01-.374-.409l.526-5.784a.373.373 0 01.333-.337 41.741 41.741 0 018.566 0zM7.5 9.75a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
              </svg>
              打印 / 另存为PDF
            </button>
            <button
              @click="exportToPdf"
              :disabled="isExporting"
              :class="[
                'w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
                isExporting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              ]"
            >
              <svg v-if="!isExporting" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0116.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
                <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
              </svg>
              <svg v-else class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              {{ isExporting ? (exportProgress || '导出中...') : '导出 PDF 文件' }}
            </button>
            <button
              @click="reset"
              class="w-full py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              重新输入
            </button>
          </div>

          <p class="text-xs text-gray-400 mt-4">
            「打印」使用系统打印对话框；「导出 PDF」直接生成 PDF 文件下载，可选页面大小、方向、图片质量
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.print-paper {
  max-width: 210mm;
  min-height: 297mm;
  padding: 20mm;
  box-sizing: border-box;
  color: #333;
}

.article-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}

.article-content :deep(p) {
  margin: 0.8em 0;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  margin: 1em 0 0.5em;
  font-weight: 600;
}

.article-content :deep(blockquote) {
  border-left: 4px solid #ddd;
  padding-left: 1em;
  color: #666;
  margin: 1em 0;
}

.article-content :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}

.article-content :deep(code) {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

.article-content :deep(pre) {
  background: #f3f4f6;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
}

.article-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.article-content :deep(table td),
.article-content :deep(table th) {
  border: 1px solid #ddd;
  padding: 6px 8px;
}

/* 打印样式 */
@media print {
  .print-paper {
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
    min-height: auto !important;
  }

  .article-content :deep(img) {
    page-break-inside: avoid;
  }

  .article-content :deep(h1),
  .article-content :deep(h2),
  .article-content :deep(h3) {
    page-break-after: avoid;
  }
}
</style>

<style>
@media print {
  @page {
    size: A4;
    margin: 15mm 12mm;
  }

  body * {
    visibility: hidden;
  }

  #print-area,
  #print-area * {
    visibility: visible;
  }

  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>
