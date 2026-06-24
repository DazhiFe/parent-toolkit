import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'

// 本地开发 API 中转插件
function apiProxyPlugin() {
  return {
    name: 'api-proxy',
    configureServer(server) {
      server.middlewares.use('/api', (req, res) => {
        // /api/data/:file — 本地直接读取 _protected 目录下的 JSON
        if (req.url && req.url.startsWith('/data/')) {
          const fileName = req.url.replace('/data/', '').split('?')[0]
          const filePath = path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'public/data/_protected', `${fileName}.json`)
          if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8')
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(data)
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: '文件不存在' }))
          }
          return
        }

        // daily-quote：直接透传
        if (req.url && req.url.startsWith('/daily-quote')) {
          const remoteUrl = `https://parent-toolkit.pages.dev/api/daily-quote${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`
          https.get(remoteUrl, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers)
            proxyRes.pipe(res)
          }).on('error', (e) => {
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: false, error: e.message }))
          })
          return
        }

        const url = new URL(req.url, 'http://localhost')
        const targetUrl = url.searchParams.get('url')

        if (!targetUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: false, error: 'Missing url parameter' }))
          return
        }

        const remoteUrl = `https://parent-toolkit.pages.dev/api/parse-wechat?url=${encodeURIComponent(targetUrl)}`

        https.get(remoteUrl, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers)
          proxyRes.pipe(res)
        }).on('error', (e) => {
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: false, error: e.message }))
        })
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    apiProxyPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  base: process.env.BASE_URL || '/',
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
          'pdf-vendor': ['pdfjs-dist', 'jspdf'],
          'office-vendor': ['docx', 'docx-preview', 'mammoth', 'pptxgenjs'],
          'image-vendor': ['html2canvas', 'jszip']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
