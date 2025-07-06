<template>
  <div
    class="h-full w-full flex flex-col overflow-y-auto dark:bg-gray-900 text-gray-900 dark:text-gray-100 pl-52"
  >
    <!-- <WriteRead v-if="hasWritePermission"  />
    <ReadOnlyViewer v-else /> -->
<WriteRead  />
  </div>
  <RevisionInfo/>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "@/stores/user";
import { documentShareApi } from "~/api/collaborators";
import WriteRead from "./write_read.vue";
import RevisionInfo from "./revisionInfo.vue"
import ReadOnlyViewer from "./ReadOnlyViewer.vue";

// 路由和状态管理
const route = useRoute();
const userStore = useUserStore();
const documentId = route.params.id;
const currentUserId = userStore.userId;
const hasWritePermission = ref(false);
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
    console.log("文档id:", documentId);
    // 获取文档协作者列表
    const response2 = await documentShareApi.getCollaborators(documentId);
    console.log("协作者列表:", response2);
    // 判断当前用户是否有读写权限
    if (response2.data.collaborators.length === 0) {
      hasWritePermission.value = false;
      return;
    }
    hasWritePermission.value = response2.data.collaborators.some(
      (collab) => collab.user.id === currentUserId && collab.role === "EDITOR"
    );
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
