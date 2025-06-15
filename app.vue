<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>

</template>

<script setup>
import { onMounted } from "vue";
import { themeChange } from "theme-change";
onMounted(() => {
  themeChange(false);
});
</script>
