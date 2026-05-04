'use client'

import { useState, useEffect } from 'react'
import { getCurrentUserId, getStorageKey } from '@/lib/storage'
import { useAuth } from '@/components/auth/AuthProvider'

interface ApiLog {
  timestamp: string
  request: string
  response: any
  error?: string
}

export default function DebugPage() {
  const { user, isReady } = useAuth()
  const [logs, setLogs] = useState<ApiLog[]>([])
  const [input, setInput] = useState('')
  const [localStorageKeys, setLocalStorageKeys] = useState<string[]>([])
  const [userData, setUserData] = useState<Record<string, any>>({})

  // 拦截fetch请求
  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      const startTime = Date.now()

      // 只拦截我们的API请求
      if (url.includes('/api/nutrition/')) {
        console.log('[Debug] Intercepted API call:', url)

        const response = await originalFetch(input, init)
        const clonedResponse = response.clone()

        try {
          const data = await clonedResponse.json()
          const log: ApiLog = {
            timestamp: new Date(startTime).toLocaleTimeString('zh-CN'),
            request: url,
            response: data,
          }

          setLogs(prev => [log, ...prev].slice(0, 50)) // 保留最近50条
        } catch (e) {
          console.error('[Debug] Failed to parse response:', e)
        }

        return response
      }

      return originalFetch(input, init)
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  // 监听自定义事件
  useEffect(() => {
    const handleCustomLog = (e: CustomEvent) => {
      const log: ApiLog = {
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        request: e.detail.type,
        response: e.detail.data,
      }
      setLogs(prev => [log, ...prev].slice(0, 50))
    }

    window.addEventListener('debug-log', handleCustomLog as EventListener)
    return () => {
      window.removeEventListener('debug-log', handleCustomLog as EventListener)
    }
  }, [])

  // 调试 localStorage
  useEffect(() => {
    if (!isReady) return

    const keys = Object.keys(localStorage)
    setLocalStorageKeys(keys)

    const data: Record<string, any> = {}
    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key)
        data[key] = value ? JSON.parse(value) : null
      } catch {
        data[key] = localStorage.getItem(key)
      }
    })
    setUserData(data)
  }, [isReady, logs]) // 每次有新日志时也刷新

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">调试控制台</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const keys = Object.keys(localStorage)
                setLocalStorageKeys(keys)
                const data: Record<string, any> = {}
                keys.forEach(key => {
                  try {
                    const value = localStorage.getItem(key)
                    data[key] = value ? JSON.parse(value) : null
                  } catch {
                    data[key] = localStorage.getItem(key)
                  }
                })
                setUserData(data)
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              刷新 LocalStorage
            </button>
            <button
              onClick={clearLogs}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              清除日志
            </button>
          </div>
        </div>

        {/* LocalStorage 调试 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">用户信息 & LocalStorage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">用户信息</h3>
              <div className="space-y-1 text-sm">
                <div>User ID: <span className="font-mono">{user?.id || 'null'}</span></div>
                <div>Email: {user?.email || 'null'}</div>
                <div>Current User ID (storage): <span className="font-mono">{getCurrentUserId()}</span></div>
                <div>isReady: {isReady ? '✅ true' : '❌ false'}</div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">存储键映射</h3>
              <div className="space-y-1 text-sm font-mono text-xs">
                <div>food_items_library → {getStorageKey('food_items_library')}</div>
                <div>user_profile → {getStorageKey('user_profile')}</div>
                <div>diet_records → {getStorageKey('diet_records')}</div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-semibold mb-2">LocalStorage 内容 ({localStorageKeys.length} 个键)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {localStorageKeys.map(key => (
                <div key={key} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="font-mono font-bold text-pink-600">{key}</div>
                  <div className="text-gray-600 mt-1 break-all">
                    {typeof userData[key] === 'object'
                      ? JSON.stringify(userData[key], null, 2)
                      : String(userData[key])}
                  </div>
                </div>
              ))}
              {localStorageKeys.length === 0 && <div className="text-gray-400">空</div>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">手动测试API</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">输入饮食内容</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="例如：4袋小鸡胸肉和2袋大鸡胸肉"
                rows={3}
                className="w-full px-4 py-3 border rounded-lg"
              />
            </div>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/nutrition/parse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ input }),
                  })
                  const data = await response.json()
                  console.log('[Debug] Test response:', data)
                  alert('响应已发送到控制台，请查看下方日志')
                } catch (e) {
                  console.error('[Debug] Test error:', e)
                  alert('错误：' + e)
                }
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              发送测试请求
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">API请求日志</h2>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-center py-8">暂无日志，请在饮食记录页面添加记录或使用上方手动测试</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                    <span className="font-mono text-sm text-gray-600">{log.timestamp}</span>
                    <span className="text-sm text-gray-500">{log.request}</span>
                  </div>
                  <pre className="p-4 text-sm overflow-x-auto bg-gray-900 text-green-400">
                    {typeof log.response === 'object'
                      ? JSON.stringify(log.response, null, 2)
                      : log.response}
                  </pre>
                  {log.error && (
                    <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
                      错误: {log.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">使用说明</h3>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            <li>在饮食记录页面添加记录，这里会自动显示API响应</li>
            <li>或者使用上方手动测试功能直接发送请求</li>
            <li>截图这个页面给我，我就能看到详细的API响应</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
