'use client'

import { useState, useEffect } from 'react'
import { calculateNutritionTargets, type Profile, type NutritionTargets } from '@/lib/utils/nutritionCalculator'
import { getProfile, upsertProfile } from '@/lib/database'

export default function ProfileForm() {
  const [profile, setProfile] = useState<Profile>({
    height_cm: 175,
    weight_kg: 70,
    age: 25,
    gender: 'male',
    activity_level: 'moderate',
    goal: 'maintain',
  })
  const [targets, setTargets] = useState<NutritionTargets | null>(null)

  useEffect(() => {
    const loadData = () => {
      const data = getProfile()
      if (data) {
        setProfile({
          height_cm: data.height_cm || 175,
          weight_kg: Number(data.weight_kg) || 70,
          age: data.age || 25,
          gender: data.gender || 'male',
          activity_level: data.activity_level || 'moderate',
          goal: data.goal || 'maintain',
        })

        if (data.daily_calories_target) {
          setTargets({
            daily_calories_target: data.daily_calories_target,
            daily_protein_target_g: Number(data.daily_protein_target_g) || 120,
            daily_fat_target_g: Number(data.daily_fat_target_g) || 67,
            daily_carbs_target_g: Number(data.daily_carbs_target_g) || 225,
            daily_sodium_target_mg: Number(data.daily_sodium_target_mg) || 2300,
          })
        }
      }
    }

    loadData()

    const handleUpdate = () => {
      loadData()
    }

    window.addEventListener('food-diary-update', handleUpdate)

    return () => {
      window.removeEventListener('food-diary-update', handleUpdate)
    }
  }, [])

  const handleCalculate = async () => {
    const result = calculateNutritionTargets(profile)
    setTargets(result)
    await upsertProfile({
      ...profile,
      daily_calories_target: result.daily_calories_target,
      daily_protein_target_g: result.daily_protein_target_g,
      daily_fat_target_g: result.daily_fat_target_g,
      daily_carbs_target_g: result.daily_carbs_target_g,
      daily_sodium_target_mg: result.daily_sodium_target_mg,
    })
  }

  const handleFieldBlur = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_profile', JSON.stringify(profile))
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">身高 (cm)</label>
          <input
            type="number"
            value={profile.height_cm || ''}
            onChange={(e) => setProfile({ ...profile, height_cm: Number(e.target.value) })}
            onBlur={handleFieldBlur}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">体重</label>
          <input
            type="number"
            value={profile.weight_kg || ''}
            onChange={(e) => setProfile({ ...profile, weight_kg: Number(e.target.value) })}
            onBlur={handleFieldBlur}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">年龄</label>
          <input
            type="number"
            value={profile.age || ''}
            onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
            onBlur={handleFieldBlur}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">性别</label>
          <select
            value={profile.gender}
            onChange={(e) => setProfile({ ...profile, gender: e.target.value as 'male' | 'female' })}
            onBlur={handleFieldBlur}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">活动水平</label>
          <select
            value={profile.activity_level}
            onChange={(e) => setProfile({ ...profile, activity_level: e.target.value as any })}
            onBlur={handleFieldBlur}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="sedentary">久坐不动</option>
            <option value="light">轻度活动</option>
            <option value="moderate">中度活动</option>
            <option value="active">高度活动</option>
            <option value="very_active">非常活跃</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">目标</label>
          <select
            value={profile.goal}
            onChange={(e) => setProfile({ ...profile, goal: e.target.value as any })}
            onBlur={handleFieldBlur}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="lose_weight">减重</option>
            <option value="maintain">维持体重</option>
            <option value="gain_muscle">增肌</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleCalculate}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
      >
        计算每日营养目标
      </button>

      {targets && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">每日营养目标</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="text-sm text-gray-600">热量</div>
              <div className="text-2xl font-bold text-blue-600">{targets.daily_calories_target} kcal</div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-sm text-gray-600">蛋白质</div>
              <div className="text-2xl font-bold text-green-600">{targets.daily_protein_target_g} g</div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-sm text-gray-600">脂肪</div>
              <div className="text-2xl font-bold text-yellow-600">{targets.daily_fat_target_g} g</div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-sm text-gray-600">碳水</div>
              <div className="text-2xl font-bold text-purple-600">{targets.daily_carbs_target_g} g</div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-sm text-gray-600">钠</div>
              <div className="text-2xl font-bold text-red-600">{targets.daily_sodium_target_mg} mg</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
