<template>
  <div class="timeline timeline-vertical">
    <div
        v-for="(version, index) in history"
        :key="index"
        class="timeline-item"
        @click="handleItemClick(version)"
    >
      <div class="timeline-start">{{ version.date }}</div>
      <div class="timeline-middle">
        <Icon name="mdi:circle" class="w-4 h-4" />
      </div>
      <div class="timeline-end timeline-box">{{ version.description }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue';

const emits = defineEmits(['version-click']);

const history = ref([
  { date: '2023-06-14', description: '初始版本', content: '初始内容' },
  { date: '2023-06-15', description: '第一次修改', content: '初始内容aaa' }
]);

const handleItemClick = (version) => {
  emits('version-click', version);
};
</script>
