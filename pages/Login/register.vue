<template>
    <div class="min-h-screen flex items-center justify-center">
        <div class="card w-full max-w-md bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title justify-center mb-2">注册账号</h2>
                <form class="space-y-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">用户名</span>
                        </label>
                        <input
                            type="text"
                            placeholder="请输入用户名"
                            class="input input-bordered w-full"
                            v-model="username"
                        />
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

const passwordError = computed(
    () =>
        password.value !== confirmPassword.value &&
        confirmPassword.value.length > 0
);

const handleRegister = () => {
    if (!username.value || !password.value || !confirmPassword.value) {
        window.$toast?.error("请填写完整信息");
        return;
    }
    if (password.value !== confirmPassword.value) {
        window.$toast?.error("两次密码不一致");
        return;
    }
    // TODO: 注册逻辑
    console.log("username.value", username.value);
    console.log("password.value", password.value);
    //等后续接口开启在写
};
</script>

<style scoped>
.register-container {
    min-height: 100vh;
}
</style>
