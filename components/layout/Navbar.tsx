'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User } from 'lucide-react'

export function Navbar() {
  const { user } = useAuth()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-xl border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span className="text-white font-semibold text-lg">AI营养分析师</span>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-white/80">
                <User className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">退出</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
