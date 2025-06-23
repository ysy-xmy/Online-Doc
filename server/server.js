// 导入必要的模块
import http from 'http'           // Node.js 内置 HTTP 模块
import { WebSocketServer } from 'ws'  // WebSocket 服务器模块
import * as Y from 'yjs'          // Yjs 协同编辑框架

// 创建 HTTP 服务器
// 当客户端通过 HTTP 访问时，返回服务器状态信息
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('Yjs WebSocket 服务器正在运行')
})

// 创建 WebSocket 服务器，附加到 HTTP 服务器上
// 这样可以在同一个端口同时处理 HTTP 和 WebSocket 连接
const wss = new WebSocketServer({ server })

// 存储房间的文档状态
// 每个房间对应一个独立的 Yjs 文档实例
const rooms = new Map()

// 存储每个房间的最后更新时间
const roomLastUpdate = new Map()

// 监听 WebSocket 连接事件
wss.on('connection', (ws, req) => {
  console.log('新的客户端连接')

  // 解析房间名（从 URL 或查询参数）
  // 例如：ws://localhost:1234?room=my-roomname
  const roomName = new URL(req.url, `http://${req.headers.host}`).searchParams.get('room') || 'default-room'
  
  // 获取或创建房间的共享文档
  // 如果房间不存在，则创建一个新的 Yjs 文档实例
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Y.Doc())
    roomLastUpdate.set(roomName, new Date()) // 初始化房间创建时间
  }
  const ydoc = rooms.get(roomName)

  // 处理 Yjs 同步消息
  // 当客户端发送消息时，将其广播给同一房间的其他客户端
  ws.on('message', (message) => {
    try {
      // 更新房间的最后修改时间
      const updateTime = new Date()
      roomLastUpdate.set(roomName, updateTime)
      
      // 广播消息到同一房间的其他客户端
      // 遍历所有连接的客户端，排除发送者自己
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message)  // 转发原始消息  
        }
      })

     
      // 发送打包的多条数据（可选方式）
      const multiDataMessage = JSON.stringify({
        type: 'multiData',
        data: [
          {
            type: 'document',
            content: message
          },
          {
            type: 'timestamp', 
            timestamp: updateTime.getTime()
          },
          {
            type: 'roomInfo',
            roomName: roomName,
            activeUsers: wss.clients.size
          },
          {
            type: 'onlineUsers',
            users: Array.from(wss.clients).map(client => ({
              id: client.id,
              name: client.name
            }))
          }

        ]
      })
      
      // 可以选择发送给所有客户端或特定客户端
      // wss.clients.forEach((client) => {
      //   client.send(multiDataMessage)
      // })
      
    } catch (error) {
      console.error('消息处理错误:', error)
    }
  })

  // 监听客户端断开连接事件
  ws.on('close', () => {
    console.log('客户端断开连接')
  })

  // 错误处理
  // 当 WebSocket 连接出现错误时的处理
  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error)
  })
})

// 服务器配置
const PORT = 1234  // 服务器监听端口

// 启动服务器
server.listen(PORT, () => {
  const currentTime = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  console.log(`Yjs WebSocket 服务器运行在 ws://localhost:${PORT}`)
  console.log(`服务器启动时间: ${currentTime}`)
}) 