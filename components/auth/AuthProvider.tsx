'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { setCurrentUserId } from '@/lib/storage'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isReady: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 迁移旧数据到新的用户特定键
function migrateOldData(userId: string) {
  console.log('AuthProvider: Starting data migration for user:', userId)

  const oldKeys = [
    { old: 'user_profile', new: `${userId}_user_profile` },
    { old: 'food_items_library', new: `${userId}_food_items_library` },
    { old: 'diet_records', new: `${userId}_diet_records` },
    { old: 'nutrition_targets', new: `${userId}_nutrition_targets` },
  ]

  oldKeys.forEach(({ old, new: newKey }) => {
    const oldValue = localStorage.getItem(old)
    if (oldValue && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, oldValue)
      localStorage.removeItem(old)
      console.log(`AuthProvider: Migrated ${old} → ${newKey}`)
    }
  })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Log all localStorage keys for debugging
    console.log('AuthProvider: Current localStorage keys:', Object.keys(localStorage))

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const userId = session?.user?.id ?? null
      console.log('AuthProvider: Initial session, user ID:', userId)

      // Migrate old data to new user-prefixed keys
      if (userId) {
        migrateOldData(userId)
      }

      setSession(session)
      setUser(session?.user ?? null)
      setCurrentUserId(userId)
      setLoading(false)
      setIsReady(true)
      // Trigger event after setting user ID with delay to ensure React updates complete
      setTimeout(() => {
        console.log('AuthProvider: Triggering food-diary-update')
        window.dispatchEvent(new Event('food-diary-update'))
      }, 100)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthProvider: Auth state changed:', event, 'user ID:', session?.user?.id)
      console.log('AuthProvider: Current localStorage keys:', Object.keys(localStorage))
      setSession(session)
      setUser(session?.user ?? null)
      setCurrentUserId(session?.user?.id ?? null)
      setLoading(false)
      setIsReady(true)
      // Trigger event to notify components to reload data with delay
      setTimeout(() => {
        console.log('AuthProvider: Triggering food-diary-update')
        window.dispatchEvent(new Event('food-diary-update'))
      }, 100)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, isReady }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
