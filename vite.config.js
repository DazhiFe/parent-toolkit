import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import https from 'node:https'

// 本地开发 API 中转插件
function apiProxyPlugin() {
  return {
    name: 'api-proxy',
    configureServer(server) {
      server.middlewares.use('/api', (req, res) => {
        // daily-quote：直接透传（兼容 /api/daily-quote 和 /daily-quote）
        if (req.url && (req.url.startsWith('/api/daily-quote') || req.url.startsWith('/daily-quote'))) {
          const remoteUrl = `https://bama.help/api/daily-quote${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`
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

        const remoteUrl = `https://bama.help/api/parse-wechat?url=${encodeURIComponent(targetUrl)}`

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
  base: '/',
  server: {
    port: 3000,
    open: true
  }
})
