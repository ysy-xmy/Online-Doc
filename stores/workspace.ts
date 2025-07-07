import { defineStore } from 'pinia'
import { workspaceApi, type WorkspaceDTO, type WorkspaceCreateRequest, type WorkspaceUpdateRequest, type WorkspaceSummary } from '~/api/workspace'

interface WorkspaceState {
  workspaceId: number
  workspaces: WorkspaceDTO[]
  currentWorkspace: WorkspaceDTO | null
  loading: boolean
  error: string | null
  workspaceId: number
  pagination: {
    total: number
    page: number
    size: number
  }
}

export const useWorkspaceStore = defineStore('workspace', {
  state: (): WorkspaceState => ({
    workspaceId: 0,
    workspaces: [],
    currentWorkspace: null,
    loading: false,
    error: null,
    workspaceId: 0,
    pagination: {
      total: 0,
      page: 0,
      size: 10
    }
  }),

  getters: {
    // 获取活跃的知识库
    activeWorkspaces: (state) => state.workspaces.filter(w => w.status === 'ACTIVE'),
    
    // 获取当前用户拥有的知识库
    ownedWorkspaces: (state) => state.workspaces.filter(w => w.owner),
    
    // 检查是否有更多数据可加载
    hasMore: (state) => state.workspaces.length < state.pagination.total,
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

    // 获取用户的知识库列表
    async fetchWorkspaces(params: {
      page?: number
      size?: number
      sortBy?: string
      sortDir?: 'asc' | 'desc'
      refresh?: boolean
    } = {}) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await workspaceApi.getUserWorkspaces(params)
        
        if (response.code === 'SUCCESS') {
          //打印response.data.workspaces（在这里调用知识库接口列表）
          // console.log("response.data.workspaces:", response.data.workspaces);

          if (params.refresh || params.page === 0) {
            // 刷新或第一页，替换数据
            this.workspaces = response.data.workspaces
          } else {
            // 加载更多，追加数据
            this.workspaces.push(...response.data.workspaces)
          }
          
          this.pagination = {
            total: response.data.total,
            page: response.data.page,
            size: response.data.size
          }
        } else {
          throw new Error(response.message || '获取知识库列表失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '获取知识库列表失败')
      } finally {
        this.setLoading(false)
      }
    },

    // 根据ID获取知识库详情
    async fetchWorkspaceById(id: number) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await workspaceApi.getById(id)
        
        if (response.code === 'SUCCESS') {

          this.currentWorkspace = response.data
          
          // 更新列表中的对应项
          const index = this.workspaces.findIndex(w => w.id === id)
          if (index !== -1) {
            this.workspaces[index] = response.data
          }
        } else {
          throw new Error(response.message || '获取知识库详情失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '获取知识库详情失败')
      } finally {
        this.setLoading(false)
      }
    },

    // 创建知识库
    async createWorkspace(data: WorkspaceCreateRequest) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await workspaceApi.create(data)
        
        if (response.code === 'SUCCESS') {
          // 将新创建的知识库添加到列表开头
          this.workspaces.unshift(response.data)
          this.pagination.total += 1
          return response.data
        } else {
          throw new Error(response.message || '创建知识库失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '创建知识库失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // 更新知识库
    async updateWorkspace(id: number, data: WorkspaceUpdateRequest) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await workspaceApi.update(id, data)
        
        if (response.code === 'SUCCESS') {
          // 更新列表中的对应项
          const index = this.workspaces.findIndex(w => w.id === id)
          if (index !== -1) {
            this.workspaces[index] = response.data
          }
          
          // 更新当前知识库
          if (this.currentWorkspace?.id === id) {
            this.currentWorkspace = response.data
          }
          
          return response.data
        } else {
          throw new Error(response.message || '更新知识库失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '更新知识库失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // 删除知识库
    async deleteWorkspace(id: number) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await workspaceApi.delete(id)
        
        if (response.code === 'SUCCESS') {
          // 从列表中移除
          this.workspaces = this.workspaces.filter(w => w.id !== id)
          this.pagination.total -= 1
          
          // 清除当前知识库
          if (this.currentWorkspace?.id === id) {
            this.currentWorkspace = null
          }
        } else {
          throw new Error(response.message || '删除知识库失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '删除知识库失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // 搜索知识库
    async searchWorkspaces(keyword: string): Promise<WorkspaceSummary[]> {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await workspaceApi.search(keyword)
        
        if (response.code === 'SUCCESS') {
          return response.data
        } else {
          throw new Error(response.message || '搜索知识库失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '搜索知识库失败')
        return []
      } finally {
        this.setLoading(false)
      }
    },

    // 重置状态
    reset() {
      this.workspaces = []
      this.currentWorkspace = null
      this.loading = false
      this.error = null
      this.workspaceId = 0
      this.pagination = {
        total: 0,
        page: 0,
        size: 10
      }
    }
  }
})
