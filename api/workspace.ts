// 知识库相关API
export interface WorkspaceCreateRequest {
  name: string
  description?: string
  icon?: string
  visibility?: 'PRIVATE' | 'PUBLIC' | 'INTERNAL'
}

export interface WorkspaceUpdateRequest {
  name?: string
  description?: string
  icon?: string
  visibility?: 'PRIVATE' | 'PUBLIC' | 'INTERNAL'
}

export interface WorkspaceDTO {
  id: number
  name: string
  description?: string
  icon?: string
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED'
  visibility: 'PRIVATE' | 'PUBLIC' | 'INTERNAL'
  owner: {
    id: number
    username: string
    nickname?: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
  documentCount?: number
}

export interface WorkspaceListResponse {
  workspaces: WorkspaceDTO[]
  total: number
  page: number
  size: number
}

export interface WorkspaceSummary {
  id: number
  name: string
  description?: string
  icon?: string
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED'
  owner: {
    id: number
    username: string
    nickname?: string
    avatar?: string
  }
  documentCount?: number
  updatedAt: string
}

import { apiRequest, type ApiResponse } from './config'

// 知识库API函数
export const workspaceApi = {
  // 创建知识库
  async create(data: WorkspaceCreateRequest): Promise<ApiResponse<WorkspaceDTO>> {
    return apiRequest('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // 获取用户的知识库列表
  async getUserWorkspaces(params: {
    page?: number
    size?: number
    sortBy?: string
    sortDir?: 'asc' | 'desc'
  } = {}): Promise<ApiResponse<WorkspaceListResponse>> {
    const searchParams = new URLSearchParams()
    if (params.page !== undefined) searchParams.set('page', params.page.toString())
    if (params.size !== undefined) searchParams.set('size', params.size.toString())
    if (params.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params.sortDir) searchParams.set('sortDir', params.sortDir)

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/workspaces?${queryString}` : '/workspaces'
    
    return apiRequest(endpoint)
  },

  // 根据ID获取知识库
  async getById(id: number): Promise<ApiResponse<WorkspaceDTO>> {
    return apiRequest(`/workspaces/${id}`)
  },

  // 更新知识库
  async update(id: number, data: WorkspaceUpdateRequest): Promise<ApiResponse<WorkspaceDTO>> {
    return apiRequest(`/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // 删除知识库
  async delete(id: number): Promise<ApiResponse<void>> {
    return apiRequest(`/workspaces/${id}`, {
      method: 'DELETE',
    })
  },

  // 搜索知识库
  async search(keyword: string): Promise<ApiResponse<WorkspaceSummary[]>> {
    const searchParams = new URLSearchParams({ keyword })
    return apiRequest(`/workspaces/search?${searchParams.toString()}`)
  },
}
