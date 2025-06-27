<template>
  <div class="flex flex-col items-center justify-center text-base-content/60" :class="containerClass">
    <div class="mb-6">
      <slot name="icon">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </slot>
    </div>
    
    <h3 class="text-xl font-semibold mb-2 text-base-content/70">{{ title }}</h3>
    
    <p v-if="description" class="text-base-content/50 mb-6 text-center max-w-md">
      {{ description }}
    </p>
    
    <div v-if="$slots.actions" class="flex flex-col sm:flex-row gap-3">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  containerClass: {
    type: String,
    default: 'py-16'
  }
})
</script>
