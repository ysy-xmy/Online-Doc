<template>
  <!-- 文档信息菜单 -->
  <Doc-Menu_read
    :documentName="documentName"
    mode="readonly"
  />

  <!-- 文档内容展示 -->
  <Doc-yjsdemo ref="readOnlyDocRef"  :isReadOnly="true"/>

</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useDocumentStore as useDocumentStoreAPI } from "@/stores/documentStore";
import { useDocumentStore } from "@/stores/document";

const route = useRoute();
const documentId = route.params.id;
const documentContent = ref("");
const documentName = ref("未命名文档");

const documentStore = useDocumentStore();
const documentStoreAPI = useDocumentStoreAPI();

// 获取文档内容的方法
const fetchDocumentContent = async () => {
  try {
        // 调用真实的API获取文档详情
        const documentData = await documentStoreAPI.fetchDocumentById(
            Number(documentId)
        );

        if (documentData) {
            // 更新文档内容
            documentContent.value =
                documentData.content || `这是文档 ${documentId} 的内容`;
            // 更新文档名称
            documentName.value = documentData.title || `文档 ${documentId}`;
            // 更新store中的文档名称
            documentStore.updateDocumentName(
                documentData.title || `文档 ${documentId}`
            );
        }
    } catch (error) {
        console.error("获取文档详情失败:", error);
        // 如果API调用失败，使用默认值
        documentContent.value = `这是文档 ${documentId} 的内容`;
        documentName.value = `文档 ${documentId}`;
    }
};
onMounted(() => {
  fetchDocumentContent();
});
</script>

<style scoped></style>
