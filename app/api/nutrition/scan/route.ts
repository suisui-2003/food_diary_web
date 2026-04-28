import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mediaType } = await request.json()

    if (!imageBase64) {
      return NextResponse.json({ error: '请上传图片' }, { status: 400 })
    }

    const apiKey = process.env.ZHIPU_API_KEY
    if (!apiKey) {
      console.error('ZHIPU_API_KEY is not configured')
      return NextResponse.json({ error: 'API 密钥未配置，请检查 .env.local 文件' }, { status: 500 })
    }

    const imageUrl = `data:${mediaType};base64,${imageBase64}`

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4v',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
              {
                type: 'text',
                text: `请识别这张营养成分表，提取以下信息：
1. 食品名称
2. 蛋白质含量 (每100g)
3. 脂肪含量 (每100g)
4. 热量 (每100g, 单位kcal)
5. 钠含量 (每100g, 单位mg)
6. 碳水化合物含量 (每100g)

请以严格的JSON格式返回，不要包含任何其他文字：
{
  "name": "食品名称",
  "protein_g": 数值,
  "fat_g": 数值,
  "calories": 数值,
  "sodium_mg": 数值,
  "carbs_g": 数值,
  "notes": "备注信息（如有）"
}

如果无法识别某些值，请使用0。`,
              },
            ],
          },
        ],
        stream: false,
      }),
    })

    const responseText = await response.text()
    console.log('API Response status:', response.status)
    console.log('API Response:', responseText)

    if (!response.ok) {
      return NextResponse.json({ error: `API 错误: ${response.status} - ${responseText}` }, { status: response.status })
    }

    const data = JSON.parse(responseText)

    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const nutritionData = JSON.parse(jsonMatch[0])
          return NextResponse.json({
            name: nutritionData.name || '未知食物',
            protein_g: Number(nutritionData.protein_g) || 0,
            fat_g: Number(nutritionData.fat_g) || 0,
            calories: Number(nutritionData.calories) || 0,
            sodium_mg: Number(nutritionData.sodium_mg) || 0,
            carbs_g: Number(nutritionData.carbs_g) || 0,
          })
        } catch (parseError) {
          console.error('JSON parse error:', parseError)
          return NextResponse.json({ error: '无法解析识别结果' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ error: '未能识别营养成分表' }, { status: 500 })
  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json({ error: '识别失败' }, { status: 500 })
  }
}
