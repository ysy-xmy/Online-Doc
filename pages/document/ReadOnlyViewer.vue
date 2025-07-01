<template>
  <!-- 文档信息菜单 -->
  <Doc-Menu_read
    :documentName="documentName"
    :onlineUsers="onlineUsers"
    mode="readonly"
  />

  <!-- 文档内容展示 -->
  <Doc-yjsdemo ref="readOnlyDocRef"  :isReadOnly="true"/>
   <!-- <div class="document-content">
    <pre>{{ documentContent }}</pre>
  </div> -->
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
const route = useRoute();
const documentId = route.params.id;
const commentData = ref(null);
const documentContent = ref("");
const documentName = ref("未命名文档");

const props = defineProps({
  documentId: String,
  onlineUsers: Array,
});

// 模拟获取文档内容的方法
const fetchDocumentContent = async () => {
  // 在实际应用中，这里应该是从后端获取文档内容
  documentContent.value = `这是文档 ${documentId} 的内容`;
  documentName.value = `文档 ${documentId}`;
};
onMounted(() => {
  fetchDocumentContent();
});
</script>

<style scoped></style>
