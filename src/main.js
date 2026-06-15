import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 导入全局样式
import './assets/styles/main.css'

const app = createApp(App)

app.use(router)

app.mount('#app')

// 应用挂载完成后，等待路由首次解析就绪，再移除全局加载动画
router.isReady().then(() => {
  const loader = document.getElementById('app-loader')
  if (loader) {
    loader.classList.add('loader-hide')
    setTimeout(() => loader.remove(), 600)
  }
})

// ─── 生产环境防盗版防护 ───
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  // 添加 protected class 启用 CSS 防选择
  document.body.classList.add('protected')

  // 禁用右键菜单
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  })

  // 拦截常见快捷键（Ctrl+U 查看源码、Ctrl+S 保存、F12 开发者工具）
  document.addEventListener('keydown', (e) => {
    // Ctrl+U
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault()
    }
    // Ctrl+S
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault()
    }
    // F12
    if (e.key === 'F12') {
      e.preventDefault()
    }
  })
}
