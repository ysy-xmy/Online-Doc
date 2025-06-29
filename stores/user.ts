import { defineStore } from "pinia";

// 定义状态接口
interface UserState {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
    email: string;
}

// 定义store
export const useUserStore = defineStore("user", {
    state: (): UserState => ({
        // 定义状态
        id: "",
        username: "",
        nickname: "",
        avatar: "",
        email: "",
    }),

    actions: {},
    getters: {},
});
