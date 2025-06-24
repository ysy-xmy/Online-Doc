<template>
  <div class="summary-panel" :class="{ 'visible': isVisible }">
    <div class="panel-header">
      <h3>AI生成内容摘要</h3>
      <!-- 折叠/展开按钮 -->
      <div 
        class="absolute top-1/2 -left-8 bg-base-300 rounded-l-lg shadow-md cursor-pointer transition-all duration-300 hover:bg-base-content/10"
        @click="closePanel"
      >
        <div class="p-1.5 flex items-center justify-center">
          <Icon name="mdi:arrow-right" class="h-8 w-8" />
        </div>
      </div>    
    </div>
    
    <div class="panel-content ">
      <div v-if="error" class="error-state">{{ error }}</div>
      <template v-else>
        <div class="summary-box" ref="summaryBox" @scroll="handleScroll">
          <div v-for="(summary, index) in summaries" :key="index" class="summary-item">
            {{ summary }}
          </div>
        </div>
        <div v-if="isLoading || isAISummaryLoading" class="loading-state">
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>
      </template>
    </div>
    
    <div  class="panel-footer">
      <span class="token-usage">字数: {{ summaryCharCount }}</span>
      <button class="copy-btn" @click="copySummary">复制摘要</button>
    </div>
  </div>
</template>

<script setup>
import {  ref, onMounted } from 'vue'
import useSummaryAI from '~/components/AI/useSummaryAI.js';
import {documentApi} from '~/api/doc';

// 定义响应式变量
const summaries = ref([]);
const documentContent = ref('报道提到，当被问及英国最终是否会允许美国飞机使用英国位于塞浦路斯和迪戈加西亚岛的军事基地但不提供任何其他支持时，哈曼回答说，“正是如此”。'); // 直接使用预设文本
// const documentContent = ref('');
const summaryBox = ref(null);
const isLoading = ref(true);

// 初始化 AI 摘要相关逻辑
const { isLoading: isAISummaryLoading, summary: aiSummary, error: aiError, tokenUsage: aiTokenUsage, summarizeLongText } = useSummaryAI();

const props = defineProps({
  isVisible: Boolean,
  summary: String,
  error: String,
  tokenUsage: Number
})

const emit = defineEmits(['close'])
const closePanel = () => {
  emit('close')
}


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

const generateAISummary = async () => { 
  try { 
    console.log('zhiwei:',documentContent.value)
    // const response = await documentApi.getDocument()
    // console.log(response)
    // documentContent.value = response.data.content;
    await summarizeLongText(documentContent.value)

  } catch (error) { 
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
</script>

<style scoped>
.summary-panel {
  position: absolute;
  right: -400px;
  top: 0;
  bottom: 0;
  height: 90vh;
  width: 21rem;
  background: #f8f8f8;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 998;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #eee;
}

.summary-panel.visible {
  right: 0;
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

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0 8px;
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

.summary-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.summary-text {
  flex-grow: 1;
  line-height: 1.6;
  overflow-y: auto;
  padding-bottom: 20px;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #eee;
  margin-top: auto;
}

.token-usage {
  font-size: 12px;
  color: #888;
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