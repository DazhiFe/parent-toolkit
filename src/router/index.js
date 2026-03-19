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
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    }
  ]
})

export default router
