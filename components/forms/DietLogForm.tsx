'use client'

import { useState } from 'react'

export default function DietLogForm() {
  const [input, setInput] = useState('')

  const exampleInputs = [
    '吃了一根香蕉一包面包和180g牛肉',
    '吃了10几个小番茄和180g鸡胸肉',
    '煮了一个红薯和一勺蛋白粉两勺奶粉',
  ]

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">饮食记录</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="描述吃的食物，例如：吃了180g鸡胸肉、两个鸡蛋..."
          rows={4}
          className="w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-2">参考示例：</p>
        <div className="space-y-2">
          {exampleInputs.map((example, index) => (
            <button
              key={index}
              onClick={() => setInput(example)}
              className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-sm"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
