import { callZhipuAPI, ZhipuMessage } from './client'

export interface ParsedFoodItem {
  name: string
  quantity: number
  unit: string
}

export async function parseDietInput(input: string): Promise<ParsedFoodItem[]> {
  try {
    const messages: ZhipuMessage[] = [
      {
        role: 'user',
        content: `请解析以下饮食记录，提取每样食物的名称、数量和单位：

"${input}"

返回格式：JSON数组，每个元素包含：
- name: 食物名称（标准化名称，中文）
- quantity: 数量（数字）
- unit: 单位（如：g、个、杯、勺、片等）

注意事项：
1. 识别所有食物项
2. 处理数量描述（如"一根"转换为quantity=1, unit="个"）
3. 处理复合描述（如"两片面包"转换为quantity=2, unit="片"）
4. 处理重量描述（如"180g"转换为quantity=180, unit="g"）
5. 如果没有明确数量，quantity设为1，unit设为"份"

请只返回JSON数组，不要包含任何其他文字。`,
      },
    ]

    const response = await callZhipuAPI(messages)

    if (response.choices && response.choices[0]) {
      const content = response.choices[0].message.content
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }
    return []
  } catch (error) {
    console.error('NLP parsing error:', error)
    return []
  }
}

export async function generateNutritionAdvice(
  target: any,
  actual: any
): Promise<string> {
  try {
    const messages: ZhipuMessage[] = [
      {
        role: 'user',
        content: `作为一位专业的营养师，基于以下营养数据为用户生成科学饮食建议：

用户目标：
- 每日热量目标：${target.daily_calories_target} kcal
- 蛋白质目标：${target.daily_protein_target_g}g
- 脂肪目标：${target.daily_fat_target_g}g
- 碳水目标：${target.daily_carbs_target_g}g
- 钠目标：${target.daily_sodium_target_mg}mg

今日摄入：
- 热量：${actual.total_calories} kcal
- 蛋白质：${actual.total_protein_g}g
- 脂肪：${actual.total_fat_g}g
- 碳水：${actual.total_carbs_g}g
- 钠：${actual.total_sodium_mg}mg

请提供：
1. 营养状况评价（3-4句话）
2. 针对性的饮食调整建议（3-5条）
3. 下次饮食建议（具体食物建议）

要求：
- 使用专业但易懂的语言
- 建议要具体可执行
- 鼓励正面引导`,
      },
    ]

    const response = await callZhipuAPI(messages)

    if (response.choices && response.choices[0]) {
      return response.choices[0].message.content
    }
    return '无法生成建议'
  } catch (error) {
    console.error('Advice generation error:', error)
    return '生成建议时出错'
  }
}
