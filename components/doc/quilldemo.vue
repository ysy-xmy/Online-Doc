<template>
  <div class="quill-container">
    <div ref="quillEditor" class="editor"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'

const quillEditor = ref(null)
let quill = ref(null)

onMounted(async () => {
  // 动态导入，确保仅在客户端执行
  const { default: Quill } = await import('quill')
  const { default: QuillCursors } = await import('quill-cursors')
  
  // 注册光标模块
  Quill.register('modules/cursors', QuillCursors)

  // 确保 DOM 已经准备好
  if (quillEditor.value) {
    quill.value = new Quill(quillEditor.value, {
      modules: {
        cursors: true,
        toolbar: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline'],
          ['image', 'code-block']
        ],
        history: {
          userOnly: true
        }
      },
      placeholder: '开始输入您的文本...',
      theme: 'snow'
    })
  }
})
</script>

<style scoped>
.quill-container {
  max-width: 800px;
  margin: 0 auto;
}
.editor {
  height: 400px;
}
</style>