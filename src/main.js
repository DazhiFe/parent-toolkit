import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 导入全局样式
import './assets/styles/main.css'

// 处理 GitHub Pages SPA 路由重定向
const savedRoute = sessionStorage.getItem('spa-route')
if (savedRoute) {
  sessionStorage.removeItem('spa-route')
  // 在路由准备好后导航到保存的路径
  setTimeout(() => {
    router.push(savedRoute)
  }, 0)
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
