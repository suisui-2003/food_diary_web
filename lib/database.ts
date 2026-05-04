import type { NutritionTargets } from '@/lib/utils/nutritionCalculator'

export interface Profile {
  id?: string
  height_cm?: number
  weight_kg?: number
  age?: number
  gender?: string
  activity_level?: string
  goal?: string
  daily_calories_target?: number
  daily_protein_target_g?: number
  daily_fat_target_g?: number
  daily_carbs_target_g?: number
  daily_sodium_target_mg?: number
}

export interface FoodItem {
  id?: string
  name: string
  protein_g: number
  fat_g: number
  calories: number
  sodium_mg: number
  carbs_g: number
  notes?: string
  serving_size_g?: number
}

export interface DietLog {
  id?: string
  date: string
  time: string
  food_items: any
  sodium_mg: number
  fat_g: number
  protein_g: number
  carbs_g: number
  calories: number
}

const PROFILE_STORAGE_KEY = 'user_profile'
const TARGETS_STORAGE_KEY = 'nutrition_targets'
const FOOD_ITEMS_STORAGE_KEY = 'food_items_library'
const DIET_LOGS_STORAGE_KEY = 'diet_records'

function getStoredProfile(): Profile {
  if (typeof window === 'undefined') return {
    height_cm: 175,
    weight_kg: 70,
    age: 25,
    gender: 'male',
    activity_level: 'moderate',
    goal: 'maintain',
  }
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {
      height_cm: 175,
      weight_kg: 70,
      age: 25,
      gender: 'male',
      activity_level: 'moderate',
      goal: 'maintain',
    }
  } catch {
    return {
      height_cm: 175,
      weight_kg: 70,
      age: 25,
      gender: 'male',
      activity_level: 'moderate',
      goal: 'maintain',
    }
  }
}

function saveProfile(profile: Profile) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
  window.dispatchEvent(new Event('food-diary-update'))
}

function getStoredTargets(): NutritionTargets | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(TARGETS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveTargets(targets: NutritionTargets) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(targets))
  window.dispatchEvent(new Event('food-diary-update'))
}

function getStoredFoodItems(): FoodItem[] {
  if (typeof window === 'undefined') return getDefaultFoodItems()
  try {
    const stored = localStorage.getItem(FOOD_ITEMS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : getDefaultFoodItems()
  } catch {
    return getDefaultFoodItems()
  }
}

function getDefaultFoodItems(): FoodItem[] {
  return []
}

function saveFoodItems(items: FoodItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(FOOD_ITEMS_STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('food-diary-update'))
}

function getStoredDietLogs(): DietLog[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(DIET_LOGS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveDietLogs(logs: DietLog[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(DIET_LOGS_STORAGE_KEY, JSON.stringify(logs))
  window.dispatchEvent(new Event('food-diary-update'))
}

export function getProfile(): Profile {
  return getStoredProfile()
}

export function upsertProfile(profile: Profile): boolean {
  saveProfile(profile)
  return true
}

export function getFoodItems(): FoodItem[] {
  return getStoredFoodItems()
}

export function addFoodItem(item: FoodItem): boolean {
  const items = getStoredFoodItems()
  items.push({ ...item, id: Date.now().toString() })
  saveFoodItems(items)
  return true
}

export function updateFoodItem(id: string, item: FoodItem): boolean {
  const items = getStoredFoodItems()
  const index = items.findIndex(i => i.id === id)
  if (index !== -1) {
    items[index] = { ...items[index], ...item }
    saveFoodItems(items)
  }
  return false
}

export function deleteFoodItem(id: string): boolean {
  const items = getStoredFoodItems()
  const filtered = items.filter(i => i.id !== id)
  saveFoodItems(filtered)
  return true
}

export function getDietLogs(): DietLog[] {
  return getStoredDietLogs()
}

export function addDietLog(log: DietLog): boolean {
  const logs = getStoredDietLogs()
  logs.push({ ...log, id: Date.now().toString() })
  saveDietLogs(logs)
  return true
}

export function deleteDietLog(id: string): boolean {
  const logs = getStoredDietLogs()
  const filtered = logs.filter(l => l.id !== id)
  saveDietLogs(filtered)
  return true
}
