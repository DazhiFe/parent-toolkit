<script setup>
const newsSites = [
  {
    id: 1,
    name: 'AIHOT',
    description: 'AI热点资讯聚合平台，汇集全球AI行业最新动态',
    url: 'https://aihot.virxact.com/',
    icon: 'news',
    color: 'red'
  },
  {
    id: 2,
    name: '鱼皮AI导航',
    description: '程序员鱼皮整理的AI工具导航和学习资源',
    url: 'https://ai.codefather.cn/',
    icon: 'nav',
    color: 'blue'
  }
]

const getIcon = (iconName) => {
  const icons = {
    news: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>`,
    nav: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>`
  }
  return icons[iconName] || icons.news
}

const getColorClass = (color) => {
  const colors = {
    red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' }
  }
  return colors[color] || colors.blue
}
</script>

<template>
  <div class="flex">
    <div class="flex-1 px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold dark:text-white">AI资讯</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">汇集AI行业最新动态和优质资源</p>
      </div>
      
      <section id="ai-news" class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 dark:text-white">AI资讯网站</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <div v-for="site in newsSites" :key="site.id" class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div :class="['mb-4 flex items-center justify-center h-24 rounded-lg', getColorClass(site.color).bg]">
              <div :class="getColorClass(site.color).text" v-html="getIcon(site.icon)"></div>
            </div>
            <h3 class="text-lg font-semibold mb-2 dark:text-white">{{ site.name }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">{{ site.description }}</p>
            <a :href="site.url" target="_blank" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">访问网站 →</a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.tool-card {
  @apply shadow-md;
  border-radius: 0.5rem;
  padding: 1rem;
}

.tool-card:hover {
  transform: translateY(-4px);
}
</style>
