<template>
  <div class="w-64 bg-base-100 border-r border-base-content/10 p-4 shadow-sm">
    <div class="mb-4">
      <button class="flex items-center w-full px-3 py-2 rounded-lg text-base-content hover:bg-primary hover:text-primary-content transition font-semibold" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2" />
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
        知识库
      </button>
    </div>
    <div class="mb-6">
      <h2 class="text-xl font-bold text-base-content flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        主页
      </h2>
    </div>
    
    <!-- 侧边栏菜单 -->
    <ul class="menu p-0 space-y-1 w-full">
      <li class="menu-title">
        <span class="text-base-content/50">我的空间</span>
      </li>
      <li>
        <details open>
          <summary class="font-semibold text-base-content hover:bg-primary hover:text-primary-content rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
            共享空间
          </summary>
          <ul>
            <li><a class="text-base-content hover:bg-primary hover:text-primary-content">团队文档</a></li>
            <li><a class="text-base-content hover:bg-primary hover:text-primary-content">项目协作</a></li>
          </ul>
        </details>
      </li>
      <li>
        <details>
          <summary class="font-semibold text-base-content hover:bg-primary hover:text-primary-content rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
            </svg>
            词典
          </summary>
          <ul>
            <li><a class="text-base-content hover:bg-primary hover:text-primary-content">收藏</a></li>
            <li><a class="text-base-content hover:bg-primary hover:text-primary-content">回收站</a></li>
          </ul>
        </details>
      </li>
      <li>
        <button class="flex items-center w-full px-3 py-2 rounded-lg text-base-content hover:bg-primary hover:text-primary-content transition font-semibold mt-1" type="button" @click="$router.push('/knowledge-base')">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2" />
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none" />
          </svg>
          知识库
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
// 可以添加侧边栏相关的交互逻辑
</script>

<style scoped>
/* 可以添加额外的样式 */
</style> 