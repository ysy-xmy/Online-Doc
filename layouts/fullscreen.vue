<template>
  <div class="document-layout bg-base-100 text-base-content flex relative">
    <!-- 左侧目录栏 -->
    <aside class="document-sidebar-left bg-base-200 w-64 p-4 border-r border-base-content/10">
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
      <header class="document-header bg-base-100 border-b border-base-content/10 px-4 py-2 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button class="btn btn-ghost btn-circle" @click="goBack">
            <Icon name="mdi:arrow-left" class="h-6 w-6" />
          </button>
          <div class="logo font-bold text-lg">文档编辑器</div>
        </div>
        <div class="header-actions flex items-center gap-4">
          <ThemeChange />
          <button class="btn btn-primary btn-sm" @click="saveDocument">保存</button>
          <button class="btn btn-secondary btn-sm">分享</button>
          <div class="flex-none">
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
                <div class="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img alt="用户头像" src="https://picsum.photos/200" class="object-cover" />
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
      </header>

      <!-- 文档和侧边栏容器 -->
      <div class="flex flex-1 overflow-hidden">
        <!-- 文档编辑区 -->
        <main class="document-content flex-1 p-6 bg-base-100 overflow-auto relative">
          <Yjsdemo @editor-mounted="handleEditorMounted" />
        </main>
      </div>
    </div>

    <SidebarController @version-click="handleVersionClick" />
    <div v-if="showVersionView" class="version-view-mask">
      <VersionView
          :version="selectedVersion"
          @back="closeVersionView"
          @restore="handleVersionRestore"
      />
    </div>
  </div>
</template>

<script setup>
import ThemeChange from "~/components/layouts/ThemeChange.vue";
import { ref, onUnmounted } from 'vue';
import Yjsdemo from "~/components/doc/yjsdemo.vue";
import SidebarController from "~/components/SidebarController.vue";
import VersionView from "~/pages/version/versionView.vue";
const router = useRouter();
const isEditorReady = ref(false);
const editorMethods = ref(null);

const goBack = () => {
  router.push("/");
};

const handleEditorMounted = (methods) => {
  editorMethods.value = methods;
  isEditorReady.value = true;
};

const saveDocument = async () => {
  if (!isEditorReady.value) {
    console.error("编辑器未加载完成，请稍后重试");
    return;
  }

  try {
    const content = editorMethods.value.getCurrentContent();
    console.log("保存文档内容:", JSON.stringify(content));
  } catch (error) {
    console.error("获取内容失败:", error.message);
  }
};

const showVersionView = ref(false);
const selectedVersion = ref(null);

// 阻止页面滚动
const preventDefaultScroll = (event) => {
  event.preventDefault();
};

const handleVersionClick = (version) => {
  // 设置选中的版本
  selectedVersion.value = version;
  // 显示版本查看组件
  showVersionView.value = true;
  // 禁用页面滚动
  document.body.classList.add('overflow-hidden');
  document.addEventListener('wheel', preventDefaultScroll, { passive: false });
  document.addEventListener('touchmove', preventDefaultScroll, { passive: false });
};

const closeVersionView = () => {
  showVersionView.value = false;
  // 恢复页面滚动
  document.body.classList.remove('overflow-hidden');
  document.removeEventListener('wheel', preventDefaultScroll);
  document.removeEventListener('touchmove', preventDefaultScroll);
};

const handleVersionRestore = async (version) => {
  try {
    console.log("正在恢复版本:", version.description);
    if (!editorMethods.value || !version.content) {
      console.error("编辑器未准备好或版本内容缺失");
      return;
    }
    editorMethods.value.setContent(version.content);
    closeVersionView();
  } catch (error) {
    console.error("恢复失败:", error);
  }
};

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('wheel', preventDefaultScroll);
  document.removeEventListener('touchmove', preventDefaultScroll);
});
</script>

<style scoped>
.document-layout {
  height: 100vh;
  width: 100vw;
}

.document-content {
  max-width: 100%;
}
.version-view-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
