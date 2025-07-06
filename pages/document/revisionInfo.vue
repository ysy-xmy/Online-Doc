<template>
    <div class="h-full w-84 p-4 relative revision-container">
        <!-- 添加一个调试提示 -->
        <div v-if="sortedRevisionList.length === 0" class="text-center text-gray-500 mt-10">
            暂无修订信息
        </div>

        <div 
            v-for="(item, index) in sortedRevisionList" 
            :key="index" 
            class="card absolute bg-base-100 shadow-sm border revision-item"
            :style="getRevisionItemStyle(item)"
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
import { ref, computed, watch } from 'vue'

// 定义 props 接收外部传入的修订列表
const props = defineProps({
    revisions: {
        type: Array,
        default: () => []
    }
})

// 使用 props 中的修订列表
const revisionList = ref([])

// 监听外部传入的修订列表变化
watch(() => props.revisions, (newRevisions) => {
    // 如果新的修订列表不为空，更新本地列表
    if (newRevisions && newRevisions.length > 0) {
        revisionList.value = newRevisions.map(revision => ({
            ...revision,
            // 如果没有 yPosition，可以设置一个默认值
            yPosition: revision.yPosition || 0
        }))
    }
}, { immediate: true })

// 按 Y 轴坐标排序的修订列表
const sortedRevisionList = computed(() => {
    return [...revisionList.value].sort((a, b) => (a.yPosition || 0) - (b.yPosition || 0))
})

// 当前正在处理的修订项
const currentRevision = ref(null)

const formatShortTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
}

// 获取修订项的样式，基于 Y 轴坐标
const getRevisionItemStyle = (item) => {
    return {
        top: `${item.yPosition}px`,
        left: '100%', // 靠右侧显示
        transform: 'translateY(-50%)', // 垂直居中
        marginLeft: '10px', // 与编辑器保持一定距离
        width: '250px' // 固定宽度
    }
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

// 添加一个调试输出，帮助定位问题
const debugInfo = computed(() => ({
    propsRevisions: props.revisions,
    localRevisionList: revisionList.value,
    sortedList: sortedRevisionList.value
}))

// 监听调试信息变化
watch(debugInfo, (info) => {
    console.log('修订信息调试:', info)
}, { immediate: true })
</script>

<style scoped>
.revision-container {
    position: relative;
    height: 100%;
    overflow-y: auto;
}

.revision-item {
    position: absolute;
    transition: all 0.3s ease;
    z-index: 10;
}

.revision-item:hover {
    z-index: 20;
    transform: scale(1.02) translateY(-50%);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
</style>