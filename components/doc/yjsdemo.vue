<script setup>
import { ref, onMounted, onUnmounted } from "vue";
// 响应式变量
const quillEditor = ref(null);
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

const debouncedRenderRemoteCursors = debounce(renderRemoteCursors, 500);

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
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
      ],
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
  provider = new websocketModule.value.WebsocketProvider(
    "ws://8.134.200.53:1234",
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
    // // 保存当前光标位置
    const selection = quill.getSelection();
    console.log(selection, "1");
    // // // 将 Yjs 文本转换为 Quill Delta

    const yjsContent = ytext.toDelta();
    const currentContent = quill.getContents();

    if (JSON.stringify(currentContent.ops) !== JSON.stringify(yjsContent)) {
      console.log("检测到不一致，同步内容");

      const updatedUser = {
        ...localUser.value,
        cursorPosition: selection?.index,
        cursorLength: selection?.length,
      };
      // console.log(updatedUser,'2')
      // awareness.setLocalStateField("user", updatedUser);

      renderRemoteCursors();

      if (selection) {
        quill.setSelection(selection.index, selection.length, "silent");
      }
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

  // // Awareness 变化监听
  awareness.on("change", (changes) => {
    // console.log("Awareness 变化:", changes);
    // debouncedRenderRemoteCursors();
    const allStates = awareness.getStates();

    // 详细打印所有用户状态和光标位置
    const users = Array.from(allStates.entries()).map(([clientID, state]) => ({
      clientID,
      user: state.user,
      cursorPosition: state.user?.cursorPosition,
      cursorLength: state.user?.cursorLength,
    }));

    console.log("当前用户列表:", users);

    // 可视化用户光标（这里是简单的控制台输出，实际应用可能需要更复杂的 UI 实现）
    users.forEach((user) => {
      if (user.cursorPosition !== undefined) {
        console.log(
          `用户 ${user.user.name} 的光标位置：${user.cursorPosition}`
        );
      }
    });
  });

  // 同步状态监听
  provider.on("sync", (isSynced) => {
    console.log("🌐 同步状态:", isSynced ? "已同步" : "未同步");
  });
  // awareness.setLocalStateField("user", localUser.value);
};

// 组件挂载时初始化
onMounted(async () => {
  if (!isClient) return;

  // 先加载依赖
  await loadDependencies();

  // 初始化编辑器
  await initCollaborativeEditor();

  // const performanceInterval = setInterval(performanceMonitor, 5000)

  // 组件卸载时清理
  onUnmounted(() => {
    clearInterval(performanceInterval);
    provider?.disconnect();
    ydoc?.destroy();
  });
});
</script>

<template>
  <div class="collaborative-editor">
    <div ref="quillEditor" class="editor"></div>
  </div>
</template>

<style scoped>
.editor {
  height: 400px;
  max-width: 800px;
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
