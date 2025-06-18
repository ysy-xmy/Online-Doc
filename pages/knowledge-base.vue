<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6 flex items-center">
      知识库
      <span class="ml-2 text-gray-400 text-base">📁</span>
    </h1>
    <div class="flex space-x-4 mb-8">
      <div class="bg-white rounded-lg shadow p-4 flex-1 flex items-center">
        <div class="mr-4 text-3xl">📄</div>
        <div>
          <div class="font-semibold">新建</div>
          <div class="text-gray-400 text-sm">新建文档并开始协作</div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 flex-1 flex items-center">
        <div class="mr-4 text-3xl">🧩</div>
        <div>
          <div class="font-semibold">模板库</div>
          <div class="text-gray-400 text-sm">选择模板快速新建</div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 flex-1 flex items-center">
        <div class="mr-4 text-3xl">📚</div>
        <div>
          <div class="font-semibold">新建知识库</div>
          <div class="text-gray-400 text-sm">让知识创造价值</div>
        </div>
      </div>
    </div>
    <div>
      <div class="flex items-center mb-4">
        <span class="font-semibold">全部知识库</span>
        <button class="ml-2 text-gray-400"><svg width="20" height="20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/></svg></button>
      </div>
      <div class="grid grid-cols-5 gap-6">
        <div class="bg-blue-600 text-white rounded-lg shadow p-6 flex flex-col items-start">
          <div class="text-lg font-bold mb-2">测试</div>
          <div class="text-sm">用来测试</div>
        </div>
        <!-- 这里可以继续添加知识库卡片 -->
      </div>
    </div>
  </div>
</template> 