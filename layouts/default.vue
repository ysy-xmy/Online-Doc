<template>
  <div class="flex h-screen bg-base-100">
    <!-- 左侧侧边栏 -->
    <Sidebar />

    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col shadow-lg">
      <!-- 顶部导航栏 -->
      <div class="navbar bg-base-100 border-b border-base-content/10 px-4 py-2 shadow-sm">
        <div class="flex-1">
          <div class="form-control">
            <input 
              type="text" 
              placeholder="搜索文档" 
              class="input input-bordered input-sm w-full max-w-xs bg-base-200 focus:outline-primary text-base-content" 
            />
          </div>
        </div>
        
        <!-- 主题切换开关 -->
        <ThemeChange />
        
        <div class="flex-none">
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
              <div class="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img 
                  alt="用户头像" 
                  src="https://picsum.photos/200" 
                  class="object-cover"
                />
              </div>
            </div>
            <ul tabindex="0" class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li><a class="text-base-content">个人资料</a></li>
              <li><a class="text-base-content">设置</a></li>
              <li><a class="text-base-content">退出</a></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 主内容插槽，占据剩余空间 -->
      <div class="flex-1 overflow-auto p-6 bg-base-200">
        <div class="max-w-full mx-auto bg-base-100 rounded-xl shadow-md overflow-hidden">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from '~/components/layouts/Sidebar.vue'
import ThemeChange from '~/components/layouts/ThemeChange.vue'
</script>

<style>
.table th:first-child {
  width: 40%;
}
</style> 