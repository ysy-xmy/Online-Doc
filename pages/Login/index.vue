<template>
    <div
        class="login-container flex items-stretch shadow-xl rounded-2xl overflow-hidden"
    >
        <!-- 左侧介绍 -->
        <div
            class="login-box-left flex-1 flex flex-col justify-center items-center bg-gradient-to-br from-pink-400 to-pink-200 text-white p-10"
        >
            <h2 class="text-3xl font-bold mb-4 drop-shadow-lg">
                共享协作文档系统
            </h2>
            <p class="text-lg opacity-90 mb-6">
                高效协作，轻松管理文档，助力团队成长！
            </p>
            <ul class="space-y-2 text-base opacity-80">
                <li>✅ 实时协作编辑</li>
                <li>✅ 富文本编辑</li>
                <li>✅ 高速不卡顿</li>
                <li>✅ 丰富的文档管理功能</li>
            </ul>
        </div>
        <!-- 右侧登录表单 -->
        <div
            class="login-box-right w-[24rem] bg-base-100 flex flex-col justify-center items-center p-10"
        >
            <form class="w-full max-w-sm space-y-6">
                <h3 class="text-2xl font-bold text-center mb-2">登录账号</h3>
                <div class="form-control w-full">
                    <label class="label">
                        <span class="label-text">用户名</span>
                    </label>
                    <input
                        type="text"
                        placeholder="请输入用户名（3-10位，不能包含中文）"
                        class="input input-bordered w-full"
                        v-model="username"
                        @input="validateUsername"
                    />
                    <div v-if="usernameError" class="text-error text-sm mt-1">
                        {{ usernameError }}
                    </div>
                </div>
                <div class="form-control w-full">
                    <label class="label">
                        <span class="label-text">密码</span>
                    </label>
                    <input
                        type="password"
                        placeholder="请输入密码"
                        class="input input-bordered w-full"
                        v-model="password"
                    />
                </div>
                <button
                    class="btn btn-primary w-full"
                    type="button"
                    @click="handleLogin"
                    :class="{ 'btn-disabled': isLoading }"
                >
                    <span v-if="isLoading" class="loading loading-spinner"></span>
                    {{ isLoading ? '登录中...' : '登录' }}
                </button>
                <div class="text-center mt-2">
                    <NuxtLink to="/Login/register" class="link link-primary"
                        >没有账号？去注册</NuxtLink
                    >
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import md5 from "crypto-js/md5";
import { useUserStore } from "~/stores/user";

// 获取用户信息
const userStore = useUserStore();

// 设置布局为空白布局
definePageMeta({
    layout: "blank",
    // 预渲染
    prerender: true,
});

const username = ref("");
const password = ref("");
const usernameError = ref("");
const isLoading = ref(false); // 添加 loading 状态

const handleLogin = () => {
    // 验证用户名格式
    validateUsername();
    if (usernameError.value) {
        alert("请检查用户名格式");
        return;
    }

    // 如果正在加载中，直接返回
    if (isLoading.value) return;

    // 设置加载状态
    isLoading.value = true;

    const data = JSON.stringify({
        usernameOrEmail: username.value,
        password: md5(password.value).toString(),
    });

    fetch("http://8.134.200.53:8080/api/auth/login", {
        method: "POST",
        body: data,
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((res) => {
            return res.json();
        })
        .then((res) => {
            if (res.code === "SUCCESS") {
                // 存储token(用Cookie)
                useCookie("token", {
                    maxAge: res.data.expiresIn, // 设置过期时间(1天)
                }).value = res.data.token;

                //储存用户信息到store
                userStore.setUserInfo({
                    id: res.data.user.id,
                    username: res.data.user.username,
                    nickname: res.data.user.nickname,
                    avatar: res.data.user.avatar,
                    email: res.data.user.email || '', // 添加 email 字段，如果不存在则使用空字符串
                    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                });

                // 跳转到主页面
                navigateTo("/");
            } else {
                // 登录失败时重置加载状态
                isLoading.value = false;
                // 可以添加错误提示
                alert(res.message || '登录失败');
            }
        })
        .catch((err) => {
            console.log("err", err);
            // 发生错误时重置加载状态
            isLoading.value = false;
            alert('网络错误，请稍后重试');
        });
};

const validateUsername = () => {
    if (!username.value) {
        usernameError.value = "";
        return;
    }

    // 检测中文字符 - 使用简单的Unicode范围检测
    const hasChinese = /[\u4e00-\u9fa5]/.test(username.value);

    if (hasChinese) {
        usernameError.value = "用户名不能包含中文";
        console.log("检测到中文字符:", username.value);
        return;
    }

    if (username.value.length < 3 || username.value.length > 10) {
        usernameError.value = "用户名长度应为3-10位";
        return;
    }

    usernameError.value = "";
};
</script>

<style scoped>
.login-container {
    width: 53.75rem;
    height: 31.25rem;
    background-color: transparent;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
.login-box-left {
    min-width: 0;
}
.login-box-right {
    min-width: 0;
}
</style>

<style>
/* body {
    min-height: 100vh !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    margin: 0 !important;
} */
</style>
