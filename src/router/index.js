import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    // 始终滚动到顶部
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/study-assistant',
      name: 'study-assistant',
      component: () => import('../views/StudyAssistantView.vue')
    },
    {
      path: '/ai-tools',
      name: 'ai-tools',
      component: () => import('../views/AiToolsView.vue')
    },
    {
      path: '/pomodoro-timer',
      name: 'pomodoro-timer',
      component: () => import('../views/PomodoroTimerView.vue')
    },
    {
      path: '/math-three-digit',
      name: 'math-three-digit',
      component: () => import('../views/MathThreeDigitView.vue')
    },
    {
      path: '/math-within-20',
      name: 'math-within-20',
      component: () => import('../views/MathWithin20View.vue')
    },
    {
      path: '/math-within-100',
      name: 'math-within-100',
      component: () => import('../views/MathWithin100View.vue')
    },
    {
      path: '/ancient-poetry',
      name: 'ancient-poetry',
      component: () => import('../views/AncientPoetryView.vue')
    },
    {
      path: '/pinyin-annotation',
      name: 'pinyin-annotation',
      component: () => import('../views/PinyinAnnotationView.vue')
    },
    {
      path: '/image-to-pdf',
      name: 'image-to-pdf',
      component: () => import('../views/ImageToPdfView.vue')
    },
    {
      path: '/pdf-to-ppt',
      name: 'pdf-to-ppt',
      component: () => import('../views/PdfToPptView.vue')
    },
    {
      path: '/word-to-pdf',
      name: 'word-to-pdf',
      component: () => import('../views/WordToPdfView.vue')
    },
    {
      path: '/pdf-to-word',
      name: 'pdf-to-word',
      component: () => import('../views/PdfToWordView.vue')
    },
    {
      path: '/image-compress',
      name: 'image-compress',
      component: () => import('../views/ImageCompressView.vue')
    },
    {
      path: '/video-download',
      name: 'video-download',
      component: () => import('../views/VideoDownloadView.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    }
  ]
})

export default router
