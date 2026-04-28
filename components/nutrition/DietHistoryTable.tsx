'use client'

import { useState, useEffect } from 'react'
import { getDietLogs, deleteDietLog } from '@/lib/database'

export default function DietHistoryTable() {
  const [records, setRecords] = useState<any[]>([])

  useEffect(() => {
    const loadRecords = () => {
      setRecords(getDietLogs())
    }

    loadRecords()

    const handleUpdate = () => {
      loadRecords()
    }

    window.addEventListener('food-diary-update', handleUpdate)
    return () => window.removeEventListener('food-diary-update', handleUpdate)
  }, [])

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
      <h2 className="text-xl font-semibold mb-6">三、饮食记录历史</h2>

      {records.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          暂无饮食记录
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left sticky left-0">时间</th>
                <th className="px-4 py-3 text-left">食物及含量</th>
                <th className="px-4 py-3 text-right">钠</th>
                <th className="px-4 py-3 text-right">脂肪</th>
                <th className="px-4 py-3 text-right">蛋白质</th>
                <th className="px-4 py-3 text-right">碳水</th>
                <th className="px-4 py-3 text-right">热量</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-left">
                    <div>{formatDate(record.date)}</div>
                    <div className="text-xs text-gray-500">{formatTime(record.time)}</div>
                  </td>
                  <td className="px-4 py-3 text-left">{record.food_items || '-'}</td>
                  <td className="px-4 py-3 text-right">{record.sodium_mg || 0}mg</td>
                  <td className="px-4 py-3 text-right">{record.fat_g || 0}g</td>
                  <td className="px-4 py-3 text-right">{record.protein_g || 0}g</td>
                  <td className="px-4 py-3 text-right">{record.carbs_g || 0}g</td>
                  <td className="px-4 py-3 text-right">{record.calories || 0}kcal</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
