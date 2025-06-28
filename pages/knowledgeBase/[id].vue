<template>
  <div class="bg-base-100 p-4">
    <div class="flex items-center space-x-2 mb-4">
      <button 
        @click="goBack" 
        class="btn btn-ghost btn-sm btn-circle"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <h2 class="text-lg font-semibold text-base-content">{{ currentKnowledge.name }}
      </h2>
    </div>
    <div v-if="currentKnowledge.docs.length > 0" class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>文档名称</th>
            <th>创建人</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="doc in currentKnowledge.docs" 
            :key="doc.id" 
            class="hover:bg-base-200 cursor-pointer transition-all duration-200 group"
            @click="openDocument(doc.id)"
          >
            <td class="group-hover:text-primary transition-colors">
              <div class="flex items-center space-x-2">
                <span class="text-base-content/70">📄</span>
                <span>{{ doc.title }}</span>
              </div>
            </td>
            <td class="group-hover:text-base-content/80 transition-colors">{{ doc.author }}</td>
            <td class="group-hover:text-base-content/80 transition-colors">{{ doc.time }}</td>
            <td>
              <button 
                class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                查看
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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
        @click="createDocument"
      >
        创建文档
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'default'
})

const route = useRoute()

const knowledgeList = ref([
  { 
    id: 0,
    emoji: '📘', 
    name: '测试知识库', 
    desc: '用来测试', 
    visibility: 'private',
    docs: [
      { 
        id: 1, 
        title: '飞书文档开发', 
        author: '小木鱼', 
        time: '昨天 03:35',
        desc: '前端学习笔记'
      },
      { 
        id: 2, 
        title: '八股复习', 
        author: '小木鱼', 
        time: '06-09 10:27',
        desc: '前端面试准备'
      },
      { 
        id: 3, 
        title: '10天算法通关计划', 
        author: '小木鱼', 
        time: '06-06 22:34',
        desc: '算法学习路径'
      },
      { 
        id: 4, 
        title: '无标题模板', 
        author: '小木鱼', 
        time: '06-05 10:02',
        desc: '通用模板文档'
      }
    ]
  }
])

const currentKnowledge = computed(() => {
  const idx = Number(route.params.id)
  console.log(knowledgeList.value,'22')
  return knowledgeList.value[idx] || { docs: [] }
})

const openDocument = (id) => {
  navigateTo(`/document/${id}`)
}

const goBack = () => {
  navigateTo('/knowledgeHome')
}

const createDocument = () => {
  // 这里可以添加创建文档的逻辑
  console.log('创建新文档')
}
</script>

<style scoped>
.table th:first-child {
  width: 40%;
}
</style>