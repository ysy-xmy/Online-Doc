<template>
  <div class="space-y-4 h-full flex flex-col">
    <!-- 评论列表区域 -->
    <div v-if="!selectedComment" class="flex-grow overflow-y-auto h-full pb-32">
      <div class="space-y-10">
        <div 
          v-for="(comment, index) in commentList" 
          :key="index" 
          @click="selectComment(comment)"
          class="cursor-pointer hover:bg-base-200 p-3 rounded-lg transition-colors border-l-4"
          :style="{ borderColor: comment.color || 'transparent' }">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <img 
                :src="comment.avatar || '/default-avatar.png'" 
                :alt="comment.nickname" 
                class="w-10 h-10 rounded-full object-cover" 
              />
            </div>
            <div class="flex-grow">
              <div class="flex justify-between items-center mb-1">
                <div class="text-sm font-semibold">
                 评论文本：
                </div>
               
                <div class="text-sm text-gray-600 line-clamp-2 w-20 overflow-ellipsis">
                {{ comment.selectedText }}
              </div>
              </div>
              <span class="text-xs text-gray-500 ">
                  {{ comment.createTime }}
                </span>
      
              
              <div class="mt-2 space-y-1">
                <div 
                  v-for="(subComment, commentIndex) in comment.comments.slice(0, 2)" 
                  :key="commentIndex"
                  class="bg-base-100 rounded-lg p-2 text-xs">
                  <div class="flex items-center space-x-2">
                    <img 
                      :src="subComment.avatar || '/default-avatar.png'" 
                      class="w-6 h-6 rounded-full" 
                    />
                    <span class="font-medium">{{ subComment.nickname }}</span>
                    <span class="text-gray-500">{{ subComment.timestamp }}</span>
                  </div>
                  <p class="mt-1 text-gray-700">{{ subComment.text }}</p>
                </div>
              </div>
              
              <div 
                v-if="comment.comments.length > 2" 
                class="text-xs text-primary mt-1">
                查看全部 {{ comment.comments.length }} 条评论
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细评论区域 -->
    <div v-else class="h-full flex flex-col">
      <div class="flex items-center p-2 border-b">
        <button @click="selectedComment = null" class="mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <span class="text-sm font-semibold">全部评论</span>
      </div>

      <!-- 选中文本展示区域 -->
      <div v-if="selectedComment" class="selected-text-container m-2">
        <div class="selected-text-content">
          {{ selectedComment.selectedText }}
        </div>
      </div>

      <div 
        ref="commentsContainerRef"
        class="flex-grow overflow-y-auto max-h-[calc(100vh-200px)] pb-4">
        <div class="space-y-4">
          <template
            v-for="(comment, commentIndex) in selectedComment.comments"
            :key="commentIndex">
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
                  <time class="text-xs opacity-50 ml-2">{{ comment.timestamp }}</time>
                </div>
              </div>
              <div
                :class="[
                  'chat-bubble',
                  comment.authorId === userInfo.id
                    ? 'bg-primary text-primary-content'
                    : 'bg-base-400 text-base-content',
                ]"
                :style="{ backgroundColor: selectedComment.color }">
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
            <textarea
              v-model="mainComment"
              class="flex-grow bg-transparent resize-none overflow-y-auto text-sm text-base-content"
              placeholder="来评论吧"
              rows="1"
              @input="adjustTextareaHeight"
              style="max-height: 100px; height: auto"
              @keydown.enter.prevent="handleEnterKey"></textarea>

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
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useUserStore } from "~/stores/user";

const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);

const props = defineProps({
  commentData: {
    type: [Array, Object],
    default: () => [],
  },
  commentAlldata: {
    type: Array,
    default: () => [],
  }
});

const comments = ref(null);
const selectedComment = ref(null);
const mainComment = ref("");
const commentsContainerRef = ref(null);

const emits = defineEmits(["addComment"]);

// 计算属性：处理评论列表
const commentList = computed(() => {
  if (props.commentData && props.commentData.length > 0) {
    return props.commentData;
  }
  return props.commentAlldata || [];
});

// 选择具体评论
const selectComment = (comment) => {
  selectedComment.value = comment;
  comments.value = comment.comments || [];
};

// 监听 commentData 的变化
watch(
  () => props.commentData,
  (newData) => {
    if (newData) {
      const commentData = newData;
      
      // 直接将 commentData 赋值给 selectedComment
      selectedComment.value = commentData;
      
      // 如果有 selectionId，尝试在 commentList 中匹配
      if (commentData.selectionId) {
        const matchedComment = commentList.value.find(
          comment => comment.selectionId === commentData.selectionId
        );
        
        if (matchedComment) {
          selectedComment.value = matchedComment;
        }
      }
      
      // 确保 comments 存在
      comments.value = commentData.comments || [];
    }
  },
  { immediate: true }
);

const addComment = () => {
  const trimmedComment = mainComment.value.trim();
  if (trimmedComment && selectedComment.value) {
    const newComment = {
      id: Date.now(), 
      text: trimmedComment,
      authorId: userInfo.value?.id,
      nickname: userInfo.value?.nickname,
      avatar: userInfo.value?.avatar,
      color: userInfo.value?.color,
      timestamp: new Date().toLocaleString().replace(/\//g, '/'),
    };

    // 确保 comments 存在，如果不存在则初始化
    if (!selectedComment.value.comments) {
      selectedComment.value.comments = [];
    }

    // 追加新评论到 selectedComment
    selectedComment.value.comments.push(newComment);

    // 发送添加评论事件
    emits("addComment", {
      newComment: newComment,
      selectionId: selectedComment.value.selectionId || 
                   (selectedComment.value.range ? selectedComment.value.range.index : null),
      range: selectedComment.value.range,
      fullComment: selectedComment.value
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
  textarea.style.height = "auto";
  const maxHeight = 100;

  if (textarea.scrollHeight <= maxHeight) {
    textarea.style.height = `${textarea.scrollHeight}px`;
  } else {
    textarea.style.height = `${maxHeight}px`;
    textarea.style.overflowY = "auto";
  }
};

const handleEnterKey = (event) => {
  if (event.ctrlKey) {
    mainComment.value += "\n";
    event.preventDefault();
    return;
  }

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

/* 新增样式 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
