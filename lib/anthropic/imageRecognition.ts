import { anthropic } from './client'
import { FoodItem } from '../utils/nutritionCalculator'

export async function scanNutritionLabel(imageBase64: string, mediaType: string = 'image/jpeg'): Promise<FoodItem | null> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `请识别这张营养成分表，提取以下信息：
1. 食品名称
2. 蛋白质含量 (每100g)
3. 脂肪含量 (每100g)
4. 热量 (每100g)
5. 钠含量 (每100g)
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

如果无法识别某些值，请使用0或null。`,
            },
          ],
        },
      ],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0])
        return {
          name: data.name || '未知食物',
          protein_g: Number(data.protein_g) || 0,
          fat_g: Number(data.fat_g) || 0,
          calories: Number(data.calories) || 0,
          sodium_mg: Number(data.sodium_mg) || 0,
          carbs_g: Number(data.carbs_g) || 0,
          serving_size_g: 100,
        }
      }
    }
    return null
  } catch (error) {
    console.error('Image recognition error:', error)
    return null
  }
}
