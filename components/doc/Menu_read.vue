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
            
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useDocumentStore } from "@/stores/document";
// 定义props
const props = defineProps({
    documentName: {
        type: String,
        default: "未命名文档",
    },
});


// 使用 store 中的文档信息
const documentStore = useDocumentStore();
const documentInfo = documentStore.documentInfo;


// 监听props变化
watch(
    () => props.documentName,
    (newName) => {
        documentStore.updateDocumentName(newName);
    }
);



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
