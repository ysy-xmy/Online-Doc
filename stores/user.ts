import { defineStore } from "pinia";
import { ref } from "vue";

// 定义状态接口
interface UserState {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
    email: string;
}

// 定义store
export const useUserStore = defineStore("user", () => {
    // 使用响应式状态
    const state = ref<UserState>({
        id: "",
        username: "",
        nickname: "",
        avatar: "",
        email: "",
    });

    // 设置用户全部信息
    function setUserInfo(userInfo: UserState) {
        state.value = { ...userInfo };
    }

    // 更新用户部分信息
    function updateUserInfo(partialInfo: Partial<UserState>) {
        state.value = { ...state.value, ...partialInfo };
    }

    // 重置用户信息
    function resetUserInfo() {
        state.value = {
            id: "",
            username: "",
            nickname: "",
            avatar: "",
            email: "",
        };
    }

    // 获取用户完整信息
    function getUserInfo(): UserState {
        return state.value;
    }

    // 检查用户是否已登录
    function isLoggedIn(): boolean {
        return !!state.value.id;
    }

    // 获取用户显示名称（优先使用昵称）
    function displayName(): string {
        return state.value.nickname || state.value.username || '未命名用户';
    }

    return {
        state,
        setUserInfo,
        updateUserInfo,
        resetUserInfo,
        getUserInfo,
        isLoggedIn,
        displayName
    };
}, {
    persist: true
} as any);
