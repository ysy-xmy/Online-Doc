<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useDocumentStore } from '@/stores/document'
import UserInfo from './UserInfo.vue'
import FloatingToolbar from './FloatingToolbar.vue'
import { initCollaborativeEditor } from './collaborativeEditorLogic'
import { renderRemoteCursors } from './remoteCursorRenderer'

const quillEditor = ref(null)
const floatingToolbar = ref(null)
const documentStore = useDocumentStore()
const isClient = process.client

const loadDependencies = async () => {
  if (!isClient) return

  try {
    await import('quill/dist/quill.snow.css')
    await import('quill')
    await import('yjs')
    await import('y-quill')
    await import('y-websocket')
  } catch (error) {
    console.error('加载依赖时出错:', error)
  }
}

onMounted(async () => {
  if (!isClient) return

  await loadDependencies()
  await initCollaborativeEditor(quillEditor, floatingToolbar, renderRemoteCursors)
})

onUnmounted(() => {
  documentStore.$patch({
    usersInfo: {
      name: '',
      color: '',
      timestamp: 0,
      clientID: '',
    },
  })
})
</script>

<template>
  <div class="quill-container">
    <UserInfo />
    <FloatingToolbar ref="floatingToolbar" />
    <div ref="quillEditor" class="editor"></div>
  </div>
</template>

<style scoped>
/* 保留原有样式 */
</style> 