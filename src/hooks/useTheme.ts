import { useEffect, useState } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'akara-theme'

function getInitialTheme(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
  } catch {
    // Gunakan tema sistem jika penyimpanan browser tidak tersedia.
  }

  return 'system'
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(getInitialTheme)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    getSystemTheme,
  )

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const updateSystemTheme = () => {
      setSystemTheme(media.matches ? 'dark' : 'light')
    }

    media.addEventListener('change', updateSystemTheme)

    return () => media.removeEventListener('change', updateSystemTheme)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  function setTheme(nextTheme: ThemePreference) {
    setThemeState(nextTheme)

    try {
      localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {
      // Tema tetap berlaku selama halaman terbuka.
    }
  }

  return { theme, setTheme, resolvedTheme }
}
