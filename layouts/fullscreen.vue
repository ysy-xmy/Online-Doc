<template>
  <div class="document-layout bg-base-100 text-base-content">
    <header class="document-header bg-base-100 border-b border-base-content/10">
      <div class="header-content">
        <div class="flex items-center gap-4">
          <button 
            class="btn btn-ghost btn-circle"
            @click="goBack"
          >
            <Icon name="mdi:arrow-left" class="h-6 w-6" />
          </button>
          <div class="logo font-bold text-lg">文档编辑器</div>
        </div>
        <div class="header-actions flex items-center gap-4">
          <ThemeChange />
          <button class="btn btn-primary btn-sm">保存</button>
          <button class="btn btn-secondary btn-sm">分享</button>
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
      </div>
    </header>
    
    <div class="document-main-container flex flex-1 overflow-hidden">
      <main class="document-content bg-base-100 p-5 flex-1 overflow-y-auto">
        <slot></slot>
      </main>
      
      <aside class="document-sidebar bg-base-200 text-base-content border-l border-base-content/10 w-[300px] p-5 overflow-y-auto">
        <div class="sidebar-section mb-5">
          <h3 class="text-base-content border-b border-base-content/10 pb-2 mb-2">文档大纲</h3>
          <!-- 可以在这里添加文档大纲 -->
        </div>
        <div class="sidebar-section mb-5">
          <h3 class="text-base-content border-b border-base-content/10 pb-2 mb-2">协作者</h3>
          <!-- 可以在这里添加协作者信息 -->
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import ThemeChange from '~/components/layouts/ThemeChange.vue'

const router = useRouter()

const goBack = () => {
  router.push('/')  // 返回到首页（默认布局）
}
</script>

<style scoped>
.document-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
}

.document-header {
  height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.logo {
  font-size: 18px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-actions button {
  margin-left: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.document-main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.document-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  max-width: calc(100% - 300px);
}

.document-sidebar {
  width: 300px;
  padding: 20px;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 20px;
}

.sidebar-section h3 {
  padding-bottom: 10px;
  margin-bottom: 10px;
}
</style>