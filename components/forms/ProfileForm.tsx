'use client'

import { useState, useEffect } from 'react'
import { calculateNutritionTargets, type Profile, type NutritionTargets } from '@/lib/utils/nutritionCalculator'
import { getProfile, upsertProfile } from '@/lib/database'
import { useAuth } from '@/components/auth/AuthProvider'

export default function ProfileFormGlass() {
  const { isReady } = useAuth()
  const [profile, setProfile] = useState<Profile>({
    height_cm: 175,
    weight_kg: 70,
    age: 25,
    gender: 'male',
    activity_level: 'moderate',
    goal: 'maintain',
  })
  const [targets, setTargets] = useState<NutritionTargets | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!isReady) {
      console.log('ProfileForm: Waiting for auth to be ready')
      return
    }

    console.log('ProfileForm: Loading data, refreshKey:', refreshKey)
    const data = getProfile()
    if (data) {
      setProfile({
        height_cm: data.height_cm || 175,
        weight_kg: Number(data.weight_kg) || 70,
        age: data.age || 25,
        gender: (data.gender as 'male' | 'female') || 'male',
        activity_level: (data.activity_level as any) || 'moderate',
        goal: (data.goal as any) || 'maintain',
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

    const handleUpdate = () => {
      console.log('ProfileForm: food-diary-update received')
      setRefreshKey(prev => prev + 1)
    }

    window.addEventListener('food-diary-update', handleUpdate)

    return () => {
      window.removeEventListener('food-diary-update', handleUpdate)
    }
  }, [refreshKey, isReady])

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
    console.log('ProfileForm: Saving profile on blur', profile)
    await upsertProfile(profile)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-white/80">身高 (cm)</label>
          <input
            type="number"
            value={profile.height_cm || ''}
            onChange={(e) => setProfile({ ...profile, height_cm: Number(e.target.value) })}
            onBlur={handleFieldBlur}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all backdrop-blur-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-white/80">体重 (kg)</label>
          <input
            type="number"
            value={profile.weight_kg || ''}
            onChange={(e) => setProfile({ ...profile, weight_kg: Number(e.target.value) })}
            onBlur={handleFieldBlur}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all backdrop-blur-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-white/80">年龄</label>
          <input
            type="number"
            value={profile.age || ''}
            onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
            onBlur={handleFieldBlur}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all backdrop-blur-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-white/80">性别</label>
          <select
            value={profile.gender}
            onChange={(e) => setProfile({ ...profile, gender: e.target.value as 'male' | 'female' })}
            onBlur={handleFieldBlur}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all backdrop-blur-sm"
          >
            <option value="male" className="bg-slate-800">男</option>
            <option value="female" className="bg-slate-800">女</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-white/80">活动水平</label>
          <select
            value={profile.activity_level}
            onChange={(e) => setProfile({ ...profile, activity_level: e.target.value as any })}
            onBlur={handleFieldBlur}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all backdrop-blur-sm"
          >
            <option value="sedentary" className="bg-slate-800">久坐不动</option>
            <option value="light" className="bg-slate-800">轻度活动</option>
            <option value="moderate" className="bg-slate-800">中度活动</option>
            <option value="active" className="bg-slate-800">高度活动</option>
            <option value="very_active" className="bg-slate-800">非常活跃</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-white/80">目标</label>
          <select
            value={profile.goal}
            onChange={(e) => setProfile({ ...profile, goal: e.target.value as any })}
            onBlur={handleFieldBlur}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all backdrop-blur-sm"
          >
            <option value="lose_weight" className="bg-slate-800">减重</option>
            <option value="maintain" className="bg-slate-800">维持体重</option>
            <option value="gain_muscle" className="bg-slate-800">增肌</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleCalculate}
        className="w-full py-4 bg-gradient-to-r from-pink-500 to-blue-500 text-white font-semibold rounded-2xl hover:from-pink-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-pink-500/25 hover:shadow-2xl transform hover:-translate-y-0.5"
      >
        计算每日营养目标
      </button>

      {targets && (
        <div className="glass-card-inner backdrop-blur-md bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-white">每日营养目标</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="backdrop-blur-sm bg-gradient-to-br from-pink-500/20 to-rose-600/20 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-white/70 mb-1">热量</div>
              <div className="text-xl font-bold text-pink-300">{targets.daily_calories_target}</div>
              <div className="text-xs text-white/50">kcal</div>
            </div>
            <div className="backdrop-blur-sm bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-white/70 mb-1">蛋白质</div>
              <div className="text-xl font-bold text-emerald-300">{targets.daily_protein_target_g}</div>
              <div className="text-xs text-white/50">g</div>
            </div>
            <div className="backdrop-blur-sm bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-white/70 mb-1">脂肪</div>
              <div className="text-xl font-bold text-amber-300">{targets.daily_fat_target_g}</div>
              <div className="text-xs text-white/50">g</div>
            </div>
            <div className="backdrop-blur-sm bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-white/70 mb-1">碳水</div>
              <div className="text-xl font-bold text-purple-300">{targets.daily_carbs_target_g}</div>
              <div className="text-xs text-white/50">g</div>
            </div>
            <div className="backdrop-blur-sm bg-gradient-to-br from-rose-500/20 to-red-600/20 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-white/70 mb-1">钠</div>
              <div className="text-xl font-bold text-rose-300">{targets.daily_sodium_target_mg}</div>
              <div className="text-xs text-white/50">mg</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
