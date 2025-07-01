<template>
  <div class="space-y-4 h-full flex flex-col">
    <!-- 选中文本展示区域 -->
    <div v-if="commentData.selectedText" class="selected-text-container">
      <div class="selected-text-content">
        {{ commentData.selectedText }}
      </div>
    </div>
    <div 
      ref="commentsContainerRef"
      class="flex-grow overflow-y-auto max-h-[calc(100vh-200px)] pb-4">
      <!-- 评论列表 -->
      <div class="space-y-4">
        <!-- 当没有评论时显示提示 -->
        <div v-if="comments.length === 0" class="flex flex-col items-center justify-center h-full text-gray-500 text-center p-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p class="text-lg mb-2">暂无评论</p>
          <p class="text-sm">
            点击文档中的<span class="font-bold text-primary">评论标志物</span>查看评论，
            或<span class="font-bold text-primary">选择文本</span>添加新的评论
          </p>
        </div>

        <template
          v-else
          v-for="(comment, commentIndex) in comments"
          :key="commentIndex">
          <!-- 渲染原始评论 -->
          <div
            :class="[
              'chat',
              comment.authorId !== userInfo.id ? 'chat-start' : 'chat-end',
            ]">
  
            <div class="chat-image avatar">
              <div class="w-10 rounded-full">
                <img :src="comment.avatar" :alt="comment.nickname" />
              </div>
            </div>
            <div class="chat-header flex justify-between items-center">
              <div>
                {{ comment.authorId !== userInfo.id ? comment.nickname : "" }}
                <time class="text-xs opacity-50 ml-2">{{ comment.time }}</time>
              </div>
            </div>
            <div
              :class="[
                'chat-bubble',
                comment.authorId === userInfo.id
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-400 text-base-content',
              ]"
              :style="{ backgroundColor: comment.color }">
              {{ comment.text }}
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="sticky bottom-0 left-0 right-0 p-2 border-t bg-base-100 z-10">
      <div class="flex flex-col space-y-2">
        <div
          class="flex items-start space-x-2 bg-base-200 rounded-xl border px-3 py-1">
          <!-- 主输入框 -->
          <textarea
            v-model="mainComment"
            class="flex-grow bg-transparent resize-none overflow-y-auto text-sm text-base-content"
            placeholder="来评论吧"
            rows="1"
            @input="adjustTextareaHeight"
            style="max-height: 100px; height: auto"
            @keydown.enter.prevent="handleEnterKey"></textarea>

          <!-- 轻量级发送按钮 -->
          <button
            @click="addComment"
            :disabled="!mainComment.trim()"
            class="text-primary self-center hover:text-primary-focus disabled:text-base-content/30 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useUserStore } from "~/stores/user";
//获取用户信息
const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);
const props = defineProps({
  commentData: {
    type: [Array, Object],
    default: [],
  },
});

// 创建响应式 comments
const comments = ref([]);

// 监听 commentData 的变化
watch(
  () => props.commentData,
  (newData) => {
    if (newData) {
      const commentData = newData;

      // 清空原有的评论数据
      comments.value = [];

      if (commentData.comments && commentData.comments.length > 0) {
        comments.value = commentData.comments.map((comment) => ({
          ...comment,
          avatar: comment.avatar || userInfo.value?.avatar || "默认头像地址",
          authorId: comment.authorId || userInfo.value?.id,
          nickname: comment.nickname || userInfo.value?.nickname,
          time: comment.timestamp
            ? new Date(comment.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          color: commentData.color || "hsl(264.05, 70%, 50%)",
          selectionId: commentData.selectionId,
          index: commentData.index || commentData.range?.index,
        }));
      }

      // 添加滚动到底部的逻辑
      nextTick(() => {
        if (commentsContainerRef.value) {
          commentsContainerRef.value.scrollTop = commentsContainerRef.value.scrollHeight;
        }
      });
    }
  },
  { immediate: true }
);

const mainComment = ref("");
const commentsContainerRef = ref(null);
const emits = defineEmits(["addComment"]);

const addComment = () => {
  const trimmedComment = mainComment.value.trim();
  if (trimmedComment) {
    const newComment = {
      id: Date.now(), 
      text: trimmedComment,
      authorId: userInfo.value?.id,
      nickname: userInfo.value?.nickname,
      avatar: userInfo.value?.avatar,
      color: userInfo.value?.color,
      timestamp: new Date().toLocaleString().replace(/\//g, '/'),
    };

    // 发送添加评论事件
    emits("addComment", {
      newComment: newComment,
      selectionId: props.commentData.selectionId,
      range: props.commentData.range,
    });

    // 重置输入框
    mainComment.value = "";

    // 下一个渲染周期滚动到底部
    nextTick(() => {
      if (commentsContainerRef.value) {
        commentsContainerRef.value.scrollTop = commentsContainerRef.value.scrollHeight;
      }
    });
  }
};

const adjustTextareaHeight = (event) => {
  const textarea = event.target;

  // 重置高度以正确计算滚动高度
  textarea.style.height = "auto";

  // 限制最大高度为100px
  const maxHeight = 100;

  // 如果内容高度小于最大高度，调整到内容高度
  if (textarea.scrollHeight <= maxHeight) {
    textarea.style.height = `${textarea.scrollHeight}px`;
  } else {
    // 达到最大高度后，固定高度并启用滚动
    textarea.style.height = `${maxHeight}px`;
    textarea.style.overflowY = "auto";
  }
};

const handleEnterKey = (event) => {
  // 如果按下Shift+Enter，插入换行
  if (event.ctrlKey) {
    mainComment.value += "\n";
    event.preventDefault();
    return;
  }

  // 普通回车且有内容时发送
  if (mainComment.value.trim()) {
    addComment();
  }
};
</script>

<style scoped>
/* 只保留通用性样式，移除写死颜色 */
textarea {
  outline: none;
  max-height: 100px;
  line-height: 1.5;
  padding: 8px;
}
textarea::-webkit-scrollbar {
  width: 4px;
}
textarea::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}
textarea::-webkit-scrollbar-track {
  background-color: transparent;
}
.chat-bubble {
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  max-width: 100%;
  overflow-wrap: break-word;
}

.selected-text-container {
  background-color: #f0f0f0;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  max-width: 100%;
}

.selected-text-content {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  max-height: 4.5em; /* 3行的高度 */
  color: #333;
  font-size: 14px;
}
</style>
