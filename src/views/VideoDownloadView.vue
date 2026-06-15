<script setup>
import { ref, computed } from 'vue'
import { useToast } from '../composables/useToast'

const toast = useToast()

const videoUrl = ref('')
const selectedSource = ref('bilibili')
const isAnalyzing = ref(false)
const videoInfo = ref(null)
const showError = ref(false)
const errorMessage = ref('')

const videoSources = [
  { id: 'bilibili', name: '哔哩哔哩', icon: '📺', enabled: true, color: 'pink' },
  { id: 'douyin', name: '抖音', icon: '🎵', enabled: true, color: 'cyan' },
  { id: 'kuaishou', name: '快手', icon: '🎬', enabled: false, color: 'orange' },
  { id: 'xiaohongshu', name: '小红书', icon: '📕', enabled: true, color: 'red' },
  { id: 'weibo', name: '微博', icon: '📱', enabled: false, color: 'orange' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', enabled: false, color: 'red' }
]

const currentSource = computed(() => {
  return videoSources.find(s => s.id === selectedSource.value)
})

// ─── URL 校验 ───
const isValidBilibiliUrl = (url) => {
  const patterns = [
    /bilibili\.com\/video\/(BV|av)[a-zA-Z0-9]+/i,
    /b23\.tv\/[a-zA-Z0-9]+/i,
    /bilibili\.com\/bangumi\/play\/(ep|ss)[0-9]+/i
  ]
  return patterns.some(p => p.test(url))
}

const isValidDouyinUrl = (url) => {
  const patterns = [
    /douyin\.com\/video\/\d+/i,
    /douyin\.com\/.*modal_id=\d+/i,
    /v\.douyin\.com\/[a-zA-Z0-9]+/i,
    /iesdouyin\.com\/share\/video\/\d+/i,
    /抖音分享.*https?:\/\/[^\s]+douyin/i
  ]
  return patterns.some(p => p.test(url))
}

const isValidXiaohongshuUrl = (url) => {
  const patterns = [
    /xiaohongshu\.com\/explore\/[a-zA-Z0-9]+/i,
    /xiaohongshu\.com\/discovery\/item\/[a-zA-Z0-9]+/i,
    /xhslink\.com\/[a-zA-Z0-9]+/i,
    /小红书分享.*https?:\/\/[^\s]+xiaohongshu/i
  ]
  return patterns.some(p => p.test(url))
}

// ─── ID 提取 ───
const extractBvid = (url) => {
  const bvMatch = url.match(/BV[a-zA-Z0-9]+/)
  if (bvMatch) return bvMatch[0]
  const avMatch = url.match(/av(\d+)/)
  if (avMatch) return `av${avMatch[1]}`
  return null
}

const extractDouyinId = (url) => {
  const m1 = url.match(/video\/(\d+)/)
  if (m1) return m1[1]
  const m2 = url.match(/modal_id=(\d+)/)
  if (m2) return m2[1]
  return null
}

const extractXhsId = (url) => {
  const m1 = url.match(/explore\/([a-zA-Z0-9]+)/)
  if (m1) return m1[1]
  const m2 = url.match(/item\/([a-zA-Z0-9]+)/)
  if (m2) return m2[1]
  return null
}

// ─── 解析主逻辑 ───
const analyzeVideo = async () => {
  if (!videoUrl.value.trim()) {
    errorMessage.value = '请输入视频链接'
    showError.value = true
    return
  }

  // 校验链接格式
  if (selectedSource.value === 'bilibili' && !isValidBilibiliUrl(videoUrl.value)) {
    errorMessage.value = '请输入有效的B站视频链接（如 bilibili.com/video/BV... 或 b23.tv/...）'
    showError.value = true
    return
  }
  if (selectedSource.value === 'douyin' && !isValidDouyinUrl(videoUrl.value)) {
    errorMessage.value = '请输入有效的抖音视频链接（如 douyin.com/video/... 或 v.douyin.com/...）'
    showError.value = true
    return
  }
  if (selectedSource.value === 'xiaohongshu' && !isValidXiaohongshuUrl(videoUrl.value)) {
    errorMessage.value = '请输入有效的小红书链接（如 xiaohongshu.com/explore/... 或 xhslink.com/...）'
    showError.value = true
    return
  }

  isAnalyzing.value = true
  showError.value = false
  videoInfo.value = null

  try {
    if (selectedSource.value === 'bilibili') {
      const bvid = extractBvid(videoUrl.value)
      videoInfo.value = {
        title: 'B站视频',
        id: bvid || '未知',
        idLabel: 'BV号',
        icon: '📺',
        author: '未知作者',
        description: '由于浏览器跨域限制，无法直接获取视频详情。请使用下方推荐的方法下载。',
        downloadMethods: [
          {
            name: '方法一：使用在线解析网站',
            steps: [
              '访问 bilibili.iiilab.com 等在线解析网站',
              '粘贴视频链接到输入框',
              '点击解析按钮',
              '选择视频清晰度并下载'
            ]
          },
          {
            name: '方法二：使用浏览器插件',
            steps: [
              '安装 "B站下载助手" 或类似插件',
              '打开B站视频页面',
              '点击插件图标',
              '选择下载格式和清晰度'
            ]
          },
          {
            name: '方法三：使用命令行工具',
            steps: [
              '安装 you-get: pip install you-get',
              '运行命令: you-get [视频链接]',
              '视频将自动下载到当前目录'
            ]
          },
          {
            name: '方法四：使用BBDown工具',
            steps: [
              '下载 BBDown: github.com/nilaoda/BBDown',
              '运行: BBDown [视频链接]',
              '支持多清晰度和字幕下载'
            ]
          }
        ]
      }
    } else if (selectedSource.value === 'douyin') {
      const douyinId = extractDouyinId(videoUrl.value)
      videoInfo.value = {
        title: '抖音视频',
        id: douyinId || '未知',
        idLabel: '视频ID',
        icon: '🎵',
        author: '未知作者',
        description: '抖音视频可通过以下方式去水印下载。短链接会自动重定向到完整链接，建议直接粘贴完整链接。',
        downloadMethods: [
          {
            name: '方法一：使用在线去水印网站',
            steps: [
              '访问 douyin.wtf 或 tools.knowmore.cn 等抖音去水印网站',
              '粘贴抖音视频链接（分享→复制链接）',
              '点击解析，获取无水印视频地址',
              '右键视频→另存为，或长按保存'
            ]
          },
          {
            name: '方法二：使用浏览器插件',
            steps: [
              '安装 "抖音下载助手" 或 "Video DownloadHelper" 插件',
              '打开抖音视频页面（网页版 douyin.com）',
              '播放视频后点击插件图标',
              '选择下载视频'
            ]
          },
          {
            name: '方法三：使用命令行工具',
            steps: [
              '安装 you-get: pip install you-get',
              '运行命令: you-get -i [视频链接] 查看可用格式',
              '运行: you-get [视频链接] 下载视频'
            ]
          },
          {
            name: '方法四：手机端下载',
            steps: [
              '在抖音App中点击分享→复制链接',
              '打开微信小程序搜索"抖音去水印"',
              '粘贴链接解析并保存视频',
              '也可使用"快捷指令"(iOS)自动化去水印'
            ]
          }
        ]
      }
    } else if (selectedSource.value === 'xiaohongshu') {
      const xhsId = extractXhsId(videoUrl.value)
      videoInfo.value = {
        title: '小红书笔记/视频',
        id: xhsId || '未知',
        idLabel: '笔记ID',
        icon: '📕',
        author: '未知作者',
        description: '小红书视频/图片可通过以下方式保存。支持图文笔记和视频笔记。',
        downloadMethods: [
          {
            name: '方法一：使用在线解析网站',
            steps: [
              '访问 tools.knowmore.cn 或 xhslink.com 解析网站',
              '粘贴小红书笔记链接（分享→复制链接）',
              '点击解析，获取无水印图片/视频地址',
              '右键保存图片，或下载视频'
            ]
          },
          {
            name: '方法二：使用浏览器插件',
            steps: [
              '安装 "小红书下载助手" 或 "Video DownloadHelper" 插件',
              '打开小红书网页版 (xiaohongshu.com)',
              '进入笔记详情页，点击插件图标',
              '选择下载图片或视频'
            ]
          },
          {
            name: '方法三：使用命令行工具',
            steps: [
              '安装 you-get: pip install you-get',
              '运行: you-get [笔记链接] 下载视频',
              '图片可使用浏览器开发者工具逐张保存'
            ]
          },
          {
            name: '方法四：手机端保存',
            steps: [
              '在小红书App中点击分享→复制链接',
              '使用微信小程序搜索"小红书去水印"',
              '粘贴链接解析并保存图片/视频',
              '长按图片也可直接保存（含水印）'
            ]
          }
        ]
      }
    }
  } catch (error) {
    errorMessage.value = '解析失败：' + error.message
    showError.value = true
  } finally {
    isAnalyzing.value = false
  }
}

const clearInput = () => {
  videoUrl.value = ''
  videoInfo.value = null
  showError.value = false
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('已复制到剪贴板')
  }).catch(() => {
    toast.error('复制失败')
  })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">视频下载</h1>
        <p class="text-gray-600 dark:text-gray-400">支持多个视频平台，一键解析下载</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">选择视频源</h2>
        
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          <button
            v-for="source in videoSources"
            :key="source.id"
            @click="source.enabled && (selectedSource = source.id)"
            :disabled="!source.enabled"
            :class="[
              'p-3 rounded-lg border-2 transition-all text-center',
              selectedSource === source.id 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                : 'border-gray-200 dark:border-gray-700',
              source.enabled 
                ? 'hover:border-primary-300 cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
            ]"
          >
            <div class="text-2xl mb-1">{{ source.icon }}</div>
            <div class="text-xs text-gray-600 dark:text-gray-400">{{ source.name }}</div>
            <div v-if="!source.enabled" class="text-xs text-gray-400 mt-1">敬请期待</div>
          </button>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            输入{{ currentSource?.name }}视频链接
          </label>
          <div class="flex gap-3">
            <input
              v-model="videoUrl"
              type="text"
              :placeholder="{
                bilibili: '请粘贴B站视频链接，如 bilibili.com/video/BV...',
                douyin: '请粘贴抖音视频链接，如 douyin.com/video/... 或 v.douyin.com/...',
                xiaohongshu: '请粘贴小红书笔记链接，如 xiaohongshu.com/explore/...',
                kuaishou: '请粘贴快手视频链接...',
                weibo: '请粘贴微博视频链接...',
                youtube: '请粘贴YouTube视频链接...'
              }[selectedSource] || '请粘贴视频链接...'"
              class="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              @keyup.enter="analyzeVideo"
            />
            <button
              @click="analyzeVideo"
              :disabled="isAnalyzing"
              class="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {{ isAnalyzing ? '解析中...' : '解析' }}
            </button>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            <template v-if="selectedSource === 'bilibili'">支持视频详情页链接、短链接 (b23.tv)、番剧链接等</template>
            <template v-else-if="selectedSource === 'douyin'">支持 douyin.com 视频链接、v.douyin.com 短链接、分享口令中的链接</template>
            <template v-else-if="selectedSource === 'xiaohongshu'">支持 xiaohongshu.com 笔记链接、xhslink.com 短链接、分享口令中的链接</template>
          </p>
        </div>

        <!-- 快捷操作：粘贴剪贴板 -->
        <div class="flex items-center gap-3 mb-4">
          <button @click="async () => { try { videoUrl = await navigator.clipboard.readText() } catch(e) { toast.warning('无法读取剪贴板') } }"
            class="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            粘贴剪贴板
          </button>
          <button @click="clearInput"
            class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
            清空输入
          </button>
        </div>

        <div v-if="showError" class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
          <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        </div>
      </div>

      <div v-if="videoInfo" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">解析结果</h2>
        
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center text-3xl">
              {{ videoInfo.icon }}
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-gray-800 dark:text-white">{{ videoInfo.title }}</h3>
              <div class="flex items-center gap-2 mt-1">
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ videoInfo.idLabel }}: {{ videoInfo.id }}</p>
                <button v-if="videoInfo.id !== '未知'" @click="copyToClipboard(videoInfo.id)"
                  class="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                  复制
                </button>
              </div>
            </div>
            <button @click="copyToClipboard(videoUrl)"
              class="text-sm px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
              复制链接
            </button>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ videoInfo.description }}</p>
        </div>

        <div class="space-y-4">
          <h3 class="font-medium text-gray-800 dark:text-white">推荐下载方法</h3>
          
          <div v-for="(method, index) in videoInfo.downloadMethods" :key="index" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 class="font-medium text-gray-800 dark:text-white mb-3">{{ method.name }}</h4>
            <ol class="space-y-2">
              <li v-for="(step, stepIndex) in method.steps" :key="stepIndex" class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span class="flex-shrink-0 w-5 h-5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs">
                  {{ stepIndex + 1 }}
                </span>
                <span>{{ step }}</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">使用说明</h2>
        
        <div class="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="font-medium text-gray-800 dark:text-white">为什么不能直接下载？</p>
              <p>由于浏览器安全策略（跨域限制），网页无法直接访问视频平台的接口。建议使用专业的下载工具或浏览器插件。</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="font-medium text-gray-800 dark:text-white">推荐工具</p>
              <ul class="mt-1 space-y-1">
                <li>• <strong>you-get</strong> - 支持B站/抖音/小红书等多平台下载</li>
                <li>• <strong>BBDown</strong> - 功能强大的B站视频下载命令行工具</li>
                <li>• <strong>Video DownloadHelper</strong> - 浏览器插件，支持多平台</li>
                <li>• <strong>唧唧Down</strong> - 图形界面B站下载工具</li>
              </ul>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <div>
              <p class="font-medium text-gray-800 dark:text-white">如何获取视频链接？</p>
              <ul class="mt-1 space-y-1">
                <li>• <strong>抖音</strong>：App中点击分享→复制链接，或使用网页版 douyin.com</li>
                <li>• <strong>小红书</strong>：App中点击分享→复制链接，或使用网页版 xiaohongshu.com</li>
                <li>• <strong>B站</strong>：直接复制浏览器地址栏链接</li>
              </ul>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p class="font-medium text-gray-800 dark:text-white">版权声明</p>
              <p>请尊重版权，下载的视频仅供个人学习使用，请勿用于商业用途或二次传播。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
