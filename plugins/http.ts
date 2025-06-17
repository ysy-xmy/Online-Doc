import type { FetchOptions, FetchResponse } from 'ofetch'

export default defineNuxtPlugin((nuxtApp) => {
  // 获取运行时配置的基地址
  const { public: { apiBase } } = useRuntimeConfig()

  // 显式声明 $fetch 类型
  const $fetchInstance = $fetch as unknown as typeof $fetch & {
    create: (options: {
      baseURL?: string,
      onRequest?: (context: { options: FetchOptions }) => void,
      onResponse?: (context: { response: FetchResponse<unknown> }) => void,
      onResponseError?: (context: { response: FetchResponse<unknown> }) => void
    }) => typeof $fetch
  }

  // 请求拦截器
  const fetchInstance = $fetchInstance.create({
    // 设置基地址
    baseURL: apiBase,

    onRequest({ options }) {
      // 在这里可以修改请求配置
      const token = useCookie('token')
      if (token.value) {
        // 使用 Headers 构造函数
        options.headers = new Headers(options.headers)
        options.headers.set('Authorization', `Bearer ${token.value}`)
      }
      
      console.log('请求拦截器：', options)
    },

    // 响应拦截器
    onResponse({ response }) {
      // 在这里可以处理响应数据
      console.log('响应拦截器：', response)
      
      // 可以在这里进行统一的错误处理
      if (response.status !== 200) {
        console.error('请求错误', response)
      }
    },

    // 错误拦截器
    onResponseError({ response }) {
      // 处理响应错误
      console.error('响应错误：', response)
      
      // 可以根据错误状态码做不同处理
      switch (response.status) {
        case 401:
          // 未授权，可以跳转到登录页
          navigateTo('/login')
          break
        case 403:
          // forbidden
          console.error('没有权限')
          break
        case 500:
          // 服务器错误
          console.error('服务器错误')
          break
      }
    }
  })

  return {
    provide: {
      fetchInstance
    }
  }
}) 