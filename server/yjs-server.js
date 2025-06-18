const http = require('http')
const WebSocket = require('ws')
const Y = require('yjs')
const syncProtocol = require('y-protocols/sync')
const awarenessProtocol = require('y-protocols/awareness')
const encoding = require('lib0/encoding')
const decoding = require('lib0/decoding')

const port = process.env.PORT || 1234
const wss = new WebSocket.Server({ port })

// 存储房间的文档和意识状态
const rooms = new Map()

// 获取或创建房间
function getRoom(roomName) {
  if (!rooms.has(roomName)) {
    const doc = new Y.Doc()
    const awareness = new awarenessProtocol.Awareness(doc)
    rooms.set(roomName, { doc, awareness })
  }
  return rooms.get(roomName)
}

// 安全地广播消息
function safeBroadcast(sender, message) {
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      try {
        client.send(message)
      } catch (error) {
        console.error('广播消息时出错:', error)
      }
    }
  })
}

wss.on('connection', (conn, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const roomName = url.searchParams.get('room') || 'default-room'
  
  console.log(`客户端连接到房间: ${roomName}`)

  const room = getRoom(roomName)
  const doc = room.doc
  const awareness = room.awareness

  // 处理连接
  conn.on('message', (message) => {
    try {
      // 将消息转换为 Uint8Array
      const buf = message instanceof Buffer ? new Uint8Array(message) : message
      
      // 安全地创建解码器
      let decoder, encoder
      try {
        decoder = decoding.createDecoder(buf)
        encoder = encoding.createEncoder()
      } catch (decoderError) {
        console.error('创建解码器时出错:', decoderError)
        return
      }

      // 尝试读取消息类型
      let messageType
      try {
        messageType = decoding.readVarUint(decoder)
      } catch (typeReadError) {
        console.error('读取消息类型时出错:', typeReadError)
        return
      }

      switch (messageType) {
        case 0: // sync message
          try {
            syncProtocol.readSyncMessage(
              decoder, 
              encoder, 
              doc, 
              (update) => {
                // 安全地广播更新
                const encodedUpdate = encoding.toUint8Array(encoder)
                safeBroadcast(conn, encodedUpdate)
              }
            )
          } catch (syncError) {
            console.error('处理同步消息时出错:', syncError)
          }
          break
        
        case 1: // awareness message
          try {
            // 使用最新的 Awareness 处理方法
            const awarenessUpdate = decoding.readVarUint8Array(decoder)
            awarenessProtocol.applyAwarenessUpdate(awareness, awarenessUpdate, conn)
            
            // 安全地广播意识更新
            safeBroadcast(conn, awarenessUpdate)
          } catch (awarenessError) {
            console.error('处理 Awareness 消息时出错:', awarenessError)
          }
          break
        
        default:
          console.log('未知消息类型:', messageType)
      }
    } catch (err) {
      console.error('处理消息时出错:', err)
    }
  })

  // 处理连接关闭
  conn.on('close', () => {
    console.log(`客户端从房间 ${roomName} 断开连接`)
    awareness.destroy()
  })

  // 初始同步
  try {
    const syncEncoder = encoding.createEncoder()
    syncProtocol.writeSyncStep1(syncEncoder, doc)
    conn.send(encoding.toUint8Array(syncEncoder))
  } catch (syncInitError) {
    console.error('初始同步时出错:', syncInitError)
  }
})

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err)
})

console.log(`WebSocket 服务器运行在 ws://localhost:${port}`) 