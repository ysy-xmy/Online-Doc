<script setup>
import { useDocumentStore } from '@/stores/document'

const documentStore = useDocumentStore()
const usersInfo = documentStore.usersInfo
</script>

<template>
  <div class="current-user-info" v-if="usersInfo.name">
    <div
      class="user-avatar"
      :style="{ backgroundColor: usersInfo.color }"
    >
      {{ usersInfo.name.charAt(0) }}
    </div>
    <div class="user-details">
      <div class="user-name">{{ usersInfo.name }}</div>
      <div class="user-id">ID: {{ usersInfo.clientID }}</div>
    </div>
  </div>
</template>

<style scoped>
.current-user-info {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 8px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  font-size: 12px;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.user-id {
  font-size: 10px;
  color: #666;
  font-family: monospace;
}
</style> 