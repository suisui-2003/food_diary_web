'use client'

import { useState, useEffect } from 'react'
import { getDietLogs, deleteDietLog } from '@/lib/database'
import { useAuth } from '@/components/auth/AuthProvider'

export default function DietHistoryTable() {
  const { isReady } = useAuth()
  const [records, setRecords] = useState<any[]>([])
  const loadRecords = () => {
    console.log('DietHistoryTable: Loading diet logs')
    setRecords(getDietLogs())
  }

  useEffect(() => {
    if (!isReady) {
      console.log('DietHistoryTable: Waiting for auth to be ready')
      return
    }

    console.log('DietHistoryTable: Loading data')
    loadRecords()

    const handleUpdate = () => {
      console.log('DietHistoryTable: food-diary-update received')
      loadRecords()
    }

    window.addEventListener('food-diary-update', handleUpdate)
    return () => window.removeEventListener('food-diary-update', handleUpdate)
  }, [isReady])

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      deleteDietLog(id)
      setRecords(getDietLogs())
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">三、饮食记录历史</h2>

      {records.length === 0 ? (
        <div className="text-center py-12 text-white/50">
          暂无饮食记录
        </div>
      ) : (
        <div className="glass-card-inner backdrop-blur-md bg-white/5 rounded-2xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left sticky left-0 text-white/80 font-medium">时间</th>
                  <th className="px-4 py-3 text-left text-white/80 font-medium">食物及含量</th>
                  <th className="px-4 py-3 text-right text-white/80 font-medium">钠</th>
                  <th className="px-4 py-3 text-right text-white/80 font-medium">脂肪</th>
                  <th className="px-4 py-3 text-right text-white/80 font-medium">蛋白质</th>
                  <th className="px-4 py-3 text-right text-white/80 font-medium">碳水</th>
                  <th className="px-4 py-3 text-right text-white/80 font-medium">热量</th>
                  <th className="px-4 py-3 text-center text-white/80 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {records?.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map((record) => (
                  <tr key={record.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-left">
                      <div className="text-white/90">{formatDate(record.date)}</div>
                      <div className="text-xs text-white/50">{formatTime(record.time)}</div>
                    </td>
                    <td className="px-4 py-3 text-left text-white/70 max-w-xs truncate">{record.food_items || '-'}</td>
                    <td className="px-4 py-3 text-right text-white/70">{record.sodium_mg || 0}mg</td>
                    <td className="px-4 py-3 text-right text-white/70">{record.fat_g || 0}g</td>
                    <td className="px-4 py-3 text-right text-white/70">{record.protein_g || 0}g</td>
                    <td className="px-4 py-3 text-right text-white/70">{record.carbs_g || 0}g</td>
                    <td className="px-4 py-3 text-right text-white/70">{record.calories || 0}kcal</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs transition-colors"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
