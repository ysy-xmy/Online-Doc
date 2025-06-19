<template>
  <div class="document-editor">
  
    <!-- <textarea 
      v-model="documentContent" 
      class="document-textarea"
      placeholder="在这里开始编辑您的文档..."
    ></textarea> -->
    <Doc-yjsdemo/>
    
    <Doc-DocumentSidebar v-model:show="showSidebar"/>
    <button @click="openSidebar" class='cursor-pointer absolute bottom-10 right-40 bg-gray-100 h-10 w-10 rounded-full'>
      <Icon  name="mdi:comment-outline" />
    </button>
  </div>
</template>

<script setup>
// 使用 definePageMeta 指定全局布局
definePageMeta({
  layout: 'fullscreen'
})

const route = useRoute()
const documentId = route.params.id

const documentContent = ref('')
const showSidebar = ref(false)
// 模拟获取文档内容的方法
const fetchDocumentContent = async () => {
  // 在实际应用中，这里应该是从后端获取文档内容
  documentContent.value = `这是文档 ${documentId} 的内容`
}

const openSidebar = ()=>{
  showSidebar.value =true
}
onMounted(() => {
  fetchDocumentContent()
})

// 保存文档的方法
const saveDocument = () => {
  // 在实际应用中，这里应该调用后端保存接口
  console.log('保存文档:', documentContent.value)
}
</script>

<style scoped>
.document-editor {
  height: 100%;
  width: 100%;
  display: flex;
  overflow-y: auto;
}

.document-textarea {
  flex: 1;
  padding: 20px;
  border: none;
  resize: none;
  font-size: 16px;
  line-height: 1.6;
  outline: none;
}
</style> 