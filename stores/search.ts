import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { searchApi } from '~/api/search'
import type { SearchResult, SearchParams, WorkspaceSearchResult, DocumentSearchResult } from '~/api/search'

export const useSearchStore = defineStore('search', () => {
  // 状态
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchResults = ref<SearchResult | null>(null)
  const searchHistory = ref<string[]>([])
  const currentKeyword = ref('')
  const searchType = ref<'ALL' | 'WORKSPACE' | 'DOCUMENT'>('ALL')

  // 计算属性
  const hasResults = computed(() => {
    return searchResults.value && searchResults.value.total > 0
  })

  const workspaceResults = computed(() => {
    return searchResults.value?.workspaces || []
  })

  const documentResults = computed(() => {
    return searchResults.value?.documents || []
  })

  const totalResults = computed(() => {
    return searchResults.value?.total || 0
  })

  // 方法
  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const clearResults = () => {
    searchResults.value = null
    currentKeyword.value = ''
  }

  // 执行全局搜索
  const performGlobalSearch = async (params: SearchParams) => {
    try {
      setLoading(true)
      clearError()

      const response = await searchApi.globalSearch(params)
      
      if (response.code === 'SUCCESS') {
        searchResults.value = response.data
        currentKeyword.value = params.keyword
        searchType.value = params.type || 'ALL'
        
        // 添加到搜索历史
        addToHistory(params.keyword)
        
        return response.data
      } else {
        throw new Error(response.message || '搜索失败')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索失败'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 搜索知识库
  const searchWorkspaces = async (keyword: string): Promise<WorkspaceSearchResult[]> => {
    try {
      setLoading(true)
      clearError()

      const response = await searchApi.searchWorkspaces(keyword)
      
      if (response.code === 'SUCCESS') {
        return response.data
      } else {
        throw new Error(response.message || '搜索知识库失败')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '搜索知识库失败')
      return []
    } finally {
      setLoading(false)
    }
  }

  // 搜索文档
  const searchDocuments = async (keyword: string): Promise<DocumentSearchResult[]> => {
    try {
      setLoading(true)
      clearError()

      const response = await searchApi.searchDocuments(keyword)
      
      if (response.code === 'SUCCESS') {
        return response.data
      } else {
        throw new Error(response.message || '搜索文档失败')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '搜索文档失败')
      return []
    } finally {
      setLoading(false)
    }
  }

  // 添加到搜索历史
  const addToHistory = (keyword: string) => {
    if (!keyword.trim()) return
    
    // 移除重复项
    const filtered = searchHistory.value.filter(item => item !== keyword)
    // 添加到开头
    searchHistory.value = [keyword, ...filtered].slice(0, 10) // 最多保存10条历史
    
    // 保存到localStorage
    try {
      localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
    } catch (error) {
      console.warn('Failed to save search history to localStorage:', error)
    }
  }

  // 从localStorage加载搜索历史
  const loadSearchHistory = () => {
    try {
      const saved = localStorage.getItem('search_history')
      if (saved) {
        searchHistory.value = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load search history from localStorage:', error)
      searchHistory.value = []
    }
  }

  // 清除搜索历史
  const clearSearchHistory = () => {
    searchHistory.value = []
    try {
      localStorage.removeItem('search_history')
    } catch (error) {
      console.warn('Failed to clear search history from localStorage:', error)
    }
  }

  // 删除单条搜索历史
  const removeFromHistory = (keyword: string) => {
    searchHistory.value = searchHistory.value.filter(item => item !== keyword)
    try {
      localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
    } catch (error) {
      console.warn('Failed to update search history in localStorage:', error)
    }
  }

  // 重置store
  const reset = () => {
    loading.value = false
    error.value = null
    searchResults.value = null
    currentKeyword.value = ''
    searchType.value = 'ALL'
  }

  return {
    // 状态
    loading,
    error,
    searchResults,
    searchHistory,
    currentKeyword,
    searchType,
    
    // 计算属性
    hasResults,
    workspaceResults,
    documentResults,
    totalResults,
    
    // 方法
    setLoading,
    setError,
    clearError,
    clearResults,
    performGlobalSearch,
    searchWorkspaces,
    searchDocuments,
    addToHistory,
    loadSearchHistory,
    clearSearchHistory,
    removeFromHistory,
    reset
  }
})
