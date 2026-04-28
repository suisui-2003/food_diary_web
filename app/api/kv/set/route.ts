import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { key, value } = await request.json()

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
    }

    const kvUrl = `https://${process.env.KV_URL || 'api.vercel-storage.com'}/v1/kv/${key}`

    const response = await fetch(kvUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.KV_TOKEN || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('KV set error:', response.status, errorText)
      return NextResponse.json({ error: `Failed to set value: ${errorText}` }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('KV set error:', error)
    return NextResponse.json({ error: 'Failed to set value' }, { status: 500 })
  }
}
