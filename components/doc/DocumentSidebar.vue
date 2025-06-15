<template>
  <aside 
    class="document-sidebar-right absolute top-0 right-0 bottom-0 bg-base-200 border-l border-base-content/10 shadow-xl transition-all duration-500 ease-in-out z-50"
    :class="{ 
      'w-64': !isCollapsed, 
      'w-12': isCollapsed 
    }"
  >
    <div class="relative h-full flex">
      <!-- 折叠/展开按钮 -->
      <div 
        class="absolute top-1/2 -left-8 bg-base-300 rounded-l-lg shadow-md cursor-pointer transition-all duration-300 hover:bg-base-content/10"
        @click="toggleSidebar"
      >
        <div class="p-1.5 flex items-center justify-center">
          <Icon 
            :name="isCollapsed ? 'mdi:chevron-left' : 'mdi:chevron-right'" 
            class="h-6 w-6 text-base-content/70 hover:text-base-content"
          />
        </div>
      </div>

      <!-- 侧边栏内容 -->
      <div 
        class="flex-1 overflow-hidden transition-opacity duration-500"
        :class="{ 
          'opacity-100': !isCollapsed, 
          'opacity-0': isCollapsed 
        }"
      >
        <!-- 选项卡切换 -->
        <div class="tabs tabs-boxed mb-4 mx-2 mt-4">
          <a 
            v-for="tab in tabs" 
            :key="tab.id"
            class="tab" 
            :class="{ 'tab-active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </a>
        </div>

        <!-- 选项卡内容 -->
        <div class="p-4">
          <!-- 评论 -->
          <transition 
            name="fade" 
            mode="out-in"
          >
            <div v-if="activeTab === 'comments'" class="space-y-4">
              <div 
                v-for="(comment, index) in comments" 
                :key="index" 
                class="chat"
                :class="comment.type === 'sent' ? 'chat-end' : 'chat-start'"
              >
                <div class="chat-image avatar">
                  <div class="w-10 rounded-full">
                    <img :src="comment.avatar" />
                  </div>
                </div>
                <div class="chat-bubble">{{ comment.text }}</div>
              </div>
            </div>

            <!-- 修订 -->
            <div v-else-if="activeTab === 'revisions'" class="space-y-4">
              <div 
                v-for="(revision, index) in revisions" 
                :key="index" 
                class="alert"
                :class="revision.type === 'warning' ? 'alert-warning' : ''"
              >
                <Icon :name="revision.icon" class="w-6 h-6" />
                <span>{{ revision.text }}</span>
              </div>
            </div>

            <!-- 历史版本 -->
            <div v-else-if="activeTab === 'history'" class="space-y-4">
              <div class="timeline timeline-vertical">
                <div 
                  v-for="(version, index) in history" 
                  :key="index"
                  class="timeline-item"
                >
                  <div class="timeline-start">{{ version.date }}</div>
                  <div class="timeline-middle">
                    <Icon name="mdi:circle" class="w-4 h-4" />
                  </div>
                  <div class="timeline-end timeline-box">{{ version.description }}</div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
const isCollapsed = ref(false)
const activeTab = ref('comments')

const tabs = [
  { id: 'comments', label: '评论' },
  { id: 'revisions', label: '修订' },
  { id: 'history', label: '历史' }
]

const comments = [
  { 
    type: 'start', 
    avatar: 'https://picsum.photos/200/200?random=1', 
    text: '这段描述需要调整一下' 
  },
  { 
    type: 'sent', 
    avatar: 'https://picsum.photos/200/200?random=2', 
    text: '好的，我会修改' 
  }
]

const revisions = [
  { 
    type: 'info', 
    icon: 'mdi:pencil', 
    text: '第3段文字被修改' 
  },
  { 
    type: 'warning', 
    icon: 'mdi:delete', 
    text: '删除了一个段落' 
  }
]

const history = [
  { date: '2023-06-14', description: '初始版本' },
  { date: '2023-06-15', description: '第一次修改' }
]

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

// 提供一个方法用于外部组件控制
const emit = defineEmits(['toggle'])
watch(isCollapsed, (newValue) => {
  emit('toggle', newValue)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 