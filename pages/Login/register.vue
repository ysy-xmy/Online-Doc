<template>
    <div class="login-page-wrapper relative min-h-screen flex items-center justify-center">
        <div class="background-animation absolute inset-0 z-0"></div>
        
        <!-- 成功提示框 -->
        <div
            v-if="showSuccessAlert"
            class="alert alert-success fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <span>注册成功，正在自动登录</span>
        </div>

        <div class="card w-full max-w-md bg-white/30 backdrop-blur-lg shadow-2xl rounded-2xl z-10 relative overflow-hidden animate-fade-in">
            <div class="card-body relative z-10">
                <h2 class="card-title justify-center mb-2 text-2xl font-bold text-gray-800 animate-slide-in-top">注册账号</h2>
                <form class="space-y-4">
                    <div class="form-control animate-slide-in-left">
                        <label class="label">
                            <span class="label-text">选择头像</span>
                        </label>
                        <div class="avatar-grid">
                            <div
                                v-for="(avatar, index) in avatars"
                                :key="index"
                                class="avatar-item transform transition-all duration-300 hover:scale-110"
                                :class="{
                                    'selected': selectedAvatar === avatar.id,
                                    'hover:shadow-lg': true
                                }"
                                @click="selectAvatar(avatar.id)"
                            >
                                <img
                                    :src="avatar.src"
                                    :alt="`头像 ${avatar.id}`"
                                    class="avatar-image"
                                />
                            </div>
                        </div>
                    </div>
                    <div class="form-control animate-slide-in-right">
                        <label class="label">
                            <span class="label-text">用户名</span>
                        </label>
                        <input
                            type="text"
                            placeholder="请输入用户名（3-10位，不能包含中文）"
                            class="input input-bordered w-full glassmorphism-input"
                            v-model="username"
                            @input="validateUsername"
                        />
                        <div
                            v-if="usernameError"
                            class="text-error text-sm mt-1 animate-shake"
                        >
                            {{ usernameError }}
                        </div>
                    </div>
                    <div class="form-control animate-slide-in-left">
                        <label class="label">
                            <span class="label-text">密码</span>
                        </label>
                        <input
                            type="password"
                            placeholder="请输入密码"
                            class="input input-bordered w-full glassmorphism-input"
                            v-model="password"
                        />
                    </div>
                    <div class="form-control animate-slide-in-right">
                        <label class="label">
                            <span class="label-text">确认密码</span>
                        </label>
                        <input
                            type="password"
                            placeholder="请再次输入密码"
                            class="input input-bordered w-full glassmorphism-input"
                            v-model="confirmPassword"
                        />
                        <div
                            v-if="confirmPassword && passwordError"
                            class="text-error text-sm mt-1 animate-shake"
                        >
                            两次密码不一致
                        </div>
                    </div>
                    <div class="form-control mt-4">
                        <button
                            class="btn btn-primary w-full animate-pulse-soft bg-[#16a085] hover:bg-[#2980b9] border-none"
                            type="button"
                            @click="handleRegister"
                        >
                            注册
                        </button>
                    </div>
                </form>
                <div class="text-center mt-2 animate-fade-in">
                    <NuxtLink 
                        to="/Login" 
                        class="link hover:text-[#16a085] text-[#2980b9] transition-colors duration-300"
                    >
                        已有账号？去登录
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import md5 from "crypto-js/md5";
import { useUserStore } from "~/stores/user";
import { onMounted, onUnmounted } from 'vue'

// 获取用户信息
const userStore = useUserStore();

// 设置布局为空白布局
definePageMeta({
    layout: "blank",
    // 预渲染
    prerender: true,
});

import { ref, computed } from "vue";
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const selectedAvatar = ref(1); // 默认选择第一个头像
const selectedAvatarUrl = ref(
    "https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaorZgMPyu8LoRZ1DDdzcZR8DVWByDJI2xibafmUVeSSyIgZiboNWXMP9pun0OpmiciakV0ia6oyIcA27icLw/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&tp=webp&wx_lazy=1"
); // 默认选择第一个
const showSuccessAlert = ref(false); // 控制成功提示框显示

// 头像列表
const avatars = ref([
    { id: 1, src: "/avatar_1.webp" }, //https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaorZgMPyu8LoRZ1DDdzcZR8DVWByDJI2xibafmUVeSSyIgZiboNWXMP9pun0OpmiciakV0ia6oyIcA27icLw/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&tp=webp&wx_lazy=1
    { id: 2, src: "/avatar_2.webp" }, //https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaorZgMPyu8LoRZ1DDdzcZR8DCwKbZ5vzibiaDa6pS2tc5fZVfZiczNs245PVeWKmDadDCpD8cqKKXxicaA/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&tp=webp&wx_lazy=1
    { id: 3, src: "/avatar_3.webp" }, //https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaopElicwU5r6yV2bFjYqDlGXRfPnibPnwnCR4uppdwhKKny9Tqiako19hiaBhQbfdHfYU7icAibbYj9s293g/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&wx_lazy=1&tp=webp
    { id: 4, src: "/avatar_4.webp" }, //https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaopElicwU5r6yV2bFjYqDlGXRDbOI8gibWN5Z66Xpcby8vIv333c0xIv9v4rrRPHxSa8kU0mpyBxy6YA/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&wx_lazy=1&tp=webp
    { id: 5, src: "/avatar_5.webp" }, //https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaop1ibyyyOs6FmBMIFicXsMajLHkYIldFK2cZchD0yHNsnmN0RjEBPobGjG873p3bibXuV3CMlbjFHl9A/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&tp=webp&wx_lazy=1
    { id: 6, src: "/avatar_6.webp" }, //https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaop1ibyyyOs6FmBMIFicXsMajLQwxafe0IKOGpRXxoTPiaosDbkvgKvWoWrH5Dwnic3YU6DvawnCsPDJKQ/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&wx_lazy=1&tp=webp
    { id: 7, src: "/avatar_7.webp" }, //https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaopElicwU5r6yV2bFjYqDlGXRD0XQBENcrNiatulyvRVg9OxanBThmyEkCn37KkVFPl2w4oryafcFCXA/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&wx_lazy=1&tp=webp
    { id: 8, src: "/avatar_8.webp" }, //https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaookYhJGrEcjMTlgiafy5bg7PR2s0cl1jCyvVryic7fAPrcRwGDqHnVKowNic57ibwcL3enhjHa1GZleBw/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&tp=webp&wx_lazy=1
]);

// 头像URL列表
const urlList = ref([
    "https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaorZgMPyu8LoRZ1DDdzcZR8DVWByDJI2xibafmUVeSSyIgZiboNWXMP9pun0OpmiciakV0ia6oyIcA27icLw/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&tp=webp&wx_lazy=1",
    "https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaorZgMPyu8LoRZ1DDdzcZR8DCwKbZ5vzibiaDa6pS2tc5fZVfZiczNs245PVeWKmDadDCpD8cqKKXxicaA/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&tp=webp&wx_lazy=1",
    "https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaopElicwU5r6yV2bFjYqDlGXRfPnibPnwnCR4uppdwhKKny9Tqiako19hiaBhQbfdHfYU7icAibbYj9s293g/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&wx_lazy=1&tp=webp",
    "https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaopElicwU5r6yV2bFjYqDlGXRDbOI8gibWN5Z66Xpcby8vIv333c0xIv9v4rrRPHxSa8kU0mpyBxy6YA/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&wx_lazy=1&tp=webp",
    "https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaop1ibyyyOs6FmBMIFicXsMajLHkYIldFK2cZchD0yHNsnmN0RjEBPobGjG873p3bibXuV3CMlbjFHl9A/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&tp=webp&wx_lazy=1",
    "https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaop1ibyyyOs6FmBMIFicXsMajLQwxafe0IKOGpRXxoTPiaosDbkvgKvWoWrH5Dwnic3YU6DvawnCsPDJKQ/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&wx_lazy=1&tp=webp",
    "https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaopElicwU5r6yV2bFjYqDlGXRD0XQBENcrNiatulyvRVg9OxanBThmyEkCn37KkVFPl2w4oryafcFCXA/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&wx_lazy=1&tp=webp",
    "https://mmbiz.qpic.cn/sz_mmbiz_jpg/QPgL9rRCiaookYhJGrEcjMTlgiafy5bg7PR2s0cl1jCyvVryic7fAPrcRwGDqHnVKowNic57ibwcL3enhjHa1GZleBw/640?wx_fmt=jpeg&from=appmsg&wxfrom=5&tp=webp&wx_lazy=1",
]);

// 选择头像函数(按ID选中URL)
const selectAvatar = (avatarId: number) => {
    selectedAvatar.value = avatarId;
    selectedAvatarUrl.value = urlList.value[avatarId - 1];
};

//登录函数
const handleLogin = (data: any) => {
    const requestData = JSON.stringify({
        usernameOrEmail: data.usernameOrEmail,
        password: data.password,
    });

    fetch("http://8.134.200.53:8080/api/auth/login", {
        method: "POST",
        body: requestData,
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
                userStore.$patch({
                    id: res.data.user.id,
                    username: res.data.user.username,
                    nickname: res.data.user.nickname,
                    avatar: res.data.user.avatar,
                });

                //存储用户信息到localStorage
                localStorage.setItem("userInfo", JSON.stringify(res.data.user));

                // 跳转到主页面
                setTimeout(() => {
                    navigateTo("/");
                }, 1500);
            }
        });
};

const passwordError = computed(
    () =>
        password.value !== confirmPassword.value &&
        confirmPassword.value.length > 0
);

const usernameError = ref("");

const validateUsername = () => {
    if (!username.value) {
        usernameError.value = "请输入用户名";
        return;
    }

    // 检测中文字符 - 使用简单的Unicode范围检测
    const hasChinese = /[\u4e00-\u9fa5]/.test(username.value);

    if (hasChinese) {
        usernameError.value = "用户名不能包含中文";
        return;
    }

    if (username.value.length < 3 || username.value.length > 10) {
        usernameError.value = "用户名长度应为3-10位";
        return;
    }

    usernameError.value = "";
};

const handleRegister = () => {
    // 先验证用户名
    validateUsername();

    //检查字段是否完整
    if (!username.value || !password.value || !confirmPassword.value) {
        alert("请填写完整信息");
        return;
    }

    // 检查用户名格式
    if (usernameError.value) {
        alert("请检查用户名格式");
        return;
    }

    //检查密码一致性
    if (password.value !== confirmPassword.value) {
        alert("两次密码不一致");
        return;
    }

    const data = JSON.stringify({
        username: username.value,
        password: md5(password.value).toString(), // 使用MD5加密密码
        avatarId: selectedAvatarUrl.value, // 使用选中的头像ID
    });

    // console.log("data", data);
    // 发送注册请求到正确的接口
    fetch("http://8.134.200.53:8080/api/auth/register", {
        method: "POST",
        body: data,
        headers: {
            "Content-Type": "application/json",
            "Content-Length": data.length.toString(),
        },
    })
        .then((res: any) => {
            return res.json();
        })
        .then((res: any) => {
            if (res.data.status === "ACTIVE") {
                // 显示注册成功提示
                showSuccessAlert.value = true;
                // 3秒后自动隐藏提示框
                setTimeout(() => {
                    showSuccessAlert.value = false;
                }, 3000);
                // 调用登录接口
                handleLogin({
                    usernameOrEmail: username.value,
                    password: md5(password.value).toString(),
                });
            }
        })
        .catch((err) => {
            // 弹出错误信息(前端后面再试)
            console.log("err", err);
        });
};

// 动态添加粒子
const addParticles = () => {
    const wrapperEl = document.querySelector('.login-page-wrapper')
    if (!wrapperEl) return

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div')
        particle.classList.add('particle')
        wrapperEl.appendChild(particle)
    }
}

onMounted(() => {
    addParticles()
})

onUnmounted(() => {
    const wrapperEl = document.querySelector('.login-page-wrapper')
    if (wrapperEl) {
        const particles = wrapperEl.querySelectorAll('.particle')
        particles.forEach(particle => particle.remove())
    }
})
</script>

<style scoped>
/* 动画定义 */
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

@keyframes slide-in-top {
    from {
        opacity: 0;
        transform: translateY(-50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse-soft {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}

/* 动画类 */
.animate-fade-in { animation: fade-in 0.8s ease-out; }
.animate-slide-in-left { animation: slide-in-left 0.8s ease-out; }
.animate-slide-in-right { animation: slide-in-right 0.8s ease-out; }
.animate-slide-in-top { animation: slide-in-top 0.8s ease-out; }
.animate-pulse-soft:hover { animation: pulse-soft 1.5s infinite; }
.animate-shake { animation: shake 0.5s; }

/* 毛玻璃输入框 */
.glassmorphism-input {
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    transition: all 0.3s ease;
}

.glassmorphism-input:focus {
    background: rgba(255, 255, 255, 0.5);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* 头像网格 */
.avatar-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: 8px;
}

.avatar-item {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 3px solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
}

.avatar-item:hover {
    transform: scale(1.1);
    border-color: #16a085;
}

.avatar-item.selected {
    border-color: #2980b9;
    box-shadow: 0 0 0 3px rgba(41, 128, 185, 0.3);
}

.avatar-image {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}
</style>

<style>
/* 全局背景动画 */
.login-page-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: linear-gradient(
        -45deg, 
        #16a085, 
        #2980b9, 
        #27ae60, 
        #2c3e50, 
        #16a085
    );
    background-size: 400% 400%;
    animation: gradient-flow 20s ease infinite;
    overflow: hidden;
}

@keyframes gradient-flow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* 背景粒子 */
.login-page-wrapper .particle {
    position: absolute;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    opacity: 0.5;
}

@keyframes float {
    0% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
    100% { transform: translateY(0) rotate(360deg); }
}

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
    0% { transform: translateX(-10px) rotate(0deg); }
    100% { transform: translateX(10px) rotate(360deg); }
}
</style>
