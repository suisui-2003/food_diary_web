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
  const [refreshKey, setRefreshKey] = useState(0)
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
    console.log('DietLogPage: Loading data, refreshKey:', refreshKey)
    loadTargets()
    loadTodayRecords()

    const handleUpdate = () => {
      console.log('DietLogPage: food-diary-update received')
      setRefreshKey(prev => prev + 1)
    }

    window.addEventListener('food-diary-update', handleUpdate)
    return () => window.removeEventListener('food-diary-update', handleUpdate)
  }, [selectedDate, refreshKey])

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

  const getCompletionColor = (percentage: number): string => {
    if (percentage < 80) return 'from-rose-400 to-rose-600'
    if (percentage > 120) return 'from-amber-400 to-amber-600'
    return 'from-emerald-400 to-emerald-600'
  }

  const getCompletionBg = (percentage: number): string => {
    if (percentage < 80) return 'bg-rose-500/20 text-rose-300'
    if (percentage > 120) return 'bg-amber-500/20 text-amber-300'
    return 'bg-emerald-500/20 text-emerald-300'
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)

    try {
      const inputText = (document.querySelector('textarea') as HTMLTextAreaElement)?.value || ''
      console.log('Analyzing input:', inputText)

      const foodLibrary = getFoodItems()

      const response = await fetch('/api/nutrition/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputText, foodLibrary }),
      })

      const result = await response.json()
      console.log('Parse result:', result)

      if (response.ok && result.foodItems && result.foodItems.length > 0) {
        const nutrition = result.nutrition
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

  const getCompletionPercent = (actual: number, target: number) => {
    return target > 0 ? Math.round((actual / target) * 100) : 0
  }

  const generateAISuggestions = () => {
    const suggestions: string[] = []
    const foodLibrary = getFoodItems()

    const commonFoods = {
      protein: [
        { name: '鸡蛋', protein_g: 13, fat_g: 11, calories: 143, sodium_mg: 124, carbs_g: 0.7, serving_size_g: 100 },
        { name: '三文鱼', protein_g: 20, fat_g: 13, calories: 208, sodium_mg: 59, carbs_g: 0, serving_size_g: 100 },
        { name: '豆腐', protein_g: 8, fat_g: 5, calories: 76, sodium_mg: 7, carbs_g: 1.9, serving_size_g: 100 },
        { name: '牛奶', protein_g: 3.2, fat_g: 3.6, calories: 64, sodium_mg: 43, carbs_g: 4.8, serving_size_g: 100 },
        { name: '虾', protein_g: 24, fat_g: 0.3, calories: 99, sodium_mg: 111, carbs_g: 0.2, serving_size_g: 100 },
        { name: '希腊酸奶', protein_g: 10, fat_g: 0.4, calories: 59, sodium_mg: 36, carbs_g: 3.6, serving_size_g: 100 },
      ],
      fat: [
        { name: '牛油果', protein_g: 2, fat_g: 15, calories: 160, sodium_mg: 7, carbs_g: 8.5, serving_size_g: 100 },
        { name: '坚果（混合）', protein_g: 15, fat_g: 54, calories: 607, sodium_mg: 5, carbs_g: 21, serving_size_g: 100 },
        { name: '橄榄油', protein_g: 0, fat_g: 100, calories: 884, sodium_mg: 2, carbs_g: 0, serving_size_g: 100 },
        { name: '花生酱', protein_g: 25, fat_g: 50, calories: 588, sodium_mg: 17, carbs_g: 20, serving_size_g: 100 },
      ],
      carbs: [
        { name: '米饭', protein_g: 2.7, fat_g: 0.3, calories: 130, sodium_mg: 5, carbs_g: 28, serving_size_g: 100 },
        { name: '燕麦', protein_g: 17, fat_g: 6.9, calories: 389, sodium_mg: 2, carbs_g: 66, serving_size_g: 100 },
        { name: '全麦面包', protein_g: 13, fat_g: 3.4, calories: 250, sodium_mg: 500, carbs_g: 41, serving_size_g: 100 },
        { name: '香蕉', protein_g: 1.1, fat_g: 0.3, calories: 89, sodium_mg: 1, carbs_g: 22.8, serving_size_g: 100 },
        { name: '土豆', protein_g: 2, fat_g: 0.1, calories: 77, sodium_mg: 6, carbs_g: 17, serving_size_g: 100 },
      ],
      calories: [
        { name: '坚果（混合）', protein_g: 15, fat_g: 54, calories: 607, sodium_mg: 5, carbs_g: 21, serving_size_g: 100 },
        { name: '牛油果', protein_g: 2, fat_g: 15, calories: 160, sodium_mg: 7, carbs_g: 8.5, serving_size_g: 100 },
        { name: '三文鱼', protein_g: 20, fat_g: 13, calories: 208, sodium_mg: 59, carbs_g: 0, serving_size_g: 100 },
        { name: '燕麦', protein_g: 17, fat_g: 6.9, calories: 389, sodium_mg: 2, carbs_g: 66, serving_size_g: 100 },
      ],
    }

    const nutrientStatus = [
      { name: '蛋白质', actual: actual.total_protein_g, target: target.daily_protein_target_g, unit: 'g', key: 'protein' as const },
      { name: '脂肪', actual: actual.total_fat_g, target: target.daily_fat_target_g, unit: 'g', key: 'fat' as const },
      { name: '碳水', actual: actual.total_carbs_g, target: target.daily_carbs_target_g, unit: 'g', key: 'carbs' as const },
      { name: '热量', actual: actual.total_calories, target: target.daily_calories_target, unit: 'kcal', key: 'calories' as const },
    ]

    for (const nutrient of nutrientStatus) {
      const percent = getCompletionPercent(nutrient.actual, nutrient.target)

      if (percent < 70) {
        let recommendedFoods: string[] = []

        if (nutrient.key === 'protein') {
          const libraryFoods = foodLibrary
            .filter(f => f.protein_g > 15)
            .sort((a, b) => b.protein_g - a.protein_g)
            .slice(0, 2)
            .map(f => f.name)

          const commonFoodsList = commonFoods.protein
            .filter(f => !libraryFoods.includes(f.name))
            .sort((a, b) => b.protein_g - a.protein_g)
            .slice(0, 2 - libraryFoods.length)
            .map(f => f.name)

          recommendedFoods = [...libraryFoods, ...commonFoodsList]
        } else if (nutrient.key === 'fat') {
          const libraryFoods = foodLibrary
            .filter(f => f.fat_g > 5)
            .sort((a, b) => b.fat_g - a.fat_g)
            .slice(0, 2)
            .map(f => f.name)

          const commonFoodsList = commonFoods.fat
            .filter(f => !libraryFoods.includes(f.name))
            .sort((a, b) => b.fat_g - a.fat_g)
            .slice(0, 2 - libraryFoods.length)
            .map(f => f.name)

          recommendedFoods = [...libraryFoods, ...commonFoodsList]
        } else if (nutrient.key === 'carbs') {
          const libraryFoods = foodLibrary
            .filter(f => f.carbs_g > 15)
            .sort((a, b) => b.carbs_g - a.carbs_g)
            .slice(0, 2)
            .map(f => f.name)

          const commonFoodsList = commonFoods.carbs
            .filter(f => !libraryFoods.includes(f.name))
            .sort((a, b) => b.carbs_g - a.carbs_g)
            .slice(0, 2 - libraryFoods.length)
            .map(f => f.name)

          recommendedFoods = [...libraryFoods, ...commonFoodsList]
        } else if (nutrient.key === 'calories') {
          const libraryFoods = foodLibrary
            .sort((a, b) => b.calories - a.calories)
            .slice(0, 2)
            .map(f => f.name)

          const commonFoodsList = commonFoods.calories
            .filter(f => !libraryFoods.includes(f.name))
            .sort((a, b) => b.calories - a.calories)
            .slice(0, 2 - libraryFoods.length)
            .map(f => f.name)

          recommendedFoods = [...libraryFoods, ...commonFoodsList]
        }

        const foodText = recommendedFoods.length > 0
          ? `推荐：${recommendedFoods.join('、')}`
          : ''

        suggestions.push(`🥗 ${nutrient.name}摄入较低（${percent}%），${foodText}`)
      } else if (percent > 130) {
        suggestions.push(`⚠️ ${nutrient.name}摄入较高（${percent}%），建议适当减少`)
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('✅ 今日营养摄入均衡，继续保持！')
    }

    return suggestions
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="mb-6">
        <div className="glass-card backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 shadow-xl">
          <label className="block text-sm font-medium text-white/80 mb-2">选择日期</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="grid gap-6 md:gap-8">
        <section className="glass-card backdrop-blur-xl bg-white/10 rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-white">添加饮食记录</h2>
          <DietLogForm />
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full mt-6 py-4 bg-gradient-to-r from-pink-500 to-blue-500 text-white font-semibold rounded-2xl hover:from-pink-600 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-pink-500/25 hover:shadow-2xl transform hover:-translate-y-0.5"
          >
            {analyzing ? '分析中...' : '添加记录'}
          </button>
        </section>

        {todayRecords.length > 0 && (
          <>
            <section className="glass-card backdrop-blur-xl bg-white/10 rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
              <h2 className="text-2xl font-semibold mb-6 text-white">今日记录</h2>
              <div className="space-y-4">
                {todayRecords?.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()).map((record) => {
                  let foodItemsList: Array<{ name: string; quantity: number; unit: string }> = []
                  try {
                    foodItemsList = JSON.parse(record.food_items)
                  } catch {
                    // 保持原样
                  }

                  return (
                    <div key={record.id} className="glass-card-inner backdrop-blur-md bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-white/60">{formatTime(record.time)}</div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-pink-300 font-medium">{Math.round(record.calories)}kcal</span>
                          <span className="text-emerald-300 font-medium">{Math.round(record.protein_g)}g</span>
                          <span className="text-amber-300 font-medium">{Math.round(record.fat_g)}g</span>
                        </div>
                      </div>
                      <div className="text-sm text-white/90">
                        {foodItemsList.length > 0 ? foodItemsList.map((item, idx) => (
                          <span key={idx} className="inline-block mr-3 text-white/80">
                            {item.name} {item.quantity}{item.unit}
                          </span>
                        )) : <span>{record.food_items}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="glass-card backdrop-blur-xl bg-white/10 rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
              <h2 className="text-2xl font-semibold mb-6 text-white">营养摄入总览</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <div className="glass-card-inner backdrop-blur-md bg-gradient-to-br from-pink-500/20 to-rose-600/20 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs text-white/70 mb-1">热量</div>
                  <div className="text-2xl font-bold text-pink-300">
                    {Math.round(actual.total_calories)}
                  </div>
                  <div className="text-xs text-white/50">kcal</div>
                </div>
                <div className="glass-card-inner backdrop-blur-md bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs text-white/70 mb-1">蛋白质</div>
                  <div className="text-2xl font-bold text-emerald-300">
                    {Math.round(actual.total_protein_g)}
                  </div>
                  <div className="text-xs text-white/50">g</div>
                </div>
                <div className="glass-card-inner backdrop-blur-md bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs text-white/70 mb-1">脂肪</div>
                  <div className="text-2xl font-bold text-amber-300">
                    {Math.round(actual.total_fat_g)}
                  </div>
                  <div className="text-xs text-white/50">g</div>
                </div>
                <div className="glass-card-inner backdrop-blur-md bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs text-white/70 mb-1">碳水</div>
                  <div className="text-2xl font-bold text-purple-300">
                    {Math.round(actual.total_carbs_g)}
                  </div>
                  <div className="text-xs text-white/50">g</div>
                </div>
                <div className="glass-card-inner backdrop-blur-md bg-gradient-to-br from-rose-500/20 to-red-600/20 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs text-white/70 mb-1">钠</div>
                  <div className="text-2xl font-bold text-rose-300">
                    {Math.round(actual.total_sodium_mg)}
                  </div>
                  <div className="text-xs text-white/50">mg</div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h3 className="font-semibold mb-4 text-white">与每日目标对比</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-white/80">营养素</th>
                        <th className="px-4 py-3 text-right text-white/80">目标值</th>
                        <th className="px-4 py-3 text-right text-white/80">实际摄入</th>
                        <th className="px-4 py-3 text-right text-white/80">完成度</th>
                        <th className="px-4 py-3 text-center text-white/80">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: '热量', actual: actual.total_calories, target: target.daily_calories_target, unit: 'kcal' },
                        { name: '蛋白质', actual: actual.total_protein_g, target: target.daily_protein_target_g, unit: 'g' },
                        { name: '脂肪', actual: actual.total_fat_g, target: target.daily_fat_target_g, unit: 'g' },
                        { name: '碳水', actual: actual.total_carbs_g, target: target.daily_carbs_target_g, unit: 'g' },
                        { name: '钠', actual: actual.total_sodium_mg, target: target.daily_sodium_target_mg, unit: 'mg' },
                      ].map((item) => {
                        const percent = getCompletionPercent(item.actual, item.target)
                        const color = getCompletionBg(percent)
                        const gradient = getCompletionColor(percent)

                        return (
                          <tr key={item.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-4 py-4 text-white/90">{item.name}</td>
                            <td className="px-4 py-4 text-right text-white/70">{item.target} {item.unit}</td>
                            <td className="px-4 py-4 text-right text-white/90">{Math.round(item.actual)} {item.unit}</td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-white/90">{percent}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
                                {percent < 80 ? '偏低' : percent > 120 ? '偏高' : '正常'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                  <span className="text-2xl">🧠</span> AI营养建议
                </h3>
                <div className="space-y-3">
                  {generateAISuggestions().map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="glass-card-inner backdrop-blur-md bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
                    >
                      <p className="text-sm text-white/90">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {todayRecords.length === 0 && (
          <section className="glass-card backdrop-blur-xl bg-white/10 rounded-3xl p-12 text-center border border-white/20 shadow-2xl">
            <p className="text-white/50 text-lg">今日暂无饮食记录</p>
          </section>
        )}
      </div>
    </div>
  )
}
