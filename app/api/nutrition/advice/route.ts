import { NextRequest, NextResponse } from 'next/server'
import { generateNutritionAdvice } from '@/lib/zhipu/nlpParser'

export async function POST(request: NextRequest) {
  try {
    const { target, actual } = await request.json()

    if (!target || !actual) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    const advice = await generateNutritionAdvice(target, actual)

    return NextResponse.json({ advice })
  } catch (error) {
    console.error('Advice generation error:', error)
    return NextResponse.json({ error: '生成建议失败' }, { status: 500 })
  }
}
