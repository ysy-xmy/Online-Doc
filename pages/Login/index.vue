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
                    id: typeof res.data.user.id === 'number' ? res.data.user.id : parseInt(res.data.user.id), // 确保ID是数字
                    username: res.data.user.username,
                    nickname: res.data.user.nickname,
                    avatar: res.data.user.avatar,
                    email: res.data.user.email || '' // 添加 email 字段，如果不存在则使用空字符串
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
/* 高级动态渐变背景 */
.login-page-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;

}

@keyframes gradient-flow {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}

/* 背景装饰动画 */
.login-page-wrapper::before,
.login-page-wrapper::after {
    content: '';
    position: absolute;
    border-radius: 50%;
}

.login-page-wrapper::before {
    width: 300px;
    height: 300px;
    top: -10%;
    left: -10%;
    background: rgba(255, 255, 255, 0.05);
    animation: float-circle-1 25s linear infinite;
}

.login-page-wrapper::after {
    width: 400px;
    height: 400px;
    bottom: -20%;
    right: -10%;
    background: rgba(255, 255, 255, 0.03);
    animation: float-circle-2 30s linear infinite reverse;
}

@keyframes float-circle-1 {
    0% {
        transform: translate(0, 0) rotate(0deg);
    }
    50% {
        transform: translate(50px, 100px) rotate(180deg);
    }
    100% {
        transform: translate(0, 0) rotate(360deg);
    }
}

@keyframes float-circle-2 {
    0% {
        transform: translate(0, 0) rotate(0deg);
    }
    50% {
        transform: translate(-50px, -100px) rotate(180deg);
    }
    100% {
        transform: translate(0, 0) rotate(360deg);
    }
}

/* 粒子效果 */
.login-page-wrapper .particle {
    position: absolute;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    opacity: 0.5;
}

/* 生成随机粒子 */
@for $i from 1 through 50 {
    .login-page-wrapper .particle:nth-child(#{$i}) {
        $size: random(30) + 5px;
        $top: random(100) + %;
        $left: random(100) + %;
        $duration: random(30) + 10s;
        $delay: random(10) + s;

        width: $size;
        height: $size;
        top: $top;
        left: $left;
        animation:
            float $duration ease-in-out infinite alternate,
            particle-move $duration linear infinite alternate;
        animation-delay: -$delay;
    }
}

@keyframes particle-move {
    0% {
        transform: translateX(-10px) rotate(0deg);
    }
    100% {
        transform: translateX(10px) rotate(360deg);
    }
}

/* 背景动画 */
@keyframes bg-animation {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}

.animate-bg {
    background: linear-gradient(-45deg, #2c3e50, #16a085, #2980b9, #27ae60);
    background-size: 400% 400%;
    animation: bg-animation 15s ease infinite;
}

/* 软脉冲动画 */
@keyframes pulse-soft {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.02);
    }
}

.animate-pulse-soft:hover {
    animation: pulse-soft 1.5s infinite;
}

/* 淡入动画 */
@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fade-in 0.8s ease-out;
}

/* 滑入动画 */
@keyframes slide-in-left {
    from {
        opacity: 0;
        transform: translateX(-50px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes slide-in-right {
    from {
        opacity: 0;
        transform: translateX(50px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.animate-slide-in-left {
    animation: slide-in-left 0.8s ease-out;
}

.animate-slide-in-right {
    animation: slide-in-right 0.8s ease-out;
}

/* 抖动动画 */
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.animate-shake {
    animation: shake 0.5s;
}

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

/* 动态背景动画 */
@keyframes float {
    0% {
        transform: translateY(0) rotate(0deg);
    }
    50% {
        transform: translateY(-20px) rotate(180deg);
    }
    100% {
        transform: translateY(0) rotate(360deg);
    }
}

.background-animation {
    background-color: #f0f4f8;
    overflow: hidden;
    position: relative;
}

.background-animation::before,
.background-animation::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;
    background: linear-gradient(135deg, #16a085, #2980b9);
    animation: float 20s ease-in-out infinite;
}

.background-animation::before {
    width: 300px;
    height: 300px;
    top: -10%;
    left: -10%;
    animation-delay: -5s;
}

.background-animation::after {
    width: 400px;
    height: 400px;
    bottom: -20%;
    right: -10%;
    background: linear-gradient(135deg, #2980b9, #27ae60);
    animation-direction: alternate-reverse;
}

/* 添加更多微妙的粒子效果 */
.background-animation .particle {
    position: absolute;
    background: rgba(22, 160, 133, 0.1);
    border-radius: 50%;
    animation: float 10s ease-in-out infinite;
}

/* 生成随机粒子的 CSS 类 */
@for $i from 1 through 20 {
    .particle:nth-child(#{$i}) {
        $size: random(50) + 10px;
        $top: random(100) + %;
        $left: random(100) + %;
        $delay: random(20) + s;

        width: $size;
        height: $size;
        top: $top;
        left: $left;
        animation-delay: -$delay;
    }
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
