<template>
  <div class="p-8">
    <h1 class="text-3xl font-extrabold mb-6 flex items-center text-base-content">
      知识库
      <span class="ml-2 text-gray-400 text-base">📁</span>
    </h1>
    <div class="flex space-x-4 mb-8">
      <div class="rounded-lg shadow p-4 flex-1 flex items-center cursor-pointer transition-colors bg-base-100 hover:bg-base-200">
        <div class="mr-4 text-3xl">📄</div>
        <div>
          <div class="font-semibold text-base-content">新建</div>
          <div class="text-gray-400 text-sm">新建文档并开始协作</div>
        </div>
      </div>
      <div class="rounded-lg shadow p-4 flex-1 flex items-center cursor-pointer transition-colors bg-base-100 hover:bg-base-200">
        <div class="mr-4 text-3xl">🧩</div>
        <div>
          <div class="font-semibold text-base-content">模板库</div>
          <div class="text-gray-400 text-sm">选择模板快速新建</div>
        </div>
      </div>
      <div class="rounded-lg shadow p-4 flex-1 flex items-center cursor-pointer transition-colors bg-base-100 hover:bg-base-200" @click="showModal = true">
        <div class="mr-4 text-3xl">📚</div>
        <div>
          <div class="font-semibold text-base-content">新建知识库</div>
          <div class="text-gray-400 text-sm">让知识创造价值</div>
        </div>
      </div>
    </div>
    <div>
      <div class="flex items-center mb-4">
        <span class="font-semibold text-base-content">全部知识库</span>
        <button class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <svg width="20" height="20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
      <div class="grid grid-cols-5 gap-6">
        <div v-for="(item, idx) in knowledgeList" :key="idx" class="relative overflow-hidden rounded-2xl shadow-lg p-6 flex flex-col items-start justify-end min-h-[180px] bg-gradient-to-br from-blue-100 via-blue-50 to-white dark:from-blue-900 dark:via-blue-800 dark:to-gray-900">
          <!-- 装饰SVG背景 -->
          <svg class="absolute left-0 bottom-0 w-full h-24 pointer-events-none select-none" viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="150" cy="100" rx="150" ry="40" fill="#3B82F6" fill-opacity="0.12"/>
            <ellipse cx="220" cy="90" rx="60" ry="20" fill="#3B82F6" fill-opacity="0.18"/>
          </svg>
          <div class="relative z-10">
            <div v-if="item.emoji" class="text-3xl mb-2">{{ item.emoji }}</div>
            <div class="text-xl font-extrabold mb-1 text-gray-900 dark:text-white">{{ item.name }}</div>
            <div class="text-base text-gray-500 dark:text-gray-300">{{ item.desc }}</div>
          </div>
        </div>
        <!-- 这里可以继续添加知识库卡片 -->
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
            <div class="flex items-center space-x-2 relative">
              <span class="text-2xl cursor-pointer select-none w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800 relative" @click="showEmojiPicker = !showEmojiPicker">
                <template v-if="form.emoji">
                  {{ form.emoji }}
                  <button class="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-300 rounded-full shadow text-xs text-gray-400 hover:text-red-500 hover:border-red-400 z-10" @click.stop="removeEmoji" title="移除">
                    ×
                  </button>
                </template>
                <template v-else>
                  <!-- 飞书风格笑脸+加号SVG -->
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="14" cy="14" r="13" stroke="#BDBDBD" stroke-width="2" fill="white"/>
                    <circle cx="10.5" cy="12" r="1" fill="#BDBDBD"/>
                    <circle cx="17.5" cy="12" r="1" fill="#BDBDBD"/>
                    <path d="M10.5 16C11.1667 17 12.8333 17 13.5 16" stroke="#BDBDBD" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M19 19V23" stroke="#BDBDBD" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M17 21H21" stroke="#BDBDBD" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </template>
              </span>
              <input v-model="form.name" required maxlength="20" placeholder="请输入名称" class="input input-bordered w-full bg-base-100" />
              <!-- emoji 选择器 -->
              <div v-if="showEmojiPicker" class="absolute left-0 top-10 z-10 bg-white dark:bg-gray-800 rounded shadow p-2 grid grid-cols-8 gap-1 w-64 max-h-48 overflow-y-auto">
                <span v-for="emoji in emojiList" :key="emoji" class="text-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1" @click="selectEmoji(emoji)">{{ emoji }}</span>
              </div>
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-base-content font-semibold mb-1">简介</label>
            <input v-model="form.desc" maxlength="50" placeholder="请输入简介" class="input input-bordered w-full bg-base-100" />
          </div>
          <div class="mb-6">
            <label class="block text-base-content font-semibold mb-1">可见范围</label>
            <div class="space-y-2">
              <label class="flex items-center cursor-pointer">
                <input type="radio" value="private" v-model="form.visibility" class="radio radio-sm mr-2" />
                仅当前知识库成员可见
              </label>
              <label class="flex items-center cursor-pointer">
                <input type="radio" value="public" v-model="form.visibility" class="radio radio-sm mr-2" />
                "飞书个人版"所有人公开可见
              </label>
            </div>
          </div>
          <div class="flex justify-end space-x-4">
            <button type="button" class="btn btn-ghost" @click="onCancel">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="!form.name">创建</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showModal = ref(false)
const showEmojiPicker = ref(false)
const initialForm = () => ({
  emoji: '',
  name: '',
  desc: '',
  visibility: 'private',
})
const form = ref(initialForm())

// 新增：知识库列表
const knowledgeList = ref([
  { emoji: '📘', name: '测试', desc: '用来测试', visibility: 'private' }
])

const emojiList = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','😷','🤒','🤕','🤢','🤮','🥴','😇','🥳','🥺','🤠','🤡','🤥','🤫','🤭','🧐','🤓','😈','👿','👹','👺','💀','👻','👽','🤖','💩','😺','😸','😹','😻','😼','😽','🙀','😿','😾'
]

function selectEmoji(emoji) {
  form.value.emoji = emoji
  showEmojiPicker.value = false
}

function removeEmoji() {
  form.value.emoji = ''
}

function onCreate() {
  // 新建知识库，添加到 knowledgeList
  knowledgeList.value.push({
    emoji: form.value.emoji || '📘',
    name: form.value.name,
    desc: form.value.desc,
    visibility: form.value.visibility
  })
  showModal.value = false
  showEmojiPicker.value = false
  form.value = initialForm()
}

function onCancel() {
  showModal.value = false
  showEmojiPicker.value = false
  form.value = initialForm()
}

// 点击弹窗外关闭 emoji 选择器
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (showEmojiPicker.value) {
      const picker = document.querySelector('.emoji-picker-pop')
      if (picker && !picker.contains(e.target)) {
        showEmojiPicker.value = false
      }
    }
  })
})
</script>

<style scoped>
/* 如果需要添加自定义样式，可以在这里添加 */
</style> 