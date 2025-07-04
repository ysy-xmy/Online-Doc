<template>
    <div class="w-64 bg-base-100 border-r border-base-content/10 p-4 shadow-sm">
        <div class="mb-6">
            <h2 class="text-xl font-bold text-base-content flex items-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6 mr-2 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                </svg>
                {{ currentPageTitle }}
            </h2>
        </div>

        <!-- 侧边栏菜单 -->
        <ul class="menu p-0 space-y-1 w-full">
            <li class="menu-title">
                <span class="text-base-content/50">我的空间</span>
            </li>
            <li>
                <button
                    class="flex items-center w-full px-3 py-2 rounded-lg text-base-content hover:bg-primary hover:text-primary-content transition font-semibold mt-1"
                    type="button"
                    @click="navigateToHome"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                    </svg>
                    主页
                </button>
            </li>

            <li>
                <button
                    class="flex items-center w-full px-3 py-2 rounded-lg text-base-content hover:bg-primary hover:text-primary-content transition font-semibold mt-1"
                    type="button"
                    @click="navigateToKnowledgeBase"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 6v6l4 2"
                        />
                        <rect
                            x="3"
                            y="4"
                            width="18"
                            height="16"
                            rx="2"
                            stroke="currentColor"
                            stroke-width="2"
                            fill="none"
                        />
                    </svg>
                    知识库
                </button>

                <!-- 知识库二级菜单 -->
                <ul
                    v-if="isKnowledgeBaseExpanded"
                    class="menu-sub pl-4 space-y-1"
                >
                    <!-- 空状态 -->
                    <li
                        v-if="knowledgeBaseMenus.length === 0"
                        class="px-3 py-2 text-base-content/50 text-sm"
                    >
                        暂无知识库
                    </li>

                    <!-- 知识库列表 -->
                    <li
                        v-else
                        v-for="menu in knowledgeBaseMenus"
                        :key="menu.id"
                    >
                        <button
                            class="flex items-center w-full px-3 py-2 rounded-lg text-base-content hover:bg-primary/10 transition font-medium"
                            @click="
                                navigateToKnowledgeBasePage(
                                    menu.path,
                                    menu.name
                                )
                            "
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5 mr-2"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                            {{ menu.name }}
                        </button>
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useWorkspaceStore } from "~/stores/workspace";

const workspaceStore = useWorkspaceStore();
const router = useRouter();
const route = useRoute();

// 在组件挂载时获取知识库数据
onMounted(async () => {
    try {
        await workspaceStore.fetchWorkspaces({ refresh: true });
    } catch (error) {
        console.error("获取知识库列表失败:", error);
    }
});

// 知识库二级菜单配置 - 使用computed保持响应性
const knowledgeBaseMenus = computed(() => {
    return workspaceStore.workspaces.map((workspace) => ({
        name: workspace.name,
        path: `/knowledgeBase/${workspace.id}`,
        id: workspace.id,
    }));
});

// 响应式页面标题和展开状态
const currentPageTitle = ref("主页");
const isKnowledgeBaseExpanded = ref(true);

// 更新页面标题的方法
const updatePageTitle = (title) => {
    currentPageTitle.value = title;
};

// 导航到主页
const navigateToHome = () => {
    updatePageTitle("主页");
    router.push("/");
};

// 导航到知识库页面
const navigateToKnowledgeBase = () => {
    updatePageTitle("知识库");
    router.push("/knowledgeHome").then(() => {
        // 确保标题更新
        updatePageTitle("知识库");
    });
};

// 导航到知识库子页面
const navigateToKnowledgeBasePage = (path, name) => {
    updatePageTitle(name);
    router.push(path).then(() => {
        window.location.reload(); // 强制刷新页面
    });
};

// 监听路由变化，自动更新页面标题
watch(
    () => route.path,
    (newPath) => {
        switch (newPath) {
            case "/":
                updatePageTitle("主页");
                break;
            case "/knowledgeHome":
                updatePageTitle("知识库");
                break;
            case "/knowledgeBase":
                updatePageTitle("知识库");
                break;
            default:
                // 检查是否为知识库子页面
                const knowledgeBasePage = knowledgeBaseMenus.value.find(
                    (menu) => menu.path === newPath
                );
                if (knowledgeBasePage) {
                    updatePageTitle(knowledgeBasePage.name);
                    isKnowledgeBaseExpanded.value = true;
                } else {
                    updatePageTitle("主页");
                }
        }
    },
    { immediate: true }
);
</script>

<style scoped>
/* 可以添加额外的样式 */
</style>
