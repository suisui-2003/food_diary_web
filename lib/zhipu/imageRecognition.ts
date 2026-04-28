import { callZhipuAPI, ZhipuMessage } from './client'
import { FoodItem } from '../utils/nutritionCalculator'

export async function scanNutritionLabel(imageBase64: string, mediaType: string = 'image/jpeg'): Promise<FoodItem | null> {
  try {
    const imageUrl = `data:${mediaType};base64,${imageBase64}`

    const messages: ZhipuMessage[] = [
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
    ]

    const response = await callZhipuAPI(messages, 'glm-4v')

    if (response.choices && response.choices[0]) {
      const content = response.choices[0].message.content
      console.log('Model response:', content)

      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
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
        } catch (parseError) {
          console.error('JSON parse error:', parseError)
          return null
        }
      }
    }
    return null
  } catch (error) {
    console.error('Image recognition error:', error)
    return null
  }
}
