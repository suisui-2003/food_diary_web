'use client'

import { useState } from 'react'

export default function DietLogFormGlass() {
  const [input, setInput] = useState('')

  const exampleInputs = [
    '吃了一根香蕉一包面包和180g牛肉',
    '吃了10几个小番茄和180g鸡胸肉',
    '煮了一个红薯和一勺蛋白粉两勺奶粉',
  ]

  return (
    <div className="space-y-6">
      <div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="描述吃的食物，例如：吃了180g鸡胸肉、两个鸡蛋..."
          rows={4}
          className="w-full px-5 py-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-transparent transition-all resize-none backdrop-blur-sm"
        />
      </div>

      <div>
        <p className="text-sm text-white/60 mb-3">参考示例：</p>
        <div className="grid gap-3">
          {exampleInputs.map((example, index) => (
            <button
              key={index}
              onClick={() => setInput(example)}
              className="w-full text-left px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 text-sm text-white/80 hover:text-white backdrop-blur-sm"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
