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

  // 保存最新文档内容
  async updateDocument(changeset: string): Promise<UpdateDocumentResponse> {
    try {
      const { $fetchInstance } = useNuxtApp()
      const response = await $fetchInstance('/document', {
        method: 'POST',
        body: { changeset }
      })
      return response as UpdateDocumentResponse
    } catch (error) {
      console.error('保存最新文档内容失败', error)
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

// 定义新的响应接口
export interface DocumentOperationsResponse {
  code: number;
  data: {
    operations: Array<{
      operation: string;
      content: string;
      date: string;
      description: string;
    }>;
  };
}

// 文档操作相关 API 方法
export const documentOperationsApi = {
  // 获取文档操作记录
  async getDocumentOperations(documentId: string): Promise<DocumentOperationsResponse> {
    try {
      const { $fetchInstance } = useNuxtApp();
      const response = await $fetchInstance(`/collaboration/documents/${documentId}/operations?fromSequence=0`, {
        method: 'GET'
      });
      return response as DocumentOperationsResponse;
    } catch (error) {
      console.error('获取文档操作记录失败', error);
      throw error;
    }
  },
  // 记录并存储文档操作历史版本
  async recordDocumentOperation(
      documentId: string,
      operationData: {
        operation: string;
        content: string;
        date: string;
        description: string;
      }
  ): Promise<DocumentOperationsResponse> {
    try {
      const { $fetchInstance } = useNuxtApp();
      const response = await $fetchInstance(
          `/collaboration/documents/${documentId}/operations`,
          {
            method: 'POST',
            body: operationData
          }
      );
      return response as DocumentOperationsResponse;
    } catch (error) {
      console.error('记录并存储新版本文档失败', error);
      throw error;
    }
  }
};
