import { useEffect, useState } from 'react'

export type SystemTheme = 'light' | 'dark'

const getCurrentSystemTheme = (): SystemTheme => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useSystemTheme = () => {
  const [theme, setTheme] = useState<SystemTheme>(getCurrentSystemTheme)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const onThemeChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', onThemeChange)
    setTheme(mediaQuery.matches ? 'dark' : 'light')

    return () => {
      mediaQuery.removeEventListener('change', onThemeChange)
    }
  }, [])

  useEffect(() => {
    document.documentElement.style.colorScheme = theme
  }, [theme])

  return theme
}