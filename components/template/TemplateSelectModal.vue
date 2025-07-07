<template>
  <div v-if="show" class="fixed inset-0 flex items-center justify-center z-50" @click.self="close">
    <div class="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
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

      <!-- 主要内容区域 -->
      <div class="flex-1 flex overflow-hidden">
        <!-- 左侧：模板列表 -->
        <div class="w-1/2 border-r border-gray-200 flex flex-col">
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">模板列表</h3>
            <p class="text-sm text-gray-600">点击模板查看预览</p>
          </div>

          <div class="flex-1 overflow-y-auto p-4">
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

            <div v-else class="space-y-3">
              <div
                v-for="template in filteredTemplates"
                :key="template.id"
                :class="[
                  'bg-white border rounded-lg cursor-pointer transition-all p-3',
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
                        {{ template.usageCount }} 次
                      </span>
                    </div>
                  </div>

                  <div class="text-xl ml-2">{{ getCategoryIcon(template.category) }}</div>
                </div>

                <!-- 标签 -->
                <div v-if="template.tags && template.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
                  <span
                    v-for="tag in template.tags.slice(0, 2)"
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
                    v-if="template.tags.length > 2"
                    :class="[
                      'px-2 py-1 rounded text-xs',
                      selectedTemplate?.id === template.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-50 text-gray-600'
                    ]"
                  >
                    +{{ template.tags.length - 2 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：模板预览 -->
        <div class="w-1/2 flex flex-col">
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">模板预览</h3>
            <p class="text-sm text-gray-600">查看模板的详细内容</p>
          </div>

          <div class="flex-1 overflow-hidden">
            <div v-if="!selectedTemplate" class="flex items-center justify-center h-full text-gray-500">
              <div class="text-center">
                <div class="text-4xl mb-4">📄</div>
                <p>请选择一个模板查看预览</p>
              </div>
            </div>

            <div v-else class="h-full flex flex-col">
              <!-- 模板信息 -->
              <div class="p-4 bg-gray-50 border-b border-gray-200">
                <div class="flex items-center gap-3">
                  <div class="text-2xl">{{ getCategoryIcon(selectedTemplate.category) }}</div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-gray-900">{{ selectedTemplate.name }}</h4>
                    <p class="text-sm text-gray-600">{{ selectedTemplate.description }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {{ getCategoryName(selectedTemplate.category) }}
                      </span>
                      <span class="text-xs text-gray-500">使用 {{ selectedTemplate.usageCount }} 次</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 模板内容预览 -->
              <div class="flex-1 overflow-y-auto p-4">
                <div class="prose prose-sm max-w-none">
                  <div
                    class="template-preview-content"
                    v-html="selectedTemplate.content"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 创建文档表单 -->
      <div v-if="selectedTemplate" class="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-900">创建文档</h3>
          <button
            class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            @click="cancelCreate"
          >
            重新选择模板
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">文档名称</label>
            <input
              v-model="documentTitle"
              type="text"
              placeholder="请输入文档名称"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">选择知识库</label>
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
        <div class="flex justify-end gap-2 mt-4">
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
      <div v-else class="flex justify-end gap-2 p-4 border-t border-gray-200 flex-shrink-0">
        <button class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors" @click="close">关闭</button>
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
  { key: 'TECHNICAL', name: '技术文档', icon: '💻' },
  { key: 'OTHER', name: '其他', icon: '📄' }
]

// 默认模板数据
const defaultTemplates: TemplateDTO[] = [
  {
    id: 1,
    name: '会议记录模板',
    description: '标准会议记录模板，包含会议基本信息、议程、讨论内容和行动项',
    content: `<h1>📝 会议记录</h1>
<h2>📋 会议基本信息</h2>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
  <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; width: 120px;"><strong>会议主题</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[请填写会议主题]</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>会议时间</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD HH:MM - HH:MM]</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>会议地点</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[会议室/线上会议链接]</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>主持人</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[主持人姓名]</td></tr>
  <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>记录人</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[记录人姓名]</td></tr>
</table>

<h2>👥 参会人员</h2>
<ul>
  <li><strong>必须参加：</strong>[姓名1、姓名2、姓名3]</li>
  <li><strong>可选参加：</strong>[姓名4、姓名5]</li>
  <li><strong>实际参加：</strong>[实际到场人员]</li>
</ul>

<h2>📅 会议议程</h2>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
  <thead>
    <tr style="background: #f0f0f0;">
      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">时间</th>
      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">议程内容</th>
      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">负责人</th>
      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">预计时长</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding: 8px; border: 1px solid #ddd;">09:00-09:10</td><td style="padding: 8px; border: 1px solid #ddd;">开场介绍</td><td style="padding: 8px; border: 1px solid #ddd;">[负责人]</td><td style="padding: 8px; border: 1px solid #ddd;">10分钟</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #ddd;">09:10-09:30</td><td style="padding: 8px; border: 1px solid #ddd;">[议程项目1]</td><td style="padding: 8px; border: 1px solid #ddd;">[负责人]</td><td style="padding: 8px; border: 1px solid #ddd;">20分钟</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #ddd;">09:30-09:50</td><td style="padding: 8px; border: 1px solid #ddd;">[议程项目2]</td><td style="padding: 8px; border: 1px solid #ddd;">[负责人]</td><td style="padding: 8px; border: 1px solid #ddd;">20分钟</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #ddd;">09:50-10:00</td><td style="padding: 8px; border: 1px solid #ddd;">总结与下步计划</td><td style="padding: 8px; border: 1px solid #ddd;">[主持人]</td><td style="padding: 8px; border: 1px solid #ddd;">10分钟</td></tr>
  </tbody>
</table>

<h2>💬 讨论内容与决议</h2>
<h3>议题一：[议题名称]</h3>
<p><strong>讨论要点：</strong></p>
<ul>
  <li>[要点1]</li>
  <li>[要点2]</li>
  <li>[要点3]</li>
</ul>
<p><strong>决议：</strong>[具体决议内容]</p>

<h3>议题二：[议题名称]</h3>
<p><strong>讨论要点：</strong></p>
<ul>
  <li>[要点1]</li>
  <li>[要点2]</li>
</ul>
<p><strong>决议：</strong>[具体决议内容]</p>

<h2>✅ 行动项</h2>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
  <thead>
    <tr style="background: #f0f0f0;">
      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">行动项</th>
      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">负责人</th>
      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">截止时间</th>
      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">状态</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding: 8px; border: 1px solid #ddd;">[具体行动项1]</td><td style="padding: 8px; border: 1px solid #ddd;">[负责人]</td><td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td><td style="padding: 8px; border: 1px solid #ddd;">🔄 进行中</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #ddd;">[具体行动项2]</td><td style="padding: 8px; border: 1px solid #ddd;">[负责人]</td><td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td><td style="padding: 8px; border: 1px solid #ddd;">📋 待开始</td></tr>
  </tbody>
</table>

<h2>📎 附件与参考资料</h2>
<ul>
  <li>[相关文档链接或附件]</li>
  <li>[参考资料]</li>
</ul>

<h2>📝 备注</h2>
<p>[其他需要记录的信息]</p>`,
    contentJson: '{"ops":[{"insert":"📝 会议记录"},{"attributes":{"header":1},"insert":"\\n"},{"insert":"\\n📋 会议基本信息"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n会议主题\\t[会议主题]\\n会议时间\\t[YYYY-MM-DD HH:MM]\\n会议地点\\t[会议地点/线上会议链接]\\n主持人\\t[主持人姓名]\\n记录人\\t[记录人姓名]\\n参会人员\\t[参会人员列表]\\n\\n👥 参会人员"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n参会人员\\t部门/职位\\t联系方式\\n[姓名1]\\t[部门/职位]\\t[邮箱/电话]\\n[姓名2]\\t[部门/职位]\\t[邮箱/电话]\\n[姓名3]\\t[部门/职位]\\t[邮箱/电话]\\n\\n📝 会议议程"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n议程项\\t负责人\\t预计时间\\t实际时间\\n[议程项1]\\t[负责人]\\t[X分钟]\\t[X分钟]\\n[议程项2]\\t[负责人]\\t[X分钟]\\t[X分钟]\\n[议程项3]\\t[负责人]\\t[X分钟]\\t[X分钟]\\n\\n💬 会议内容"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n讨论主题一：[主题名称]"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n背景说明： [背景描述]\\n\\n讨论要点：\\n• [要点1：具体内容]\\n• [要点2：具体内容]\\n• [要点3：具体内容]\\n\\n达成共识： [共识内容]\\n\\n讨论主题二：[主题名称]"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n背景说明： [背景描述]\\n\\n讨论要点：\\n• [要点1：具体内容]\\n• [要点2：具体内容]\\n• [要点3：具体内容]\\n\\n达成共识： [共识内容]\\n\\n✅ 决策事项"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n决策编号\\t决策内容\\t负责人\\t截止时间\\t状态\\nDEC-001\\t[决策内容1]\\t[负责人]\\t[YYYY-MM-DD]\\t待执行\\nDEC-002\\t[决策内容2]\\t[负责人]\\t[YYYY-MM-DD]\\t待执行\\nDEC-003\\t[决策内容3]\\t[负责人]\\t[YYYY-MM-DD]\\t待执行\\n\\n📋 行动计划"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n任务编号\\t任务描述\\t负责人\\t协助人\\t截止时间\\t优先级\\nACT-001\\t[任务描述1]\\t[负责人]\\t[协助人]\\t[YYYY-MM-DD]\\t🔴 高\\nACT-002\\t[任务描述2]\\t[负责人]\\t[协助人]\\t[YYYY-MM-DD]\\t🟡 中\\nACT-003\\t[任务描述3]\\t[负责人]\\t[协助人]\\t[YYYY-MM-DD]\\t🟢 低\\n\\n⚠️ 风险与问题"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n识别的风险：\\n• 风险1： [风险描述] - 影响程度：[高/中/低] - 应对措施：[具体措施]\\n• 风险2： [风险描述] - 影响程度：[高/中/低] - 应对措施：[具体措施]\\n\\n待解决问题：\\n• 问题1： [问题描述] - 当前状态：[新发现/处理中/已解决]\\n• 问题2： [问题描述] - 当前状态：[新发现/处理中/已解决]\\n\\n📅 下次会议"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n下次会议时间： [YYYY-MM-DD HH:MM]\\n下次会议地点： [地点/线上链接]\\n下次会议议题：\\n• [议题1]\\n• [议题2]\\n• [议题3]\\n\\n📚 参考资料"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n• [参考资料]\\n\\n📝 备注"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n[其他需要记录的信息]\\n"}]}',
    category: 'MEETING',
    tags: ['会议', '记录', '办公', '协作'],
    isPublic: true,
    usageCount: 125,
    creator: { id: 1, username: 'admin', nickname: '管理员' },
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 2,
    name: '项目计划模板',
    description: '项目规划和管理模板，包含项目概述、目标、里程碑和资源分配',
    content: '<h1>📋 项目计划</h1><h2>📊 项目概述</h2><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; width: 120px;"><strong>项目名称</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[项目名称]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>项目经理</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[项目经理姓名]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>项目类型</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[产品开发/系统升级/业务优化]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>开始时间</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>预计结束</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>项目状态</strong></td><td style="padding: 8px; border: 1px solid #ddd;">🔄 规划中</td></tr></table><h2>🎯 项目目标</h2><h3>主要目标</h3><ul><li><strong>业务目标：</strong> [具体业务目标]</li><li><strong>技术目标：</strong> [具体技术目标]</li><li><strong>用户目标：</strong> [用户体验改进目标]</li></ul><h3>成功标准</h3><ul><li>[ ] [可量化的成功指标1]</li><li>[ ] [可量化的成功指标2]</li><li>[ ] [可量化的成功指标3]</li></ul><h2>👥 团队组织</h2><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr style="background: #f0f0f0;"><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">角色</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">姓名</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">职责</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">联系方式</th></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">项目经理</td><td style="padding: 8px; border: 1px solid #ddd;">[姓名]</td><td style="padding: 8px; border: 1px solid #ddd;">项目整体管理</td><td style="padding: 8px; border: 1px solid #ddd;">[邮箱/电话]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">技术负责人</td><td style="padding: 8px; border: 1px solid #ddd;">[姓名]</td><td style="padding: 8px; border: 1px solid #ddd;">技术架构设计</td><td style="padding: 8px; border: 1px solid #ddd;">[邮箱/电话]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">产品经理</td><td style="padding: 8px; border: 1px solid #ddd;">[姓名]</td><td style="padding: 8px; border: 1px solid #ddd;">需求管理</td><td style="padding: 8px; border: 1px solid #ddd;">[邮箱/电话]</td></tr></table><h2>🗓️ 项目里程碑</h2><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr style="background: #f0f0f0;"><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">里程碑</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">计划时间</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">负责人</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">交付物</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">状态</th></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">需求分析完成</td><td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td><td style="padding: 8px; border: 1px solid #ddd;">[负责人]</td><td style="padding: 8px; border: 1px solid #ddd;">需求文档</td><td style="padding: 8px; border: 1px solid #ddd;">📋 待开始</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">技术方案确定</td><td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td><td style="padding: 8px; border: 1px solid #ddd;">[负责人]</td><td style="padding: 8px; border: 1px solid #ddd;">技术方案文档</td><td style="padding: 8px; border: 1px solid #ddd;">📋 待开始</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">开发完成</td><td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td><td style="padding: 8px; border: 1px solid #ddd;">[负责人]</td><td style="padding: 8px; border: 1px solid #ddd;">功能代码</td><td style="padding: 8px; border: 1px solid #ddd;">📋 待开始</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">测试完成</td><td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td><td style="padding: 8px; border: 1px solid #ddd;">[负责人]</td><td style="padding: 8px; border: 1px solid #ddd;">测试报告</td><td style="padding: 8px; border: 1px solid #ddd;">📋 待开始</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">项目上线</td><td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td><td style="padding: 8px; border: 1px solid #ddd;">[负责人]</td><td style="padding: 8px; border: 1px solid #ddd;">上线报告</td><td style="padding: 8px; border: 1px solid #ddd;">📋 待开始</td></tr></table><h2>⚠️ 风险管理</h2><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr style="background: #f0f0f0;"><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">风险类型</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">风险描述</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">影响程度</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">应对措施</th></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">技术风险</td><td style="padding: 8px; border: 1px solid #ddd;">[具体技术风险]</td><td style="padding: 8px; border: 1px solid #ddd;">🔴 高</td><td style="padding: 8px; border: 1px solid #ddd;">[应对措施]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">进度风险</td><td style="padding: 8px; border: 1px solid #ddd;">[进度延期风险]</td><td style="padding: 8px; border: 1px solid #ddd;">🟡 中</td><td style="padding: 8px; border: 1px solid #ddd;">[应对措施]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">资源风险</td><td style="padding: 8px; border: 1px solid #ddd;">[人力资源不足]</td><td style="padding: 8px; border: 1px solid #ddd;">🟡 中</td><td style="padding: 8px; border: 1px solid #ddd;">[应对措施]</td></tr></table><h2>📈 项目监控</h2><p><strong>进度跟踪：</strong> 每周一次项目例会</p><p><strong>质量控制：</strong> 代码审查 + 自动化测试</p><p><strong>沟通机制：</strong> 日常沟通群 + 周报制度</p>',
    contentJson: '{"ops":[{"insert":"📋 项目计划"},{"attributes":{"header":1},"insert":"\\n"},{"insert":"\\n📊 项目概述"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n项目名称\\t[项目名称]\\n项目经理\\t[项目经理姓名]\\n项目类型\\t[产品开发/系统升级/业务优化]\\n开始时间\\t[YYYY-MM-DD]\\n预计结束\\t[YYYY-MM-DD]\\n项目状态\\t🔄 规划中\\n\\n🎯 项目目标"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n主要目标"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• 业务目标： [具体业务目标]\\n• 技术目标： [具体技术目标]\\n• 用户目标： [用户体验改进目标]\\n\\n成功标准"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n☐ [可量化的成功指标1]\\n☐ [可量化的成功指标2]\\n☐ [可量化的成功指标3]\\n\\n👥 团队组织"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n角色\\t姓名\\t职责\\t联系方式\\n项目经理\\t[姓名]\\t项目整体管理\\t[邮箱/电话]\\n技术负责人\\t[姓名]\\t技术架构设计\\t[邮箱/电话]\\n产品经理\\t[姓名]\\t需求管理\\t[邮箱/电话]\\n\\n🗓️ 项目里程碑"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n里程碑\\t计划时间\\t负责人\\t交付物\\t状态\\n需求分析完成\\t[YYYY-MM-DD]\\t[负责人]\\t需求文档\\t📋 待开始\\n技术方案确定\\t[YYYY-MM-DD]\\t[负责人]\\t技术方案文档\\t📋 待开始\\n开发完成\\t[YYYY-MM-DD]\\t[负责人]\\t功能代码\\t📋 待开始\\n测试完成\\t[YYYY-MM-DD]\\t[负责人]\\t测试报告\\t📋 待开始\\n项目上线\\t[YYYY-MM-DD]\\t[负责人]\\t上线报告\\t📋 待开始\\n\\n⚠️ 风险管理"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n风险类型\\t风险描述\\t影响程度\\t应对措施\\n技术风险\\t[具体技术风险]\\t🔴 高\\t[应对措施]\\n进度风险\\t[进度延期风险]\\t🟡 中\\t[应对措施]\\n资源风险\\t[人力资源不足]\\t🟡 中\\t[应对措施]\\n\\n📈 项目监控"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n进度跟踪： 每周一次项目例会\\n\\n质量控制： 代码审查 + 自动化测试\\n\\n沟通机制： 日常沟通群 + 周报制度\\n"}]}',
    category: 'PROJECT',
    tags: ['项目', '计划', '管理', '里程碑'],
    isPublic: true,
    usageCount: 89,
    creator: { id: 1, username: 'admin', nickname: '管理员' },
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 3,
    name: '周报模板',
    description: '周工作报告模板，包含本周工作总结、下周工作计划等',
    content: '<h1>📊 周工作报告</h1><h2>📋 基本信息</h2><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; width: 120px;"><strong>报告人</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[姓名]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>部门/团队</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[部门名称]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>报告周期</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD] 至 [YYYY-MM-DD]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>汇报对象</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[上级领导]</td></tr></table><h2>✅ 本周工作总结</h2><h3>已完成工作</h3><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr style="background: #f0f0f0;"><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">工作项</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">完成情况</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">耗时</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">备注</th></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">[工作项1]</td><td style="padding: 8px; border: 1px solid #ddd;">✅ 已完成</td><td style="padding: 8px; border: 1px solid #ddd;">[X小时]</td><td style="padding: 8px; border: 1px solid #ddd;">[备注信息]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">[工作项2]</td><td style="padding: 8px; border: 1px solid #ddd;">✅ 已完成</td><td style="padding: 8px; border: 1px solid #ddd;">[X小时]</td><td style="padding: 8px; border: 1px solid #ddd;">[备注信息]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">[工作项3]</td><td style="padding: 8px; border: 1px solid #ddd;">🔄 进行中</td><td style="padding: 8px; border: 1px solid #ddd;">[X小时]</td><td style="padding: 8px; border: 1px solid #ddd;">[进度说明]</td></tr></table><h3>🌟 本周亮点</h3><ul><li><strong>[亮点1]：</strong> [具体描述和成果]</li><li><strong>[亮点2]：</strong> [具体描述和成果]</li><li><strong>[亮点3]：</strong> [具体描述和成果]</li></ul><h3>📊 数据指标</h3><ul><li><strong>工作完成率：</strong> [X%]</li><li><strong>任务按时完成率：</strong> [X%]</li><li><strong>其他关键指标：</strong> [具体数据]</li></ul><h2>📅 下周工作计划</h2><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr style="background: #f0f0f0;"><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">工作项</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">优先级</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">预计耗时</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">预期成果</th></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">[计划工作项1]</td><td style="padding: 8px; border: 1px solid #ddd;">🔴 高</td><td style="padding: 8px; border: 1px solid #ddd;">[X小时]</td><td style="padding: 8px; border: 1px solid #ddd;">[预期成果]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">[计划工作项2]</td><td style="padding: 8px; border: 1px solid #ddd;">🟡 中</td><td style="padding: 8px; border: 1px solid #ddd;">[X小时]</td><td style="padding: 8px; border: 1px solid #ddd;">[预期成果]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">[计划工作项3]</td><td style="padding: 8px; border: 1px solid #ddd;">🟢 低</td><td style="padding: 8px; border: 1px solid #ddd;">[X小时]</td><td style="padding: 8px; border: 1px solid #ddd;">[预期成果]</td></tr></table><h2>🤝 需要支持</h2><h3>资源需求</h3><ul><li><strong>人力支持：</strong> [具体需求]</li><li><strong>技术支持：</strong> [具体需求]</li><li><strong>其他资源：</strong> [具体需求]</li></ul><h3>协调事项</h3><ul><li><strong>跨部门协作：</strong> [需要协调的事项]</li><li><strong>外部依赖：</strong> [依赖的外部资源或进度]</li></ul><h2>⚠️ 风险与问题</h2><h3>当前风险</h3><ul><li><strong>[风险1]：</strong> [风险描述] - 影响程度：[高/中/低] - 应对措施：[具体措施]</li><li><strong>[风险2]：</strong> [风险描述] - 影响程度：[高/中/低] - 应对措施：[具体措施]</li></ul><h3>遇到的问题</h3><ul><li><strong>[问题1]：</strong> [问题描述] - 当前状态：[已解决/处理中/待处理]</li><li><strong>[问题2]：</strong> [问题描述] - 当前状态：[已解决/处理中/待处理]</li></ul><h2>💭 思考与建议</h2><p><strong>工作反思：</strong></p><p>[对本周工作的反思和总结]</p><p><strong>改进建议：</strong></p><p>[对工作流程或方法的改进建议]</p><p><strong>学习收获：</strong></p><p>[本周的学习和成长收获]</p>',
    contentJson: '{"ops":[{"insert":"📊 周工作报告"},{"attributes":{"header":1},"insert":"\\n"},{"insert":"\\n📋 基本信息"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n报告人\\t[姓名]\\n部门/团队\\t[部门名称]\\n报告周期\\t[YYYY-MM-DD] 至 [YYYY-MM-DD]\\n汇报对象\\t[上级领导]\\n\\n✅ 本周工作总结"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n已完成工作"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n工作项\\t完成情况\\t耗时\\t备注\\n[工作项1]\\t✅ 已完成\\t[X小时]\\t[备注信息]\\n[工作项2]\\t✅ 已完成\\t[X小时]\\t[备注信息]\\n[工作项3]\\t🔄 进行中\\t[X小时]\\t[进度说明]\\n\\n🌟 本周亮点"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• [亮点1]： [具体描述和成果]\\n• [亮点2]： [具体描述和成果]\\n• [亮点3]： [具体描述和成果]\\n\\n📊 数据指标"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• 工作完成率： [X%]\\n• 任务按时完成率： [X%]\\n• 其他关键指标： [具体数据]\\n\\n📅 下周工作计划"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n工作项\\t优先级\\t预计耗时\\t预期成果\\n[计划工作项1]\\t🔴 高\\t[X小时]\\t[预期成果]\\n[计划工作项2]\\t🟡 中\\t[X小时]\\t[预期成果]\\n[计划工作项3]\\t🟢 低\\t[X小时]\\t[预期成果]\\n\\n🤝 需要支持"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n资源需求"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• 人力支持： [具体需求]\\n• 技术支持： [具体需求]\\n• 其他资源： [具体需求]\\n\\n协调事项"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• 跨部门协作： [需要协调的事项]\\n• 外部依赖： [依赖的外部资源或进度]\\n\\n⚠️ 风险与问题"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n当前风险"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• [风险1]： [风险描述] - 影响程度：[高/中/低] - 应对措施：[具体措施]\\n• [风险2]： [风险描述] - 影响程度：[高/中/低] - 应对措施：[具体措施]\\n\\n遇到的问题"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• [问题1]： [问题描述] - 当前状态：[已解决/处理中/待处理]\\n• [问题2]： [问题描述] - 当前状态：[已解决/处理中/待处理]\\n\\n💭 思考与建议"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n工作反思：\\n\\n[对本周工作的反思和总结]\\n\\n改进建议：\\n\\n[对工作流程或方法的改进建议]\\n\\n学习收获：\\n\\n[本周的学习和成长收获]\\n"}]}',
    category: 'REPORT',
    tags: ['周报', '总结', '汇报', '计划'],
    isPublic: true,
    usageCount: 156,
    creator: { id: 1, username: 'admin', nickname: '管理员' },
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 4,
    name: '产品需求文档',
    description: 'PRD模板，包含产品背景、需求分析、功能设计等',
    content: '<h1>📱 产品需求文档 (PRD)</h1><h2>📋 文档信息</h2><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; width: 120px;"><strong>产品名称</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[产品名称]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>版本号</strong></td><td style="padding: 8px; border: 1px solid #ddd;">v1.0</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>产品经理</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[产品经理姓名]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>创建时间</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>更新时间</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD]</td></tr></table><h2>🎯 产品概述</h2><h3>产品背景</h3><p><strong>市场背景：</strong></p><p>[描述当前市场环境和机会]</p><p><strong>用户痛点：</strong></p><ul><li>[痛点1：具体描述用户遇到的问题]</li><li>[痛点2：具体描述用户遇到的问题]</li><li>[痛点3：具体描述用户遇到的问题]</li></ul><p><strong>产品定位：</strong></p><p>[产品的核心定位和价值主张]</p><h3>产品目标</h3><ul><li><strong>业务目标：</strong> [具体的业务指标，如用户增长、收入提升等]</li><li><strong>用户目标：</strong> [用户体验改善目标]</li><li><strong>技术目标：</strong> [技术架构或性能目标]</li></ul><h2>👥 目标用户</h2><h3>用户画像</h3><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr style="background: #f0f0f0;"><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">用户类型</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">特征描述</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">核心需求</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">使用场景</th></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">主要用户</td><td style="padding: 8px; border: 1px solid #ddd;">[年龄、职业、行为特征]</td><td style="padding: 8px; border: 1px solid #ddd;">[核心需求描述]</td><td style="padding: 8px; border: 1px solid #ddd;">[主要使用场景]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">次要用户</td><td style="padding: 8px; border: 1px solid #ddd;">[年龄、职业、行为特征]</td><td style="padding: 8px; border: 1px solid #ddd;">[核心需求描述]</td><td style="padding: 8px; border: 1px solid #ddd;">[主要使用场景]</td></tr></table><h2>📝 需求分析</h2><h3>功能需求</h3><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr style="background: #f0f0f0;"><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">需求编号</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">功能名称</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">优先级</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">需求描述</th></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">REQ-001</td><td style="padding: 8px; border: 1px solid #ddd;">[功能名称1]</td><td style="padding: 8px; border: 1px solid #ddd;">🔴 高</td><td style="padding: 8px; border: 1px solid #ddd;">[详细功能描述]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">REQ-002</td><td style="padding: 8px; border: 1px solid #ddd;">[功能名称2]</td><td style="padding: 8px; border: 1px solid #ddd;">🟡 中</td><td style="padding: 8px; border: 1px solid #ddd;">[详细功能描述]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">REQ-003</td><td style="padding: 8px; border: 1px solid #ddd;">[功能名称3]</td><td style="padding: 8px; border: 1px solid #ddd;">🟢 低</td><td style="padding: 8px; border: 1px solid #ddd;">[详细功能描述]</td></tr></table><h3>非功能需求</h3><ul><li><strong>性能要求：</strong> [响应时间、并发用户数等]</li><li><strong>安全要求：</strong> [数据安全、用户隐私等]</li><li><strong>兼容性：</strong> [浏览器兼容、设备兼容等]</li><li><strong>可用性：</strong> [系统可用性指标]</li></ul><h2>🎨 功能设计</h2><h3>核心功能流程</h3><p><strong>功能1：[功能名称]</strong></p><ol><li>[步骤1：用户操作描述]</li><li>[步骤2：系统响应描述]</li><li>[步骤3：结果展示描述]</li></ol><p><strong>功能2：[功能名称]</strong></p><ol><li>[步骤1：用户操作描述]</li><li>[步骤2：系统响应描述]</li><li>[步骤3：结果展示描述]</li></ol><h3>界面设计要求</h3><ul><li><strong>设计风格：</strong> [简约/现代/商务等]</li><li><strong>色彩方案：</strong> [主色调和辅助色]</li><li><strong>交互原则：</strong> [易用性、一致性等原则]</li></ul><h2>🔧 技术要求</h2><h3>技术架构</h3><ul><li><strong>前端技术：</strong> [技术栈选择]</li><li><strong>后端技术：</strong> [技术栈选择]</li><li><strong>数据库：</strong> [数据库选择]</li><li><strong>部署方式：</strong> [云服务/本地部署]</li></ul><h3>接口规范</h3><ul><li><strong>API设计：</strong> RESTful API</li><li><strong>数据格式：</strong> JSON</li><li><strong>认证方式：</strong> [JWT/OAuth等]</li></ul><h2>📅 项目计划</h2><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr style="background: #f0f0f0;"><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">阶段</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">时间计划</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">主要工作</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">交付物</th></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">需求确认</td><td style="padding: 8px; border: 1px solid #ddd;">[开始日期-结束日期]</td><td style="padding: 8px; border: 1px solid #ddd;">需求评审、原型设计</td><td style="padding: 8px; border: 1px solid #ddd;">PRD、原型图</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">设计阶段</td><td style="padding: 8px; border: 1px solid #ddd;">[开始日期-结束日期]</td><td style="padding: 8px; border: 1px solid #ddd;">UI设计、交互设计</td><td style="padding: 8px; border: 1px solid #ddd;">设计稿</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">开发阶段</td><td style="padding: 8px; border: 1px solid #ddd;">[开始日期-结束日期]</td><td style="padding: 8px; border: 1px solid #ddd;">前后端开发</td><td style="padding: 8px; border: 1px solid #ddd;">功能代码</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">测试阶段</td><td style="padding: 8px; border: 1px solid #ddd;">[开始日期-结束日期]</td><td style="padding: 8px; border: 1px solid #ddd;">功能测试、性能测试</td><td style="padding: 8px; border: 1px solid #ddd;">测试报告</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">上线阶段</td><td style="padding: 8px; border: 1px solid #ddd;">[开始日期-结束日期]</td><td style="padding: 8px; border: 1px solid #ddd;">部署上线、用户培训</td><td style="padding: 8px; border: 1px solid #ddd;">上线报告</td></tr></table><h2>📊 成功指标</h2><ul><li><strong>用户指标：</strong> [日活用户数、用户留存率等]</li><li><strong>业务指标：</strong> [转化率、收入增长等]</li><li><strong>技术指标：</strong> [系统性能、稳定性等]</li></ul><h2>⚠️ 风险评估</h2><ul><li><strong>技术风险：</strong> [技术实现难点] - 应对措施：[具体措施]</li><li><strong>市场风险：</strong> [市场变化风险] - 应对措施：[具体措施]</li><li><strong>资源风险：</strong> [人力、时间风险] - 应对措施：[具体措施]</li></ul>',
    contentJson: '{"ops":[{"insert":"📱 产品需求文档 (PRD)"},{"attributes":{"header":1},"insert":"\\n"},{"insert":"\\n📋 文档信息"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n产品名称\\t[产品名称]\\n版本号\\tv1.0\\n产品经理\\t[产品经理姓名]\\n创建时间\\t[YYYY-MM-DD]\\n更新时间\\t[YYYY-MM-DD]\\n\\n🎯 产品概述"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n产品背景"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n市场背景：\\n\\n[描述当前市场环境和机会]\\n\\n用户痛点：\\n\\n• [痛点1：具体描述用户遇到的问题]\\n• [痛点2：具体描述用户遇到的问题]\\n• [痛点3：具体描述用户遇到的问题]\\n\\n产品定位：\\n\\n[产品的核心定位和价值主张]\\n\\n产品目标"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• 业务目标： [具体的业务指标，如用户增长、收入提升等]\\n• 用户目标： [用户体验改善目标]\\n• 技术目标： [技术架构或性能目标]\\n\\n👥 目标用户"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n用户画像"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n用户类型\\t特征描述\\t核心需求\\t使用场景\\n主要用户\\t[年龄、职业、行为特征]\\t[核心需求描述]\\t[主要使用场景]\\n次要用户\\t[年龄、职业、行为特征]\\t[核心需求描述]\\t[主要使用场景]\\n\\n📝 需求分析"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n功能需求"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n需求编号\\t功能名称\\t优先级\\t需求描述\\nREQ-001\\t[功能名称1]\\t🔴 高\\t[详细功能描述]\\nREQ-002\\t[功能名称2]\\t🟡 中\\t[详细功能描述]\\nREQ-003\\t[功能名称3]\\t🟢 低\\t[详细功能描述]\\n\\n非功能需求"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• 性能要求： [响应时间、并发用户数等]\\n• 安全要求： [数据安全、用户隐私等]\\n• 兼容性： [浏览器兼容、设备兼容等]\\n• 可用性： [系统可用性指标]\\n\\n🎨 功能设计"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n核心功能流程"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n功能1：[功能名称]\\n\\n1. [步骤1：用户操作描述]\\n2. [步骤2：系统响应描述]\\n3. [步骤3：结果展示描述]\\n\\n功能2：[功能名称]\\n\\n1. [步骤1：用户操作描述]\\n2. [步骤2：系统响应描述]\\n3. [步骤3：结果展示描述]\\n\\n界面设计要求"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• 设计风格： [简约/现代/商务等]\\n• 色彩方案： [主色调和辅助色]\\n• 交互原则： [易用性、一致性等原则]\\n\\n🔧 技术要求"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n技术架构"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• 前端技术： [技术栈选择]\\n• 后端技术： [技术栈选择]\\n• 数据库： [数据库选择]\\n• 部署方式： [云服务/本地部署]\\n\\n接口规范"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• API设计： RESTful API\\n• 数据格式： JSON\\n• 认证方式： [JWT/OAuth等]\\n\\n📅 项目计划"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n阶段\\t时间计划\\t主要工作\\t交付物\\n需求确认\\t[开始日期-结束日期]\\t需求评审、原型设计\\tPRD、原型图\\n设计阶段\\t[开始日期-结束日期]\\tUI设计、交互设计\\t设计稿\\n开发阶段\\t[开始日期-结束日期]\\t前后端开发\\t功能代码\\n测试阶段\\t[开始日期-结束日期]\\t功能测试、性能测试\\t测试报告\\n上线阶段\\t[开始日期-结束日期]\\t部署上线、用户培训\\t上线报告\\n\\n📊 成功指标"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n• 用户指标： [日活用户数、用户留存率等]\\n• 业务指标： [转化率、收入增长等]\\n• 技术指标： [系统性能、稳定性等]\\n\\n⚠️ 风险评估"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n• 技术风险： [技术实现难点] - 应对措施：[具体措施]\\n• 市场风险： [市场变化风险] - 应对措施：[具体措施]\\n• 资源风险： [人力、时间风险] - 应对措施：[具体措施]\\n"}]}',
    category: 'PROJECT',
    tags: ['产品', 'PRD', '需求', '设计'],
    isPublic: true,
    usageCount: 73,
    creator: { id: 1, username: 'admin', nickname: '管理员' },
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 5,
    name: '学习笔记模板',
    description: '知识学习和整理模板，适用于技术学习、读书笔记等',
    content: '<h1>📚 学习笔记</h1><h2>📋 学习信息</h2><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; width: 120px;"><strong>学习主题</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[学习的主题或课程名称]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>学习时间</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[YYYY-MM-DD] 或 [学习周期]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>学习来源</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[书籍/课程/文档/视频等]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>学习目标</strong></td><td style="padding: 8px; border: 1px solid #ddd;">[希望通过学习达到的目标]</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>难度等级</strong></td><td style="padding: 8px; border: 1px solid #ddd;">⭐⭐⭐ (1-5星)</td></tr></table><h2>🎯 学习目标</h2><ul><li>[ ] [具体学习目标1]</li><li>[ ] [具体学习目标2]</li><li>[ ] [具体学习目标3]</li></ul><h2>💡 核心要点</h2><h3>重点概念</h3><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr style="background: #f0f0f0;"><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">概念</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">定义</th><th style="padding: 10px; border: 1px solid #ddd; text-align: left;">重要程度</th></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">[概念1]</td><td style="padding: 8px; border: 1px solid #ddd;">[详细定义和解释]</td><td style="padding: 8px; border: 1px solid #ddd;">🔴 高</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">[概念2]</td><td style="padding: 8px; border: 1px solid #ddd;">[详细定义和解释]</td><td style="padding: 8px; border: 1px solid #ddd;">🟡 中</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">[概念3]</td><td style="padding: 8px; border: 1px solid #ddd;">[详细定义和解释]</td><td style="padding: 8px; border: 1px solid #ddd;">🟢 低</td></tr></table><h3>关键知识点</h3><ul><li><strong>[知识点1]：</strong> [详细说明和理解]</li><li><strong>[知识点2]：</strong> [详细说明和理解]</li><li><strong>[知识点3]：</strong> [详细说明和理解]</li></ul><h2>📖 详细内容</h2><h3>第一部分：[章节或模块名称]</h3><p><strong>主要内容：</strong></p><p>[详细的学习内容记录]</p><p><strong>关键公式/代码：</strong></p><pre><code>[重要的公式、代码片段或命令]</code></pre><p><strong>个人理解：</strong></p><p>[对这部分内容的个人理解和思考]</p><h3>第二部分：[章节或模块名称]</h3><p><strong>主要内容：</strong></p><p>[详细的学习内容记录]</p><p><strong>关键公式/代码：</strong></p><pre><code>[重要的公式、代码片段或命令]</code></pre><p><strong>个人理解：</strong></p><p>[对这部分内容的个人理解和思考]</p><h2>🛠️ 实践应用</h2><h3>实践项目</h3><p><strong>项目名称：</strong> [实践项目的名称]</p><p><strong>项目描述：</strong> [项目的具体内容和目标]</p><p><strong>实现步骤：</strong></p><ol><li>[步骤1：具体操作]</li><li>[步骤2：具体操作]</li><li>[步骤3：具体操作]</li></ol><p><strong>遇到的问题：</strong></p><ul><li><strong>[问题1]：</strong> [问题描述] - 解决方案：[具体解决方法]</li><li><strong>[问题2]：</strong> [问题描述] - 解决方案：[具体解决方法]</li></ul><h3>应用场景</h3><ul><li><strong>[场景1]：</strong> [具体应用场景和使用方法]</li><li><strong>[场景2]：</strong> [具体应用场景和使用方法]</li><li><strong>[场景3]：</strong> [具体应用场景和使用方法]</li></ul><h2>🤔 疑问与思考</h2><h3>待解决的疑问</h3><ul><li>❓ [疑问1：具体问题描述]</li><li>❓ [疑问2：具体问题描述]</li><li>❓ [疑问3：具体问题描述]</li></ul><h3>深入思考</h3><ul><li><strong>[思考点1]：</strong> [深入的思考和分析]</li><li><strong>[思考点2]：</strong> [深入的思考和分析]</li></ul><h2>📝 总结反思</h2><h3>学习收获</h3><ul><li><strong>知识收获：</strong> [学到的新知识和技能]</li><li><strong>能力提升：</strong> [能力方面的提升]</li><li><strong>思维转变：</strong> [思维方式的改变]</li></ul><h3>学习方法反思</h3><p><strong>有效的学习方法：</strong></p><p>[总结这次学习中有效的方法]</p><p><strong>需要改进的地方：</strong></p><p>[学习过程中需要改进的方面]</p><h3>下一步计划</h3><ul><li>[ ] [后续学习计划1]</li><li>[ ] [后续学习计划2]</li><li>[ ] [后续学习计划3]</li></ul><h2>📚 参考资料</h2><ul><li><strong>主要资料：</strong> [书籍、课程、文档等主要学习资料]</li><li><strong>补充资料：</strong> [相关的补充学习资料]</li><li><strong>实用工具：</strong> [学习过程中使用的工具和网站]</li></ul><h2>🏷️ 标签分类</h2><p><strong>技术标签：</strong> [相关的技术标签]</p><p><strong>难度标签：</strong> [初级/中级/高级]</p><p><strong>类型标签：</strong> [理论/实践/综合]</p>',
    contentJson: '{"ops":[{"insert":"📚 学习笔记"},{"attributes":{"header":1},"insert":"\\n"},{"insert":"\\n📋 学习信息"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n学习主题\\t[学习的主题或课程名称]\\n学习时间\\t[YYYY-MM-DD] 或 [学习周期]\\n学习来源\\t[书籍/课程/文档/视频等]\\n学习目标\\t[希望通过学习达到的目标]\\n难度等级\\t⭐⭐⭐ (1-5星)\\n\\n🎯 学习目标"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n☐ [具体学习目标1]\\n☐ [具体学习目标2]\\n☐ [具体学习目标3]\\n\\n💡 核心要点"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n重点概念"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n概念\\t定义\\t重要程度\\n[概念1]\\t[详细定义和解释]\\t🔴 高\\n[概念2]\\t[详细定义和解释]\\t🟡 中\\n[概念3]\\t[详细定义和解释]\\t🟢 低\\n\\n关键知识点"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• [知识点1]： [详细说明和理解]\\n• [知识点2]： [详细说明和理解]\\n• [知识点3]： [详细说明和理解]\\n\\n📖 详细内容"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n第一部分：[章节或模块名称]"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n主要内容：\\n\\n[详细的学习内容记录]\\n\\n关键公式/代码：\\n\\n[重要的公式、代码片段或命令]\\n\\n个人理解：\\n\\n[对这部分内容的个人理解和思考]\\n\\n第二部分：[章节或模块名称]"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n主要内容：\\n\\n[详细的学习内容记录]\\n\\n关键公式/代码：\\n\\n[重要的公式、代码片段或命令]\\n\\n个人理解：\\n\\n[对这部分内容的个人理解和思考]\\n\\n🛠️ 实践应用"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n实践项目"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n项目名称： [实践项目的名称]\\n\\n项目描述： [项目的具体内容和目标]\\n\\n实现步骤：\\n\\n1. [步骤1：具体操作]\\n2. [步骤2：具体操作]\\n3. [步骤3：具体操作]\\n\\n遇到的问题：\\n\\n• [问题1]： [问题描述] - 解决方案：[具体解决方法]\\n• [问题2]： [问题描述] - 解决方案：[具体解决方法]\\n\\n应用场景"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• [场景1]： [具体应用场景和使用方法]\\n• [场景2]： [具体应用场景和使用方法]\\n• [场景3]： [具体应用场景和使用方法]\\n\\n🤔 疑问与思考"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n待解决的疑问"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• ❓ [疑问1：具体问题描述]\\n• ❓ [疑问2：具体问题描述]\\n• ❓ [疑问3：具体问题描述]\\n\\n深入思考"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• [思考点1]： [深入的思考和分析]\\n• [思考点2]： [深入的思考和分析]\\n\\n📝 总结反思"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n学习收获"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• 知识收获： [学到的新知识和技能]\\n• 能力提升： [能力方面的提升]\\n• 思维转变： [思维方式的改变]\\n\\n学习方法反思"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n有效的学习方法：\\n\\n[总结这次学习中有效的方法]\\n\\n需要改进的地方：\\n\\n[学习过程中需要改进的方面]\\n\\n下一步计划"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n☐ [后续学习计划1]\\n☐ [后续学习计划2]\\n☐ [后续学习计划3]\\n\\n📚 参考资料"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n• 主要资料： [书籍、课程、文档等主要学习资料]\\n• 补充资料： [相关的补充学习资料]\\n• 实用工具： [学习过程中使用的工具和网站]\\n\\n🏷️ 标签分类"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n技术标签： [相关的技术标签]\\n\\n难度标签： [初级/中级/高级]\\n\\n类型标签： [理论/实践/综合]\\n"}]}',
    category: 'KNOWLEDGE',
    tags: ['学习', '笔记', '知识', '总结'],
    isPublic: true,
    usageCount: 94,
    creator: { id: 1, username: 'admin', nickname: '管理员' },
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 6,
    name: '技术方案设计',
    description: '技术方案设计文档模板，包含需求分析、技术选型、架构设计等',
    content: '<h1>💻 技术方案设计</h1><h2>📋 需求背景</h2><p><strong>项目名称：</strong> [项目名称]</p><p><strong>需求描述：</strong> [详细需求描述]</p><p><strong>业务目标：</strong> [业务目标说明]</p><h2>🔧 技术选型</h2><h3>前端技术栈</h3><ul><li><strong>框架：</strong> [Vue.js/React/Angular]</li><li><strong>UI库：</strong> [Element Plus/Ant Design/Material UI]</li><li><strong>构建工具：</strong> [Vite/Webpack/Rollup]</li></ul><h3>后端技术栈</h3><ul><li><strong>语言：</strong> [Java/Python/Node.js]</li><li><strong>框架：</strong> [Spring Boot/Django/Express]</li><li><strong>数据库：</strong> [MySQL/PostgreSQL/MongoDB]</li></ul><h3>部署运维</h3><ul><li><strong>容器化：</strong> [Docker/Kubernetes]</li><li><strong>云服务：</strong> [阿里云/腾讯云/AWS]</li><li><strong>监控：</strong> [Prometheus/Grafana]</li></ul><h2>🏗️ 架构设计</h2><h3>系统架构图</h3><p>[插入架构图或描述]</p><h3>核心模块</h3><ul><li><strong>用户模块：</strong> [功能描述]</li><li><strong>业务模块：</strong> [功能描述]</li><li><strong>数据模块：</strong> [功能描述]</li></ul><h2>📅 实施计划</h2><h3>开发阶段</h3><ul><li><strong>第一阶段：</strong> [时间] - [任务内容]</li><li><strong>第二阶段：</strong> [时间] - [任务内容]</li><li><strong>第三阶段：</strong> [时间] - [任务内容]</li></ul><h2>⚠️ 风险评估</h2><ul><li><strong>技术风险：</strong> [风险描述及应对方案]</li><li><strong>进度风险：</strong> [风险描述及应对方案]</li><li><strong>资源风险：</strong> [风险描述及应对方案]</li></ul>',
    contentJson: '{"ops":[{"insert":"💻 技术方案设计"},{"attributes":{"header":1},"insert":"\\n"},{"insert":"\\n📋 需求背景"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n项目名称： [项目名称]\\n\\n需求描述： [详细需求描述]\\n\\n业务目标： [业务目标说明]\\n\\n🔧 技术选型"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n前端技术栈"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• 框架： [Vue.js/React/Angular]\\n• UI库： [Element Plus/Ant Design/Material UI]\\n• 构建工具： [Vite/Webpack/Rollup]\\n\\n后端技术栈"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• 语言： [Java/Python/Node.js]\\n• 框架： [Spring Boot/Django/Express]\\n• 数据库： [MySQL/PostgreSQL/MongoDB]\\n\\n部署运维"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• 容器化： [Docker/Kubernetes]\\n• 云服务： [阿里云/腾讯云/AWS]\\n• 监控： [Prometheus/Grafana]\\n\\n🏗️ 架构设计"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n系统架构图"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n[插入架构图或描述]\\n\\n核心模块"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• 用户模块： [功能描述]\\n• 业务模块： [功能描述]\\n• 数据模块： [功能描述]\\n\\n📅 实施计划"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n开发阶段"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n• 第一阶段： [时间] - [任务内容]\\n• 第二阶段： [时间] - [任务内容]\\n• 第三阶段： [时间] - [任务内容]\\n\\n⚠️ 风险评估"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n• 技术风险： [风险描述及应对方案]\\n• 进度风险： [风险描述及应对方案]\\n• 资源风险： [风险描述及应对方案]\\n"}]}',
    category: 'TECHNICAL',
    tags: ['技术', '方案', '设计', '架构'],
    isPublic: true,
    usageCount: 42,
    creator: { id: 1, username: 'admin', nickname: '管理员' },
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 7,
    name: 'API接口文档',
    description: 'RESTful API接口文档模板，包含接口说明、参数、响应等',
    content: '<h1>📡 API接口文档</h1><h2>📖 接口概述</h2><p><strong>接口名称：</strong> [接口名称]</p><p><strong>接口描述：</strong> [接口功能描述]</p><p><strong>接口版本：</strong> v1.0</p><p><strong>基础URL：</strong> https://api.example.com</p><h2>🔐 认证方式</h2><p><strong>认证类型：</strong> Bearer Token</p><p><strong>Header：</strong> Authorization: Bearer {token}</p><h2>📋 接口列表</h2><h3>1. 用户登录</h3><p><strong>请求方式：</strong> POST</p><p><strong>请求路径：</strong> /api/auth/login</p><p><strong>请求参数：</strong></p><table style="width: 100%; border-collapse: collapse;"><tr style="background: #f0f0f0;"><th style="padding: 8px; border: 1px solid #ddd;">参数名</th><th style="padding: 8px; border: 1px solid #ddd;">类型</th><th style="padding: 8px; border: 1px solid #ddd;">必填</th><th style="padding: 8px; border: 1px solid #ddd;">说明</th></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">username</td><td style="padding: 8px; border: 1px solid #ddd;">string</td><td style="padding: 8px; border: 1px solid #ddd;">是</td><td style="padding: 8px; border: 1px solid #ddd;">用户名</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">password</td><td style="padding: 8px; border: 1px solid #ddd;">string</td><td style="padding: 8px; border: 1px solid #ddd;">是</td><td style="padding: 8px; border: 1px solid #ddd;">密码</td></tr></table><p><strong>请求示例：</strong></p><pre><code>{\n  "username": "admin",\n  "password": "123456"\n}</code></pre><p><strong>响应示例：</strong></p><pre><code>{\n  "code": 200,\n  "message": "登录成功",\n  "data": {\n    "token": "eyJhbGciOiJIUzI1NiIs...",\n    "user": {\n      "id": 1,\n      "username": "admin",\n      "nickname": "管理员"\n    }\n  }\n}</code></pre><h3>2. 获取用户信息</h3><p><strong>请求方式：</strong> GET</p><p><strong>请求路径：</strong> /api/user/info</p><p><strong>请求头：</strong> Authorization: Bearer {token}</p><p><strong>响应示例：</strong></p><pre><code>{\n  "code": 200,\n  "message": "获取成功",\n  "data": {\n    "id": 1,\n    "username": "admin",\n    "nickname": "管理员",\n    "email": "admin@example.com"\n  }\n}</code></pre><h2>📊 状态码说明</h2><table style="width: 100%; border-collapse: collapse;"><tr style="background: #f0f0f0;"><th style="padding: 8px; border: 1px solid #ddd;">状态码</th><th style="padding: 8px; border: 1px solid #ddd;">说明</th></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">200</td><td style="padding: 8px; border: 1px solid #ddd;">请求成功</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">400</td><td style="padding: 8px; border: 1px solid #ddd;">请求参数错误</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">401</td><td style="padding: 8px; border: 1px solid #ddd;">未授权</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">500</td><td style="padding: 8px; border: 1px solid #ddd;">服务器内部错误</td></tr></table>',
    contentJson: '{"ops":[{"insert":"📡 API接口文档"},{"attributes":{"header":1},"insert":"\\n"},{"insert":"\\n📖 接口概述"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n接口名称： [接口名称]\\n\\n接口描述： [接口功能描述]\\n\\n接口版本： v1.0\\n\\n基础URL： https://api.example.com\\n\\n🔐 认证方式"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n认证类型： Bearer Token\\n\\nHeader： Authorization: Bearer {token}\\n\\n📋 接口列表"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n1. 用户登录"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n请求方式： POST\\n\\n请求路径： /api/auth/login\\n\\n请求参数：\\n\\n参数名\\t类型\\t必填\\t说明\\nusername\\tstring\\t是\\t用户名\\npassword\\tstring\\t是\\t密码\\n\\n请求示例：\\n\\n{\\n  \\"username\\": \\"admin\\",\\n  \\"password\\": \\"123456\\"\\n}\\n\\n响应示例：\\n\\n{\\n  \\"code\\": 200,\\n  \\"message\\": \\"登录成功\\",\\n  \\"data\\": {\\n    \\"token\\": \\"eyJhbGciOiJIUzI1NiIs...\\",\\n    \\"user\\": {\\n      \\"id\\": 1,\\n      \\"username\\": \\"admin\\",\\n      \\"nickname\\": \\"管理员\\"\\n    }\\n  }\\n}\\n\\n2. 获取用户信息"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n请求方式： GET\\n\\n请求路径： /api/user/info\\n\\n请求头： Authorization: Bearer {token}\\n\\n响应示例：\\n\\n{\\n  \\"code\\": 200,\\n  \\"message\\": \\"获取成功\\",\\n  \\"data\\": {\\n    \\"id\\": 1,\\n    \\"username\\": \\"admin\\",\\n    \\"nickname\\": \\"管理员\\",\\n    \\"email\\": \\"admin@example.com\\"\\n  }\\n}\\n\\n📊 状态码说明"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n状态码\\t说明\\n200\\t请求成功\\n400\\t请求参数错误\\n401\\t未授权\\n500\\t服务器内部错误\\n"}]}',
    category: 'TECHNICAL',
    tags: ['API', '接口', '文档', '开发'],
    isPublic: true,
    usageCount: 38,
    creator: { id: 1, username: 'admin', nickname: '管理员' },
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  },
  {
    id: 8,
    name: '知识分享模板',
    description: '团队知识分享文档模板，适用于技术分享、经验总结等',
    content: '<h1>💡 知识分享</h1><h2>📋 分享信息</h2><p><strong>分享主题：</strong> [分享主题]</p><p><strong>分享人：</strong> [分享人姓名]</p><p><strong>分享时间：</strong> [YYYY-MM-DD]</p><p><strong>目标听众：</strong> [目标听众群体]</p><h2>🎯 分享目标</h2><ul><li>[目标1：希望听众了解什么]</li><li>[目标2：希望听众掌握什么技能]</li><li>[目标3：希望解决什么问题]</li></ul><h2>📚 背景介绍</h2><p><strong>问题背景：</strong></p><p>[描述遇到的问题或需要分享的背景]</p><p><strong>为什么重要：</strong></p><p>[说明这个知识点的重要性和价值]</p><h2>🔍 核心内容</h2><h3>知识点一：[知识点名称]</h3><p><strong>概念解释：</strong></p><p>[详细解释概念]</p><p><strong>应用场景：</strong></p><ul><li>[场景1]</li><li>[场景2]</li></ul><p><strong>示例代码/案例：</strong></p><pre><code>[代码示例或具体案例]</code></pre><h3>知识点二：[知识点名称]</h3><p><strong>概念解释：</strong></p><p>[详细解释概念]</p><p><strong>最佳实践：</strong></p><ul><li>[实践1]</li><li>[实践2]</li></ul><h2>⚡ 实战演示</h2><p><strong>演示场景：</strong> [具体演示什么]</p><p><strong>操作步骤：</strong></p><ol><li>[步骤1]</li><li>[步骤2]</li><li>[步骤3]</li></ol><p><strong>注意事项：</strong></p><ul><li>[注意事项1]</li><li>[注意事项2]</li></ul><h2>🤔 常见问题</h2><h3>Q: [常见问题1]</h3><p>A: [详细回答]</p><h3>Q: [常见问题2]</h3><p>A: [详细回答]</p><h2>📖 参考资料</h2><ul><li>[官方文档链接]</li><li>[相关文章链接]</li><li>[推荐书籍]</li></ul><h2>💬 讨论与反馈</h2><p>[欢迎大家提出问题和建议]</p>',
    contentJson: '{"ops":[{"insert":"💡 知识分享"},{"attributes":{"header":1},"insert":"\\n"},{"insert":"\\n📋 分享信息"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n分享主题： [分享主题]\\n\\n分享人： [分享人姓名]\\n\\n分享时间： [YYYY-MM-DD]\\n\\n目标听众： [目标听众群体]\\n\\n🎯 分享目标"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n• [目标1：希望听众了解什么]\\n• [目标2：希望听众掌握什么技能]\\n• [目标3：希望解决什么问题]\\n\\n📚 背景介绍"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n问题背景：\\n\\n[描述遇到的问题或需要分享的背景]\\n\\n为什么重要：\\n\\n[说明这个知识点的重要性和价值]\\n\\n🔍 核心内容"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n知识点一：[知识点名称]"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n概念解释：\\n\\n[详细解释概念]\\n\\n应用场景：\\n\\n• [场景1]\\n• [场景2]\\n\\n示例代码/案例：\\n\\n[代码示例或具体案例]\\n\\n知识点二：[知识点名称]"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\n概念解释：\\n\\n[详细解释概念]\\n\\n最佳实践：\\n\\n• [实践1]\\n• [实践2]\\n\\n⚡ 实战演示"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n演示场景： [具体演示什么]\\n\\n操作步骤：\\n\\n1. [步骤1]\\n2. [步骤2]\\n3. [步骤3]\\n\\n注意事项：\\n\\n• [注意事项1]\\n• [注意事项2]\\n\\n🤔 常见问题"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\nQ: [常见问题1]"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\nA: [详细回答]\\n\\nQ: [常见问题2]"},{"attributes":{"header":3},"insert":"\\n"},{"insert":"\\nA: [详细回答]\\n\\n📖 参考资料"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n• [官方文档链接]\\n• [相关文章链接]\\n• [推荐书籍]\\n\\n💬 讨论与反馈"},{"attributes":{"header":2},"insert":"\\n"},{"insert":"\\n[欢迎大家提出问题和建议]\\n"}]}',
    category: 'KNOWLEDGE',
    tags: ['知识', '分享', '学习', '团队'],
    isPublic: true,
    usageCount: 56,
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

/* 模板预览内容样式 */
.template-preview-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #374151;
}

.template-preview-content h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #111827;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.template-preview-content h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #1f2937;
}

.template-preview-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: #374151;
}

.template-preview-content p {
  margin-bottom: 0.75rem;
  color: #4b5563;
}

.template-preview-content ul,
.template-preview-content ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.template-preview-content li {
  margin-bottom: 0.25rem;
  color: #4b5563;
}

.template-preview-content table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.template-preview-content table th,
.template-preview-content table td {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  text-align: left;
}

.template-preview-content table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.template-preview-content table td {
  color: #4b5563;
}

.template-preview-content pre {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
}

.template-preview-content code {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #dc2626;
}

.template-preview-content strong {
  font-weight: 600;
  color: #111827;
}

.template-preview-content blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: #6b7280;
}

/* 滚动条样式 */
.template-preview-content::-webkit-scrollbar {
  width: 6px;
}

.template-preview-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.template-preview-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.template-preview-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
