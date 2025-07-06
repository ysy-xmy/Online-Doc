import { apiRequest, type ApiResponse } from './config'

// 后端返回的数据结构（与DashboardDTO对应）
export interface BackendDashboardData {
  userSummary: {
    totalWorkspaces: number
    totalDocuments: number
    totalComments: number
    lastActivity: string
  }
  recentDocuments: DocumentSummary[]
  recentWorkspaces: WorkspaceSummary[]
  activitySummary?: {
    todayDocuments: number
    weekDocuments: number
    monthDocuments: number
    todayCollaborations: number
    todayViews: number
  }
}

// 前端使用的数据接口
export interface DashboardData {
  totalWorkspaces: number
  totalDocuments: number
  totalComments: number
  recentDocuments: DocumentSummary[]
  recentWorkspaces: WorkspaceSummary[]
  statistics: {
    documentsCreatedToday: number
    documentsCreatedThisWeek: number
    documentsCreatedThisMonth: number
    activeCollaborators: number
  }
}

export interface WorkspaceDashboard {
  workspace: {
    id: number
    name: string
    description?: string
    icon?: string
  }
  totalDocuments: number
  recentDocuments: DocumentSummary[]
  statistics: {
    documentsCreatedToday: number
    documentsCreatedThisWeek: number
    documentsCreatedThisMonth: number
    activeCollaborators: number
  }
  collaborators: UserSummary[]
}

export interface DocumentSummary {
  id: number
  title: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED'
  type: 'RICH_TEXT' | 'MARKDOWN' | 'CODE'
  creator: UserSummary
  lastModifier?: UserSummary
  updatedAt: string
}

export interface WorkspaceSummary {
  id: number
  name: string
  description?: string
  icon?: string
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED'
  owner: UserSummary
  documentCount?: number
  updatedAt: string
}

export interface UserSummary {
  id: number
  username: string
  nickname?: string
  avatar?: string
}

// 仪表板API函数
export const dashboardApi = {
  // 获取用户仪表板数据（返回后端数据结构）
  async getUserDashboard(): Promise<ApiResponse<BackendDashboardData>> {
    return apiRequest('/dashboard')
  },

  // 获取知识库仪表板数据
  async getWorkspaceDashboard(workspaceId: number): Promise<ApiResponse<WorkspaceDashboard>> {
    return apiRequest(`/dashboard/workspace/${workspaceId}`)
  },
}
