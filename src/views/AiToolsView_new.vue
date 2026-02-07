<script setup>
import { ref, computed } from 'vue'
import SideNav from '../components/SideNav.vue'

// 工具数据
const tools = [
  {
    id: 1,
    name: '智能对话助手',
    description: '支持多领域知识问答，帮助孩子解决学习和生活中的问题',
    image: 'https://picsum.photos/seed/ai-chat-assistant/300/200.jpg',
    category: 'AI对话',
    tags: ['对话', '问答', '学习'],
    ageRange: '6-18岁',
    url: '#'
  },
  {
    id: 2,
    name: 'AI故事创作',
    description: '根据孩子的喜好生成个性化故事，激发想象力',
    image: 'https://picsum.photos/seed/ai-storyteller/300/200.jpg',
    category: 'AI对话',
    tags: ['故事', '创意', '想象'],
    ageRange: '4-12岁',
    url: '#'
  },
  {
    id: 3,
    name: 'AI绘画生成',
    description: '输入文字描述，AI自动生成精美图片',
    image: 'https://picsum.photos/seed/ai-image-generator/300/200.jpg',
    category: 'AI图形',
    tags: ['绘画', '创作', '艺术'],
    ageRange: '5-18岁',
    url: '#'
  },
  {
    id: 4,
    name: 'AI头像生成',
    description: '创建个性化卡通或写实头像，培养艺术审美',
    image: 'https://picsum.photos/seed/ai-avatar-creator/300/200.jpg',
    category: 'AI图形',
    tags: ['头像', '设计', '个性化'],
    ageRange: '8-18岁',
    url: '#'
  },
  {
    id: 5,
    name: 'AI视频制作',
    description: '通过简单的文字或图片创建有趣的短视频',
    image: 'https://picsum.photos/seed/ai-video-creator/300/200.jpg',
    category: 'AI视频',
    tags: ['视频', '创作', '媒体'],
    ageRange: '10-18岁',
    url: '#'
  },
  {
    id: 6,
    name: 'AI动画生成',
    description: '创建个性化动画角色和简单动画故事',
    image: 'https://picsum.photos/seed/ai-animation/300/200.jpg',
    category: 'AI视频',
    tags: ['动画', '故事', '创意'],
    ageRange: '8-16岁',
    url: '#'
  },
  {
    id: 7,
    name: 'AI作业辅导',
    description: '智能解答作业问题，提供详细解题思路',
    image: 'https://picsum.photos/seed/ai-homework-helper/300/200.jpg',
    category: 'AI学习',
    tags: ['作业', '辅导', '学习'],
    ageRange: '8-18岁',
    url: '#'
  },
  {
    id: 8,
    name: 'AI知识图谱',
    description: '可视化知识结构，帮助理解复杂概念',
    image: 'https://picsum.photos/seed/ai-knowledge-map/300/200.jpg',
    category: 'AI学习',
    tags: ['知识', '图谱', '理解'],
    ageRange: '10-18岁',
    url: '#'
  },
  {
    id: 9,
    name: 'AI音乐创作',
    description: '根据喜好生成个性化音乐，培养音乐素养',
    image: 'https://picsum.photos/seed/ai-music-generator/300/200.jpg',
    category: 'AI音频',
    tags: ['音乐', '创作', '艺术'],
    ageRange: '6-18岁',
    url: '#'
  },
  {
    id: 10,
    name: 'AI语音变声',
    description: '有趣的语音处理工具，用于创意表达',
    image: 'https://picsum.photos/seed/ai-voice-changer/300/200.jpg',
    category: 'AI音频',
    tags: ['语音', '变声', '创意'],
    ageRange: '8-16岁',
    url: '#'
  },
  {
    id: 11,
    name: 'AI作文助手',
    description: '帮助孩子提升写作能力，提供创意灵感和写作指导',
    image: 'https://picsum.photos/seed/ai-writing/300/200.jpg',
    category: '写作辅助',
    tags: ['写作', '作文', '创意'],
    ageRange: '8-18岁',
    url: '#'
  },
  {
    id: 12,
    name: '数学解题工具',
    description: 'AI驱动的数学问题解答器，提供详细步骤和解题思路',
    image: 'https://picsum.photos/seed/ai-math/300/200.jpg',
    category: '数学辅助',
    tags: ['数学', '解题', '学习'],
    ageRange: '10-18岁',
    url: '#'
  },
  {
    id: 13,
    name: '英语口语练习',
    description: '与AI对话练习英语口语，提升语言表达能力和自信心',
    image: 'https://picsum.photos/seed/ai-language/300/200.jpg',
    category: '语言学习',
    tags: ['英语', '口语', '练习'],
    ageRange: '6-18岁',
    url: '#'
  },
  {
    id: 14,
    name: '绘画创作助手',
    description: 'AI绘画工具，激发孩子的艺术创造力和想象力',
    image: 'https://picsum.photos/seed/ai-art/300/200.jpg',
    category: '艺术创作',
    tags: ['绘画', '艺术', '创意'],
    ageRange: '5-18岁',
    url: '#'
  },
  {
    id: 15,
    name: '编程学习平台',
    description: '通过AI交互式教学，让孩子轻松学习编程基础',
    image: 'https://picsum.photos/seed/ai-coding/300/200.jpg',
    category: '编程教育',
    tags: ['编程', '学习', '教育'],
    ageRange: '10-18岁',
    url: '#'
  },
  {
    id: 16,
    name: '科学实验模拟器',
    description: '虚拟科学实验室，安全探索科学原理和现象',
    image: 'https://picsum.photos/seed/ai-science/300/200.jpg',
    category: '科学教育',
    tags: ['科学', '实验', '探索'],
    ageRange: '8-18岁',
    url: '#'
  }
]

// 获取所有分类
const categories = computed(() => {
  const allCategories = tools.map(tool => tool.category)
  return ['全部', ...new Set(allCategories)]
})

// 当前选中的分类
const selectedCategory = ref('全部')

// 过滤后的工具列表
const filteredTools = computed(() => {
  if (selectedCategory.value === '全部') {
    return tools
  }
  return tools.filter(tool => tool.category === selectedCategory.value)
})
</script>

<template>
  <div class="flex">
    <!-- 左侧导航 -->
    <SideNav />

    <!-- 右侧内容区 -->
    <div class="flex-1 lg:ml-64 px-4 py-8">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold">AI工具箱</h1>
        <p class="text-gray-600 mt-2">探索各种AI工具，助力孩子学习和成长</p>
      </div>

      <!-- Category Filter -->
      <div class="mb-8">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="category in categories"
            :key="category"
            @click="selectedCategory = category"
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              selectedCategory === category
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            ]"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <!-- Tools Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="tool in filteredTools"
          :key="tool.id"
          class="tool-card hover:shadow-xl transition-all duration-300"
        >
          <div class="mb-4">
            <img :src="tool.image" :alt="tool.name" class="w-full h-48 object-cover rounded-lg">
          </div>
          <h3 class="text-xl font-semibold mb-2">{{ tool.name }}</h3>
          <p class="text-gray-600 mb-3">{{ tool.description }}</p>
          <div class="flex flex-wrap gap-2 mb-4">
            <span
              v-for="tag in tool.tags"
              :key="tag"
              class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {{ tag }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">{{ tool.ageRange }}</span>
            <a
              :href="tool.url"
              target="_blank"
              class="btn btn-primary text-sm"
            >
              访问工具
            </a>
          </div>
        </div>
      </div>

      <!-- No Results Message -->
      <div v-if="filteredTools.length === 0" class="text-center py-12">
        <p class="text-gray-500">没有找到相关工具</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-card {
  @apply bg-white rounded-lg shadow-md overflow-hidden;
}

.btn {
  @apply px-4 py-2 rounded-md font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}
</style>