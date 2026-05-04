const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

// 存储网页状态
let pageState = {
  url: '',
  html: '',
  logs: []
}

// 接收网页发送的状态
app.post('/state', (req, res) => {
  pageState = {
    ...pageState,
    ...req.body,
    timestamp: new Date().toISOString()
  }
  console.log('[MCP Server] Received page state')
  res.json({ success: true })
})

// 接收日志
app.post('/log', (req, res) => {
  pageState.logs.push({
    ...req.body,
    timestamp: new Date().toISOString()
  })
  // 只保留最近100条
  if (pageState.logs.length > 100) {
    pageState.logs = pageState.logs.slice(-100)
  }
  console.log('[MCP Server] Received log:', req.body)
  res.json({ success: true })
})

// 获取当前状态
app.get('/state', (req, res) => {
  res.json(pageState)
})

// 清除日志
app.post('/clear-logs', (req, res) => {
  pageState.logs = []
  console.log('[MCP Server] Logs cleared')
  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`[MCP Server] Running on http://localhost:${PORT}`)
})
