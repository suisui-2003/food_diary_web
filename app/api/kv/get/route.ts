import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json()

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const kvUrl = `https://${process.env.KV_URL || 'api.vercel-storage.com'}/v1/kv/${key}`

    const response = await fetch(kvUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.KV_TOKEN || ''}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('KV get error:', response.status, errorText)
      return NextResponse.json({ error: `Failed to get value: ${errorText}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ value: data.value })
  } catch (error) {
    console.error('KV get error:', error)
    return NextResponse.json({ error: 'Failed to get value' }, { status: 500 })
  }
}
