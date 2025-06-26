<template>
  <div class="summary-panel" :class="{ 'visible': isVisible }">
    <div  class="panel-toggle" @click="closePanel">
      <Icon
       
        name='mdi:arrow-right' 
        class="toggle-icon" 
      />
    </div>

    <div class="panel-container">
      <div class="panel-header">
        <h3>AI生成内容摘要</h3>
      </div>
      
      <div class="panel-content">
      <div v-if="error" class="error-state">{{ error }}</div>
      <template v-else>
        <div v-if="isLoading || isAISummaryLoading" class="loading-state">
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>

        <div v-else-if="isProcessing" class="processing-state loading-state">
          <div class="spinner"></div>
          <div class="progress-bar">
            <div class="progress" :style="{ width: `${progress}%` }"></div>
          </div>
          <span>{{ progress }}% 处理中...</span>
        </div>
        <div v-else class="summary-box" ref="summaryBox" @scroll="handleScroll">
          <div
            v-for="(summary, index) in summaries"
            :key="index"
            class="summary-item"
          >
            {{ summary }}
          </div>
        </div>
      </template>
    </div>
      
      <div class="panel-footer">
      <span class="token-usage">字数: {{ summaryCharCount }}</span>
      <div class="panel-footer">
        <button @click="retryOperation" class="copy-btn retry-btn">重试</button>
        <button class="copy-btn" @click="copySummary">复制摘要</button>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import useSummaryAI from '~/components/AI/useSummaryAI.js';

// 定义响应式变量
const summaries = ref([]);
const documentContent = ref('报道提到，当被问及英国最终是否会允许美国飞机使用英国位于塞浦路斯和迪戈加西亚岛的军事基地但不提供任何其他支持时，哈曼回答说，"正是如此"。');
const summaryBox = ref(null);
const isLoading = ref(true);
const error = ref(null); // 新增统一错误状态

// 初始化 AI 摘要相关逻辑
const {
  isLoading: isAISummaryLoading,
  isProcessing,
  progress,
  summary: aiSummary,
  error: aiError,
  tokenUsage: aiTokenUsage,
  summarizeLongText,
} = useSummaryAI();

const props = defineProps({
  isVisible: Boolean,
  summary: String,
  error: String,
  tokenUsage: Number,
  documentId: String, // 接收文档ID
});

const emit = defineEmits(["close"]);
const closePanel = () => {
  summaries.value = [];
  isLoading.value = false;
  isProcessing.value = false;
  progress.value = 0;
  emit("close");
};



// 添加对 props.summary 的监听
watch(() => props.summary, (newVal) => {
  if (newVal) {
    summaries.value = [newVal]
  }
})

// 添加对 aiSummary 的监听
watch(aiSummary, (newVal) => {
  if (newVal) {
    summaries.value = [newVal]
    isLoading.value = false
  }
})

watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    generateAISummary(); // 面板打开时自动生成摘要
  }
});

console.log("接收到的文档ID:", props.documentId);
const generateAISummary = async () => { 
  try { 
    // 2. 检查内容是否为空
    if (!documentContent.value) {
      error.value = "内容为空";
      return; // 直接返回，不继续执行
    }
    await summarizeLongText(documentContent.value);
  } catch (error) { 
    error.value = "生成AI摘要失败";
    console.error('生成AI摘要失败:', error)
  }
}

// 计算有效字数（中文按字算，英文按单词算）
const summaryCharCount = computed(() => {
  const text = aiSummary.value || summaries.value.join("");
  if (!text) return 0;
  
  // 移除所有空格和标点（按需求调整）
  const cleanText = text.replace(/[\s\.,;:!?]/g, "");
  return cleanText.length;
});

const copySummary = async () => { 
  try { 
    await navigator.clipboard.writeText(aiSummary.value)
    alert('AI摘要已复制')
  } catch (err) { 
    console.error('复制失败:', err)
  }
}
// 重试操作
const retryOperation = () => {
  error.value = null;
  generateAISummary();
};
</script>

<style scoped>
.summary-panel {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  height: 100vh;
  width: 21rem;
  background: #f8f8f8;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 998;
  display: flex;
  border-left: 1px solid #eee;
  right: -21rem; /* 默认完全隐藏 */
}

.summary-panel.visible {
  right: 0; /* 显示时回到原位 */
}

.panel-toggle {
  position: absolute;
  left: -40px;
  top: 50%;
  transform: translateY(-50%);
  background: #f8f8f8;
  border: 1px solid #eee;
  border-right: none;
  padding: 10px;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  cursor: pointer;
  box-shadow: -2px 0 5px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.panel-toggle:hover {
  background: #f0f0f0;
}

.toggle-icon {
  width: 24px;
  height: 24px;
  color: #666;
}

.panel-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.panel-header {
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  color: #10a37f;
  font-size: 18px;
}

.panel-content {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.error-state {
  color: #f44336;
  padding: 20px;
  text-align: center;
}

.summary-box {
  max-height: 100%;
  overflow-y: auto;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-top: 1px solid #eee;
}

.token-usage {
  font-size: 12px;
  color: #888;
}

.panel-footer {
  /* 添加以下属性 */
  display: flex;
  gap: 8px; /* 控制按钮间距 */
  padding: 6px 10px;
  align-items: center;
}
.copy-btn {
  background: #10a37f;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.copy-btn:hover {
  background: #0d8e6f;
}
.copy-btn .retry-btn {
  padding: 6px 10px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #10a37f;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>