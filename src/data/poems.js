// 古诗数据按需异步加载（数据本体存在 public/data/poems.json，避免打入主 chunk）
let poemsCache = null
let poemsPromise = null

export function loadPoems() {
  if (poemsCache) return Promise.resolve(poemsCache)
  if (poemsPromise) return poemsPromise
  poemsPromise = fetch('/data/poems.json')
    .then((res) => {
      if (!res.ok) throw new Error('加载诗词数据失败')
      return res.json()
    })
    .then((data) => {
      poemsCache = data
      return data
    })
    .catch((err) => {
      poemsPromise = null
      throw err
    })
  return poemsPromise
}

export async function searchPoemByTitle(title) {
  const list = await loadPoems()
  return list.find((p) => p.title.includes(title))
}

export async function getAllPoems() {
  return loadPoems()
}

export async function getRequiredPoems() {
  const list = await loadPoems()
  return list.filter((p) => p.required)
}

export async function searchPoemsByAuthor(author) {
  const list = await loadPoems()
  return list.filter((p) => p.author.includes(author))
}

export async function getPoemsByLevel(level) {
  const list = await loadPoems()
  return list.filter((p) => p.level === level)
}
