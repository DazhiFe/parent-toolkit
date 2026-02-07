import { ref, watchEffect } from 'vue'

// 获取初始主题
const getInitialTheme = () => {
  // 检查本地存储中是否有主题设置
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    return savedTheme
  }

  // 如果没有保存的主题，检查系统偏好
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// 创建主题状态
const theme = ref(getInitialTheme())

// 监听主题变化并应用到文档
watchEffect(() => {
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
  localStorage.setItem('theme', theme.value)
})

// 切换主题函数
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    theme.value = e.matches ? 'dark' : 'light'
  }
})

export { theme, toggleTheme }
