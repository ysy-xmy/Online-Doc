import { defineStore } from 'pinia'
import { documentApi, type DocumentDTO, type DocumentCreateRequest, type DocumentUpdateRequest, type DocumentSummary } from '~/api/document'

interface DocumentState {
  documents: DocumentDTO[]
  currentDocument: DocumentDTO | null
  recentDocuments: DocumentSummary[]
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    size: number
  }
}

export const useDocumentStore = defineStore('documentStore', {
  state: (): DocumentState => ({
    documents: [],
    currentDocument: null,
    recentDocuments: [],
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 0,
      size: 10
    }
  }),

  getters: {
    // 获取已发布的文档
    publishedDocuments: (state) => state.documents.filter(d => d.status === 'PUBLISHED'),
    
    // 获取草稿文档
    draftDocuments: (state) => state.documents.filter(d => d.status === 'DRAFT'),
    
    // 检查是否有更多数据可加载
    hasMore: (state) => state.documents.length < state.pagination.total,
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

    // 根据知识库ID获取文档列表
    async fetchDocumentsByWorkspace(workspaceId: number, params: {
      page?: number
      size?: number
      sortBy?: string
      sortDir?: 'asc' | 'desc'
      refresh?: boolean
    } = {}) {
      try {
        this.setLoading(true)
        this.clearError()

        console.log('DocumentStore: 开始获取文档列表', { workspaceId, params })

        const response = await documentApi.getByWorkspace(workspaceId, params)

        console.log('DocumentStore: API响应', response)

        if (response.code === 'SUCCESS') {

          //打印知识库对应的文档列表
          // console.log("response.data99999999:", response.data.documents);

          if (params.refresh || params.page === 0) {
            // 刷新或第一页，替换数据
            this.documents = response.data.documents
          } else {
            // 加载更多，追加数据
            this.documents.push(...response.data.documents)
          }

          this.pagination = {
            total: response.data.total,
            page: response.data.page,
            size: response.data.size
          }

          console.log('DocumentStore: 文档列表更新完成', {
            documentsCount: this.documents.length,
            total: this.pagination.total
          })
        } else {
          console.error('DocumentStore: API返回错误', response)
          throw new Error(response.message || '获取文档列表失败')
        }
      } catch (error) {
        console.error('DocumentStore: 获取文档列表失败', error)
        this.setError(error instanceof Error ? error.message : '获取文档列表失败')
      } finally {
        this.setLoading(false)
      }
    },

    // 根据ID获取文档详情
    async fetchDocumentById(id: number) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await documentApi.getById(id)
        
        if (response.code === 'SUCCESS') {
          this.currentDocument = response.data
          
          // 更新列表中的对应项
          const index = this.documents.findIndex(d => d.id === id)
          if (index !== -1) {
            this.documents[index] = response.data
          }
          
          return response.data
        } else {
          throw new Error(response.message || '获取文档详情失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '获取文档详情失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // 创建文档
    async createDocument(data: DocumentCreateRequest) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await documentApi.create(data)
        
        if (response.code === 'SUCCESS') {
          // 将新创建的文档添加到列表开头
          this.documents.unshift(response.data)
          this.pagination.total += 1
          return response.data
        } else {
          throw new Error(response.message || '创建文档失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '创建文档失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // 更新文档
    async updateDocument(id: number, data: DocumentUpdateRequest) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await documentApi.update(id, data)
        
        if (response.code === 'SUCCESS') {
          // 更新列表中的对应项
          const index = this.documents.findIndex(d => d.id === id)
          if (index !== -1) {
            this.documents[index] = response.data
          }
          
          // 更新当前文档
          if (this.currentDocument?.id === id) {
            this.currentDocument = response.data
          }
          
          return response.data
        } else {
          throw new Error(response.message || '更新文档失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '更新文档失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // 删除文档
    async deleteDocument(id: number) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await documentApi.delete(id)
        
        if (response.code === 'SUCCESS') {
          // 从列表中移除
          this.documents = this.documents.filter(d => d.id !== id)
          this.pagination.total -= 1
          
          // 清除当前文档
          if (this.currentDocument?.id === id) {
            this.currentDocument = null
          }
        } else {
          throw new Error(response.message || '删除文档失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '删除文档失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // 获取最近编辑的文档
    async fetchRecentDocuments(limit: number = 10) {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await documentApi.getRecent(limit)
        
        if (response.code === 'SUCCESS') {

          this.recentDocuments = response.data
        } else {
          throw new Error(response.message || '获取最近文档失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '获取最近文档失败')
      } finally {
        this.setLoading(false)
      }
    },

    // 搜索文档
    async searchDocuments(keyword: string): Promise<DocumentSummary[]> {
      try {
        this.setLoading(true)
        this.clearError()

        const response = await documentApi.search(keyword)
        
        if (response.code === 'SUCCESS') {
          return response.data
        } else {
          throw new Error(response.message || '搜索文档失败')
        }
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '搜索文档失败')
        return []
      } finally {
        this.setLoading(false)
      }
    },

    // 重置状态
    reset() {
      this.documents = []
      this.currentDocument = null
      this.recentDocuments = []
      this.loading = false
      this.error = null
      this.pagination = {
        total: 0,
        page: 0,
        size: 10
      }
    }
  }
})
