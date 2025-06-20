<template>
  <div class="relative">
    <!-- 右下角展开按钮 -->
    <div class="fixed bottom-6 right-6 z-50">
      <button
          class="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all"
          @click="toggleSidebar"
      >
        <Icon name="mdi:comment" class="h-6 w-6" />
      </button>
    </div>

    <!-- 侧边栏组件 -->
    <DocumentSidebar
        :show="sidebarOpen"
        @update:show="sidebarOpen = $event"
        @version-click="$emit('version-click', $event)"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import DocumentSidebar from './doc/DocumentSidebar.vue';
const sidebarOpen = ref(false);
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};
</script>