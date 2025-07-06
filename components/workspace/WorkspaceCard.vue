<template>
  <div
    class="card card-bordered bg-base-100 hover:bg-base-200 hover:shadow-lg transition-all group border-2 border-base-200 shadow-sm relative cursor-pointer"
    @click="$emit('click', workspace)"
  >
    <!-- 删除按钮 -->
    <div v-if="showActions" class="absolute right-4 top-4 z-10">
      <button
        class="btn btn-xs btn-circle bg-gray-200 hover:bg-red-500 text-gray-500 hover:text-white border-none transition-colors opacity-0 group-hover:opacity-100"
        @click.stop="$emit('delete', workspace)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <div class="card-body">
      <!-- 图标和标题 -->
      <div class="flex items-start justify-between mb-3">
        <div class="text-3xl">{{ workspace.icon || generateEmojiFromName(workspace.name) }}</div>
        <div class="badge badge-sm" :class="visibilityBadgeClass">
          {{ visibilityText }}
        </div>
      </div>

      <!-- 标题 -->
      <h2 class="card-title text-lg mb-2 group-hover:text-primary transition-colors">
        {{ workspace.name }}
      </h2>

      <!-- 描述 -->
      <p class="text-sm opacity-70 mb-4 line-clamp-2">
        {{ workspace.description && workspace.description.trim() ? workspace.description : '暂无描述' }}
      </p>

      <!-- 统计信息 -->
      <div class="flex items-center justify-between text-xs text-base-content/60 mb-3">
        <div class="flex items-center space-x-4">
          <span>{{ workspace.documentCount || 0 }} 个文档</span>
          <span>{{ formatDate(workspace.updatedAt) }}</span>
        </div>
      </div>

      <!-- 所有者信息 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="avatar avatar-xs">
            <div class="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs">
              {{ workspace.owner.nickname?.[0] || workspace.owner.username[0] }}
            </div>
          </div>
          <span class="text-xs text-base-content/70">
            {{ workspace.owner.nickname || workspace.owner.username }}
          </span>
        </div>

        <!-- 操作按钮 -->
        <button class="btn btn-sm btn-ghost group-hover:btn-active opacity-0 group-hover:opacity-100 transition-all">
          查看详情
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  workspace: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
})

defineEmits(['click', 'delete'])

// 可见性徽章样式
const visibilityBadgeClass = computed(() => {
  switch (props.workspace.visibility) {
    case 'PUBLIC': return 'badge-success'
    case 'INTERNAL': return 'badge-warning'
    case 'PRIVATE': return 'badge-ghost'
    default: return 'badge-ghost'
  }
})

// 可见性文本
const visibilityText = computed(() => {
  switch (props.workspace.visibility) {
    case 'PUBLIC': return '公开'
    case 'INTERNAL': return '内部'
    case 'PRIVATE': return '私有'
    default: return '私有'
  }
})

// 根据名称生成emoji
function generateEmojiFromName(name) {
  if (!name) return '📁'

  const emojiList = [
    '📘', '📗', '📙', '📒', '📓', '📔', '📕', '📖',
    '🗂️', '📂', '📁', '📃', '📄', '📊', '📈', '📉',
    '🏠', '🏢', '🏭', '🏫', '🏨', '🏪', '🏩', '💼',
    '📚', '🎓', '🌐', '💡', '🔬', '🚀', '🌟', '🎨',
    '💻', '🖥️', '📱', '🎮', '🏆', '🌈', '🍎', '🚲'
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash = hash & hash
  }

  return emojiList[Math.abs(hash) % emojiList.length]
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
