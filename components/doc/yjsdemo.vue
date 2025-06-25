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
import {ref, onMounted, onUnmounted, nextTick, watch, computed} from "vue";
import { documentApi, documentOperationsApi } from '../../api/doc/index.js';
// 响应式变量
const quillEditor = ref(null);
const floatingToolbar = ref(null);
const isClient = process.client;
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

// 编辑状态跟踪
let userSelectionRange = null;
let quill = null;
let ydoc = null;
let ytext = null;
let provider = null;
let awareness = null;
let contentOutputInterval = null; // 定时器变量
let lastSavedContent = null; // 保存的最后内容
let isSaving = false; // 保存状态标志
let editSessionStart = null; // 编辑会话开始时间
let userEditCount = 0; // 用户编辑次数计数
let lastChangeTime = null; // 最后变更时间
let editTimer = null; // 编辑计时定时器

// 保存策略配置
const SAVE_THRESHOLD = 3; // 编辑次数阈值
const TIME_THRESHOLD = 15000; // 时间阈值(15秒，便于测试)

// 异步加载依赖
const loadDependencies = async () => {
  if (!isClient) return;

  try {
    quillModule.value = await import("quill");
    yjsModule.value = await import("yjs");
    quillBindingModule.value = await import("y-quill");
    websocketModule.value = await import("y-websocket");
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
/**
 * const saveDocument = debounce(async (force = false) => {
 *   if (!isClient || !quill || isSaving) return;
 *
 *   isSaving = true;
 *   try {
 *     const currentEditCount = userEditCount;
 *
 *     // 检查是否满足保存条件：编辑次数达到阈值或强制保存
 *     const shouldSave = force || currentEditCount >= SAVE_THRESHOLD;
 *
 *     if (shouldSave) {
 *       // 获取当前文档内容
 *       const currentContent = quill.getContents();
 *       // 提取纯文本内容
 *       const plainText = currentContent.ops.reduce((text, op) => {
 *         if (typeof op.insert === 'string') {
 *           return text + op.insert;
 *         }
 *         return text;
 *       }, '');
 *
 *       console.log(`保存文档内容到数据库: 编辑次数 ${currentEditCount}`);
 *       console.log(`保存的文档内容: ${plainText}`);
 *       console.log(`完整内容数据:`, currentContent);
 *
 *       // 保存完整内容
 *       lastSavedContent = JSON.stringify(currentContent);
 *
 *       // 保存后重置编辑计数
 *       userEditCount = 0;
 *       lastChangeTime = Date.now();
 *     } else {
 *       console.log(`编辑次数不足(${currentEditCount})，跳过保存`);
 *     }
 *   } catch (error) {
 *     console.error('保存文档时出错:', error);
 *   } finally {
 *     isSaving = false;
 *   }
 * }, 500); // 防抖延迟500ms
 */
// 从URL路径中提取文档ID
const getDocumentIdFromUrl = () => {
  const pathSegments = window.location.pathname.split('/');
  return pathSegments[pathSegments.length - 1];
};
// 保存文档内容
const saveDocument = debounce(async (force = false) => {
  if (!isClient || !quill || isSaving) return;

  isSaving = true;
  try {
    const currentEditCount = userEditCount;
    const shouldSave = force || currentEditCount >= SAVE_THRESHOLD;

    if (shouldSave) {
      // 获取当前文档内容
      const currentContent = quill.getContents();
      const plainText = currentContent.ops.reduce((text, op) => {
        if (typeof op.insert === 'string') {
          return text + op.insert;
        }
        return text;
      }, '');

      console.log(`保存文档内容: 编辑次数 ${currentEditCount}`);

      // 1. 保存文档最新内容
      const changeset = JSON.stringify(currentContent);
      try {
        // 更新文档内容
        const updateResponse = await documentApi.updateDocument(changeset);
        console.log('文档内容更新成功:', updateResponse);

        if (updateResponse.success) {
          lastSavedContent = changeset;
          userEditCount = 0;
          lastChangeTime = Date.now();

          // 2. 记录操作历史
          await recordDocumentOperation({
            operation: 'update',
            content: plainText,
            date: new Date().toISOString(),
            description: `文档更新 - 版本${updateResponse.revisionHistory?.length || 1}`
          });
        }
      } catch (apiError) {
        console.error('保存失败:', apiError);
      }
    }
  } catch (error) {
    console.error('保存文档时出错:', error);
  } finally {
    isSaving = false;
  }
}, 500);

// 记录文档操作历史
const recordDocumentOperation = async (operationData) => {
  try {
    const documentId = getDocumentIdFromUrl();
    if (!documentId) return;

    // 使用 documentOperationsApi 记录操作
    const response = await documentOperationsApi.recordDocumentOperation(
        documentId,
        operationData
    );

    if (response.code === 200) {
      console.log('操作历史记录成功');
      // 刷新历史记录列表
      fetchHistory();
    }
  } catch (error) {
    console.error('记录操作历史失败:', error);
  }
};

// 检查是否需要强制保存(基于时间)
const checkTimeBasedSave = () => {
  if (!lastChangeTime || !isClient || !quill) return;

  const elapsedTime = Date.now() - lastChangeTime;
  if (elapsedTime >= TIME_THRESHOLD) {
    console.log(`编辑时间超过${TIME_THRESHOLD/1000}秒，强制保存`);
    saveDocument(true);
  }
};

// 设置定时保存和时间检查
const setupAutoSave = () => {
  if (contentOutputInterval) {
    clearInterval(contentOutputInterval);
  }

  // 每5秒检查一次
  contentOutputInterval = setInterval(() => {
    checkTimeBasedSave();
  }, 5000);
};

// 开始编辑会话计时
const startEditTimer = () => {
  if (editTimer) clearInterval(editTimer);

  editSessionStart = Date.now();
  editTimer = setInterval(() => {
    const elapsed = Date.now() - editSessionStart;
    console.log(`编辑时长: ${elapsed/1000}秒`);
  }, 1000);
};

// 停止编辑会话计时
const stopEditTimer = () => {
  if (editTimer) {
    clearInterval(editTimer);
    editTimer = null;
  }
  editSessionStart = null;
};

// 渲染远程光标的函数
const renderRemoteCursors = () => {
  if (!isClient || !quill || !websocketModule.value) return;

  const existingCursors = document.querySelectorAll(".remote-cursor");
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

  if (
      !quillModule.value ||
      !yjsModule.value ||
      !quillBindingModule.value ||
      !websocketModule.value
  ) {
    console.error("依赖未完全加载");
    return;
  }

  quill = new quillModule.value.default(quillEditor.value, {
    theme: "snow",
    modules: {
      toolbar: '#toolbar',
      history: {
        delay: 1000,
        maxStack: 500,
        userOnly: true,
      },
    },
    placeholder: "开始协同编辑...",
  });

  ydoc = new yjsModule.value.Doc({
    gc: true,
    gcFilter: (item) => !item.deleted,
  });

  ytext = ydoc.getText("text");

  provider = new websocketModule.value.WebsocketProvider(
      "ws://8.134.200.53:1234",
      "my-roomname",
      ydoc,
      {
        reconnect: true,
        reconnectTimeout: 1000,
        maxBackoff: 30000,
        params: {
          username: `用户_${Math.random().toString(36).substr(2, 9)}`,
        },
      }
  );

  ytext.observe((event) => {
    const selection = quill.getSelection();
    const yjsContent = ytext.toDelta();
    const currentContent = quill.getContents();

    if (JSON.stringify(currentContent.ops) !== JSON.stringify(yjsContent)) {
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
    new quillBindingModule.value.QuillBinding(
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

  awareness = provider.awareness;

  quill.on("text-change", (delta, oldDelta, source) => {
    if (source === 'user') {
      // 用户每进行一次编辑，计数加1
      userEditCount++;
      console.log(`✏️ 用户编辑次数: ${userEditCount}`);

      lastChangeTime = Date.now();
      startEditTimer();
      saveDocument();
    }
  });

  quill.on("selection-change", (range, oldRange, source) => {
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
      handleSelectionChange(range);

      if (range.length > 0) {
        userSelectionRange = range;
        quill.formatText(
            range.index,
            range.length,
            "background",
            localUser.value.color
        );
      } else {
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

  awareness.on("change", (changes) => {
    const allStates = awareness.getStates();
  });

  provider.on("sync", (isSynced) => {
    console.log("🌐 同步状态:", isSynced ? "已同步" : "未同步");
  });

  // 初始化自动保存定时器
  setupAutoSave();
};

// 处理选区变化
const handleSelectionChange = (range) => {
  if (!range) return;

  nextTick(() => {
    const toolbar = floatingToolbar.value;
    if (!toolbar) return;

    if (range.length > 0) {
      toolbar.classList.add('active');
      positionToolbar(range);
    } else {
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
    if (ytext) {
      ytext.unobserve(ytextObserver);
    }

    quill.setContents([{ insert: content }]);

    if (ytext) {
      const delta = quill.getContents();
      ytext.delete(0, ytext.length);
      ytext.applyDelta(delta.ops);
      ytext.observe(ytextObserver);
    }

    // 设置内容后更新最后保存的内容和重置计数
    lastSavedContent = JSON.stringify(quill.getContents());
    userEditCount = 0;
    lastChangeTime = Date.now();
  } catch (error) {
    console.error('设置内容失败:', error);
    if (ytext) {
      ytext.observe(ytextObserver);
    }
  }
};

// Yjs文本变更观察者
const ytextObserver = (event) => {
  const selection = quill.getSelection();
  const yjsContent = ytext.toDelta();
  const currentContent = quill.getContents();

  if (JSON.stringify(currentContent.ops) !== JSON.stringify(yjsContent)) {
    // 禁用事件监听，防止循环更新
    quill.off('text-change');

    // 应用Yjs内容到Quill
    quill.setContents(yjsContent);

    // 恢复事件监听
    quill.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        userEditCount++;
        lastChangeTime = Date.now();
        startEditTimer();
        saveDocument();
      }
    });

    // 恢复选择位置
    if (selection) {
      quill.setSelection(selection.index, selection.length, 'silent');
    }

    // 更新最后保存的内容
    lastSavedContent = JSON.stringify(yjsContent);
  }

  renderRemoteCursors();
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

  await loadDependencies();
  await initCollaborativeEditor();

  emits('editor-mounted', {
    getCurrentContent,
    setContent
  });
});

// 组件卸载时清理
onUnmounted(() => {
  // 清除定时器
  if (contentOutputInterval) {
    clearInterval(contentOutputInterval);
  }

  if (editTimer) {
    clearInterval(editTimer);
  }


  if (ytext) {
    ytext.unobserve(ytextObserver);
  }
  provider?.disconnect();
  ydoc?.destroy();
  stopEditTimer();
});
</script>

<style scoped>
/* 样式保持不变 */
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
