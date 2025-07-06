<template>
  <div class="document-layout bg-base-100 w-screen text-base-content flex">
    <!-- 左侧目录栏 -->
    <aside
      class="document-sidebar-left bg-base-200 w-64 min-w-48 p-4 border-r border-base-content/10"
    >
      <h2 class="text-lg font-bold mb-4 border-b border-base-content/10 pb-2">
        知识库：{{ workspaceName }}
      </h2>
      <nav>
        <ul class="menu w-full ml-2">
          <li v-for="doc in documents" :key="doc.id" class="mb-2">
            <a
              @click="navigateToDocument(doc.id)"
              class="flex items-center gap-2 p-2 rounded-lg hover:bg-base-300 transition-colors cursor-pointer shadow-sm"
              :class="{
                'bg-primary text-primary-content': isCurrentDocument(doc.id),
              }"
            >
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">
                  {{ doc.title }}
                </div>
              </div>
              <div class="flex-none">
                <span
                  class="badge badge-xs"
                  :class="getStatusBadgeClass(doc.status)"
                >
                  {{ getStatusText(doc.status) }}
                </span>
              </div>
            </a>
          </li>
          <li
            v-if="documents.length === 0"
            class="text-center py-4 text-base-content/60"
          >
            文档列表加载中...
          </li>
        </ul>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <div style="width: 0" class="flex-1 flex flex-col min-w-2xl">
      <!-- 顶部操作栏 -->
      <header class="document-header bg-base-100 border-b border-base-content/10 px-4 py-2 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button class="btn btn-ghost btn-circle" @click="saveAndGoBack">
            <img src="https://img.icons8.com/?size=100&id=19175&format=png&color=000000" class="h-6 w-6" />
          </button>
          <div class="logo font-bold text-lg">文档编辑器</div>
        </div>
        <div class="header-actions flex items-center gap-4">
          <ThemeChange />
          <button class="btn btn-primary btn-sm" @click="saveVersion">保存</button>
          <!-- <button class="btn btn-secondary btn-sm">分享</button> -->
          <label for="share-modal" class="btn btn-secondary btn-sm">分享</label>
          <div class="text-base-content text-xl mx-2 text-bold">
            {{ userInfo.username }}
          </div>
          <div class="flex-none">
            <div class="dropdown dropdown-end">
              <div
                tabindex="0"
                role="button"
                class="btn btn-ghost btn-circle avatar"
              >
                <div
                  class="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
                >
                  <img
                    alt="用户头像"
                    :src="userInfo.avatar || '/avatar_1.webp'"
                    class="object-cover"
                    @error="handleAvatarError"
                  />
                </div>
              </div>
              <ul
                tabindex="0"
                class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
              >
                <li>
                  <a class="text-base-content" @click="showUserInfo"
                    >个人资料</a
                  >
                </li>
                <li>
                  <a class="text-base-content" @click="logout">退出</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <!-- 文档和侧边栏容器 -->
      <div class="flex flex-1 overflow-hidden">
        <!-- 文档编辑区 -->
        <main
          class="document-content flex-1 p-6 bg-base-100 overflow-auto relative"
        >
          <slot></slot>
        </main>
      </div>
    </div>

    <!-- 插入分享弹窗组件 -->
    <ShareModal />

    <!-- 用户信息模块 -->
    <UserInfo v-if="isUserInfoVisible" @close="hideUserInfo" />
  </div>
</template>

<script setup>
import { useCookie } from "#app";
import { ref, onMounted } from "vue";
import ThemeChange from "~/components/layouts/ThemeChange.vue";
import UserInfo from "~/components/common/userInfo.vue";
import { useUserStore } from "~/stores/user";
import { useWorkspaceStore } from "~/stores/workspace";
import ShareModal from "~/components/layouts/ShareModal.vue";
import { useRouter, useRoute } from "vue-router";
import { useFetch, useCookie } from "nuxt/app";
import { useEditorStore } from "~/stores/editorStore";

// 动态导入组件（避免服务端加载）
const Editor = defineAsyncComponent(() => import("./editor.vue"));
const router = useRouter();
const userStore = useUserStore();
const editorStore = useEditorStore();
const userInfo = userStore.userInfo;
const workspaceStore = useWorkspaceStore();
const documents = ref([]);

// 获取知识库名称
const workspaceName = workspaceStore.currentWorkspace
  ? workspaceStore.currentWorkspace.name
  : "未命名知识库";

//打印知识库对应的文档列表
// console.log("知识库对应的文档列表:", documents);

// 用户信息显示状态
const isUserInfoVisible = ref(false);

// 获取当前路由参数
const route = useRoute();
const currentDocumentId = computed(() => {
  const id = route.params.id;
  return id ? parseInt(id) : null;
});

// 文档相关方法
const navigateToDocument = (documentId) => {
  router.push(`/document/${documentId}`);
};

const isCurrentDocument = (documentId) => {
  return currentDocumentId.value === documentId;
};

const getStatusText = (status) => {
  const statusMap = {
    DRAFT: "草稿",
    PUBLISHED: "已发布",
    ARCHIVED: "已归档",
    DELETED: "已删除",
  };
  return statusMap[status] || status;
};

const getStatusBadgeClass = (status) => {
  const classMap = {
    DRAFT: "badge-warning",
    PUBLISHED: "badge-success",
    ARCHIVED: "badge-neutral",
    DELETED: "badge-error",
  };
  return classMap[status] || "badge-neutral";
};

const goBack = () => {
  router.push("/"); // 返回到首页（默认布局）

// 获取文档ID
const documentId = route.params.id || 'default-docId';

// 返回首页并保存版本
const saveAndGoBack = async () => {
  await saveVersion();
  router.push("/");
};

// 保存版本
const saveVersion = async () => {
  try {
    const title = editorStore.documentTitle;
    const content = editorStore.editorContent;
    const description = editorStore.versionDescription;
    console.log("editorStore::", editorStore.documentTitle);
    // 构造请求数据
    const versionData = {
      description,
      title,
      content,
      isMajor: true,
      creator: {
        id: userInfo.id,
        username: userInfo.username
      }
    };
    console.log("发送的title", title);
    const apiUrl = `http://8.134.200.53:8080/api/documents/${documentId}/versions`;
    // 从cookie中获取token
    const tokenCookie = useCookie('token');
    const token = tokenCookie.value;

    const headers = {
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      'Content-Type': 'application/json'
    };

    // 发送POST请求
    const {data, error} = await useFetch(apiUrl, {
      headers,
      method: 'POST',
      body: versionData
    });

    // 处理响应（按接口规范校验success状态）
    if (error.value || (!data.value || !data.value.success)) {
      throw new Error(data.value?.message || error.value?.message || '保存版本失败');
    }
    // 处理成功响应
    console.log('版本保存成功:', data.value);
  } catch (error) {
    console.error('保存版本失败:', error);
  }
};

const logout = () => {
  useCookie("token").value = null;
  navigateTo("/login");
};

// 显示用户信息
const showUserInfo = () => {
  isUserInfoVisible.value = true;
};

// 隐藏用户信息
const hideUserInfo = () => {
  isUserInfoVisible.value = false;
};

// 头像加载错误处理
const handleAvatarError = (event) => {
  console.log('头像加载失败，使用默认头像');
  console.log('当前头像URL:', userInfo.avatar);
  event.target.src = '/avatar_1.webp';
};

const { $axios } = useNuxtApp();
onMounted(async () => {
  console.log("fullscreen布局初始化");
  console.log("当前文档ID:", currentDocumentId.value);
  console.log("workspaceStore.workspaceId:", workspaceStore.workspaceId);

  // 如果有当前文档ID，先获取文档信息来确定知识库ID
  if (currentDocumentId.value && !workspaceStore.workspaceId) {
    try {
      console.log("通过文档ID获取知识库信息");
      const docResponse = await $axios(`/api/documents/${currentDocumentId.value}`, {
        method: "GET",
      });
      console.log("文档详情响应:", docResponse);

      if (docResponse.data && docResponse.data.workspace) {
        workspaceStore.workspaceId = docResponse.data.workspace.id;
        localStorage.setItem("workspaceId", workspaceStore.workspaceId);
        console.log("从文档信息中获取到知识库ID:", workspaceStore.workspaceId);
      }
    } catch (error) {
      console.error("获取文档详情失败:", error);
    }
  }

  //对知识库ID进行判断（解决原地刷新问题）
  if (workspaceStore.workspaceId != 0) {
    console.log("使用现有的workspaceId:", workspaceStore.workspaceId);
    localStorage.setItem("workspaceId", workspaceStore.workspaceId);
    // 获取知识库对应的文档列表
    getList();
  } else {
    const savedWorkspaceId = localStorage.getItem("workspaceId");
    if (savedWorkspaceId) {
      workspaceStore.workspaceId = savedWorkspaceId;
      console.log("从localStorage恢复workspaceId:", workspaceStore.workspaceId);
      // 获取知识库对应的文档列表
      getList();
    } else {
      console.warn("无法获取知识库ID，无法加载文档列表");
    }
  }

  // 获取知识库对应的文档列表
  function getList() {
    console.log("开始获取文档列表，workspaceId:", workspaceStore.workspaceId);

    if (!workspaceStore.workspaceId) {
      console.error("workspaceId 为空，无法获取文档列表");
      return;
    }

    $axios(`/api/documents/workspace/${workspaceStore.workspaceId}`, {
      method: "GET",
    }).then((res) => {
      console.log("知识库对应的文档列表API响应:", res);
      if (res.data && res.data.documents) {
        documents.value = res.data.documents;
        console.log("文档列表设置成功，数量:", documents.value.length);
      } else {
        console.warn("API响应中没有documents字段:", res.data);
      }
    }).catch((error) => {
      console.error("获取文档列表失败:", error);
      console.error("错误详情:", error.response || error.message);
    });
  }
});
}
</script>

<style scoped>
.document-layout {
  height: 100vh;
  width: 100vw;
}

.document-content {
  max-width: 100%;
}
</style>
