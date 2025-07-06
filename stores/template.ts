import { defineStore } from 'pinia'
import { templateApi, type TemplateDTO, type TemplateCreateRequest, type TemplateUpdateRequest, type TemplateCategory } from '~/api/template'

interface TemplateState {
  templates: TemplateDTO[]
  myTemplates: TemplateDTO[]
  popularTemplates: TemplateDTO[]
  categories: TemplateCategory[]
  currentTemplate: TemplateDTO | null
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    size: number
  }
  filters: {
    category: string
    keyword: string
    isPublic: boolean | null
  }
}

export const useTemplateStore = defineStore('template', {
  state: (): TemplateState => ({
    templates: [],
    myTemplates: [],
    popularTemplates: [],
    categories: [],
    currentTemplate: null,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 0,
      size: 12
    },
    filters: {
      category: '',
      keyword: '',
      isPublic: null
    }
  }),

  getters: {
    hasMore: (state) => state.templates.length < state.pagination.total,
    
    filteredTemplates: (state) => {
      let filtered = state.templates
      
      if (state.filters.category) {
        filtered = filtered.filter(t => t.category === state.filters.category)
      }
      
      if (state.filters.keyword) {
        const keyword = state.filters.keyword.toLowerCase()
        filtered = filtered.filter(t => 
          t.name.toLowerCase().includes(keyword) ||
          t.description?.toLowerCase().includes(keyword) ||
          t.tags.some(tag => tag.toLowerCase().includes(keyword))
        )
      }
      
      if (state.filters.isPublic !== null) {
        filtered = filtered.filter(t => t.isPublic === state.filters.isPublic)
      }
      
      return filtered
    },

    templatesByCategory: (state) => {
      const grouped: Record<string, TemplateDTO[]> = {}
      state.templates.forEach(template => {
        if (!grouped[template.category]) {
          grouped[template.category] = []
        }
        grouped[template.category].push(template)
      })
      return grouped
    }
  },

  actions: {
    setLoading(loading: boolean) {
      this.loading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    clearError() {
      this.error = null
    },

    setFilters(filters: Partial<TemplateState['filters']>) {
      this.filters = { ...this.filters, ...filters }
    },

    clearFilters() {
      this.filters = {
        category: '',
        keyword: '',
        isPublic: null
      }
    },

    async fetchTemplates(params: {
      page?: number
      size?: number
      category?: string
      keyword?: string
      isPublic?: boolean
      refresh?: boolean
    } = {}) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await templateApi.getTemplates({
          page: params.page || 0,
          size: params.size || this.pagination.size,
          category: params.category || this.filters.category,
          keyword: params.keyword || this.filters.keyword,
          isPublic: params.isPublic ?? this.filters.isPublic ?? undefined,
          sortBy: 'updatedAt',
          sortDir: 'desc'
        })
        
        if (response.code === 'SUCCESS') {
          if (params.refresh || params.page === 0) {
            this.templates = response.data.templates
          } else {
            this.templates.push(...response.data.templates)
          }
          
          this.pagination = {
            total: response.data.total,
            page: response.data.page,
            size: response.data.size
          }
        } else {
          throw new Error(response.message || '获取模板列表失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '获取模板列表失败')
      } finally {
        this.setLoading(false)
      }
    },

    async fetchTemplateById(id: number) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await templateApi.getById(id)
        
        if (response.code === 'SUCCESS') {
          this.currentTemplate = response.data
          return response.data
        } else {
          throw new Error(response.message || '获取模板详情失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '获取模板详情失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async fetchMyTemplates(params: {
      page?: number
      size?: number
      refresh?: boolean
    } = {}) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await templateApi.getMyTemplates(params)
        
        if (response.code === 'SUCCESS') {
          if (params.refresh || params.page === 0) {
            this.myTemplates = response.data.templates
          } else {
            this.myTemplates.push(...response.data.templates)
          }
        } else {
          throw new Error(response.message || '获取我的模板失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '获取我的模板失败')
      } finally {
        this.setLoading(false)
      }
    },

    async fetchPopularTemplates(limit: number = 10) {
      try {
        const response = await templateApi.getPopularTemplates(limit)
        
        if (response.code === 'SUCCESS') {
          this.popularTemplates = response.data
        } else {
          throw new Error(response.message || '获取热门模板失败')
        }
      } catch (error) {
        console.error('获取热门模板失败:', error)
      }
    },

    async fetchCategories() {
      try {
        const response = await templateApi.getCategories()
        
        if (response.code === 'SUCCESS') {
          this.categories = response.data
        } else {
          throw new Error(response.message || '获取模板分类失败')
        }
      } catch (error) {
        console.error('获取模板分类失败:', error)
      }
    },

    async createTemplate(data: TemplateCreateRequest) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await templateApi.create(data)
        
        if (response.code === 'SUCCESS') {
          this.templates.unshift(response.data)
          this.myTemplates.unshift(response.data)
          this.pagination.total += 1
          return response.data
        } else {
          throw new Error(response.message || '创建模板失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '创建模板失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async updateTemplate(id: number, data: TemplateUpdateRequest) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await templateApi.update(id, data)
        
        if (response.code === 'SUCCESS') {
          const index = this.templates.findIndex(t => t.id === id)
          if (index !== -1) {
            this.templates[index] = response.data
          }
          
          const myIndex = this.myTemplates.findIndex(t => t.id === id)
          if (myIndex !== -1) {
            this.myTemplates[myIndex] = response.data
          }
          
          if (this.currentTemplate?.id === id) {
            this.currentTemplate = response.data
          }
          
          return response.data
        } else {
          throw new Error(response.message || '更新模板失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '更新模板失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async deleteTemplate(id: number) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await templateApi.delete(id)
        
        if (response.code === 'SUCCESS') {
          this.templates = this.templates.filter(t => t.id !== id)
          this.myTemplates = this.myTemplates.filter(t => t.id !== id)
          this.pagination.total -= 1
          
          if (this.currentTemplate?.id === id) {
            this.currentTemplate = null
          }
        } else {
          throw new Error(response.message || '删除模板失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '删除模板失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    async useTemplate(id: number) {
      try {
        const response = await templateApi.useTemplate(id)
        
        if (response.code === 'SUCCESS') {
          const template = this.templates.find(t => t.id === id)
          if (template) {
            template.usageCount += 1
          }
        } else {
          throw new Error(response.message || '使用模板失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '使用模板失败')
        throw error
      }
    }
  }
})
