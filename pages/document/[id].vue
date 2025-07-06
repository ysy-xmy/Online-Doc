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

// 重试加载
const retryLoad = () => {
  isLoading.value = true;
  hasError.value = false;
  errorMessage.value = '';
  fetchCollaborators();
};

// 获取当前用户文档权限
const fetchCollaborators = async () => {
  try {
    isLoading.value = true;
    hasError.value = false;

    console.log("开始获取当前用户文档权限，documentId:", documentId);
    console.log("当前用户信息:", {
      username,
      currentUserId,
      currentUserIdNumber,
      userIdType: typeof currentUserId,
      userIdNumberType: typeof currentUserIdNumber
    });

    try {
      // 首先尝试使用正确的权限检查API
      const response = await documentShareApi.getCurrentUserPermissions(documentId);
      console.log("权限API响应:", response);

      // 根据API返回的权限信息判断是否有写入权限
      const permissions = response.data;
      hasWritePermission.value = permissions.canWrite || false;

      console.log("权限详情:", {
        canRead: permissions.canRead,
        canWrite: permissions.canWrite,
        canDelete: permissions.canDelete,
        canManage: permissions.canManage,
        canComment: permissions.canComment,
        role: permissions.role,
        userId: permissions.userId,
        documentId: permissions.documentId
      });
      console.log("权限API检查结果:", hasWritePermission.value);

    } catch (permissionError) {
      console.warn("权限API调用失败，使用备用检查方式:", permissionError);

      // 备用检查方式：使用协作者API
      const fallbackResponse = await documentShareApi.getCollaborators(documentId);
      console.log("备用API响应:", fallbackResponse);

      // 详细的创建者检查，处理数据类型问题
      const document = fallbackResponse.data.document;
      const creator = document?.creator;

      console.log("详细比较信息:", {
        "creator.id": creator?.id,
        "creator.id类型": typeof creator?.id,
        "currentUserIdNumber": currentUserIdNumber,
        "currentUserIdNumber类型": typeof currentUserIdNumber,
        "creator.username": creator?.username,
        "username": username,
        "ID相等(===)": creator?.id === currentUserIdNumber,
        "ID相等(==)": creator?.id == currentUserIdNumber,
        "用户名相等": creator?.username === username
      });

      // 使用数字类型的用户ID进行比较
      const isCreatorById = creator && (creator.id === currentUserIdNumber || creator.id == currentUserIdNumber);
      const isCreatorByUsername = creator && creator.username === username;
      const isCreator = isCreatorById && isCreatorByUsername;

      const hasEditorRole = fallbackResponse.data.collaborators.some(
        (collab) => (collab.user.id === currentUserIdNumber || collab.user.id == currentUserIdNumber) && collab.role === "EDITOR"
      );

      console.log("备用检查结果:", {
        isCreatorById,
        isCreatorByUsername,
        isCreator,
        hasEditorRole
      });

      hasWritePermission.value = isCreator || hasEditorRole;
      console.log("备用检查最终结果:", hasWritePermission.value);
    }

    isLoading.value = false;
  } catch (error) {
    console.error("权限检查失败:", error);
    console.error("错误详情:", error.response || error.message);

    hasError.value = true;
    errorMessage.value = error.response?.data?.message || error.message || '获取文档权限失败';
    hasWritePermission.value = false;
    isLoading.value = false;
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
