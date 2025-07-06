<template>
    <div class="h-full w-84 p-4">
        <div class="space-y-2">
            <div 
                v-for="(item, index) in revisionList" 
                :key="index" 
                class="card bg-base-100 shadow-sm border"
            >
                <div class="card-body p-3">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-1">
                            <span 
                                class="badge badge-xs" 
                                :class="{
                                    'badge-success': item.type === 'add',
                                    'badge-error': item.type === 'delete'
                                }"
                            >
                                {{ item.type === 'add' ? '新' : '删' }}
                            </span>
                            <span class="text-xs text-gray-500">
                                {{ formatShortTimestamp(item.timestamp) }}
                            </span>
                        </div>
                        <span class="text-xs text-gray-600">
                            ID:{{ item.userId }}
                        </span>
                    </div>
                    
                    <div className="mt-1">
                        <p className="text-sm truncate">{{ item.content }}</p>
                    </div>
                    
                    <div className="card-actions justify-end mt-1">
                        <button 
                            @click="applyRevision(item)" 
                            className="btn btn-xs btn-success"
                        >
                            应用
                        </button>
                        <button 
                            @click="rejectRevision(item)" 
                            className="btn btn-xs btn-error"
                        >
                            拒绝
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 确认对话框 -->
        <dialog id="apply_confirm_modal" class="modal">
            <div class="modal-box">
                <h3 class="font-bold text-lg">确认应用修订</h3>
                <p class="py-4">是否确定应用此修订？</p>
                <div class="modal-action">
                    <form method="dialog">
                        <button 
                            class="btn btn-primary btn-sm mr-2" 
                            @click="confirmApply"
                        >
                            确认
                        </button>
                        <button class="btn btn-ghost btn-sm">取消</button>
                    </form>
                </div>
            </div>
        </dialog>

        <dialog id="reject_confirm_modal" class="modal">
            <div class="modal-box">
                <h3 class="font-bold text-lg">确认拒绝修订</h3>
                <p class="py-4">是否确定拒绝此修订？</p>
                <div class="modal-action">
                    <form method="dialog">
                        <button 
                            class="btn btn-error btn-sm mr-2" 
                            @click="confirmReject"
                        >
                            确认
                        </button>
                        <button class="btn btn-ghost btn-sm">取消</button>
                    </form>
                </div>
            </div>
        </dialog>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const revisionList = ref([
    {
        "type": "add",
        "content": "1",
        "timestamp": 1751770077697,
        "userId": 7,
        "hint": "新增：1"
    },
    {
        "type": "delete",
        "content": "111",
        "timestamp": 1751770068674,
        "userId": 7,
        "hint": "删除：111"
    },
    {
        "type": "delete",
        "content": "11111",
        "timestamp": 1751770064455,
        "userId": 7,
        "hint": "删除：11111"
    }
])

// 当前正在处理的修订项
const currentRevision = ref(null)

const formatShortTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
}

const applyRevision = (item) => {
    currentRevision.value = item
    const modal = document.getElementById('apply_confirm_modal')
    if (modal) modal.showModal()
}

const rejectRevision = (item) => {
    currentRevision.value = item
    const modal = document.getElementById('reject_confirm_modal')
    if (modal) modal.showModal()
}

const confirmApply = () => {
    if (currentRevision.value) {
        // 实际应用逻辑
        const index = revisionList.value.findIndex(rev => rev === currentRevision.value)
        if (index !== -1) {
            revisionList.value.splice(index, 1)
        }
        currentRevision.value = null
    }
}

const confirmReject = () => {
    if (currentRevision.value) {
        // 实际拒绝逻辑
        const index = revisionList.value.findIndex(rev => rev === currentRevision.value)
        if (index !== -1) {
            revisionList.value.splice(index, 1)
        }
        currentRevision.value = null
    }
}
</script>

<style scoped>
/* 可以添加额外的自定义样式 */
</style>