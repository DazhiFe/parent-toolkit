import { ref } from 'vue'

const CLICKS_KEY = 'bama_studytool_clicks'
const FREQUENT_THRESHOLD = 3

const clicks = ref({})

try {
  const saved = localStorage.getItem(CLICKS_KEY)
  if (saved) clicks.value = JSON.parse(saved)
} catch {}

function saveClicks() {
  try { localStorage.setItem(CLICKS_KEY, JSON.stringify(clicks.value)) } catch {}
}

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

function getSortedTools(tools) {
  return [...tools].sort((a, b) => {
    const clickA = getClickCount(a.id)
    const clickB = getClickCount(b.id)
    if (clickA !== clickB) return clickB - clickA
    if ((a.frequent ? 1 : 0) !== (b.frequent ? 1 : 0)) return (b.frequent ? 1 : 0) - (a.frequent ? 1 : 0)
    return 0
  })
}

export function useStudyToolClicks() {
  return {
    clicks,
    recordClick,
    getClickCount,
    isFrequent,
    getSortedTools,
  }
}
