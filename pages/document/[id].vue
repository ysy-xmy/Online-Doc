<template>
  <div class="document-editor">
    <!-- 文档信息菜单 -->
    <Doc-Menu
      v-model:documentName="documentName"
      :onlineUsers="onlineUsers"
      @save="saveDocument"
      ref="menuRef" />

    <!-- 文档编辑器 -->
    <Doc-yjsdemo 
      ref="yjsdemoRef"
      @openCommentPanel="openSidebar" 
    />

    <!-- 文档侧边栏 -->
    <Doc-DocumentSidebar
      v-model:show="showSidebar"
      :commentData="commentData"
      @addComment="handleAddComment"
      />

    <!-- 评论按钮 -->
    <button
      @click="openSidebar"
      class="cursor-pointer absolute bottom-10 right-40 bg-gray-100 h-10 w-10 rounded-full">
      <Icon :style="{ color: '#000' }" name="mdi:comment-outline" />
    </button>
  </div>
</template>

<script setup>
// 使用 definePageMeta 指定全局布局
definePageMeta({
  layout: "fullscreen",
});

import { ref, provide } from 'vue'

const route = useRoute();
const documentId = route.params.id;
const commentData = ref(null);
const documentContent = ref("");
const documentName = ref("未命名文档");
const showSidebar = ref(false);
const menuRef = ref(null);
const yjsdemoRef = ref(null);

// 模拟在线用户数据（后面连接）
const onlineUsers = ref([
  {
    id: 1,
    name: "用户A",
    color: "#007bff",
    isLocal: true,
  },
  {
    id: 2,
    name: "用户B",
    color: "#28a745",
    isLocal: false,
  },
]);

// 模拟获取文档内容的方法
const fetchDocumentContent = async () => {
  // 在实际应用中，这里应该是从后端获取文档内容
  documentContent.value = `这是文档 ${documentId} 的内容`;
  documentName.value = `文档 ${documentId}`;
};

const openSidebar = (data) => {
  if (data) {
    commentData.value = data
  }
  showSidebar.value = true;
};

// 处理添加评论的方法
const handleAddComment = (commentData) => {
  if (yjsdemoRef.value) {
    // 直接传递 commentData，它已经包含了 hasSelectionId
    const comment = yjsdemoRef.value.insertCommentAtPosition(commentData);

    if (comment) {
      // 更新评论数据并打开侧边栏
      commentData.value = comment;
      showSidebar.value = true;
    }
  }
};

onMounted(() => {
  fetchDocumentContent();
});

// 保存文档的方法
const saveDocument = (name) => {
  // 在实际应用中，这里应该调用后端保存接口
  console.log("保存文档:", name, documentContent.value);

  // 更新保存状态
  if (menuRef.value) {
    menuRef.value.setSaveStatus("已保存");
    menuRef.value.setLastSaved(new Date());
  }
};
</script>

<style scoped>
.document-editor {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
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
