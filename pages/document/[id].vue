<template>
  <div
    class="h-full w-full flex flex-col overflow-y-auto dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-52"
  >
    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <div class="text-lg">正在加载文档...</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="hasError" class="flex items-center justify-center h-64">
      <div class="text-red-500">
        <div class="text-lg mb-2">加载失败</div>
        <div class="text-sm">{{ errorMessage }}</div>
        <button @click="retryLoad" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          重试
        </button>
      </div>
    </div>

    <!-- 正常内容 -->
    <div v-else>
      <WriteRead v-if="hasWritePermission" />
      <ReadOnlyViewer v-else />
    </div>
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

// 确保currentUserId是数字类型
const currentUserIdNumber = typeof currentUserId === 'number' ? currentUserId : parseInt(currentUserId.toString());

// 页面状态
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');


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
    isLoading.value =false
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
