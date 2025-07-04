<template>
    <!-- 文档信息菜单 -->
    <Doc-Menu
      v-model:documentName="documentName"
      :onlineUsers="onlineUsers"
      @save="saveDocument"
      ref="menuRef" />

    <!-- 文档编辑器 -->
    <Doc-yjsdemo 
      ref="yjsdemoRef"
      :isReadOnly="false"
      @openCommentPanel="openSidebar" 
    />

    <!-- 文档侧边栏 -->
    <Doc-DocumentSidebar
      v-model:show="showSidebar"
      :commentData="commentData"
      :commentAlldata="commentAlldata"
      @addComment="handleAddComment"
      />

    <!-- 评论按钮 -->
    <button
      @click="showAll"
      class="cursor-pointer absolute bottom-10 right-40 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-200">
      <img 
        class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100" 
        src="https://img.icons8.com/?size=100&id=bOhSoikzLIic&format=png&color=000000" 
      />
    </button>

    <!-- AI生成摘要按钮 -->
    <FloatingButton @click="startSummary" />
    <SummaryModal :isVisible="isAISummaryVisible" :documentId="documentId" @close="handleClosePanel" />
</template>

<script setup>
import { useDocumentStore } from "@/stores/document";
import FloatingButton from "@/components/AI/FloatingButton.vue";
import SummaryModal from "@/components/AI/SummaryModal.vue";

const isAISummaryVisible = ref(false);
const startSummary = () => {
  isAISummaryVisible.value = !isAISummaryVisible.value;
};
const handleClosePanel = () => {
  isAISummaryVisible.value = false;
};

const documentStore = useDocumentStore();
const documentInfo = documentStore.documentInfo;
//新添加：
const editorStore = useEditorStore();

// 使用 definePageMeta 指定全局布局
definePageMeta({
  layout: "fullscreen",
});

import { ref, provide } from 'vue'
import {useEditorStore} from "~/stores/editorStore.js";

const route = useRoute();
const documentId = route.params.id;
const commentData = ref(null);
const commentAlldata = ref(null)
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
    commentAlldata.value= yjsdemoRef.value.extractComments()

  }
  showSidebar.value = true;
};

const showAll = ()=>{
  if(yjsdemoRef.value){
    commentAlldata.value= yjsdemoRef.value.extractComments()
    commentData.value = null
  }
  showSidebar.value = true;

} 

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
    documentInfo.value = name;
    editorStore.setDocumentTitle(name);//新添加，更新文档标题的存储
    // 在实际应用中，这里应该调用后端保存接口
    console.log("保存文档:", name, documentContent.value);
    console.log("editorStore:", editorStore.documentTitle);
  // 更新保存状态
  if (menuRef.value) {
    menuRef.value.setSaveStatus("已保存");
    menuRef.value.setLastSaved(new Date());
  }
};
</script>

<style scoped>
.document-textarea {
  flex: 1;
  padding: 1.25rem;
  border: none;
  resize: none;
  font-size: 1rem;
  line-height: 1.6;
  outline: none;

}
</style>
