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
  // 初始化主题切换
  themeChange(false);

  // 检查并设置初始主题
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});
</script>

<style>
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
