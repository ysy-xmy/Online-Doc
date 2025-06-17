// 定义接口以支持 TypeScript
export interface DocumentResponse {
  content: string
}

export interface RevisionHistoryResponse {
  revisionHistory: Array<{
    rev: number
    uuid: string
  }>
}

export interface UpdateDocumentResponse extends RevisionHistoryResponse {
  success: boolean
}

// 文档相关 API 方法
export const documentApi = {
  // 获取文档内容
  async getDocument(): Promise<DocumentResponse> {
    try {
      const { $fetchInstance } = useNuxtApp()
      const response = await $fetchInstance('/document', {
        method: 'GET'
      })
      return response as DocumentResponse
    } catch (error) {
      console.error('获取文档内容失败', error)
      throw error
    }
  },

  // 更新文档内容
  async updateDocument(changeset: string): Promise<UpdateDocumentResponse> {
    try {
      const { $fetchInstance } = useNuxtApp()
      const response = await $fetchInstance('/document', {
        method: 'POST',
        body: { changeset }
      })
      return response as UpdateDocumentResponse
    } catch (error) {
      console.error('更新文档内容失败', error)
      throw error
    }
  },

  // 获取特定版本的文档
  async getDocumentVersion(uuid: string): Promise<DocumentResponse> {
    try {
      const { $fetchInstance } = useNuxtApp()
      const response = await $fetchInstance(`/document/version/${uuid}`, {
        method: 'GET'
      })
      return response as DocumentResponse
    } catch (error) {
      console.error('获取文档版本失败', error)
      throw error
    }
  },

  // 获取文档修订历史
  async getRevisionHistory(): Promise<RevisionHistoryResponse> {
    try {
      const { $fetchInstance } = useNuxtApp()
      const response = await $fetchInstance('/document/history', {
        method: 'GET'
      })
      return response as RevisionHistoryResponse
    } catch (error) {
      console.error('获取文档修订历史失败', error)
      throw error
    }
  }
}
