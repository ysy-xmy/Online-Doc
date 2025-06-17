<template>
  <div class="container">
    <div class="header">
      <h1>在线协作文档</h1>
    </div>
    <div class="content">
      <textarea 
        ref="textareaRef" 
        id="text" 
        placeholder="在这里输入您的文档内容"
        @input="handleInput"
      ></textarea>
    </div>
    <div class="log-info">
      <p>连接状态：{{ connectionStatus }}</p>
      <p id="save-status">{{ saveStatus }}</p>
    </div>
    <div id="revision-history">
      <h3>修订历史</h3>
      <div class="version-list">
        <button 
          v-for="revision in revisionHistory" 
          :key="revision.uuid" 
          class="version-btn"
          @click="loadVersion(revision.uuid)"
        >
          版本 {{ revision.rev }}
        </button>
      </div>
      <ul>
        <li v-for="revision in revisionHistory" :key="revision.uuid">
          版本 {{ revision.rev }}: {{ revision.uuid }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { WebSocketService } from '~/plugins/websocket'
import { documentApi } from '~/api/doc'
import type { DocumentResponse, UpdateDocumentResponse } from '~/api/doc'

// 定义接口
interface Revision {
  rev: number
  uuid: string
}

interface InitData {
  content: string
  revisionHistory?: Revision[]
}

interface UpdateData {
  changeset: string
  revisionHistory?: Revision[]
}

interface VersionLoadedData {
  content: string
  revisionHistory?: Revision[]
}

// 获取运行时配置
const { public: { websocketUrl, apiBase } } = useRuntimeConfig()

// WebSocket 实例
const wsInstance = ref<WebSocketService | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// 定义状态类型
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | '连接失败' | '连接成功'

// 状态管理
const connectionStatus = ref<ConnectionStatus>('disconnected')
const saveStatus = ref<string>('')
const lastContent = ref<string>('')
const revisionHistory = ref<Revision[]>([])

// WebSocket 创建方法
const { $websocket } = useNuxtApp()

// 防抖函数
function debounce(func: Function, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

// 生成变更集
function generateChangeset(oldContent: string, newContent: string) {
  return JSON.stringify([
    [0, oldContent.length],
    [0, newContent]
  ])
}

// 发送文档更新
async function sendDocumentUpdate(newContent: string) {
  const changeset = generateChangeset(lastContent.value, newContent)

  // 安全检查 WebSocket 实例和状态
  if (wsInstance.value) {
    try {
      // WebSocket 更新
      wsInstance.value.send({
        type: 'update',
        changeset: changeset
      })

      // HTTP 备用更新
      try {
        const { $fetchInstance } = useNuxtApp()
        const revisionData = await $fetchInstance('/document', {
          method: 'POST',
          body: { changeset }
        }) as UpdateDocumentResponse
        
        saveStatus.value = '已保存'
        updateRevisionHistory(revisionData.revisionHistory)
        
        setTimeout(() => {
          saveStatus.value = ''
        }, 2000)
      } catch (error) {
        saveStatus.value = '保存失败'
        console.error('保存失败:', error)
      }

      lastContent.value = newContent
    } catch (error) {
      console.error('发送更新失败:', error)
      saveStatus.value = '发送失败'
    }
  } else {
    // 如果 WebSocket 未连接，尝试通过 HTTP 保存
    try {
      const { $fetchInstance } = useNuxtApp()
      const revisionData = await $fetchInstance('/document', {
        method: 'POST',
        body: { changeset }
      }) as UpdateDocumentResponse
      
      saveStatus.value = '已保存（HTTP）'
      updateRevisionHistory(revisionData.revisionHistory)
      
      setTimeout(() => {
        saveStatus.value = ''
      }, 2000)
    } catch (error) {
      saveStatus.value = '保存失败'
      console.error('HTTP 保存失败:', error)
    }
  }
}

// 防抖更新
const debouncedSendUpdate = debounce(sendDocumentUpdate, 500)

// 处理输入事件
function handleInput(event: Event) {
  const newContent = (event.target as HTMLTextAreaElement).value
  debouncedSendUpdate(newContent)
}

// 更新版本历史
function updateRevisionHistory(history: Revision[]) {
  revisionHistory.value = history
}

// 加载特定版本
async function loadVersion(uuid: string) {
  // 安全检查 WebSocket 实例
  if (wsInstance.value) {
    try {
      // WebSocket 加载版本
      wsInstance.value.send({
        type: 'load_version',
        uuid: uuid
      })
    } catch (error) {
      console.error('加载版本失败:', error)
      alert('加载版本失败')
    }
  } else {
    // HTTP 备用方案
    try {
      const { $fetchInstance } = useNuxtApp()
      const versionData = await $fetchInstance(`/document/version/${uuid}`, {
        method: 'GET'
      }) as DocumentResponse
      
      if (textareaRef.value) {
        textareaRef.value.value = versionData.content
        lastContent.value = versionData.content
      }
    } catch (error) {
      console.error('加载版本失败:', error)
      alert('加载版本失败')
    }
  }
}

// 连接 WebSocket
const connectWebSocket = async () => {
  try {
    console.group('WebSocket 连接尝试')

    // 获取运行时配置的 WebSocket 地址
    const { public: { websocketUrl, apiBase } } = useRuntimeConfig()

    console.log('WebSocket 地址:', websocketUrl)
    console.log('API 基地址:', apiBase)

    // 测试 HTTP 连接
    try {
      const testResponse = await documentApi.getDocument()
      console.log('HTTP 连接测试成功:', testResponse)
    } catch (httpError) {
      console.error('HTTP 连接测试失败:', httpError)
      
      // 详细网络错误诊断
      if (httpError instanceof Error) {
        console.error('错误类型:', httpError.constructor.name)
        console.error('错误消息:', httpError.message)
      }
      
      connectionStatus.value = '连接失败'
      saveStatus.value = `错误：服务器不可达 - ${httpError instanceof Error ? httpError.message : '未知错误'}`
      return
    }

    // 创建新的 WebSocket 实例，明确传入完整地址
    const wsService = $websocket(websocketUrl)
    wsInstance.value = wsService

    // 注册消息处理器
    wsService.on('init', (data: unknown) => {
      console.log('收到初始化消息:', data)
      const initData = data as InitData
      
      if (textareaRef.value) {
        textareaRef.value.value = initData.content
        lastContent.value = initData.content
      }
      
      if (initData.revisionHistory) {
        updateRevisionHistory(initData.revisionHistory)
      }
    })

    wsService.on('update', (data: unknown) => {
      console.log('收到更新消息:', data)
      const updateData = data as UpdateData
      
      if (textareaRef.value) {
        // 解析变更集
        const changeset = JSON.parse(updateData.changeset)
        textareaRef.value.value = lastContent.value = changeset[1][1]
      }
      
      if (updateData.revisionHistory) {
        updateRevisionHistory(updateData.revisionHistory)
      }
    })

    wsService.on('version_loaded', (data: unknown) => {
      console.log('收到版本加载消息:', data)
      const versionData = data as VersionLoadedData
      if (textareaRef.value) {
        textareaRef.value.value = versionData.content
        lastContent.value = versionData.content
      }
      
      if (versionData.revisionHistory) {
        updateRevisionHistory(versionData.revisionHistory)
      }
    })

    // 连接 WebSocket
    await wsService.connect()
    
    console.log('WebSocket 连接成功')
    connectionStatus.value = '连接成功'
    saveStatus.value = '就绪'
    console.groupEnd()
  } catch (error) {
    console.group('WebSocket 连接失败')
    console.error('连接错误详情:', error)
    
    // 详细错误日志
    if (error instanceof Error) {
      console.error('错误名称:', error.name)
      console.error('错误消息:', error.message)
      console.error('错误堆栈:', error.stack)
    }
    
    console.groupEnd()

    connectionStatus.value = '连接失败'
    saveStatus.value = `连接错误: ${error instanceof Error ? error.message : '未知错误'}`
    
    // 尝试重新连接
    setTimeout(connectWebSocket, 3000)
  }
}

// 生命周期钩子
onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  if (wsInstance.value) {
    wsInstance.value.close()
  }
})
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  width: 100%;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.content {
  width: 500px;
  height: 400px;
}

#text {
  width: 100%;
  height: 100%;
  border: 1px solid #000;
  border-radius: 10px;
  padding: 10px;
  font-size: 16px;
  font-family: Arial, sans-serif;
}

.log-info {
  width: 300px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #000;
  margin-top: 20px;
}

#revision-history {
  width: 600px;
  height: 200px;
  border: 1px solid #000;
  overflow-y: auto;
  margin-top: 20px;
  padding: 20px;
}

.version-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.version-btn {
  padding: 5px 10px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  cursor: pointer;
}

.version-btn:hover {
  background-color: #e0e0e0;
}

#save-status {
  margin-left: 10px;
  color: #888;
}
</style> 