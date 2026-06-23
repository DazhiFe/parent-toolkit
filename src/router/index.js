import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
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
      path: '/mixed-math',
      name: 'mixed-math',
      component: () => import('../views/MixedMathView.vue')
    },
    {
      path: '/hundred-chart',
      name: 'hundred-chart',
      component: () => import('../views/HundredChartView.vue')
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
      path: '/character-practice',
      name: 'character-practice',
      component: () => import('../views/CharacterPracticeView.vue')
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
      path: '/pdf-edit',
      name: 'pdf-edit',
      component: () => import('../views/PdfEditView.vue')
    },
    {
      path: '/word-pronunciation',
      name: 'word-pronunciation',
      component: () => import('../views/WordPronunciationView.vue')
    },
    {
      path: '/wechat-article-print',
      name: 'wechat-article-print',
      component: () => import('../views/WechatArticlePrintView.vue')
    },
    {
      path: '/image-compress',
      name: 'image-compress',
      component: () => import('../views/ImageCompressView.vue')
    },
    {
      path: '/image-convert',
      name: 'image-convert',
      component: () => import('../views/ImageConvertView.vue')
    },
    {
      path: '/image-watermark',
      name: 'image-watermark',
      component: () => import('../views/ImageWatermarkView.vue')
    },
    {
      path: '/image-resize',
      name: 'image-resize',
      component: () => import('../views/ImageResizeView.vue')
    },
    {
      path: '/image-crop',
      name: 'image-crop',
      component: () => import('../views/ImageCropView.vue')
    },
    {
      path: '/video-download',
      name: 'video-download',
      component: () => import('../views/VideoDownloadView.vue')
    },
    {
      path: '/feedback-admin',
      name: 'feedback-admin',
      component: () => import('../views/FeedbackAdminView.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    }
  ]
})

// Cloudflare Web Analytics SPA 路由追踪
// beacon 脚本加载后 window['__cf Beacon'] 会变成可调用函数
// 每次路由切换后手动触发 pageview 上报
router.afterEach(() => {
  nextTick(() => {
    const cf = window['__cf Beacon']
    if (typeof cf === 'function') {
      try {
        cf('pageview')
      } catch (e) {
        // 静默忽略
      }
    }
  })
})

export default router
