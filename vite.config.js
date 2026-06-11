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
  base: process.env.GITHUB_PAGES === 'true' ? '/parent-toolkit/' : '/',
  server: {
    port: 3000,
    open: true
  }
})
