import { useDocumentStore } from '@/stores/document'
import type { Ref } from 'vue'
import type { WebsocketProvider } from 'y-websocket'
import type { Doc } from 'yjs'
import type { QuillBinding } from 'y-quill'

let quill: any = null
let ydoc: Doc | null = null
let ytext: any = null
let provider: WebsocketProvider | null = null
let awareness: any | null = null

export const initCollaborativeEditor = async (
  quillEditor: Ref<HTMLElement | null>, 
  floatingToolbar: Ref<any>, 
  renderRemoteCursors: Function
) => {
  const documentStore = useDocumentStore()
  const localUser = {
    name: `用户_${Math.random().toString(36).substr(2, 9)}`,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    timestamp: Date.now(),
    cursorPosition: null,
    cursorLength: 0,
  }

  const Quill = await import('quill')
  const Y = await import('yjs')
  const QuillBinding = await import('y-quill')
  const WebsocketProvider = await import('y-websocket')

  // 创建 Quill 编辑器实例
  if (!quillEditor.value) {
    console.error('Quill 编辑器容器未找到')
    return null
  }

  quill = new Quill.default(quillEditor.value, {
    theme: 'snow',
    modules: {
      toolbar: '#toolbar',
      history: {
        delay: 1000,
        maxStack: 500,
        userOnly: true,
      },
    },
    placeholder: '开始协同编辑...',
  })

  // 创建 Yjs 文档
  ydoc = new Y.Doc({
    gc: true,
    gcFilter: (item) => !item.deleted,
  })

  // 创建共享文本
  ytext = ydoc.getText('text')

  // 配置 WebSocket 提供者
  provider = new WebsocketProvider.WebsocketProvider(
    'ws://localhost:1234',
    'my-roomname',
    ydoc,
    {
      connect: true,
      params: {
        username: localUser.name,
      },
    }
  )

  // 创建 QuillBinding
  const binding  = new QuillBinding (
    ytext,
    quill,
    provider.awareness,
    {
      awareness: provider.awareness,
    }
  ) as any


  // 配置 Awareness
  awareness = provider.awareness

  // 文本变更监听
  ytext.observe((event: any) => {
    if (event.changes.delta && event.changes.delta.length > 0) {
      renderRemoteCursors(quill, awareness)
    }
  })

  // 光标选择变化监听
  quill.on('selection-change', (range: any, oldRange: any, source: string) => {
    if (range) {
      const updatedUser = {
        ...localUser,
        cursorPosition: range.index,
        cursorLength: range.length,
      }

      awareness?.setLocalStateField('user', updatedUser)
      renderRemoteCursors(quill, awareness)

      // 处理浮动工具栏
      if (floatingToolbar.value) {
        floatingToolbar.value.handleSelectionChange(range, quill)
      }
    }
  })

  // Awareness 变化监听
  awareness.on('change', () => {
    const localState = awareness?.getLocalState()
    if (localState?.user) {
      documentStore.$patch({
        usersInfo: {
          name: localState.user.name,
          color: localState.user.color,
          timestamp: localState.user.timestamp,
          clientID: awareness?.clientID,
        },
      })
    }
  })

  // 连接状态监听
  provider.on('status', () => {
    awareness?.setLocalStateField('user', {
      name: localUser.name,
      color: localUser.color,
      timestamp: localUser.timestamp,
      cursorPosition: null,
      cursorLength: 0,
    })
  })

  return { quill, ydoc, provider }
}

export const cleanupCollaborativeEditor = () => {
  provider?.disconnect()
  ydoc?.destroy()
} 