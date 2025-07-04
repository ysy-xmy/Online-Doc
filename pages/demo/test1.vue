<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
// 响应式变量
const quillEditor = ref(null);
// 定义响应式变量来存储动态导入的模块
const quillModule = ref(null);
const yjsModule = ref(null);
const quillBindingModule = ref(null);
const websocketModule = ref(null);

// 文档信息相关变量
const documentInfo = ref({
    name: "未命名文档",
    lastSaved: new Date(),
    isSaving: false,
    saveStatus: "已保存", // "已保存", "保存中", "未保存"
});

const localUser = ref({
    name: `用户_${Math.random().toString(36).substr(2, 9)}`,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    timestamp: Date.now(),
    cursorPosition: null,
    cursorLength: 0,
});

// 在线用户列表
const onlineUsers = ref([]);

// 添加 userSelectionRange 变量
let userSelectionRange = null;

let quill = null;
let ydoc = null;
let ytext = null;
let provider = null;
let awareness = null;

// 计算属性：格式化最后保存时间
const formattedLastSaved = computed(() => {
    const now = new Date();
    const diff = now - documentInfo.value.lastSaved;

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
        return documentInfo.value.lastSaved.toLocaleDateString();
    }
});

// 计算属性：在线用户数量
const onlineUserCount = computed(() => {
    return onlineUsers.value.length;
});

// 自动保存功能
const autoSave = () => {
    if (documentInfo.value.isSaving) return;

    documentInfo.value.isSaving = true;
    documentInfo.value.saveStatus = "保存中";

    // 模拟保存过程
    setTimeout(() => {
        documentInfo.value.lastSaved = new Date();
        documentInfo.value.isSaving = false;
        documentInfo.value.saveStatus = "已保存";
    }, 1000);
};

// 更新在线用户列表
const updateOnlineUsers = () => {
    if (!awareness) return;

    const allStates = awareness.getStates();
    const users = Array.from(allStates.entries())
        .filter(([clientID, state]) => state.user && state.user.name)
        .map(([clientID, state]) => ({
            id: clientID,
            name: state.user.name,
            color: state.user.color,
            isLocal: clientID === awareness.clientID,
        }));

    onlineUsers.value = users;
};

// 异步加载依赖
const loadDependencies = async () => {
    try {
        // 动态导入依赖
        quillModule.value = await import("quill");
        yjsModule.value = await import("yjs");
        quillBindingModule.value = await import("y-quill");
        websocketModule.value = await import("y-websocket");

        // 导入样式
        await import("quill/dist/quill.snow.css");
    } catch (error) {
        console.error("加载依赖时出错:", error);
    }
};

// 防抖函数
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

// 渲染远程光标的函数
const renderRemoteCursors = () => {
    // 清除之前的光标
    const existingCursors = document.querySelectorAll(".remote-cursor");
    console.log(existingCursors);
    existingCursors.forEach((cursor) => cursor.remove());

    const allStates = awareness.getStates();
    const users = Array.from(allStates.entries()).filter(
        ([clientID, state]) =>
            state.user &&
            state.user.cursorPosition !== undefined &&
            state.user.cursorPosition !== null
    );

    users.forEach(([clientID, state]) => {
        try {
            const bounds = quill.getBounds(state.user.cursorPosition);

            const cursorElement = document.createElement("div");
            cursorElement.classList.add("remote-cursor");
            cursorElement.style.position = "absolute";
            cursorElement.style.left = `${bounds.left}px`;
            cursorElement.style.top = `${bounds.top}px`;
            cursorElement.style.backgroundColor = state.user.color || "blue";
            cursorElement.style.width = "2px";
            cursorElement.style.height = `${bounds.height}px`;

            const containerTooltip = document.createElement("div");
            const tooltipElement = document.createElement("div");
            tooltipElement.classList.add("remote-cursor-tooltip");
            tooltipElement.textContent = state.user.name || "匿名用户";
            tooltipElement.style.visibility = "visible";
            tooltipElement.style.opacity = "0.7";
            tooltipElement.style.position = "absolute";
            tooltipElement.style.left = "12px";
            tooltipElement.style.top = "15px";
            tooltipElement.style.backgroundColor = state.user.color || "blue";
            tooltipElement.style.color = "white";
            tooltipElement.style.fontSize = "10px";
            tooltipElement.style.padding = "2px";
            tooltipElement.style.borderRadius = "3px";
            tooltipElement.style.boxShadow = "0 1px 3px rgba(0,0,0,0.12)";
            tooltipElement.style.fontWeight = "500";
            tooltipElement.style.borderRadius = "10px";

            containerTooltip.appendChild(tooltipElement);
            cursorElement.appendChild(containerTooltip);

            const editorContainer = document.querySelector(".ql-container");
            if (editorContainer) {
                editorContainer.appendChild(cursorElement);
            }
        } catch (error) {
            console.error("渲染光标时出错:", error);
        }
    });
};

const debouncedRenderRemoteCursors = debounce(renderRemoteCursors, 50);

// 初始化编辑器和协同功能
const initCollaborativeEditor = async () => {
    // 确保所有依赖已加载
    if (
        !quillModule.value ||
        !yjsModule.value ||
        !quillBindingModule.value ||
        !websocketModule.value
    ) {
        console.error("依赖未完全加载");
        return;
    }

    // 创建 Quill 编辑器实例
    quill = new quillModule.value.default(quillEditor.value, {
        theme: "snow",
        modules: {
            toolbar: "#toolbar", // 指定工具栏
            history: {
                delay: 1000,
                maxStack: 500,
                userOnly: true,
            },
        },
        placeholder: "开始协同编辑...",
    });

    // 创建 Yjs 文档
    ydoc = new yjsModule.value.Doc({
        gc: true,
        gcFilter: (item) => !item.deleted,
    });

    // 创建共享文本
    ytext = ydoc.getText("text");

    // 配置 WebSocket 提供者
    // 使用动态房间名称
    const roomName = `test-room-${Date.now()}`;
    const wsUrl = `ws://8.134.200.53:1234?room=${roomName}`;

    provider = new websocketModule.value.WebsocketProvider(wsUrl, ydoc, {
        reconnect: true,
        reconnectTimeout: 5000,
        maxBackoff: 30000,
        params: {
            username: `用户_${Math.random().toString(36).substr(2, 9)}`,
        },
    });

    // 监听 Yjs 文本变更
    ytext.observe((event) => {
        const selection = quill.getSelection();
        console.log(selection, "1");

        const yjsContent = ytext.toDelta();
        const currentContent = quill.getContents();

        if (JSON.stringify(currentContent.ops) !== JSON.stringify(yjsContent)) {
            console.log("检测到不一致，同步内容");

            const updatedUser = {
                ...localUser.value,
                cursorPosition: selection?.index,
                cursorLength: selection?.length,
            };

            renderRemoteCursors();

            if (selection) {
                quill.setSelection(selection.index, selection.length, "silent");
            }

            // 内容变更时触发自动保存
            autoSave();
        }
    });

    try {
        const binding = new quillBindingModule.value.QuillBinding(
            ytext,
            quill,
            provider.awareness,
            {
                awareness: provider.awareness,
            }
        );
        console.log("QuillBinding 创建成功", binding);
    } catch (error) {
        console.error("QuillBinding 创建失败:", error);
    }

    // 配置 Awareness
    awareness = provider.awareness;

    // 光标选择变化监听
    quill.on("selection-change", (range, oldRange, source) => {
        console.log(range, "3");

        // 如果当前 range 为 null，尝试使用上一次的 range
        if (!range && userSelectionRange) {
            range = userSelectionRange;
        }

        if (range) {
            const updatedUser = {
                ...localUser.value,
                cursorPosition: range.index,
                cursorLength: range.length,
            };

            awareness.setLocalStateField("user", updatedUser);

            debouncedRenderRemoteCursors();

            // 添加选择高亮
            if (range.length > 0) {
                // 存储当前选择区域
                userSelectionRange = range;
                // 为选中区域添加背景色
                quill.formatText(
                    range.index,
                    range.length,
                    "background",
                    localUser.value.color
                );
            } else {
                // 如果之前有选择区域，清除该区域的背景色
                if (userSelectionRange) {
                    quill.formatText(
                        userSelectionRange.index,
                        userSelectionRange.length,
                        "background",
                        false
                    );
                    userSelectionRange = null;
                }
            }
        }
    });

    // Awareness 变化监听
    awareness.on("change", (changes) => {
        const allStates = awareness.getStates();

        // 详细打印所有用户状态和光标位置
        const users = Array.from(allStates.entries()).map(
            ([clientID, state]) => ({
                clientID,
                user: state.user,
                cursorPosition: state.user?.cursorPosition,
                cursorLength: state.user?.cursorLength,
            })
        );

        console.log("当前用户列表:", users);

        users.forEach((user) => {
            if (user.cursorPosition !== undefined) {
                console.log(
                    `用户 ${user.user.name} 的光标位置：${user.cursorPosition}`
                );
            }
        });

        // 更新在线用户列表
        updateOnlineUsers();
    });

    // 同步状态监听
    provider.on("sync", (isSynced) => {
        console.log("🌐 同步状态:", isSynced ? "已同步" : "未同步");
    });
};

// 组件挂载时初始化
onMounted(async () => {
    // 先加载依赖
    await loadDependencies();

    // 初始化编辑器
    await initCollaborativeEditor();

    // 组件卸载时清理
    onUnmounted(() => {
        provider?.disconnect(); // 断开 WebSocket 连接
        ydoc?.destroy();
    });
});
</script>

<template>
    <div class="collaborative-editor-container">
        <!-- 文档信息菜单 -->
        <div class="document-header">
            <div class="document-info">
                <div class="document-title">
                    <input
                        v-model="documentInfo.name"
                        class="title-input"
                        placeholder="输入文档名称"
                        @blur="autoSave"
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

            <div class="online-users">
                <div class="users-info">
                    <span class="users-count">
                        <i class="users-icon">👥</i>
                        {{ onlineUserCount }} 人在线
                    </span>
                </div>
                <div class="users-list">
                    <div
                        v-for="user in onlineUsers"
                        :key="user.id"
                        class="user-item"
                        :class="{ 'local-user': user.isLocal }"
                    >
                        <div
                            class="user-avatar"
                            :style="{ backgroundColor: user.color }"
                        >
                            {{ user.name.charAt(0) }}
                        </div>
                        <span class="user-name">{{ user.name }}</span>
                        <span v-if="user.isLocal" class="local-badge">我</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 编辑器容器 -->
        <div class="quill-container">
            <!-- 固定工具栏 -->
            <div class="fixed-toolbar">
                <div id="toolbar" class="ql-toolbar ql-snow">
                    <div class="toolbar-group">
                        <select class="ql-header" title="标题">
                            <option value="1">标题 1</option>
                            <option value="2">标题 2</option>
                            <option value="3">标题 3</option>
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

                    <div class="toolbar-divider"></div>

                    <div class="toolbar-group">
                        <button
                            class="ql-list"
                            value="ordered"
                            title="有序列表"
                        ></button>
                        <button
                            class="ql-list"
                            value="bullet"
                            title="无序列表"
                        ></button>
                    </div>

                    <div class="toolbar-divider"></div>

                    <div class="toolbar-group">
                        <button class="ql-clean" title="清除格式"></button>
                    </div>
                </div>
            </div>

            <div ref="quillEditor" class="editor"></div>
        </div>
    </div>
</template>

<style scoped>
.collaborative-editor-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f8f9fa;
    overflow: hidden; /* 防止整体滚动 */
}

.document-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: white;
    border-bottom: 1px solid #e9ecef;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    flex-shrink: 0; /* 防止头部被压缩 */
}

.document-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.document-title {
    display: flex;
    align-items: center;
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

.quill-container {
    position: relative;
    flex: 1;
    padding: 12px;
    min-width: 43.75rem;
    max-height: 78vh;
    margin: 0 auto;
    width: 100%;
    overflow: auto; /* 添加滚动条 */
    display: flex;
    flex-direction: column;
    border: 0 !important;
}

.fixed-toolbar {
    background: white;
    /* border: 1px solid #e9ecef; */
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    z-index: 10;
}

.fixed-toolbar .ql-toolbar {
    background: white;
    border: none !important;
    padding: 12px 16px !important;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.fixed-toolbar .toolbar-group {
    display: flex;
    align-items: center;
    gap: 4px;
}

.fixed-toolbar .toolbar-divider {
    width: 1px;
    height: 20px;
    background-color: #e0e0e0;
    margin: 0 4px;
}

.fixed-toolbar .ql-toolbar button,
.fixed-toolbar .ql-toolbar select {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
}

.fixed-toolbar .ql-toolbar button:hover,
.fixed-toolbar .ql-toolbar select:hover {
    background-color: #f8f9fa;
    border-color: #dee2e6;
}

.fixed-toolbar .ql-toolbar button.ql-active {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
}

.fixed-toolbar .ql-toolbar select {
    min-width: 80px;
    padding: 0 8px;
}

.editor {
    min-height: 300px;
    max-height: none;
    outline: none !important;
    background: white;
    border: 1px solid #e9ecef;
    border-top: none;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    flex: 1; /* 让编辑器占满剩余空间 */
}

.ql-container {
    border: none !important;
    font-size: 16px;
    border-radius: 0 0 8px 8px;
    height: 100%; /* 确保容器占满高度 */
}

.ql-editor {
    padding: 24px !important;
    min-height: 300px;
    height: 100%; /* 确保编辑器占满高度 */
}

.ql-snow.ql-toolbar {
    border: none !important;
    padding: 0 !important;
}

.remote-cursor {
    position: absolute;
    pointer-events: none;
}

.remote-cursor-tooltip {
    position: absolute;
    padding: 2px 5px;
    border-radius: 3px;
    color: white;
    font-size: 10px;
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

    .quill-container {
        padding: 16px;
    }
}
</style>
