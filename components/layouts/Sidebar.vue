<template>
  <div class="w-64 bg-base-100 border-r border-base-content/10 p-4 shadow-sm">
    <div class="mb-6">
      <h2 class="text-xl font-bold text-base-content flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        {{ currentPageTitle }}
      </h2>
    </div>
    
    <!-- 侧边栏菜单 -->
    <ul class="menu p-0 space-y-1 w-full">
      <li class="menu-title">
        <span class="text-base-content/50">我的空间</span>
      </li>
      <li>
        <button 
          class="flex items-center w-full px-3 py-2 rounded-lg text-base-content hover:bg-primary hover:text-primary-content transition font-semibold mt-1" 
          type="button" 
          @click="navigateToHome"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          主页
        </button>
      </li>

      <li>
        <button 
          class="flex items-center w-full px-3 py-2 rounded-lg text-base-content hover:bg-primary hover:text-primary-content transition font-semibold mt-1" 
          type="button" 
          @click="navigateToKnowledgeBase"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2" />
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none" />
          </svg>
          知识库
        </button>
        
        <!-- 知识库二级菜单 -->
        <ul v-if="isKnowledgeBaseExpanded" class="menu-sub pl-4 space-y-1">
          <li v-for="menu in knowledgeBaseMenus" :key="menu.path">
            <button
              class="flex items-center w-full px-3 py-2 rounded-lg text-base-content hover:bg-primary/10 transition font-medium"
              @click="navigateToKnowledgeBasePage(menu.path, menu.name)"
            >
              <span class="text-lg mr-2">{{ menu.icon || '📁' }}</span>
              {{ menu.name }}
            </button>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWorkspaceStore } from '@/stores/workspace'

const router = useRouter()
const route = useRoute()

// 知识库二级菜单配置 - 从store获取真实数据
const workspaceStore = useWorkspaceStore()
const knowledgeBaseMenus = computed(() => {
  return workspaceStore.workspaces.map(workspace => ({
    name: workspace.name,
    path: `/knowledgeBase/${workspace.id}`,
    icon: workspace.icon
  }))
})

// 响应式页面标题和展开状态
const currentPageTitle = ref('主页')
const isKnowledgeBaseExpanded = ref(false)

// 更新页面标题的方法
const updatePageTitle = (title) => {
  currentPageTitle.value = title
}

// 导航到主页
const navigateToHome = () => {
  updatePageTitle('主页')
  router.push('/')
}

// 导航到知识库页面
const navigateToKnowledgeBase = () => {
  updatePageTitle('知识库')
  router.push('/knowledgeHome')
}

// 导航到知识库子页面
const navigateToKnowledgeBasePage = (path, name) => {
  updatePageTitle(name)
  router.push(path)
}

// 监听路由变化，自动更新页面标题
watch(() => route.path, (newPath) => {
  switch(newPath) {
    case '/':
      updatePageTitle('主页')
      isKnowledgeBaseExpanded.value = false
      break
    case '/knowledgeHome':
      updatePageTitle('知识库')
      isKnowledgeBaseExpanded.value = true
      break
    default:
      // 检查是否为知识库子页面
      if (newPath.startsWith('/knowledgeBase/')) {
        const workspaceId = newPath.split('/')[2]
        const workspace = workspaceStore.workspaces.find(w => w.id.toString() === workspaceId)
        if (workspace) {
          updatePageTitle(workspace.name)
        } else {
          updatePageTitle('知识库详情')
        }
        isKnowledgeBaseExpanded.value = true
      } else {
        updatePageTitle('主页')
        isKnowledgeBaseExpanded.value = false
      }
  }
}, { immediate: true })

// 组件挂载时获取知识库数据
onMounted(async () => {
  await workspaceStore.fetchWorkspaces({ refresh: true })
})
</script>

<style scoped>
/* 可以添加额外的样式 */
</style> 