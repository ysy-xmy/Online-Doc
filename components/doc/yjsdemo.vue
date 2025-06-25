<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useDocumentStore } from "@/stores/document";
import _ from "lodash";

// 响应式变量
const quillEditor = ref(null);
const floatingToolbar = ref(null);
const isClient = process.client;
// 定义响应式变量来存储动态导入的模块
const quillModule = ref(null);
const yjsModule = ref(null);
const quillBindingModule = ref(null);
const websocketModule = ref(null);
const localUser = ref({
    name: `用户_${Math.random().toString(36).substr(2, 9)}`,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    timestamp: Date.now(),
    cursorPosition: null,
    cursorLength: 0,
});

// 添加 userSelectionRange 变量
let userSelectionRange = null;

let quill = null;
let ydoc = null;
let ytext = null;
let provider = null;
let awareness = null;
const documentStore = useDocumentStore();
const documentInfo = useDocumentStore().documentInfo;
const usersInfo = useDocumentStore().usersInfo;

// 异步加载依赖
const loadDependencies = async () => {
    if (!isClient) return;

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
    // 使用 store 的防抖自动保存方法
    documentInfo.isSaving = true;
    documentInfo.saveStatus = "保存中";
    debouncedRestoreSaveStatus();
};

// 渲染远程光标的函数
const renderRemoteCursors = () => {
    if (!isClient || !quill || !websocketModule.value) return;
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
            console.log("bounds", bounds);
            // 创建光标元素
            const cursorElement = document.createElement("div");
            cursorElement.classList.add("remote-cursor");
            cursorElement.style.position = "absolute";
            cursorElement.style.left = `${bounds.left}px`;
            cursorElement.style.top = `${bounds.top}px`;
            cursorElement.style.backgroundColor = state.user.color || "blue";
            cursorElement.style.width = "2px";
            cursorElement.style.height = `${bounds.height}px`;

            // 创建悬浮工具栏
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

// 监测编辑器滚动
const handleEditorScroll = () => {
    console.log("编辑器滚动");
    // 重新渲染远程光标以确保位置正确
    debouncedRenderCursors();
};

// 防抖版本的渲染远程光标（编辑器滚动）
const debouncedRenderCursors = debounce(renderRemoteCursors, 1);

// 防抖版本的渲染远程光标
const debouncedRenderRemoteCursors = debounce(renderRemoteCursors, 50);

// 初始化编辑器和协同功能
const initCollaborativeEditor = async () => {
    if (!isClient || !quillEditor.value) return;

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

    // 配置 WebSocket 提供者（发起请求）
    provider = new websocketModule.value.WebsocketProvider(
        "ws://localhost:1234",
        // "ws://8.134.200.53:1234",
        "my-roomname",
        ydoc,
        {
            reconnect: true,
            reconnectTimeout: 5000,
            maxBackoff: 30000,
            params: {
                username: `用户_${Math.random().toString(36).substr(2, 9)}`,
            },
        }
    );

    // 监听 Yjs 文本变更
    ytext.observe((event) => {
        // console.log("Yjs 文本变更事件:", event);

        // 只在有实际变更时才处理
        if (event.changes.delta && event.changes.delta.length > 0) {
            // console.log("检测到实际内容变更");

            const selection = quill.getSelection();
            console.log("当前选择:", selection);

            // 更新用户状态
            const updatedUser = {
                ...localUser.value,
                cursorPosition: selection?.index,
                cursorLength: selection?.length,
            };

            // 渲染远程光标
            renderRemoteCursors();

            // 保持当前选择
            if (selection) {
                quill.setSelection(selection.index, selection.length, "silent");
            }
        }

        // 自动保存
        autoSave();
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
    quill.on("selection-change", (range) => {
        console.log("range", range);

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

            // 设置本地用户状态
            awareness.setLocalStateField("user", updatedUser);

            //这里是本地的光标渲染
            debouncedRenderRemoteCursors();

            // 处理悬浮工具栏
            handleSelectionChange(range);

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

        // 直接更新用户列表到 store
        const formattedUsers = users
            .filter((user) => user.user && user.user.name) // 过滤掉无效用户
            .map((user) => ({
                userName: user.user.name,
                clientID: user.clientID,
                color: user.user.color,
                isLocal: user.clientID === awareness.clientID,
            }));

        documentStore.$patch({
            allUsersList: formattedUsers,
        });

        // 获取当前用户信息
        getCurrentUserInfo();

        users.forEach((user) => {
            if (user.cursorPosition !== undefined) {
                // console.log(
                //     `用户 ${user.user.name} 的光标位置：${user.cursorPosition}`
                // );
                // console.log("当前user", user);
                // usersInfo.clientID = user?.clientID;
            }
        });
    });

    // 同步状态监听
    provider.on("sync", (isSynced) => {
        console.log("🌐 同步状态:", isSynced ? "已同步" : "未同步");
    });

    // 连接状态监听
    provider.on("status", (event) => {
        console.log("🔗 连接状态变化:", event);
    });

    // 监听连接建立
    provider.on("connect", () => {
        console.log(9999999);

        // 设置本地用户状态
        if (awareness) {
            awareness.setLocalStateField("user", {
                name: localUser.value.name,
                id:
                    localUser.value.id ||
                    Math.random().toString(36).substr(2, 9),
                color: localUser.value.color,
                timestamp: Date.now(),
                cursorPosition: null,
                cursorLength: 0,
            });

            // 获取并显示当前用户信息
            setTimeout(() => {
                const username = usersInfo.name;
                const clientID = usersInfo.clientID;
                console.log("连接建立后 - 当前用户名:", username);
                console.log("连接建立后 - 当前客户端ID:", clientID);
            }, 1000);
        }
    });

    // 监听连接断开
    provider.on("disconnect", () => {
        console.log("🔗 WebSocket 连接已断开");
    });
    // 监听连接断开
    provider.on("message", (event) => {
        console.log("🔗 WebSocket 消息:", event);
    });

    // 添加编辑器滚动监听器
    nextTick(() => {
        const editorElement = document.querySelector(".ql-editor");

        if (editorElement) {
            editorElement.addEventListener("scroll", handleEditorScroll);
            console.log("已添加 .ql-editor 滚动监听器");
        }
    });

    // 直接监听 WebSocket 消息（绕过 Yjs 拦截）
};

// 处理选区变化
const handleSelectionChange = (range) => {
    if (!range) return;

    nextTick(() => {
        const toolbar = floatingToolbar.value;
        if (!toolbar) return;

        if (range.length > 0) {
            // 有选中内容时显示工具栏
            toolbar.classList.add("active");
            positionToolbar(range);
        } else {
            // 没有选中内容时隐藏工具栏
            toolbar.classList.remove("active");
        }
    });
};

// 定位工具栏
const positionToolbar = (range) => {
    if (!quill || !floatingToolbar.value) return;

    try {
        const bounds = quill.getBounds(range.index, range.length);
        const toolbar = floatingToolbar.value;

        const toolbarWidth = toolbar.offsetWidth;
        const toolbarHeight = toolbar.offsetHeight;

        let left = bounds.left + bounds.width / 2 - toolbarWidth / 2;
        let top = bounds.top - toolbarHeight - 10;

        const editorRect = quillEditor.value.getBoundingClientRect();
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

// 获取当前用户信息
const getCurrentUserInfo = () => {
    // 如果awareness为空，则返回null
    if (!awareness) return null;

    // 获取本地用户状态
    const localState = awareness.getLocalState();
    // console.log("本地用户状态:", localState);
    if (localState?.user) {
        documentStore.$patch({
            usersInfo: {
                name: localState.user.name,
                color: localState.user.color,
                timestamp: localState.user.timestamp,
                clientID: awareness.clientID,
            },
        });
    } else {
        return null;
    }
};

// 组件挂载时初始化
onMounted(async () => {
    if (!isClient) return;

    // 先加载依赖
    await loadDependencies();

    // 初始化编辑器
    await initCollaborativeEditor();
});

// 组件卸载时清理
onUnmounted(() => {
    // console.log("组件卸载，清理资源...");

    // 清理滚动监听器
    document
        .querySelector(".ql-editor")
        ?.removeEventListener("scroll", handleEditorScroll);

    // 清空用户信息
    documentStore.$patch({
        usersInfo: {
            name: "",
            color: "",
            timestamp: 0,
            clientID: "",
        },
        allUsersList: [],
    });
    provider?.disconnect();
    ydoc?.destroy();
});

// 暴露方法给模板使用
defineExpose({
    getCurrentUserInfo,
    usersInfo,
});
</script>

<template>
    <div class="quill-container">
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
        <div ref="quillEditor" class="editor"></div>
    </div>
</template>

<style scoped>
.quill-container {
    position: relative;
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #f8f9fa;
    overflow: hidden;
}

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

.editor {
    flex: 1;
    min-height: 300px;
    max-height: none;
    outline: none !important;
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin: 12px;
}

.ql-container {
    position: relative;
    border: none !important;
    font-size: 16px;
    border-radius: 8px;
    height: 100%;
}

.ql-editor {
    padding: 24px !important;
    min-height: 300px;
    height: 100%;
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
</style>
