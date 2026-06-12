<script setup>
import { ref } from 'vue'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close'])

const type = ref('suggestion')
const content = ref('')
const contact = ref('')
const submitting = ref(false)
const submitted = ref(false)
const errorMsg = ref('')

const typeOptions = [
  { value: 'suggestion', label: '功能建议', icon: '💡' },
  { value: 'bug', label: '问题反馈', icon: '🐛' },
  { value: 'other', label: '其他', icon: '📝' },
]

async function submit() {
  if (!content.value.trim()) {
    errorMsg.value = '请输入反馈内容'
    return
  }
  if (content.value.length > 2000) {
    errorMsg.value = '反馈内容不能超过2000字'
    return
  }

  submitting.value = true
  errorMsg.value = ''

  try {
    const API_BASE = import.meta.env.VITE_API_BASE || ''
    const res = await fetch(`${API_BASE}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type.value,
        content: content.value.trim(),
        contact: contact.value.trim(),
      }),
    })
    const data = await res.json()
    if (data.success) {
      submitted.value = true
    } else {
      errorMsg.value = data.error || '提交失败，请稍后重试'
    }
  } catch (e) {
    errorMsg.value = '网络错误，请稍后重试'
  } finally {
    submitting.value = false
  }
}

function close() {
  emit('close')
  // 延迟重置，等动画结束
  setTimeout(() => {
    type.value = 'suggestion'
    content.value = ''
    contact.value = ''
    submitted.value = false
    errorMsg.value = ''
  }, 200)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4" @click.self="close">
        <!-- 遮罩 -->
        <div class="absolute inset-0 bg-black/50" @click="close"></div>

        <!-- 弹窗 -->
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
          <!-- 关闭按钮 -->
          <button @click="close" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- 提交成功 -->
          <div v-if="submitted" class="text-center py-8">
            <div class="text-5xl mb-4">🎉</div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">感谢反馈！</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm">你的反馈已收到，我们会认真对待每一条建议。</p>
            <button @click="close" class="mt-6 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">关闭</button>
          </div>

          <!-- 表单 -->
          <div v-else>
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-1">意见反馈</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-5">你的建议对我们很重要</p>

            <!-- 类型选择 -->
            <div class="flex gap-2 mb-4">
              <button
                v-for="opt in typeOptions"
                :key="opt.value"
                @click="type = opt.value"
                :class="type === opt.value
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'"
                class="flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-1.5"
              >
                <span>{{ opt.icon }}</span>
                <span>{{ opt.label }}</span>
              </button>
            </div>

            <!-- 内容 -->
            <div class="mb-4">
              <textarea
                v-model="content"
                placeholder="请描述你的建议或遇到的问题..."
                rows="4"
                maxlength="2000"
                class="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-700 focus:border-primary-300 dark:focus:border-primary-700 outline-none resize-none transition-all text-sm"
              ></textarea>
              <div class="text-right text-xs text-gray-400 mt-1">{{ content.length }}/2000</div>
            </div>

            <!-- 联系方式 -->
            <div class="mb-5">
              <input
                v-model="contact"
                type="text"
                placeholder="联系方式（选填，方便我们回复你）"
                maxlength="100"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-700 focus:border-primary-300 dark:focus:border-primary-700 outline-none transition-all text-sm"
              />
            </div>

            <!-- 错误信息 -->
            <p v-if="errorMsg" class="text-red-500 text-sm mb-3">{{ errorMsg }}</p>

            <!-- 提交按钮 -->
            <button
              @click="submit"
              :disabled="submitting"
              class="w-full py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ submitting ? '提交中...' : '提交反馈' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
