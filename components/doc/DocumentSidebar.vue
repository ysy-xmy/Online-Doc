<template>
  <aside
      v-if="show"
      class="document-sidebar-right absolute top-[64px] right-0 bottom-0 bg-base-200 border-l border-base-content/10 shadow-xl transition-all duration-500 ease-in-out z-50 w-84"
  >
    <slot @version-click="$emit('version-click', $event)">
      <div class="relative h-full flex flex-col">
        <div
            class="absolute top-1/2 -left-8 bg-base-300 rounded-l-lg shadow-md cursor-pointer transition-all duration-300 hover:bg-base-content/10"
            @click="$emit('update:show', false)"
        >
          <div class="p-1.5 flex items-center justify-center">
            <Icon
                name="mdi:chevron-right"
                class="h-6 w-6 text-base-content/70 hover:text-base-content"
            />
          </div>
        </div>
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="tabs tabs-boxed mx-2 mt-4">
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
          <div class="flex-1 p-4 overflow-y-auto">
            <Transition name="fade" mode="out-in">
              <component
                  :is="activeTabComponent"
                  :key="activeTab"
                  @version-click="$emit('version-click', $event)"
              />
            </Transition>
          </div>
        </div>
      </div>
    </slot>
  </aside>
</template>

<script setup>
import CommentTab from './tab/CommentTab.vue';
import RevisionTab from './tab/RevisionTab.vue';
import HistoryTab from './tab/HistoryTab.vue';
import { ref, defineProps, defineEmits, computed } from 'vue';
defineProps({
  show: {
    type: Boolean,
    default: false
  }
});
defineEmits(['update:show', 'version-click']);
const activeTab = ref('comments');

const tabs = [
  { id: 'comments', label: '评论' },
  { id: 'revisions', label: '修订' },
  { id: 'history', label: '历史' }
];

const activeTabComponent = computed(() => {
  const tabMap = {
    'comments': CommentTab,
    'revisions': RevisionTab,
    'history': HistoryTab
  };
  return tabMap[activeTab.value];
});
</script>

<style scoped>

</style>
