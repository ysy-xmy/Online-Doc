<template>
  <div class="p-8">
    <h1 class="text-3xl font-extrabold mb-6 flex items-center text-base-content">
      知识库
      <span class="ml-2 text-gray-400 text-base">📁</span>
    </h1>

    <!-- 快捷操作卡片 -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="card card-compact bg-base-100 shadow-xl hover:bg-base-200 cursor-pointer transition-all">
        <div class="card-body flex flex-row items-center">
          <div class="mr-4 text-3xl">📄</div>
          <div>
            <h2 class="card-title text-base">新建文档</h2>
            <p class="text-gray-500 text-sm">快速开始协作</p>
          </div>
        </div>
      </div>

      <div class="card card-compact bg-base-100 shadow-xl hover:bg-base-200 cursor-pointer transition-all">
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
          <button class="btn btn-ghost btn-circle btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-5 h-5 stroke-current">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </button>
          <button class="btn btn-ghost btn-circle btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-5 h-5 stroke-current">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <div 
          v-for="(item, idx) in knowledgeList" 
          :key="idx" 
          class="card card-bordered bg-gray  hover:bg-base-200	 hover:shadow-lg transition-all group border-3 border-base-200 shadow-2xs"
          @click="goToDetail(item, idx)"
        >
          <div class="card-body">
            <div class="flex justify-between items-center">
              <div class="text-3xl mb-2">{{ item.emoji }}</div>
            </div>
            <h2 class="card-title ">{{ item.name }}</h2>
            <p class="text-sm opacity-70">{{ item.desc }}</p>
            <div class="card-actions justify-end mt-4">
              <button class="btn btn-sm btn-ghost group-hover:btn-active">
                查看详情
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
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
              v-model="form.desc" 
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
                  value="private" 
                  v-model="form.visibility" 
                  class="radio radio-sm mr-2"
                />
                仅当前知识库成员可见
              </label>
              <label class="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  value="public" 
                  v-model="form.visibility" 
                  class="radio radio-sm mr-2"
                />
                "飞书个人版"所有人公开可见
              </label>
            </div>
          </div>
          <div class="flex justify-end space-x-4">
            <button type="button" class="btn btn-ghost" @click="onCancel">取消</button>
            <button 
              type="submit" 
              class="btn btn-primary" 
              :disabled="!form.name"
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNuxtApp } from '#app'

const router = useRouter()
const showModal = ref(false)
const initialForm = () => ({
  name: '',
  desc: '',
  emoji: '',
  visibility: 'private',
})
const form = ref(initialForm())

// 新增：知识库列表
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
  return knowledgeList.value[idx] || { docs: [] }
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
  form.value.emoji = emoji
}

const { $fetchInstance } = useNuxtApp()

async function onCreate() {
  try {
    const payload = {
      name: form.value.name,
      description: form.value.desc,
      icon: form.value.emoji || generateEmojiFromName(form.value.name),
      visibility: form.value.visibility === 'public' ? 'PUBLIC' : 'PRIVATE'
    }
    const res = await $fetchInstance('/workspaces', {
      method: 'POST',
      body: payload
    })
    // 假设返回格式为 { code, message, data }
    if (res && (res.code === 200 || res.success)) {
      // 添加到 knowledgeList 或刷新列表
      knowledgeList.value.push({
        id: res.data.id || Date.now(),
        emoji: res.data.icon,
        name: res.data.name,
        desc: res.data.description,
        visibility: res.data.visibility
      })
      showModal.value = false
      form.value = initialForm()
    } else {
      alert('创建失败：' + (res.message || '未知错误'))
    }
  } catch (e) {
    alert('网络错误或服务器异常')
  }
}

function onCancel() {
  showModal.value = false
  form.value = initialForm()
}

function goToDetail(item, idx) {
  // 如果有唯一 id 字段建议用 item.id
  router.push(`/knowledgeBase/${idx}`)
}
</script>

<style scoped>
/* 如果需要添加自定义样式，可以在这里添加 */
.card {
  transition: all 0.3s ease;
}
</style> 