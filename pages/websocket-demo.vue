<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { WebSocketStatus } from '~/plugins/websocket'

// 获取运行时配置
const { public: { websocketUrl } } = useRuntimeConfig()

// 获取 WebSocket 创建方法
const { $websocket } = useNuxtApp()

// WebSocket 实例
const wsInstance = ref<any>(null)

// 消息相关状态
const messageInput = ref('')
const receivedMessages = ref<any[]>([])
const connectionStatus = ref(WebSocketStatus.CLOSED)

// 连接 WebSocket
const connectWebSocket = async () => {
  try {
    // 使用运行时配置的 WebSocket 地址
    wsInstance.value = $websocket(websocketUrl as string)

    // 注册消息处理器
    wsInstance.value.on('chat', (data: any) => {
      receivedMessages.value.push(data)
    })

    // 连接
    await wsInstance.value.connect()

    // 更新连接状态
    connectionStatus.value = wsInstance.value.status.value
  } catch (error) {
    console.error('WebSocket 连接失败', error)
  }
}

// 发送消息
const sendMessage = () => {
  if (wsInstance.value && messageInput.value.trim()) {
    try {
      wsInstance.value.send({
        type: 'chat',
        message: messageInput.value,
        timestamp: new Date().toISOString()
      })
      
      // 清空输入
      messageInput.value = ''
    } catch (error) {
      console.error('发送消息失败', error)
    }
  }
}

// 关闭连接
const closeConnection = () => {
  if (wsInstance.value) {
    wsInstance.value.close()
    connectionStatus.value = WebSocketStatus.CLOSED
  }
}

// 生命周期钩子
onMounted(() => {
  // 可以在这里自动连接
  // connectWebSocket()
})

onUnmounted(() => {
  // 组件卸载时关闭连接
  if (wsInstance.value) {
    wsInstance.value.close()
  }
})
</script>

<template>
  <div class="websocket-container">
    <h1>WebSocket 演示</h1>

    <!-- 连接状态 -->
    <div class="connection-status">
      <p>连接状态：{{ connectionStatus }}</p>
      <p>服务器地址：{{ websocketUrl }}</p>
      <div class="connection-actions">
        <button @click="connectWebSocket" :disabled="connectionStatus === WebSocketStatus.OPEN">
          连接
        </button>
        <button @click="closeConnection" :disabled="connectionStatus !== WebSocketStatus.OPEN">
          断开连接
        </button>
      </div>
    </div>

    <!-- 消息发送区 -->
    <div class="message-input" v-if="connectionStatus === WebSocketStatus.OPEN">
      <input 
        v-model="messageInput" 
        @keyup.enter="sendMessage"
        placeholder="输入消息" 
      />
      <button @click="sendMessage">发送</button>
    </div>

    <!-- 消息列表 -->
    <div class="message-list">
      <h2>接收到的消息</h2>
      <ul>
        <li v-for="(msg, index) in receivedMessages" :key="index">
          {{ msg.message }} ({{ msg.timestamp }})
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.websocket-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.connection-status {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f0f0f0;
}

.connection-actions {
  display: flex;
  gap: 10px;
}

.message-input {
  display: flex;
  margin-bottom: 20px;
}

.message-input input {
  flex-grow: 1;
  margin-right: 10px;
}

.message-list ul {
  list-style: none;
  padding: 0;
}

.message-list li {
  background-color: #f9f9f9;
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 5px;
}

button {
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style> 