<template>
  <div class="timeline-container" style="height: 800px; overflow-y: auto;">
    <div class="history-list">
      <div
          v-for="(version, index) in historyItems"
          :key="version.uuid"
          class="history-item"
          @click="openHistoryVersion(version.uuid)"
      >
        <div class="version-row flex items-center justify-between py-3 px-4">
          <div class="version-number text-lg hover:text-blue-500 transition-colors">版本：{{ version.versionNumber }}</div>
          <div class="version-date text-gray-500 hover:text-blue-500 transition-colors">{{ version.date }}</div>
        </div>
        <div v-if="index < historyItems.length - 1" class="border-b border-gray-200 mx-4"></div>
        </div>
         </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useEditorStore } from '../../../stores/editorStore.js';
import { fetchDocumentHistory } from '../../../utils/historyData.js';

const router = useRouter();
const route = useRoute();
const editorStore = useEditorStore();
const historyItems = ref([]);
const loading = ref(false);

const documentId = route.params.id || 'default-docId';

const loadHistory = async () => {
  loading.value = true;
  try {
    console.log("route:", route.params);
    console.log("documentid", documentId);
    const historyData = await fetchDocumentHistory(documentId);
    historyItems.value = historyData.history || [];
    console.log("完整历史版本数据:", historyData);
    console.log("处理后的历史版本列表:", historyItems.value);
  } catch (error) {
    console.error('加载历史版本失败:', error);
  } finally {
    loading.value = false;
  }
};

const openHistoryVersion = (uuid) => {
  console.log("打开的文档id:", documentId);
  console.log("打开历史版本，版本ID:", uuid);
  const version = historyItems.value.find(v => v.uuid === uuid);
  if (version) {
    console.log("即将打开的版本详情:", { uuid: version.uuid, versionNumber: version.versionNumber, date: version.date });
  }
  router.push(`/history/${documentId}/${uuid}`);
};

onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.history-item {
  width: 100%;
  cursor: pointer; /* 鼠标悬停变手形 */
  transition: background-color 0.2s;
}

.history-item:hover {
  background-color: #f0f9ff; /* 悬停时背景变浅蓝色 */
}

.version-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-number {
  color: #333;
  font-weight: normal;
}

.version-date {
  font-size: 14px;
  color: #666;
}

.version-number:hover,
.version-date:hover {
  color: #3b82f6; /* 悬停时文本变蓝色 */
}

.border-b {
  border-bottom: 1px solid #e5e7eb;
  margin: 0 16px;
}
</style>
