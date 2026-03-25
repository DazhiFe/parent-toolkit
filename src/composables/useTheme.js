import { ref, watchEffect } from 'vue'

const isNightTime = () => {
  const hour = new Date().getHours()
  return hour >= 18 || hour < 6
}

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    return savedTheme
  }

  if (isNightTime()) {
    return 'dark'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref(getInitialTheme())

watchEffect(() => {
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
  localStorage.setItem('theme', theme.value)
})

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

const checkAndAutoSwitchTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    return
  }
  
  const shouldBeDark = isNightTime()
  if (shouldBeDark && theme.value !== 'dark') {
    theme.value = 'dark'
  } else if (!shouldBeDark && theme.value !== 'light') {
    theme.value = 'light'
  }
}

setInterval(checkAndAutoSwitchTheme, 60000)

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    theme.value = e.matches ? 'dark' : 'light'
  }
})

export { theme, toggleTheme }
