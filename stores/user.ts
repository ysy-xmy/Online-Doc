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

    // 手动从 localStorage 恢复状态
    function initFromLocalStorage() {
        // 仅在浏览器环境中执行
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                // 尝试从不同可能的键名获取数据
                const storedUser = 
                    localStorage.getItem('userInfo') || 
                    localStorage.getItem('user') || 
                    localStorage.getItem('pinia-userInfo');
                
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    // 确保解析后的数据符合 UserState 接口
                    state.value = {
                        id: parsedUser.id || "",
                        username: parsedUser.username || "",
                        nickname: parsedUser.nickname || "",
                        avatar: parsedUser.avatar || "",
                        email: parsedUser.email || ""
                    };
                    console.log('Successfully restored user from localStorage', state.value);
                }
            } catch (error) {
                console.error('Failed to parse user from localStorage', error);
            }
        }
    }

    // 在 store 创建时立即尝试初始化
    initFromLocalStorage();

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

    // 获取用户显示名称（优先使用昵称）d
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
    persist: {
        key: 'userInfo', // 明确指定存储 key
        storage: localStorage,
    }
} as any);
