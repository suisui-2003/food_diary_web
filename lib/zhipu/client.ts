export interface ZhipuMessage {
  role: 'user' | 'assistant'
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>
}

export interface ZhipuResponse {
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  created: number
  model: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function callZhipuAPI(
  messages: ZhipuMessage[],
  model: string = 'glm-4-flash'
): Promise<ZhipuResponse> {
  const apiKey = process.env.ZHIPU_API_KEY

  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY is not configured')
  }

  console.log('Calling Zhipu API with model:', model)
  console.log('Request messages:', JSON.stringify(messages, null, 2))

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  })

  const responseText = await response.text()
  console.log('API Response status:', response.status)
  console.log('API Response:', responseText)

  if (!response.ok) {
    throw new Error(`Zhipu API error: ${response.status} - ${responseText}`)
  }

  try {
    const data = JSON.parse(responseText)
    return data
  } catch (e) {
    throw new Error(`Failed to parse API response: ${responseText}`)
  }
}
