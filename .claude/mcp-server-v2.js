const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// 存储网页状态
let pageState = {
  url: '',
  html: '',
  cookies: '',
  localStorage: {},
  lastUpdate: Date.now()
}

// 网页发送状态
app.post('/state', (req, res) => {
  pageState = {
    ...pageState,
    ...req.body,
    lastUpdate: Date.now()
  }
  console.log('[MCP Server] Updated page state')
  res.json({ success: true })
})

// 获取当前状态
app.get('/state', (req, res) => {
  res.json(pageState)
})

// 执行JavaScript代码
app.post('/eval', async (req, res) => {
  const { code } = req.body
  console.log('[MCP Server] Executing code:', code.substring(0, 200))

  // 添加一个虚拟的eval函数到页面
  const evalScript = `
    window.__mcpResult = undefined;
    window.__mcpError = undefined;
    try {
      ${code}
      if (window.__mcpSendResult) {
        window.__mcpSendResult(window.__mcpResult);
      }
    } catch (e) {
      window.__mcpError = String(e);
      if (window.__mcpSendResult) {
        window.__mcpSendResult(null, String(e));
      }
    }
  `

  // 更新页面状态，包含要执行的代码
  pageState.evalCode = evalScript
  pageState.lastUpdate = Date.now()

  res.json({ success: true })
})

// 检查eval结果
app.get('/result', (req, res) => {
  res.json({
    success: !!pageState.evalResult,
    result: pageState.evalResult,
    error: pageState.evalError
  })
})

// 接收eval结果
app.post('/result', (req, res) => {
  pageState.evalResult = req.body.result
  pageState.evalError = req.body.error
  pageState.lastUpdate = Date.now()
  console.log('[MCP Server] Eval result:', pageState.evalResult)
  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`[MCP Server v2] Running on http://localhost:${PORT}`)
})
