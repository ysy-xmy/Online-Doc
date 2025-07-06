<template>
  <div
    class="card card-bordered bg-base-100 hover:bg-base-200 hover:shadow-lg transition-all group border-2 border-base-200 shadow-sm relative cursor-pointer"
    @click="$emit('click', template)"
  >
    <div v-if="showActions" class="absolute right-4 top-4 z-10">
      <div class="dropdown dropdown-end">
        <button
          tabindex="0"
          class="btn btn-xs btn-circle bg-gray-200 hover:bg-gray-300 text-gray-500 border-none transition-colors opacity-0 group-hover:opacity-100"
          @click.stop
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        </button>
        <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32">
          <li><a @click.stop="$emit('edit', template)">编辑</a></li>
          <li><a @click.stop="$emit('delete', template)" class="text-error">删除</a></li>
        </ul>
      </div>
    </div>

    <div class="card-body">
      <div class="flex items-start justify-between mb-3">
        <div class="text-2xl">{{ getCategoryIcon(template.category) }}</div>
        <div class="flex items-center space-x-2">
          <div class="badge badge-sm" :class="getCategoryBadgeClass(template.category)">
            {{ getCategoryName(template.category) }}
          </div>
          <div v-if="template.isPublic" class="badge badge-success badge-sm">公开</div>
        </div>
      </div>

      <h2 class="card-title text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
        {{ template.name }}
      </h2>

      <p class="text-sm opacity-70 mb-4 line-clamp-2">
        {{ template.description || '暂无描述' }}
      </p>

      <div v-if="template.tags.length > 0" class="flex flex-wrap gap-1 mb-3">
        <span
          v-for="tag in template.tags.slice(0, 3)"
          :key="tag"
          class="badge badge-outline badge-xs"
        >
          {{ tag }}
        </span>
        <span v-if="template.tags.length > 3" class="badge badge-ghost badge-xs">
          +{{ template.tags.length - 3 }}
        </span>
      </div>

      <div class="flex items-center justify-between text-xs text-base-content/60">
        <div class="flex items-center space-x-4">
          <span class="flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-3 h-3">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{{ template.usageCount }}</span>
          </span>
          <span>{{ formatDate(template.updatedAt) }}</span>
        </div>
      </div>

      <div class="flex items-center justify-between mt-3">
        <div class="flex items-center space-x-2">
          <div class="avatar avatar-xs">
            <div class="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs">
              {{ template.creator.nickname?.[0] || template.creator.username[0] }}
            </div>
          </div>
          <span class="text-xs text-base-content/70">
            {{ template.creator.nickname || template.creator.username }}
          </span>
        </div>
        
        <button
          class="btn btn-primary btn-xs"
          @click.stop="$emit('use', template)"
        >
          使用模板
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TemplateDTO } from '~/api/template'

interface Props {
  template: TemplateDTO
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: false
})

defineEmits(['click', 'edit', 'delete', 'use'])

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
    MEETING: '会议',
    PROJECT: '项目',
    REPORT: '报告',
    KNOWLEDGE: '知识',
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

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
