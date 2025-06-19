<template>
  <div class="space-y-4">
    <div class="chat chat-start">
      <div class="chat-image avatar">
        <div class="w-10 rounded-full">
          <img :src="comment.avatar" :alt="comment.author" />
        </div>
      </div>
      <div class="chat-header">
        {{ comment.author }}
        <time class="text-xs opacity-50 ml-2">{{ comment.time }}</time>
      </div>
      <div class="chat-bubble">{{ comment.text }}</div>
      <div class="chat-footer opacity-50">
        <button 
          class="text-xs hover:underline mr-2"
          @click="showReplyInput = true"
        >
          回复
        </button>
      </div>
    </div>

    <!-- 回复输入框 -->
    <div v-if="showReplyInput" class="ml-12 mt-2">
      <textarea 
        class="textarea textarea-bordered w-full" 
        placeholder="输入回复..."
        v-model="replyText"
      ></textarea>
      <div class="flex justify-end space-x-2 mt-2">
        <button 
          class="btn btn-ghost btn-sm"
          @click="showReplyInput = false"
        >
          取消
        </button>
        <button 
          class="btn btn-primary btn-sm"
          @click="submitReply"
        >
          发送
        </button>
      </div>
    </div>

    <!-- 回复消息 -->
    <div class="chat chat-end ml-12">
      <div class="chat-image avatar">
        <div class="w-10 rounded-full">
          <img :src="reply.avatar" :alt="reply.author" />
        </div>
      </div>
      <div class="chat-header">
        {{ reply.author }}
        <time class="text-xs opacity-50 ml-2">{{ reply.time }}</time>
      </div>
      <div class="chat-bubble chat-bubble-primary">{{ reply.text }}</div>
    </div>
  </div>
</template>

<script setup>
const showReplyInput = ref(false)
const replyText = ref('')

const comment = {
  author: '小木鱼',
  avatar: 'https://picsum.photos/200/200?random=1',
  time: '12:45',
  text: '这段描述需要调整一下'
}

const reply = {
  author: 'Peter',
  avatar: 'https://picsum.photos/200/200?random=2',
  time: '12:46',
  text: '好的，我会修改'
}

const submitReply = () => {
  if (replyText.value.trim()) {
    // 处理回复逻辑
    console.log('回复内容：', replyText.value)
    replyText.value = ''
    showReplyInput.value = false
  }
}
</script>