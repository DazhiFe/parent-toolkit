import { ref } from 'vue'

const CLICKS_KEY = 'bama_website_clicks'
const HIDDEN_KEY = 'bama_website_hidden'
const DEAD_KEY = 'bama_website_dead'
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
function recordClick(siteId) {
  if (!clicks.value[siteId]) clicks.value[siteId] = 0
  clicks.value[siteId]++
  saveClicks()
}

function getClickCount(siteId) {
  return clicks.value[siteId] || 0
}

function isFrequent(siteId) {
  return getClickCount(siteId) >= FREQUENT_THRESHOLD
}

// tag 权重排序
const tagWeight = { '热门': 3, '官方': 2, '免费': 1 }

function getSortedSites(sites) {
  const hasAnyClicks = Object.keys(clicks.value).length > 0
  return [...sites].sort((a, b) => {
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

// ─── 隐藏/显示网站 ───
function hideSite(siteId) {
  if (!hiddenIds.value.includes(siteId)) {
    hiddenIds.value.push(siteId)
    saveHidden()
  }
}

function showSite(siteId) {
  hiddenIds.value = hiddenIds.value.filter(id => id !== siteId)
  saveHidden()
}

function isHidden(siteId) {
  return hiddenIds.value.includes(siteId)
}

function toggleSiteVisibility(siteId) {
  if (isHidden(siteId)) showSite(siteId)
  else hideSite(siteId)
}

// ─── 失效网站标记 ───
function markDead(siteId) {
  if (!deadIds.value.includes(siteId)) {
    deadIds.value.push(siteId)
    saveDead()
  }
}

function unmarkDead(siteId) {
  deadIds.value = deadIds.value.filter(id => id !== siteId)
  saveDead()
}

function isDead(siteId) {
  return deadIds.value.includes(siteId)
}

function reportDead(siteId) {
  markDead(siteId)
}

function restoreDead(siteId) {
  unmarkDead(siteId)
}

export function useWebsiteClicks() {
  return {
    clicks,
    hiddenIds,
    deadIds,
    recordClick,
    getClickCount,
    isFrequent,
    getSortedSites,
    hideSite,
    showSite,
    isHidden,
    toggleSiteVisibility,
    markDead,
    unmarkDead,
    isDead,
    reportDead,
    restoreDead,
  }
}
