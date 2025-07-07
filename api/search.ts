import { apiRequest } from './config'
import type { ApiResponse } from './config'

// 搜索结果类型定义
export interface SearchResult {
  workspaces: WorkspaceSearchResult[]
  documents: DocumentSearchResult[]
  total: number
  keyword: string
}

export interface WorkspaceSearchResult {
  id: number
  name: string
  description?: string
  icon?: string
  createdAt: string
  updatedAt: string
  documentCount?: number
  memberCount?: number
}

export interface DocumentSearchResult {
  id: number
  title: string
  content?: string
  type: 'RICH_TEXT' | 'MARKDOWN' | 'CODE'
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED'
  workspaceId: number
  workspaceName: string
  creator: {
    id: number
    username: string
    nickname?: string
  }
  createdAt: string
  updatedAt: string
}

// 搜索参数
export interface SearchParams {
  keyword: string
  type?: 'ALL' | 'WORKSPACE' | 'DOCUMENT'
  page?: number
  size?: number
}

// 搜索API
export const searchApi = {
  // 全局搜索
  async globalSearch(params: SearchParams): Promise<ApiResponse<SearchResult>> {
    const searchParams = new URLSearchParams()
    searchParams.append('keyword', params.keyword)
    if (params.type) searchParams.append('type', params.type)
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.size) searchParams.append('size', params.size.toString())
    
    return apiRequest(`/search?${searchParams.toString()}`)
  },

  // 搜索知识库
  async searchWorkspaces(keyword: string): Promise<ApiResponse<WorkspaceSearchResult[]>> {
    const searchParams = new URLSearchParams({ keyword })
    return apiRequest(`/workspaces/search?${searchParams.toString()}`)
  },

  // 搜索文档
  async searchDocuments(keyword: string): Promise<ApiResponse<DocumentSearchResult[]>> {
    const searchParams = new URLSearchParams({ keyword })
    return apiRequest(`/documents/search?${searchParams.toString()}`)
  }
}
