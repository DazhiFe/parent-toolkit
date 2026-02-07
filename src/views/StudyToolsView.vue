<script setup>
import { ref, computed } from 'vue'

const studyTools = ref([
  {
    id: 1,
    name: '记忆卡片',
    description: '通过间隔重复法帮助孩子高效记忆知识点',
    category: '记忆辅助',
    image: 'https://picsum.photos/seed/flashcards/300/200.jpg',
    rating: 4.8,
    ageGroup: '6-18岁'
  },
  {
    id: 2,
    name: '学习计划表',
    description: '帮助孩子制定合理的学习计划，培养时间管理能力',
    category: '时间管理',
    image: 'https://picsum.photos/seed/schedule/300/200.jpg',
    rating: 4.6,
    ageGroup: '8-18岁'
  },
  {
    id: 3,
    name: '阅读理解训练',
    description: '提供分级阅读材料和 comprehension 练习，提升阅读能力',
    category: '阅读训练',
    image: 'https://picsum.photos/seed/reading/300/200.jpg',
    rating: 4.7,
    ageGroup: '6-15岁'
  },
  {
    id: 4,
    name: '专注力训练',
    description: '通过游戏化训练提升孩子的专注力和注意力',
    category: '能力培养',
    image: 'https://picsum.photos/seed/focus/300/200.jpg',
    rating: 4.5,
    ageGroup: '5-12岁'
  },
  {
    id: 5,
    name: '错题本',
    description: '整理和管理错题，针对性复习提升学习效果',
    category: '学习管理',
    image: 'https://picsum.photos/seed/mistakes/300/200.jpg',
    rating: 4.9,
    ageGroup: '8-18岁'
  },
  {
    id: 6,
    name: '思维导图',
    description: '可视化知识结构，帮助孩子理解和记忆复杂概念',
    category: '思维工具',
    image: 'https://picsum.photos/seed/mindmap/300/200.jpg',
    rating: 4.7,
    ageGroup: '10-18岁'
  }
])

const categories = ref(['全部', '记忆辅助', '时间管理', '阅读训练', '能力培养', '学习管理', '思维工具'])
const selectedCategory = ref('全部')

const filteredTools = computed(() => {
  if (selectedCategory.value === '全部') {
    return studyTools.value
  }
  return studyTools.value.filter(tool => tool.category === selectedCategory.value)
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">学习工具</h1>
    
    <!-- 记忆辅助 -->
    <section id="memory" class="mb-12">
      <h2 class="text-2xl font-semibold mb-6">记忆辅助</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="tool-card hover:shadow-xl transition-all duration-300">
          <div class="mb-4">
            <img src="https://picsum.photos/seed/memory-cards/300/200.jpg" alt="记忆卡片" class="w-full h-48 object-cover rounded-lg">
          </div>
          <h3 class="text-xl font-semibold mb-2">记忆卡片</h3>
          <p class="text-gray-600 mb-3">通过间隔重复法帮助孩子高效记忆知识点</p>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">适合年龄: 6-18岁</span>
            <button class="btn btn-primary text-sm">开始使用</button>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 时间管理 -->
    <section id="time" class="mb-12">
      <h2 class="text-2xl font-semibold mb-6">时间管理</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="tool-card hover:shadow-xl transition-all duration-300">
          <div class="mb-4">
            <img src="https://picsum.photos/seed/study-schedule/300/200.jpg" alt="学习计划表" class="w-full h-48 object-cover rounded-lg">
          </div>
          <h3 class="text-xl font-semibold mb-2">学习计划表</h3>
          <p class="text-gray-600 mb-3">帮助孩子制定合理的学习计划，培养时间管理能力</p>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">适合年龄: 8-18岁</span>
            <button class="btn btn-primary text-sm">开始使用</button>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 阅读训练 -->
    <section id="reading" class="mb-12">
      <h2 class="text-2xl font-semibold mb-6">阅读训练</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="tool-card hover:shadow-xl transition-all duration-300">
          <div class="mb-4">
            <img src="https://picsum.photos/seed/reading-practice/300/200.jpg" alt="阅读理解训练" class="w-full h-48 object-cover rounded-lg">
          </div>
          <h3 class="text-xl font-semibold mb-2">阅读理解训练</h3>
          <p class="text-gray-600 mb-3">提供分级阅读材料和comprehension练习，提升阅读能力</p>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">适合年龄: 6-15岁</span>
            <button class="btn btn-primary text-sm">开始使用</button>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 能力培养 -->
    <section id="focus" class="mb-12">
      <h2 class="text-2xl font-semibold mb-6">能力培养</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="tool-card hover:shadow-xl transition-all duration-300">
          <div class="mb-4">
            <img src="https://picsum.photos/seed/focus-training/300/200.jpg" alt="专注力训练" class="w-full h-48 object-cover rounded-lg">
          </div>
          <h3 class="text-xl font-semibold mb-2">专注力训练</h3>
          <p class="text-gray-600 mb-3">通过游戏化训练提升孩子的专注力和注意力</p>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">适合年龄: 5-12岁</span>
            <button class="btn btn-primary text-sm">开始使用</button>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 学习管理 -->
    <section id="mistakes" class="mb-12">
      <h2 class="text-2xl font-semibold mb-6">学习管理</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="tool-card hover:shadow-xl transition-all duration-300">
          <div class="mb-4">
            <img src="https://picsum.photos/seed/mistake-notebook/300/200.jpg" alt="错题本" class="w-full h-48 object-cover rounded-lg">
          </div>
          <h3 class="text-xl font-semibold mb-2">错题本</h3>
          <p class="text-gray-600 mb-3">整理和管理错题，针对性复习提升学习效果</p>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">适合年龄: 8-18岁</span>
            <button class="btn btn-primary text-sm">开始使用</button>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 思维工具 -->
    <section id="mindmap" class="mb-12">
      <h2 class="text-2xl font-semibold mb-6">思维工具</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="tool-card hover:shadow-xl transition-all duration-300">
          <div class="mb-4">
            <img src="https://picsum.photos/seed/mind-mapping/300/200.jpg" alt="思维导图" class="w-full h-48 object-cover rounded-lg">
          </div>
          <h3 class="text-xl font-semibold mb-2">思维导图</h3>
          <p class="text-gray-600 mb-3">可视化知识结构，帮助孩子理解和记忆复杂概念</p>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">适合年龄: 10-18岁</span>
            <button class="btn btn-primary text-sm">开始使用</button>
          </div>
        </div>
      </div>
    </section>

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

        <div class="flex items-center mb-2">
          <div class="flex text-yellow-400">
            <svg v-for="i in 5" :key="i" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="i <= Math.floor(tool.rating) ? 'text-yellow-400' : 'text-gray-300'" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <span class="ml-2 text-sm text-gray-600">{{ tool.rating }}</span>
        </div>

        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-500">{{ tool.ageGroup }}</span>
          <button class="btn btn-primary text-sm">
            查看详情
          </button>
        </div>
      </div>
    </div>

    <!-- No Results Message -->
    <div v-if="filteredTools.length === 0" class="text-center py-12">
      <p class="text-gray-500">没有找到相关工具</p>
    </div>
  </div>
</template>
