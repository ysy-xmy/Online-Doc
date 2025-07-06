<template>
  <div class="modal modal-open">
    <div class="modal-box w-11/12 max-w-4xl">
      <div class="flex items-start justify-between mb-6">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-3xl">{{ getCategoryIcon(template.category) }}</span>
            <h3 class="font-bold text-2xl">{{ template.name }}</h3>
            <div class="badge" :class="getCategoryBadgeClass(template.category)">
              {{ getCategoryName(template.category) }}
            </div>
            <div v-if="template.isPublic" class="badge badge-success">公开</div>
          </div>
          
          <p v-if="template.description" class="text-base-content/70 mb-4">
            {{ template.description }}
          </p>
          
          <div class="flex items-center gap-4 text-sm text-base-content/60 mb-4">
            <div class="flex items-center gap-2">
              <div class="avatar avatar-xs">
                <div class="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs">
                  {{ template.creator.nickname?.[0] || template.creator.username[0] }}
                </div>
              </div>
              <span>{{ template.creator.nickname || template.creator.username }}</span>
            </div>
            <span>使用 {{ template.usageCount }} 次</span>
            <span>{{ formatDate(template.updatedAt) }}</span>
          </div>
          
          <div v-if="template.tags.length > 0" class="flex flex-wrap gap-2 mb-6">
            <span
              v-for="tag in template.tags"
              :key="tag"
              class="badge badge-outline badge-sm"
            >
              {{ tag }}
            </span>
          </div>
        </div>
        
        <button
          class="btn btn-sm btn-circle btn-ghost"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>
      
      <div class="divider">模板预览</div>
      
      <div class="border border-base-300 rounded-lg p-4 bg-base-50 max-h-96 overflow-y-auto mb-6">
        <div v-html="template.content" class="prose max-w-none"></div>
      </div>
      
      <div class="modal-action">
        <button
          class="btn btn-ghost"
          @click="$emit('close')"
        >
          关闭
        </button>
        <button
          class="btn btn-primary"
          @click="$emit('use', template)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5 mr-2">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          使用此模板
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="$emit('close')"></div>
  </div>
</template>

<script setup lang="ts">
import type { TemplateDTO } from '~/api/template'

interface Props {
  template: TemplateDTO
}

defineProps<Props>()
defineEmits(['close', 'use'])

const getCategoryIcon = (category: string) => {
  const icons = {
    MEETING: '📝',
    PROJECT: '📋',
    REPORT: '📊',
    KNOWLEDGE: '📚',
    OTHER: '📄'
  }
  return icons[category as keyof typeof icons] || '📄'
}

const getCategoryName = (category: string) => {
  const names = {
    MEETING: '会议记录',
    PROJECT: '项目文档',
    REPORT: '报告总结',
    KNOWLEDGE: '知识文档',
    OTHER: '其他'
  }
  return names[category as keyof typeof names] || '其他'
}

const getCategoryBadgeClass = (category: string) => {
  const classes = {
    MEETING: 'badge-info',
    PROJECT: 'badge-warning',
    REPORT: 'badge-success',
    KNOWLEDGE: 'badge-primary',
    OTHER: 'badge-ghost'
  }
  return classes[category as keyof typeof classes] || 'badge-ghost'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '今天'
  if (diffDays === 2) return '昨天'
  if (diffDays <= 7) return `${diffDays}天前`
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}周前`
  if (diffDays <= 365) return `${Math.ceil(diffDays / 30)}月前`
  return `${Math.ceil(diffDays / 365)}年前`
}
</script>

<style>
.prose {
  max-width: none;
}

.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.prose p {
  margin-bottom: 1em;
}

.prose ul, .prose ol {
  margin-bottom: 1em;
  padding-left: 1.5em;
}

.prose blockquote {
  border-left: 4px solid #e5e7eb;
  padding-left: 1em;
  margin: 1em 0;
  font-style: italic;
}

.prose code {
  background-color: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 0.25em;
  font-size: 0.875em;
}

.prose pre {
  background-color: #f3f4f6;
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
}
</style>
