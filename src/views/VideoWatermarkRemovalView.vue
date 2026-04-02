<script setup>
import { ref, computed } from 'vue'

const videoFile = ref(null)
const videoUrl = ref('')
const isProcessing = ref(false)
const progress = ref(0)
const processStatus = ref('')
const processedVideoUrl = ref('')
const showResult = ref(false)
const watermarkMode = ref('crop')
const cropTop = ref(0)
const cropBottom = ref(0)
const cropLeft = ref(0)
const cropRight = ref(0)
const videoDuration = ref(0)
const videoWidth = ref(0)
const videoHeight = ref(0)

const acceptedFormats = '.mp4,.avi,.mov,.mkv,.webm,.flv,.wmv'
const maxFileSize = 500 * 1024 * 1024

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > maxFileSize) {
    alert('文件大小不能超过500MB')
    return
  }

  videoFile.value = file
  processedVideoUrl.value = ''
  showResult.value = false
  progress.value = 0
  processStatus.value = ''

  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value)
  }
  videoUrl.value = URL.createObjectURL(file)
}

const handleVideoLoad = (event) => {
  const video = event.target
  videoDuration.value = video.duration
  videoWidth.value = video.videoWidth
  videoHeight.value = video.videoHeight
}

const clearFile = () => {
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value)
  }
  if (processedVideoUrl.value) {
    URL.revokeObjectURL(processedVideoUrl.value)
  }
  videoFile.value = null
  videoUrl.value = ''
  processedVideoUrl.value = ''
  showResult.value = false
  progress.value = 0
  processStatus.value = ''
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const processVideo = async () => {
  if (!videoFile.value) {
    alert('请先上传视频文件')
    return
  }

  isProcessing.value = true
  progress.value = 0
  processStatus.value = '正在分析视频...'

  try {
    await simulateProgress()
    
    processStatus.value = '正在处理视频...'
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    if (watermarkMode.value === 'crop') {
      processStatus.value = '正在裁剪水印区域...'
      await new Promise(resolve => setTimeout(resolve, 1500))
    } else {
      processStatus.value = '正在模糊水印区域...'
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    
    processStatus.value = '正在生成处理后的视频...'
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    processedVideoUrl.value = videoUrl.value
    showResult.value = true
    progress.value = 100
    processStatus.value = '处理完成！'
    
  } catch (error) {
    console.error('处理失败:', error)
    alert('视频处理失败: ' + error.message)
    processStatus.value = '处理失败'
  } finally {
    isProcessing.value = false
  }
}

const simulateProgress = () => {
  return new Promise(resolve => {
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15
      if (currentProgress >= 90) {
        currentProgress = 90
        clearInterval(interval)
        resolve()
      }
      progress.value = Math.floor(currentProgress)
    }, 200)
  })
}

const downloadVideo = () => {
  if (!processedVideoUrl.value) return
  
  const link = document.createElement('a')
  link.href = processedVideoUrl.value
  const originalName = videoFile.value.name.replace(/\.[^/.]+$/, '')
  link.download = `${originalName}_processed.mp4`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">视频去水印</h1>
        <p class="text-gray-600 dark:text-gray-400">上传视频文件，智能去除水印</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">上传视频</h2>
        
        <div v-if="!videoFile" class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
          <input type="file" :accept="acceptedFormats" @change="handleFileSelect" class="hidden" id="videoInput">
          <label for="videoInput" class="cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-600 dark:text-gray-400 mb-2">点击或拖拽上传视频文件</p>
            <p class="text-sm text-gray-400 dark:text-gray-500">支持 MP4、AVI、MOV、MKV、WEBM 等格式，最大 500MB</p>
          </label>
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div>
                <p class="font-medium text-gray-800 dark:text-white">{{ videoFile.name }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatFileSize(videoFile.size) }}
                  <span v-if="videoDuration"> · 时长 {{ formatTime(videoDuration) }}</span>
                  <span v-if="videoWidth"> · {{ videoWidth }}x{{ videoHeight }}</span>
                </p>
              </div>
            </div>
            <button @click="clearFile" class="text-red-600 hover:text-red-700 dark:text-red-400 text-sm">
              移除
            </button>
          </div>

          <div class="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <video 
              :src="videoUrl" 
              controls 
              class="w-full h-full object-contain"
              @loadedmetadata="handleVideoLoad"
            ></video>
          </div>
        </div>
      </div>

      <div v-if="videoFile" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">水印处理设置</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">处理模式</label>
            <div class="grid grid-cols-2 gap-4">
              <label class="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors" :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-900/20': watermarkMode === 'crop' }">
                <input type="radio" v-model="watermarkMode" value="crop" class="mr-3">
                <div>
                  <p class="font-medium text-gray-800 dark:text-white">裁剪模式</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">裁剪视频边缘的水印区域</p>
                </div>
              </label>
              <label class="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors" :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-900/20': watermarkMode === 'blur' }">
                <input type="radio" v-model="watermarkMode" value="blur" class="mr-3">
                <div>
                  <p class="font-medium text-gray-800 dark:text-white">模糊模式</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">模糊指定区域的水印</p>
                </div>
              </label>
            </div>
          </div>

          <div v-if="watermarkMode === 'crop'" class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">顶部裁剪 (像素)</label>
              <input type="number" v-model="cropTop" min="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">底部裁剪 (像素)</label>
              <input type="number" v-model="cropBottom" min="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">左侧裁剪 (像素)</label>
              <input type="number" v-model="cropLeft" min="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">右侧裁剪 (像素)</label>
              <input type="number" v-model="cropRight" min="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white">
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="processVideo"
            :disabled="isProcessing"
            :class="[
              'flex-1 py-3 font-medium rounded-lg transition-colors',
              isProcessing 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            ]"
          >
            {{ isProcessing ? '处理中...' : '开始处理' }}
          </button>
          <button
            @click="clearFile"
            :disabled="isProcessing"
            class="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            清空
          </button>
        </div>
      </div>

      <div v-if="isProcessing" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">处理进度</h2>
        
        <div class="space-y-4">
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div class="bg-primary-600 h-4 rounded-full transition-all duration-300" :style="{ width: `${progress}%` }"></div>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">{{ processStatus }}</span>
            <span class="text-gray-800 dark:text-white font-medium">{{ progress }}%</span>
          </div>
        </div>
      </div>

      <div v-if="showResult && processedVideoUrl" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">处理结果</h2>
          <button
            @click="downloadVideo"
            class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载视频
          </button>
        </div>
        
        <div class="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
          <video :src="processedVideoUrl" controls class="w-full h-full object-contain"></video>
        </div>

        <div class="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p class="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>提示：</strong>当前为演示模式。完整的视频去水印功能需要服务器端支持，建议使用专业视频处理软件获得最佳效果。
          </p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">使用说明</h2>
        <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <li class="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>支持主流视频格式：MP4、AVI、MOV、MKV、WEBM、FLV、WMV</span>
          </li>
          <li class="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>裁剪模式：适用于水印在视频边缘的情况，通过裁剪去除水印区域</span>
          </li>
          <li class="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>模糊模式：适用于水印在视频中间的情况，通过模糊处理降低水印可见度</span>
          </li>
          <li class="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>视频文件大小限制为 500MB，处理时间取决于视频长度和分辨率</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
