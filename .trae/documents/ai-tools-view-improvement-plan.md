# AI 工具页面优化方案（AiToolsView.vue）

## 一、概览（Summary）

`d:\code\parent-toolkit\src\views\AiToolsView.vue` 是站点的 AI 工具聚合页，按 6 个分类（AI对话、AI资讯、AI图形、AI视频、AI学习、AI音频）展示工具卡片。当前实现存在以下问题：内容硬编码、维护困难、有死代码、缺少访问统计/管理能力，且与首页（HomeView）已成熟的卡片管理体系（点击频次、隐藏、失效标记、Tag 颜色）完全不一致。

本方案通过 **数据驱动重构 + 复用 HomeView 模式**，让 AI 工具页与常用网站页保持一致体验，并补足若干功能短板。

## 二、现状分析（Current State Analysis）

### 1. 死代码
- `tools`（16 项）、`newsSites`、`getColorStyle`、`categories`、`selectedCategory`、`filteredTools` 在 `<script setup>` 中定义但**模板完全未引用**（仅 `newsSites` 在 AI 资讯区被 v-for 用到）。
- `tools` 中的 `image: 'https://picsum.photos/seed/...'` 占位图也从未渲染。
- 死代码体积约 200 行，对维护和首屏 JS 都有负担。

### 2. 内容全部硬编码在模板
- 每个 `<section>` 内的卡片直接写 HTML，例如「豆包 / 千问 / 智谱清言 / 文心一言 / DeepSeek」5 个卡片各自一段重复结构。
- 颜色使用 `from-blue-400 to-blue-600` 等 Tailwind 类名硬编码渐变；新增工具需要复制 30+ 行结构。
- 难以扩展（如某分类目前只有 1 个工具，看起来很空）。

### 3. 缺少与 HomeView 一致的能力
HomeView 通过 `useWebsiteClicks` composable 提供：
- 点击频次记录（≥3 次显示星标"常用"角标）
- 隐藏 / 失效标记（管理面板）
- 按热度排序 + Tag 权重排序
- Tag 标签（热门/官方/免费）

AI 工具页**完全没有**这些能力。父母或孩子无法把不再使用的工具收起来，也看不到自己最常打开哪个 AI 工具。

### 4. UI/UX 细节问题
- 页面标题用了 `text-3xl`，与 HomeView 一致，但 HomeView 已有"页面标题 + 描述"区域，AI 工具页缺少结构感（没有"X 个工具"统计、没有快速跳转链接说明）。
- 卡片描述使用 `truncate`（单行截断），鼠标悬停无 tooltip，长描述读不全。
- "AI对话助手"区有 5 个卡片但所有头像使用 1-2 个汉字 + 单色渐变方块，识别度差；理想做法是允许使用 emoji 或 SVG。
- 移动端栅格 `grid-cols-2`，2 列时文字偏小、卡片偏挤。
- `<a target="_blank">` 缺少 `rel="noopener noreferrer"`（安全）。
- 没有"分类筛选条"，用户必须依赖左侧 SideNav 锚点跳转。
- 部分分类只有 1 个卡片（AI图形/AI视频/AI音频），整列空白严重。

### 5. 数据维度不全
- AI 工具天然有"国产 / 海外"、"免费 / 付费"、"是否需注册"、"是否有 App / 仅网页" 等维度，当前实现完全缺失。
- 无法标记"推荐给孩子"vs"家长用"（这正是『爸妈工具箱』的差异化场景）。

## 三、提议变更（Proposed Changes）

### 决策一：是否抽数据文件？
**结论：抽**。理由：与 `src/data/websites.js` 模式保持一致；将来便于 KV/远程加载；让模板瘦身 60%+。

### 决策二：是否复用 useWebsiteClicks？
**结论：复用，但 key 隔离**。在 `useWebsiteClicks` 基础上轻量封装一个新的 `useAiToolClicks`（独立 localStorage key），避免 AI 工具点击和网站点击混在一起。

### 文件清单

#### 1. 新建 `src/data/aiTools.js`（数据源）
导出：
```js
export const aiToolCategories = [
  { id: 'all',     name: '全部',       icon: 'grid' },
  { id: 'chat',    name: 'AI对话助手', icon: 'chat' },
  { id: 'news',    name: 'AI资讯',     icon: 'news' },
  { id: 'image',   name: 'AI图形生成', icon: 'image' },
  { id: 'video',   name: 'AI视频生成', icon: 'video' },
  { id: 'learning',name: 'AI学习资源', icon: 'learning' },
  { id: 'audio',   name: 'AI音频处理', icon: 'audio' },
]

export const aiTools = [
  // chat
  { id: 'doubao',     name: '豆包',     url: 'https://www.doubao.com',
    description: '字节跳动出品，支持多领域知识问答',
    category: 'chat', color: 'blue',   letter: '豆', tag: '热门', audience: 'kid' },
  { id: 'qianwen',    name: '千问',     url: 'https://qianwen.aliyun.com',
    description: '阿里云出品，强大的语言理解与生成能力',
    category: 'chat', color: 'purple', letter: '千' },
  { id: 'zhipu',      name: '智谱清言', url: 'https://chatglm.cn',
    description: '智谱AI出品，提供高质量对话体验',
    category: 'chat', color: 'indigo', letter: '智' },
  { id: 'wenxin',     name: '文心一言', url: 'https://yiyan.baidu.com',
    description: '百度出品，强大的知识理解与生成能力',
    category: 'chat', color: 'red',    letter: '文' },
  { id: 'deepseek',   name: 'DeepSeek', url: 'https://chat.deepseek.com/',
    description: '探索未至之境，强大的AI推理能力',
    category: 'chat', color: 'cyan',   letter: 'D', tag: '热门' },
  // news
  { id: 'aihot',      name: 'AIHOT',         url: 'https://aihot.virxact.com/',
    description: 'AI热点资讯聚合平台，汇集全球AI行业最新动态',
    category: 'news', color: 'red',  letter: 'A' },
  { id: 'codefather', name: '鱼皮AI导航',     url: 'https://ai.codefather.cn/',
    description: '程序员鱼皮整理的AI工具导航和学习资源',
    category: 'news', color: 'blue', letter: '鱼' },
  // image / video（同一工具不同入口，去重为一个 jimeng 项 + 区分功能）
  { id: 'jimeng-img', name: '即梦AI · 图片',
    url: 'https://jimeng.jianying.com/ai-tool/generate?enter_from=ai_feature&from_page=explore&ai_feature_name=image',
    description: '一站式AI创作平台，支持图片生成、视频生成、数字人等功能',
    category: 'image', color: 'orange', letter: '即' },
  { id: 'jimeng-vid', name: '即梦AI · 视频',
    url: 'https://jimeng.jianying.com/ai-tool/generate?enter_from=ai_feature&from_page=explore&ai_feature_name=omniReference',
    description: '一站式AI创作平台，支持图片生成、视频生成、数字人等功能',
    category: 'video', color: 'orange', letter: '即' },
  // learning
  { id: 'feishu-community', name: '飞行社', url: 'https://www.feishu.cn/community',
    description: '飞书社区，AI学习资源和实践案例分享平台',
    category: 'learning', color: 'blue',   letter: '飞' },
  { id: 'feixianglaoshi',   name: '飞象老师', url: 'https://www.feixianglaoshi.com/',
    description: 'AI教学动画和互动课件制作平台',
    category: 'learning', color: 'orange', letter: '象' },
  // audio
  { id: 'tongyi-audio', name: '千问音视频速读', url: 'https://www.tongyi.com/discover/audioread',
    description: 'AI快速提取音视频重点内容，支持多种格式',
    category: 'audio', color: 'purple', letter: '千' },
]
```
说明：
- 字段沿用 HomeView/`websites.js` 风格（id/name/url/description/category/color/tag）。
- 用 `letter` 替代图片 URL；当前所有卡片都是文字头像，不引入新图片资源。
- 新增可选字段 `audience: 'kid' | 'parent'`（仅当区分时使用，此次仅给豆包等示例标 `kid`），后续可在卡片上显示徽章。
- 颜色 `red/blue/orange/purple/indigo/cyan` 等，沿用 Tailwind 调色板，复用已有 `colorMap`。

#### 2. 新建 `src/composables/useAiToolClicks.js`
- 直接复制 `useWebsiteClicks.js` 的逻辑，**只改 3 个 localStorage key**：
  - `bama_aitool_clicks`
  - `bama_aitool_hidden`
  - `bama_aitool_dead`
- 导出函数名保持一致以便复用。
- 不新增功能，避免膨胀。

#### 3. 重写 `src/views/AiToolsView.vue` 模板
- **删除**死代码：`tools`、`newsSites`、`getColorStyle`、`categories`、`selectedCategory`、`filteredTools`。
- **导入** `aiTools`、`aiToolCategories`、`useAiToolClicks`。
- **新增**：
  - 顶部页面标题区：保持 `h1` + 描述，右侧加"X 个工具"统计 + "管理"按钮（同 HomeView）。
  - 管理面板：复用 HomeView 的隐藏/失效面板结构。
  - 分类筛选条：横滚 chips，移动端可滚动（参考 HomeView 第 154 行那段 `flex gap-2 ... overflow-x-auto pb-2 scrollbar-hide`，需配合外层 `min-w-0`）。
  - 工具卡片：循环 `displayedTools`，复用『AI对话助手』当前卡片样式（彩色圆角方块 + `letter`），叠加：
    - 常用星标（点击≥3 次）
    - 失效标记
    - Tag 标签（热门/官方/免费）
    - hover 显示"标记失效 / 隐藏"按钮
  - "查看更多 / 收起"按钮：默认显示前 12 个，点击展开全部。
- **保留 SideNav 锚点跳转**：每个分类筛选时滚动到顶；不再需要 `<section id="ai-chat">` 等 6 个 section（改为分类筛选驱动），但**保留 6 个 anchor div**让 SideNav 锚点不失效（空 div + id）。
- 链接全部加 `rel="noopener noreferrer"`，防止 tabnabbing。
- 使用 `min-w-0` 修复 flex 子项在小屏被撑爆导致 overflow-x-auto 失效（与 HomeView 一致）。
- 卡片描述去掉 `truncate`，改为 `line-clamp-2`，并加 `title="{{ tool.description }}"` 作为 tooltip。

#### 4. （可选）`src/components/SideNav.vue`
- 不改。`aiToolsNavItems` 中 6 个 id 与 AiToolsView 中保留的 anchor 对应。

### 颜色样式映射

新增/复用一个 `letterBgMap`（仅在 AiToolsView 内部）：
```js
const letterBgMap = {
  blue:   'bg-gradient-to-br from-blue-400 to-blue-600',
  purple: 'bg-gradient-to-br from-purple-400 to-purple-600',
  indigo: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
  red:    'bg-gradient-to-br from-red-400 to-red-600',
  cyan:   'bg-gradient-to-br from-cyan-400 to-cyan-600',
  orange: 'bg-gradient-to-br from-orange-400 to-orange-600',
}
```

`tagColors` 直接复制 HomeView 的实现。

### 卡片结构示意（最终模板片段）
```html
<div class="tool-card relative group bg-white dark:bg-gray-800 hover:shadow-xl transition-all duration-300">
  <!-- 常用星标 -->
  <div v-if="isFrequent(tool.id)" class="absolute top-1.5 left-1.5 z-10">...</div>
  <!-- 失效标记 -->
  <div v-if="isDead(tool.id)" class="absolute top-1.5 left-1.5 z-10">...</div>
  <!-- Tag -->
  <div v-if="tool.tag && !isDead(tool.id)" :class="['absolute top-2 right-2 ...', tagColors[tool.tag]]">{{ tool.tag }}</div>
  <!-- hover 操作 -->
  <div class="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100">
    <button @click.stop="reportDead(tool.id)" title="报告失效">...</button>
    <button @click.stop="hideSite(tool.id)"   title="隐藏">...</button>
  </div>

  <div class="mb-4 flex items-center justify-center h-24 rounded-lg">
    <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg', letterBgMap[tool.color]]">
      <span class="text-white text-2xl font-bold">{{ tool.letter }}</span>
    </div>
  </div>
  <h3 class="text-lg font-semibold mb-2 dark:text-white">{{ tool.name }}</h3>
  <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2" :title="tool.description">{{ tool.description }}</p>
  <a :href="tool.url" target="_blank" rel="noopener noreferrer" @click="recordClick(tool.id)"
     class="text-primary-600 dark:text-primary-400 hover:text-primary-700 text-sm font-medium">访问工具 →</a>
</div>
```

## 四、假设与决策（Assumptions & Decisions）

| 决策点 | 选择 | 备注 |
|---|---|---|
| 工具数据来源 | 本地 `src/data/aiTools.js` | 避免新增 API、与 `websites.js` 一致 |
| 点击/隐藏存储 | 独立 localStorage key | 与网站统计互不影响 |
| 是否保留 SideNav 锚点 | 保留 | 通过空 anchor div + id 兼容 |
| 是否新增图片头像 | 不引入 | 维持当前文字头像方案，零新增资源 |
| 是否引入"家长/孩子"徽章 | 数据字段保留，不在第一版 UI 渲染 | 避免本次改动过大 |
| 死代码（picsum 占位） | 全部删除 | 200 行减肥 |
| `target="_blank"` 安全 | 一律加 `rel="noopener noreferrer"` | 修安全短板 |
| 卡片描述显示 | `line-clamp-2` + title tooltip | 不再单行 truncate |
| 默认显示数量 | 12 | 与 HomeView 默认 8 略多，因为 AI 工具卡片信息密度更低 |

## 五、验证步骤（Verification）

1. **静态检查**：`npm run build`，确保模板不报错、无未引用变量警告。
2. **功能验证**（本地 `npm run dev`）：
   - 切换 6 个分类，工具卡片正确过滤。
   - 移动端窄屏下分类条可横向滚动（不被 `flex-1` 撑爆）。
   - 点击同一工具 3 次后再刷新页面，左上角出现金色星标。
   - 在管理面板隐藏/恢复一个工具，刷新后状态保留。
   - 点击"报告失效"，卡片变红，可在管理面板恢复。
   - 卡片 hover 时操作按钮浮现；非 hover 时不挡 Tag。
   - 长描述卡片悬停显示 native tooltip。
3. **回归**：HomeView 常用网站功能未受影响（独立 localStorage key）。
4. **可访问性**：键盘 Tab 可聚焦每个卡片链接；外链全部带 `rel="noopener noreferrer"`。
5. **SideNav**：左侧菜单点击「AI图形生成」等 anchor 仍可跳转到对应锚点位置。

## 六、风险与回退

- 风险点：若用户已有 `bama_website_clicks` 累积数据，重构 AI 工具页不影响（key 隔离）。
- 回退：本方案改动局限在 3 个文件（`AiToolsView.vue` 重写、新增 `aiTools.js`、新增 `useAiToolClicks.js`），git revert 即可还原。
