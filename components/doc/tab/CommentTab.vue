<template>
  <div class="space-y-4 h-full flex flex-col">
    <!-- 评论列表 容器可滚动 -->
    <div class="flex-grow overflow-y-auto max-h-[calc(100vh-200px)]">
      <!-- 评论列表 -->
      <div class="space-y-4">
        <template 
          v-for="(comment, commentIndex) in comments" 
          :key="commentIndex"
        >
          <!-- 渲染原始评论 -->
          <div 
            :class="[
              'chat', 
              comment.author !== '当前用户' ? 'chat-start' : 'chat-end'
            ]"
          >
            <div class="chat-image avatar">
              <div class="w-10 rounded-full">
                <img :src="comment.avatar" :alt="comment.author" />
              </div>
            </div>
            <div class="chat-header">
              {{ comment.author !== '当前用户' ? comment.author : '' }}
              <time class="text-xs opacity-50 ml-2">{{ comment.time }}</time>
            </div>
            <div 
              :class="[
                'chat-bubble', 
                comment.author === '当前用户' ? 'chat-bubble-primary' : ''
              ]"
            >
              {{ comment.text }}
            </div>
            <!-- 回复按钮 -->
            <div 
              v-if="comment.author !== '当前用户'" 
              class="chat-footer opacity-50"
            >
              <button 
                class="text-xs hover:underline mr-2"
                @click="setReferencedComment(comment)"
              >
                回复
              </button>
            </div>
          </div>

          <!-- 渲染该评论的所有回复 -->
          <div 
            v-for="(reply, replyIndex) in comment.replies" 
            :key="`${commentIndex}-${replyIndex}`" 
            class="chat chat-end ml-12 right-4"
          >
            <div class="chat-image avatar">
              <div class="w-10 rounded-full">
                <img :src="reply.avatar" :alt="reply.author" />
              </div>
            </div>
            <div class="chat-header">
              {{ reply.author !== '当前用户' ? reply.author : '' }}
              <time class="text-xs opacity-50 ml-2">{{ reply.time }}</time>
            </div>
            <div class="chat-bubble chat-bubble-primary">{{ reply.text }}</div>
            
            <!-- 引用的原始消息 -->
            <div 
              v-if="reply.referencedText && reply.author === '当前用户'" 
              class=" mt-1 ml-4 text-sm text-gray-400 flex flex-row p-2 rounded-lg bg-gray-100 max-w-[150px]"
            >
              <div class="font-extrabold text-sm text-gray-500 mb-1 w-20 whitespace-nowrap">引用：</div>
              <div class="inline-block overflow-hidden break-all whitespace-nowrap text-ellipsis">{{ reply.referencedText }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="sticky bottom-0 left-0 right-0 p-2 border-t bg-white z-10">
      <div class="flex flex-col space-y-2">
        <!-- 引用提示 -->
        <div 
          v-if="currentReferencedText" 
          class="bg-gray-100 p-2 rounded-lg text-sm text-gray-500 flex justify-between items-center"
        >
          <span>
            <span class="font-bold">引用：</span>
            {{ currentReferencedText }}
          </span>
          <button 
            @click="clearReferencedComment" 
            class="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div class="flex items-start space-x-2 bg-gray rounded-xl border-1 px-3 py-1">
          <!-- 表情按钮 -->
          <div class="relative">
            <button 
              @click="toggleEmojiPicker" 
              class="text-2xl"
              ref="emojiButtonRef"
            >
              😊
            </button>
            <!-- 表情选择器 -->
            <div 
              v-if="showEmojiPicker" 
              class="absolute bottom-full left-0 bg-white border rounded-lg p-2 grid grid-cols-5 gap-2 shadow-lg z-50 w-[250px]"
              ref="emojiPickerRef"
              @click.stop
            >
              <button 
                v-for="emoji in emojis" 
                :key="emoji"
                @click="selectEmoji(emoji)"
                class="text-2xl hover:bg-gray-100 rounded"
              >
                {{ emoji }}
              </button>
            </div>
          </div>

          <!-- 主输入框 -->
          <textarea 
            v-model="mainComment"
            class="flex-grow bg-transparent resize-none overflow-y-auto text-sm" 
            placeholder="来评论吧"
            rows="1"
            @input="adjustTextareaHeight"
            style="max-height: 100px; height: auto;"
            @keydown.enter.prevent="handleEnterKey"
          ></textarea>

          <!-- 轻量级发送按钮 -->
          <button 
            @click="addComment"
            :disabled="!mainComment.trim()"
            class="text-blue-500 self-center hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 表情列表
const emojis = [
  '😀', '😃', '😄', '��', '😆', 
  '😊', '😇', '🙂', '🙃', '😉',
  '❤️', '👍', '👏', '🎉', '🌟'
]

const mainComment = ref('')
const showEmojiPicker = ref(false)
const emojiButtonRef = ref(null)
const emojiPickerRef = ref(null)

const currentReferencedText = ref(null)
const currentReferencedComment = ref(null)

// 处理全局点击事件
const handleGlobalClick = (event) => {
  // 主输入框表情选择器
  if (
    emojiButtonRef.value && 
    emojiPickerRef.value &&
    !emojiButtonRef.value.contains(event.target) &&
    !emojiPickerRef.value.contains(event.target)
  ) {
    showEmojiPicker.value = false
  }
}

// 添加和移除全局点击事件监听器
onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
})

const toggleEmojiPicker = (event) => {
  // 阻止事件冒泡
  event.stopPropagation()
  showEmojiPicker.value = !showEmojiPicker.value
}

const selectEmoji = (emoji) => {
  // 根据当前是否在回复输入框中来决定插入位置
  if (currentReferencedComment.value) {
    currentReferencedComment.value.text += emoji
  } else {
    mainComment.value += emoji
  }
  showEmojiPicker.value = false
}

const setReferencedComment = (comment) => {
  currentReferencedText.value = comment.text
  currentReferencedComment.value = comment
}

const clearReferencedComment = () => {
  currentReferencedText.value = null
  currentReferencedComment.value = null
}

const handleEnterKey = (event) => {
  // 如果按下Shift+Enter，插入换行
  if (event.ctrlKey) {
    mainComment.value += '\n'
    event.preventDefault()
    return
  }
  
  // 普通回车且有内容时发送
  if (mainComment.value.trim()) {
    addComment()
  }
}

const addComment = () => {
  // 去除首尾空白后检查是否有内容
  const trimmedComment = mainComment.value.trim()
  if (trimmedComment) {
    const newComment = {
      author: '当前用户',
      avatar: 'https://picsum.photos/200/200?random=4',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: trimmedComment,
      replies: []
    }

    // 如果有引用，处理引用逻辑
    if (currentReferencedComment.value) {
      const newReply = {
        ...newComment,
        referencedText: currentReferencedText.value
      }
      currentReferencedComment.value.replies.push(newReply)
      
      // 清空输入框和引用信息
      mainComment.value = ''
      clearReferencedComment()
    } else {
      comments.value.push(newComment)
      
      // 重置输入框和引用
      mainComment.value = ''
      showEmojiPicker.value = false
    }

    // 重置输入框高度
    const textarea = document.querySelector('textarea')
    if (textarea) {
      textarea.style.height = 'auto'
    }
  }
}

const adjustTextareaHeight = (event) => {
  const textarea = event.target
  
  // 重置高度以正确计算滚动高度
  textarea.style.height = 'auto'
  
  // 限制最大高度为100px
  const maxHeight = 100
  
  // 如果内容高度小于最大高度，调整到内容高度
  if (textarea.scrollHeight <= maxHeight) {
    textarea.style.height = `${textarea.scrollHeight}px`
  } else {
    // 达到最大高度后，固定高度并启用滚动
    textarea.style.height = `${maxHeight}px`
    textarea.style.overflowY = 'auto'
  }
}

const comments = ref([
  {
    author: '小木鱼',
    avatar: 'https://picsum.photos/200/200?random=1',
    time: '12:45',
    text: '这段描述需要调整一下333333333333333333333333',
    replies: []
  }
])
</script>

<style scoped>
.chat-bubble-primary {
  background-color: #3b82f6;
  color: white;
}

/* 自定义输入框样式 */
textarea {
  outline: none;
  max-height: 100px; /* 限制最大高度 */
  line-height: 1.5;
  padding: 8px;
}

/* 隐藏默认滚动条，但保留滚动功能 */
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