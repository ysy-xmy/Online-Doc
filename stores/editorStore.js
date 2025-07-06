// 新添加：stores/editorStore.js
import { defineStore } from 'pinia';

export const useEditorStore = defineStore('editor', {
    state: () => ({
        editorContent: null,
        documentTitle: '未命名文档',
        currentVersion: 1,
        isSaving: false,
        saveError: null,
        // 版本描述信息
        versionDescription: ''
    }),
    actions: {
        // 设置文档内容
        setEditorContent(content) {
            this.editorContent = content;
        },
        // 设置文档标题
        setDocumentTitle(title) {
            this.documentTitle = title;
        },
        // 设置版本描述
        setVersionDescription(description) {
            this.versionDescription = description;
        },
        // 递增版本号
        incrementVersion() {
            this.currentVersion++;
        },
        // 设置保存状态
        setSavingState(isSaving) {
            this.isSaving = isSaving;
        },
        // 设置保存错误
        setSaveError(error) {
            this.saveError = error;
        }
    }
});