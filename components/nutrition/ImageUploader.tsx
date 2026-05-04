'use client'

import { useState, useRef } from 'react'
import type { FoodItem } from '@/lib/utils/nutritionCalculator'

interface ImageUploaderGlassProps {
  onScanned: (item: FoodItem) => void
}

export default function ImageUploaderGlass({ onScanned }: ImageUploaderGlassProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const processFile = async (file: File) => {
    if (!file) return

    console.log('Processing file:', file.name, 'size:', file.size, 'type:', file.type)

    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过10MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Starting base64 conversion...')
      const base64 = await fileToBase64(file)
      console.log('Base64 conversion complete, length:', base64.length)

      console.log('Calling scan API...')
      const response = await fetch('/api/nutrition/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: file.type,
        }),
      })

      const result = await response.json()
      console.log('API response:', result)

      if (response.ok && !result.error) {
        onScanned({
          name: result.name,
          protein_g: result.protein_g,
          fat_g: result.fat_g,
          calories: result.calories,
          sodium_mg: result.sodium_mg,
          carbs_g: result.carbs_g,
          serving_size_g: 100,
        })
      } else {
        setError(result.error || '未能识别营养成分表，请重试或手动输入')
      }
    } catch (err) {
      console.error('Recognition error:', err)
      setError('识别失败，请检查网络连接后重试')
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    processFile(file)
  }

  return (
    <div className="space-y-4">
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !loading && fileInputRef.current?.click()}
        className={`glass-card-inner backdrop-blur-md rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 border-2 border-dashed ${
          isDragging
            ? 'border-pink-400 bg-white/10 transform scale-105'
            : 'border-white/20 hover:border-pink-400/50 hover:bg-white/5'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />
        <div className="space-y-3">
          <div className="text-5xl filter drop-shadow-lg">
            {loading ? '⏳' : isDragging ? '📥' : '📷'}
          </div>
          <div className="text-lg font-medium text-white">
            {loading ? '识别中...' : isDragging ? '释放图片上传' : '拖放图片到这里'}
          </div>
          <div className="text-sm text-white/60">
            或者 <span className="text-pink-300 hover:text-pink-200 transition-colors">点击选择文件</span>
          </div>
          <div className="text-xs text-white/40">
            支持 JPG、PNG、WEBP 格式，文件大小不超过 10MB
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card-inner backdrop-blur-md bg-rose-500/10 rounded-xl px-4 py-3 border border-rose-500/20">
          <p className="text-rose-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
