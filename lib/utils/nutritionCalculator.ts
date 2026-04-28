export interface Profile {
  id?: string
  height_cm?: number
  weight_kg?: number
  age?: number
  gender?: 'male' | 'female'
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal?: 'lose_weight' | 'maintain' | 'gain_muscle'
}

export interface NutritionTargets {
  daily_calories_target: number
  daily_protein_target_g: number
  daily_fat_target_g: number
  daily_carbs_target_g: number
  daily_sodium_target_mg: number
}

export interface FoodItem {
  id?: string
  name: string
  protein_g: number
  fat_g: number
  calories: number
  sodium_mg: number
  carbs_g: number
  quantity?: number
  serving_size_g?: number
}

export interface DailyNutrition {
  total_calories: number
  total_protein_g: number
  total_fat_g: number
  total_carbs_g: number
  total_sodium_mg: number
}

const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const macroRatios = {
  lose_weight: { protein: 0.35, fat: 0.25, carbs: 0.40 },
  maintain: { protein: 0.25, fat: 0.30, carbs: 0.45 },
  gain_muscle: { protein: 0.30, fat: 0.25, carbs: 0.45 },
}

export function calculateBMR(profile: Profile): number {
  if (!profile.weight_kg || !profile.height_cm || !profile.age) {
    return 2000
  }

  const weight = profile.weight_kg
  const height = profile.height_cm
  const age = profile.age
  const gender = profile.gender || 'male'

  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  }
  return 10 * weight + 6.25 * height - 5 * age - 161
}

export function calculateTDEE(profile: Profile): number {
  const bmr = calculateBMR(profile)
  const activityMultiplier = activityMultipliers[profile.activity_level || 'moderate']
  return bmr * activityMultiplier
}

export function calculateNutritionTargets(profile: Profile): NutritionTargets {
  let tdee = calculateTDEE(profile)

  switch (profile.goal) {
    case 'lose_weight':
      tdee *= 0.85
      break
    case 'gain_muscle':
      tdee *= 1.1
      break
    default:
      break
  }

  const ratios = macroRatios[profile.goal || 'maintain']

  return {
    daily_calories_target: Math.round(tdee),
    daily_protein_target_g: Math.round((tdee * ratios.protein) / 4),
    daily_fat_target_g: Math.round((tdee * ratios.fat) / 9),
    daily_carbs_target_g: Math.round((tdee * ratios.carbs) / 4),
    daily_sodium_target_mg: 2300,
  }
}

export function calculateDailyNutrition(foodItems: FoodItem[]): DailyNutrition {
  return foodItems.reduce(
    (totals, item) => {
      const quantity = item.quantity || 1
      const servingSize = item.serving_size_g || 100
      const ratio = quantity / servingSize

      return {
        total_calories: totals.total_calories + item.calories * ratio,
        total_protein_g: totals.total_protein_g + item.protein_g * ratio,
        total_fat_g: totals.total_fat_g + item.fat_g * ratio,
        total_carbs_g: totals.total_carbs_g + item.carbs_g * ratio,
        total_sodium_mg: totals.total_sodium_mg + item.sodium_mg * ratio,
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

export function calculateProgress(
  actual: number,
  target: number
): { value: number; percentage: number } {
  const percentage = (actual / target) * 100
  return {
    value: actual,
    percentage: Math.round(percentage * 10) / 10,
  }
}

export function getNutritionStatus(percentage: number): 'low' | 'normal' | 'high' {
  if (percentage < 80) return 'low'
  if (percentage > 120) return 'high'
  return 'normal'
}
