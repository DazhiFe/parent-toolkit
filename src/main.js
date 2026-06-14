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
