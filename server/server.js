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

// 存储每个房间的客户端连接
const roomClients = new Map()

// 房间清理定时器
const roomCleanupInterval = setInterval(() => {
  const now = Date.now()
  const inactiveThreshold = 30 * 60 * 1000 // 30分钟无活动则清理房间
  
  for (const [roomName, lastUpdate] of roomLastUpdate.entries()) {
    if (now - lastUpdate.getTime() > inactiveThreshold) {
      // 检查房间是否还有活跃客户端
      const clients = roomClients.get(roomName) || new Set()
      if (clients.size === 0) {
        console.log(`清理空闲房间: ${roomName}`)
        rooms.delete(roomName)
        roomLastUpdate.delete(roomName)
        roomClients.delete(roomName)
      }
    }
  }
}, 5 * 60 * 1000) // 每5分钟检查一次

// 获取房间信息的函数
const getRoomInfo = (roomName) => {
  const clients = roomClients.get(roomName) || new Set()
  const lastUpdate = roomLastUpdate.get(roomName)
  return {
    roomName,
    activeUsers: clients.size,
    lastUpdate: lastUpdate ? lastUpdate.toISOString() : null,
    hasDocument: rooms.has(roomName)
  }
}

// 获取所有房间信息
const getAllRooms = () => {
  const roomInfos = []
  for (const roomName of rooms.keys()) {
    roomInfos.push(getRoomInfo(roomName))
  }
  return roomInfos
}

// 监听 WebSocket 连接事件
wss.on('connection', (ws, req) => {
  console.log('新的客户端连接')

  // 解析房间名（从 URL 或查询参数）
  // 支持多种方式获取房间名：
  // 1. 查询参数: ws://localhost:1234?room=document-123
  // 2. 路径参数: ws://localhost:1234/document-123
  let roomName = 'default-room'
  
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    
    // 优先从查询参数获取房间名
    if (url.searchParams.has('room')) {
      roomName = url.searchParams.get('room')
    } else {
      // 从路径获取房间名
      const pathParts = url.pathname.split('/').filter(part => part)
      if (pathParts.length > 0) {
        roomName = pathParts[pathParts.length - 1]
      }
    }
  } catch (error) {
    console.error('解析房间名时出错:', error)
    roomName = 'default-room'
  }

  // 验证房间名格式（只允许字母、数字、连字符和下划线）
  if (!/^[a-zA-Z0-9_-]+$/.test(roomName)) {
    console.error('无效的房间名:', roomName)
    ws.close(1008, '无效的房间名')
    return
  }

  console.log(`客户端连接到房间: ${roomName}`)
  
  // 获取或创建房间的共享文档
  // 如果房间不存在，则创建一个新的 Yjs 文档实例
  if (!rooms.has(roomName)) {
    console.log(`创建新房间: ${roomName}`)
    rooms.set(roomName, new Y.Doc())
    roomLastUpdate.set(roomName, new Date()) // 初始化房间创建时间
    roomClients.set(roomName, new Set())
  }
  
  const ydoc = rooms.get(roomName)
  const roomClientSet = roomClients.get(roomName)
  
  // 将客户端添加到房间
  roomClientSet.add(ws)
  
  // 为客户端添加房间信息
  ws.roomName = roomName
  
  // 发送房间信息给新连接的客户端
  const roomInfo = getRoomInfo(roomName)
  ws.send(JSON.stringify({
    type: 'roomInfo',
    data: roomInfo
  }))

  // 处理 Yjs 同步消息
  // 当客户端发送消息时，将其广播给同一房间的其他客户端
  ws.on('message', (message) => {
    try {
      // 更新房间的最后修改时间
      const updateTime = new Date()
      roomLastUpdate.set(roomName, updateTime)
      
      // 广播消息到同一房间的其他客户端
      // 只广播给同一房间的客户端
      const roomClientsSet = roomClients.get(roomName)
      if (roomClientsSet) {
        roomClientsSet.forEach((client) => {
          if (client !== ws && client.readyState === 1) {  // 1 对应 WebSocket.OPEN
            client.send(message)  // 转发原始消息  
          }
        })
      }

      // 发送房间状态更新
      const updatedRoomInfo = getRoomInfo(roomName)
      const statusMessage = JSON.stringify({
        type: 'roomStatus',
        data: updatedRoomInfo
      })
      
      // 广播房间状态给同一房间的所有客户端
      if (roomClientsSet) {
        roomClientsSet.forEach((client) => {
          if (client.readyState === 1) {  // 1 对应 WebSocket.OPEN
            client.send(statusMessage)
          }
        })
      }
      
    } catch (error) {
      console.error('消息处理错误:', error)
    }
  })

  // 监听客户端断开连接事件
  ws.on('close', (code, reason) => {
    console.log(`客户端断开连接 (房间: ${roomName}, 代码: ${code}, 原因: ${reason})`)
    
    // 从房间客户端列表中移除
    const roomClientsSet = roomClients.get(roomName)
    if (roomClientsSet) {
      roomClientsSet.delete(ws)
      
      // 如果房间没有客户端了，标记为可清理
      if (roomClientsSet.size === 0) {
        console.log(`房间 ${roomName} 没有活跃客户端`)
      }
    }
  })

  // 错误处理
  // 当 WebSocket 连接出现错误时的处理
  ws.on('error', (error) => {
    console.error(`WebSocket 错误 (房间: ${roomName}):`, error)
  })
})

// 添加 HTTP 路由用于获取服务器状态
server.on('request', (req, res) => {
  if (req.url === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'running',
      timestamp: new Date().toISOString(),
      totalRooms: rooms.size,
      totalConnections: wss.clients.size,
      rooms: getAllRooms()
    }))
  } else if (req.url === '/rooms' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      rooms: getAllRooms()
    }))
  } else if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString()
    }))
  }
})

// 服务器配置
const PORT = 1235  // 服务器监听端口

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
  console.log(`房间清理间隔: 5分钟`)
  console.log(`空闲房间清理阈值: 30分钟`)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('正在关闭服务器...')
  clearInterval(roomCleanupInterval)
  wss.close(() => {
    server.close(() => {
      console.log('服务器已关闭')
      process.exit(0)
    })
  })
}) 