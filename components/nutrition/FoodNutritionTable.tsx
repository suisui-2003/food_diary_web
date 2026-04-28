'use client'

import { useState, useEffect } from 'react'
import { type FoodItem } from '@/lib/utils/nutritionCalculator'
import ImageUploader from './ImageUploader'
import { getFoodItems, addFoodItem, updateFoodItem, deleteFoodItem } from '@/lib/database'

export default function FoodNutritionTable() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)

  useEffect(() => {
    const loadData = () => {
      setFoodItems(getFoodItems())
    }

    loadData()

    const handleUpdate = () => {
      loadData()
    }

    window.addEventListener('food-diary-update', handleUpdate)
    return () => window.removeEventListener('food-diary-update', handleUpdate)
  }, [])

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
      <div className="flex justify-between items-center gap-4">
        <h3 className="font-semibold">营养成分库</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowImageUpload(!showImageUpload)
              setShowAddForm(false)
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
          >
            {showImageUpload ? '取消上传' : '📷 图片识别'}
          </button>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm)
              setShowImageUpload(false)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3 text-left">名称</th>
              <th className="px-4 py-3 text-right">蛋白质</th>
              <th className="px-4 py-3 text-right">脂肪</th>
              <th className="px-4 py-3 text-right">热量</th>
              <th className="px-4 py-3 text-right">钠</th>
              <th className="px-4 py-3 text-right">碳水</th>
              <th className="px-4 py-3 text-right">备注</th>
              <th className="px-4 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {foodItems.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3 text-right">{item.protein_g}g</td>
                <td className="px-4 py-3 text-right">{item.fat_g}g</td>
                <td className="px-4 py-3 text-right">{item.calories}kcal</td>
                <td className="px-4 py-3 text-right">{item.sodium_mg}mg</td>
                <td className="px-4 py-3 text-right">{item.carbs_g}g</td>
                <td className="px-4 py-3 text-right">{item.notes || '-'}</td>
                <td className="px-4 py-3 text-center space-x-2">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => item.id && handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
      <h4 className="font-semibold">{item ? '编辑食物' : '添加食物'}</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <input
          placeholder="食物名称"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="col-span-2 px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="number"
          placeholder="蛋白质"
          step="0.1"
          value={formData.protein_g || ''}
          onChange={(e) => setFormData({ ...formData, protein_g: Number(e.target.value) })}
          className="px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="number"
          placeholder="脂肪"
          step="0.1"
          value={formData.fat_g || ''}
          onChange={(e) => setFormData({ ...formData, fat_g: Number(e.target.value) })}
          className="px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="number"
          placeholder="热量"
          value={formData.calories || ''}
          onChange={(e) => setFormData({ ...formData, calories: Number(e.target.value) })}
          className="px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="number"
          placeholder="钠"
          value={formData.sodium_mg || ''}
          onChange={(e) => setFormData({ ...formData, sodium_mg: Number(e.target.value) })}
          className="px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="number"
          placeholder="碳水"
          step="0.1"
          value={formData.carbs_g || ''}
          onChange={(e) => setFormData({ ...formData, carbs_g: Number(e.target.value) })}
          className="px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="number"
          placeholder="参考份量"
          value={formData.serving_size_g || 100}
          onChange={(e) => setFormData({ ...formData, serving_size_g: Number(e.target.value) })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          placeholder="备注"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="col-span-2 px-3 py-2 border rounded-lg"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
        >
          取消
        </button>
      </div>
    </form>
  )
}
