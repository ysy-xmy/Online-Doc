<template>
    <div class="min-h-screen flex items-center justify-center">
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

        <div class="card w-full max-w-md bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title justify-center mb-2">注册账号</h2>
                <form class="space-y-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">选择头像</span>
                        </label>
                        <div class="avatar-grid">
                            <div
                                v-for="(avatar, index) in avatars"
                                :key="index"
                                class="avatar-item"
                                :class="{
                                    selected: selectedAvatar === avatar.id,
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
                    <div class="form-control">
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
                        <div
                            v-if="usernameError"
                            class="text-error text-sm mt-1"
                        >
                            {{ usernameError }}
                        </div>
                    </div>
                    <div class="form-control">
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
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">确认密码</span>
                        </label>
                        <input
                            type="password"
                            placeholder="请再次输入密码"
                            class="input input-bordered w-full"
                            v-model="confirmPassword"
                        />
                        <div
                            v-if="confirmPassword && passwordError"
                            class="text-error text-sm mt-1"
                        >
                            两次密码不一致
                        </div>
                    </div>
                    <div class="form-control mt-4">
                        <button
                            class="btn btn-primary w-full"
                            type="button"
                            @click="handleRegister"
                        >
                            注册
                        </button>
                    </div>
                </form>
                <div class="text-center mt-2">
                    <NuxtLink to="/Login" class="link link-primary"
                        >已有账号？去登录</NuxtLink
                    >
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
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
</script>

<style scoped>
.register-container {
    min-height: 100vh;
}

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
    background: #f5f5f5;
}

.avatar-item:hover {
    transform: scale(1.05);
    border-color: #e0e0e0;
}

.avatar-item.selected {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.avatar-image {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}
</style>
