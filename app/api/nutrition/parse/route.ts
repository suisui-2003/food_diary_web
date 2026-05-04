import { NextRequest, NextResponse } from 'next/server'

interface FoodItem {
  name: string
  quantity: number
  unit: string
}

interface LibraryFoodItem {
  name: string
  protein_g: number
  fat_g: number
  calories: number
  sodium_mg: number
  carbs_g: number
  notes?: string
  serving_size_g?: number
}

interface CalculatedItem extends FoodItem {
  protein_g: number
  fat_g: number
  calories: number
  sodium_mg: number
  carbs_g: number
}

interface DailyNutrition {
  total_calories: number
  total_protein_g: number
  total_fat_g: number
  total_carbs_g: number
  total_sodium_mg: number
}

// 默认营养成分库（用于兜底）
// 所有营养值均为每100g的含量
const DEFAULT_FOOD_LIBRARY: LibraryFoodItem[] = [
  { name: '鸡蛋', protein_g: 13, fat_g: 10, calories: 155, sodium_mg: 125, carbs_g: 1.1, notes: '个50g', serving_size_g: 100 },
  { name: '牛奶', protein_g: 3.2, fat_g: 3.6, calories: 65, sodium_mg: 50, carbs_g: 4.8, notes: '杯250ml', serving_size_g: 100 },
  { name: '米饭', protein_g: 2.6, fat_g: 0.3, calories: 130, sodium_mg: 2.5, carbs_g: 28, notes: '碗150g', serving_size_g: 100 },
  { name: '全麦面包', protein_g: 10.9, fat_g: 3.3, calories: 250, sodium_mg: 400, carbs_g: 50, notes: '一袋45g', serving_size_g: 100 },
  { name: '鸡胸肉', protein_g: 31, fat_g: 3.6, calories: 165, sodium_mg: 74, carbs_g: 0, notes: '一袋100g', serving_size_g: 100 },
  { name: '小鸡胸肉', protein_g: 31, fat_g: 3.6, calories: 165, sodium_mg: 74, carbs_g: 0, notes: '一袋100g', serving_size_g: 100 },
  { name: '大鸡胸肉', protein_g: 31, fat_g: 3.6, calories: 165, sodium_mg: 74, carbs_g: 0, notes: '一袋100g', serving_size_g: 100 },
  { name: '牛肉', protein_g: 26, fat_g: 15, calories: 250, sodium_mg: 60, carbs_g: 0, notes: '一袋100g', serving_size_g: 100 },
  { name: '鱼肉', protein_g: 20, fat_g: 5, calories: 120, sodium_mg: 50, carbs_g: 0, serving_size_g: 100 },
  { name: '猪肉', protein_g: 15, fat_g: 20, calories: 250, sodium_mg: 60, carbs_g: 0, serving_size_g: 100 },
  { name: '蔬菜', protein_g: 1, fat_g: 0.2, calories: 20, sodium_mg: 5, carbs_g: 4, serving_size_g: 100 },
  { name: '生菜', protein_g: 1.4, fat_g: 0.2, calories: 15, sodium_mg: 5, carbs_g: 2.9, notes: '颗约200g', serving_size_g: 100 },
  { name: '菠菜', protein_g: 2.9, fat_g: 0.4, calories: 23, sodium_mg: 70, carbs_g: 3.6, serving_size_g: 100 },
  { name: '黄瓜', protein_g: 0.8, fat_g: 0.1, calories: 16, sodium_mg: 5, carbs_g: 3.6, serving_size_g: 100 },
  { name: '胡萝卜', protein_g: 0.9, fat_g: 0.2, calories: 41, sodium_mg: 69, carbs_g: 9.6, serving_size_g: 100 },
  { name: '西兰花', protein_g: 2.8, fat_g: 0.4, calories: 34, sodium_mg: 33, carbs_g: 7, serving_size_g: 100 },
  { name: '白菜', protein_g: 1.5, fat_g: 0.1, calories: 17, sodium_mg: 65, carbs_g: 3.2, serving_size_g: 100 },
  { name: '包菜', protein_g: 1.3, fat_g: 0.3, calories: 25, sodium_mg: 18, carbs_g: 5.2, serving_size_g: 100 },
  { name: '香蕉', protein_g: 1.1, fat_g: 0.3, calories: 89, sodium_mg: 1, carbs_g: 22.8, serving_size_g: 100 },
  { name: '苹果', protein_g: 0.3, fat_g: 0.2, calories: 52, sodium_mg: 1, carbs_g: 14, serving_size_g: 100 },
  { name: '红薯', protein_g: 1.6, fat_g: 0.1, calories: 86, sodium_mg: 5, carbs_g: 20.1, serving_size_g: 100 },
  { name: '水果玉米', protein_g: 3.3, fat_g: 1.5, calories: 86, sodium_mg: 3, carbs_g: 19, serving_size_g: 100 },
  { name: '胡柚', protein_g: 0.8, fat_g: 0.2, calories: 38, sodium_mg: 1, carbs_g: 9.6, serving_size_g: 100 },
  { name: '小番茄', protein_g: 0.9, fat_g: 0.2, calories: 18, sodium_mg: 5, carbs_g: 3.9, notes: '颗约10g', serving_size_g: 100 },
  { name: '番茄', protein_g: 0.9, fat_g: 0.2, calories: 18, sodium_mg: 5, carbs_g: 3.9, notes: '个约100g', serving_size_g: 100 },
  { name: '花生酱', protein_g: 25, fat_g: 50, calories: 588, sodium_mg: 400, carbs_g: 20, notes: '一勺15g', serving_size_g: 100 },
  { name: '蛋白粉', protein_g: 80, fat_g: 0, calories: 320, sodium_mg: 50, carbs_g: 0, notes: '一勺30g', serving_size_g: 100 },
  { name: '奶粉', protein_g: 24, fat_g: 28, calories: 498, sodium_mg: 500, carbs_g: 38, notes: '一勺10g', serving_size_g: 100 },
  { name: '生抽', protein_g: 4.5, fat_g: 0, calories: 10, sodium_mg: 5500, carbs_g: 0, notes: '一勺10ml', serving_size_g: 100 },
]

// 科学估算值（每100g）
const ESTIMATED_NUTRITION = {
  protein_g: 8,
  fat_g: 10,
  calories: 120,
  sodium_mg: 50,
  carbs_g: 15,
}

// 模糊匹配食物名称
function findFoodInLibrary(foodName: string, library: LibraryFoodItem[]): LibraryFoodItem | null {
  const normalizedFoodName = foodName.trim().toLowerCase()

  // 精确匹配
  for (const item of library) {
    if (item.name.trim().toLowerCase() === normalizedFoodName) {
      return item
    }
  }

  // 模糊匹配（优先匹配更精确的）
  // 先尝试：输入包含库中名称（如"小番茄"包含"番茄"）
  let bestMatch: LibraryFoodItem | null = null
  let bestScore = 0

  for (const item of library) {
    const normalizedItemName = item.name.trim().toLowerCase()

    // 计算匹配分数
    let score = 0
    if (normalizedFoodName === normalizedItemName) {
      score = 100
    } else if (normalizedFoodName === normalizedItemName) {
      score = 90
    } else if (normalizedFoodName.includes(normalizedItemName)) {
      // 输入名称包含库中名称（如"小番茄"包含"番茄"）
      // 这种情况下可能不太精确，给较低分数
      score = 50
    } else if (normalizedItemName.includes(normalizedFoodName)) {
      // 库中名称包含输入名称（如"番茄"包含"小番茄"不太可能，但如果输入更短）
      score = 60
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = item
    }
  }

  // 只有当分数足够高时才返回匹配
  return bestScore >= 50 ? bestMatch : null
}

// 从备注中提取克数转换
function parseGramsFromNotes(notes?: string): number | null {
  if (!notes) return null

  // 匹配 "一袋45g"、"每袋45g"、"袋45g"、"颗约200g"、"个约100g" 等格式
  const patterns = [
    /(?:一|每)?(?:袋|个|只|根|碗|杯|勺|颗)(?:约|约为|是|)[:，:,\s]*(\d+)g/i,
    /(?:一|每)?(?:袋|个|只|根|碗|杯|勺|颗)[:，:,\s]*(\d+)g/i,
    /(\d+)g(?:\/(?:袋|个|只|根|碗|杯|勺|颗))/i,
  ]

  for (const pattern of patterns) {
    const match = notes.match(pattern)
    if (match) {
      return parseInt(match[1], 10)
    }
  }

  return null
}

// 计算单个食物的营养成分
function calculateItemNutrition(
  item: FoodItem,
  library: LibraryFoodItem[]
): CalculatedItem {
  const food = findFoodInLibrary(item.name, library)

  if (food) {
    let gramQuantity = item.quantity

    // 如果单位不是 'g'，尝试从备注中获取克数
    if (item.unit !== 'g') {
      const gramsPerUnit = parseGramsFromNotes(food.notes)
      if (gramsPerUnit) {
        gramQuantity = item.quantity * gramsPerUnit
      } else {
        // 如果没有备注，使用默认的serving_size_g
        const servingSize = food.serving_size_g || 100
        gramQuantity = item.quantity * servingSize
      }
    }

    // 根据比例计算营养
    const servingSize = food.serving_size_g || 100
    const ratio = gramQuantity / servingSize

    return {
      ...item,
      protein_g: Math.round(food.protein_g * ratio * 100) / 100,
      fat_g: Math.round(food.fat_g * ratio * 100) / 100,
      calories: Math.round(food.calories * ratio * 100) / 100,
      sodium_mg: Math.round(food.sodium_mg * ratio * 100) / 100,
      carbs_g: Math.round(food.carbs_g * ratio * 100) / 100,
    }
  }

  // 使用科学估算值
  let gramQuantity = item.quantity

  // 根据单位估算克数
  const gramEstimates: { [key: string]: number } = {
    '个': 50,
    '只': 50,
    '根': 100,
    '片': 30,
    '勺': 15,
    '杯': 250,
    '碗': 200,
    '袋': 50,
  }

  if (item.unit !== 'g') {
    const estimatedGrams = gramEstimates[item.unit] || 100
    gramQuantity = item.quantity * estimatedGrams
  }

  const ratio = gramQuantity / 100

  return {
    ...item,
    protein_g: Math.round(ESTIMATED_NUTRITION.protein_g * ratio * 100) / 100,
    fat_g: Math.round(ESTIMATED_NUTRITION.fat_g * ratio * 100) / 100,
    calories: Math.round(ESTIMATED_NUTRITION.calories * ratio * 100) / 100,
    sodium_mg: Math.round(ESTIMATED_NUTRITION.sodium_mg * ratio * 100) / 100,
    carbs_g: Math.round(ESTIMATED_NUTRITION.carbs_g * ratio * 100) / 100,
  }
}

// 汇总所有食物的营养成分
function sumNutrition(items: CalculatedItem[]): DailyNutrition {
  return items.reduce(
    (total, item) => ({
      total_calories: total.total_calories + item.calories,
      total_protein_g: total.total_protein_g + item.protein_g,
      total_fat_g: total.total_fat_g + item.fat_g,
      total_carbs_g: total.total_carbs_g + item.carbs_g,
      total_sodium_mg: total.total_sodium_mg + item.sodium_mg,
    }),
    {
      total_calories: 0,
      total_protein_g: 0,
      total_fat_g: 0,
      total_carbs_g: 0,
      total_sodium_mg: 0,
    }
  )
}

// 使用AI估算不在库中食物的营养成分
async function estimateItemsWithAI(items: FoodItem[], apiKey: string): Promise<CalculatedItem[]> {
  if (items.length === 0) return []

  const foodDescriptions = items.map(item => `${item.name} ${item.quantity}${item.unit}`).join('、')

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          {
            role: 'user',
            content: `请估算以下食物的营养成分（总含量，不是每100g）：
${foodDescriptions}

返回格式：JSON数组，每个元素包含：
- name: 食物名称
- quantity: 数量
- unit: 单位
- protein_g: 蛋白质总量（克）
- fat_g: 脂肪总量（克）
- calories: 热量总量（千卡/kcal）
- sodium_mg: 钠含量总量（毫克）
- carbs_g: 碳水化合物总量（克）

注意：
1. 请根据食物类型进行科学估算，确保数值合理
2. 蔬菜类热量通常较低（每100g约15-30kcal）
3. 水果类热量中等（每100g约40-90kcal）
4. 肉类热量较高（每100g约150-250kcal）
5. 返回的是总含量，不是每100g
6. 参考数据（每100g）：
   - 番茄/小番茄：18kcal、0.9g蛋白质、0.2g脂肪、3.9g碳水、5mg钠
   - 生菜：15kcal、1.4g蛋白质、0.2g脂肪、2.9g碳水、5mg钠
7. 估算示例：20个小番茄（每颗约10g，共200g），总热量约36kcal

请严格按照上述格式返回纯JSON数组，不要包含任何其他文字。`,
          },
        ],
        stream: false,
      }),
    })

    const responseText = await response.text()
    const data = JSON.parse(responseText)

    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content
      const jsonMatch = content.match(/\[[\s\S]*\]/)

      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0])

        if (Array.isArray(parsedData)) {
          console.log('AI estimated nutrition for unknown items:', parsedData)
          return parsedData
            .filter((item: any) => item.name)
            .map((item: any) => ({
              name: item.name,
              quantity: Number(item.quantity) || 0,
              unit: String(item.unit || ''),
              protein_g: Number(item.protein_g) || 0,
              fat_g: Number(item.fat_g) || 0,
              calories: Number(item.calories) || 0,
              sodium_mg: Number(item.sodium_mg) || 0,
              carbs_g: Number(item.carbs_g) || 0,
            }))
        }
      }
    }

    console.warn('Failed to estimate with AI, falling back to default estimation')
  } catch (error) {
    console.error('AI estimation error:', error)
  }

  // 降级：使用默认估算
  return items.map(item => calculateItemNutrition(item, []))
}

export async function POST(request: NextRequest) {
  try {
    const { input, foodLibrary = [] } = await request.json()

    if (!input) {
      console.log('Error: Empty input')
      return NextResponse.json({ error: '请输入饮食记录' }, { status: 400 })
    }

    const apiKey = process.env.ZHIPU_API_KEY
    if (!apiKey) {
      console.log('Error: API key not configured')
      return NextResponse.json({ error: 'API 密钥未配置，请在 .env.local 文件中设置 ZHIPU_API_KEY' }, { status: 500 })
    }

    console.log('Calling Zhipu API with input:', input)

    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [
            {
              role: 'user',
              content: `请解析以下饮食记录，提取每样食物的名称、数量和单位：

"${input}"

返回格式：JSON数组，每个元素包含：
- name: 食物名称（必须完全保持原文中的食物名称，不要修改、简化或标准化）
- quantity: 数量（数字）
- unit: 单位（如：g、个、杯、勺、片、袋等）

重要规则：
1. 食物名称必须完全保持原文，例如"小番茄"必须返回"小番茄"，不能改为"番茄"
2. "鸡胸肉"不能改为"鸡肉"或"鸡"
3. "小鸡胸肉"和"鸡胸肉"是不同的食物，要分别保持
4. 只需要提取食物信息，不需要计算营养成分
5. 数量必须是纯数字
6. 返回纯JSON数组格式，不要有任何其他文字

请严格按照上述格式返回纯JSON数组。`,
            },
          ],
          stream: false,
        }),
      })

      const responseText = await response.text()

      if (!response.ok) {
        console.error('API request failed, status:', response.status)
        return NextResponse.json({ error: `API 调用失败（${response.status}）` }, { status: response.status })
      }

      try {
        const data = JSON.parse(responseText)

        if (data.choices && data.choices[0]) {
          const content = data.choices[0].message.content
          const jsonMatch = content.match(/\[[\s\S]*\]/)

          if (jsonMatch) {
            try {
              let parsedData = JSON.parse(jsonMatch[0])

              // 清理数据：如果是数组，只保留 name、quantity、unit
              let foodItems: FoodItem[] = []
              if (Array.isArray(parsedData)) {
                foodItems = parsedData
                  .filter((item: any) => item.name && item.quantity !== undefined && item.unit)
                  .map((item: any) => ({
                    name: item.name,
                    quantity: Number(item.quantity),
                    unit: String(item.unit),
                  }))
              }

              console.log('Successfully parsed food items:', foodItems)

              // 合并用户提供的食物库和默认库
              // 创建一个合并后的库，保留更完整的数据
              const mergedLibrary = new Map<string, LibraryFoodItem>()

              // 先添加默认库
              for (const item of DEFAULT_FOOD_LIBRARY) {
                mergedLibrary.set(item.name, { ...item })
              }

              // 然后用用户库的数据覆盖，但保留notes等可能缺失的字段
              for (const userItem of foodLibrary) {
                const existing = mergedLibrary.get(userItem.name)
                if (existing) {
                  // 合并数据：用户库覆盖，但保留notes等字段
                  mergedLibrary.set(userItem.name, {
                    ...existing,
                    ...userItem,
                    // 如果用户库没有notes但默认库有，保留默认库的notes
                    notes: userItem.notes || existing.notes,
                    serving_size_g: userItem.serving_size_g || existing.serving_size_g,
                  })
                } else {
                  mergedLibrary.set(userItem.name, { ...userItem })
                }
              }

              const combinedLibrary = Array.from(mergedLibrary.values())

              // 分类：第一批在库中，第二批不在
              const libraryItems: FoodItem[] = []
              const estimatedItems: FoodItem[] = []

              console.log('Combined library size:', combinedLibrary.length)
              console.log('User foodLibrary size:', foodLibrary.length)
              console.log('User foodLibrary items:', foodLibrary)

              for (const item of foodItems) {
                const found = findFoodInLibrary(item.name, combinedLibrary)
                if (found) {
                  libraryItems.push(item)
                  console.log(`Found "${item.name}" in library:`, found)
                  console.log(`Notes for "${item.name}":`, found.notes)
                  const grams = parseGramsFromNotes(found.notes)
                  console.log(`Parsed grams from notes:`, grams)
                } else {
                  estimatedItems.push(item)
                  console.log(`"${item.name}" not in library, using estimation`)
                }
              }

              // 计算第一批：库中的食物
              const calculatedLibraryItems = libraryItems.map(item => calculateItemNutrition(item, combinedLibrary))

              // 计算第二批：不在库中的食物（使用AI智能估算）
              let calculatedEstimatedItems: CalculatedItem[] = []
              if (estimatedItems.length > 0) {
                calculatedEstimatedItems = await estimateItemsWithAI(estimatedItems, apiKey)
              }

              // 合并两批
              const allCalculatedItems = [...calculatedLibraryItems, ...calculatedEstimatedItems]

              // 汇总
              const nutrition = sumNutrition(allCalculatedItems)

              console.log('Final nutrition totals:', nutrition)
              console.log('Detailed items:', allCalculatedItems)

              return NextResponse.json({
                foodItems: allCalculatedItems,
                nutrition,
              }, { status: 200 })
            } catch (parseError) {
              console.error('JSON parse error:', parseError)
              return NextResponse.json({ error: '解析格式错误', foodItems: [], nutrition: { total_calories: 0, total_protein_g: 0, total_fat_g: 0, total_carbs_g: 0, total_sodium_mg: 0 } })
            }
          } else {
            console.error('No JSON array found')
            return NextResponse.json({ error: 'AI 返回格式错误', foodItems: [], nutrition: { total_calories: 0, total_protein_g: 0, total_fat_g: 0, total_carbs_g: 0, total_sodium_mg: 0 } })
          }
        } else {
          console.error('No choices in API response')
          return NextResponse.json({ error: 'API 返回格式错误', foodItems: [], nutrition: { total_calories: 0, total_protein_g: 0, total_fat_g: 0, total_carbs_g: 0, total_sodium_mg: 0 } })
        }
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError)
        return NextResponse.json({ error: '解析响应失败', foodItems: [], nutrition: { total_calories: 0, total_protein_g: 0, total_fat_g: 0, total_carbs_g: 0, total_sodium_mg: 0 } })
      }
    } catch (error) {
      console.error('Server error:', error)
      return NextResponse.json({ error: '服务器错误' }, { status: 500 })
    }
  } catch (error) {
    console.error('Request parsing error:', error)
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }
}
