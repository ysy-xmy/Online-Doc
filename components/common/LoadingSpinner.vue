<template>
  <div class="flex justify-center items-center" :class="containerClass">
    <span class="loading loading-spinner" :class="spinnerClass"></span>
    <span v-if="text" class="ml-2 text-base-content/70">{{ text }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  text: {
    type: String,
    default: ''
  },
  containerClass: {
    type: String,
    default: 'py-8'
  }
})

const spinnerClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'loading-sm'
    case 'lg': return 'loading-lg'
    default: return ''
  }
})
</script>
