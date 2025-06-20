<template>
  <button
    class="floating-summary-btn"
    :class="{ 
      'btn-primary': !isLoading,
      'btn-disabled': isLoading 
    }"
    @click="$emit('click')"
    :disabled="isLoading"
  >
    <span v-if="isLoading" class="loading loading-spinner"></span>
    <span v-else>AI摘要</span>
  </button>
</template>

<script setup>
defineProps({
  isLoading: Boolean
})

defineEmits(['click'])
</script>

<style scoped>
.floating-summary-btn {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}
</style>