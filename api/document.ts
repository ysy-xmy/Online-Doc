// 文档相关API
export interface DocumentCreateRequest {
  title: string
  content?: string
  contentJson?: string
  type?: 'RICH_TEXT' | 'MARKDOWN' | 'CODE'
  workspaceId: number
}

export interface DocumentUpdateRequest {
  title?: string
  content?: string
  contentJson?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED'
}

export interface DocumentDTO {
  id: number
  title: string
  content?: string
  contentJson?: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED'
  type: 'RICH_TEXT' | 'MARKDOWN' | 'CODE'
  workspace: {
    id: number
    name: string
    description?: string
    icon?: string
  }
  creator: {
    id: number
    username: string
    nickname?: string
    avatar?: string
  }
  lastModifier?: {
    id: number
    username: string
    nickname?: string
    avatar?: string
  }
  currentVersion: number
  operationSequence: number
  createdAt: string
  updatedAt: string
}

export interface DocumentListResponse {
  documents: DocumentDTO[]
  total: number
  page: number
  size: number
}

export interface DocumentSummary {
  id: number
  title: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED'
  type: 'RICH_TEXT' | 'MARKDOWN' | 'CODE'
  creator: {
    id: number
    username: string
    nickname?: string
    avatar?: string
  }
  lastModifier?: {
    id: number
    username: string
    nickname?: string
    avatar?: string
  }
  updatedAt: string
}

import { apiRequest, type ApiResponse } from './config'

// 文档API函数
export const documentApi = {
  // 创建文档
  async create(data: DocumentCreateRequest): Promise<ApiResponse<DocumentDTO>> {
    return apiRequest('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // 根据ID获取文档
  async getById(id: number): Promise<ApiResponse<DocumentDTO>> {
    return apiRequest(`/documents/${id}`)
  },

  // 更新文档
  async update(id: number, data: DocumentUpdateRequest): Promise<ApiResponse<DocumentDTO>> {
    return apiRequest(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // 删除文档
  async delete(id: number): Promise<ApiResponse<void>> {
    return apiRequest(`/documents/${id}`, {
      method: 'DELETE',
    })
  },

  // 获取知识库下的文档列表
  async getByWorkspace(workspaceId: number, params: {
    page?: number
    size?: number
    sortBy?: string
    sortDir?: 'asc' | 'desc'
  } = {}): Promise<ApiResponse<DocumentListResponse>> {
    const searchParams = new URLSearchParams()
    if (params.page !== undefined) searchParams.set('page', params.page.toString())
    if (params.size !== undefined) searchParams.set('size', params.size.toString())
    if (params.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params.sortDir) searchParams.set('sortDir', params.sortDir)

    const queryString = searchParams.toString()
    const endpoint = queryString 
      ? `/documents/workspace/${workspaceId}?${queryString}` 
      : `/documents/workspace/${workspaceId}`
    
    return apiRequest(endpoint)
  },

  // 搜索文档
  async search(keyword: string): Promise<ApiResponse<DocumentSummary[]>> {
    const searchParams = new URLSearchParams({ keyword })
    return apiRequest(`/documents/search?${searchParams.toString()}`)
  },

  // 获取最近编辑的文档
  async getRecent(limit: number = 10): Promise<ApiResponse<DocumentSummary[]>> {
    const searchParams = new URLSearchParams({ limit: limit.toString() })
    return apiRequest(`/documents/recent?${searchParams.toString()}`)
  },
}
