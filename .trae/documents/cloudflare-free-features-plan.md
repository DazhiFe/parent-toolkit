# Cloudflare 免费功能盘点与接入规划

> 为 bama.help（爸妈工具箱）梳理 Cloudflare 当前已用功能、剩余免费功能清单、以及对本项目的接入价值评估

## 一、当前已用功能（基于代码探索）

| 功能 | 用途 | 文件位置 |
|------|------|----------|
| **Cloudflare Pages** | 静态站点部署 + CI/CD | git push 自动部署 |
| **Pages Functions** | Serverless API | [functions/api/](file:///d:/code/parent-toolkit/functions/api/) |
| **KV Storage** | 用户反馈存储（FEEDBACK KV） | [functions/api/feedback.js](file:///d:/code/parent-toolkit/functions/api/feedback.js) |
| **_redirects** | SPA 路由回退 + API 转发 | [public/_redirects](file:///d:/code/parent-toolkit/public/_redirects) |
| **_middleware.js** | 安全响应头、子域重定向 | [functions/_middleware.js](file:///d:/code/parent-toolkit/functions/_middleware.js) |
| **Web Analytics** | 隐私友好的页面统计（CF 控制台自动注入 beacon） | [src/router/index.js#L134-L149](file:///d:/code/parent-toolkit/src/router/index.js#L134-L149) 已加 SPA 追踪 |
| **Workers** | 独立 Worker 项目（疑似另一套 API） | [cloudflare-worker/wrangler.toml](file:///d:/code/parent-toolkit/cloudflare-worker/wrangler.toml) |

现有 Pages Functions：feedback、feedback-list、parse-wechat、daily-quote、test-host、data/[file]。

---

## 二、Cloudflare 免费功能完整盘点（对本项目相关性排序）

### A 类：直接价值高，建议优先接入

#### 1. R2 Storage（对象存储）
- **免费额度**：10 GB 存储 + 100 万次 A 类操作/月 + 1000 万次 B 类操作/月
- **特点**：零出口流量费（与 S3 最大区别）；通过 Workers/Functions 访问无出口费
- **本项目接入价值**：
  - 存用户反馈附件（截图）、每日金句配图、字帖范字图
  - 替代 base64 内嵌图片，减小 HTML 体积
  - 配合 Image Resize（付费）/Workers 自定义图片处理
- **接入步骤**：
  1. CF 控制台 → R2 → 创建 bucket（如 `bama-assets`）
  2. Pages 项目 → Settings → Functions → R2 bucket bindings 绑定 `ASSETS`
  3. 写 `functions/api/upload.js`：POST 上传到 R2，POST `/api/img/[key]` 读取
  4. 配合签名 URL（Workers 生成短期签名）防止盗刷

#### 2. D1 Database（SQLite 数据库）
- **免费额度**：5 GB 存储 + 500 万行读/天 + 10 万行写/天
- **特点**：SQLite 语法，支持 SQL 查询、JOIN、事务
- **本项目接入价值**：
  - **替代 KV 存反馈**：当前 KV 只能按 key 查询，D1 支持按类型、时间、关键词筛选
  - 站点统计事件日志（用户点击工具的埋点，比 CF Web Analytics 更细粒度）
  - 错题本、生字本等学习数据持久化（目前用 localStorage，跨设备丢失）
- **接入步骤**：
  1. CF 控制台 → D1 → 创建数据库 `bama-db`
  2. Pages 项目 → Settings → Functions → D1 database bindings 绑定 `DB`
  3. 写 `functions/api/db-migrate.js` 初始化 schema
  4. 改造 `feedback.js` 从 KV 改用 D1：`INSERT INTO feedback (...) VALUES (?)`

#### 3. Workers AI（免费 AI 推理）
- **免费额度**：10,000 神经元/天（约等于几千次小模型推理）
- **可用模型**：
  - `@cf/meta/llama-3-8b-instruct`（文本生成）
  - `@cf/baai/bge-base-en-v1.5`（向量嵌入）
  - `@cf/openai/whisper`（语音转文字）
  - Stable Diffusion（图像生成，但额度消耗大）
- **本项目接入价值**：
  - **AI 学习助手**：错题解析、生字造句、口算出题
  - 公众号文章 AI 摘要
  - 朗读评测（whisper 识别孩子发音）
  - 完全免费、零延迟、无 API Key 泄漏风险
- **接入步骤**：
  1. CF 控制台 → Workers AI → 确认免费额度
  2. Pages 项目 → Settings → Functions → AI bindings（自动绑定 `env.AI`）
  3. 写 `functions/api/ai-tutor.js`：调用 `env.AI.run('@cf/meta/llama-3-8b-instruct', { messages })`
  4. 在 AI 学习助手页加「AI 解析」按钮，调用本地 AI

#### 4. Email Routing（邮件转发）
- **免费额度**：完全免费，无限量
- **特点**：`xxx@bama.help` → 转发到你的真实邮箱
- **本项目接入价值**：
  - 公开反馈邮箱 `feedback@bama.help`
  - 商务合作 `hi@bama.help`
  - 显得专业，不暴露个人邮箱
- **接入步骤**：
  1. CF 控制台 → 选择 bama.help 域名 → Email → Email Routing
  2. 添加目标邮箱（你的真实邮箱）并验证
  3. 添加路由规则：`feedback@bama.help` → 你的邮箱
  4. 自动配置 MX 记录（CF 自动完成）
  5. 在「关于」页把反馈邮箱改成 `feedback@bama.help`

### B 类：性能加速类（控制台一键开启，零代码）

#### 5. Brotli 压缩
- **特点**：比 gzip 高 15-20% 压缩率，自动启用
- **接入**：CF 控制台 → Speed → Optimization → Content Optimization → 开启 Brotli
- **现状**：通常默认已开

#### 6. HTTP/3 (QUIC)
- **特点**：基于 UDP 的现代协议，弱网下提升明显
- **接入**：CF 控制台 → Network → HTTP/3 (with QUIC) → 开启
- **现状**：通常默认已开

#### 7. Early Hints（103 状态码）
- **特点**：在响应正式返回前，先用 103 状态码推送 preload 链接，让浏览器提前下载资源
- **接入**：CF 控制台 → Speed → Optimization → Early Hints → 开启
- **配合**：在 `index.html` 加 `<link rel="preload" as="script" href="...">` 才有效

#### 8. Cache Reserve（缓存储备）
- **免费额度**：免费但要订阅（10 美元/月）—— **此条需确认**，可能不算免费
- **替代方案**：用 Page Rules / Cache Rules 设置长缓存

#### 9. Tiered Cache
- **特点**：多级缓存，提升全球命中率
- **接入**：CF 控制台 → Caching → Tiered Cache → 开启（Arctic Cloud 免费版）

### C 类：安全防护类（免费版够用）

#### 10. Bot Fight Mode（机器人防护）
- **免费**：完全免费
- **特点**：自动识别并挑战可疑爬虫
- **接入**：CF 控制台 → Security → Bots → Bot Fight Mode → 开启

#### 11. WAF 自定义规则（免费版 5 条）
- **特点**：根据 IP / 路径 / UA 拦截请求
- **本项目接入价值**：
  - 拦截 `/api/*` 的恶意高频请求（限流）
  - 屏蔽特定国家访问反馈接口
- **接入**：CF 控制台 → Security → WAF → Custom rules

#### 12. Rate Limiting（速率限制）
- **免费额度**：免费版可对单 URL 配置 1 条规则
- **本项目接入价值**：保护 `feedback` API 防刷屏
- **接入**：CF 控制台 → Security → WAF → Rate limiting rules

#### 13. Cloudflare Access（Zero Trust 应用访问）
- **免费额度**：50 用户免费
- **特点**：给后台页面加身份验证（Google/GitHub 登录后才能访问）
- **本项目接入价值**：
  - **保护 `/feedback-admin` 后台**：当前后台无登录，任何人可看反馈列表
  - 保护未来新增的管理页面
- **接入步骤**：
  1. CF 控制台 → Zero Trust → Access → Applications → Add Application
  2. 配置应用：域名 `bama.help/feedback-admin*`
  3. 配置身份提供商：Google OAuth（免费）
  4. 配置策略：仅你的邮箱可访问
  5. 用户访问 `/feedback-admin` 时被重定向到 Google 登录

### D 类：开发能力扩展

#### 14. Cloudflare Tunnel（内网穿透）
- **免费**：完全免费
- **特点**：把本地开发服务暴露到公网，无需公网 IP
- **本项目接入价值**：
  - 本地 `npm run dev` 时用 `dev.bama.help` 访问，方便手机测试
  - 微信 JS-SDK 等需要域名回调的功能在本地开发
- **接入步骤**：`cloudflared tunnel --url http://localhost:5173`

#### 15. Browser Rendering（无头浏览器服务）
- **免费额度**：Workers Paid 才能用（5 美元/月起）—— **此条不算免费**
- **替代方案**：用 Puppeteer on Workers（实验性）

#### 16. Vectorize（向量数据库）
- **免费额度**：30M 维度存储 + 1000 万查询/月（Workers Paid 才行）—— **付费**
- **本项目接入价值**：搜索/推荐功能，但需付费
- **跳过**

#### 17. Queues（消息队列）
- **免费额度**：100 万次操作/月（Workers Paid）—— **付费**
- **跳过**

#### 18. Cloudflare Zaraz（第三方脚本管理）
- **免费**：完全免费
- **特点**：在云端管理第三方脚本（统计、客服、广告），减少前端性能损耗
- **本项目接入价值**：当前只有 CF Analytics，不急用

### E 类：其他实用功能

#### 19. Cloudflare DNS（1.1.1.1）
- **免费**：完全免费
- **特点**：全球最快的 DNS 解析

#### 20. Page Rules / Redirect Rules
- **免费额度**：免费版 3 条 Page Rules + 无限 Redirect Rules
- **本项目接入价值**：
  - `www.bama.help` → `bama.help`（强制裸域）
  - `fankui.bama.help` → `bama.help/feedback-admin`（当前用 middleware 实现，可改 Redirect Rules 更高效）

#### 21. Cloudflare Pages Previews
- **免费**：完全免费
- **特点**：每个 PR 自动生成预览部署
- **本项目接入价值**：开发分支可独立预览，不影响线上

#### 22. Cache Rules（缓存规则）
- **免费**：无限条
- **本项目接入价值**：缓存 `/api/parse-wechat` 的同 URL 结果，减少微信源站抓取

#### 23. Cloudflare Turnstile（验证码替代品）
- **免费**：完全免费
- **特点**：无感验证，比 reCAPTCHA 体验好
- **本项目接入价值**：保护反馈接口防机器人
- **接入步骤**：CF 控制台 → Turnstile → 创建 widget → 前端嵌入 widget 脚本 → 后端校验 token

---

## 三、对 bama.help 的优先级推荐

### P0：强烈建议接入（价值高、改动小）

1. **Bot Fight Mode + Early Hints + HTTP/3 + Brotli**：控制台一键开启，零代码改动，立即提速
2. **Email Routing**：5 分钟接入，获得 `feedback@bama.help` 专业邮箱
3. **Cache Rules 缓存 parse-wechat 结果**：避免重复抓取微信，减少 Functions 调用次数
4. **Redirect Rules 替代 middleware 子域重定向**：更高效

### P1：建议接入（有明显场景）

5. **Cloudflare Access 保护 /feedback-admin**：当前后台无登录是安全隐患
6. **Turnstile 验证码**：保护反馈 API
7. **Workers AI 接入 AI 学习助手**：免费 LLM，增强 AI 解析错题/生字造句功能
8. **R2 Storage**：为后续"用户上传错题照片"等功能做存储基础

### P2：可选接入（锦上添花）

9. **D1 Database 替代 KV**：当反馈量大了再迁移
10. **Cloudflare Tunnel**：本地开发预览
11. **Pages Previews**：PR 自动预览（项目目前单人开发不急用）

---

## 四、首批接入方案（P0 四项一键开启 + 控制台配置）

> 这四项**无需改代码**，全部在 Cloudflare 控制台完成。下面是详细操作步骤。

### 1. Bot Fight Mode
- 路径：`dash.cloudflare.com` → 选择 `bama.help` → Security → Bots
- 操作：开启 "Bot Fight Mode" 开关
- 效果：自动挑战可疑爬虫，不影响真实用户

### 2. Early Hints
- 路径：Speed → Optimization → Content Optimization
- 操作：开启 "Early Hints"
- 配合（可选）：在 `index.html <head>` 加 `<link rel="preload" as="script" href="/src/main.js">` 让浏览器提前加载

### 3. HTTP/3 + Brotli
- 路径：Network
- 操作：确认 HTTP/3 (with QUIC) 开关已开启；确认 Brotli 开关已开启
- 通常默认已开，确认即可

### 4. Email Routing
- 路径：Email → Email Routing
- 操作：
  1. 添加目标邮箱（你常用的真实邮箱），点击验证邮件
  2. 开启 Email Routing（CF 自动添加 MX 记录）
  3. 在 Routes 标签添加：
     - `feedback@bama.help` → 你的邮箱
     - `hi@bama.help` → 你的邮箱
     - `*@bama.help` → 你的邮箱（Catch-all，兜底）
- 配置完成后，可在 [AboutView.vue](file:///d:/code/parent-toolkit/src/views/AboutView.vue) 中把反馈邮箱改为 `feedback@bama.help`

### 5. Cache Rules（缓存 parse-wechat 结果）
- 路径：Caching → Cache Rules → Create rule
- 配置：
  - When incoming requests match: `URI Path starts with /api/parse-wechat`
  - Then: Eligible for cache = Yes, Edge TTL = 1 hour
- 效果：相同 URL 的微信文章抓取只触发一次源站请求，1 小时内直接走 CF 缓存

### 6. Redirect Rules（替代 middleware 中的子域重定向）
- 路径：Rules → Redirect Rules → Create rule
- 配置：
  - When: `Hostname equals fankui.bama.help`
  - Then: Static URL `https://bama.help/feedback-admin`，状态码 301
- 改造完成后可从 [functions/_middleware.js](file:///d:/code/parent-toolkit/functions/_middleware.js) 移除子域重定向逻辑，仅保留安全头注入

---

## 五、P1 接入方案（代码改动版）

### A. Cloudflare Access 保护 /feedback-admin（零代码，控制台配置）

- 路径：Zero Trust → Access → Applications → Add Application → Self-hosted
- 配置：
  - Application domain: `bama.help`
  - Path: `/feedback-admin*`
  - Session duration: 24 hours
- 身份提供商：Google OAuth（在 Access → Settings → Identity Providers 配置）
- 策略：
  - Action: Allow
  - Include: Emails ends with `@yourdomain.com` 或精确匹配你的邮箱
- 效果：访问 `bama.help/feedback-admin` 时未登录用户被重定向到 Google 登录

### B. Turnstile 验证码保护反馈接口

- 前端改动：在 [AboutView.vue](file:///d:/code/parent-toolkit/src/views/AboutView.vue) 反馈表单加 Turnstile widget
- 后端改动：在 [functions/api/feedback.js](file:///d:/code/parent-toolkit/functions/api/feedback.js) 校验 token
- 完整接入方案可单独立项

### C. Workers AI 接入 AI 学习助手

- 新建 `functions/api/ai-tutor.js`
- 前端在 [StudyAssistantView.vue](file:///d:/code/parent-toolkit/src/views/StudyAssistantView.vue) 加「AI 出题」/「AI 解错题」按钮
- 调用 Llama-3-8B 模型生成立题、解析错题
- 单独立项实施

### D. R2 Storage 接入

- 新建 bucket `bama-assets`
- Pages 项目绑定 `ASSETS`
- 新建 `functions/api/upload.js`（带签名校验防滥用）
- 新建 `functions/api/img/[key].js` 读取图片
- 应用场景：错题照片、字帖范字图

---

## 六、Assumptions & Decisions

1. **假设**：bama.help 域名走 Cloudflare DNS（必须，否则部分功能无法用）
2. **假设**：当前 CF 套餐为 Free Tier
3. **决策**：P0 全部为控制台一键开启项，无代码风险，可立即执行
4. **决策**：P1 涉及代码改动，按需单独立项，不在本计划范围内一次全做
5. **决策**：Workers AI / R2 / D1 等 Serverless 资源通过 Pages Functions bindings 接入，不另起 Worker 项目（已有 `cloudflare-worker/` 目录疑似历史遗留，待确认）

---

## 七、Verification Steps

P0 接入后逐项验证：

1. **Bot Fight Mode**：浏览器 UA 改成 `GoogleBot` 访问 bama.help，应被挑战
2. **HTTP/3**：Chrome DevTools → Network → Protocol 列看到 `h3`
3. **Brotli**：DevTools → Network → 响应头 `content-encoding: br`
4. **Early Hints**：DevTools → Network → 看到 103 状态码响应（需要服务端支持 preload）
5. **Email Routing**：发邮件到 `feedback@bama.help`，应在你的真实邮箱收到
6. **Cache Rules**：连续两次访问相同 URL 的 `/api/parse-wechat?url=...`，第二次 `cf-cache-status` 响应头应为 `HIT`
7. **Redirect Rules**：访问 `fankui.bama.help` 应 301 跳转到 `bama.help/feedback-admin`

P1 接入验证：
1. **Access**：无痕窗口访问 `/feedback-admin` 应被重定向到 Google 登录
2. **Turnstile**：提交反馈时不通过验证码应失败
3. **Workers AI**：调用 `/api/ai-tutor` 应返回 LLM 生成内容
4. **R2**：上传图片后通过 `/api/img/[key]` 能访问到

---

## 八、下一步行动

**建议你从 P0 开始**：

- ✅ P0 全部可在 10 分钟内完成（控制台配置）
- ⏸ P1 中的 Access 也只需 5 分钟控制台配置，强烈推荐一起做（修复后台无登录的安全隐患）
- 📋 P1 中的 Turnstile / Workers AI / R2 需要代码改动，告诉我你想做哪个我就立项实施
