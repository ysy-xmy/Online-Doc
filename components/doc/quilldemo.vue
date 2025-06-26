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
      </div>
    </div>
    <div ref="quillEditor" class="editor"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useNuxtApp } from '#app'

const quillEditor = ref(null)
const floatingToolbar = ref(null)
let quill = ref(null)

onMounted(async () => {
  // 动态导入，确保仅在客户端执行
  const { default: Quill } = await import('quill')
  const { default: QuillCursors } = await import('quill-cursors')
  
  // 注册光标模块
  Quill.register('modules/cursors', QuillCursors)

  // 确保 DOM 已经准备好
  if (quillEditor.value) {
    quill.value = new Quill(quillEditor.value, {
      modules: {
        cursors: true,
        toolbar: '#toolbar', // 指定工具栏
        history: {
          userOnly: true
        }
      },
      placeholder: '开始输入您的文本...',
      theme: 'snow'
    })

    // 添加选区变化监听
    quill.value.on('selection-change', handleSelectionChange)
  }
})

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
  if (!quill.value || !floatingToolbar.value) return;

  try {
    const bounds = quill.value.getBounds(range.index, range.length);
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
</script>

<style scoped>
.quill-container {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
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
  height: 100%;
  outline: none !important;
}

.ql-container {
  border: none !important;
  font-size: 16px;
}

.ql-editor {
  padding: 0 !important;
  height: 100%;
}

.ql-snow.ql-toolbar {
  border: none !important;
  padding: 0 !important;
}
</style>