<template>
  <div class="document-editor">
    <!-- 根据showVersionView状态决定显示编辑区还是版本查看区 -->
    <transition name="fade" mode="out-in">
      <div v-if="!showVersionView" class="flex-1 h-full">
        <!-- 原编辑区域，添加 ref 用于访问子组件 -->
        <Doc-yjsdemo ref="editorRef" v-model:content="documentContent" />
      </div>
      <VersionView
          v-else
          :version="currentVersion"
          @back="showVersionView = false"
          @restore="handleRestore"
      />
    </transition>

    <Doc-DocumentSidebar v-model:show="showSidebar" @version-click="handleVersionClick"/>
    <button @click="openSidebar" class='cursor-pointer absolute bottom-10 right-40 bg-gray-100 h-10 w-10 rounded-full'>
      <Icon  name="mdi:comment-outline" />
    </button>
  </div>
</template>

<script setup>
import VersionView from '../version/versionView.vue';
import { ref, onMounted, provide, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';

// 使用 definePageMeta 指定全局布局
definePageMeta({
  layout: 'fullscreen'
})

const route = useRoute()
const documentId = route.params.id

const documentContent = ref('')
const showSidebar = ref(false)
const showVersionView = ref(false) // 控制是否显示版本内容
const currentVersion = ref(null) // 当前选中的版本
// 添加子组件引用
const editorRef = ref(null)
// 提供文档内容，使父组件可以访问
provide('documentContent', documentContent);
// 模拟获取文档内容的方法
const fetchDocumentContent = async () => {
  // 在实际应用中，这里应该是从后端获取文档内容
  documentContent.value = `这是文档 ${documentId} 的内容`
}

const openSidebar = () => {
  showSidebar.value = true
}

onMounted(async () => {
  await fetchDocumentContent()
})

// 保存文档的方法
const saveDocument = async () => {
  // 从子组件获取内容
  if (editorRef.value && editorRef.value.quill) {
    nextTick(() => {
      const content = editorRef.value.quill.root.innerHTML
      documentContent.value = content
      console.log('保存文档内容:', JSON.stringify(content));
    })
  } else {
    console.log('保存文档内容:', JSON.stringify(documentContent.value));
  }
}

// 处理版本点击事件
const handleVersionClick = (version) => {
  currentVersion.value = version;
  showVersionView.value = true;
  showSidebar.value = false;
}

// 处理还原事件
const handleRestore = (version) => {
  // 将历史版本内容设置为当前文档内容
  documentContent.value = version.content;

  // 输出修改记录（模拟传递给后端）
  const changeLog = {
    documentId: documentId,
    versionId: version.date, // 假设日期作为版本ID
    versionDescription: version.description,
    restoreTime: new Date().toISOString(),
    operator: '当前用户' // 实际应用中应获取当前用户信息
  };
  console.log('还原历史记录:', changeLog);

  // 这里可以添加保存到后端的逻辑

  // 返回到编辑界面
  showVersionView.value = false;
}

// 监听 documentContent 变化，同步到子组件
watch(documentContent, (newValue) => {
  if (editorRef.value && editorRef.value.quill) {
    editorRef.value.quill.pasteHTML(newValue)
  }
})
</script>

<style scoped>
.document-editor {
  height: 100%;
  width: 100%;
  display: flex;
  overflow-y: auto;
}

</style>
