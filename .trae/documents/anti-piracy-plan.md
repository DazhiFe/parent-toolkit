# 网站防盗版方案计划

## 摘要

为"爸妈工具箱"（bama.help）实施轻度防盗版保护，涵盖数据文件防盗、防iframe嵌入、防代码盗用三个方面。所有防护仅在部署环境（bama.help）生效，本地开发（localhost）不限制。

## 现状分析

- **数据文件**：`public/data/characters.json` 和 `public/data/poems.json` 可通过 URL 直接下载，无任何访问限制
- **iframe**：无 X-Frame-Options 或 CSP frame-ancestors 头，任何网站都可嵌入
- **代码**：前端代码完全公开，Vite 构建产物无混淆
- **部署**：Cloudflare Pages Functions + GitHub Pages 双部署
- **API**：`feedback.js` 的 CORS 设为 `*`（完全开放）

## 方案设计

### 一、数据文件防盗（核心）

**问题**：`/data/characters.json` 和 `/data/poems.json` 可直接 URL 访问下载。

**方案**：Referer 白名单 + Cloudflare Pages Function 代理

1. **创建 `functions/api/data/[file].js`**：代理数据文件请求
   - 检查 `Referer` 或 `Origin` header 是否为 `bama.help` 或 `localhost`
   - 本地开发环境（Referer 包含 localhost / 127.0.0.1）放行
   - 搜索引擎爬虫（Googlebot/Bingbot 等 UA）放行，保证 SEO
   - 非授权来源返回 403
   - 从 KV 或直接 fetch 本地静态文件返回数据

2. **移动数据文件**：将 `public/data/characters.json` 和 `public/data/poems.json` 移到 `public/data/_protected/` 目录下，不直接对外暴露

3. **更新前端 fetch 路径**：`poems.js` 和 `CharacterPracticeView.vue` 中的 fetch 路径改为 `/api/data/characters` 和 `/api/data/poems`

4. **robots.txt**：添加 `Disallow: /data/_protected/` 阻止搜索引擎索引原始数据文件

### 二、防 iframe 嵌入

**问题**：无 X-Frame-Options 或 CSP 头，其他网站可 iframe 嵌入。

**方案**：在 `functions/_middleware.js` 中添加安全头

在现有 middleware 中扩展，为所有响应添加：
- `X-Frame-Options: SAMEORIGIN` — 只允许同源 iframe
- `Content-Security-Policy: frame-ancestors 'self'` — 现代浏览器 CSP 替代方案
- `X-Content-Type-Options: nosniff` — 防止 MIME 类型嗅探

### 三、防代码/文字盗用

**问题**：页面文字可直接复制，源码可审查。

**方案**：轻度 CSS + JS 防护（不拦截，只增加门槛）

1. **CSS 禁止选择**：在 `<body>` 上添加 `user-select: none`，但排除 input/textarea 等输入区域
2. **禁用右键菜单**：`document.addEventListener('contextmenu', e => e.preventDefault())`（仅生产环境）
3. **禁用常见复制快捷键**：拦截 Ctrl+C/Ctrl+U/F12（仅生产环境，且控制台给出友好提示）
4. **源码水印**：在 index.html 中添加不可见的版权注释水印

### 四、API 安全加固

**问题**：`feedback.js` 的 CORS 为 `*`。

**方案**：
- `feedback.js`：CORS 从 `*` 改为只允许 `bama.help` 和 `localhost`
- `daily-quote.js`：同样限制 CORS

### 五、构建配置优化

**方案**：Vite 构建时添加轻量混淆
- `vite.config.js` 的 `build` 配置中启用 `minify: 'terser'`（默认 esbuild，terser 混淆更强）
- 注意：terser 需要安装依赖，且构建时间会增加。如不想增加依赖，可跳过此步骤。

## 具体改动文件

| 文件 | 改动 |
|------|------|
| `functions/_middleware.js` | 添加 X-Frame-Options、CSP、X-Content-Type-Options 安全头 |
| `functions/api/data/[file].js` | **新建** — 数据文件代理 API，Referer 白名单 |
| `public/data/characters.json` | 移动到 `public/data/_protected/characters.json` |
| `public/data/poems.json` | 移动到 `public/data/poems.json` 保持不动（poems 是公共领域数据，保护优先级低） |
| `src/views/CharacterPracticeView.vue` | fetch 路径从 `/data/characters.json` 改为 `/api/data/characters` |
| `src/data/poems.js` | 无需改动（poems 保留原路径） |
| `public/robots.txt` | 添加 `Disallow: /data/_protected/` |
| `index.html` | 添加版权注释水印 |
| `src/main.js` | 添加生产环境右键/复制拦截逻辑 |
| `src/App.vue` | 添加 `user-select: none` CSS（排除输入区域） |
| `functions/api/feedback.js` | CORS 从 `*` 改为白名单 |
| `functions/api/daily-quote.js` | CORS 从 `*` 改为白名单 |

## 假设与决策

1. **只保护 characters.json**：poems.json 的古诗词原文属公共领域，保护价值低，保留原路径
2. **不安装 terser**：避免增加构建依赖和构建时间，esbuild 默认压缩足够
3. **Referer 白名单而非签名 URL**：签名 URL 更安全但实现复杂，轻量方案用 Referer 足够
4. **本地开发不限制**：所有防护检查 localhost/127.0.0.1 时直接放行
5. **不禁用 DevTools**：只禁右键和常见快捷键，不拦截 DevTools（技术用户总能打开）
6. **Cloudflare Pages Function 代理**：不使用 KV 存储数据（避免数据同步问题），直接从静态资源读取

## 验证步骤

1. 本地 `npm run dev`：所有功能正常，无任何限制
2. 部署后访问 `/data/characters.json`：应返回 403（直接 URL 访问被拒绝）
3. 部署后从 bama.help 页面正常使用生字字帖：功能正常（Referer 为 bama.help）
4. 用其他网站 iframe 嵌入 bama.help：页面无法加载（X-Frame-Options 生效）
5. 在 bama.help 上右键：菜单不弹出
6. 在 bama.help 上 Ctrl+C：文字不被复制（除输入框外）
7. 查看 robots.txt：包含 `_protected` 目录的 Disallow
8. API 反馈提交：从 bama.help 正常，从其他域名被 CORS 拒绝
