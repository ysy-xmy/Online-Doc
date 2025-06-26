<template>
  <button
    class="floating-summary-btn"
    :class="{ 
      'btn-primary': !isLoading,
      'btn-disabled': isLoading ,
      'cursor-pointer': !isLoading,
      'cursor-not-allowed': isLoading
    }"
    @click="$emit('click')"
    :disabled="isLoading"
  >
    <span v-if="isLoading" class="loading loading-spinner"></span>
    <span v-else >AI摘要</span>
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
  position: absolute;
  right: 3.5rem;
  bottom: 2.5rem;
  height: 2.5rem;
  width: 4rem;
  z-index: 10;
  border-radius: 50%;
  background-color: #f3f4f6;
  cursor: pointer;
}
</style>