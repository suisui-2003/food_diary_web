// MCP客户端 - 发送网页状态到本地MCP服务器
const MCP_SERVER_URL = 'http://localhost:3002'

// 发送当前页面状态
function sendPageState(data) {
  fetch(MCP_SERVER_URL + '/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    keepalive: true
  }).catch(err => console.log('[MCP Client] Failed to send state:', err))
}

// 发送日志
function sendLog(data) {
  fetch(MCP_SERVER_URL + '/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    keepalive: true
  }).catch(err => console.log('[MCP Client] Failed to send log:', err))
}

// 拦截fetch请求
const originalFetch = window.fetch
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.toString()

  // 拦截API请求
  if (url.includes('/api/nutrition/')) {
    console.log('[MCP Client] Intercepted:', url)

    const startTime = Date.now()
    const response = await originalFetch(input, init)
    const clonedResponse = response.clone()

    try {
      const data = await clonedResponse.json()
      const duration = Date.now() - startTime

      sendLog({
        type: 'api_response',
        url: url,
        duration,
        request: init?.body ? JSON.stringify(JSON.parse(init.body)) : null,
        response: data,
        status: response.status
      })

      // 也发送页面状态
      sendPageState({
        url: window.location.href,
        title: document.title
      })
    } catch (e) {
      sendLog({
        type: 'api_error',
        url,
        error: String(e)
      })
    }

    return response
  }

  return originalFetch(input, init)
}

// 页面加载完成后发送初始状态
window.addEventListener('load', () => {
  sendPageState({
    url: window.location.href,
    title: document.title,
    loaded: true
  })
})

// 监听URL变化（单页应用）
let lastUrl = window.location.href
const observer = new MutationObserver(() => {
  const currentUrl = window.location.href
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl
    sendPageState({
      url: currentUrl,
      title: document.title,
      navigated: true
    })
  }
})

observer.observe(document.body, {
  subtree: true,
  childList: true
})

console.log('[MCP Client] Loaded')
