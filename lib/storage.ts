let currentUserId: string | null = null
let listeners: ((userId: string | null) => void)[] = []

export function setCurrentUserId(userId: string | null) {
  if (currentUserId !== userId) {
    console.log('Setting user ID:', userId)
    currentUserId = userId
    listeners.forEach(listener => listener(userId))
  }
}

export function getCurrentUserId(): string | null {
  return currentUserId
}

export function getStorageKey(key: string): string {
  const userId = currentUserId
  if (!userId) {
    console.warn('No user ID set, using default key:', key)
  }
  return userId ? `${userId}_${key}` : key
}

export function onUserIdChange(callback: (userId: string | null) => void) {
  listeners.push(callback)
  return () => {
    listeners = listeners.filter(l => l !== callback)
  }
}

export function clearUserData(userId: string | null) {
  if (!userId) return
  const prefix = `${userId}_`
  Object.keys(localStorage)
    .filter(key => key.startsWith(prefix))
    .forEach(key => localStorage.removeItem(key))
}
