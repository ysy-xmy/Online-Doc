<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from "vue";
import { useDocumentStore } from "@/stores/document";
import _ from "lodash";


import 'highlight.js/styles/atom-one-dark.min.css';
import hljs from 'highlight.js/lib/common';
import { useUserStore } from "@/stores/user";
import { useDocumentStore as useDocStore } from "@/stores/document";
const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);

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
    name: userInfo.value.username || '未命名用户',
    id: userInfo.value.id || '',
    color: userInfo.value.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
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
const commentList = ref([]);
const currentComment = ref(null);
const documentStore = useDocStore();
const documentInfo = useDocStore().documentInfo;
const usersInfo = useDocStore().usersInfo;
const emits = defineEmits(['openCommentPanel']);
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
    
    const editorContainer = document.querySelector(".ql-container");
    const editorElement = document.querySelector(".ql-editor");
    if (!editorContainer || !editorElement) return;

    // 清除之前的光标
    const existingCustomCursors = document.querySelectorAll(".remote-cursor");
    existingCustomCursors.forEach((cursor) => cursor.remove());

    const allStates = awareness.getStates();
    const users = Array.from(allStates.entries()).filter(
        ([clientID, state]) =>
            state.user &&
            state.user.cursorPosition !== undefined &&
            state.user.cursorPosition !== null
    );

    users.forEach(([clientID, state]) => {
        try {
            // 获取光标位置的精确边界，增加容错处理
            let bounds;
            try {
                bounds = quill.getBounds(state.user.cursorPosition);
            } catch (boundsError) {
                console.warn("获取光标边界失败:", boundsError);
                return; // 跳过此用户的光标渲染
            }

            // 额外检查边界的有效性
            if (!bounds || bounds.left === undefined || bounds.top === undefined) {
                console.warn("无效的光标边界:", bounds);
                return;
            }

            // 考虑编辑器的滚动偏移
            const scrollTop = editorElement.scrollTop;
            const scrollLeft = editorElement.scrollLeft;

            const cursorElement = document.createElement("div");
            cursorElement.classList.add("remote-cursor");
            cursorElement.classList.add(`remote-cursor-${clientID}`);
            cursorElement.style.position = "absolute";
            
            // 使用相对定位，考虑滚动
            cursorElement.style.left = `${bounds.left - scrollLeft}px`;
            cursorElement.style.top = `${bounds.top - scrollTop}px`;
            
            cursorElement.style.backgroundColor = state.user.color || "blue";
            cursorElement.style.width = "2px";
            cursorElement.style.height = `${bounds.height}px`;
            cursorElement.style.zIndex = "1000";
            cursorElement.style.pointerEvents = "none";

            // 创建悬浮提示
            const tooltipElement = document.createElement("div");
            tooltipElement.classList.add("remote-cursor-tooltip");
            tooltipElement.textContent = state.user.name || "匿名用户";
            tooltipElement.style.position = "absolute";
            tooltipElement.style.left = "12px";
            tooltipElement.style.top = "15px";
            tooltipElement.style.backgroundColor = state.user.color || "blue";
            tooltipElement.style.color = "white";
            tooltipElement.style.fontSize = "10px";
            tooltipElement.style.padding = "2px";
            tooltipElement.style.borderRadius = "3px";

            cursorElement.appendChild(tooltipElement);
            editorContainer.appendChild(cursorElement);

        } catch (error) {
            console.error("渲染光标时出错:", error, "用户状态:", state);
        }
    });
};

// 监测编辑器滚动
const handleEditorScroll = () => {
    console.log("编辑器滚动");
    // 重新渲染远程光标以确保位置正确
    debouncedRenderCursors();

    // 额外处理：重新同步用户状态
    if (awareness && quill) {
        const selection = quill.getSelection();
        if (selection) {
            const updatedUser = {
                ...localUser.value,
                cursorPosition: selection.index,
                cursorLength: selection.length,
            };
            awareness.setLocalStateField("user", updatedUser);
        }
    }
};

// 防抖版本的渲染远程光标（编辑器滚动）
const debouncedRenderCursors = debounce(renderRemoteCursors, 50);

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

    // 注册自定义 Blot 用于处理评论标记
    const Quill = quillModule.value.default;
    const Embed = Quill.import('blots/embed');

    class CommentBlot extends Embed {
        static create(value) {
            let node = super.create(value);
            
            // 处理不同类型的输入
            let commentData = null;
            if (typeof value === 'object') {
                // 如果是完整的对象，包括 node 属性
                if (value.node) {
                    // 复制单一属性
                    commentData = JSON.parse(
                        value.node.getAttribute('data-comment')
                    );
                } else {
                    // 直接使用传入的对象
                    commentData = value;
                }
            }

            // 确保有默认值
            commentData = commentData || {
                selectionId: Date.now(),
                range: { index: 0, length: 0 },
                color: localUser.value.color || 'blue',
                createTime: new Date().toLocaleString(),
                comments: []
            };

            // 检查是否已存在相同 selectionId 的评论标记
            const existingCommentMark = quill.root.querySelector(`[data-comment][id="${commentData.selectionId}"]`);

            if (existingCommentMark) {
                // 如果存在，更新现有的评论数据
                const existingCommentData = JSON.parse(existingCommentMark.getAttribute('data-comment'));
                const mergedComments = [
                    ...existingCommentData.comments, 
                    ...commentData.comments
                ];

                commentData = {
                    ...existingCommentData,
                    comments: mergedComments
                };

                // 使用现有的节点，而不是重新赋值
                node = existingCommentMark;
            }

            // 设置 data-comment 属性
            node.setAttribute('data-comment', JSON.stringify(commentData));
            node.setAttribute('id', commentData.selectionId.toString());
            
            // 添加 data-index 属性
            node.setAttribute('data-index', commentData.range.index.toString());
            
            // 创建更现代的评论标记（角标样式）
            const commentMark = document.createElement('sup');
            commentMark.classList.add('inline-comment-marker');
            commentMark.style.position = 'absolute';
            commentMark.style.top = '-10px';
            commentMark.style.right = '-10px';
            commentMark.style.backgroundColor = commentData.color || localUser.value.color;
            commentMark.style.color = 'white';
            commentMark.style.borderRadius = '3px';
            commentMark.style.width = '15px';
            commentMark.style.height = '15px';
            commentMark.style.display = 'flex';
            commentMark.style.alignItems = 'center';
            commentMark.style.justifyContent = 'center';
            commentMark.style.fontSize = '8px';
            commentMark.style.cursor = 'pointer';
            commentMark.style.fontWeight = 'bold';
            commentMark.style.border = '1px solid rgba(255,255,255,0.3)';
            commentMark.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
            commentMark.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
            `;
            commentMark.contentEditable = 'false';
            
            // 清除之前的评论标记（如果存在）
            const existingCommentMarkElement = node.querySelector('.inline-comment-marker');
            if (existingCommentMarkElement) {
                node.removeChild(existingCommentMarkElement);
            }
            
            // 将评论标记添加到节点中
            node.appendChild(commentMark);
            
            // 设置样式
            node.style.position = 'relative';
            node.style.display = 'inline-block';
            node.style.paddingRight = '4px';
            
            return node;
        }

        static value(node) {
            const commentData = node.getAttribute('data-comment');
            return commentData ? JSON.parse(commentData) : null;
        }

        // 实现 deleteAt 方法
        deleteAt(index, length) {
            // 阻止删除操作
            return;
        }

        // 实现 split 方法
        split(index, value) {
            // 创建左右两个节点的副本
            const leftNode = this.domNode.cloneNode(true);
            const rightNode = this.domNode.cloneNode(true);

            // 尝试安全地处理评论标记
            const commentMark = this.domNode.querySelector('.inline-comment-marker');
            if (commentMark) {
                // 确保两个节点都有评论标记
                const leftCommentMark = leftNode.querySelector('.inline-comment-marker');
                const rightCommentMark = rightNode.querySelector('.inline-comment-marker');
                
                if (leftCommentMark) leftCommentMark.remove();
                if (rightCommentMark) rightCommentMark.remove();

                // 复制评论数据
                const commentData = JSON.parse(this.domNode.getAttribute('data-comment') || '{}');
                
                leftNode.setAttribute('data-comment', JSON.stringify(commentData));
                rightNode.setAttribute('data-comment', JSON.stringify(commentData));

                // 重新添加评论标记
                leftNode.appendChild(commentMark.cloneNode(true));
                rightNode.appendChild(commentMark.cloneNode(true));
            }

            return [leftNode, rightNode];
        }

        // 实现 optimize 方法
        optimize(mutations) {
            // 确保评论标记始终存在
            if (!this.domNode.querySelector('.inline-comment-marker')) {
                const commentMark = document.createElement('sup');
                commentMark.classList.add('inline-comment-marker');
                commentMark.style.backgroundColor = localUser.value.color || 'blue';
                commentMark.style.color = 'white';
                commentMark.style.borderRadius = '50%';
                commentMark.style.padding = '0 4px';
                commentMark.style.margin = '0 2px';
                commentMark.style.fontSize = '8px';
                commentMark.style.fontWeight = 'bold';
                commentMark.style.cursor = 'pointer';
                commentMark.style.display = 'inline-block';
                commentMark.style.lineHeight = '1';
                commentMark.style.verticalAlign = 'super';
                commentMark.textContent = '•';
                commentMark.contentEditable = 'false';
                this.domNode.appendChild(commentMark);
            }
        }
        // 实现 isolate 方法
        isolate(index, length) {
            // 返回当前节点，不做额外处理
            return this.domNode;
        }
    }

    CommentBlot.blotName = 'comment';
    CommentBlot.tagName = 'span';

    Quill.register(CommentBlot);

    // 创建 Quill 编辑器实例
    quill = new Quill(quillEditor.value, {
        theme: "snow",
        modules: {
          syntax: {
            hljs: hljs,  // 显式传递 hljs 实例
          },
            toolbar: "#toolbar", // 指定工具栏
            history: {
                delay: 1000,
                maxStack: 500,
                userOnly: true,
            }
        },
        placeholder: "开始协同编辑...",
    });

    // 点击事件处理
    quill.root.addEventListener('click', (event) => {
        const commentMark = event.target.closest('[data-comment]');
        
        if (commentMark) {
            event.preventDefault();
            event.stopPropagation();

            // 从单一属性中提取评论信息
            const commentInfo = JSON.parse(
                commentMark.getAttribute('data-comment')
            );

            // 打开评论面板并传递评论信息
            emits('openCommentPanel', commentInfo);
            currentComment.value = commentInfo;

            // 取消选中
            const selection = quill.getSelection();
            if (selection) {
                // 安全地清除背景色
                try {
                    if (userSelectionRange) {
                        quill.removeFormat(
                            userSelectionRange.index, 
                            userSelectionRange.length
                        );
                        userSelectionRange = null;
                    }
                    quill.setSelection(null);
                } catch (error) {
                    console.error("清除背景色时出错:", error);
                }
            }
        }
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
            "ws://8.134.200.53:1234",
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
        // 只在有实际变更时才处理
        if (event.changes.delta && event.changes.delta.length > 0) {
            // console.log("检测到实际内容变更");

            const selection = quill.getSelection();
            console.log("当前选择:", selection);

            // 渲染远程光标
            const updatedUser = {
                ...localUser.value,
                cursorPosition: selection?.index+1,
                cursorLength: selection?.length,
            };

            // 设置本地用户状态
            awareness.setLocalStateField("user", updatedUser);

            //这里是本地的光标渲染
            debouncedRenderRemoteCursors();

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
    } catch (error) {
        console.error("QuillBinding 创建失败:", error);
    }

    // 配置 Awareness
    awareness = provider.awareness;

    // 光标选择变化监听
    quill.on("selection-change", (range, oldRange, source) => {
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
            handleSelectionChange(range, oldRange, source);

            // 移除选择高亮
            if (range.length > 0) {
                // 存储当前选择区域
                userSelectionRange = range;
            } else {
                // 如果之前有选择区域，清除该区域的背景色
                if (userSelectionRange) {
                    try {
                       // 使用 formatText 清除背景色
                        quill.formatText(
                            userSelectionRange.index, 
                            userSelectionRange.length
                        );
                        userSelectionRange = null;
                    } catch (error) {
                        console.error("清除背景色时出错:", error);
                    }
                }
            }
        } else {
            // 当没有选区时，确保清除之前的背景色
            if (userSelectionRange) {
                try {
                    // 使用 formatText 清除背景色
                    quill.formatText(
                        userSelectionRange.index, 
                        userSelectionRange.length
                    );
                    userSelectionRange = null;
                } catch (error) {
                    console.error("清除背景色时出错:", error);
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
                id: localUser.value.id || Math.random().toString(36).substr(2, 9),
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

    // 监听用户信息变化
    watch(() => userInfo.value, (newUserInfo) => {
        // 更新 localUser
        localUser.value = {
            name: newUserInfo.username || '未命名用户',
            id: newUserInfo.id || '',
            color: newUserInfo.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
            timestamp: Date.now(),
            cursorPosition: null,
            cursorLength: 0,
        };

        // 如果已连接，更新 Awareness
        if (awareness) {
            awareness.setLocalStateField("user", localUser.value);
        }
    }, { immediate: true });

    // 直接监听 WebSocket 消息（绕过 Yjs 拦截）
};

// 处理选区变化
const handleSelectionChange = (range, oldRange, source) => {
    const toolbar = floatingToolbar.value;
    if (!toolbar) return;

    // 如果没有选区，或选区长度为0，隐藏工具栏
    if (!range || range.length === 0) {
        toolbar.classList.remove("active");
        return;
    }

    // 有选中内容时显示工具栏
    if (range.length > 0) {
        toolbar.classList.add("active");
        positionToolbar(range);
    }
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

//处理评论
const addComment = () => {
    const selection = quill.getSelection();
    
    // 如果没有选择，提示用户
    if (!selection) {
        alert('请选择要添加评论的位置');
        return;
    }

    // 检查当前位置是否已存在评论
    const existingCommentMark = quill.root.querySelector(`[data-comment][id][data-index="${selection.index}"]`);
    
    if (existingCommentMark) {
        // 如果已存在评论，解析并打开已有的评论
        const commentData = JSON.parse(existingCommentMark.getAttribute('data-comment'));
        
        // 取消选取
        quill.setSelection(null);

        // 明确隐藏工具栏
        const toolbar = floatingToolbar.value;
        if (toolbar) {
            toolbar.classList.remove("active");
        }

        // 打开已存在的评论面板
        emits('openCommentPanel', commentData);
        return;
    }

    // 获取选中的文本
    const selectedText = selection.length > 0 
        ? quill.getText(selection.index, selection.length) 
        : '';

    const commentData = {
        selectionId: Date.now(),
        range: {
            index: selection.index,
            length: selection.length
        },
        index: selection.index,
        color: localUser.value.color,
        createTime: new Date().toLocaleString().replace(/\//g, '/'),
        comments: []
    };

    // 直接插入评论标记
    quill.insertEmbed(selection.index, 'comment', commentData);

    // 取消选取
    quill.setSelection(null);

    // 明确隐藏工具栏
    const toolbar = floatingToolbar.value;
    if (toolbar) {
        toolbar.classList.remove("active");
    }

    // 打开评论面板
    emits('openCommentPanel', commentData);
};

// 插入评论的方法（支持外部调用）
const insertCommentAtPosition = (commentData) => {
  if (!quill || !awareness) return null;

  // 获取现有的评论标记
  const existingCommentMark = quill.root.querySelector(`[data-comment][id="${commentData.selectionId}"]`);
  
  if (!existingCommentMark) {
    console.error('未找到对应的评论标记');
    return null;
  }

  // 获取现有的评论数据
  let existingCommentData = JSON.parse(existingCommentMark.getAttribute('data-comment'));

  // 准备新的评论
  const newComment = {
    id: Date.now(), // 生成唯一ID
    text: commentData.newComment.text,
    author: '当前用户',
    timestamp: new Date().toLocaleString().replace(/\//g, '/'),
  };

  // 更新现有评论数据
  existingCommentData.comments.push(newComment);

  // 更新 data-comment 属性
  existingCommentMark.setAttribute('data-comment', JSON.stringify(existingCommentData));

  // 打开侧边评论面板
  emits('openCommentPanel', existingCommentData);
  currentComment.value = existingCommentData;

  return existingCommentData;
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
    insertCommentAtPosition
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
                <select class="ql-font" title="字体">
                  <option value="serif">衬线字体</option>
                  <option value="monospace">等宽字体</option>
                  <option selected>默认字体</option>
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
                <button class="ql-align" value="center" title="居中对齐"></button>
                <button class="ql-align" value="right" title="右对齐"></button>
                <button class="ql-align" value="justify" title="两端对齐"></button>
              </div>

                <div class="toolbar-divider"></div>

                <div class="toolbar-group">
                    <select class="ql-color" title="文字颜色"></select>
                    <select class="ql-background" title="背景颜色"></select>
                    <button class="ql-code-block" title="代码块">代码块</button>
                </div>
                <div class="toolbar-group">
                    <button class="ql-comment-icon" @click="addComment">💬</button>
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

.inline-comment-marker {
    transition: all 0.2s ease;
    opacity: 0.7;
    transform: scale(0.9);
}

.inline-comment-marker svg {
    stroke: white;
    width: 8px;
    height: 8px;
}

.inline-comment-marker:hover {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 2px 3px rgba(0,0,0,0.15);
}
</style>
