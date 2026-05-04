'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Navbar } from '@/components/layout/Navbar'
import DietLogPage from '@/components/pages/DietLogPage'
import ManagementPage from '@/components/pages/ManagementPage'

type TabType = 'diet-log' | 'management'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('diet-log')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Navbar />

      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      <div className="fixed inset-0 pt-16">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 pt-16">
        {/* Header */}
        <div className="pt-8 pb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center tracking-wide" style={{ textShadow: '0 0 40px rgba(255,255,255,0.3)' }}>
            🧠 AI营养分析师
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 px-4">
          <div className="glass-card backdrop-blur-xl bg-white/10 rounded-2xl p-2 border border-white/20 shadow-xl inline-flex gap-2">
            <button
              onClick={() => setActiveTab('diet-log')}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === 'diet-log'
                  ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg shadow-pink-500/25'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              饮食记录
            </button>
            <button
              onClick={() => setActiveTab('management')}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === 'management'
                  ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg shadow-pink-500/25'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              数据管理
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 pb-8">
          {activeTab === 'diet-log' && <DietLogPage />}
          {activeTab === 'management' && <ManagementPage />}
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
