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

        <div class="document-actions">
            <button
                class="publish-btn"
                :class="{ 'published': isPublished }"
                @click="togglePublishStatus"
                :disabled="isUpdatingStatus"
            >
                <i class="status-icon" :class="isPublished ? 'published' : 'draft'"></i>
                {{ isPublished ? '已发布' : '发布' }}
            </button>
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
import { documentApi } from "@/api/document";
import { debounce } from "lodash";
// 定义props
const props = defineProps({
    documentName: {
        type: String,
        default: "未命名文档",
    },
    documentId: {
        type: [String, Number],
        required: true,
    },
    documentStatus: {
        type: String,
        default: "DRAFT",
    },
});

// 定义emits
const emit = defineEmits(["update:documentName", "save", "statusChanged"]);

// 使用 store 中的文档信息
const documentStore = useDocumentStore();
const documentInfo = documentStore.documentInfo;

// 从 store 获取用户列表
const onlineUsers = computed(() => documentStore.allUsersList);

// 发布状态相关
const isPublished = ref(props.documentStatus === 'PUBLISHED');
const isUpdatingStatus = ref(false);

// 监听props中的documentStatus变化
watch(
    () => props.documentStatus,
    (newStatus) => {
        isPublished.value = newStatus === 'PUBLISHED';
    }
);

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

const { $axios } = useNuxtApp();
const router = useRouter();

// 防抖版本的保存文档标题函数
const debouncedSaveDocumentTitle = debounce((data) => {
    console.log(99999999);

    $axios(`api/documents/${router.currentRoute.value.params.id}`, {
        method: "PUT",
        body: data,
    }).then((res) => {
        documentStore.updateDocumentName(res.data.title);
    });
}, 1000); // 1秒防抖

const saveDocumentTitle = (data) => {
    debouncedSaveDocumentTitle(data);
};
// 自动保存功能（防抖版本）
const autoSave = () => {
    // console.log("newName", documentInfo.name);
    // console.log("documentInfo.id", );
    const data = {
        title: documentInfo.name,
        content: "",
        contentJson: "新JSON内容",
        status: "PUBLISHED",
    };

    saveDocumentTitle(data);

    // 使用 store 的防抖自动保存方法
    documentInfo.isSaving = true;
    documentInfo.saveStatus = "保存中";
    debouncedRestoreSaveStatus();
};

// 切换发布状态
const togglePublishStatus = async () => {
    if (isUpdatingStatus.value) return;

    try {
        isUpdatingStatus.value = true;
        const newStatus = isPublished.value ? 'DRAFT' : 'PUBLISHED';

        console.log('切换发布状态:', {
            documentId: props.documentId,
            currentStatus: isPublished.value ? 'PUBLISHED' : 'DRAFT',
            newStatus: newStatus
        });

        const response = await documentApi.update(props.documentId, {
            status: newStatus
        });

        if (response.code === 'SUCCESS') {
            isPublished.value = newStatus === 'PUBLISHED';
            emit('statusChanged', newStatus);

            // 显示成功提示
            documentStore.updateSaveStatus(newStatus === 'PUBLISHED' ? '已发布' : '已保存为草稿');
            setTimeout(() => {
                documentStore.updateSaveStatus('已保存');
            }, 2000);
        }
    } catch (error) {
        console.error('更新文档状态失败:', error);
        // 可以添加错误提示
    } finally {
        isUpdatingStatus.value = false;
    }
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

.document-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.publish-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #374151;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.publish-btn:hover {
    background: #f9fafb;
    border-color: #9ca3af;
}

.publish-btn.published {
    background: #10b981;
    border-color: #10b981;
    color: white;
}

.publish-btn.published:hover {
    background: #059669;
    border-color: #059669;
}

.publish-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.status-icon {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
}

.status-icon.draft {
    background: #f59e0b;
}

.status-icon.published {
    background: white;
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
