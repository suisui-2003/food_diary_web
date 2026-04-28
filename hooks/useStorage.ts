import { useState, useEffect } from 'react'

export function useStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setStoredValue = (newValue: T) => {
    try {
      setValue(newValue)
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(newValue))
        window.dispatchEvent(new Event('storage'))
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window === 'undefined') return
      try {
        const item = localStorage.getItem(key)
        setValue(item ? JSON.parse(item) : defaultValue)
      } catch {
        setValue(defaultValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, defaultValue])

  return [value, setStoredValue]
}
