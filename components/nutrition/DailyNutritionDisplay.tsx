'use client'

import { calculateProgress, getNutritionStatus } from '@/lib/utils/nutritionCalculator'
import type { NutritionTargets, DailyNutrition } from '@/lib/utils/nutritionCalculator'

interface NutritionDisplayProps {
  target: NutritionTargets
  actual: DailyNutrition
}

export default function NutritionDisplay({ target, actual }: NutritionDisplayProps) {
  const calories = calculateProgress(actual.total_calories, target.daily_calories_target)
  const protein = calculateProgress(actual.total_protein_g, target.daily_protein_target_g)
  const fat = calculateProgress(actual.total_fat_g, target.daily_fat_target_g)
  const carbs = calculateProgress(actual.total_carbs_g, target.daily_carbs_target_g)
  const sodium = calculateProgress(actual.total_sodium_mg, target.daily_sodium_target_mg)

  const getStatusColor = (percentage: number) => {
    const status = getNutritionStatus(percentage)
    switch (status) {
      case 'low': return 'bg-yellow-500'
      case 'high': return 'bg-red-500'
      default: return 'bg-green-500'
    }
  }

  const ProgressItem = ({ label, value, target: targetValue, unit, percentage }: {
    label: string
    value: number
    target: number
    unit: string
    percentage: number
  }) => (
    <div className="bg-white p-4 rounded-lg">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium">
          {Math.round(value)}{unit} / {targetValue}{unit}
        </span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getStatusColor(percentage)} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {Math.round(percentage)}%
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProgressItem label="热量" value={calories.value} target={target.daily_calories_target} unit="kcal" percentage={calories.percentage} />
        <ProgressItem label="蛋白质" value={protein.value} target={target.daily_protein_target_g} unit="g" percentage={protein.percentage} />
        <ProgressItem label="脂肪" value={fat.value} target={target.daily_fat_target_g} unit="g" percentage={fat.percentage} />
        <ProgressItem label="碳水" value={carbs.value} target={target.daily_carbs_target_g} unit="g" percentage={carbs.percentage} />
        <ProgressItem label="钠" value={sodium.value} target={target.daily_sodium_target_mg} unit="mg" percentage={sodium.percentage} />
      </div>

      <div className="bg-white p-6 rounded-lg">
        <h3 className="font-semibold mb-4">营养详情表</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3 text-left">营养素</th>
              <th className="px-4 py-3 text-right">目标值</th>
              <th className="px-4 py-3 text-right">实际摄入</th>
              <th className="px-4 py-3 text-right">完成度</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-4 py-3">热量</td>
              <td className="px-4 py-3 text-right">{target.daily_calories_target} kcal</td>
              <td className="px-4 py-3 text-right">{Math.round(actual.total_calories)} kcal</td>
              <td className="px-4 py-3 text-right">{Math.round(calories.percentage)}%</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3">蛋白质</td>
              <td className="px-4 py-3 text-right">{target.daily_protein_target_g} g</td>
              <td className="px-4 py-3 text-right">{Math.round(actual.total_protein_g)} g</td>
              <td className="px-4 py-3 text-right">{Math.round(protein.percentage)}%</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3">脂肪</td>
              <td className="px-4 py-3 text-right">{target.daily_fat_target_g} g</td>
              <td className="px-4 py-3 text-right">{Math.round(actual.total_fat_g)} g</td>
              <td className="px-4 py-3 text-right">{Math.round(fat.percentage)}%</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3">碳水</td>
              <td className="px-4 py-3 text-right">{target.daily_carbs_target_g} g</td>
              <td className="px-4 py-3 text-right">{Math.round(actual.total_carbs_g)} g</td>
              <td className="px-4 py-3 text-right">{Math.round(carbs.percentage)}%</td>
            </tr>
            <tr>
              <td className="px-4 py-3">钠</td>
              <td className="px-4 py-3 text-right">{target.daily_sodium_target_mg} mg</td>
              <td className="px-4 py-3 text-right">{Math.round(actual.total_sodium_mg)} mg</td>
              <td className="px-4 py-3 text-right">{Math.round(sodium.percentage)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
