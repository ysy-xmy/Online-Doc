<template>
  <div class="document-layout bg-base-100 text-base-content flex">
    <!-- 左侧目录栏 -->
    <aside
      class="document-sidebar-left bg-base-200 w-64 p-4 border-r border-base-content/10"
    >
      <h2 class="text-lg font-bold mb-4 border-b border-base-content/10 pb-2">
        知识库名称
      </h2>
      <nav>
        <ul class="menu w-full">
          <li><a class="active">知识库文件1</a></li>
          <li><a>知识库文件2</a></li>
          <li><a>知识库文件3</a></li>
          <li><a>知识库文件4</a></li>
        </ul>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部操作栏 -->
      <header
        class="document-header bg-base-100 border-b border-base-content/10 px-4 py-2 flex justify-between items-center"
      >
        <div class="flex items-center gap-4">
          <button class="btn btn-ghost btn-circle" @click="goBack">
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
              <div
                tabindex="0"
                role="button"
                class="btn btn-ghost btn-circle avatar"
              >
                <div
                  class="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
                >
                  <img
                    alt="用户头像"
                    src="https://picsum.photos/200"
                    class="object-cover"
                  />
                </div>
              </div>
              <ul
                tabindex="0"
                class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
              >
                <li><a class="text-base-content">个人资料</a></li>
                <li><a class="text-base-content">设置</a></li>
                <li><a class="text-base-content">退出</a></li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <!-- 文档和侧边栏容器 -->
      <div class="flex flex-1 overflow-hidden">
        <!-- 文档编辑区 -->
        <main
          class="document-content flex-1 p-6 bg-base-100 overflow-auto relative"
        >
           <slot></slot>
  
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import ThemeChange from "~/components/layouts/ThemeChange.vue";
// 动态导入组件（避免服务端加载）
const Editor = defineAsyncComponent(() => import('./editor.vue'));
const router = useRouter();

const goBack = () => {
  router.push("/"); // 返回到首页（默认布局）
};
</script>

<style scoped>
.document-layout {
  height: 100vh;
  width: 100vw;
}

.document-content {
  max-width: 100%;
}
</style>
