import { ref, watchEffect } from 'vue'

const isNightTime = () => {
  const hour = new Date().getHours()
  return hour >= 18 || hour < 6
}

const getInitialTheme = () => {
  const userSetTheme = localStorage.getItem('userTheme')
  if (userSetTheme) {
    return userSetTheme
  }

  if (isNightTime()) {
    return 'dark'
  }

  return 'light'
}

const theme = ref(getInitialTheme())

watchEffect(() => {
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
})

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('userTheme', theme.value)
}

const checkAndAutoSwitchTheme = () => {
  if (localStorage.getItem('userTheme')) {
    return
  }
  
  const shouldBeDark = isNightTime()
  if (shouldBeDark && theme.value !== 'dark') {
    theme.value = 'dark'
  } else if (!shouldBeDark && theme.value !== 'light') {
    theme.value = 'light'
  }
}

checkAndAutoSwitchTheme()

setInterval(checkAndAutoSwitchTheme, 60000)

export { theme, toggleTheme }
