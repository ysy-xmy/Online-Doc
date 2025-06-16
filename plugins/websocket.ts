import { ref } from 'vue'

// WebSocket 连接状态枚举
export enum WebSocketStatus {
  CONNECTING = 'CONNECTING',
  OPEN = 'OPEN',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
  ERROR = 'ERROR'
}

// WebSocket 服务
export class WebSocketService {
  private socket: WebSocket | null = null
  private url: string = ''
  private protocols?: string | string[]

  // 响应式状态
  public status = ref<WebSocketStatus>(WebSocketStatus.CLOSED)
  public data = ref<any>(null)
  public error = ref<Error | null>(null)

  // 消息回调
  private messageHandlers: Map<string, (data: any) => void> = new Map()

  constructor(url: string, protocols?: string | string[]) {
    this.url = url
    this.protocols = protocols
  }

  // 连接方法
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 如果已经连接，直接返回
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      // 创建 WebSocket 连接
      this.socket = new WebSocket(this.url, this.protocols)
      this.status.value = WebSocketStatus.CONNECTING

      // 连接成功
      this.socket.onopen = () => {
        this.status.value = WebSocketStatus.OPEN
        console.log('WebSocket 连接成功')
        resolve()
      }

      // 接收消息
      this.socket.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data)
          this.data.value = parsedData

          // 触发特定消息类型的处理器
          if (parsedData.type && this.messageHandlers.has(parsedData.type)) {
            const handler = this.messageHandlers.get(parsedData.type)
            handler && handler(parsedData)
          }
        } catch (err) {
          console.error('解析消息失败', event.data)
        }
      }

      // 连接关闭
      this.socket.onclose = (event) => {
        this.status.value = WebSocketStatus.CLOSED
        console.log('WebSocket 连接关闭', event)
      }

      // 连接错误
      this.socket.onerror = (error) => {
        this.status.value = WebSocketStatus.ERROR
        this.error.value = new Error('WebSocket 连接错误')
        console.error('WebSocket 错误', error)
        reject(error)
      }
    })
  }

  // 发送消息
  send(data: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket 未连接')
    }
    this.socket.send(JSON.stringify(data))
  }

  // 注册特定类型消息的处理器
  on(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler)
  }

  // 移除特定类型消息的处理器
  off(type: string) {
    this.messageHandlers.delete(type)
  }

  // 关闭连接
  close() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }
}

// 定义 WebSocket 创建函数类型
type CreateWebSocketFunction = (url: string, protocols?: string | string[]) => WebSocketService

// Nuxt 插件
export default defineNuxtPlugin((nuxtApp) => {
  // 创建 WebSocket 服务
  const createWebSocket: CreateWebSocketFunction = (url, protocols) => {
    return new WebSocketService(url, protocols)
  }

  // 提供全局使用
  return {
    provide: {
      websocket: createWebSocket
    }
  }
})

// 扩展 Nuxt 应用的类型声明
declare module '#app' {
  interface NuxtApp {
    $websocket: CreateWebSocketFunction
  }
} 