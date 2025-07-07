<script setup>
import { ref, nextTick } from "vue";

const floatingToolbar = ref(null);

const positionToolbar = (range, quill) => {
    if (!quill || !floatingToolbar.value) return;

    try {
        const bounds = quill.getBounds(range.index, range.length);
        const toolbar = floatingToolbar.value;
        const toolbarWidth = toolbar.offsetWidth;
        const toolbarHeight = toolbar.offsetHeight;

        let left = bounds.left + bounds.width / 2 - toolbarWidth / 2;
        let top = bounds.top - toolbarHeight - 10;

        const editorRect = quill.root.getBoundingClientRect();
        left = Math.max(0, Math.min(left, editorRect.width - toolbarWidth));

        if (top < 0) {
            top = bounds.bottom + 10;
        }

        toolbar.style.left = `${left}px`;
        toolbar.style.top = `${top}px`;
    } catch (error) {
        console.error("定位工具栏时出错:", error);
    }
};

const handleSelectionChange = (range, quill) => {
    if (!range) return;

    nextTick(() => {
        const toolbar = floatingToolbar.value;
        if (!toolbar) return;

        if (range.length > 0) {
            toolbar.classList.add("active");
            positionToolbar(range, quill);
        } else {
            toolbar.classList.remove("active");
        }
    });
};

defineExpose({
    handleSelectionChange,
});
</script>

<template>
    <div class="floating-toolbar" ref="floatingToolbar">
        <div id="toolbar" class="ql-toolbar">
            <div class="toolbar-group">
                <select class="ql-header" title="标题">
                    <option value="1">标题 1</option>
                    <option value="2">标题 2</option>
                    <option selected>正文</option>
                </select>
            </div>

            <div class="toolbar-divider"></div>

            <div class="toolbar-group">
                <button class="ql-bold" title="加粗"></button>
                <button class="ql-italic" title="斜体"></button>
                <button class="ql-underline" title="下划线"></button>
                <button class="ql-strike" title="删除线"></button>
            </div>

            <div class="toolbar-divider"></div>

            <div class="toolbar-group">
                <select class="ql-color" title="文字颜色"></select>
                <select class="ql-background" title="背景颜色"></select>
            </div>
        </div>
    </div>
</template>

<style scoped>
.floating-toolbar {
    position: absolute;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    padding: 8px;
    display: none;
    z-index: 100;
    transition: all 0.2s ease;
}

.floating-toolbar.active {
    display: block;
}

.ql-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    border: none !important;
    padding: 0 !important;
}

.toolbar-group {
    display: flex;
    align-items: center;
    gap: 4px;
}

.toolbar-divider {
    width: 1px;
    height: 16px;
    background-color: #e0e0e0;
}

.ql-formats button,
.ql-formats select {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
    border: none !important;
}

.ql-formats button:hover,
.ql-formats select:hover {
    background-color: #f0f0f0;
}
</style>
