<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from "vue";
import { useDocumentStore } from "@/stores/document";
import _ from "lodash";
import { useRoute } from "vue-router";

import "highlight.js/styles/atom-one-dark.min.css";
import hljs from "highlight.js/lib/common";
import { useUserStore } from "@/stores/user";
import { useDocumentStore as useDocStore } from "@/stores/document";
const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);
const route = useRoute();

// 接收父组件传递的只读状态
const props = defineProps({
  isReadOnly: {
    type: Boolean,
    default: false,
  },
});
console.log("value:", props.isReadOnly);
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
  name: userInfo.value.username || "未命名用户",
  id: userInfo.value.id || "",
  color: userInfo.value.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
  timestamp: Date.now(),
  cursorPosition: null,
  cursorLength: 0,
});

// 房间信息
const roomInfo = ref({
  roomName: "",
  activeUsers: 0,
  lastUpdate: null,
  hasDocument: false,
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
const emits = defineEmits([
  "openCommentPanel", 
  "updateRevision"  // 新增这一行
]);
const revisionMode = ref(false);
let oldDocumentState;

let deletedBlotRegistered = false;
const registerDeletedContentBlot = () => {
  if (deletedBlotRegistered) return;
  const Quill = quillModule.value?.default;
  if (!Quill) return;
  const Inline = Quill.import('blots/inline');
  class DeletedContentBlot extends Inline {
    static create(value) {
      const node = super.create(value);
      
      // 确保数据结构完整
      const deletedData = {
        type: 'delete',
        content: value.content || '',
        timestamp: value.timestamp || Date.now(),
        userId: value.userId || userInfo.value.id,
        hint: value.hint || '删除内容'
      };
      
      // 同时使用 setAttribute 和 dataset
      node.setAttribute('data-deleted', JSON.stringify(deletedData));
      node.dataset.deleted = JSON.stringify(deletedData);
      
      // 样式保持不变
      node.style.color = 'red';
      node.style.textDecoration = 'line-through';
      node.style.opacity = '1';
      
      return node;
    }

    static value(node) {
      // 尝试从多个来源读取数据
      try {
        return JSON.parse(
          node.getAttribute('data-deleted') || 
          node.dataset.deleted
        );
      } catch (error) {
        console.error('解析删除内容失败:', error);
        return null;
      }
    }
  }
  DeletedContentBlot.blotName = 'deletedContent';
  DeletedContentBlot.tagName = 's';
  Quill.register(DeletedContentBlot, true);
  deletedBlotRegistered = true;
};

let newContentBlotRegistered = false;
const registerNewContentBlot = () => {
  if (newContentBlotRegistered) return;
  const Quill = quillModule.value?.default;
  if (!Quill) return;
  const Inline = Quill.import('blots/inline');
  class NewContentBlot extends Inline {
    static create(value) {
      const node = super.create(value);
      
      // 确保数据结构完整
      const newContentData = {
        type: 'add',
        content: value.content || '',
        timestamp: value.timestamp || Date.now(),
        userId: value.userId || userInfo.value.id,
        hint: value.hint || '新增内容'
      };
      
      // 同时使用 setAttribute 和 dataset
      node.setAttribute('data-new', JSON.stringify(newContentData));
      node.dataset.new = JSON.stringify(newContentData);
      
      // 样式设置
      node.style.color = 'red';
      node.style.textDecoration = 'none';
      
      return node;
    }

    static value(node) {
      // 尝试从多个来源读取数据
      try {
        return JSON.parse(
          node.getAttribute('data-new') || 
          node.dataset.new
        );
      } catch (error) {
        console.error('解析新增内容失败:', error);
        return null;
      }
    }
  }
  NewContentBlot.blotName = 'newContent';
  NewContentBlot.tagName = 's';
  Quill.register(NewContentBlot, true);
  newContentBlotRegistered = true;
};

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

  // 清除之前的光标和选区
  const existingElements = document.querySelectorAll(
    ".remote-cursor, .remote-selection"
  );
  existingElements.forEach((element) => element.remove());

  // 清理无效选区
  cleanupInvalidSelections();

  const allStates = awareness.getStates();

  // 使用 Map 存储每个用户的最后一个状态
  const userStateMap = new Map();

  const users = Array.from(allStates.entries()).filter(
    ([clientID, state]) =>
      state.user &&
      state.user.cursorPosition !== undefined &&
      state.user.cursorPosition !== null &&
      // 排除当前用户的光标
      state.user.id !== userInfo.value.id
  );

  users.forEach(([clientID, state]) => {
    // 如果已经有该用户的光标，只保留最后一个
    if (!userCursorMap.has(state.user.id)) {
      userCursorMap.set(state.user.id, { clientID, state });
    }
  });

  // 渲染去重后的用户光标和选区
  Array.from(userStateMap.values()).forEach(({ clientID, state }) => {
    try {
      const user = state.user;
      const selection = state.selection;

      // 渲染光标
      if (user.cursorPosition !== undefined && user.cursorPosition !== null) {
        let bounds;
        try {
          bounds = quill.getBounds(user.cursorPosition);
        } catch (boundsError) {
          console.warn("获取光标边界失败:", boundsError);
          return;
        }

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
        cursorElement.style.left = `${bounds.left - scrollLeft}px`;
        cursorElement.style.top = `${bounds.top - scrollTop}px`;
        cursorElement.style.backgroundColor = user.color || "blue";
        cursorElement.style.width = "2px";
        cursorElement.style.height = `${bounds.height}px`;
        cursorElement.style.zIndex = "1000";
        cursorElement.style.pointerEvents = "none";

        // 创建悬浮提示
        const tooltipElement = document.createElement("div");
        tooltipElement.classList.add("remote-cursor-tooltip");
        tooltipElement.textContent = user.name || "匿名用户";
        tooltipElement.style.position = "absolute";
        tooltipElement.style.left = "12px";
        tooltipElement.style.top = "15px";
        tooltipElement.style.backgroundColor = user.color || "blue";
        tooltipElement.style.color = "white";
        tooltipElement.style.fontSize = "10px";
        tooltipElement.style.padding = "2px";
        tooltipElement.style.borderRadius = "3px";

        cursorElement.appendChild(tooltipElement);
        editorContainer.appendChild(cursorElement);
      }

      // 渲染选区
      if (selection && selection.index !== undefined && selection.length > 0) {
        console.log("渲染选区:", selection, "用户:", user.name);

        let bounds;
        try {
          bounds = quill.getBounds(selection.index, selection.length);
        } catch (boundsError) {
          console.warn("获取选区边界失败:", boundsError);
          return;
        }

        if (
          !bounds ||
          bounds.left === undefined ||
          bounds.top === undefined ||
          bounds.width <= 0 ||
          bounds.height <= 0
        ) {
          console.warn("无效的选区边界:", bounds);
          return;
        }

        // 考虑编辑器的滚动偏移
        const scrollTop = editorElement.scrollTop;
        const scrollLeft = editorElement.scrollLeft;

        const selectionElement = document.createElement("div");
        selectionElement.classList.add("remote-selection");
        selectionElement.classList.add(`remote-selection-${clientID}`);
        selectionElement.style.position = "absolute";
        selectionElement.style.left = `${bounds.left - scrollLeft}px`;
        selectionElement.style.top = `${bounds.top - scrollTop}px`;
        selectionElement.style.width = `${bounds.width}px`;
        selectionElement.style.height = `${bounds.height}px`;
        selectionElement.style.backgroundColor = `${user.color || "blue"}20`; // 半透明背景
        selectionElement.style.border = `2px solid ${user.color || "blue"}`;
        selectionElement.style.borderRadius = "2px";
        selectionElement.style.zIndex = "999";
        selectionElement.style.pointerEvents = "none";

        editorContainer.appendChild(selectionElement);
      }
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

// 防抖版本的窗口大小变化重新渲染光标
const debouncedWindowResizeCursors = debounce(() => {
  if (awareness && quill) {
    const selection = quill.getSelection();
    if (selection) {
      const updatedUser = {
        ...localUser.value,
        cursorPosition: selection.index,
        cursorLength: selection.length,
      };
      awareness.setLocalStateField("user", updatedUser);
      debouncedRenderRemoteCursors();
    }
  }
}, 200);

// 清理无效选区的函数
const cleanupInvalidSelections = () => {
  const existingSelections = document.querySelectorAll(".remote-selection");
  existingSelections.forEach((selectionElement) => {
    try {
      // 检查选区是否仍然有效
      const clientID = selectionElement.classList.contains("remote-selection-")
        ? selectionElement.className.match(/remote-selection-(\d+)/)?.[1]
        : null;

      if (clientID) {
        const allStates = awareness.getStates();
        const state = allStates.get(parseInt(clientID));

        if (!state || !state.selection || state.selection.length === 0) {
          selectionElement.remove();
          console.log("清理无效选区:", clientID);
        }
      }
    } catch (error) {
      console.warn("清理选区时出错:", error);
      selectionElement.remove();
    }
  });
};

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
  const Embed = Quill.import("blots/embed");

  class CommentBlot extends Embed {
    static create(value) {
      let node = super.create(value);

      let commentData = null;
      if (typeof value === "object") {
        // 如果是完整的对象，包括 node 属性
        if (value.node) {
          // 复制单一属性
          commentData = JSON.parse(value.node.getAttribute("data-comment"));
        } else {
          // 直接使用传入的对象
          commentData = value;
        }
      }

      // 确保有默认值
      commentData = commentData || {
        selectionId: Date.now(),
        range: { index: 0, length: 0 },
        color: localUser.value.color || "blue",
        createTime: new Date().toLocaleString(),
        comments: [],
      };

      // 检查是否已存在相同 selectionId 的评论标记
      const existingCommentMark = quill.root.querySelector(
        `[data-comment][id="${commentData.selectionId}"]`
      );

      if (existingCommentMark) {
        // 如果存在，更新现有的评论数据
        const existingCommentData = JSON.parse(
          existingCommentMark.getAttribute("data-comment")
        );

        // 合并评论，去重
        const mergedComments = [
          ...existingCommentData.comments,
          ...commentData.comments,
        ].filter(
          (comment, index, self) =>
            index ===
            self.findIndex(
              (t) => t.id === comment.id && t.text === comment.text
            )
        );

        commentData = {
          ...existingCommentData,
          comments: mergedComments,
        };

        node = existingCommentMark;
      }

      // 设置 data-comment 属性
      node.setAttribute("data-comment", JSON.stringify(commentData));
      node.setAttribute("id", commentData.selectionId.toString());

      // 添加 data-index 属性
      node.setAttribute("data-index", commentData.range.index.toString());

      // 创建更现代的评论标记（角标样式）
      const commentMark = document.createElement("sup");
      commentMark.classList.add("inline-comment-marker");
      commentMark.style.position = "absolute";
      commentMark.style.top = "-10px";
      commentMark.style.right = "-10px";
      commentMark.style.backgroundColor =
        commentData.color || localUser.value.color;
      commentMark.style.color = "white";
      commentMark.style.borderRadius = "3px";
      commentMark.style.width = "15px";
      commentMark.style.height = "15px";
      commentMark.style.display = "flex";
      commentMark.style.alignItems = "center";
      commentMark.style.justifyContent = "center";
      commentMark.style.fontSize = "8px";
      commentMark.style.cursor = "pointer";
      commentMark.style.fontWeight = "bold";
      commentMark.style.border = "1px solid rgba(255,255,255,0.3)";
      commentMark.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
      commentMark.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
            `;
      commentMark.contentEditable = "false";

      // 清除之前的评论标记（如果存在）
      const existingCommentMarkElement = node.querySelector(
        ".inline-comment-marker"
      );
      if (existingCommentMarkElement) {
        node.removeChild(existingCommentMarkElement);
      }

      // 将评论标记添加到节点中
      node.appendChild(commentMark);

      // 设置样式
      node.style.position = "relative";
      node.style.display = "inline-block";
      node.style.paddingRight = "4px";

      // 触发 Yjs 更新
      try {
        if (ydoc && ytext) {
          const delta = quill.getContents();
          ydoc.transact(() => {
            const binding = quill.getModule("y-quill");
            if (binding) {
              binding.ytext.delete(0, binding.ytext.length);
              binding.ytext.insert(0, delta);
            }
          });
        }
      } catch (error) {
        console.error("CommentBlot 更新时出错:", error);
      }

      return node;
    }

    static value(node) {
      const commentData = node.getAttribute("data-comment");
      return commentData ? JSON.parse(commentData) : null;
    }

    // 实现 deleteAt 方法
    deleteAt(index, length) {
      // 允许完全删除评论标记
      return super.deleteAt(index, length);
    }

    // 实现 split 方法
    split(index, value) {
      // 允许正常分割
      return super.split(index, value);
    }

    // 实现 isolate 方法
    isolate(index, length) {
      // 允许正常隔离
      return super.isolate(index, length);
    }
  }

  CommentBlot.blotName = "comment";
  CommentBlot.tagName = "span";

  Quill.register(
    {
      "blots/comment": CommentBlot,
    },
    true
  );

  // 确定占位文本
  let placeholderText = "开始协同编辑...";
  if (props.isReadOnly) {
    placeholderText = "文档处于只读模式，无法编辑";
  }

  // 创建 Quill 编辑器实例
  quill = new Quill(quillEditor.value, {
    theme: "snow",
    modules: {
      syntax: {
        hljs: hljs, // 显式传递 hljs 实例
      },
      toolbar: "#toolbar", // 指定工具栏
      history: {
        delay: 1000,
        maxStack: 500,
        userOnly: true,
      },
      "y-quill": {
        ytext: ytext,
        awareness: awareness,
      },
    },
    readOnly: props.isReadOnly,
    placeholder: placeholderText,
  });

  // 点击事件处理
  quill.root.addEventListener("click", (event) => {
    // 在只读模式下禁用点击编辑
    if (props.isReadOnly) {
      // 允许复制、选择文本等操作，仅阻止编辑相关行为
      if (
        event.target.tagName === "SELECT" ||
        event.target.tagName === "INPUT"
      ) {
        return; // 允许表单元素交互
      }

      // 阻止默认编辑行为，但保留复制等功能
      if (
        event.target.closest(".ql-editor") &&
        !event.ctrlKey &&
        !event.metaKey && // 允许Ctrl/Cmd键组合
        event.target.getAttribute("contenteditable") !== "false"
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    const commentMark = event.target.closest("[data-comment]");

    if (commentMark) {
      event.preventDefault();
      event.stopPropagation();

      // 从单一属性中提取评论信息
      const commentInfo = JSON.parse(commentMark.getAttribute("data-comment"));

      // 打开评论面板并传递评论信息
      emits("openCommentPanel", commentInfo);
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
  // 使用路由ID作为房间名称，确保房间隔离
  const roomName = route.params.id || "default-room";

  // 验证房间名格式
  if (!/^[a-zA-Z0-9_-]+$/.test(roomName)) {
    console.error("无效的房间名:", roomName);
    alert("无效的房间名");
    return;
  }

  provider = new websocketModule.value.WebsocketProvider(
    // "ws://8.134.200.53:1234",
    "ws://8.134.200.53:8080",
    // "ws://localhost:1234",
    roomName,
    ydoc,
    {
      reconnect: true,
      reconnectTimeout: 5000,
      maxBackoff: 30000,
      params: {
        username:
          localUser.value.name ||
          `用户_${Math.random().toString(36).substr(2, 9)}`,
        room: roomName, // 明确传递房间名
      },
    }
  );

  // 监听 Yjs 文本变更
  ytext.observe((event) => {
    // 只在有实际变更时才处理
    console.log(event, "ssss");
    if (event.changes.delta && event.changes.delta.length > 0) {
      // console.log("检测到实际内容变更");

      const selection = quill.getSelection();
      console.log("当前选择:", selection);

      // 检测删除操作
      const hasDeleteOperation = event.changes.delta.some(
        (change) => change.delete !== undefined
      );

      // 如果有删除操作，清除所有远程选区
      if (hasDeleteOperation) {
        console.log("检测到删除操作，清除远程选区");
        // 清除所有远程选区
        const existingSelections =
          document.querySelectorAll(".remote-selection");
        existingSelections.forEach((element) => element.remove());
      }

      // 判断是否为换行符插入
      const isNewlineInsertion = event.changes.delta.some(
        (change) => change.insert === "\n"
      );

      // 渲染远程光标
      const updatedUser = {
        ...localUser.value,
        cursorPosition: isNewlineInsertion
          ? (selection?.index ?? 0) + 1
          : selection?.index,
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

    // 自动保存（只读模式下不保存）
    if (!props.isReadOnly) {
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
  } catch (error) {
    console.error("QuillBinding 创建失败:", error);
  }

  // 配置 Awareness
  awareness = provider.awareness;

  // 根据只读状态设置不同的用户信息
  if (props.isReadOnly) {
    awareness.setLocalStateField("user", {
      name: `只读用户_${userInfo.value.username || "未命名用户"}`,
      id:
        userInfo.value.id ||
        `readonly_${Math.random().toString(36).substr(2, 9)}`,
      color: "#cccccc", // 使用灰色表示只读用户
      readonly: true, // 标记为只读用户
      timestamp: Date.now(),
      cursorPosition: null,
      cursorLength: 0,
    });
  } else {
    // 原始的用户信息设置
    awareness.setLocalStateField("user", {
      name: userInfo.value.username || "未命名用户",
      id: userInfo.value.id || Math.random().toString(36).substr(2, 9),
      color: userInfo.value.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
      timestamp: Date.now(),
      cursorPosition: null,
      cursorLength: 0,
    });
  }

  // 文本变化监听
  quill.on("text-change", (delta, oldDelta, source) => {
    // 检测删除操作
    const hasDeleteOperation = delta.ops.some((op) => op.delete !== undefined);

    if (hasDeleteOperation) {
      console.log("检测到文本删除操作，清除远程选区");
      // 清除所有远程选区
      const existingSelections = document.querySelectorAll(".remote-selection");
      existingSelections.forEach((element) => element.remove());
    }
  });

  // 光标选择变化监听
  quill.on("selection-change", (range, oldRange, source) => {
    //打印
    if (source === "user") {
      //这里是用户选择
      awareness.setLocalStateField("selection", range);
    }

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

      // 同时设置selection状态
      awareness.setLocalStateField("selection", range);

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
      // 当没有选区时，清除selection状态
      awareness.setLocalStateField("selection", null);

      // 当没有选区时，确保清除之前的背景色
      if (userSelectionRange) {
        try {
          // 使用 formatText 清除背景色
          quill.formatText(userSelectionRange.index, userSelectionRange.length);
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

    allStates.forEach((state, clientID) => {
      if (clientID === ydoc.clientID) return; // 跳过自己
      const user = state.user;
      const selection = state.selection;

      // 如果有selection数据或光标数据，渲染远程用户的光标+选区
      if (selection || (user && user.cursorPosition !== undefined)) {
        console.log("远程用户状态:", { user, selection });
        // 显示远程用户的光标+选区
        debouncedRenderRemoteCursors();
      }
    });

    // 详细打印所有用户状态和光标位置
    const users = Array.from(allStates.entries()).map(([clientID, state]) => ({
      clientID,
      user: state.user,
      cursorPosition: state.user?.cursorPosition,
      cursorLength: state.user?.cursorLength,
    }));

    // 直接更新用户列表到 store
    const formattedUsers = Array.from(
      // 使用 Map 去重，确保每个用户 id 只出现一次
      new Map(
        users
          .filter((user) => user.user && user.user.name) // 过滤掉无效用户
          .map((user) => [
            user.user.id,
            {
              userName: user.user.name,
              clientID: user.clientID,
              color: user.user.color,
              isLocal: user.user.id === userInfo.value.id,
            },
          ])
      ).values()
    );

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
    if (props.isReadOnly) return;
    console.log("🌐 同步状态:", isSynced ? "已同步" : "未同步");
  });

  // 连接状态监听
  provider.on("status", (event) => {
    if (props.isReadOnly) return;
    console.log("🔗 连接状态变化:", event);
  });

  // 监听连接建立
  provider.on("connect", () => {
    if (props.isReadOnly) return;

    console.log(`已连接到房间: ${roomName}`);
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
      // setTimeout(() => {
      //     const username = usersInfo.name;
      //     const clientID = usersInfo.clientID;
      //     // console.log("连接建立后 - 当前用户名:", username);
      //     // console.log("连接建立后 - 当前客户端ID:", clientID);
      //     // console.log("当前房间:", roomName);
      // }, 1000);
    }
  });

  // 监听连接断开
  provider.on("disconnect", () => {
    if (props.isReadOnly) return;
    console.log(`🔗 WebSocket 连接已断开 (房间: ${roomName})`);
  });

  // 监听 WebSocket 消息
  provider.on("message", (event) => {
    if (props.isReadOnly) return;
    console.log(`🔗 WebSocket 消息 (房间: ${roomName}):`, event);

    // 处理房间信息更新
    if (event.data && typeof event.data === "string") {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "roomInfo" || message.type === "roomStatus") {
          roomInfo.value = message.data;
          console.log("房间信息更新:", roomInfo.value);
        }
      } catch (error) {
        // 忽略非JSON消息
      }
    }
  });

  // 监听房间状态变化
  provider.on("status", (event) => {
    console.log(`🔗 连接状态变化 (房间: ${roomName}):`, event);

    // 根据连接状态更新文档状态
    if (event.status === "connected") {
      documentInfo.saveStatus = "已连接";
    } else if (event.status === "disconnected") {
      documentInfo.saveStatus = "连接断开";
    }
  });

  // 添加编辑器滚动监听器
  nextTick(() => {
    const editorElement = document.querySelector(".ql-editor");

    if (editorElement) {
      editorElement.addEventListener("scroll", handleEditorScroll);
      console.log("已添加 .ql-editor 滚动监听器");

      // 添加窗口大小变化监听器
      window.addEventListener("resize", debouncedWindowResizeCursors);
    }
  });

  // 监听用户信息变化
  watch(
    () => userInfo.value,
    (newUserInfo) => {
      // 更新 localUser
      localUser.value = {
        name: newUserInfo.username || "未命名用户",
        id: newUserInfo.id || "",
        color: newUserInfo.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
        timestamp: Date.now(),
        cursorPosition: null,
        cursorLength: 0,
      };

      // 如果已连接，更新 Awareness
      if (awareness) {
        awareness.setLocalStateField("user", localUser.value);
      }
    },
    { immediate: true }
  );

  // 添加键盘事件监听器（只读模式下禁用键盘输入）
  nextTick(() => {
    if (quill && quill.root) {
      quill.root.addEventListener("keydown", handleKeyboardEvent, true);
    }
  });

  // 直接监听 WebSocket 消息（绕过 Yjs 拦截）
};

// 处理选区变化
const handleSelectionChange = (range, oldRange, source) => {
  const toolbar = floatingToolbar.value;
  if (!toolbar) return;

  // 如果是只读模式，始终隐藏工具栏
  if (props.isReadOnly) {
    toolbar.classList.remove("active");
    return;
  }

  // 如果没有选区，或选区长度为0，隐藏工具栏
  if (!range || range.length === 0) {
    toolbar.classList.remove("active");
    return;
  }

  // 有选中内容时显示工具栏
  if (range.length > 0) {
    toolbar.classList.add("active");
    positionToolbar(range);
  } else {
    // 明确隐藏工具栏
    toolbar.classList.remove("active");
  }
};

// 新增键盘事件监听
const handleKeyboardEvent = async (event) => {
  if (!revisionMode.value) return;

  if (event.key === "Backspace" || event.key === "Delete") {
    event.preventDefault();
    event.stopPropagation();

    let selection = quill.getSelection();
    if (!selection) return;

    let index = selection.index;
    let length = selection.length;

    // 无选区时，Backspace 删除前一个字符，Delete 删除后一个字符
    if (length === 0) {
      if (event.key === "Backspace" && index > 0) {
        index = index - 1;
        length = 1;
      } else if (event.key === "Delete" && index < quill.getLength() - 1) {
        length = 1;
      } else {
        return;
      }
    }

    // 获取被删内容
    const deletedDelta = quill.getContents(index, length);

    if (length > 0 && index >= 0 && (index + length) <= quill.getLength()) {
      await handleMarkAsDeleted(index, length);
    }

    // 取消选区
    quill.setSelection(index, 0);
  }
};

// 定位工具栏
const positionToolbar = (range) => {
  if (!quill || !floatingToolbar.value || props.isReadOnly) return;

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
  if (props.isReadOnly) {
    alert("文档处于只读模式，无法添加评论");
    return;
  }
  const selection = quill.getSelection();

  // 如果没有选择，提示用户
  if (!selection) {
    alert("请选择要添加评论的位置");
    return;
  }

  // 检查当前位置是否已存在评论
  const existingCommentMark = quill.root.querySelector(
    `[data-comment][id][data-index="${selection.index}"]`
  );

  if (existingCommentMark) {
    // 如果已存在评论，解析并打开已有的评论
    const commentData = JSON.parse(
      existingCommentMark.getAttribute("data-comment")
    );

    // 取消选取
    quill.setSelection(null);

    // 明确隐藏工具栏
    const toolbar = floatingToolbar.value;
    if (toolbar) {
      toolbar.classList.remove("active");
    }

    // 打开已存在的评论面板
    emits("openCommentPanel", commentData);
    return;
  }

  // 获取选中的文本
  const selectedText =
    selection.length > 0
      ? quill.getText(selection.index, selection.length)
      : "";

  const commentData = {
    selectionId: Date.now(),
    range: {
      index: selection.index,
      length: selection.length,
    },
    selectedText: selectedText,
    index: selection.index,
    color: localUser.value.color,
    createTime: new Date().toLocaleString().replace(/\//g, "/"),
    comments: [],
  };

  // 直接插入评论标记
  quill.insertEmbed(selection.index, "comment", commentData);

  // 取消选取
  quill.setSelection(null);

  // 明确隐藏工具栏
  const toolbar = floatingToolbar.value;
  if (toolbar) {
    toolbar.classList.remove("active");
  }

  // 打开评论面板
  emits("openCommentPanel", commentData);
};

// 插入评论的方法（支持外部调用）
const insertCommentAtPosition = (commentData) => {
  if (!quill || !awareness || !ytext) return null;

  // 获取现有的评论标记
  const existingCommentMark = quill.root.querySelector(
    `[data-comment][id="${commentData.selectionId}"]`
  );

  if (!existingCommentMark) {
    console.error("未找到对应的评论标记");
    return null;
  }

  // 获取现有的评论数据
  let existingCommentData = JSON.parse(
    existingCommentMark.getAttribute("data-comment")
  );

  // 准备新的评论
  const newComment = {
    id: Date.now(),
    text: commentData.newComment.text,
    authorId: userInfo.value?.id,
    nickname: userInfo.value?.nickname || "匿名用户",
    avatar: userInfo.value?.avatar || "默认头像地址",
    color: userInfo.value?.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
    timestamp: new Date().toLocaleString().replace(/\//g, "/"),
  };

  // 更新现有评论数据
  existingCommentData.comments.push(newComment);

  // 获取评论标记的位置和长度
  const index = parseInt(existingCommentMark.getAttribute("data-index"), 10);
  const length = JSON.parse(existingCommentMark.getAttribute("data-comment"))
    .range.length;

  // 仅删除评论标记，不删除后续文本
  quill.deleteText(index, 1);

  // 重新插入带有更新后评论数据的标记
  const updatedCommentData = {
    ...existingCommentData,
    range: { index, length },
  };

  // 在原位置重新插入评论标记
  quill.insertEmbed(index, "comment", updatedCommentData);

  // 显式触发 Yjs 更新
  try {
    const delta = quill.getContents();
    ydoc.transact(() => {
      const binding = quill.getModule("y-quill");
      if (binding) {
        binding.ytext.delete(0, binding.ytext.length);
        binding.ytext.insert(0, delta);
      }
    });

    // 打开侧边评论面板
    emits("openCommentPanel", existingCommentData);
    currentComment.value = existingCommentData;
  } catch (error) {
    console.error("触发 Yjs 更新时出错:", error);
  }

  return existingCommentData;
};

// 设置修订模式的方法
const setRevisionMode = (mode) => {
  revisionMode.value = mode;
  if (quill) {
    if (mode) {
      // 启用修订模式
      quill.enable(true);
      quill.root.classList.add('revision-mode');
      quill.on('text-change', handleRevisionChange);

      // 补充所有修订内容的按钮
      nextTick(() => {
        addRevisionButtons();
        const revisions = extractRevisions();
      });
    } else {
      // 关闭修订模式
      quill.root.classList.remove('revision-mode');
      quill.off('text-change', handleRevisionChange);

      // 移除所有修订按钮
      removeRevisionButtons();
    }
  }
};

const handleRevisionChange = (delta, oldDelta, source) => {
  if (source !== 'user' || !revisionMode.value) return;

  let currentIndex = 0;

  delta.ops.forEach((op) => {
    if (op.retain) {
      currentIndex += op.retain;
    } else if (op.insert) {
      handleAddition(op, currentIndex);
      currentIndex += op.insert.length;
    }
    // 不处理 delete
  });
};

async function handleMarkAsDeleted(index, length) {
  const Quill = quillModule.value.default;

  // 1. 计算合并区间
  let mergeStart = index;
  let mergeLen = length;

  // 向前合并
  while (mergeStart > 0) {
    const [prevLeaf] = quill.getLeaf(mergeStart - 1);
    if (
      prevLeaf &&
      prevLeaf.parent &&
      prevLeaf.parent.domNode &&
      prevLeaf.parent.domNode.dataset.deleted !== undefined
    ) {
      const prevLen = prevLeaf.parent.length();
      mergeStart -= prevLen;
      mergeLen += prevLen;
    } else {
      break;
    }
  }
  // 向后合并
  let tempIndex = index + length;
  while (true) {
    const [nextLeaf] = quill.getLeaf(tempIndex);
    if (
      nextLeaf &&
      nextLeaf.parent &&
      nextLeaf.parent.domNode &&
      nextLeaf.parent.domNode.dataset.deleted !== undefined
    ) {
      const nextLen = nextLeaf.parent.length();
      mergeLen += nextLen;
      tempIndex += nextLen;
    } else {
      break;
    }
  }

  // 2. 先移除合并区间的所有 deletedContent
  quill.formatText(mergeStart, mergeLen, 'deletedContent', false);

  // 3. 等待内容刷新
  await nextTick();

  // 获取删除的文本内容
  const deletedText = quill.getText(mergeStart, mergeLen);

  // 4. 先整体包裹
  quill.formatText(mergeStart, mergeLen, 'deletedContent', {
    type: 'delete',
    content: deletedText,
    timestamp: Date.now(),
    userId: userInfo.value.id,
    hint: ''
  });

  await nextTick();

  // 5. 用 DOM 查询最新的 span[data-deleted]，用 Quill.find 获取 Blot，再 getIndex
  const editor = quill.root;
  const allSpans = Array.from(editor.querySelectorAll('[data-deleted]'));
  let found = null;
  for (const span of allSpans) {
    const blot = Quill.find(span);
    if (!blot) continue;
    const spanIndex = quill.getIndex(blot);
    if (spanIndex === mergeStart) {
      found = span;
      break;
    }
  }
  if (found) {
    const bounds = quill.getBounds(mergeStart);
    const foundContent = found.textContent || '';
    let id =`delete_${Date.now()}`
    const data = {
      id: id, // 唯一ID
      type: 'delete',
      content: foundContent, // 结合已有内容和新删除的文本
      timestamp: Date.now(),
      userId: userInfo.value.id,
      hint: `删除：${foundContent}`, // 提示信息包含完整的删除内容
      yPosition: bounds.top, // Y轴坐标
      range: {
        index: mergeStart,
        length: mergeLen
      }
    };    
    // 同时设置 setAttribute 和 dataset
    found.setAttribute('data-deleted', JSON.stringify(data));
    found.setAttribute('id', id);
    found.dataset.deleted = JSON.stringify(data);
    
    // 触发 updateRevision 事件，传递完整的修订数组
    const revisions = extractRevisions();
    emits('updateRevision', revisions);
    
    // 触发 Yjs 更新
    try {
      const delta = quill.getContents();
      ydoc.transact(() => {
        const binding = quill.getModule("y-quill");
        if (binding) {
          binding.ytext.delete(0, binding.ytext.length);
          binding.ytext.insert(0, delta);
        }
      });
    } catch (error) {
      console.error("同步 Delta 时出错:", error);
    }
  }

  // 6. 移动光标到合并区块起点
  quill.setSelection(mergeStart, 0, 'silent');
}

async function handleAddition(op, index) {
  let content = op.insert;
  if (content === '\n' || typeof content !== 'string') return;

  const Quill = quillModule.value.default;
  const Inline = Quill.import('blots/inline');

  class NewContentBlot extends Inline {
    static create(value) {
      var id =`add_${Date.now()}`
      const node = super.create(value);

      const newContentData = {
        id: id, // 唯一ID
        type: 'add',
        content: value.content || value,
        timestamp: Date.now(),
        userId: userInfo.value.id,
        hint: `新增：${value.content || value}`,
        yPosition: null, // 初始化为 null，后续更新
        range: {
          index: value.index,
          length: value.content ? value.content.length : 0
        }
      };
      
      // 使用 setAttribute 和 dataset 同时设置
      node.setAttribute('data-new', JSON.stringify(newContentData));
      node.setAttribute('id', id);

      node.dataset.new = JSON.stringify(newContentData);
      
      node.style.color = 'red';
      node.style.textDecoration = 'none';

      return node;
    }

    static value(node) {
      try {
        return JSON.parse(
          node.getAttribute('data-new') || 
          node.dataset.new
        );
      } catch (error) {
        console.error('解析新增内容失败:', error);
        return null;
      }
    }
  }
  NewContentBlot.blotName = 'newContent';
  NewContentBlot.tagName = 's';
  Quill.register(NewContentBlot, true);

  // 获取编辑器
  const editor = quill.root;
  const allSpans = Array.from(editor.querySelectorAll('[data-new]'));
  let existingBlot = null;
  let existingContent = '';

  // 查找现有的 Blot
  for (const span of allSpans) {
    const blot = Quill.find(span);
    console.log(blot,'2222啦啦啦啦啦2222');

    if (!blot) continue;
      existingBlot = blot;
      
      // 获取现有 Blot 的内容
      const existingBlotData = JSON.parse(
        span.getAttribute('data-new') || 
        span.dataset.new
      );
      existingContent = existingBlotData.content || '';
      
      break;
    }
  

  // 如果存在现有的 Blot，先删除
  if (existingBlot) {
    const blotLength = existingBlot.length();
    quill.deleteText(index, blotLength, 'silent');
  }

  // 插入新的文本
  quill.insertText(index, content, 'silent');

  // 合并现有内容和新内容
  const mergedContent = existingContent + content;

  // 插入新的内容
  quill.formatText(index, mergedContent.length, 'newContent', {
    type: 'add',
    content: 333,
    timestamp: Date.now(),
    userId: userInfo.value.id,
    hint: `新增：${mergedContent}`,
    index: index
  });

  // 重新获取最新的新增节点
  const updatedAllSpans = Array.from(editor.querySelectorAll('[data-new]'));
  let found = null;
  for (const span of updatedAllSpans) {
    const blot = Quill.find(span);
    if (!blot) continue;
      found = span;
      break;
  }

  // 更新 Y 轴坐标
  if (found) {
    const bounds = quill.getBounds(index);
    const newContentData = JSON.parse(found.getAttribute('data-new'));
    newContentData.yPosition = bounds.top;
    
    found.setAttribute('data-new', JSON.stringify(newContentData));
    found.dataset.new = JSON.stringify(newContentData);
    
    // 触发 updateRevision 事件，传递完整的修订数组
    const revisions = extractRevisions();
    emits('updateRevision', revisions);
  }

  // 触发 Yjs 更新
  try {
    const delta = quill.getContents();
    ydoc.transact(() => {
      const binding = quill.getModule("y-quill");
      if (binding) {
        binding.ytext.delete(0, binding.ytext.length);
        binding.ytext.insert(0, delta);
      }
    });
  } catch (error) {
    console.error("同步 Delta 时出错:", error);
  }
};

const applyRevision = () => {
  console.log(3333)
  const revisions = [];
  const editor = quill.root;

  // 处理新增内容
  Array.from(editor.querySelectorAll('[data-new]')).forEach(node => {
    const value = JSON.parse(node.getAttribute('data-new'));
    revisions.push(value);
  });

  // 处理删除内容
  Array.from(editor.querySelectorAll('[data-deleted]')).forEach(node => {
    const value = JSON.parse(node.getAttribute('data-deleted'));
    revisions.push(value);
  });

  // 触发 updateRevision 事件，传递修订数组
  emits('updateRevision', revisions);
  
  setRevisionMode(false);
};

const cancelRevision = () => {
  const revisions = [];
  const editor = quill.root;

  // 处理新增内容
  Array.from(editor.querySelectorAll('[data-new]')).forEach(node => {
    const value = JSON.parse(node.getAttribute('data-new'));
    revisions.push(value);
  });

  // 处理删除内容
  Array.from(editor.querySelectorAll('[data-deleted]')).forEach(node => {
    const value = JSON.parse(node.getAttribute('data-deleted'));
    revisions.push(value);
  });

  // 恢复原始文档状态
  quill.setContents(oldDocumentState);
  
  // 触发 updateRevision 事件，传递修订数组
  emits('updateRevision', revisions);
  // 重置修订模式
  setRevisionMode(false);
};

// 在 initCollaborativeEditor 方法中添加
const extractComments = () => {
  if (!quill) return;

  // 获取编辑器的所有节点
  const editorContent = quill.root;
  const commentMarks = editorContent.querySelectorAll('[data-comment]');

  const allComments = [];

  commentMarks.forEach((mark) => {
    try {
      const commentData = JSON.parse(mark.getAttribute('data-comment'));
      
      // 打印每个评论的详细信息
      console.log('评论详情:', {
        selectionId: commentData.selectionId,
        range: commentData.range,
        selectedText: commentData.selectedText || '',
        createTime: commentData.createTime,
        color: commentData.color,
        comments: commentData.comments.map(comment => ({
          id: comment.id,
          text: comment.text,
          authorId: comment.authorId,
          nickname: comment.nickname,
          timestamp: comment.timestamp
        }))
      });

      allComments.push(commentData);
    } catch (error) {
      console.error('解析评论时出错:', error);
    }
  });

  console.log('文档中所有评论:', allComments);
  return allComments;
};

// 在初始化编辑器后调用
nextTick(() => {
  // 延迟调用，确保编辑器完全加载
  setTimeout(() => {
    extractComments();
  }, 1000);
});

// 组件挂载时初始化
onMounted(async () => {
  if (!isClient) return;

  // 先加载依赖
  await loadDependencies();
  registerDeletedContentBlot();
  registerNewContentBlot();

  // 初始化编辑器
  await initCollaborativeEditor();

  // 保存初始文档状态
  oldDocumentState = quill.getContents();
});

// 组件卸载时清理
onUnmounted(() => {
  // console.log("组件卸载，清理资源...");

  // 清理滚动监听器
  document
    .querySelector(".ql-editor")
    ?.removeEventListener("scroll", handleEditorScroll);

  // 移除键盘事件监听器
  if (quill && quill.root) {
    quill.root.removeEventListener("keydown", handleKeyboardEvent);
  }

  // 移除窗口大小变化监听器
  window.removeEventListener("resize", debouncedWindowResizeCursors);

  // 清理所有远程光标和选区
  const existingElements = document.querySelectorAll(
    ".remote-cursor, .remote-selection"
  );
  existingElements.forEach((element) => element.remove());

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
  handleApplyRevision,
  handleRejectRevision,
  insertCommentAtPosition,
  extractComments,
  setRevisionMode,
});

function handleApplyRevision(revisionData) {
  const Quill = quillModule.value.default;
  
  // 通过 id 查找节点
  const node = quill.root.querySelector(`[data-deleted][id="${revisionData.id}"], [data-new][id="${revisionData.id}"]`);
  
  if (!node) {
    console.error(`未找到 ID 为 ${revisionData.id} 的节点`);
    return;
  }

  const blot = Quill.find(node);
  if (!blot) return;
  
  const index = quill.getIndex(blot);
  const length = blot.length();

  if (node.getAttribute('data-new') !== null) {
    quill.formatText(index, length, 'newContent', false);
    quill.formatText(index, length, { color: false });
  } else if (node.getAttribute('data-deleted') !== null) {
    quill.deleteText(index, length);
  }

  // 获取完整的修订信息数组
  const revisions = extractRevisions();

  // 触发 updateRevision 事件，传递完整的修订数组
  emits('updateRevision', revisions);
}

function handleRejectRevision(revisionData) {
  const Quill = quillModule.value.default;
  
  // 通过 id 查找节点
  const node = quill.root.querySelector(`[data-deleted][id="${revisionData.id}"], [data-new][id="${revisionData.id}"]`);
  
  if (!node) {
    console.error(`未找到 ID 为 ${revisionData.id} 的节点`);
    return;
  }

  const blot = Quill.find(node);
  if (!blot) return;
  
  const index = quill.getIndex(blot);
  const length = blot.length();

  if (node.getAttribute('data-new') !== null) {
    // 对于新增内容，直接删除
    quill.deleteText(index, length, 'silent');
  } else if (node.getAttribute('data-deleted') !== null) {
    const text = revisionData.content;
    
    // 删除删除标记
    quill.deleteText(index, length, 'silent');
    
    // 插入原始文本，使用 'silent' 源以避免触发修订
    quill.insertText(index, text, { color: false }, 'silent');
  }

  // 获取完整的修订信息数组
  const revisions = extractRevisions();

  // 触发 updateRevision 事件，传递完整的修订数组
  emits('updateRevision', revisions);

  // 触发 Yjs 更新
  try {
    const delta = quill.getContents();
    ydoc.transact(() => {
      const binding = quill.getModule("y-quill");
      if (binding) {
        binding.ytext.delete(0, binding.ytext.length);
        binding.ytext.insert(0, delta);
      }
    });
  } catch (error) {
    console.error("同步 Delta 时出错:", error);
  }
}

function addRevisionButtons() {
  const editor = quill.root;
  editor.querySelectorAll('[data-new]').forEach(node => {
    createRevisionFloatingBox(node, 'add');
  });
  editor.querySelectorAll('[data-deleted]').forEach(node => {
    createRevisionFloatingBox(node, 'delete');
  });
}

function removeRevisionButtons() {
  const editor = quill.root;
  editor.querySelectorAll('.revision-apply-btn, .revision-reject-btn').forEach(btn => {
    btn.remove();
  });
}

function createRevisionFloatingBox(node, type) {
  let data;
  try {
    // 尝试多种方式获取数据
    data = JSON.parse(
      node.getAttribute(`data-${type}`) || 
      node.dataset[type] || 
      node.getAttribute('data-deleted') || 
      node.getAttribute('data-new')
    );
    
    // 详细日志
    console.log(`${type} 节点数据获取:`, {
      node: node,
      parseMethod: 'multiple attempts',
      data: data,
      attributes: Array.from(node.attributes).map(attr => ({
        name: attr.name, 
        value: attr.value
      })),
      dataset: node.dataset
    });
  } catch (error) {
    console.error('解析修订数据失败:', error, node);
    return;
  }
  
  const box = document.createElement('div');
  box.className = 'revision-floating-box';
  box.innerHTML = `
    <div class="revision-title">${type === 'add' ? '新增' : '删除'}：${data.content}</div>
    <div class="revision-meta">
      <span>修订人：${data.userId || '未知'}</span>
      <span>时间：${new Date(data.timestamp).toLocaleString()}</span>
    </div>
    <div class="revision-actions">
      <button class="revision-apply-btn">✔</button>
      <button class="revision-reject-btn">✖</button>
    </div>
  `;
  const rect = node.getBoundingClientRect();
  const editorRect = quillEditor.value.getBoundingClientRect();
  box.style.position = 'absolute';
  box.style.left = `${rect.right - editorRect.left + 10}px`;
  box.style.top = `${rect.top - editorRect.top}px`;
  box.style.zIndex = 2000;
  box.style.borderLeftColor = type === 'add' ? '#36b3f7' : '#e74c3c';

  box.querySelector('.revision-apply-btn').onclick = (e) => {
    e.stopPropagation();
    handleApplyRevision(node);
    box.remove();
    addRevisionButtons();
  };
  box.querySelector('.revision-reject-btn').onclick = (e) => {
    e.stopPropagation();
    handleRejectRevision(node);
    box.remove();
    addRevisionButtons();
  };

  quillEditor.value.appendChild(box);
}

const getTextFromDelta = (delta, index, length) => {
  let str = '';
  let curr = 0;
  delta.ops.forEach(op => {
    if (op.insert) {
      const opStr = typeof op.insert === 'string' ? op.insert : '';
      if (curr + opStr.length > index && curr < index + length) {
        const start = Math.max(0, index - curr);
        const end = Math.min(opStr.length, index + length - curr);
        str += opStr.slice(start, end);
      }
      curr += opStr.length;
    } else if (op.retain) {
      curr += op.retain;
    }
  });
  return str;
};

const extractRevisions = () => {
  if (!quill) return;

  const editorContent = quill.root;
  const newContentMarks = editorContent.querySelectorAll('[data-new]');
  const deletedContentMarks = editorContent.querySelectorAll('[data-deleted]');

  const allRevisions = [];

  // 处理新增内容
  newContentMarks.forEach((node) => {
    try {
      const revisionData = JSON.parse(
        node.getAttribute('data-new') || 
        node.dataset.new
      );
      
      // 重新获取最新的 Y 轴坐标
      const bounds = quill.getBounds(revisionData.range.index);
      revisionData.yPosition = bounds.top;
      
      allRevisions.push({
        ...revisionData,
        nodeInfo: {
          tagName: node.tagName,
          classList: Array.from(node.classList),
          attributes: Array.from(node.attributes).map(attr => ({
            name: attr.name,
            value: attr.value
          }))
        }
      });
    } catch (error) {
      console.error('解析新增内容时出错:', error);
    }
  });

  // 处理删除内容
  deletedContentMarks.forEach((node) => {
    try {
      const revisionData = JSON.parse(
        node.getAttribute('data-deleted') || 
        node.dataset.deleted
      );
      
      // 重新获取最新的 Y 轴坐标
      const bounds = quill.getBounds(revisionData.range.index);
      revisionData.yPosition = bounds.top;
      
      allRevisions.push({
        ...revisionData,
        nodeInfo: {
          tagName: node.tagName,
          classList: Array.from(node.classList),
          attributes: Array.from(node.attributes).map(attr => ({
            name: attr.name,
            value: attr.value
          }))
        }
      });
    } catch (error) {
      console.error('解析删除内容时出错:', error);
    }
  });

  // 按 Y 轴坐标排序
  allRevisions.sort((a, b) => (a.yPosition || 0) - (b.yPosition || 0));

  console.log('文档中所有修订:', allRevisions);
  return allRevisions;
};
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
    <div class="revision-controls" v-if="revisionMode">
      <button @click="applyRevision">应用修订</button>
      <button @click="cancelRevision">取消修订</button>
    </div>
  </div>
</template>

<style scoped>
.quill-container {
  position: relative;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  align-items: flex-start;
  background-color: white;
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
  border-radius: 8px;
  margin: 12px;
}

.ql-container {
  position: relative;
  border: none !important;
  font-size: 16px;
  border-radius: 8px;
  height: 100%;
  width: 100%;
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
  padding: 1px 4px;
  border-radius: 2px;
  color: white;
  font-size: 10px;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.remote-selection {
  position: absolute;
  pointer-events: none;
  transition: all 0.2s ease;
}

.remote-selection-label {
  position: absolute;
  white-space: nowrap;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
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
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.15);
}

.revision-mode {
  background-color: rgba(255, 165, 0, 0.05) !important;
  transition: background-color 0.3s ease;
}

.revision-mode .ql-editor {
  background-color: rgba(255, 165, 0, 0.05) !important;
  border: 1px dashed rgba(255, 165, 0, 0.3);
  border-radius: 8px;
}

.revision-controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
}

.revision-mode .ql-editor .ql-newContent {
  color: red !important;
}

/* 非修订模式下移除红色 */
.ql-editor .ql-newContent {
  color: inherit !important;
}

.revision-mode .ql-editor .ql-deletedContent {
  text-decoration: line-through;
  color: red;
  opacity: 1;
}

.revision-floating-box {
  min-width: 200px;
  max-width: 320px;
  background: linear-gradient(90deg, #f8fafc 80%, #e3f6fc 100%);
  border-left: 5px solid #36b3f7;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(54,179,247,0.10), 0 1.5px 4px rgba(0,0,0,0.06);
  padding: 12px 16px 12px 14px;
  font-size: 14px;
  color: #222;
  position: absolute;
  z-index: 2000;
  pointer-events: auto;
  transition: box-shadow 0.2s, border-color 0.2s;
  border-top: 1px solid #e3f6fc;
  border-bottom: 1px solid #e3f6fc;
}

.revision-floating-box:hover {
  box-shadow: 0 8px 24px rgba(54,179,247,0.18), 0 2px 8px rgba(0,0,0,0.10);
  border-left-color: #1e90ff;
}

.revision-title {
  font-weight: bold;
  margin-bottom: 6px;
  color: #1e90ff;
  letter-spacing: 1px;
}

.revision-title:before {
  content: "📝";
  margin-right: 6px;
}

.revision-meta {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 8px;
  display: flex;
  gap: 12px;
}

.revision-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.revision-apply-btn, .revision-reject-btn {
  border: none;
  background: #f0f9ff;
  border-radius: 4px;
  padding: 3px 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: bold;
  transition: background 0.2s, color 0.2s;
  box-shadow: 0 1px 2px rgba(30,144,255,0.04);
}

.revision-apply-btn {
  color: #27ae60;
  background: #eafaf1;
}
.revision-apply-btn:hover {
  background: #d4f5e6;
  color: #219150;
}

.revision-reject-btn {
  color: #e74c3c;
  background: #fff0f0;
}
.revision-reject-btn:hover {
  background: #ffeaea;
  color: #c0392b;
}

.ql-deletedContent {
  text-decoration: line-through;
  color: red;
  opacity: 1;
}
</style>
