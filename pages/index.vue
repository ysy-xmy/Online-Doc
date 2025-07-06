<template>
  <div class="bg-base-100 p-6">
      <!-- 错误提示 -->
      <div v-if="dashboardStore.error" class="alert alert-error mb-4">
          <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
          >
              <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
          </svg>
          <span>{{ dashboardStore.error }}</span>
          <button
              class="btn btn-sm btn-ghost"
              @click="dashboardStore.clearError()"
          >
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
              >
                  <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                  />
              </svg>
          </button>
      </div>

      <!-- 欢迎区域 -->
      <div class="mb-8">
          <h1 class="text-3xl font-bold text-base-content mb-2">
              欢迎回来！
          </h1>
          <p class="text-base-content/70">继续您的协作之旅</p>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-primary">
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      class="inline-block w-8 h-8 stroke-current"
                  >
                      <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      ></path>
                  </svg>
              </div>
              <div class="stat-title">知识库总数</div>
              <div class="stat-value text-primary">
                  {{ dashboardStore.userDashboard?.totalWorkspaces || 0 }}
              </div>
          </div>

          <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-secondary">
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      class="inline-block w-8 h-8 stroke-current"
                  >
                      <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                  </svg>
              </div>
              <div class="stat-title">文档总数</div>
              <div class="stat-value text-secondary">
                  {{ dashboardStore.userDashboard?.totalDocuments || 0 }}
              </div>
          </div>

          <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-accent">
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      class="inline-block w-8 h-8 stroke-current"
                  >
                      <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                  </svg>
              </div>
              <div class="stat-title">今日创建</div>
              <div class="stat-value text-accent">
                  {{ dashboardStore.statistics.documentsCreatedToday }}
              </div>
          </div>

          <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-info">
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      class="inline-block w-8 h-8 stroke-current"
                  >
                      <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      ></path>
                  </svg>
              </div>
              <div class="stat-title">活跃协作者</div>
              <div class="stat-value text-info">
                  {{ dashboardStore.statistics.activeCollaborators }}
              </div>
          </div>
      </div>

      <!-- 快捷操作 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="card bg-base-200 hover:shadow-xl">
              <div class="card-body">
                  <h2 class="card-title">
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                      >
                          <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 4v16m8-8H4"
                          />
                      </svg>
                      快速创建
                  </h2>
                  <p>开始新的协作项目</p>
                  <div class="card-actions justify-end">
                      <button
                          class="btn btn-primary btn-sm"
                          @click="navigateTo('/knowledgeHome')"
                      >
                          新建知识库
                      </button>
                      <button
                          class="btn btn-secondary btn-sm"
                          @click="navigateTo('/knowledgeHome')">
                          新建文档
                      </button>
                  </div>
              </div>
          </div>

          <div class="card bg-base-200 hover:shadow-xl">
              <div class="card-body">
                  <h2 class="card-title">
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                      >
                          <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                      </svg>
                      搜索
                  </h2>
                  <p>快速找到您需要的内容</p>
                  <div class="card-actions justify-end">
                      <div class="form-control">
                          <div class="relative">
                              <input
                                  placeholder="搜索文档或知识库..."
                                  class="input border-gray-300 px-5 py-2 rounded-xl w-56 transition-all outline-none"
                                  name="search"
                                  type="search"
                                  v-model="searchKeyword"
                                  @keyup.enter="handleSearch"
                              />
                              <svg
                                  @click="handleSearch"
                                  class="size-5 absolute top-3 right-3 text-gray-500 cursor-pointer"
                                  stroke="currentColor"
                                  stroke-width="1.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                              >
                                  <path
                                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                                      stroke-linejoin="round"
                                      stroke-linecap="round"
                                  ></path>
                              </svg>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <!-- 最近文档 -->
      <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-base-content">最近文档</h2>
              <button
                  class="btn btn-ghost btn-sm"
                  @click="refreshDashboard"
                  :disabled="dashboardStore.loading"
              >
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      :class="{ 'animate-spin': dashboardStore.loading }"
                  >
                      <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                  </svg>
              </button>
          </div>

          <!-- 加载状态 -->
          <div v-if="dashboardStore.loading" class="flex justify-center py-8">
              <span class="loading loading-spinner loading-lg"></span>
          </div>

          <!-- 文档列表 -->
          <div
              v-else-if="
                  dashboardStore.recentDocuments &&
                  dashboardStore.recentDocuments.length > 0
              "
              class="overflow-x-auto h-48"
          >
              <table class="table table-zebra table-xs table-pin-rows">
                  <thead>
                      <tr class="sticky top-0 z-10">
                          <th class="min-w-44">文档名称</th>
                          <th class="min-w-28">类型</th>
                          <th class="min-w-20">状态</th>
                          <th class="min-w-28">创建人</th>
                          <th class="min-w-44">最后修改</th>
                          <th class="min-w-36">更新时间</th>
                          <th class="min-w-20">操作</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr
                          v-for="doc in dashboardStore.recentDocuments"
                          :key="doc.id"
                          :class="{
                              'cursor-pointer hover:bg-base-200 transition-all duration-200 group': doc.status !== 'DELETED',
                              'cursor-not-allowed opacity-60': doc.status === 'DELETED'
                          }"
                          @click="doc.status !== 'DELETED' ? openDocument(doc.id) : showDeletedDocumentAlert(doc)"
                      >
                          <td>
                              <div class="flex items-center space-x-2">
                                  <span class="text-base-content/70 mr-2">{{
                                      getDocumentIcon(doc.type)
                                  }}</span>
                                  <div>
                                      <div class="font-bold">
                                          {{ doc.title || "未命名文档" }}
                                      </div>
                                  </div>
                              </div>
                          </td>
                          <td>
                              <div class="badge badge-outline badge-sm">
                                  {{ getDocumentTypeText(doc.type) }}
                              </div>
                          </td>
                          <td>
                              <div
                                  class="badge badge-sm whitespace-nowrap"
                                  :class="{
                                      'badge-success': doc.status === 'PUBLISHED',
                                      'badge-warning': doc.status === 'DRAFT',
                                      'badge-neutral': doc.status === 'ARCHIVED',
                                      'badge-error': doc.status === 'DELETED',
                                  }"
                              >
                                  {{ getDocumentStatusText(doc.status) }}
                              </div>
                          </td>
                          <td>
                              <div class="flex items-center gap-3">
                                  <div class="avatar">
                                      <div class="w-8 h-8 rounded-full overflow-hidden">
                                          <img
                                              :src="doc.creator?.avatar || '/avatar_1.webp'"
                                              :alt="doc.creator?.nickname || doc.creator?.username || '未知'"
                                              class="w-full h-full object-cover"
                                              @error="(e) => handleAvatarError(e, doc.creator?.nickname || doc.creator?.username || '未知')"
                                          />
                                      </div>
                                  </div>
                                  <div>
                                      <div class="font-bold text-sm">
                                          {{
                                              doc.creator?.nickname ||
                                              doc.creator?.username ||
                                              "未知"
                                          }}
                                      </div>
                                  </div>
                              </div>
                          </td>
                          <td>
                              <div
                                  v-if="doc.lastModifier"
                                  class="flex items-center gap-3"
                              >
                                  <div class="avatar">
                                      <div class="w-8 h-8 rounded-full overflow-hidden">
                                          <img
                                              :src="doc.lastModifier.avatar || '/avatar_1.webp'"
                                              :alt="doc.lastModifier.nickname || doc.lastModifier.username || '未知'"
                                              class="w-full h-full object-cover"
                                              @error="(e) => handleAvatarError(e, doc.lastModifier.nickname || doc.lastModifier.username || '未知')"
                                          />
                                      </div>
                                  </div>
                                  <div>
                                      <div class="font-bold text-sm">
                                          {{
                                              doc.lastModifier.nickname ||
                                              doc.lastModifier.username ||
                                              "未知"
                                          }}
                                      </div>
                                  </div>
                              </div>
                              <span v-else class="text-base-content/50"
                                  >-</span
                              >
                          </td>
                          <td>
                              <div class="text-sm">
                                  {{ formatDate(doc.updatedAt) }}
                              </div>
                          </td>
                          <td>
                              <button
                                  v-if="doc.status === 'DELETED'"
                                  class="btn btn-ghost btn-xs cursor-not-allowed opacity-50"
                                  disabled
                              >
                                  已删除
                              </button>
                              <button
                                  v-else
                                  class="btn btn-ghost btn-xs"
                                  @click.stop="openDocument(doc.id)"
                              >
                                  查看
                              </button>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <!-- 空状态 -->
          <div v-else class="text-center py-12 text-base-content/60">
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-16 w-16 mx-auto mb-4 opacity-30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
              >
                  <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
              </svg>
              <p class="text-lg mb-2">暂无最近文档</p>
              <p class="text-sm">开始创建您的第一个文档吧</p>
          </div>
      </div>
  </div>

  <!-- 搜索模态窗口 -->
  <div v-if="showSearchModal" class="modal modal-open">
    <div class="modal-box w-11/12 max-w-4xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-lg">搜索结果</h3>
        <button class="btn btn-sm btn-circle btn-ghost" @click="showSearchModal = false">✕</button>
      </div>

      <!-- 加载状态 -->
      <div v-if="searchLoading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- 搜索结果 -->
      <div v-else-if="searchResults" class="space-y-6">
        <!-- 知识库结果 -->
        <div v-if="searchResults.workspaces && searchResults.workspaces.length > 0">
          <h4 class="font-semibold text-base mb-3 flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            知识库 ({{ searchResults.workspaces.length }})
          </h4>
          <div class="grid gap-3">
            <div v-for="workspace in searchResults.workspaces" :key="workspace.id"
                 class="card bg-base-100 border hover:shadow-md cursor-pointer transition-all"
                 @click="navigateTo(`/knowledgeBase/${workspace.id}`)">
              <div class="card-body p-4">
                <div class="flex items-center space-x-3">
                  <div class="avatar placeholder">
                    <div class="bg-primary text-primary-content rounded-full w-10">
                      <span class="text-sm">{{ getInitial(workspace.name) }}</span>
                    </div>
                  </div>
                  <div class="flex-1">
                    <h5 class="font-medium">{{ workspace.name }}</h5>
                    <p class="text-sm text-base-content/70">{{ workspace.description || '暂无描述' }}</p>
                    <div class="text-xs text-base-content/50 mt-1">
                      {{ workspace.documentCount || 0 }} 个文档
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 文档结果 -->
        <div v-if="searchResults.documents && searchResults.documents.length > 0">
          <h4 class="font-semibold text-base mb-3 flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            文档 ({{ searchResults.documents.length }})
          </h4>
          <div class="grid gap-3">
            <div v-for="document in searchResults.documents" :key="document.id"
                 class="card bg-base-100 border hover:shadow-md cursor-pointer transition-all"
                 @click="openDocument(document.id)">
              <div class="card-body p-4">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0">
                    <div class="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1">
                    <h5 class="font-medium">{{ document.title }}</h5>
                    <p class="text-sm text-base-content/70 mt-1">
                      创建者: {{ document.creator?.nickname || document.creator?.username || '未知' }}
                    </p>
                    <div class="flex items-center space-x-4 text-xs text-base-content/50 mt-2">
                      <span class="badge badge-sm" :class="{
                        'badge-success': document.status === 'PUBLISHED',
                        'badge-warning': document.status === 'DRAFT',
                        'badge-info': document.status === 'ARCHIVED'
                      }">
                        {{ document.status === 'PUBLISHED' ? '已发布' :
                           document.status === 'DRAFT' ? '草稿' :
                           document.status === 'ARCHIVED' ? '已归档' : document.status }}
                      </span>
                      <span>{{ new Date(document.updatedAt).toLocaleDateString() }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无结果 -->
        <div v-if="(!searchResults.workspaces || searchResults.workspaces.length === 0) &&
                   (!searchResults.documents || searchResults.documents.length === 0)"
             class="text-center py-8">
          <svg class="w-16 h-16 mx-auto text-base-content/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <p class="text-lg mb-2">未找到相关内容</p>
          <p class="text-sm text-base-content/70">尝试使用其他关键词搜索</p>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn" @click="showSearchModal = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useDashboardStore } from "~/stores/dashboard";
import { useWorkspaceStore } from "~/stores/workspace";
import { useDocumentStore } from "~/stores/documentStore";
import { useSearchStore } from "~/stores/search";

definePageMeta({
  layout: "default",
});

const dashboardStore = useDashboardStore();
const workspaceStore = useWorkspaceStore();
const documentStore = useDocumentStore();
const searchStore = useSearchStore();

const searchKeyword = ref("");
const showCreateDocModal = ref(false);
const showSearchModal = ref(false);
const searchResults = ref(null);
const searchLoading = ref(false);

// Toast 提示函数
const showToast = (message, type = 'info') => {
    // 创建 toast 元素
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} fixed top-4 right-4 z-50 w-auto max-w-md shadow-lg`;
    toast.innerHTML = `
        <div class="flex items-center">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${type === 'error' ?
                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>' :
                    type === 'warning' ?
                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>' :
                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
                }
            </svg>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(toast);

    // 3秒后自动移除
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
};

// 页面初始化
onMounted(async () => {
  try {
      console.log('主页开始加载仪表板数据...')
      await dashboardStore.fetchUserDashboard();
      console.log('主页仪表板数据加载完成:', dashboardStore.userDashboard)
  } catch (error) {
      console.error("初始化仪表板失败:", error);
      dashboardStore.setError("无法加载仪表板数据");
  }
});

// 打开文档
const { $axios } = useNuxtApp();
const openDocument = async (id) => {
    try {
        console.log('尝试打开文档:', id);

        const res = await $axios(`/api/documents/${id}`, {
            method: "GET",
        });

        console.log('文档详情响应:', res.data);

        // 检查文档状态
        if (res.data.status === 'DELETED') {
            // 显示已删除提示
            showToast('该文档已被删除，无法访问', 'error');
            // 刷新仪表板数据以更新最近文档列表
            await refreshDashboard();
            return;
        }

        // 设置知识库信息
        workspaceStore.workspaceId = res.data.workspace.id;
        workspaceStore.currentWorkspace = res.data.workspace;

        // 跳转到文档页面
        navigateTo(`/document/${res.data.id}`);

    } catch (error) {
        console.error('获取文档详情失败:', error);

        // 根据错误类型显示不同的提示
        if (error.response?.status === 404) {
            showToast('文档不存在或已被删除', 'error');
        } else if (error.response?.status === 403) {
            showToast('您没有权限访问该文档', 'warning');
        } else {
            showToast('无法访问该文档，请稍后重试', 'error');
        }

        // 刷新仪表板数据
        await refreshDashboard();
    }
};

// 处理已删除文档的点击
const showDeletedDocumentAlert = (doc) => {
    showToast(`文档"${doc.title || '未命名文档'}"已被删除，无法访问`, 'warning');
};

// 刷新仪表板
const refreshDashboard = async () => {
  try {
      await dashboardStore.fetchUserDashboard();
  } catch (error) {
      console.error("刷新仪表板失败:", error);
      // 可以添加错误提示
      dashboardStore.setError("无法加载仪表板数据");
  }
};

// 搜索处理
const handleSearch = async () => {
  if (searchKeyword.value.trim()) {
      try {
          searchLoading.value = true;
          showSearchModal.value = true;

          // 执行搜索
          const result = await searchStore.performGlobalSearch({
              keyword: searchKeyword.value.trim(),
              type: 'ALL'
          });

          searchResults.value = result;
          // 清空搜索框
          searchKeyword.value = '';
      } catch (error) {
          console.error('搜索失败:', error);
      } finally {
          searchLoading.value = false;
      }
  }
};

// 获取首字母
function getInitial(name) {
  return name ? name.charAt(0) : "未";
}

// 获取文档图标
function getDocumentIcon(type) {
  switch (type) {
      case "RICH_TEXT":
          return "📄";
      case "MARKDOWN":
          return "📝";
      case "CODE":
          return "💻";
      default:
          return "📄";
  }
}

// 获取文档类型文本
function getDocumentTypeText(type) {
  switch (type) {
      case "RICH_TEXT":
          return "富文本";
      case "MARKDOWN":
          return "Markdown";
      case "CODE":
          return "代码";
      default:
          return "富文本";
  }
}

// 获取文档状态文本
function getDocumentStatusText(status) {
  switch (status) {
      case "DRAFT":
          return "草稿";
      case "PUBLISHED":
          return "已发布";
      case "ARCHIVED":
          return "已归档";
      case "DELETED":
          return "已删除";
      default:
          return "草稿";
  }
}

// 头像错误处理
function handleAvatarError(event, userName) {
  // 当头像加载失败时，替换为默认头像
  event.target.src = '/avatar_1.webp';
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
      return (
          "今天 " +
          date.toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
          })
      );
  } else if (days === 1) {
      return (
          "昨天 " +
          date.toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
          })
      );
  } else if (days < 7) {
      return `${days}天前`;
  } else {
      return (
          date.toLocaleDateString("zh-CN", {
              month: "2-digit",
              day: "2-digit",
          }) +
          " " +
          date.toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
          })
      );
  }
}
</script>

<style scoped>
/* 可以添加一些额外的样式来微调表格 */
.table th,
.table td {
  padding: 12px 16px;
  vertical-align: middle;
}
</style>
