# 批量图片调整尺寸工具 - 实施计划

## 概述

新增一个独立工具页「批量图片调整尺寸」，支持用户批量上传混合方向（横版+竖版）的照片，按「统一长边」策略批量处理到目标尺寸，并可选输出格式与质量，最后支持单张下载或打包 ZIP 批量下载。

## 当前状态分析

代码库已有 4 个图片处理视图，全部使用原生 Canvas API + JSZip，**无需新增任何依赖**：

* `src/views/ImageCompressView.vue` — 已含尺寸计算 + canvas 绘制 + `toBlob` + 批量进度条，是最贴近的模板

* `src/views/ImageConvertView.vue` / `ImageWatermarkView.vue` — 含 JSZip 批量下载完整流程

* `src/views/ImageToPdfView.vue` — 图片转 PDF

**现有图片工具未注册到** **`studyTools.js`** **/** **`aiTools.js`**，而是以硬编码卡片形式写在 `HomeView.vue` 的 `image-tools` section（第 265-312 行）。因此本工具同样无需修改 data 文件。

**路由模式**：全部懒加载 `() => import('../views/XxxView.vue')`，图片工具路由集中在 `router/index.js` 第 71-109 行。

**关键依赖（package.json 已有）**：

* `jszip: ^3.10.1` — 批量打包下载

* `@vueuse/core: ^10.3.0` — 可选

* Vue 3.3 + Tailwind 3.3 + Vite 4

## 设计决策（已与用户确认）

1. **尺寸策略：统一长边**

   * 所有图片的「长边」（max(width, height)）统一缩放到目标尺寸

   * 短边按原宽高比等比例缩放

   * 横版（landscape）→ 宽为长边；竖版（portrait）→ 高为长边

   * 保留原始比例，不变形、不裁剪、不填充

   * 公式：`ratio = targetLongEdge / max(img.width, img.height)`，`newWidth = round(img.width * ratio)`，`newHeight = round(img.height * ratio)`

2. **输出格式：可选格式 + 质量**

   * 格式下拉框：保留原格式 / JPG / PNG / WebP

   * 质量滑块（0-100）：仅对 JPG / WebP 生效；PNG 忽略质量

   * 原格式时按文件 MIME 类型输出

## 实施步骤

### 步骤 1：新建 `src/views/ImageResizeView.vue`

**整体结构**（参考 `ImageCompressView.vue`）：

```
<script setup>
- 导入：ref/computed, useToast, JSZip
- 状态：originalImages[], processedImages[], targetLongEdge, outputFormat, quality, isProcessing, progress, errorMessage
- 文件选择：handleFileSelect (multiple, 类型校验 image/*)
- 预览清理：URL.revokeObjectURL on remove/clear
- 核心处理：processImages() — 遍历每张图，new Image() + canvas + toBlob
  - 方向判断：const isPortrait = img.height > img.width
  - 长边缩放：ratio = targetLongEdge / Math.max(img.width, img.height)
  - 跳过处理：若原图长边 ≤ 目标尺寸，按用户选择（建议默认跳过放大，可勾选「允许放大」）
  - 进度：progress = Math.round(((i+1)/total)*100)
- 单张下载：downloadOne(index)
- 批量下载：downloadAll() — JSZip 打包
- 清空：clearAll()
</script>
```

**UI 布局**（沿用现有图片工具风格）：

```html
<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
  <div class="max-w-5xl mx-auto px-4">
    <!-- 标题 -->
    <h1>批量图片调整尺寸</h1>
    <p>支持横版竖版混合上传，统一长边缩放</p>

    <!-- 设置区：grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 -->
    - 目标长边（数字输入，单位 px，默认 1920，预设按钮 1080/1280/1920/2048/3840）
    - 输出格式（下拉：原格式/JPG/PNG/WebP）
    - 质量（滑块 1-100，默认 85，仅 JPG/WebP 显示）
    - 允许放大（复选框，默认关闭）

    <!-- 上传区：拖拽 + 点击 -->
    <input type="file" multiple accept="image/*">

    <!-- 文件列表：每行显示 缩略图 | 文件名 | 原始尺寸(宽×高 + 方向标识) | 状态/处理后尺寸 | 操作 -->

    <!-- 处理按钮 + 进度条 -->
    <button @click="processImages">开始处理</button>
    <progress v-if="isProcessing" :value="progress" max="100">

    <!-- 处理结果：处理后缩略图 + 下载按钮（单张/全部） -->
  </div>
</div>
```

**关键实现细节**：

1. **方向标识**：列表中每张图显示 `横版` / `竖版` / `方图` 标签（基于 `width` vs `height`）
2. **尺寸预览**：选择文件后立即读取每张图的原始宽高显示，让用户上传后就能看到混合方向
3. **处理逻辑**（核心，复用 ImageCompressView 模式）：

   ```js
   const processImage = (file) => {
     return new Promise((resolve, reject) => {
       const img = new Image()
       img.onload = () => {
         const originalLongEdge = Math.max(img.width, img.height)
         const ratio = targetLongEdge.value / originalLongEdge
         // 不允许放大时跳过
         if (!allowUpscale.value && ratio >= 1) {
           // 直接返回原图
         }
         const newWidth = Math.round(img.width * ratio)
         const newHeight = Math.round(img.height * ratio)
         const canvas = document.createElement('canvas')
         canvas.width = newWidth
         canvas.height = newHeight
         const ctx = canvas.getContext('2d')
         ctx.fillStyle = '#FFFFFF'  // JPG 不支持透明，填充白底
         ctx.fillRect(0, 0, newWidth, newHeight)
         ctx.drawImage(img, 0, 0, newWidth, newHeight)
         const mimeType = getOutputMime(file.type)
         const qualityValue = (mimeType === 'image/jpeg' || mimeType === 'image/webp') ? quality.value / 100 : undefined
         canvas.toBlob((blob) => {
           resolve({ blob, url: URL.createObjectURL(blob), width: newWidth, height: newHeight, name: getOutputName(file.name) })
         }, mimeType, qualityValue)
       }
       img.onerror = () => reject(new Error('图片加载失败'))
       img.src = URL.createObjectURL(file)
     })
   }
   ```
4. **输出文件名**：原文件名 + `_${targetLongEdge}` 后缀，扩展名按输出格式调整（如 `photo.jpg` → `photo_1920.jpg`）
5. **useToast** 替代 `alert`：处理完成、失败、无文件时用 toast 提示
6. **暗色模式**：所有元素加 `dark:` 前缀，与现有图片工具一致
7. **内存清理**：组件卸载或清空时 `URL.revokeObjectURL` 所有 object URL

### 步骤 2：修改 `src/router/index.js`

在图片工具路由分组（第 109 行 `image-watermark` 路由之后）追加：

```js
{
  path: '/image-resize',
  name: 'image-resize',
  component: () => import('../views/ImageResizeView.vue')
}
```

### 步骤 3：修改 `src/views/HomeView.vue`

在 `image-tools` section（第 265-312 行）的卡片网格中追加第 5 张卡片，参考现有卡片结构：

```html
<div class="tool-card hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
  <div class="mb-4 flex items-center justify-center h-24 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
    <!-- 尺寸/缩放图标 SVG -->
  </div>
  <h3 class="text-lg font-semibold mb-2 dark:text-white">批量调整尺寸</h3>
  <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 truncate">横竖混合上传，统一长边缩放</p>
  <RouterLink to="/image-resize" class="text-primary-600 ...">使用工具 →</RouterLink>
</div>
```

颜色选用 `blue`（区别于现有 pink/cyan/emerald/amber）。图标用「缩放/尺寸」相关 SVG（如 expand/arrows-out 图标）。

## 假设与决策

* **不接入点击统计 composable**：现有 4 个图片工具均未接入 `useAiToolClicks` / `useStudyToolClicks`，保持一致

* **不使用 SideNav**：图片工具是独立全宽页面，仅依赖全局 AppHeader，与现有图片工具一致

* **不新增依赖**：Canvas + JSZip 已足够

* **默认不允许放大**：避免小图被放大模糊，提供「允许放大」复选框供用户选择

* **JPG 填充白底**：JPG 不支持透明通道，转换时用白色填充背景

* **目标长边预设**：1080 / 1280 / 1920 / 2048 / 3840，覆盖常见场景（社交媒体/高清/4K）

* **保留原格式时**：按文件 MIME 输出，GIF/BMP 等较少见格式也支持（canvas.toBlob 支持的范围内）

## 验证步骤

1. **启动开发服务器**：`npm run dev`
2. **路由验证**：访问 `/image-resize`，页面正常加载，无控制台错误
3. **首页入口**：首页 `image-tools` section 出现「批量调整尺寸」卡片，点击跳转到新页面
4. **功能验证**：

   * 上传 1 张横版 + 1 张竖版照片，确认列表正确显示方向标识和原始尺寸

   * 设置目标长边 1920，点击处理，确认两张图长边均为 1920，短边按比例

   * 切换输出格式为 JPG，质量 80，重新处理，确认输出 JPG 文件

   * 单张下载：文件名含 `_1920` 后缀，尺寸正确

   * 批量下载：生成 ZIP，解压后包含所有处理后图片

   * 上传小图（如 800×600），默认不放大，确认输出与原图一致；勾选「允许放大」后确认放大到 1920

   * 清空列表，确认无内存泄漏（object URL 已释放）
5. **暗色模式**：切换暗色模式，所有元素显示正常
6. **移动端**：窄屏下设置区单列堆叠，文件列表可横向滚动或自适应
7. **类型校验**：上传非图片文件，确认被过滤
8. **Lint 通过**：`npm run lint` 无错误

