<template>
  <div class="bg-base-100 p-4">
    <!-- 错误提示 -->
    <div v-if="workspaceStore.error || documentStore.error" class="alert alert-error mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ workspaceStore.error || documentStore.error }}</span>
      <button class="btn btn-sm btn-ghost" @click="clearErrors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <button
          @click="goBack"
          class="btn btn-ghost btn-sm btn-circle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div v-if="workspaceStore.currentWorkspace" class="flex items-center space-x-2">
          <span class="text-2xl">{{ workspaceStore.currentWorkspace.icon || '📁' }}</span>
          <h2 class="text-lg font-semibold text-base-content">{{ workspaceStore.currentWorkspace.name }}</h2>
          <div class="badge badge-sm" :class="{
            'badge-success': workspaceStore.currentWorkspace.visibility === 'PUBLIC',
            'badge-warning': workspaceStore.currentWorkspace.visibility === 'INTERNAL',
            'badge-ghost': workspaceStore.currentWorkspace.visibility === 'PRIVATE'
          }">
            {{ getVisibilityText(workspaceStore.currentWorkspace.visibility) }}
          </div>
        </div>
        <div v-else-if="workspaceStore.loading" class="flex items-center space-x-2">
          <span class="loading loading-spinner loading-sm"></span>
          <span>加载中...</span>
        </div>
      </div>

      <button class="btn btn-primary btn-sm" @click="showCreateDocModal = true">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新建文档
      </button>
    </div>
    <!-- 加载状态 -->
    <div v-if="documentStore.loading && documentStore.documents.length === 0" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- 文档列表 -->
    <div v-else-if="documentStore.documents.length > 0" class="overflow-x-hidden">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th class="min-w-36 overflow-ellipsis">文档名称</th>
            <th class="min-w-28">类型</th>
            <th class="min-w-16">状态</th>
            <th class="min-w-32">创建人</th>
            <th class="min-w-40">最后修改</th>
            <th class="min-w-28">更新时间</th>
            <th class="min-w-40">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="doc in documentStore.documents"
            :key="doc.id"
            class="hover:bg-base-200 cursor-pointer transition-all duration-200 group"
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
              <div class="badge badge-sm whitespace-nowrap" :class="{
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
              <div class="flex space-x-1">
                <button
                  class="btn btn-ghost btn-xs group-hover:opacity-100 transition-opacity"
                  @click.stop="openDocument(doc.id)"
                >
                  查看
                </button>
                <button
                  class="btn btn-ghost btn-xs group-hover:opacity-100 transition-opacity text-error"
                  @click.stop="deleteDocument(doc.id)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 加载更多 -->
      <div v-if="documentStore.hasMore" class="flex justify-center py-4">
        <button class="btn btn-outline btn-sm" @click="loadMoreDocuments" :disabled="documentStore.loading">
          <span v-if="documentStore.loading" class="loading loading-spinner loading-sm"></span>
          {{ documentStore.loading ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>
    <!-- 空状态 -->
    <div v-else class="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-base-content/60">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-48 w-48 mb-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-2xl mb-6 font-semibold text-base-content/70">暂无文档</p>
      <p class="text-base-content/50 mb-6 text-center">
        该知识库还没有任何文档，点击创建开始记录
      </p>
      <button
        class="btn btn-primary btn-md"
        @click="showCreateDocModal = true"
      >
        创建文档
      </button>
    </div>

    <!-- 新建文档弹窗 -->
    <div v-if="showCreateDocModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div class="bg-base-100 rounded-xl shadow-xl w-full max-w-md p-8 relative">
        <button class="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="onCancelDoc">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M6 18L18 6"/></svg>
        </button>
        <h2 class="text-xl font-bold mb-6 flex items-center">
          <span class="mr-2">新建文档</span>
        </h2>
        <form @submit.prevent="onCreateDoc">
          <div class="mb-4">
            <label class="block text-base-content font-semibold mb-1">标题 <span class="text-red-500">*</span></label>
            <input
              v-model="docForm.title"
              required
              maxlength="50"
              placeholder="请输入文档标题"
              class="input input-bordered w-full bg-base-100"
            />
          </div>
          <div class="mb-4">
            <label class="block text-base-content font-semibold mb-1">类型</label>
            <select v-model="docForm.type" class="select select-bordered w-full bg-base-100">
              <option value="RICH_TEXT">富文本</option>
              <option value="MARKDOWN">Markdown</option>
              <option value="CODE">代码</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-base-content font-semibold mb-1">内容</label>
            <textarea
              v-model="docForm.content"
              maxlength="1000"
              placeholder="请输入文档内容（可选）"
              class="textarea textarea-bordered w-full bg-base-100"
              rows="5"
            />
          </div>
          <div class="flex justify-end space-x-4">
            <button type="button" class="btn btn-ghost" @click="onCancelDoc">取消</button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="!docForm.title || documentStore.loading"
            >
              <span v-if="documentStore.loading" class="loading loading-spinner loading-sm"></span>
              {{ documentStore.loading ? '创建中...' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'
import { useDocumentStore } from '~/stores/documentStore'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const documentStore = useDocumentStore()

const showCreateDocModal = ref(false)
const docForm = ref({
  title: '',
  content: '',
  type: 'RICH_TEXT'
})

// 页面初始化
onMounted(async () => {
  const workspaceId = Number(route.params.id)
  if (workspaceId) {
    // 获取知识库详情
    await workspaceStore.fetchWorkspaceById(workspaceId)
    // 获取文档列表
    await documentStore.fetchDocumentsByWorkspace(workspaceId, { refresh: true })
  }
})

// 打开文档
const openDocument = (id) => {
  navigateTo(`/document/${id}`)
}

// 返回知识库列表
const goBack = () => {
  navigateTo('/knowledgeHome')
}

// 清除错误
const clearErrors = () => {
  workspaceStore.clearError()
  documentStore.clearError()
}

// 创建文档
async function onCreateDoc() {
  if (docForm.value.title && workspaceStore.currentWorkspace) {
    try {
      const documentData = {
        title: docForm.value.title,
        content: docForm.value.content,
        type: docForm.value.type,
        workspaceId: workspaceStore.currentWorkspace.id
      }

      const newDocument = await documentStore.createDocument(documentData)
      showCreateDocModal.value = false
      docForm.value = { title: '', content: '', type: 'RICH_TEXT' }

      // 跳转到新创建的文档
      navigateTo(`/document/${newDocument.id}`)
    } catch (error) {
      // 错误已在store中处理
    }
  }
}

// 取消创建文档
function onCancelDoc() {
  showCreateDocModal.value = false
  docForm.value = { title: '', content: '', type: 'RICH_TEXT' }
}

// 删除文档
async function deleteDocument(id) {
  if (confirm('确定要删除这个文档吗？此操作不可恢复。')) {
    try {
      await documentStore.deleteDocument(id)
    } catch (error) {
      // 错误已在store中处理
    }
  }
}

// 加载更多文档
async function loadMoreDocuments() {
  const workspaceId = Number(route.params.id)
  if (workspaceId) {
    const nextPage = documentStore.pagination.page + 1
    await documentStore.fetchDocumentsByWorkspace(workspaceId, { page: nextPage })
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

// 获取可见性文本
function getVisibilityText(visibility) {
  switch (visibility) {
    case 'PUBLIC': return '公开'
    case 'INTERNAL': return '内部'
    case 'PRIVATE': return '私有'
    default: return '私有'
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