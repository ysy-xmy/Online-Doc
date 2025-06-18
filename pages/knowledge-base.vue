<template>
  <div class="p-8">
    <h1 class="text-3xl font-extrabold mb-6 flex items-center text-base-content">
      知识库
      <span class="ml-2 text-gray-400 text-base">📁</span>
    </h1>
    <div class="flex space-x-4 mb-8">
      <div class="rounded-lg shadow p-4 flex-1 flex items-center cursor-pointer transition-colors
                  bg-base-100 hover:bg-base-200">
        <div class="mr-4 text-3xl">📄</div>
        <div>
          <div class="font-semibold text-base-content">新建</div>
          <div class="text-gray-400 text-sm">新建文档并开始协作</div>
        </div>
      </div>
      <div class="rounded-lg shadow p-4 flex-1 flex items-center cursor-pointer transition-colors
                  bg-base-100 hover:bg-base-200">
        <div class="mr-4 text-3xl">🧩</div>
        <div>
          <div class="font-semibold text-base-content">模板库</div>
          <div class="text-gray-400 text-sm">选择模板快速新建</div>
        </div>
      </div>
      <div class="rounded-lg shadow p-4 flex-1 flex items-center cursor-pointer transition-colors
                  bg-base-100 hover:bg-base-200">
        <div class="mr-4 text-3xl">📚</div>
        <div>
          <div class="font-semibold text-base-content">新建知识库</div>
          <div class="text-gray-400 text-sm">让知识创造价值</div>
        </div>
      </div>
    </div>
    <div>
      <div class="flex items-center mb-4">
        <span class="font-semibold text-base-content">全部知识库</span>
        <button class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <svg width="20" height="20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
      <div class="grid grid-cols-5 gap-6">
        <div class="rounded-lg shadow p-6 flex flex-col items-start cursor-pointer transition-colors
                    bg-blue-600 hover:bg-blue-700 text-white">
          <div class="text-lg font-bold mb-2">测试</div>
          <div class="text-sm opacity-90">用来测试</div>
        </div>
        <!-- 这里可以继续添加知识库卡片 -->
      </div>
    </div>
  </div>
</template>

<script setup>
// 如果需要添加交互逻辑，可以在这里添加
</script>

<style scoped>
/* 如果需要添加自定义样式，可以在这里添加 */
</style> 