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
  public status: Ref<WebSocketStatus> = ref(WebSocketStatus.CLOSED)
  public data: Ref<any> = ref(null)
  public error: Ref<Error | null> = ref(null)

  // 消息回调
  private messageHandlers: Map<string, (data: any) => void> = new Map()

  constructor(url: string, protocols?: string | string[]) {
    this.url = url
    this.protocols = protocols
    
    // 确保状态初始化
    this.status.value = WebSocketStatus.CLOSED
  }

  // 连接方法
  connect(retryCount = 0, maxRetries = 3): Promise<void> {
    return new Promise((resolve, reject) => {
      // 重置状态引用
      this.status = ref(WebSocketStatus.CLOSED)
      this.data = ref(null)
      this.error = ref(null)

      // 检查 URL 是否有效
      if (!this.url || this.url.includes('/_nuxt/')) {
        const errorMsg = `无效的 WebSocket 地址: ${this.url}`
        console.error(errorMsg)
        
        // 使用安全的状态设置方法
        this.setStatus(WebSocketStatus.ERROR)
        this.setError(new Error(errorMsg))
        
        reject(new Error(errorMsg))
        return
      }

      // 如果已经连接，直接返回
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.setStatus(WebSocketStatus.OPEN)
        resolve()
        return
      }

      try {
        console.group('WebSocket 连接详情')
        console.log('连接地址:', this.url)
        console.log('协议:', this.protocols || '无')
        console.log('重试次数:', retryCount)

        // 创建 WebSocket 连接
        this.socket = new WebSocket(this.url, this.protocols)
        this.setStatus(WebSocketStatus.CONNECTING)
        console.log('连接状态:', this.status.value)

        // 连接成功
        this.socket.onopen = () => {
          console.log('连接成功事件触发')
          this.setStatus(WebSocketStatus.OPEN)
          console.log('WebSocket 连接成功')
          console.groupEnd()
          resolve()
        }

        // 接收消息
        this.socket.onmessage = (event) => {
          console.log('收到消息:', event.data)
          try {
            const parsedData = JSON.parse(event.data)
            this.setData(parsedData)

            // 触发特定消息类型的处理器
            if (parsedData.type && this.messageHandlers.has(parsedData.type)) {
              const handler = this.messageHandlers.get(parsedData.type)
              handler && handler(parsedData)
            }
          } catch (err) {
            console.error('解析消息失败', event.data, err)
          }
        }

        // 连接关闭
        this.socket.onclose = (event) => {
          console.group('WebSocket 连接关闭')
          console.log('关闭码:', event.code)
          console.log('关闭原因:', event.reason)
          console.log('是否正常关闭:', event.wasClean)
          console.groupEnd()

          this.setStatus(WebSocketStatus.CLOSED)
          
          // 重试机制
          if (retryCount < maxRetries) {
            console.log(`尝试重新连接 (${retryCount + 1}/${maxRetries})`)
            setTimeout(() => {
              this.connect(retryCount + 1, maxRetries).catch(() => {})
            }, 3000)
          } else {
            console.error('达到最大重连次数，停止重试')
          }
        }

        // 连接错误
        this.socket.onerror = (error) => {
          console.group('WebSocket 错误详情')
          console.error('错误对象:', error)
          console.log('当前状态:', this.status.value)
          console.groupEnd()

          this.setStatus(WebSocketStatus.ERROR)
          this.setError(new Error(`WebSocket 连接错误: ${error}`))
          
          // 重试机制
          if (retryCount < maxRetries) {
            console.log(`尝试重新连接 (${retryCount + 1}/${maxRetries})`)
            setTimeout(() => {
              this.connect(retryCount + 1, maxRetries).catch(reject)
            }, 3000)
          } else {
            console.error('达到最大重连次数，停止重试')
            reject(error)
          }
        }
      } catch (err) {
        console.group('WebSocket 创建异常')
        console.error('创建失败详情:', err)
        console.groupEnd()

        this.setStatus(WebSocketStatus.ERROR)
        this.setError(new Error(`创建 WebSocket 失败: ${err}`))
        
        // 重试机制
        if (retryCount < maxRetries) {
          console.log(`尝试重新连接 (${retryCount + 1}/${maxRetries})`)
          setTimeout(() => {
            this.connect(retryCount + 1, maxRetries).catch(reject)
          }, 3000)
        } else {
          console.error('达到最大重连次数，停止重试')
          reject(err)
        }
      }
    })
  }

  // 安全的状态设置方法
  private setStatus(newStatus: WebSocketStatus) {
    // 确保 status 是一个响应式引用
    if (!this.status || typeof this.status !== 'object') {
      this.status = ref(WebSocketStatus.CLOSED)
    }
    
    // 安全地设置状态值
    this.status.value = newStatus
  }

  // 安全的数据设置方法
  private setData(newData: any) {
    // 确保 data 是一个响应式引用
    if (!this.data || typeof this.data !== 'object') {
      this.data = ref(null)
    }
    
    // 安全地设置数据值
    this.data.value = newData
  }

  // 安全的错误设置方法
  private setError(newError: Error | null) {
    // 确保 error 是一个响应式引用
    if (!this.error || typeof this.error !== 'object') {
      this.error = ref(null)
    }
    
    // 安全地设置错误值
    this.error.value = newError
  }

  // 发送消息
  send(data: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket 未连接，无法发送消息')
      throw new Error('WebSocket 未连接')
    }
    // 确保发送 JSON 字符串
    this.socket.send(typeof data === 'string' ? data : JSON.stringify(data))
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
    this.setStatus(WebSocketStatus.CLOSED)
  }
}

// 定义 WebSocket 创建函数类型
type CreateWebSocketFunction = (url: string, protocols?: string | string[]) => WebSocketService

// Nuxt 插件
export default defineNuxtPlugin((nuxtApp) => {
  // 获取运行时配置
  const { public: { websocketUrl } } = useRuntimeConfig()

  // 创建 WebSocket 服务
  const createWebSocket: CreateWebSocketFunction = (url, protocols) => {
    // 如果没有传入 URL，使用运行时配置的 URL
    const finalUrl = url || websocketUrl

    console.log('创建 WebSocket 实例，地址:', finalUrl)
    return new WebSocketService(finalUrl, protocols)
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