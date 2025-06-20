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

<script setup>
import {ref, onMounted, onUnmounted, nextTick} from "vue";
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
      toolbar: '#toolbar', // 指定工具栏
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
    const selection = quill.getSelection();
    console.log(selection, "1");

    const yjsContent = ytext.toDelta();
    const currentContent = quill.getContents();

    if (JSON.stringify(currentContent.ops) !== JSON.stringify(yjsContent)) {
      console.log("当前文本内容：" + JSON.stringify(currentContent));
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
    const users = Array.from(allStates.entries()).map(([clientID, state]) => ({
      clientID,
      user: state.user,
      cursorPosition: state.user?.cursorPosition,
      cursorLength: state.user?.cursorLength,
    }));

    console.log("当前用户列表:", users);

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
};

// 处理选区变化
const handleSelectionChange = (range) => {
  if (!range) return;

  nextTick(() => {
    const toolbar = floatingToolbar.value;
    if (!toolbar) return;

    if (range.length > 0) {
      // 有选中内容时显示工具栏
      toolbar.classList.add('active');
      positionToolbar(range);
    } else {
      // 没有选中内容时隐藏工具栏
      toolbar.classList.remove('active');
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

    let left = bounds.left + (bounds.width / 2) - (toolbarWidth / 2);
    let top = bounds.top - toolbarHeight - 10;

    const editorRect = quillEditor.value.getBoundingClientRect();
    left = Math.max(0, Math.min(left, editorRect.width - toolbarWidth));

    if (top < 0) {
      top = bounds.bottom + 10;
    }

    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
  } catch (error) {
    console.error('定位工具栏时出错:', error);
  }
};

// 设置内容
const setContent = (content) => {
  if (!quill || !content) return;

  try {
    // 停止Yjs监听，防止无限循环
    if (ytext) {
      ytext.unobserve(ytextObserver);
    }
    let processedContent = content.toString().trim();
    const newlineIndex = processedContent.indexOf('\n');
    if (newlineIndex !== -1) {
      processedContent = processedContent.substring(0, newlineIndex);
    }

    // 清除编辑器现有内容
    quill.setContents([{ insert: '\n' }]);

    // 插入新内容
    quill.insertText(0, processedContent);

    // 如果Yjs存在，同步内容
    if (ytext) {
      // 获取当前内容并转换为Delta格式
      const delta = quill.getContents();
      // 清除Yjs现有内容
      ytext.delete(0, ytext.length);
      // 插入新内容
      ytext.applyDelta(delta.ops);

      // 重新注册Yjs监听
      ytext.observe(ytextObserver);
    }

    console.log('内容已成功设置:', processedContent);
  } catch (error) {
    console.error('设置内容失败:', error);

    // 重新注册Yjs监听，即使发生错误
    if (ytext) {
      ytext.observe(ytextObserver);
    }
  }
};

// 创建Yjs文本变更观察者的引用
const ytextObserver = (event) => {
  const selection = quill.getSelection();
  console.log(selection, "1");

  const yjsContent = ytext.toDelta();
  const currentContent = quill.getContents();

  if (JSON.stringify(currentContent.ops) !== JSON.stringify(yjsContent)) {
    console.log("当前文本内容：" + JSON.stringify(currentContent));
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
  }
};

const emits = defineEmits(['editor-mounted']);

const getCurrentContent = () => {
  if (quill) {
    return quill.getContents();
  }
  return null;
};

// 组件挂载时初始化
onMounted(async () => {
  if (!isClient) return;

  // 先加载依赖
  await loadDependencies();

  // 初始化编辑器
  await initCollaborativeEditor();

  // 暴露方法给父组件
  emits('editor-mounted', {
    getCurrentContent,
    setContent
  });
});

// 组件卸载时清理
onUnmounted(() => {
  if (ytext) {
    ytext.unobserve(ytextObserver);
  }
  provider?.disconnect();
  ydoc?.destroy();
});
</script>

<style scoped>
.quill-container {
  position: relative;
  width: 100%;
  max-width: 900px;
  margin: 0 auto auto 0;
  flex: 1;
  padding: 100px 0 100px 100px;
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
  min-height: 300px;
  max-height: none;
  outline: none !important;
}

.ql-container {
  border: none !important;
  font-size: 16px;
}

.ql-editor {
  padding: 0 !important;
  min-height: 300px;
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
