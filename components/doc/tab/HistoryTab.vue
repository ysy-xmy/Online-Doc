<template>
  <div class="timeline timeline-vertical">
    <!-- 加载状态提示 -->
    <div v-if="loading" class="loading-text">正在加载历史记录...</div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-text">
      加载失败: {{ error }}
      <button @click="retryFetch" class="retry-button">重试</button>
    </div>

    <!-- 正常内容展示 -->
    <div
        v-for="(version, index) in history"
        :key="index"
        class="timeline-item"
        @click="handleItemClick(version)"
        v-if="history.length > 0"
    >
      <div class="timeline-start">{{ version.date || '无日期' }}</div>
      <div class="timeline-middle">
        <Icon name="mdi:circle" class="w-4 h-4" />
      </div>
      <div class="timeline-end timeline-box">{{ version.content || version.operation }}</div>
    </div>

    <!-- 空状态提示 -->
    <div v-else-if="!loading && !error" class="empty-text">暂无历史记录</div>
  </div>
</template>

<script setup>
import {ref, onMounted, defineEmits} from 'vue';
import {documentOperationsApi} from '../../../api/doc/index.js';

const emits = defineEmits(['version-click']);
const history = ref([]);
const loading = ref(false);
const error = ref(null);

// 从URL路径中提取文档ID
const getDocumentIdFromUrl = () => {
  const pathSegments = window.location.pathname.split('/');
  return pathSegments[pathSegments.length - 1];
};

// 获取历史记录
const fetchHistory = async () => {
  try {
    loading.value = true;
    error.value = null;

    const documentId = getDocumentIdFromUrl();
    console.log('从URL获取的文档ID:', documentId);

    if (!documentId || isNaN(Number(documentId))) {
      throw new Error('无效的文档ID');
    }


   const response = await documentOperationsApi.getDocumentOperations(documentId);

    console.log('API响应数据:', response);

    if (response.code === 200) {
      history.value = response.data?.operations || [];
    } else {
      throw new Error(response.message || '获取历史记录失败');
    }
  } catch (err) {
    console.error('获取历史记录失败:', err);
    error.value = err.message || '获取历史记录失败';
  } finally {
    loading.value = false;
  }
};

// 重试获取
const retryFetch = () => {
  fetchHistory();
};

onMounted(() => {
  fetchHistory();
});

const handleItemClick = (version) => {
  emits('version-click', version);
};
</script>

<style scoped>
/* 原有样式保持不变 */
.loading-text, .error-text, .empty-text {
  padding: 20px;
  text-align: center;
  color: #666;
}

.error-text {
  color: #f56c6c;
  white-space: pre-line;
}

.retry-button {
  margin-top: 10px;
  padding: 5px 15px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:hover {
  background-color: #66b1ff;
}
</style>
