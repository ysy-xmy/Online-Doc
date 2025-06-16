// 定义通用 API 请求方法
const apiUtils = {
  // 获取列表数据的通用方法
  async getList(endpoint, params = {}) {
    const { $fetchInstance } = useNuxtApp()
    
    try {
      const response = await $fetchInstance(endpoint, {
        method: 'GET',
        params: params
      })
      return response
    } catch (error) {
      console.error(`获取 ${endpoint} 列表失败`, error)
      throw error
    }
  },

  // 创建资源的通用方法
  async create(endpoint, data) {
    const { $fetchInstance } = useNuxtApp()
    
    try {
      const response = await $fetchInstance(endpoint, {
        method: 'POST',
        body: data
      })
      return response
    } catch (error) {
      console.error(`创建 ${endpoint} 资源失败`, error)
      throw error
    }
  },

  // 更新资源的通用方法
  async update(endpoint, id, data) {
    const { $fetchInstance } = useNuxtApp()
    
    try {
      const response = await $fetchInstance(`${endpoint}/${id}`, {
        method: 'PUT',
        body: data
      })
      return response
    } catch (error) {
      console.error(`更新 ${endpoint} 资源失败`, error)
      throw error
    }
  },

  // 删除资源的通用方法
  async delete(endpoint, id) {
    const { $fetchInstance } = useNuxtApp()
    
    try {
      const response = await $fetchInstance(`${endpoint}/${id}`, {
        method: 'DELETE'
      })
      return response
    } catch (error) {
      console.error(`删除 ${endpoint} 资源失败`, error)
      throw error
    }
  },

  // 获取单个资源详情的方法
  async getDetail(endpoint, id) {
    const { $fetchInstance } = useNuxtApp()
    
    try {
      const response = await $fetchInstance(`${endpoint}/${id}`)
      return response
    } catch (error) {
      console.error(`获取 ${endpoint} 详情失败`, error)
      throw error
    }
  }
}

// 具体业务 API 示例
export const productApi = {
  // 获取产品列表
  async getProductList(params) {
    return apiUtils.getList('/products', params)
  },

  // 创建新产品
  async createProduct(productData) {
    return apiUtils.create('/products', productData)
  },

  // 获取产品详情
  async getProductDetail(productId) {
    return apiUtils.getDetail('/products', productId)
  }
}
