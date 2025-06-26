<template>
  <div class="space-y-4 h-full flex flex-col">
    <!-- 评论列表 容器可滚动 -->
    <!-- {{ commentData }} -->
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
              comment.author !== '当前用户' ? 'chat-start' : 'chat-end',
            ]">
            <div class="chat-image avatar">
              <div class="w-10 rounded-full">
                <img :src="comment.avatar" :alt="comment.author" />
              </div>
            </div>
            <div class="chat-header flex justify-between items-center">
              <div>
                {{ comment.author !== "当前用户" ? comment.author : "" }}
                <time class="text-xs opacity-50 ml-2">{{ comment.time }}</time>
              </div>
            </div>
            <div
              :class="[
                'chat-bubble',
                comment.author === '当前用户'
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-400 text-base-content',
              ]"
              :style="{ backgroundColor: comment.color }">
              {{ comment.text }}
            </div>
            <!-- 回复按钮 -->
            <div
              v-if="comment.author !== '当前用户'"
              class="chat-footer opacity-50">
              <button
                class="text-xs hover:underline mr-2"
                @click="setReferencedComment(comment)">
                回复
              </button>
            </div>
          </div>

          <!-- 渲染该评论的所有回复 -->
          <div
            v-for="(reply, replyIndex) in comment.replies"
            :key="`${commentIndex}-${replyIndex}`"
            class="chat chat-end ml-12 right-4">
            <div class="chat-image avatar">
              <div class="w-10 rounded-full">
                <img :src="reply.avatar" :alt="reply.author" />
              </div>
            </div>
            <div class="chat-header">
              {{ reply.author !== "当前用户" ? reply.author : "" }}
              <time class="text-xs opacity-50 ml-2">{{ reply.time }}</time>
            </div>
            <div class="chat-bubble bg-primary text-primary-content">
              {{ reply.text }}
            </div>

            <!-- 引用的原始消息 -->
            <div
              v-if="reply.referencedText && reply.author === '当前用户'"
              class="mt-1 ml-4 text-sm flex flex-row p-2 rounded-lg bg-base-200 text-base-content max-w-[150px]">
              <div
                class="font-extrabold text-sm text-base-content/70 mb-1 w-20 whitespace-nowrap">
                引用：
              </div>
              <div
                class="inline-block overflow-hidden break-all whitespace-nowrap text-ellipsis">
                {{ reply.referencedText }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="sticky bottom-0 left-0 right-0 p-2 border-t bg-base-100 z-10">
      <div class="flex flex-col space-y-2">
        <!-- 引用提示 -->
        <div
          v-if="currentReferencedText"
          class="bg-base-200 p-2 rounded-lg text-sm text-base-content flex justify-between items-center">
          <span>
            <span class="font-bold">引用：</span>
            {{ currentReferencedText }}
          </span>
          <button
            @click="clearReferencedComment"
            class="text-base-content/50 hover:text-base-content">
            ✕
          </button>
        </div>

        <div
          class="flex items-start space-x-2 bg-base-200 rounded-xl border px-3 py-1">
          <!-- 表情按钮 -->
          <div class="relative">
            <button
              @click="toggleEmojiPicker"
              class="text-2xl"
              ref="emojiButtonRef">
              😊
            </button>
            <!-- 表情选择器 -->
            <div
              v-if="showEmojiPicker"
              class="absolute bottom-full left-0 bg-base-100 border rounded-lg p-2 grid grid-cols-5 gap-2 shadow-lg z-50 w-[250px]"
              ref="emojiPickerRef"
              @click.stop>
              <button
                v-for="emoji in emojis"
                :key="emoji"
                @click="selectEmoji(emoji)"
                class="text-2xl hover:bg-base-200 rounded">
                {{ emoji }}
              </button>
            </div>
          </div>

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

      // 直接使用 comments 数组
      if (commentData.comments && commentData.comments.length > 0) {
        comments.value = commentData.comments.map((comment) => ({
          ...comment,
          avatar: "https://picsum.photos/200/200?random=" + Math.floor(Math.random() * 5),
          time: comment.timestamp
            ? new Date(comment.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          color: commentData.color || "hsl(264.05, 70%, 50%)",
          replies: comment.replies || [],
          selectionId: commentData.selectionId,
          index: commentData.index || commentData.range?.index,
        }));
      } else {
        comments.value = [];
      }
    }
  },
  { immediate: true }
);

const emojis = [
  "😀",
  "😃",
  "😄",
  "😅",
  "😆",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "❤️",
  "👍",
  "👏",
  "🎉",
  "🌟",
];

const mainComment = ref("");
const showEmojiPicker = ref(false);
const emojiButtonRef = ref(null);
const emojiPickerRef = ref(null);

const currentReferencedText = ref(null);
const currentReferencedComment = ref(null);
const emits = defineEmits(["addComment"]);
// 处理全局点击事件
const handleGlobalClick = (event) => {
  // 主输入框表情选择器
  if (
    emojiButtonRef.value &&
    emojiPickerRef.value &&
    !emojiButtonRef.value.contains(event.target) &&
    !emojiPickerRef.value.contains(event.target)
  ) {
    showEmojiPicker.value = false;
  }
};

// 添加和移除全局点击事件监听器
onMounted(() => {
  document.addEventListener("click", handleGlobalClick);
});

onUnmounted(() => {
  document.removeEventListener("click", handleGlobalClick);
});

const toggleEmojiPicker = (event) => {
  // 阻止事件冒泡
  event.stopPropagation();
  showEmojiPicker.value = !showEmojiPicker.value;
};

const selectEmoji = (emoji) => {
  // 根据当前是否在回复输入框中来决定插入位置
  if (currentReferencedComment.value) {
    currentReferencedComment.value.text += emoji;
  } else {
    mainComment.value += emoji;
  }
  showEmojiPicker.value = false;
};

const setReferencedComment = (comment) => {
  currentReferencedText.value = comment.text;
  currentReferencedComment.value = comment;
};

const clearReferencedComment = () => {
  currentReferencedText.value = null;
  currentReferencedComment.value = null;
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

const commentsContainerRef = ref(null);

const addComment = () => {
  const trimmedComment = mainComment.value.trim();
  if (trimmedComment) {
    const newComment = {
      id: Date.now(), 
      text: trimmedComment,
      author: "当前用户",
      timestamp: new Date().toLocaleString().replace(/\//g, '/'),
    };

    // 发送添加评论事件
    emits("addComment", {
      newComment: newComment,
      selectionId: props.commentData.selectionId,
      range: props.commentData.range
    });

    // 重置输入框
    mainComment.value = "";
    showEmojiPicker.value = false;

    // 重置输入框高度
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "auto";
    }

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
</style>
