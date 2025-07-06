import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useNuxtApp } from "nuxt/app";

// 定义状态接口
interface UserState {
    id: number | string;  // 支持数字和字符串，确保兼容性
    username: string;
    nickname: string;
    avatar: string;
    email: string;
    color: string;
}

// 定义store
export const useUserStore = defineStore("userInfo", () => {
    // 使用响应式状态
    const state = ref<UserState>({
        id: 0,  // 默认为数字0
        username: "",
        nickname: "",
        avatar: "",
        email: "",
        color: "",
    });

    // 初始化用户信息
    function initUserInfo() {
        // 使用 useNuxtApp 确保仅在客户端执行
        if (process.client) {
            try {
                const storedUser = localStorage.getItem('userInfo');
                
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    // 确保解析后的数据符合 UserState 接口，特别处理ID类型
                    state.value = {
                        id: parsedUser.id ? (typeof parsedUser.id === 'number' ? parsedUser.id : parseInt(parsedUser.id)) : 0,
                        username: parsedUser.username || "",
                        nickname: parsedUser.nickname || "",
                        avatar: parsedUser.avatar || "",
                        email: parsedUser.email || "",
                        color: parsedUser.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
                    };
                }
            } catch (error) {
                console.error('Failed to parse user from localStorage', error);
            }
        }
    }

    // 在 store 创建时立即尝试初始化
    initUserInfo();

    // 设置用户全部信息
    function setUserInfo(userInfo: UserState) {
        state.value = { ...userInfo };
        
        // 仅在客户端保存到 localStorage
        if (process.client) {
            try {
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
            } catch (error) {
                console.error('Failed to save user info to localStorage', error);
            }
        }
    }

    // 更新用户部分信息
    function updateUserInfo(partialInfo: Partial<UserState>) {
        const updatedUser = { ...state.value, ...partialInfo };
        state.value = updatedUser;
        
        // 仅在客户端更新 localStorage
        if (process.client) {
            try {
                localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            } catch (error) {
                console.error('Failed to update user info in localStorage', error);
            }
        }
    }

    // 重置用户信息
    function resetUserInfo() {
        state.value = {
            id: 0,  // 重置为数字0
            username: "",
            nickname: "",
            avatar: "",
            email: "",
            color: "",
        };
        
        // 仅在客户端清除 localStorage
        if (process.client) {
            try {
                localStorage.removeItem('userInfo');
            } catch (error) {
                console.error('Failed to remove user info from localStorage', error);
            }
        }
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

    // 添加一个计算属性，确保在服务端和客户端都能访问
    const userInfo = computed(() => state.value);

    // 添加单独的属性访问器
    const id = computed(() => state.value.id);
    const username = computed(() => state.value.username);
    const nickname = computed(() => state.value.nickname);
    const avatar = computed(() => state.value.avatar);
    const email = computed(() => state.value.email);
    const color = computed(() => state.value.color);

    return {
        state,
        userInfo,
        id,
        username,
        nickname,
        avatar,
        email,
        color,
        setUserInfo,
        updateUserInfo,
        resetUserInfo,
        getUserInfo,
        isLoggedIn,
        displayName
    };
}, {
    // 持久化配置（可选）
    persist: {
        storage: persistedState.localStorage,
    }
});
