<template>
  <div
    class="h-full w-full flex flex-col overflow-y-auto dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-52"
  >
    <WriteRead v-if="hasWritePermission" />
    <ReadOnlyViewer v-else />

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "@/stores/user";
import { documentShareApi } from "~/api/collaborators";
import WriteRead from "./write_read.vue";
import ReadOnlyViewer from "./ReadOnlyViewer.vue";

// 路由和状态管理
const route = useRoute();
const userStore = useUserStore();
const documentId = route.params.id;
const hasWritePermission = ref(false);
const username = userStore.getUserInfo().username;
const currentUserId = userStore.getUserInfo().id;


// 使用 definePageMeta 指定全局布局
definePageMeta({
  layout: "fullscreen",
});

onMounted(() => {
  fetchCollaborators();
});

// 获取协作者权限
const fetchCollaborators = async () => {
  try {
    // 获取文档协作者列表
    const response2 = await documentShareApi.getCollaborators(documentId);
    // 判断当前用户是否为文档创建者或有读写权限
    const isCreator =
      response2.data.document &&
      response2.data.document.creator.username === username &&
      response2.data.document.creator.id === currentUserId;
    const hasEditorRole = response2.data.collaborators.some(
      (collab) => collab.user.id === currentUserId && collab.role === "EDITOR"
    );
    console.log("当前用户是否为创建者:", isCreator);
    console.log("当前用户是否在协作者列表:", hasEditorRole);
    hasWritePermission.value = isCreator || hasEditorRole;
  } catch (error) {
    console.error("权限检查失败:", error);
    hasWritePermission.value = false;
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
