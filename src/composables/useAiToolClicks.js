import { ref } from 'vue'

const CLICKS_KEY = 'bama_aitool_clicks'
const HIDDEN_KEY = 'bama_aitool_hidden'
const DEAD_KEY = 'bama_aitool_dead'
const FREQUENT_THRESHOLD = 3

// ─── 单例状态 ───
const clicks = ref({})
const hiddenIds = ref([])
const deadIds = ref([])

// 初始化加载
try {
  const c = localStorage.getItem(CLICKS_KEY)
  if (c) clicks.value = JSON.parse(c)
} catch {}
try {
  const h = localStorage.getItem(HIDDEN_KEY)
  if (h) hiddenIds.value = JSON.parse(h)
} catch {}
try {
  const d = localStorage.getItem(DEAD_KEY)
  if (d) deadIds.value = JSON.parse(d)
} catch {}

function saveClicks() {
  try { localStorage.setItem(CLICKS_KEY, JSON.stringify(clicks.value)) } catch {}
}
function saveHidden() {
  try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenIds.value)) } catch {}
}
function saveDead() {
  try { localStorage.setItem(DEAD_KEY, JSON.stringify(deadIds.value)) } catch {}
}

// ─── 点击记录 ───
function recordClick(toolId) {
  if (!clicks.value[toolId]) clicks.value[toolId] = 0
  clicks.value[toolId]++
  saveClicks()
}

function getClickCount(toolId) {
  return clicks.value[toolId] || 0
}

function isFrequent(toolId) {
  return getClickCount(toolId) >= FREQUENT_THRESHOLD
}

// tag 权重排序
const tagWeight = { '热门': 3, '官方': 2, '免费': 1 }

function getSortedTools(tools) {
  const hasAnyClicks = Object.keys(clicks.value).length > 0
  return [...tools].sort((a, b) => {
    const clickA = getClickCount(a.id)
    const clickB = getClickCount(b.id)
    if (hasAnyClicks && (clickA > 0 || clickB > 0)) {
      if (clickA !== clickB) return clickB - clickA
    }
    const wA = tagWeight[a.tag] ?? 0
    const wB = tagWeight[b.tag] ?? 0
    if (wA !== wB) return wB - wA
    return 0
  })
}

// ─── 隐藏/显示 ───
function hideTool(toolId) {
  if (!hiddenIds.value.includes(toolId)) {
    hiddenIds.value.push(toolId)
    saveHidden()
  }
}

function showTool(toolId) {
  hiddenIds.value = hiddenIds.value.filter(id => id !== toolId)
  saveHidden()
}

function isHidden(toolId) {
  return hiddenIds.value.includes(toolId)
}

function toggleToolVisibility(toolId) {
  if (isHidden(toolId)) showTool(toolId)
  else hideTool(toolId)
}

// ─── 失效标记 ───
function markDead(toolId) {
  if (!deadIds.value.includes(toolId)) {
    deadIds.value.push(toolId)
    saveDead()
  }
}

function unmarkDead(toolId) {
  deadIds.value = deadIds.value.filter(id => id !== toolId)
  saveDead()
}

function isDead(toolId) {
  return deadIds.value.includes(toolId)
}

function reportDead(toolId) {
  markDead(toolId)
}

function restoreDead(toolId) {
  unmarkDead(toolId)
}

export function useAiToolClicks() {
  return {
    clicks,
    hiddenIds,
    deadIds,
    recordClick,
    getClickCount,
    isFrequent,
    getSortedTools,
    hideTool,
    showTool,
    isHidden,
    toggleToolVisibility,
    markDead,
    unmarkDead,
    isDead,
    reportDead,
    restoreDead,
  }
}
