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
const emits = defineEmits(["openCommentPanel"]);
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
      if (
        user.cursorPosition !== undefined &&
        user.cursorPosition !== null
      ) {
        let bounds;
        try {
          bounds = quill.getBounds(user.cursorPosition);
        } catch (boundsError) {
          console.warn("获取光标边界失败:", boundsError);
          return;
        }

        if (
          !bounds ||
          bounds.left === undefined ||
          bounds.top === undefined
        ) {
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
      if (
        selection &&
        selection.index !== undefined &&
        selection.length > 0
      ) {
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
        selectionElement.style.backgroundColor = `${user.color || "blue"
          }20`; // 半透明背景
        selectionElement.style.border = `2px solid ${user.color || "blue"
          }`;
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
      const clientID = selectionElement.classList.contains(
        "remote-selection-"
      )
        ? selectionElement.className.match(
          /remote-selection-(\d+)/
        )?.[1]
        : null;

      if (clientID) {
        const allStates = awareness.getStates();
        const state = allStates.get(parseInt(clientID));

        if (
          !state ||
          !state.selection ||
          state.selection.length === 0
        ) {
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

  // 暂时移除自定义 Blot 注册，使用简单的背景色标记
  // 注册自定义 Blot 用于处理评论标记
  const Quill = quillModule.value.default;

  // 创建一个简单的 Inline 格式而不是 Embed
  const Inline = Quill.import("blots/inline");

  class CommentFormat extends Inline {
    static create(value) {
      const node = super.create();
      if (typeof value === "object" && value) {
        node.setAttribute("data-comment", JSON.stringify(value));
        node.setAttribute(
          "data-selection-id",
          value.selectionId || Date.now()
        );
        node.style.backgroundColor = `${value.color || "#e3f2fd"}40`;
        node.style.borderBottom = `2px solid ${value.color || "#2196f3"
          }`;
        node.style.cursor = "pointer";
      }
      return node;
    }

    static value(node) {
      try {
        const commentData = node.getAttribute("data-comment");
        return commentData ? JSON.parse(commentData) : null;
      } catch (error) {
        console.error("解析评论数据时出错:", error);
        return null;
      }
    }
  }

  CommentFormat.blotName = "comment-format";
  CommentFormat.tagName = "span";

  Quill.register(CommentFormat);

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
    // 支持的格式
    formats: [
      "header",
      "font",
      "size",
      "bold",
      "italic",
      "underline",
      "strike",
      "color",
      "background",
      "script",
      "blockquote",
      "code-block",
      "list",
      "bullet",
      "indent",
      "link",
      "image",
      "video",
      "align",
      "direction",
      "clean",
      "comment-format",
    ],
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
      color:
        userInfo.value.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
      timestamp: Date.now(),
      cursorPosition: null,
      cursorLength: 0,
    });
  }

  // 文本变化监听
  quill.on("text-change", (delta, oldDelta, source) => {
    // 检测删除操作
    const hasDeleteOperation = delta.ops.some(
      (op) => op.delete !== undefined
    );

    if (hasDeleteOperation) {
      console.log("检测到文本删除操作，清除远程选区");
      // 清除所有远程选区
      const existingSelections =
        document.querySelectorAll(".remote-selection");
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
    const users = Array.from(allStates.entries()).map(
      ([clientID, state]) => ({
        clientID,
        user: state.user,
        cursorPosition: state.user?.cursorPosition,
        cursorLength: state.user?.cursorLength,
      })
    );

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
        id:
          localUser.value.id ||
          Math.random().toString(36).substr(2, 9),
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
        if (
          message.type === "roomInfo" ||
          message.type === "roomStatus"
        ) {
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
        color:
          newUserInfo.color ||
          `hsl(${Math.random() * 360}, 70%, 50%)`,
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
      quill.root.addEventListener("keydown", (event) => {
        if (props.isReadOnly) {
          // 允许复制(Ctrl+C/Cmd+C)、粘贴(Ctrl+V/Cmd+V)、选择全文档(Ctrl+A/Cmd+A)
          if (
            (event.ctrlKey || event.metaKey) &&
            (event.key === "c" ||
              event.key === "v" ||
              event.key === "a")
          ) {
            return; // 不阻止快捷键
          }
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        handleKeyboardEvent(event);
      });
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
const handleKeyboardEvent = (event) => {
  const toolbar = floatingToolbar.value;
  if (!toolbar) return;

  // 如果按下删除键（Backspace 或 Delete）
  if (event.key === "Backspace" || event.key === "Delete") {
    toolbar.classList.remove("active");
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

  // 使用 formatText 而不是 insertEmbed
  quill.formatText(
    selection.index,
    selection.length,
    "comment-format",
    commentData
  );

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

  // 使用 formatText 重新应用格式
  quill.formatText(index, length, "comment-format", updatedCommentData);

  // 显式触发 Yjs 更新
  try {
    ydoc.transact(() => {
      const binding = quill.getModule("y-quill");
      if (binding) {
        binding.ytext.delete(0, binding.ytext.length);
        binding.ytext.insert(0, quill.root.innerHTML);
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

// 在 initCollaborativeEditor 方法中添加
const extractComments = () => {
  if (!quill) return;

  // 获取编辑器的所有节点
  const editorContent = quill.root;
  const commentMarks = editorContent.querySelectorAll("[data-comment]");

  const allComments = [];

  commentMarks.forEach((mark) => {
    try {
      const commentData = JSON.parse(mark.getAttribute("data-comment"));

      // 打印每个评论的详细信息
      console.log("评论详情:", {
        selectionId: commentData.selectionId,
        range: commentData.range,
        selectedText: commentData.selectedText || "",
        createTime: commentData.createTime,
        color: commentData.color,
        comments: commentData.comments.map((comment) => ({
          id: comment.id,
          text: comment.text,
          authorId: comment.authorId,
          nickname: comment.nickname,
          timestamp: comment.timestamp
        }))
      });

      allComments.push(commentData);
    } catch (error) {
      console.error("解析评论时出错:", error);
    }
  });

  console.log("文档中所有评论:", allComments);
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
  insertCommentAtPosition,
  extractComments,
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
          <button class="ql-comment-icon" @click="addComment">
            💬
          </button>
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
</style>
