<template>
  <div v-if="show" class="fixed inset-0 flex items-center justify-center z-50" @click.self="close">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
      <!-- 头部 -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 class="text-xl font-bold text-gray-900">选择模板</h2>
          <p class="text-gray-600 text-sm mt-1">选择一个模板快速创建文档</p>
        </div>
        <button class="p-2 hover:bg-gray-100 rounded-full transition-colors" @click="close">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 搜索和筛选 -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索模板..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @input="onSearch"
            />
          </div>
          <div class="sm:w-48">
            <select
              v-model="selectedCategory"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @change="onCategoryChange"
            >
              <option value="">全部分类</option>
              <option v-for="category in categories" :key="category.key" :value="category.key">
                {{ category.icon }} {{ category.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 模板列表 -->
      <div class="p-6 overflow-y-auto max-h-[60vh]">
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>

        <div v-else-if="error" class="text-center py-8">
          <div class="text-red-500 mb-2">{{ error }}</div>
          <button class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors" @click="loadTemplates">重试</button>
        </div>

        <div v-else-if="filteredTemplates.length === 0" class="text-center py-8">
          <div class="text-gray-500">没有找到匹配的模板</div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="template in filteredTemplates"
            :key="template.id"
            :class="[
              'bg-white border rounded-lg cursor-pointer transition-all p-4',
              selectedTemplate?.id === template.id
                ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            ]"
            @click="selectTemplate(template)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 :class="[
                  'font-semibold text-sm mb-1',
                  selectedTemplate?.id === template.id ? 'text-blue-900' : 'text-gray-900'
                ]">{{ template.name }}</h3>
                <p :class="[
                  'text-xs mb-2 line-clamp-2',
                  selectedTemplate?.id === template.id ? 'text-blue-700' : 'text-gray-600'
                ]">{{ template.description }}</p>

                <div class="flex items-center gap-2 text-xs">
                  <span :class="[
                    'px-2 py-1 rounded text-xs',
                    selectedTemplate?.id === template.id
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-gray-100 text-gray-700'
                  ]">{{ getCategoryName(template.category) }}</span>
                  <span :class="selectedTemplate?.id === template.id ? 'text-blue-600' : 'text-gray-500'">
                    使用 {{ template.usageCount }} 次
                  </span>
                </div>
              </div>

              <div class="text-2xl ml-2">{{ getCategoryIcon(template.category) }}</div>
            </div>

            <!-- 标签 -->
            <div v-if="template.tags && template.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="tag in template.tags.slice(0, 3)"
                :key="tag"
                :class="[
                  'px-2 py-1 rounded text-xs',
                  selectedTemplate?.id === template.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-blue-50 text-blue-700'
                ]"
              >
                {{ tag }}
              </span>
              <span
                v-if="template.tags.length > 3"
                :class="[
                  'px-2 py-1 rounded text-xs',
                  selectedTemplate?.id === template.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-50 text-gray-600'
                ]"
              >
                +{{ template.tags.length - 3 }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 创建文档表单 -->
      <div v-if="selectedTemplate" class="p-6 border-t border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">创建文档</h3>
          <button
            class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            @click="cancelCreate"
          >
            重新选择模板
          </button>
        </div>

        <!-- 选中的模板信息 -->
        <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg relative">
          <!-- 选中状态指示器 -->
          <div class="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-2xl">{{ getCategoryIcon(selectedTemplate.category) }}</div>
            <div class="flex-1">
              <h4 class="font-medium text-blue-900">{{ selectedTemplate.name }}</h4>
              <p class="text-sm text-blue-700">{{ selectedTemplate.description }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                  {{ getCategoryName(selectedTemplate.category) }}
                </span>
                <span class="text-xs text-blue-600">已选择</span>
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">文档名称</label>
            <input
              v-model="documentTitle"
              type="text"
              placeholder="请输入文档名称"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">选择知识库</label>
            <select
              v-model="selectedWorkspaceId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择知识库</option>
              <option v-for="workspace in workspaceStore.workspaces" :key="workspace.id" :value="workspace.id">
                {{ workspace.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors" @click="cancelCreate">取消</button>
          <button
            class="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!documentTitle.trim() || !selectedWorkspaceId"
            @click="createDocument"
          >
            创建文档
          </button>
        </div>
      </div>

      <!-- 底部 -->
      <div v-else class="flex justify-end gap-2 p-6 border-t border-gray-200">
        <button class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors" @click="close">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplateStore } from '~/stores/template'
import { useDocumentStore } from '~/stores/documentStore'
import { useWorkspaceStore } from '~/stores/workspace'
import type { TemplateDTO } from '~/api/template'

interface Props {
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'template-selected'])

const router = useRouter()
const templateStore = useTemplateStore()
const documentStore = useDocumentStore()
const workspaceStore = useWorkspaceStore()

const searchKeyword = ref('')
const selectedCategory = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const selectedTemplate = ref<TemplateDTO | null>(null)
const documentTitle = ref('')
const selectedWorkspaceId = ref<number | null>(null)

const categories = [
  { key: 'MEETING', name: '会议记录', icon: '📝' },
  { key: 'PROJECT', name: '项目文档', icon: '📋' },
  { key: 'REPORT', name: '报告总结', icon: '📊' },
  { key: 'KNOWLEDGE', name: '知识文档', icon: '📚' },
  { key: 'OTHER', name: '其他', icon: '📄' }
]

// 默认模板数据
const defaultTemplates: TemplateDTO[] = [
  {
    id: 1,
    name: '会议记录模板',
    description: '标准会议记录模板，包含会议基本信息、议程、讨论内容和行动项',
    content: '<h1>会议记录</h1><h2>会议基本信息</h2><p><strong>会议主题：</strong></p><p><strong>会议时间：</strong></p><p><strong>会议地点：</strong></p><p><strong>参会人员：</strong></p><h2>会议议程</h2><ol><li>议程项目1</li><li>议程项目2</li></ol><h2>讨论内容</h2><p>讨论内容...</p><h2>决议事项</h2><ul><li>决议1</li><li>决议2</li></ul>',
    contentJson: '{"ops":[{"insert":"会议记录"},{"attributes":{"header":1},"insert":"\\n"}]}',
    category: 'MEETING',
    tags: ['会议', '记录', '办公'],
    isPublic: true,
    usageCount: 25,
    creator: { id: 1, username: 'admin', nickname: '管理员' },
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 2,
    name: '项目计划模板',
    description: '项目规划和管理模板，包含项目概述、目标、里程碑和资源分配',
    content: '<h1>项目计划</h1><h2>项目概述</h2><p><strong>项目名称：</strong></p><p><strong>项目经理：</strong></p><p><strong>开始时间：</strong></p><p><strong>预计结束时间：</strong></p><h2>项目目标</h2><ul><li>目标1</li><li>目标2</li></ul><h2>项目里程碑</h2><table><tr><th>里程碑</th><th>时间</th><th>负责人</th></tr><tr><td></td><td></td><td></td></tr></table>',
    contentJson: '{"ops":[{"insert":"项目计划"},{"attributes":{"header":1},"insert":"\\n"}]}',
    category: 'PROJECT',
    tags: ['项目', '计划', '管理'],
    isPublic: true,
    usageCount: 18,
    creator: { id: 1, username: 'admin', nickname: '管理员' },
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 3,
    name: '周报模板',
    description: '周工作报告模板，包含本周工作总结、下周工作计划等',
    content: '<h1>周报</h1><p><strong>报告人：</strong></p><p><strong>报告周期：</strong></p><h2>本周工作总结</h2><h3>已完成工作</h3><ul><li>工作项1</li><li>工作项2</li></ul><h3>工作亮点</h3><p>本周工作亮点...</p><h2>下周工作计划</h2><ul><li>计划1</li><li>计划2</li></ul><h2>需要支持</h2><p>需要的支持和资源...</p>',
    contentJson: '{"ops":[{"insert":"周报"},{"attributes":{"header":1},"insert":"\\n"}]}',
    category: 'REPORT',
    tags: ['周报', '总结', '汇报'],
    isPublic: true,
    usageCount: 32,
    creator: { id: 1, username: 'admin', nickname: '管理员' },
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 4,
    name: '产品需求文档',
    description: 'PRD模板，包含产品背景、需求分析、功能设计等',
    content: '<h1>产品需求文档</h1><h2>产品背景</h2><p>产品背景描述...</p><h2>需求分析</h2><h3>用户需求</h3><ul><li>需求1</li><li>需求2</li></ul><h3>业务需求</h3><ul><li>业务需求1</li><li>业务需求2</li></ul><h2>功能设计</h2><h3>核心功能</h3><p>功能描述...</p><h2>技术要求</h2><p>技术要求说明...</p>',
    contentJson: '{"ops":[{"insert":"产品需求文档"},{"attributes":{"header":1},"insert":"\\n"}]}',
    category: 'PROJECT',
    tags: ['产品', 'PRD', '需求'],
    isPublic: true,
    usageCount: 15,
    creator: { id: 1, username: 'admin', nickname: '管理员' },
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 5,
    name: '学习笔记模板',
    description: '知识学习和整理模板，适用于技术学习、读书笔记等',
    content: '<h1>学习笔记</h1><p><strong>学习主题：</strong></p><p><strong>学习时间：</strong></p><p><strong>学习来源：</strong></p><h2>核心要点</h2><ul><li>要点1</li><li>要点2</li><li>要点3</li></ul><h2>详细内容</h2><p>详细学习内容...</p><h2>实践应用</h2><p>如何应用所学知识...</p><h2>总结反思</h2><p>学习总结和反思...</p>',
    contentJson: '{"ops":[{"insert":"学习笔记"},{"attributes":{"header":1},"insert":"\\n"}]}',
    category: 'KNOWLEDGE',
    tags: ['学习', '笔记', '知识'],
    isPublic: true,
    usageCount: 28,
    creator: { id: 1, username: 'admin', nickname: '管理员' },
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 6,
    name: '技术方案设计',
    description: '技术方案设计文档模板，包含需求分析、技术选型、架构设计等',
    content: '<h1>技术方案设计</h1><h2>需求背景</h2><p>需求背景描述...</p><h2>技术选型</h2><h3>前端技术</h3><ul><li>技术1</li><li>技术2</li></ul><h3>后端技术</h3><ul><li>技术1</li><li>技术2</li></ul><h2>架构设计</h2><p>系统架构说明...</p><h2>实施计划</h2><p>开发计划和时间安排...</p>',
    contentJson: '{"ops":[{"insert":"技术方案设计"},{"attributes":{"header":1},"insert":"\\n"}]}',
    category: 'PROJECT',
    tags: ['技术', '方案', '设计'],
    isPublic: true,
    usageCount: 12,
    creator: { id: 1, username: 'admin', nickname: '管理员' },
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  }
]

const filteredTemplates = computed(() => {
  let templates = defaultTemplates

  if (selectedCategory.value) {
    templates = templates.filter(t => t.category === selectedCategory.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    templates = templates.filter(t =>
      t.name.toLowerCase().includes(keyword) ||
      t.description?.toLowerCase().includes(keyword) ||
      t.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  return templates
})

const getCategoryName = (category: string) => {
  return categories.find(c => c.key === category)?.name || category
}

const getCategoryIcon = (category: string) => {
  return categories.find(c => c.key === category)?.icon || '📄'
}

const loadTemplates = async () => {
  // 使用默认模板数据，无需从API加载
  loading.value = false
  error.value = null
}

const onSearch = () => {
  // 搜索是基于本地数据的，不需要重新请求
}

const onCategoryChange = () => {
  // 分类筛选是基于本地数据的，不需要重新请求
}

const selectTemplate = async (template: TemplateDTO) => {
  // 确保有工作空间
  if (workspaceStore.workspaces.length === 0) {
    await workspaceStore.fetchWorkspaces({ refresh: true })
  }

  if (workspaceStore.workspaces.length === 0) {
    alert('请先创建知识库')
    close()
    return
  }

  // 选择模板，显示创建表单
  selectedTemplate.value = template
  documentTitle.value = template.name // 默认使用模板名称
  selectedWorkspaceId.value = workspaceStore.workspaces[0]?.id || null // 默认选择第一个工作空间
}

const createDocument = async () => {
  if (!selectedTemplate.value || !documentTitle.value.trim() || !selectedWorkspaceId.value) {
    return
  }

  try {
    loading.value = true

    // 创建文档
    const newDoc = await documentStore.createDocument({
      title: documentTitle.value.trim(),
      content: selectedTemplate.value.content,
      contentJson: selectedTemplate.value.contentJson,
      workspaceId: selectedWorkspaceId.value,
      type: 'RICH_TEXT'
    })

    if (newDoc) {
      emit('template-selected', selectedTemplate.value)
      close()
      router.push(`/document/${newDoc.id}`)
    }
  } catch (error) {
    console.error('创建文档失败:', error)
    alert('创建文档失败，请重试')
  } finally {
    loading.value = false
  }
}

const cancelCreate = () => {
  selectedTemplate.value = null
  documentTitle.value = ''
  selectedWorkspaceId.value = null
}

const close = () => {
  // 重置状态
  selectedTemplate.value = null
  documentTitle.value = ''
  selectedWorkspaceId.value = null
  emit('close')
}

// 监听显示状态，打开时加载数据
watch(() => props.show, async (newShow) => {
  if (newShow) {
    loadTemplates()
    // 加载工作空间数据
    if (workspaceStore.workspaces.length === 0) {
      await workspaceStore.fetchWorkspaces({ refresh: true })
    }
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
