import { defineStore } from "pinia";

// 防抖函数
const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

// 定义状态接口
interface DocumentState {
    documentInfo: {
        name: string;
        lastSaved: Date;
        isSaving: boolean;
        saveStatus: string;
    };
    usersInfo: {
        name: string;
        clientID: string;
        color: string;
        timestamp: number;
    };
    allUsersList: {
        userName: string;
        clientID: string;
        color: string;
        // 是否是本地用户
        isLocal: boolean;
    }[];
}

// 定义store
export const useDocumentStore = defineStore("document", {
    state: (): DocumentState => ({
        // 定义状态
        documentInfo: {
            name: "未命名文档",
            lastSaved: new Date(),
            isSaving: false,
            saveStatus: "已保存", // "已保存", "保存中", "未保存"
        },
        usersInfo: {
            name: "",
            color: "",
            clientID: "",
            timestamp: 0,
        },
        allUsersList: [
            {
                userName: "",
                clientID: "",
                color: "",
                isLocal: true,
            },
        ],
    }),

    actions: {
        // 更新文档名称
        updateDocumentName(name: string) {
            this.documentInfo.name = name;
        },

        // 更新保存状态
        updateSaveStatus(status: string) {
            this.documentInfo.saveStatus = status;
        },

        // 更新最后保存时间
        updateLastSaved(date: Date) {
            this.documentInfo.lastSaved = date;
        },

        // 设置保存中状态
        setSaving(isSaving: boolean) {
            this.documentInfo.isSaving = isSaving;
        },

        // // 实际的保存方法
        // async autoSave() {
        //     if (this.documentInfo.isSaving) return;

        //     this.documentInfo.isSaving = true;
        //     this.documentInfo.saveStatus = "保存中";

        //     await new Promise((resolve) => setTimeout(resolve, 1000));
        //     this.documentInfo.lastSaved = new Date();
        //     this.documentInfo.isSaving = false;
        //     this.documentInfo.saveStatus = "已保存";
        // },
    },
    getters: {},
});
