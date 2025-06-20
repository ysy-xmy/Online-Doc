<template>
  <div class="version-view-container h-full flex flex-col max-w-4xl w-full mx-4 bg-white rounded-lg shadow-xl">
    <!-- 顶部导航栏 -->
    <div class="bg-base-200 border-b border-base-content/10 p-3 flex items-center justify-between">
      <button @click="backToEditor" class="flex items-center gap-2 text-base-content/70 hover:text-base-content transition-colors">
        <Icon name="mdi:arrow-left" class="w-5 h-5" />
        <span>返回编辑</span>
      </button>
      <h3 class="font-medium text-lg">{{ version.date }} - {{ version.description }}</h3>
      <div class="flex items-center">
        <button @click="openRestoreConfirm" class="flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors">
          <Icon name="mdi:restore" class="w-5 h-5" />
          <span>还原历史记录</span>
        </button>
      </div>
    </div>

    <!-- 版本内容区域 -->
    <div class="flex-1 p-6 overflow-auto">
      <div class="prose max-w-none" v-html="renderedContent"></div>
    </div>

    <!-- 还原确认弹窗 -->
    <div v-if="showRestoreConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 class="text-lg font-medium mb-4">确认还原历史记录</h3>
        <p class="mb-6 text-base-content/80">
          您确定要将文档还原为 <strong>{{ version.description }}</strong> 版本吗？此操作将覆盖当前在线文档的内容。
        </p>
        <div class="flex justify-end gap-3">
          <button @click="closeRestoreConfirm" class="px-4 py-2 bg-base-200 text-base-content rounded-lg hover:bg-base-300 transition-colors">
            取消
          </button>
          <button @click="confirmRestore" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            确认还原
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue';
import { marked } from 'marked';

const props = defineProps({
  version: {
    type: Object,
    required: true
  }
});

const emits = defineEmits(['back', 'restore']);

const backToEditor = () => {
  emits('back');
};

const showRestoreConfirm = ref(false);

const openRestoreConfirm = () => {
  showRestoreConfirm.value = true;
};

const closeRestoreConfirm = () => {
  showRestoreConfirm.value = false;
};

const confirmRestore = () => {
  emits('restore', props.version);
  closeRestoreConfirm();
};

const renderedContent = computed(() => {
  return marked.parse(props.version.content || '');
});
</script>

<style scoped>
.version-view-container {
  background-color: var(--color-base-100);
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>