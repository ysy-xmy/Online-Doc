<template>
  <div class="space-y-4">
    <div 
      v-for="(revision, index) in revisions" 
      :key="index" 
      class="alert"
      :class="revision.type === 'warning' ? 'alert-warning' : ''"
    >
      <Icon :name="revision.icon" class="w-6 h-6" />
      <span>{{ revision.text }}</span>
    </div>
  </div>
</template>

<script setup>
const revisions = [
  { 
    type: 'info', 
    icon: 'mdi:pencil', 
    text: '第3段文字被修改' 
  },
  { 
    type: 'warning', 
    icon: 'mdi:delete', 
    text: '删除了一个段落' 
  }
]
</script>