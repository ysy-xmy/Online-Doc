<template>
  <div class="min-h-screen bg-base-200">
    <div class="container mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold">模板库</h1>
          <p class="text-base-content/70 mt-2">选择模板快速创建文档</p>
        </div>
        <button class="btn btn-primary" @click="showCreateModal = true">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5 mr-2">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          创建模板
        </button>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <div class="lg:w-1/4">
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <h3 class="card-title text-lg mb-4">筛选</h3>
              
              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">搜索</span>
                </label>
                <input
                  v-model="searchKeyword"
                  type="text"
                  placeholder="搜索模板..."
                  class="input input-bordered input-sm"
                  @input="onSearch"
                />
              </div>

              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">分类</span>
                </label>
                <select
                  v-model="selectedCategory"
                  class="select select-bordered select-sm"
                  @change="onCategoryChange"
                >
                  <option value="">全部分类</option>
                  <option v-for="category in templateStore.categories" :key="category.key" :value="category.key">
                    {{ category.icon }} {{ category.name }}
                  </option>
                </select>
              </div>

              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">类型</span>
                </label>
                <div class="space-y-2">
                  <label class="label cursor-pointer justify-start">
                    <input
                      v-model="showPublicOnly"
                      type="radio"
                      :value="true"
                      name="templateType"
                      class="radio radio-sm mr-2"
                      @change="onTypeChange"
                    />
                    <span class="label-text">公开模板</span>
                  </label>
                  <label class="label cursor-pointer justify-start">
                    <input
                      v-model="showPublicOnly"
                      type="radio"
                      :value="false"
                      name="templateType"
                      class="radio radio-sm mr-2"
                      @change="onTypeChange"
                    />
                    <span class="label-text">我的模板</span>
                  </label>
                  <label class="label cursor-pointer justify-start">
                    <input
                      v-model="showPublicOnly"
                      type="radio"
                      :value="null"
                      name="templateType"
                      class="radio radio-sm mr-2"
                      @change="onTypeChange"
                    />
                    <span class="label-text">全部模板</span>
                  </label>
                </div>
              </div>

              <button class="btn btn-outline btn-sm w-full" @click="clearFilters">
                清除筛选
              </button>
            </div>
          </div>
        </div>

        <div class="lg:w-3/4">
          <div v-if="templateStore.popularTemplates.length > 0" class="mb-8">
            <h2 class="text-xl font-bold mb-4">热门模板</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <TemplateCard
                v-for="template in templateStore.popularTemplates.slice(0, 6)"
                :key="template.id"
                :template="template"
                @click="viewTemplate"
                @use="useTemplate"
              />
            </div>
          </div>

          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold">
              {{ showPublicOnly === true ? '公开模板' : showPublicOnly === false ? '我的模板' : '全部模板' }}
              <span class="text-sm font-normal text-base-content/70">
                ({{ templateStore.pagination.total }} 个)
              </span>
            </h2>
            <div class="flex items-center space-x-2">
              <button
                class="btn btn-ghost btn-circle btn-sm"
                @click="refreshTemplates"
                :disabled="templateStore.loading"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-5 h-5 stroke-current" :class="{ 'animate-spin': templateStore.loading }">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="templateStore.loading && templateStore.templates.length === 0" class="flex justify-center py-12">
            <LoadingSpinner />
          </div>

          <div v-else-if="templateStore.error" class="py-12">
            <ErrorAlert :message="templateStore.error" @retry="refreshTemplates" />
          </div>

          <div v-else-if="templateStore.templates.length === 0" class="py-12">
            <EmptyState
              title="暂无模板"
              description="还没有找到符合条件的模板"
              icon="📄"
            />
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TemplateCard
              v-for="template in templateStore.templates"
              :key="template.id"
              :template="template"
              :show-actions="!showPublicOnly || showPublicOnly === false"
              @click="viewTemplate"
              @edit="editTemplate"
              @delete="deleteTemplate"
              @use="useTemplate"
            />
          </div>

          <div v-if="templateStore.hasMore" class="flex justify-center py-6">
            <button
              class="btn btn-outline"
              @click="loadMore"
              :disabled="templateStore.loading"
            >
              <span v-if="templateStore.loading" class="loading loading-spinner loading-sm"></span>
              {{ templateStore.loading ? '加载中...' : '加载更多' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <TemplateCreateModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="onTemplateCreated"
    />

    <TemplateEditModal
      v-if="showEditModal && editingTemplate"
      :template="editingTemplate"
      @close="showEditModal = false"
      @updated="onTemplateUpdated"
    />

    <TemplateViewModal
      v-if="showViewModal && viewingTemplate"
      :template="viewingTemplate"
      @close="showViewModal = false"
      @use="useTemplate"
    />

    <ConfirmModal
      v-if="showDeleteModal && deletingTemplate"
      title="删除模板"
      :message="`确定要删除模板「${deletingTemplate.name}」吗？此操作不可恢复。`"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplateStore } from '~/stores/template'
import { useDocumentStore } from '~/stores/document'
import { useWorkspaceStore } from '~/stores/workspace'
import type { TemplateDTO } from '~/api/template'

const router = useRouter()
const templateStore = useTemplateStore()
const documentStore = useDocumentStore()
const workspaceStore = useWorkspaceStore()

const searchKeyword = ref('')
const selectedCategory = ref('')
const showPublicOnly = ref<boolean | null>(null)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)

const editingTemplate = ref<TemplateDTO | null>(null)
const viewingTemplate = ref<TemplateDTO | null>(null)
const deletingTemplate = ref<TemplateDTO | null>(null)

const debounceTimer = ref<NodeJS.Timeout>()

onMounted(async () => {
  await Promise.all([
    templateStore.fetchCategories(),
    templateStore.fetchPopularTemplates(),
    templateStore.fetchTemplates({ refresh: true })
  ])
})

const onSearch = () => {
  clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => {
    templateStore.setFilters({ keyword: searchKeyword.value })
    refreshTemplates()
  }, 500)
}

const onCategoryChange = () => {
  templateStore.setFilters({ category: selectedCategory.value })
  refreshTemplates()
}

const onTypeChange = () => {
  templateStore.setFilters({ isPublic: showPublicOnly.value })
  refreshTemplates()
}

const clearFilters = () => {
  searchKeyword.value = ''
  selectedCategory.value = ''
  showPublicOnly.value = null
  templateStore.clearFilters()
  refreshTemplates()
}

const refreshTemplates = async () => {
  await templateStore.fetchTemplates({ refresh: true })
}

const loadMore = async () => {
  const nextPage = templateStore.pagination.page + 1
  await templateStore.fetchTemplates({ page: nextPage })
}

const viewTemplate = (template: TemplateDTO) => {
  viewingTemplate.value = template
  showViewModal.value = true
}

const editTemplate = (template: TemplateDTO) => {
  editingTemplate.value = template
  showEditModal.value = true
}

const deleteTemplate = (template: TemplateDTO) => {
  deletingTemplate.value = template
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (deletingTemplate.value) {
    try {
      await templateStore.deleteTemplate(deletingTemplate.value.id)
      showDeleteModal.value = false
      deletingTemplate.value = null
    } catch (error) {
      console.error('删除模板失败:', error)
    }
  }
}

const useTemplate = async (template: TemplateDTO) => {
  try {
    await templateStore.useTemplate(template.id)
    
    if (workspaceStore.workspaces.length === 0) {
      await workspaceStore.fetchWorkspaces({ refresh: true })
    }
    
    if (workspaceStore.workspaces.length === 0) {
      alert('请先创建知识库')
      router.push('/knowledgeHome')
      return
    }
    
    const defaultWorkspace = workspaceStore.workspaces[0]
    
    const newDoc = await documentStore.createDocument({
      title: `基于${template.name}的文档`,
      content: template.content,
      contentJson: template.contentJson,
      workspaceId: defaultWorkspace.id,
      type: 'RICH_TEXT'
    })
    
    if (newDoc) {
      router.push(`/document/${newDoc.id}`)
    }
  } catch (error) {
    console.error('使用模板失败:', error)
  }
}

const onTemplateCreated = (template: TemplateDTO) => {
  showCreateModal.value = false
  refreshTemplates()
}

const onTemplateUpdated = (template: TemplateDTO) => {
  showEditModal.value = false
  editingTemplate.value = null
  refreshTemplates()
}
</script>
