'use client'

import { useState, useEffect } from 'react'
import { type FoodItem } from '@/lib/utils/nutritionCalculator'
import ImageUploader from './ImageUploader'
import { getFoodItems, addFoodItem, updateFoodItem, deleteFoodItem } from '@/lib/database'
import { useAuth } from '@/components/auth/AuthProvider'

export default function FoodNutritionTable() {
  const { isReady } = useAuth()
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const loadFoodItems = () => {
    console.log('FoodNutritionTable: Loading food items')
    setFoodItems(getFoodItems())
  }

  useEffect(() => {
    if (!isReady) {
      console.log('FoodNutritionTable: Waiting for auth to be ready')
      return
    }

    console.log('FoodNutritionTable: Loading data')
    loadFoodItems()

    const handleUpdate = () => {
      console.log('FoodNutritionTable: food-diary-update received')
      loadFoodItems()
    }

    window.addEventListener('food-diary-update', handleUpdate)
    return () => window.removeEventListener('food-diary-update', handleUpdate)
  }, [isReady])

  const handleAdd = (item: FoodItem) => {
    addFoodItem(item)
    setFoodItems(getFoodItems())
    setShowAddForm(false)
  }

  const handleUpdate = (item: FoodItem) => {
    if (item.id) {
      updateFoodItem(item.id, item)
      setFoodItems(getFoodItems())
      setEditingItem(null)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个食物吗？')) {
      deleteFoodItem(id)
      setFoodItems(getFoodItems())
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h3 className="font-semibold text-white">营养成分库</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowImageUpload(!showImageUpload)
              setShowAddForm(false)
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              showImageUpload
                ? 'bg-white/10 border border-white/20 text-white/70'
                : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-lg hover:shadow-emerald-500/25 transform hover:-translate-y-0.5'
            }`}
          >
            {showImageUpload ? '取消上传' : '📷 图片识别'}
          </button>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm)
              setShowImageUpload(false)
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              showAddForm
                ? 'bg-white/10 border border-white/20 text-white/70'
                : 'bg-gradient-to-r from-pink-500 to-blue-500 text-white hover:shadow-lg hover:shadow-pink-500/25 transform hover:-translate-y-0.5'
            }`}
          >
            {showAddForm ? '取消' : '添加食物'}
          </button>
        </div>
      </div>

      {showImageUpload && (
        <ImageUploader onScanned={(item) => {
          addFoodItem(item)
          setFoodItems(getFoodItems())
          setShowImageUpload(false)
        }} />
      )}

      {showAddForm && (
        <FoodItemForm
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <div className="glass-card-inner backdrop-blur-md bg-white/5 rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-white/80 font-medium">名称</th>
                <th className="px-4 py-3 text-right text-white/80 font-medium">蛋白质</th>
                <th className="px-4 py-3 text-right text-white/80 font-medium">脂肪</th>
                <th className="px-4 py-3 text-right text-white/80 font-medium">热量</th>
                <th className="px-4 py-3 text-right text-white/80 font-medium">钠</th>
                <th className="px-4 py-3 text-right text-white/80 font-medium">碳水</th>
                <th className="px-4 py-3 text-right text-white/80 font-medium">备注</th>
                <th className="px-4 py-3 text-center text-white/80 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {foodItems?.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white/90">{item.name}</td>
                  <td className="px-4 py-3 text-right text-white/70">{item.protein_g}g</td>
                  <td className="px-4 py-3 text-right text-white/70">{item.fat_g}g</td>
                  <td className="px-4 py-3 text-right text-white/70">{item.calories}kcal</td>
                  <td className="px-4 py-3 text-right text-white/70">{item.sodium_mg}mg</td>
                  <td className="px-4 py-3 text-right text-white/70">{item.carbs_g}g</td>
                  <td className="px-4 py-3 text-right text-white/70">{item.notes || '-'}</td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="text-pink-300 hover:text-pink-200 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => item.id && handleDelete(item.id)}
                      className="text-rose-400 hover:text-rose-300 transition-colors"
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

      {editingItem && (
        <FoodItemForm
          item={editingItem}
          onSave={handleUpdate}
          onCancel={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}

interface FoodItemFormProps {
  item?: FoodItem
  onSave: (item: FoodItem) => void
  onCancel: () => void
}

function FoodItemForm({ item, onSave, onCancel }: FoodItemFormProps) {
  const [formData, setFormData] = useState<FoodItem>(
    item || {
      name: '',
      protein_g: 0,
      fat_g: 0,
      calories: 0,
      sodium_mg: 0,
      carbs_g: 0,
      serving_size_g: 100,
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card-inner backdrop-blur-md bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
      <h4 className="font-semibold text-white">{item ? '编辑食物' : '添加食物'}</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <input
          placeholder="食物名称"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="col-span-2 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all backdrop-blur-sm"
          required
        />
        <input
          type="number"
          placeholder="蛋白质"
          step="0.1"
          value={formData.protein_g || ''}
          onChange={(e) => setFormData({ ...formData, protein_g: Number(e.target.value) })}
          className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all backdrop-blur-sm"
          required
        />
        <input
          type="number"
          placeholder="脂肪"
          step="0.1"
          value={formData.fat_g || ''}
          onChange={(e) => setFormData({ ...formData, fat_g: Number(e.target.value) })}
          className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all backdrop-blur-sm"
          required
        />
        <input
          type="number"
          placeholder="热量"
          value={formData.calories || ''}
          onChange={(e) => setFormData({ ...formData, calories: Number(e.target.value) })}
          className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all backdrop-blur-sm"
          required
        />
        <input
          type="number"
          placeholder="钠"
          value={formData.sodium_mg || ''}
          onChange={(e) => setFormData({ ...formData, sodium_mg: Number(e.target.value) })}
          className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all backdrop-blur-sm"
          required
        />
        <input
          type="number"
          placeholder="碳水"
          step="0.1"
          value={formData.carbs_g || ''}
          onChange={(e) => setFormData({ ...formData, carbs_g: Number(e.target.value) })}
          className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all backdrop-blur-sm"
          required
        />
        <input
          type="number"
          placeholder="参考份量"
          value={formData.serving_size_g || 100}
          onChange={(e) => setFormData({ ...formData, serving_size_g: Number(e.target.value) })}
          className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all backdrop-blur-sm"
        />
        <input
          placeholder="备注"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="col-span-2 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all backdrop-blur-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-6 py-2 bg-gradient-to-r from-pink-500 to-blue-500 text-white font-medium rounded-xl hover:from-pink-600 hover:to-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/25 transform hover:-translate-y-0.5"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-white/10 border border-white/20 text-white/70 font-medium rounded-xl hover:bg-white/15 transition-all duration-300"
        >
          取消
        </button>
      </div>
    </form>
  )
}
