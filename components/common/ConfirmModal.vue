<template>
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">{{ title }}</h3>
      <p class="py-4">{{ message }}</p>
      <div class="modal-action">
        <button class="btn btn-ghost" @click="$emit('cancel')">
          取消
        </button>
        <button class="btn btn-error" @click="$emit('confirm')">
          确认
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="$emit('cancel')"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  message: string
}

defineProps<Props>()
defineEmits(['confirm', 'cancel'])
</script>
