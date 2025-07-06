import { defineStore } from 'pinia'
import { dashboardApi, type DashboardData, type WorkspaceDashboard } from '~/api/dashboard'

interface DashboardState {
  userDashboard: DashboardData | null
  workspaceDashboard: WorkspaceDashboard | null
  loading: boolean
  error: string | null
}

export const useDashboardStore = defineStore('dashboard', {
  state: (): DashboardState => ({
    userDashboard: null,
    workspaceDashboard: null,
    loading: false,
    error: null
  }),

  getters: {
    // 获取最近文档
    recentDocuments: (state) => state.userDashboard?.recentDocuments || [],
    
    // 获取最近知识库
    recentWorkspaces: (state) => state.userDashboard?.recentWorkspaces || [],
    
    // 获取统计数据
    statistics: (state) => state.userDashboard?.statistics || {
      documentsCreatedToday: 0,
      documentsCreatedThisWeek: 0,
      documentsCreatedThisMonth: 0,
      activeCollaborators: 0
    },
    
    // 获取知识库统计数据
    workspaceStatistics: (state) => state.workspaceDashboard?.statistics || {
      documentsCreatedToday: 0,
      documentsCreatedThisWeek: 0,
      documentsCreatedThisMonth: 0,
      activeCollaborators: 0
    }
  },

  actions: {
    // 设置加载状态
    setLoading(loading: boolean) {
      this.loading = loading
    },

    // 设置错误信息
    setError(error: string | null) {
      this.error = error
    },

    // 清除错误
    clearError() {
      this.error = null
    },

    // 获取用户仪表板数据
    async fetchUserDashboard() {
      try {
        this.setLoading(true)
        this.clearError()

        console.log('开始获取仪表板数据...')
        const response = await dashboardApi.getUserDashboard()
        console.log('仪表板API响应:', response)

        if (response.code === 'SUCCESS' && response.data) {
          const backendData = response.data
          console.log('后端返回的数据结构:', backendData)

          // 正确映射后端数据结构到前端期望的结构
          this.userDashboard = {
            totalWorkspaces: backendData.userSummary?.totalWorkspaces || 0,
            totalDocuments: backendData.userSummary?.totalDocuments || 0,
            totalComments: backendData.userSummary?.totalComments || 0,
            recentDocuments: backendData.recentDocuments || [],
            recentWorkspaces: backendData.recentWorkspaces || [],
            statistics: {
              documentsCreatedToday: backendData.activitySummary?.todayDocuments || 0,
              documentsCreatedThisWeek: backendData.activitySummary?.weekDocuments || 0,
              documentsCreatedThisMonth: backendData.activitySummary?.monthDocuments || 0,
              activeCollaborators: backendData.activitySummary?.todayCollaborations || 0,
            }
          }

          console.log('映射后的前端数据:', this.userDashboard)
        } else {
          console.warn('API响应失败或无数据:', response)
          // 如果没有数据，设置默认值
          this.userDashboard = {
            totalWorkspaces: 0,
            totalDocuments: 0,
            totalComments: 0,
            recentDocuments: [],
            recentWorkspaces: [],
            statistics: {
              documentsCreatedToday: 0,
              documentsCreatedThisWeek: 0,
              documentsCreatedThisMonth: 0,
              activeCollaborators: 0,
            }
          }
          throw new Error(response.message || '获取仪表板数据失败')
        }
      } catch (error) {
        console.error('获取仪表板数据失败:', error)
        // 设置默认值，防止渲染错误
        this.userDashboard = {
          totalWorkspaces: 0,
          totalDocuments: 0,
          totalComments: 0,
          recentDocuments: [],
          recentWorkspaces: [],
          statistics: {
            documentsCreatedToday: 0,
            documentsCreatedThisWeek: 0,
            documentsCreatedThisMonth: 0,
            activeCollaborators: 0,
          }
        }
        this.setError(error instanceof Error ? error.message : '获取仪表板数据失败')
      } finally {
        this.setLoading(false)
      }
    },

    // 获取知识库仪表板数据
    async fetchWorkspaceDashboard(workspaceId: number) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await dashboardApi.getWorkspaceDashboard(workspaceId)
        
        if (response.code === 'SUCCESS') {
          this.workspaceDashboard = response.data
        } else {
          throw new Error(response.message || '获取知识库仪表板数据失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '获取知识库仪表板数据失败')
      } finally {
        this.setLoading(false)
      }
    },

    // 重置状态
    reset() {
      this.userDashboard = null
      this.workspaceDashboard = null
      this.loading = false
      this.error = null
    }
  }
})
