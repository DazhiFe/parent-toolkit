# 图片多次裁剪工具实施计划

## Summary

新增一个「图片多次裁剪」工具页面（`/image-crop`）。用户上传单张图片后，可在画布上拖拽绘制多个矩形裁剪区域，随后批量导出裁剪后的图片（单张下载 / ZIP 打包 / PDF 每页一张）。本功能核心解决类似试卷/长图中多区域独立提取的场景（如截图中一张试卷上有多个题目区域，分别裁剪保存）。

## Current State Analysis

- **已有依赖**：`jsPDF`、`JSZip`、`html2canvas` 已在项目中使用（[ImageToPdfView.vue](file:///d:/code/parent-toolkit/src/views/ImageToPdfView.vue)、[ImageResizeView.vue](file:///d:/code/parent-toolkit/src/views/ImageResizeView.vue)）。
- **已有模式**：ImageResizeView 使用离屏 canvas 进行 cover 填充绘制；WechatArticlePrintView 使用 jsPDF 整页渲染+智能切片；ImageWatermarkView 提供网格结果展示。
- **UI 风格**：所有视图使用 `max-w-5xl/6xl mx-auto px-4 py-8` 居中布局，卡片式白底阴影，Tailwind CSS，支持 dark mode。
- **路由**：已有 5 个图片相关路由（`image-to-pdf`、`image-compress`、`image-convert`、`image-watermark`、`image-resize`），新增路由需遵循 `image-xxx` 命名。
- **首页**：`HomeView.vue` 的 `#image-tools` section 有 5 个卡片，需新增第 6 个。
- **通知**：`useToast()` composable 已存在，新视图应统一使用（替代 `alert`）。
- **无专用图像工具库**：所有 canvas 操作内联在组件中，裁剪逻辑也内联在视图内。

## Proposed Changes

### 1. 新建 `src/views/ImageCropView.vue`（核心页面，~600 行）

#### What
实现完整的「上传 → 画布交互绘制裁剪框 → 批量裁剪 → 导出」工作流。

#### How — 模块分解

**A. 上传模块**
- 使用隐藏 `<input type="file" accept="image/*">` + label 触发。
- 限制单文件上传（本工具核心场景是"一张大图分多次裁剪"）。
- 用 `URL.createObjectURL(file)` 生成预览地址，组件卸载时 `revokeObjectURL`。
- 读取原图尺寸：`new Image()` → `onload` 获取 `naturalWidth` / `naturalHeight`。

**B. 画布交互模块（核心）**
- 使用一个 `<canvas ref="mainCanvas">` 显示原图缩略图。
- 画布尺寸自适应容器宽度，但保持原图宽高比：`displayedWidth = containerWidth`，`displayedHeight = containerWidth * (originalHeight / originalWidth)`。
- **坐标比例因子**：`scale = originalWidth / displayedWidth`，所有显示坐标乘以 `scale` 得到原始像素坐标。
- **绘制裁剪框**：
  - 在 `mainCanvas` 的 `mousedown` 事件中记录起点 `(startX, startY)`。
  - `mousemove` 时清空并重绘原图 + 所有已有裁剪框 + 当前拖拽中的预览框（虚线矩形）。
  - `mouseup` 时如果拖拽距离 > 10px，确认添加一个裁剪区域到 `cropRegions` 数组。
- **裁剪框样式**：每个框用不同颜色边框（循环使用预设 8 色：`#ef4444`、`#f97316`、`#eab308`、`#22c55e`、`#06b6d4`、`#3b82f6`、`#a855f7`、`#ec4899`），内部半透明填充（alpha 0.08），左上角显示序号标签（白底圆角 + 颜色边框）。
- **已有框交互**：
  - 点击框内区域可"选中"（高亮边框加粗）。
  - 选中后按 `Delete` 键或点击框上的「×」按钮删除。
  - 选中后显示当前框的坐标/尺寸输入框（像素级微调）。
  - **调整大小**：选中框的 8 个角点（4 角 + 4 边中点）显示 6px 小圆点，鼠标 hover 变手型，拖拽角点调整对应边。
  - **整体移动**：拖拽框内部（非角点）可整体移动位置。

**C. 裁剪执行模块**
- 用户点击「开始裁剪」后，对每个 `cropRegions` 项：
  1. 创建离屏 canvas：`document.createElement('canvas')`。
  2. `canvas.width = region.width; canvas.height = region.height`。
  3. `ctx.drawImage(originalImage, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height)`。
  4. `canvas.toBlob((blob) => {...}, outputFormat, quality)` 生成结果。
  5. 结果推入 `croppedResults` 数组：`{ id, index, blob, url, width, height }`。
- 输出格式：保持原格式；若原格式为 `image/heic` 等浏览器不支持的格式，fallback 为 PNG。

**D. 导出模块**
- **单张下载**：`<a href="blobUrl" download="原图名_1.png">`。
- **批量 ZIP 下载**：`JSZip` 打包所有裁剪结果，文件名格式 `原图名_1.png`、`原图名_2.png`…，ZIP 名 `原图名_裁剪结果.zip`。
- **生成 PDF**：使用 `jsPDF`，每页一张裁剪图：
  ```js
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  for (const img of croppedResults) {
    if (i > 0) pdf.addPage()
    const pageW = pdf.internal.pageSize.getWidth() - margin * 2
    const pageH = pdf.internal.pageSize.getHeight() - margin * 2
    const imgRatio = img.width / img.height
    const pageRatio = pageW / pageH
    let finalW, finalH
    if (imgRatio > pageRatio) {
      finalW = pageW; finalH = pageW / imgRatio
    } else {
      finalH = pageH; finalW = pageH * imgRatio
    }
    const x = margin + (pageW - finalW) / 2
    const y = margin + (pageH - finalH) / 2
    pdf.addImage(img.url, format, x, y, finalW, finalH)
  }
  pdf.output('blob') → URL.createObjectURL → <a download>
  ```
- PDF 中每页自动居中，保持原比例，不拉伸。

**E. UI 布局**
- 整体容器：`min-h-screen bg-gray-50 dark:bg-gray-900 py-8`，内容区 `max-w-6xl mx-auto px-4`。
- 第一段：上传区（虚线框，已上传后显示原图文件名 + 替换按钮）。
- 第二段：画布区（白色卡片，画布自适应宽度，下方提示"拖拽绘制裁剪区域，点击选中后可调整"）。
- 第三段：裁剪区列表（每个区域显示：序号色块 + 尺寸 `宽×高` + 精确坐标输入框 + 删除按钮）。
- 第四段：操作按钮（开始裁剪 / 重置裁剪区 / 批量下载 ZIP / 导出 PDF）。
- 第五段：结果预览网格（`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4`），每张显示缩略图 + 单张下载按钮。

**F. 暗色模式**
- 画布背景在 dark mode 下用深灰色边框包裹（`dark:border-gray-700`），裁剪框颜色保持明亮（红/橙/黄/绿/青/蓝/紫/粉）。
- 所有文字和控件必须使用 `dark:text-white` / `dark:bg-gray-800` 等。

### 2. 修改 `src/router/index.js`

#### What/How
在路由数组末尾新增：
```js
{
  path: '/image-crop',
  name: 'image-crop',
  component: () => import('../views/ImageCropView.vue')
}
```

### 3. 修改 `src/views/HomeView.vue`

#### What/How
在 `#image-tools` section 的网格中新增第 6 个卡片：
- 图标：剪刀/裁剪相关 SVG（用 Heroicons `ScissorsIcon` 或自定义 SVG）。
- 标题：`图片多次裁剪`
- 描述：`一张图自定义多个裁剪区域，批量导出图片或PDF`
- 链接：`/image-crop`
- 颜色：`bg-rose-50 dark:bg-rose-900/20`，图标 `text-rose-600 dark:text-rose-400`

### 4. 无新增依赖

`jsPDF`、`JSZip` 已存在于项目中，不需要 `npm install`。

## Assumptions & Decisions

1. **单图上传**：本工具核心场景是"一张大图多次裁剪"，不支持多文件上传。如需处理多张独立图片，用户应使用现有 ImageResizeView/ImageCompressView。
2. **裁剪框自动编号**：不实现自定义命名，文件名使用 `原图名_1.png` 自动编号。简化交互，降低复杂度。
3. **PDF 每页一张图**：不实现多图拼接/排版，每张裁剪结果独占一页，自动居中+等比缩放。足够覆盖试卷分题导出场景。
4. **画布上直接交互**：不采用"右侧列表输入坐标"作为主交互，而是主交互为拖拽绘制，列表仅做微调/管理。用户体验最直观。
5. **裁剪框颜色循环**：8 色循环，足够区分常见数量（试卷通常 5-10 题），不实现用户自选颜色。
6. **输出格式跟随原图**：若原图为 PNG 则输出 PNG，JPG 则输出 JPG，其他 fallback PNG。
7. **不实现撤销/重做**：删除后重新绘制即可，场景简单，不需要历史栈。
8. **触摸支持**：canvas 需同时处理 `touchstart`/`touchmove`/`touchend`，支持移动端使用。

## Verification Steps

1. **上传**：选择一张 JPG/PNG 图片，画布正确显示缩略图，保持宽高比。
2. **绘制裁剪框**：在画布上拖拽绘制 3 个不同区域，显示不同颜色边框 + 序号。
3. **选中与删除**：点击某个框，边框加粗；按 Delete 键或点击「×」，框消失。
4. **精确调整**：选中后修改列表中的 x/y/width/height 输入框，画布上框实时更新。
5. **调整大小**：拖拽框的角点，框大小改变，列表数值同步更新。
6. **执行裁剪**：点击「开始裁剪」，结果区显示 3 张缩略图，尺寸与框一致。
7. **单张下载**：点击结果区的下载按钮，文件名为 `原图名_1.png` 等。
8. **ZIP 下载**：点击「批量下载 ZIP」，压缩包内包含所有裁剪图。
9. **PDF 导出**：点击「导出 PDF」，每页一张裁剪图，居中、等比、不拉伸。
10. **暗色模式**：切换 dark mode，画布、列表、按钮样式均正常。
11. **移动端**：手机浏览器打开，触摸绘制裁剪框正常。
12. **内存检查**：上传后替换图片，旧图片的 ObjectURL 已 revoke，无内存泄漏。
