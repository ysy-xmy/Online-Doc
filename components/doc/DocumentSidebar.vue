<template>
  <aside 
    class="document-sidebar-right absolute top-0 right-0 bottom-0 bg-base-200 border-l border-base-content/10 shadow-xl transition-all duration-500 ease-in-out z-50"
    :class="{ 
      'w-84': show, 
      'w-0': !show 
    }"
  >
    <div v-if=show class="relative h-full flex">
      <!-- 折叠/展开按钮 -->
      <div 
        class="absolute top-1/2 -left-8 bg-base-300 rounded-l-lg shadow-md cursor-pointer transition-all duration-300 hover:bg-base-content/10"
        @click="toggleSidebar"
      >
        <div class="p-1.5 flex items-center justify-center">
          <Icon name="mdi:arrow-right" class="h-8 w-8" />
        </div>
      </div>

      <!-- 侧边栏内容 -->
      <div 
        class="flex-1 overflow-hidden transition-opacity duration-500"
        :class="{ 
          'opacity-100': show, 
          'opacity-0': !show 
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
        <div class="p-2 h-full">
          <Transition name="fade" mode="out-in">
            <component 
              :is="activeTabComponent"
              :commentData ="commentData"
              @addComment="handleAddComment"
              :key="activeTab"
            />
          </Transition>

        </div>
      </div>
    </div>
  </aside>
  <FloatingButton @click="startSummary"/>
  <SummaryModal
    v-model:isVisible="isAISummaryVisible"
  />
</template>

<script setup>
import { provide, ref, computed, watch } from 'vue'
import CommentTab from './tab/CommentTab.vue'
import RevisionTab from './tab/RevisionTab.vue'
import HistoryTab from './tab/HistoryTab.vue'
import FloatingButton from '../AI/FloatingButton.vue'
import SummaryModal from '../AI/SummaryModal.vue';

const isAISummaryVisible = ref(false);
const startSummary = () => {
  isAISummaryVisible.value = true
}

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  commentData: {
    type: [Array, Object],
    default:[]
  }
})

const emit = defineEmits(['update:show','addComment'])
const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

  const handleAddComment = (data) => {
  emit('addComment', data)
}


const activeTab = ref('comments')

const tabs = [
  { id: 'comments', label: '评论' },
  { id: 'revisions', label: '修订' },
  { id: 'history', label: '历史' }
]

const activeTabComponent = computed(() => {
  const tabMap = {
    'comments': CommentTab,
    'revisions': RevisionTab,
    'history': HistoryTab
  }
  return tabMap[activeTab.value]
})

const toggleSidebar = () => {
  show.value = !show.value
}


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