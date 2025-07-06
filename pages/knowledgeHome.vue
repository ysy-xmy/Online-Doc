<template>
  <div class="p-8">
    <h1 class="text-3xl font-extrabold mb-6 flex items-center text-base-content">
      知识库
      <span class="ml-2 text-gray-400 text-base">📁</span>
    </h1>

    <!-- 错误提示 -->
    <ErrorAlert
      :error="workspaceStore.error"
      :closable="true"
      @close="workspaceStore.clearError()"
    />

    <!-- 快捷操作卡片 -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="card card-compact bg-base-100 shadow-xl hover:bg-base-200 cursor-pointer transition-all" @click="showCreateDocModal = true">
        <div class="card-body flex flex-row items-center">
          <div class="mr-4 text-3xl">📄</div>
          <div>
            <h2 class="card-title text-base">新建文档</h2>
            <p class="text-gray-500 text-sm">快速开始协作</p>
          </div>
        </div>
      </div>

      <div class="card card-compact bg-base-100 shadow-xl hover:bg-base-200 cursor-pointer transition-all" @click="showTemplateModal = true">
        <div class="card-body flex flex-row items-center">
          <div class="mr-4 text-3xl">🧩</div>
          <div>
            <h2 class="card-title text-base">模板库</h2>
            <p class="text-gray-500 text-sm">选择模板快速创建</p>
          </div>
        </div>
      </div>

      <div class="card card-compact bg-base-100 shadow-xl hover:bg-base-200 cursor-pointer transition-all" @click="showModal = true">
        <div class="card-body flex flex-row items-center">
          <div class="mr-4 text-3xl">📚</div>
          <div>
            <h2 class="card-title text-base">新建知识库</h2>
            <p class="text-gray-500 text-sm">组织和管理知识</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 知识库列表 -->
    <div class="space-y-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">全部知识库</h2>
        <div class="flex items-center space-x-2">
          <button class="btn btn-ghost btn-circle btn-sm" @click="refreshWorkspaces" :disabled="workspaceStore.loading">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-5 h-5 stroke-current" :class="{ 'animate-spin': workspaceStore.loading }">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button class="btn btn-ghost btn-circle btn-sm" @click="showModal = true">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-5 h-5 stroke-current">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <LoadingSpinner
        v-if="workspaceStore.loading && workspaceStore.workspaces.length === 0"
        size="lg"
        text="加载知识库中..."
      />

      <!-- 空状态 -->
      <EmptyState
        v-else-if="!workspaceStore.loading && workspaceStore.workspaces.length === 0"
        title="暂无知识库"
        description="还没有创建任何知识库，点击创建开始管理您的知识"
      >
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </template>
        <template #actions>
          <button class="btn btn-primary" @click="showModal = true">
            创建知识库
          </button>
        </template>
      </EmptyState>

      <!-- 知识库网格 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WorkspaceCard
          v-for="workspace in workspaceStore.workspaces"
          :key="workspace.id"
          :workspace="workspace"
          @click="goToDetail"
          @delete="openDeleteModal"
        />
      </div>

      <!-- 加载更多 -->
      <div v-if="workspaceStore.hasMore" class="flex justify-center py-4">
        <button class="btn btn-outline" @click="loadMore" :disabled="workspaceStore.loading">
          <span v-if="workspaceStore.loading" class="loading loading-spinner loading-sm"></span>
          {{ workspaceStore.loading ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>

    <!-- 新建知识库弹窗 -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div class="bg-base-100 rounded-xl shadow-xl w-full max-w-md p-8 relative">
        <button class="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="onCancel">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M6 18L18 6"/></svg>
        </button>
        <h2 class="text-xl font-bold mb-6 flex items-center">
          <span class="mr-2">完善知识库信息</span>
        </h2>
        <form @submit.prevent="onCreate">
          <div class="mb-4">
            <label class="block text-base-content font-semibold mb-1">名称 <span class="text-red-500">*</span></label>
            <div class="flex items-center space-x-2">
              <div class="dropdown dropdown-bottom">
                <div tabindex="0" class="text-2xl mr-2 cursor-pointer hover:bg-base-200 rounded-lg p-1">
                  {{ form.emoji || generateEmojiFromName(form.name) }}
                </div>
                <div tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                  <div
                    v-for="emoji in emojiList"
                    :key="emoji"
                    class="text-xl cursor-pointer hover:bg-base-200 rounded p-1 flex items-center justify-center"
                    @click="selectCustomEmoji(emoji)"
                  >
                    {{ emoji }}
                  </div>
                </div>
              </div>
              <input
                v-model="form.name"
                required
                maxlength="20"
                placeholder="请输入名称"
                class="input input-bordered w-full bg-base-100"
              />
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-base-content font-semibold mb-1">简介</label>
            <input
              v-model="form.description"
              maxlength="50"
              placeholder="请输入简介"
              class="input input-bordered w-full bg-base-100"
            />
          </div>
          <div class="mb-6">
            <label class="block text-base-content font-semibold mb-1">可见范围</label>
            <div class="space-y-2">
              <label class="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="PRIVATE"
                  v-model="form.visibility"
                  class="radio radio-sm mr-2"
                />
                仅当前知识库成员可见
              </label>
              <label class="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="INTERNAL"
                  v-model="form.visibility"
                  class="radio radio-sm mr-2"
                />
                组织内部可见
              </label>
              <label class="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="PUBLIC"
                  v-model="form.visibility"
                  class="radio radio-sm mr-2"
                />
                所有人公开可见
              </label>
            </div>
          </div>
          <div class="flex justify-end space-x-4">
            <button type="button" class="btn btn-ghost" @click="onCancel">取消</button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="!form.name || workspaceStore.loading"
            >
              <span v-if="workspaceStore.loading" class="loading loading-spinner loading-sm"></span>
              {{ workspaceStore.loading ? '创建中...' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div class="bg-base-100 rounded-xl shadow-xl w-full max-w-sm p-8 relative">
        <h2 class="text-xl font-bold mb-6 flex items-center">
          <span class="mr-2 text-red-500">⚠️</span>确认删除
        </h2>
        <p class="mb-6">你确定要删除知识库 <span class="font-bold">{{ deleteTarget?.name }}</span> 吗？此操作不可恢复。</p>
        <div class="flex justify-end space-x-4">
          <button class="btn btn-ghost" @click="showDeleteModal = false" :disabled="workspaceStore.loading">取消</button>
          <button class="btn btn-error" @click="confirmDelete" :disabled="workspaceStore.loading">
            <span v-if="workspaceStore.loading" class="loading loading-spinner loading-sm"></span>
            {{ workspaceStore.loading ? '删除中...' : '删除' }}
          </button>
        </div>
      </div>
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
            <label class="block text-base-content font-semibold mb-1">选择知识库 <span class="text-red-500">*</span></label>
            <select
              v-model="docForm.workspaceId"
              required
              class="select select-bordered w-full bg-base-100"
            >
              <option value="">请选择知识库</option>
              <option
                v-for="workspace in workspaceStore.workspaces"
                :key="workspace.id"
                :value="workspace.id"
              >
                {{ workspace.icon || '📁' }} {{ workspace.name }}
              </option>
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
              :disabled="!docForm.title || !docForm.workspaceId"
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 模板选择弹窗 -->
    <TemplateSelectModal
      :show="showTemplateModal"
      @close="showTemplateModal = false"
      @template-selected="onTemplateSelected"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkspaceStore } from '~/stores/workspace'
import { useDocumentStore } from '~/stores/documentStore'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import EmptyState from '~/components/common/EmptyState.vue'
import WorkspaceCard from '~/components/workspace/WorkspaceCard.vue'
import TemplateSelectModal from '~/components/template/TemplateSelectModal.vue'

definePageMeta({
  layout: 'default'
})

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const documentStore = useDocumentStore()

const showModal = ref(false)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const showCreateDocModal = ref(false)
const showTemplateModal = ref(false)
const docForm = ref({
  title: '',
  content: '',
  workspaceId: null
})

const initialForm = () => ({
  name: '',
  description: '',
  icon: '',
  visibility: 'PRIVATE',
})
const form = ref(initialForm())

// 页面初始化
onMounted(async () => {
  await workspaceStore.fetchWorkspaces({ refresh: true })
})

// Emoji 列表
const emojiList = [
  '📘', '📗', '📙', '📒', '📓', '📔', '📕', '📖',
  '🗂️', '📂', '📁', '📃', '📄', '📊', '📈', '📉',
  '🏠', '🏢', '🏭', '🏫', '🏨', '🏪', '🏩', '💼',
  '📚', '🎓', '🌐', '💡', '🔬', '🚀', '🌟', '🎨',
  '💻', '🖥️', '📱', '🎮', '🏆', '🌈', '🍎', '🚲'
]

// 根据名称生成 emoji 的函数
function generateEmojiFromName(name) {
  if (!name) return '📁'

  // 使用名称的哈希值来确定 emoji
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash = hash & hash // 转换为 32bit 整数
  }

  // 使用哈希值选择 emoji
  return emojiList[Math.abs(hash) % emojiList.length]
}

// 自定义选择 emoji
function selectCustomEmoji(emoji) {
  form.value.icon = emoji
}

// 创建知识库
async function onCreate() {
  try {
    const workspaceData = {
      name: form.value.name,
      description: form.value.description,
      icon: form.value.icon || generateEmojiFromName(form.value.name),
      visibility: form.value.visibility
    }

    await workspaceStore.createWorkspace(workspaceData)
    showModal.value = false
    form.value = initialForm()
  } catch (error) {
    // 错误已在store中处理
  }
}

function onCancel() {
  showModal.value = false
  form.value = initialForm()
}

function goToDetail(workspace) {
  router.push(`/knowledgeBase/${workspace.id}`)
}

function openDeleteModal(workspace) {
  deleteTarget.value = workspace
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (deleteTarget.value) {
    try {
      await workspaceStore.deleteWorkspace(deleteTarget.value.id)
      showDeleteModal.value = false
      deleteTarget.value = null
    } catch (error) {
      // 错误已在store中处理
    }
  }
}

// 刷新知识库列表
async function refreshWorkspaces() {
  await workspaceStore.fetchWorkspaces({ refresh: true })
}

// 加载更多
async function loadMore() {
  const nextPage = workspaceStore.pagination.page + 1
  await workspaceStore.fetchWorkspaces({ page: nextPage })
}

function onCancelDoc() {
  showCreateDocModal.value = false
  docForm.value = { title: '', content: '', workspaceId: null }
}

async function onCreateDoc() {
  if (docForm.value.title && docForm.value.workspaceId) {
    try {
      const documentData = {
        title: docForm.value.title,
        content: docForm.value.content,
        workspaceId: docForm.value.workspaceId
      }

      const newDocument = await documentStore.createDocument(documentData)
      showCreateDocModal.value = false
      docForm.value = { title: '', content: '', workspaceId: null }

      // 跳转到新创建的文档
      router.push(`/document/${newDocument.id}`)
    } catch (error) {
      // 错误已在store中处理
    }
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

// 处理模板选择
function onTemplateSelected(document) {
  showTemplateModal.value = false
  // 跳转到新创建的文档
  if (document && document.id) {
    router.push(`/document/${document.id}`)
  }
}
</script>

<style scoped>
/* 如果需要添加自定义样式，可以在这里添加 */
.card {
  transition: all 0.3s ease;
}
/* 垃圾桶按钮美化 */
.btn-circle svg {
  display: block;
}
</style>
