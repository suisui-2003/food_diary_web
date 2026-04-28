import { anthropic } from './client'

export interface ParsedFoodItem {
  name: string
  quantity: number
  unit: string
}

export async function parseDietInput(input: string): Promise<ParsedFoodItem[]> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
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
      ],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/)
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
