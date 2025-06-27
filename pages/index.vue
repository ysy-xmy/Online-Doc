<template>
  <div class="bg-base-100 p-6">
    <!-- 错误提示 -->
    <div v-if="dashboardStore.error" class="alert alert-error mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ dashboardStore.error }}</span>
      <button class="btn btn-sm btn-ghost" @click="dashboardStore.clearError()">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- 欢迎区域 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-base-content mb-2">欢迎回来！</h1>
      <p class="text-base-content/70">继续您的协作之旅</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="stat bg-base-200 rounded-lg">
        <div class="stat-figure text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        <div class="stat-title">知识库总数</div>
        <div class="stat-value text-primary">{{ dashboardStore.userDashboard?.totalWorkspaces || 0 }}</div>
      </div>

      <div class="stat bg-base-200 rounded-lg">
        <div class="stat-figure text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <div class="stat-title">文档总数</div>
        <div class="stat-value text-secondary">{{ dashboardStore.userDashboard?.totalDocuments || 0 }}</div>
      </div>

      <div class="stat bg-base-200 rounded-lg">
        <div class="stat-figure text-accent">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="stat-title">今日创建</div>
        <div class="stat-value text-accent">{{ dashboardStore.statistics.documentsCreatedToday }}</div>
      </div>

      <div class="stat bg-base-200 rounded-lg">
        <div class="stat-figure text-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        <div class="stat-title">活跃协作者</div>
        <div class="stat-value text-info">{{ dashboardStore.statistics.activeCollaborators }}</div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            快速创建
          </h2>
          <p>开始新的协作项目</p>
          <div class="card-actions justify-end">
            <button class="btn btn-primary btn-sm" @click="navigateTo('/knowledgeHome')">
              新建知识库
            </button>
            <button class="btn btn-secondary btn-sm" @click="showCreateDocModal = true">
              新建文档
            </button>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            搜索
          </h2>
          <p>快速找到您需要的内容</p>
          <div class="card-actions justify-end">
            <div class="form-control">
              <div class="input-group">
                <input
                  type="text"
                  placeholder="搜索文档或知识库..."
                  class="input input-bordered input-sm"
                  v-model="searchKeyword"
                  @keyup.enter="handleSearch"
                />
                <button class="btn btn-square btn-sm" @click="handleSearch">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
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
        <button class="btn btn-ghost btn-sm" @click="refreshDashboard" :disabled="dashboardStore.loading">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{ 'animate-spin': dashboardStore.loading }">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="dashboardStore.loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- 文档列表 -->
      <div v-else-if="dashboardStore.recentDocuments.length > 0" class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>文档名称</th>
              <th>类型</th>
              <th>状态</th>
              <th>创建人</th>
              <th>最后修改</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="doc in dashboardStore.recentDocuments"
              :key="doc.id"
              class="cursor-pointer hover:bg-base-200 transition-all duration-200 group"
              @click="openDocument(doc.id)"
            >
              <td class="group-hover:text-primary transition-colors">
                <div class="flex items-center space-x-2">
                  <span class="text-base-content/70">{{ getDocumentIcon(doc.type) }}</span>
                  <span>{{ doc.title }}</span>
                </div>
              </td>
              <td>
                <div class="badge badge-sm badge-outline">
                  {{ getDocumentTypeText(doc.type) }}
                </div>
              </td>
              <td>
                <div class="badge badge-sm" :class="{
                  'badge-success': doc.status === 'PUBLISHED',
                  'badge-warning': doc.status === 'DRAFT',
                  'badge-error': doc.status === 'ARCHIVED'
                }">
                  {{ getDocumentStatusText(doc.status) }}
                </div>
              </td>
              <td class="group-hover:text-base-content/80 transition-colors">
                <div class="flex items-center space-x-2">
                  <div class="avatar avatar-xs">
                    <div class="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs">
                      {{ doc.creator.nickname?.[0] || doc.creator.username[0] }}
                    </div>
                  </div>
                  <span>{{ doc.creator.nickname || doc.creator.username }}</span>
                </div>
              </td>
              <td class="group-hover:text-base-content/80 transition-colors">
                <div v-if="doc.lastModifier" class="flex items-center space-x-2">
                  <div class="avatar avatar-xs">
                    <div class="w-6 h-6 rounded-full bg-secondary text-secondary-content flex items-center justify-center text-xs">
                      {{ doc.lastModifier.nickname?.[0] || doc.lastModifier.username[0] }}
                    </div>
                  </div>
                  <span>{{ doc.lastModifier.nickname || doc.lastModifier.username }}</span>
                </div>
                <span v-else class="text-base-content/50">-</span>
              </td>
              <td class="group-hover:text-base-content/80 transition-colors">
                {{ formatDate(doc.updatedAt) }}
              </td>
              <td>
                <button class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  查看
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-12 text-base-content/60">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-lg mb-2">暂无最近文档</p>
        <p class="text-sm">开始创建您的第一个文档吧</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDashboardStore } from '~/stores/dashboard'
import { useWorkspaceStore } from '~/stores/workspace'
import { useDocumentStore } from '~/stores/documentStore'

definePageMeta({
  layout: 'default'
})

const dashboardStore = useDashboardStore()
const workspaceStore = useWorkspaceStore()
const documentStore = useDocumentStore()

const searchKeyword = ref('')
const showCreateDocModal = ref(false)

// 页面初始化
onMounted(async () => {
  await dashboardStore.fetchUserDashboard()
})

// 打开文档
const openDocument = (id) => {
  navigateTo(`/document/${id}`)
}

// 刷新仪表板
const refreshDashboard = async () => {
  await dashboardStore.fetchUserDashboard()
}

// 搜索处理
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    // 跳转到搜索页面或执行搜索逻辑
    navigateTo(`/search?q=${encodeURIComponent(searchKeyword.value)}`)
  }
}

// 获取文档图标
function getDocumentIcon(type) {
  switch (type) {
    case 'RICH_TEXT': return '📄'
    case 'MARKDOWN': return '📝'
    case 'CODE': return '💻'
    default: return '📄'
  }
}

// 获取文档类型文本
function getDocumentTypeText(type) {
  switch (type) {
    case 'RICH_TEXT': return '富文本'
    case 'MARKDOWN': return 'Markdown'
    case 'CODE': return '代码'
    default: return '富文本'
  }
}

// 获取文档状态文本
function getDocumentStatusText(status) {
  switch (status) {
    case 'DRAFT': return '草稿'
    case 'PUBLISHED': return '已发布'
    case 'ARCHIVED': return '已归档'
    case 'DELETED': return '已删除'
    default: return '草稿'
  }
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' +
           date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
}
</script>

<style scoped>
.table th:first-child {
  width: 40%;
}
</style> 