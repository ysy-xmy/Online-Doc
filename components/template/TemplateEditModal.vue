<template>
  <div class="modal modal-open">
    <div class="modal-box w-11/12 max-w-4xl">
      <h3 class="font-bold text-lg mb-4">编辑模板</h3>
      
      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">模板名称 <span class="text-error">*</span></span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="请输入模板名称"
              class="input input-bordered"
              :class="{ 'input-error': errors.name }"
              required
            />
            <label v-if="errors.name" class="label">
              <span class="label-text-alt text-error">{{ errors.name }}</span>
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">分类 <span class="text-error">*</span></span>
            </label>
            <select
              v-model="form.category"
              class="select select-bordered"
              :class="{ 'select-error': errors.category }"
              required
            >
              <option value="">请选择分类</option>
              <option v-for="category in categories" :key="category.key" :value="category.key">
                {{ category.icon }} {{ category.name }}
              </option>
            </select>
            <label v-if="errors.category" class="label">
              <span class="label-text-alt text-error">{{ errors.category }}</span>
            </label>
          </div>
        </div>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">描述</span>
          </label>
          <textarea
            v-model="form.description"
            class="textarea textarea-bordered"
            placeholder="请输入模板描述"
            rows="3"
          ></textarea>
        </div>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">标签</span>
          </label>
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="(tag, index) in form.tags"
              :key="index"
              class="badge badge-outline gap-2"
            >
              {{ tag }}
              <button
                type="button"
                class="btn btn-xs btn-circle btn-ghost"
                @click="removeTag(index)"
              >
                ×
              </button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="newTag"
              type="text"
              placeholder="输入标签后按回车添加"
              class="input input-bordered flex-1"
              @keyup.enter="addTag"
            />
            <button
              type="button"
              class="btn btn-outline"
              @click="addTag"
              :disabled="!newTag.trim()"
            >
              添加
            </button>
          </div>
        </div>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">模板内容 <span class="text-error">*</span></span>
          </label>
          <div class="border border-base-300 rounded-lg">
            <div ref="editorContainer" class="min-h-[300px]"></div>
          </div>
          <label v-if="errors.content" class="label">
            <span class="label-text-alt text-error">{{ errors.content }}</span>
          </label>
        </div>

        <div class="form-control mb-6">
          <label class="label cursor-pointer justify-start">
            <input
              v-model="form.isPublic"
              type="checkbox"
              class="checkbox checkbox-primary mr-2"
            />
            <span class="label-text">设为公开模板（其他用户可以使用）</span>
          </label>
        </div>

        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            @click="$emit('close')"
            :disabled="loading"
          >
            取消
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="loading"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            {{ loading ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </form>
    </div>
    <div class="modal-backdrop" @click="$emit('close')"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTemplateStore } from '~/stores/template'
import type { TemplateDTO, TemplateUpdateRequest } from '~/api/template'

interface Props {
  template: TemplateDTO
}

const props = defineProps<Props>()
const templateStore = useTemplateStore()

const emit = defineEmits(['close', 'updated'])

const form = ref<TemplateUpdateRequest>({
  name: props.template.name,
  description: props.template.description || '',
  content: props.template.content,
  contentJson: props.template.contentJson,
  category: props.template.category,
  tags: [...props.template.tags],
  isPublic: props.template.isPublic
})

const newTag = ref('')
const loading = ref(false)
const errors = ref<Record<string, string>>({})
const editorContainer = ref<HTMLElement>()
let quillEditor: any = null

const categories = [
  { key: 'MEETING', name: '会议记录', icon: '📝' },
  { key: 'PROJECT', name: '项目文档', icon: '📋' },
  { key: 'REPORT', name: '报告总结', icon: '📊' },
  { key: 'KNOWLEDGE', name: '知识文档', icon: '📚' },
  { key: 'OTHER', name: '其他', icon: '📄' }
]

onMounted(async () => {
  await initEditor()
})

onUnmounted(() => {
  if (quillEditor) {
    quillEditor = null
  }
})

const initEditor = async () => {
  if (typeof window === 'undefined') return
  
  try {
    const Quill = (await import('quill')).default
    
    if (editorContainer.value) {
      quillEditor = new Quill(editorContainer.value, {
        theme: 'snow',
        placeholder: '请输入模板内容...',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['link', 'blockquote', 'code-block'],
            [{ 'align': [] }],
            ['clean']
          ]
        }
      })
      
      if (props.template.contentJson) {
        try {
          const delta = JSON.parse(props.template.contentJson)
          quillEditor.setContents(delta)
        } catch (error) {
          quillEditor.root.innerHTML = props.template.content
        }
      } else {
        quillEditor.root.innerHTML = props.template.content
      }
    }
  } catch (error) {
    console.error('初始化编辑器失败:', error)
  }
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !form.value.tags!.includes(tag)) {
    form.value.tags!.push(tag)
    newTag.value = ''
  }
}

const removeTag = (index: number) => {
  form.value.tags!.splice(index, 1)
}

const validateForm = () => {
  errors.value = {}
  
  if (!form.value.name?.trim()) {
    errors.value.name = '请输入模板名称'
  }
  
  if (!form.value.category) {
    errors.value.category = '请选择分类'
  }
  
  if (quillEditor) {
    const content = quillEditor.getText().trim()
    if (!content) {
      errors.value.content = '请输入模板内容'
    } else {
      form.value.content = quillEditor.root.innerHTML
      form.value.contentJson = JSON.stringify(quillEditor.getContents())
    }
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    loading.value = true
    const template = await templateStore.updateTemplate(props.template.id, form.value)
    emit('updated', template)
  } catch (error) {
    console.error('更新模板失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style>
.ql-editor {
  min-height: 300px;
}
</style>
