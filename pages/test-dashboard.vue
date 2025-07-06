<template>
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">仪表板API测试页面</h1>
    
    <!-- 测试结果显示 -->
    <div class="space-y-4">
      <!-- 登录状态 -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">登录状态</h2>
          <p>Token: {{ token ? '已存在' : '不存在' }}</p>
          <p>用户信息: {{ userInfo }}</p>
        </div>
      </div>
      
      <!-- API测试结果 -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">API测试结果</h2>
          <div class="space-y-2">
            <button class="btn btn-primary" @click="testDashboardAPI">测试仪表板API</button>
            <button class="btn btn-secondary" @click="testWorkspaceAPI">测试知识库API</button>
            <button class="btn btn-accent" @click="testDocumentAPI">测试文档API</button>
          </div>
          
          <div v-if="loading" class="loading loading-spinner loading-lg"></div>
          
          <div v-if="testResults.length > 0" class="mt-4">
            <h3 class="text-lg font-semibold mb-2">测试结果:</h3>
            <div class="space-y-2">
              <div v-for="(result, index) in testResults" :key="index" 
                   :class="['alert', result.success ? 'alert-success' : 'alert-error']">
                <div>
                  <h4 class="font-semibold">{{ result.title }}</h4>
                  <p class="text-sm">{{ result.message }}</p>
                  <pre v-if="result.data" class="text-xs mt-2 overflow-auto">{{ JSON.stringify(result.data, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { dashboardApi } from '~/api/dashboard'
import { useUserStore } from '~/stores/user'

definePageMeta({
  layout: 'default'
})

const userStore = useUserStore()
const token = useCookie('token')
const userInfo = ref(null)
const loading = ref(false)
const testResults = ref([])

onMounted(() => {
  userStore.initUserInfo()
  userInfo.value = userStore.state
})

// 添加测试结果
const addTestResult = (title, success, message, data = null) => {
  testResults.value.unshift({
    title,
    success,
    message,
    data,
    timestamp: new Date().toLocaleTimeString()
  })
}

// 测试仪表板API
const testDashboardAPI = async () => {
  loading.value = true
  try {
    console.log('开始测试仪表板API...')
    const response = await dashboardApi.getUserDashboard()
    console.log('仪表板API响应:', response)
    
    addTestResult(
      '仪表板API测试',
      true,
      `成功获取数据，知识库数量: ${response.data?.userSummary?.totalWorkspaces || 0}, 文档数量: ${response.data?.userSummary?.totalDocuments || 0}`,
      response.data
    )
  } catch (error) {
    console.error('仪表板API测试失败:', error)
    addTestResult(
      '仪表板API测试',
      false,
      `请求失败: ${error.message}`,
      error
    )
  } finally {
    loading.value = false
  }
}

// 测试知识库API
const testWorkspaceAPI = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/workspaces', {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    addTestResult(
      '知识库API测试',
      true,
      `成功获取知识库列表，数量: ${response.data?.length || 0}`,
      response
    )
  } catch (error) {
    addTestResult(
      '知识库API测试',
      false,
      `请求失败: ${error.message}`,
      error
    )
  } finally {
    loading.value = false
  }
}

// 测试文档API
const testDocumentAPI = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/documents', {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    addTestResult(
      '文档API测试',
      true,
      `成功获取文档列表，数量: ${response.data?.content?.length || 0}`,
      response
    )
  } catch (error) {
    addTestResult(
      '文档API测试',
      false,
      `请求失败: ${error.message}`,
      error
    )
  } finally {
    loading.value = false
  }
}
</script>
