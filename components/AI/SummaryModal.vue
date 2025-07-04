<template>
  <aside
    class="document-sidebar-right absolute top-0 right-0 bottom-0 bg-base-200 border-l border-base-content/10 shadow-xl transition-all duration-500 ease-in-out z-50"
    :class="{
      'w-84': isVisible,
      'w-0': !isVisible,
    }"
  >
    <div v-if="isVisible" class="relative h-full flex">
      <!-- 折叠/展开按钮 -->
       <div 
        class="absolute top-1/2 -left-8 bg-base-300 rounded-l-lg shadow-md cursor-pointer transition-all duration-300 hover:bg-base-content/10"
        @click="closePanel"
      >
        <div class="p-1.5 flex items-center justify-center">
          <img
          class="h-8 w-8"
          src="https://img.icons8.com/ios-filled/100/10A37F/back--v1.png"
          alt="back--v1"
        />
        </div>
      </div>

      <!-- 侧边栏内容 -->
      <div
        class="flex-1 flex flex-col overflow-hidden transition-opacity duration-500"
        :class="{
          'opacity-100': isVisible,
          'opacity-0': !isVisible,
        }"
      >
        <div class="panel-header">
          <h3>AI生成内容摘要</h3>
        </div>

        <div class="panel-content flex-1 overflow-y-auto">
          <div v-if="error" class="error-state">{{ error }}</div>
          <template v-else>
            <div v-if="isLoading || isAISummaryLoading" class="loading-state">
              <div class="spinner"></div>
              <span>加载中...</span>
            </div>

            <div
              v-else-if="isProcessing"
              class="processing-state loading-state"
            >
              <div class="spinner"></div>
              <div class="progress-bar">
                <div class="progress" :style="{ width: `${progress}%` }"></div>
              </div>
              <span>{{ progress }}% 处理中...</span>
            </div>
            <div
              v-else
              class="summary-box"
              ref="summaryBox"
              @scroll="handleScroll"
            >
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

        <div class="panel-footer sticky bottom-0 bg-base-200 z-10">
          <span class="token-usage">字数: {{ summaryCharCount }}</span>
          <div class="panel-footer2">
            <button @click="retryOperation" class="copy-btn retry-btn">
              重试
            </button>
            <button class="copy-btn" @click="copySummary">复制摘要</button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import useSummaryAI from "~/components/AI/useSummaryAI.js";
import { documentApi } from "~/api/document";

// 定义响应式变量
const summaries = ref([]);
// const documentContent = ref('报道提到，当被问及英国最终是否会允许美国飞机使用英国位于塞浦路斯和迪戈加西亚岛的军事基地但不提供任何其他支持时，哈曼回答说，"正是如此"。');
const documentContent = ref("");
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
watch(
  () => props.summary,
  (newVal) => {
    if (newVal) {
      summaries.value = [newVal];
    }
  }
);

// 添加对 aiSummary 的监听
watch(aiSummary, (newVal) => {
  if (newVal) {
    summaries.value = [newVal];
    isLoading.value = false;
  }
});

watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) {
      generateAISummary(); // 面板打开时自动生成摘要
    }
  }
);

console.log("接收到的文档ID:", props.documentId);
const generateAISummary = async () => {
  try {
    // 1. 获取文档内容
    const response = await documentApi.getById(props.documentId);
    console.log("文档获取响应:", response);

    // 2. 检查内容是否为空
    documentContent.value = response.data.content;
    if (!documentContent.value || documentContent.value.trim() === "") {
      error.value = "文档内容为空";
      return; // 直接返回，不生成摘要
    }

    // 3. 生成AI摘要
    await summarizeLongText(documentContent.value);
  } catch (err) {
    error.value = "生成AI摘要失败";
    console.error("生成AI摘要失败:", err);
  }
};

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
    // 检查文档内容是否为空
    if (!aiSummary.value && summaries.value.length === 0) {
      alert("没有可复制的摘要内容");
      return;
    }

    // 检查是否有错误
    if (error.value) {
      alert("当前存在错误，无法复制");
      return;
    }
    await navigator.clipboard.writeText(aiSummary.value);
    alert("AI摘要已复制");
  } catch (err) {
    console.error("复制失败:", err);
  }
};
// 重试操作
const retryOperation = () => {
  error.value = null;
  generateAISummary();
};
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
  background-color: #fff5f5; /* 浅红色背景 */
  color: #dc2626; /* 更柔和的红色文字 */
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.3s ease-out;
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

.panel-footer2 {
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
  to {
    transform: rotate(360deg);
  }
}
</style>
