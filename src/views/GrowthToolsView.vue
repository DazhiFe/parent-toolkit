<script setup>
import { ref, computed } from 'vue'

const growthTools = ref([
  {
    id: 1,
    name: '身高体重追踪器',
    description: '记录孩子的生长发育数据，生成成长曲线图',
    category: '健康监测',
    image: 'https://picsum.photos/seed/growth/300/200.jpg',
    ageRange: '0-18岁'
  },
  {
    id: 2,
    name: '习惯养成计划',
    description: '帮助孩子培养良好习惯，设定目标和奖励机制',
    category: '习惯培养',
    image: 'https://picsum.photos/seed/habits/300/200.jpg',
    ageRange: '3-18岁'
  },
  {
    id: 3,
    name: '情绪管理助手',
    description: '帮助孩子识别和管理情绪，提供情绪调节技巧',
    category: '心理健康',
    image: 'https://picsum.photos/seed/emotions/300/200.jpg',
    ageRange: '5-18岁'
  },
  {
    id: 4,
    name: '亲子互动游戏',
    description: '提供各种亲子互动游戏，增进家庭关系',
    category: '家庭互动',
    image: 'https://picsum.photos/seed/family/300/200.jpg',
    ageRange: '3-12岁'
  },
  {
    id: 5,
    name: '时间管理训练',
    description: '帮助孩子学会规划时间，提高学习和生活效率',
    category: '能力培养',
    image: 'https://picsum.photos/seed/timemanage/300/200.jpg',
    ageRange: '6-18岁'
  },
  {
    id: 6,
    name: '社交技能训练',
    description: '通过情景模拟训练孩子的社交能力和沟通技巧',
    category: '社交技能',
    image: 'https://picsum.photos/seed/social/300/200.jpg',
    ageRange: '5-15岁'
  }
])

const categories = ref(['全部', '健康监测', '习惯培养', '心理健康', '家庭互动', '能力培养', '社交技能'])
const selectedCategory = ref('全部')

const filteredTools = computed(() => {
  if (selectedCategory.value === '全部') {
    return growthTools.value
  }
  return growthTools.value.filter(tool => tool.category === selectedCategory.value)
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">成长工具</h1>
    
    <!-- 健康监测 -->
    <section id="health" class="mb-12">
      <h2 class="text-2xl font-semibold mb-6">健康监测</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="tool-card hover:shadow-xl transition-all duration-300">
          <div class="mb-4">
            <img src="https://picsum.photos/seed/growth-tracker/300/200.jpg" alt="身高体重追踪器" class="w-full h-48 object-cover rounded-lg">
          </div>
          <h3 class="text-xl font-semibold mb-2">身高体重追踪器</h3>
          <p class="text-gray-600 mb-3">记录孩子的生长发育数据，生成成长曲线图</p>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">适用年龄: 0-18岁</span>
            <button class="btn btn-primary text-sm">开始使用</button>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 习惯培养 -->
    <section id="habits" class="mb-12">
      <h2 class="text-2xl font-semibold mb-6">习惯培养</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="tool-card hover:shadow-xl transition-all duration-300">
          <div class="mb-4">
            <img src="https://picsum.photos/seed/habit-builder/300/200.jpg" alt="习惯养成计划" class="w-full h-48 object-cover rounded-lg">
          </div>
          <h3 class="text-xl font-semibold mb-2">习惯养成计划</h3>
          <p class="text-gray-600 mb-3">帮助孩子培养良好习惯，设定目标和奖励机制</p>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">适用年龄: 3-18岁</span>
            <button class="btn btn-primary text-sm">开始使用</button>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 心理健康 -->
    <section id="emotions" class="mb-12">
      <h2 class="text-2xl font-semibold mb-6">心理健康</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="tool-card hover:shadow-xl transition-all duration-300">
          <div class="mb-4">
            <img src="https://picsum.photos/seed/emotion-helper/300/200.jpg" alt="情绪管理助手" class="w-full h-48 object-cover rounded-lg">
          </div>
          <h3 class="text-xl font-semibold mb-2">情绪管理助手</h3>
          <p class="text-gray-600 mb-3">帮助孩子识别和管理情绪，提供情绪调节技巧</p>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">适用年龄: 5-18岁</span>
            <button class="btn btn-primary text-sm">开始使用</button>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 家庭互动 -->
    <section id="family" class="mb-12">
      <h2 class="text-2xl font-semibold mb-6">家庭互动</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="tool-card hover:shadow-xl transition-all duration-300">
          <div class="mb-4">
            <img src="https://picsum.photos/seed/family-games/300/200.jpg" alt="亲子互动游戏" class="w-full h-48 object-cover rounded-lg">
          </div>
          <h3 class="text-xl font-semibold mb-2">亲子互动游戏</h3>
          <p class="text-gray-600 mb-3">提供各种亲子互动游戏，增进家庭关系</p>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">适用年龄: 3-12岁</span>
            <button class="btn btn-primary text-sm">开始使用</button>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 能力培养 -->
    <section id="ability" class="mb-12">
      <h2 class="text-2xl font-semibold mb-6">能力培养</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="tool-card hover:shadow-xl transition-all duration-300">
          <div class="mb-4">
            <img src="https://picsum.photos/seed/time-management/300/200.jpg" alt="时间管理训练" class="w-full h-48 object-cover rounded-lg">
          </div>
          <h3 class="text-xl font-semibold mb-2">时间管理训练</h3>
          <p class="text-gray-600 mb-3">帮助孩子学会规划时间，提高学习和生活效率</p>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">适用年龄: 6-18岁</span>
            <button class="btn btn-primary text-sm">开始使用</button>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 社交技能 -->
    <section id="social" class="mb-12">
      <h2 class="text-2xl font-semibold mb-6">社交技能</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="tool-card hover:shadow-xl transition-all duration-300">
          <div class="mb-4">
            <img src="https://picsum.photos/seed/social-skills/300/200.jpg" alt="社交技能训练" class="w-full h-48 object-cover rounded-lg">
          </div>
          <h3 class="text-xl font-semibold mb-2">社交技能训练</h3>
          <p class="text-gray-600 mb-3">通过情景模拟训练孩子的社交能力和沟通技巧</p>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">适用年龄: 5-15岁</span>
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

        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-500">适用年龄: {{ tool.ageRange }}</span>
          <button class="btn btn-primary text-sm">
            开始使用
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
