<template>
    <div class="flex h-screen bg-base-100">
        <!-- 左侧侧边栏 -->
        <Sidebar />

        <!-- 主内容区 -->
        <div class="flex-1 flex flex-col shadow-lg">
            <!-- 顶部导航栏 -->
            <div
                class="navbar bg-base-100 border-b border-base-content/10 px-4 py-2 shadow-sm"
            >
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
                <div class="text-base-content text-xl mx-2 text-bold">{{ userInfo.username }}</div>

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
                                    :src="userInfo.avatar "
                                    class="object-cover"
                                />
                            </div>
                        </div>
                        <ul
                            tabindex="0"
                            class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
                        >
                            <li>
                                <a
                                    class="text-base-content"
                                    @click="showUserInfo"
                                    >个人资料</a
                                >
                            </li>
                            <li>
                                <a class="text-base-content" @click="logout"
                                    >退出</a
                                >
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- 主内容插槽，占据剩余空间 -->
            <div class="flex-1 overflow-auto p-6 bg-base-200">
                <div
                    class="max-w-full mx-auto bg-base-100 rounded-xl shadow-md overflow-hidden h-full"
                >
                    <slot />
                </div>
            </div>
        </div>

        <!-- 用户信息模块 -->
        <UserInfo v-if="isUserInfoVisible" @close="hideUserInfo" />
    </div>
</template>

<script setup>
import { useCookie } from "#app";
import { ref, onMounted, computed } from "vue";
import Sidebar from "~/components/layouts/Sidebar.vue";
import ThemeChange from "~/components/layouts/ThemeChange.vue";
import UserInfo from "~/components/common/userInfo.vue";
import { useUserStore } from "~/stores/user";

//获取用户信息
const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);
// 用户信息显示状态
const isUserInfoVisible = ref(false);

// 显示用户信息s
const showUserInfo = () => {
    isUserInfoVisible.value = true;
};

// 隐藏用户信息
const hideUserInfo = () => {
    isUserInfoVisible.value = false;
};

//退出登录
const logout = () => {
    //删除cookie
    useCookie("token").value = null;
    navigateTo("/login");
};

// console.log("test1");

//获取用户信息（如果没有则获取）
const { $axios } = useNuxtApp();

onMounted(() => {
    if (localStorage.getItem("userInfo") === null) {
        $axios("/api/auth/me", {
            method: "GET",
        })
            .then((res) => {
                userStore.$patch({
                    id: res.data.id,
                    username: res.data.username,
                    nickname: res.data.nickname,
                    avatar: res.data.avatar,
                    email: res.data.email || "",
                });

                localStorage.setItem("userInfo", JSON.stringify(res.data));
            })
            .catch((err) => {
                console.log(err);
            });
    } else {
        // 从localStorage加载用户信息
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        userStore.$patch({
            id: userInfo.id || "",
            username: userInfo.username || "",
            nickname: userInfo.nickname || "",
            avatar: userInfo.avatar || "",
            email: userInfo.email || "",
        });
    }
});
</script>

<style>
.table th:first-child {
    width: 40%;
}
</style>