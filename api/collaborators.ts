// 文档分享管理API
// 定义类型接口
export interface DocumentShareInvitation {
  id: number
  document: {
    id: number
    title: string
    workspaceId: number
    workspaceName: string
    creator: {
      id: number
      username: string
      email: string
    }
  }
  inviter: {
    id: number
    username: string
    email: string
  }
  inviteeUsername: string
  role: 'VIEWER' | 'COMMENTER' | 'EDITOR'
  invitationType: 'DOCUMENT' | 'WORKSPACE'
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'
  invitationToken: string
  message?: string
  expiresAt: string
  createdAt: string
  expired: boolean
  canBeAccepted: boolean
  canBeCancelled: boolean
  targetResourceName: string
  targetResourceId: number
}

export interface DocumentCollaborator {
  id: number
  document: {
    id: number
    title: string
  }
  user: {
    id: number
    username: string
    email: string
  }
  role: 'VIEWER' | 'COMMENTER' | 'EDITOR'
  status: 'ACTIVE' | 'INACTIVE' | 'REMOVED'
  grantedBy: {
    id: number
    username: string
    email: string
  }
  createdAt: string
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  canManage: boolean
  canComment: boolean
}

export interface DocumentPermission {
  documentId: number
  userId: number
  role: 'VIEWER' | 'COMMENTER' | 'EDITOR'
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  canManage: boolean
  canComment: boolean
  hasWorkspacePermission: boolean
  canManageWorkspace: boolean
  workspacePermission?: {
    id: number
    role: string
    status: string
  }
}

export interface BatchShareResult {
  successCount: number
  failureCount: number
  errors: string[]
  results: any[]
}

export interface CollaboratorListResponse {
  collaborators: DocumentCollaborator[]
  total: number
  page: number
  size: number
  document: {
    id: number
    title: string
  }
}

export interface InvitationListResponse {
  invitations: DocumentShareInvitation[]
  total: number
  page: number
  size: number
}

// 请求参数接口
export interface ShareDocumentRequest {
  inviteeUsername: string
  role: 'VIEWER' | 'COMMENTER' | 'EDITOR'
  message?: string
  expirationDays?: number
}

export interface BatchShareDocumentRequest {
  inviteeUsernames: string[]
  role: 'VIEWER' | 'COMMENTER' | 'EDITOR'
  message?: string
  expirationDays?: number
}

export interface AddCollaboratorRequest {
  username: string
  role: 'VIEWER' | 'COMMENTER' | 'EDITOR'
  message?: string
}

export interface UpdateCollaboratorRequest {
  role?: 'VIEWER' | 'COMMENTER' | 'EDITOR'
  status?: 'ACTIVE' | 'INACTIVE'
}



export interface GetCollaboratorsParams {
  page?: number
  size?: number
}

export interface GetInvitationsParams {
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'
  page?: number
  size?: number
}

import { apiRequest, type ApiResponse } from './config'

// 文档分享与协作API函数
export const documentShareApi = {
  /**
   * 邀请他人查看文档
   * @param documentId 文档ID
   * @param data 邀请数据
   */
  async shareDocument(
    documentId: number,
    data: ShareDocumentRequest
  ): Promise<ApiResponse<DocumentShareInvitation>> {
    return apiRequest(`/documents/${documentId}/share`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * 批量分享文档
   * @param documentId 文档ID
   * @param data 批量邀请数据
   */
  async batchShareDocument(
    documentId: number,
    data: BatchShareDocumentRequest
  ): Promise<ApiResponse<BatchShareResult>> {
    return apiRequest(`/documents/${documentId}/share/batch`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * 获取文档协作者列表
   * @param documentId 文档ID
   * @param params 分页参数
   */
  async getCollaborators(
    documentId: number,
    params?: GetCollaboratorsParams
  ): Promise<ApiResponse<CollaboratorListResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.page !== undefined) searchParams.set('page', params.page.toString())
    if (params?.size !== undefined) searchParams.set('size', params.size.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString
      ? `/documents/${documentId}/collaborators?${queryString}`
      : `/documents/${documentId}/collaborators`

    return apiRequest(endpoint)
  },

  /**
   * 添加文档协作者
   * @param documentId 文档ID
   * @param data 协作者数据
   */
  async addCollaborator(
    documentId: number,
    data: AddCollaboratorRequest
  ): Promise<ApiResponse<void>> {
    return apiRequest(`/documents/${documentId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * 更新文档协作者
   * @param documentId 文档ID
   * @param collaboratorId 协作者ID
   * @param data 更新数据
   */
  async updateCollaborator(
    documentId: number,
    collaboratorId: number,
    data: UpdateCollaboratorRequest
  ): Promise<ApiResponse<void>> {
    return apiRequest(`/documents/${documentId}/collaborators/${collaboratorId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * 移除文档协作者
   * @param documentId 文档ID
   * @param collaboratorId 协作者ID
   */
  async removeCollaborator(
    documentId: number,
    collaboratorId: number
  ): Promise<ApiResponse<void>> {
    return apiRequest(`/documents/${documentId}/collaborators/${collaboratorId}`, {
      method: 'DELETE',
    })
  },

  /**
   * 获取用户文档权限
   * @param documentId 文档ID
   * @param userId 用户ID
   */
  async getUserPermissions(
    documentId: number,
    userId: number
  ): Promise<ApiResponse<DocumentPermission>> {
    return apiRequest(`/documents/${documentId}/permissions/${userId}`)
  },

  /**
   * 检查当前用户文档权限
   * @param documentId 文档ID
   */
  async getCurrentUserPermissions(
    documentId: number
  ): Promise<ApiResponse<DocumentPermission>> {
    return apiRequest(`/documents/${documentId}/permissions/current`)
  },

  /**
   * 获取文档邀请列表
   * @param documentId 文档ID
   * @param params 查询参数
   */
  async getInvitations(
    documentId: number,
    params?: GetInvitationsParams
  ): Promise<ApiResponse<InvitationListResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page !== undefined) searchParams.set('page', params.page.toString())
    if (params?.size !== undefined) searchParams.set('size', params.size.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString
      ? `/documents/${documentId}/invitations?${queryString}`
      : `/documents/${documentId}/invitations`

    return apiRequest(endpoint)
  },


}
