<template>
    <div class="user-info-modal">
        <!-- 用户信息展示区域 -->
        <div class="bg-base-100 rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <!-- 头部 -->
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-semibold text-base-content">
                    个人资料
                </h2>
                <button
                    @click="$emit('close')"
                    class="btn btn-ghost btn-sm btn-circle"
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        ></path>
                    </svg>
                </button>
            </div>

            <!-- 头像区域 -->
            <div class="flex flex-col items-center mb-6">
                <div class="relative">
                    <div
                        class="w-24 h-24 rounded-full ring-4 ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden"
                    >
                        <img
                             :src="userInfo.avatar"
                            alt="用户头像"
                            class="w-full h-full object-cover"
                        />
                    </div>
                    <button
                        @click="openAvatarUpload"
                        class="absolute bottom-0 right-0 btn btn-primary btn-sm btn-circle"
                    >
                        <svg
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            ></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- 用户信息表单 -->
            <form @submit.prevent="saveUserInfo" class="space-y-4">
                <!-- 用户名 -->
                <div class="form-control">
                    <label class="label">
                        <span class="label-text text-base-content">用户名</span>
                    </label>
                    <input
                        v-model="formData.username"
                        type="text"
                        class="input input-bordered bg-base-200 text-base-content"
                        :disabled="true"
                        placeholder="用户名不可修改"
                    />
                </div>

                <!-- 昵称 -->
                <div class="form-control">
                    <label class="label">
                        <span class="label-text text-base-content">昵称</span>
                    </label>
                    <input
                        v-model="formData.nickname"
                        type="text"
                        class="input input-bordered bg-base-200 text-base-content"
                        placeholder="请输入昵称"
                    />
                </div>

                <!-- 邮箱 -->
                <div class="form-control">
                    <label class="label">
                        <span class="label-text text-base-content"
                            >邮箱
                            <span class="text-base-content/60 text-sm"
                                >(可选)</span
                            ></span
                        >
                    </label>
                    <input
                        v-model="formData.email"
                        type="email"
                        class="input input-bordered bg-base-200 text-base-content"
                        placeholder="请输入邮箱（可选）"
                    />
                </div>

                <!-- 操作按钮 -->
                <div class="flex gap-2 pt-4">
                    <button
                        type="button"
                        @click="resetForm"
                        class="btn btn-outline flex-1"
                    >
                        重置
                    </button>
                    <button
                        type="submit"
                        class="btn btn-primary flex-1"
                        :disabled="isLoading"
                    >
                        <span
                            v-if="isLoading"
                            class="loading loading-spinner loading-sm"
                        ></span>
                        {{ isLoading ? "保存中..." : "保存" }}
                    </button>
                </div>
            </form>
        </div>

        <!-- 头像上传模态框 -->
        <div v-if="showAvatarUpload" class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg mb-4">更换头像</h3>
                <div class="grid grid-cols-4 gap-2 mb-4">
                    <div
                        v-for="i in 8"
                        :key="i"
                        @click="selectAvatar(i)"
                        class="w-16 h-16 rounded-full cursor-pointer border-2 hover:border-primary transition-colors"
                        :class="
                            selectedAvatar === i
                                ? 'border-primary'
                                : 'border-base-300'
                        "
                    >
                        <img
                            :src="`/avatar_${i}.webp`"
                            alt="头像选项"
                            class="w-full h-full object-cover rounded-full"
                        />
                    </div>
                </div>
                <div class="modal-action">
                    <button
                        @click="showAvatarUpload = false"
                        class="btn btn-outline"
                    >
                        取消
                    </button>
                    <button
                        @click="confirmAvatarChange"
                        class="btn btn-primary"
                    >
                        确认
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useUserStore } from "~/stores/user";
import { useWorkspaceStore } from "~/stores/workspace";

const userStore = useUserStore();
const { $axios } = useNuxtApp();
const userInfo = userStore.userInfo;

// 定义事件
const emit = defineEmits(["close"]);

// 响应式数据
const isLoading = ref(false);
const showAvatarUpload = ref(false);
const selectedAvatar = ref(1);

// 表单数据
const formData = reactive({
    username: "",
    nickname: "",
    email: "",
});

// 初始化表单数据
const initFormData = () => {
    formData.username = userStore.username || "";
    formData.nickname = userStore.nickname || "";
    formData.email = userStore.email || "";
};

// 重置表单
const resetForm = () => {
    initFormData();
};

// 选择头像
const selectAvatar = (index) => {
    selectedAvatar.value = index;
};

// 打开头像选择
const openAvatarUpload = () => {
    // 从当前头像URL中提取数字
    const currentAvatar = userStore.avatar || "/avatar_1.webp";
    const match = currentAvatar.match(/avatar_(\d+)\.webp/);
    if (match) {
        selectedAvatar.value = parseInt(match[1]);
    } else {
        selectedAvatar.value = 1;
    }
    showAvatarUpload.value = true;
};

// 确认头像更改
const confirmAvatarChange = async () => {
    try {
        isLoading.value = true;
        const newAvatar = `/avatar_${selectedAvatar.value}.webp`;

        // 更新用户头像
        await $axios.put("/api/auth/profile", {
            avatar: newAvatar,
        });

        // 更新store
        userStore.avatar = newAvatar;

        // 更新本地存储
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        userInfo.avatar = newAvatar;
        localStorage.setItem("userInfo", JSON.stringify(userInfo));

        showAvatarUpload.value = false;
    } catch (error) {
        console.error("更新头像失败:", error);
        alert("更新头像失败，请重试");
    } finally {
        isLoading.value = false;
    }
};

// 保存用户信息
const saveUserInfo = async () => {
    try {
        isLoading.value = true;

        // 发送更新请求
        await $axios.put("/api/auth/profile", {
            nickname: formData.nickname,
            email: formData.email,
        });

        // 更新store
        userStore.nickname = formData.nickname;
        userStore.email = formData.email;

        // 更新本地存储
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        userInfo.nickname = formData.nickname;
        userInfo.email = formData.email;
        localStorage.setItem("userInfo", JSON.stringify(userInfo));

        // 显示成功提示
        alert("保存成功！");
    } catch (error) {
        console.error("保存用户信息失败:", error);
        alert("保存失败，请重试");
    } finally {
        isLoading.value = false;
    }
};

// 组件挂载时初始化数据
onMounted(() => {
    initFormData();
});
</script>

<style scoped>
.user-info-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
}

.modal {
    z-index: 1001;
}
</style>
