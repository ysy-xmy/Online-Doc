<template>
    <div class="document-header">
        <div class="document-info">
            <div class="document-title">
                <input
                    v-model="documentInfo.name"
                    class="title-input"
                    placeholder="输入文档名称"
                />
            </div>
            <div class="document-meta">
                <span class="save-status" :class="documentInfo.saveStatus">
                    <i class="status-icon"></i>
                    {{ documentInfo.saveStatus }}
                </span>
                <span class="last-saved">
                    最后保存: {{ formattedLastSaved }}
                </span>
            </div>
        </div>

        <div class="revision-mode-toggle">
            <span class="revision-mode-label">修订模式</span>
            <input 
                type="checkbox" 
                class="toggle toggle-primary" 
                :checked="isRevisionMode"
                @change="handleRevisionModeToggle"
            />
        </div>

        <div class="online-users">
            <div class="users-info">
                <span class="users-count">
                    <i class="users-icon">👥</i>
                    {{ onlineUserCount }} 人在线编辑
                </span>
            </div>
            <div class="users-list">
                <div
                    v-for="user in onlineUsers"
                    :key="user.clientID"
                    class="user-item"
                    :class="{ 'local-user': user.isLocal }"
                >
                    <div
                        class="user-avatar"
                        :style="{ backgroundColor: user.color }"
                    >
                        {{ user.userName.charAt(0) }}
                    </div>
                    <span class="user-name">{{ user.userName }}</span>
                    <span v-if="user.isLocal" class="local-badge">我</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useDocumentStore } from "@/stores/document";
import { debounce } from "lodash";
// 定义props
const props = defineProps({
    documentName: {
        type: String,
        default: "未命名文档",
    },
});

// 定义emits
const emit = defineEmits([
    "update:documentName", 
    "save", 
    "toggleRevisionMode"
]);

// 使用 store 中的文档信息
const documentStore = useDocumentStore();
const documentInfo = documentStore.documentInfo;

// 从 store 获取用户列表
const onlineUsers = computed(() => documentStore.allUsersList);

// 监听props变化
watch(
    () => props.documentName,
    (newName) => {
        documentStore.updateDocumentName(newName);
    }
);

// 计算属性：格式化最后保存时间
const formattedLastSaved = computed(() => {
    const now = new Date();
    const diff = now - documentInfo.lastSaved;

    if (diff < 60000) {
        // 1分钟内
        return "刚刚";
    } else if (diff < 3600000) {
        // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
        // 1天内
        return `${Math.floor(diff / 3600000)}小时前`;
    } else {
        return documentInfo.lastSaved.toLocaleDateString();
    }
});

// 计算属性：在线用户数量
const onlineUserCount = computed(() => {
    return onlineUsers.value.length;
});

// 防抖版本的恢复保存状态
const debouncedRestoreSaveStatus = debounce(function () {
    setTimeout(() => {
        documentInfo.lastSaved = new Date();
        documentInfo.isSaving = false;
        documentInfo.saveStatus = "已保存";
    }, 100);
}, 500);

// 自动保存功能（防抖版本）
const autoSave = () => {
    // 触发保存事件
    emit("save", documentInfo.name);

    // 使用 store 的防抖自动保存方法
    documentInfo.isSaving = true;
    documentInfo.saveStatus = "保存中";
    debouncedRestoreSaveStatus();
};

// 监听文档名称变化
watch(
    () => documentInfo.name,
    (newName) => {
        autoSave(); // 使用防抖版本
        emit("update:documentName", newName);
    }
);

// 暴露方法给父组件
defineExpose({
    setSaveStatus: (status) => {
        documentStore.updateSaveStatus(status);
    },
    setLastSaved: (date) => {
        documentStore.updateLastSaved(date);
    },
});

// 添加 ref 和 emit
const isRevisionMode = ref(false);

// 监听修订模式切换
const handleRevisionModeToggle = () => {
    isRevisionMode.value = !isRevisionMode.value;
    emit("toggleRevisionMode", isRevisionMode.value);
};
</script>

<style scoped>
.document-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: white;
    border-bottom: 1px solid #e9ecef;
    flex-shrink: 0; /* 防止头部被压缩 */
    width: 100%;
}

.document-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.document-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.title-input {
    font-size: 20px;
    font-weight: 600;
    color: #2c3e50;
    border: none;
    background: transparent;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background-color 0.2s;
}

.title-input:focus {
    outline: none;
    background-color: #f8f9fa;
    box-shadow: 0 0 0 2px #007bff20;
}

.title-input::placeholder {
    color: #6c757d;
    font-weight: 400;
}

.document-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 14px;
    color: #6c757d;
}

.save-status {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.save-status.已保存 {
    background-color: #d4edda;
    color: #155724;
}

.save-status.保存中 {
    background-color: #fff3cd;
    color: #856404;
}

.save-status.未保存 {
    background-color: #f8d7da;
    color: #721c24;
}

.status-icon {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: currentColor;
}

.revision-mode-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
}

.revision-mode-label {
    font-size: 14px;
    font-weight: 500;
}

.toggle {
    width: 40px;
    height: 20px;
    background-color: #e9ecef;
    border-radius: 10px;
    position: relative;
    cursor: pointer;
}

.toggle.toggle-primary {
    background-color: #007bff;
}

.toggle.toggle-primary::before {
    content: "";
    position: absolute;
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: transform 0.2s;
}

.toggle.toggle-primary.checked::before {
    transform: translateX(20px);
}

.online-users {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
}

.users-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #6c757d;
}

.users-icon {
    font-size: 16px;
}

.users-list {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.user-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background-color: #f8f9fa;
    border-radius: 16px;
    font-size: 12px;
    color: #495057;
    transition: all 0.2s;
}

.user-item:hover {
    background-color: #e9ecef;
}

.user-item.local-user {
    background-color: #007bff;
    color: white;
}

.user-avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    color: white;
}

.user-name {
    font-weight: 500;
}

.local-badge {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .document-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }

    .online-users {
        align-items: flex-start;
        width: 100%;
    }

    .users-list {
        justify-content: flex-start;
    }
}
</style>
