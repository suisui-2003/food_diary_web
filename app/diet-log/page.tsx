'use client'

import { useState, useEffect } from 'react'
import DietLogForm from '@/components/forms/DietLogForm'
import type { NutritionTargets, DailyNutrition, FoodItem } from '@/lib/utils/nutritionCalculator'
import { getProfile, getDietLogs, addDietLog, getFoodItems } from '@/lib/database'

interface DietLogRecord {
  id?: string
  date: string
  time: string
  food_items: string
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  sodium_mg: number
}

export default function DietLogPage() {
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [target, setTarget] = useState<NutritionTargets>({
    daily_calories_target: 2000,
    daily_protein_target_g: 120,
    daily_fat_target_g: 67,
    daily_carbs_target_g: 225,
    daily_sodium_target_mg: 2300,
  })
  const [actual, setActual] = useState<DailyNutrition>({
    total_calories: 0,
    total_protein_g: 0,
    total_fat_g: 0,
    total_carbs_g: 0,
    total_sodium_mg: 0,
  })
  const [todayRecords, setTodayRecords] = useState<DietLogRecord[]>([])

  useEffect(() => {
    loadTargets()
    loadTodayRecords()

    const handleUpdate = () => {
      loadTargets()
      loadTodayRecords()
    }

    window.addEventListener('food-diary-update', handleUpdate)
    return () => window.removeEventListener('food-diary-update', handleUpdate)
  }, [selectedDate])

  const loadTargets = async () => {
    const profile = await getProfile()
    if (profile && profile.daily_calories_target) {
      setTarget({
        daily_calories_target: profile.daily_calories_target,
        daily_protein_target_g: Number(profile.daily_protein_target_g) || 120,
        daily_fat_target_g: Number(profile.daily_fat_target_g) || 67,
        daily_carbs_target_g: Number(profile.daily_carbs_target_g) || 225,
        daily_sodium_target_mg: Number(profile.daily_sodium_target_mg) || 2300,
      })
    }
  }

  const loadTodayRecords = () => {
    const allRecords = getDietLogs()
    const filtered = allRecords.filter(r => r.date === selectedDate)
    setTodayRecords(filtered)

    const total = filtered.reduce(
      (sum, record) => ({
        total_calories: sum.total_calories + record.calories,
        total_protein_g: sum.total_protein_g + record.protein_g,
        total_fat_g: sum.total_fat_g + record.fat_g,
        total_carbs_g: sum.total_carbs_g + record.carbs_g,
        total_sodium_mg: sum.total_sodium_mg + record.sodium_mg,
      }),
      {
        total_calories: 0,
        total_protein_g: 0,
        total_fat_g: 0,
        total_carbs_g: 0,
        total_sodium_mg: 0,
      }
    )
    setActual(total)
  }

  function calculateNutritionFromParsed(
    parsedItems: Array<{ name: string; quantity: number; unit: string; protein_g?: number; fat_g?: number; calories?: number; sodium_mg?: number; carbs_g?: number }>
  ): DailyNutrition {
    console.log('Calculating nutrition for items:', parsedItems)

    return parsedItems.reduce(
      (total, parsed) => {
        let calories = 0
        let protein_g = 0
        let fat_g = 0
        let carbs_g = 0
        let sodium_mg = 0

        console.log('Processing item:', parsed.name, 'Raw values:', {
          calories: parsed.calories,
          protein_g: parsed.protein_g,
          fat_g: parsed.fat_g,
          carbs_g: parsed.carbs_g,
          sodium_mg: parsed.sodium_mg,
          quantity: parsed.quantity,
          unit: parsed.unit
        })

        if (parsed.calories !== undefined && parsed.calories !== null && parsed.calories > 0) {
          calories = parsed.calories
        }
        if (parsed.protein_g !== undefined && parsed.protein_g !== null && parsed.protein_g > 0) {
          protein_g = parsed.protein_g
        }
        if (parsed.fat_g !== undefined && parsed.fat_g !== null && parsed.fat_g > 0) {
          fat_g = parsed.fat_g
        }
        if (parsed.carbs_g !== undefined && parsed.carbs_g !== null && parsed.carbs_g > 0) {
          carbs_g = parsed.carbs_g
        }
        if (parsed.sodium_mg !== undefined && parsed.sodium_mg !== null && parsed.sodium_mg > 0) {
          sodium_mg = parsed.sodium_mg
        }

        const itemResult = {
          calories: calories,
          protein_g: protein_g,
          fat_g: fat_g,
          carbs_g: carbs_g,
          sodium_mg: sodium_mg,
        }

        console.log('Item result for', parsed.name, ':', itemResult)

        return {
          total_calories: total.total_calories + itemResult.calories,
          total_protein_g: total.total_protein_g + itemResult.protein_g,
          total_fat_g: total.total_fat_g + itemResult.fat_g,
          total_carbs_g: total.total_carbs_g + itemResult.carbs_g,
          total_sodium_mg: total.total_sodium_mg + itemResult.sodium_mg,
        }
      },
      {
        total_calories: 0,
        total_protein_g: 0,
        total_fat_g: 0,
        total_carbs_g: 0,
        total_sodium_mg: 0,
      }
    )
  }

  const getCompletionColor = (percentage: number): string => {
    if (percentage < 80) return 'text-red-600 bg-red-50'
    if (percentage > 120) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)

    try {
      const inputText = (document.querySelector('textarea') as HTMLTextAreaElement)?.value || ''
      console.log('Analyzing input:', inputText)

      const response = await fetch('/api/nutrition/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputText }),
      })

      const result = await response.json()
      console.log('Parse result:', result)
      console.log('Food items detail:', JSON.stringify(result.foodItems, null, 2))

      if (response.ok && result.foodItems && result.foodItems.length > 0) {
        const foodLibrary = getFoodItems()
        const nutrition = calculateNutritionFromParsed(result.foodItems, foodLibrary)
        console.log('Calculated nutrition:', nutrition)

        await addDietLog({
          date: selectedDate,
          time: new Date().toISOString(),
          food_items: JSON.stringify(result.foodItems),
          sodium_mg: nutrition.total_sodium_mg,
          fat_g: nutrition.total_fat_g,
          protein_g: nutrition.total_protein_g,
          carbs_g: nutrition.total_carbs_g,
          calories: nutrition.total_calories,
        })

        loadTodayRecords()
      } else {
        alert('未能解析饮食内容，请重试')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      alert('解析失败，请检查网络连接后重试')
    } finally {
      setAnalyzing(false)
    }
  }

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const getCompletionPercent = (actual: number, target: number) => {
    return target > 0 ? Math.round((actual / target) * 100) : 0
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">饮食记录</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">选择日期</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid gap-8">
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">添加饮食记录</h2>
            <DietLogForm />
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {analyzing ? '分析中...' : '添加记录'}
            </button>
          </section>

          {todayRecords.length > 0 && (
            <>
              <section className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">今日记录</h2>
                <div className="space-y-3">
                  {todayRecords.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-1">{formatTime(record.time)}</div>
                        <div className="text-sm">{record.food_items}</div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-blue-600">{record.calories}kcal</span>
                        <span className="text-green-600">{record.protein_g}g</span>
                        <span className="text-yellow-600">{record.fat_g}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">营养摄入总览</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">热量</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(actual.total_calories)} kcal
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">蛋白质</div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(actual.total_protein_g)} g
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">脂肪</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {Math.round(actual.total_fat_g)} g
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">碳水</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(actual.total_carbs_g)} g
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">钠</div>
                    <div className="text-2xl font-bold text-red-600">
                      {Math.round(actual.total_sodium_mg)} mg
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">与每日目标对比</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-3 text-left">营养素</th>
                        <th className="px-4 py-3 text-right">目标值</th>
                        <th className="px-4 py-3 text-right">实际摄入</th>
                        <th className="px-4 py-3 text-right">完成度</th>
                        <th className="px-4 py-3 text-center">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="px-4 py-3">热量</td>
                        <td className="px-4 py-3 text-right">{target.daily_calories_target} kcal</td>
                        <td className="px-4 py-3 text-right">{Math.round(actual.total_calories)} kcal</td>
                        <td className="px-4 py-3 text-right">
                          {getCompletionPercent(actual.total_calories, target.daily_calories_target)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${getCompletionColor(
                            getCompletionPercent(actual.total_calories, target.daily_calories_target)
                          )}`}>
                            {getCompletionPercent(actual.total_calories, target.daily_calories_target) < 80 ? '偏低' :
                              getCompletionPercent(actual.total_calories, target.daily_calories_target) > 120 ? '偏高' : '正常'}
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">蛋白质</td>
                        <td className="px-4 py-3 text-right">{target.daily_protein_target_g} g</td>
                        <td className="px-4 py-3 text-right">{Math.round(actual.total_protein_g)} g</td>
                        <td className="px-4 py-3 text-right">
                          {getCompletionPercent(actual.total_protein_g, target.daily_protein_target_g)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${getCompletionColor(
                            getCompletionPercent(actual.total_protein_g, target.daily_protein_target_g)
                          )}`}>
                            {getCompletionPercent(actual.total_protein_g, target.daily_protein_target_g) < 80 ? '偏低' :
                              getCompletionPercent(actual.total_protein_g, target.daily_protein_target_g) > 120 ? '偏高' : '正常'}
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">脂肪</td>
                        <td className="px-4 py-3 text-right">{target.daily_fat_target_g} g</td>
                        <td className="px-4 py-3 text-right">{Math.round(actual.total_fat_g)} g</td>
                        <td className="px-4 py-3 text-right">
                          {getCompletionPercent(actual.total_fat_g, target.daily_fat_target_g)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${getCompletionColor(
                            getCompletionPercent(actual.total_fat_g, target.daily_fat_target_g)
                          )}`}>
                            {getCompletionPercent(actual.total_fat_g, target.daily_fat_target_g) < 80 ? '偏低' :
                              getCompletionPercent(actual.total_fat_g, target.daily_fat_target_g) > 120 ? '偏高' : '正常'}
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3">碳水</td>
                        <td className="px-4 py-3 text-right">{target.daily_carbs_target_g} g</td>
                        <td className="px-4 py-3 text-right">{Math.round(actual.total_carbs_g)} g</td>
                        <td className="px-4 py-3 text-right">
                          {getCompletionPercent(actual.total_carbs_g, target.daily_carbs_target_g)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${getCompletionColor(
                            getCompletionPercent(actual.total_carbs_g, target.daily_carbs_target_g)
                          )}`}>
                            {getCompletionPercent(actual.total_carbs_g, target.daily_carbs_target_g) < 80 ? '偏低' :
                              getCompletionPercent(actual.total_carbs_g, target.daily_carbs_target_g) > 120 ? '偏高' : '正常'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">钠</td>
                        <td className="px-4 py-3 text-right">{target.daily_sodium_target_mg} mg</td>
                        <td className="px-4 py-3 text-right">{Math.round(actual.total_sodium_mg)} mg</td>
                        <td className="px-4 py-3 text-right">
                          {getCompletionPercent(actual.total_sodium_mg, target.daily_sodium_target_mg)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${getCompletionColor(
                            getCompletionPercent(actual.total_sodium_mg, target.daily_sodium_target_mg)
                          )}`}>
                            {getCompletionPercent(actual.total_sodium_mg, target.daily_sodium_target_mg) < 80 ? '偏低' :
                              getCompletionPercent(actual.total_sodium_mg, target.daily_sodium_target_mg) > 120 ? '偏高' : '正常'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {todayRecords.length === 0 && (
            <section className="bg-white rounded-xl shadow-sm p-6 text-center">
              <p className="text-gray-400">今日暂无饮食记录</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
