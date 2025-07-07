export interface TemplateDTO {
  id: number
  name: string
  description?: string
  content: string
  contentJson?: string
  category: 'MEETING' | 'PROJECT' | 'REPORT' | 'KNOWLEDGE' | 'OTHER'
  tags: string[]
  thumbnail?: string
  isPublic: boolean
  usageCount: number
  creator: {
    id: number
    username: string
    nickname?: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
}

export interface TemplateCreateRequest {
  name: string
  description?: string
  content: string
  contentJson?: string
  category: 'MEETING' | 'PROJECT' | 'REPORT' | 'KNOWLEDGE' | 'OTHER'
  tags: string[]
  isPublic?: boolean
}

export interface TemplateUpdateRequest {
  name?: string
  description?: string
  content?: string
  contentJson?: string
  category?: 'MEETING' | 'PROJECT' | 'REPORT' | 'KNOWLEDGE' | 'OTHER'
  tags?: string[]
  isPublic?: boolean
}

export interface TemplateListResponse {
  templates: TemplateDTO[]
  total: number
  page: number
  size: number
}

export interface TemplateCategory {
  key: 'MEETING' | 'PROJECT' | 'REPORT' | 'KNOWLEDGE' | 'OTHER'
  name: string
  icon: string
  description: string
}

import { apiRequest, type ApiResponse } from './config'

export const templateApi = {
  async getTemplates(params: {
    page?: number
    size?: number
    category?: string
    keyword?: string
    isPublic?: boolean
    sortBy?: string
    sortDir?: 'asc' | 'desc'
  } = {}): Promise<ApiResponse<TemplateListResponse>> {
    const searchParams = new URLSearchParams()
    if (params.page !== undefined) searchParams.set('page', params.page.toString())
    if (params.size !== undefined) searchParams.set('size', params.size.toString())
    if (params.category) searchParams.set('category', params.category)
    if (params.keyword) searchParams.set('keyword', params.keyword)
    if (params.isPublic !== undefined) searchParams.set('isPublic', params.isPublic.toString())
    if (params.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params.sortDir) searchParams.set('sortDir', params.sortDir)

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/templates?${queryString}` : '/templates'
    
    return apiRequest(endpoint)
  },

  async getById(id: number): Promise<ApiResponse<TemplateDTO>> {
    return apiRequest(`/templates/${id}`)
  },

  async create(data: TemplateCreateRequest): Promise<ApiResponse<TemplateDTO>> {
    return apiRequest('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: number, data: TemplateUpdateRequest): Promise<ApiResponse<TemplateDTO>> {
    return apiRequest(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    return apiRequest(`/templates/${id}`, {
      method: 'DELETE',
    })
  },

  async useTemplate(id: number): Promise<ApiResponse<void>> {
    return apiRequest(`/templates/${id}/use`, {
      method: 'POST',
    })
  },

  async getCategories(): Promise<ApiResponse<TemplateCategory[]>> {
    return apiRequest('/templates/categories')
  },

  async getPopularTemplates(limit: number = 10): Promise<ApiResponse<TemplateDTO[]>> {
    return apiRequest(`/templates/popular?limit=${limit}`)
  },

  async getMyTemplates(params: {
    page?: number
    size?: number
  } = {}): Promise<ApiResponse<TemplateListResponse>> {
    const searchParams = new URLSearchParams()
    if (params.page !== undefined) searchParams.set('page', params.page.toString())
    if (params.size !== undefined) searchParams.set('size', params.size.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/templates/my?${queryString}` : '/templates/my'
    
    return apiRequest(endpoint)
  }
}
