// API配置文件
export const API_CONFIG = {
  BASE_URL: 'http://8.134.200.53:8080/api',
  TIMEOUT: 10000,
  RETRY_COUNT: 3,
}

export interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

// 获取token的辅助函数
export const getAuthToken = () => {
  const token = useCookie('token')
  return token.value
}

// 通用请求函数
export async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken()
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 401) {
        // Token过期，跳转到登录页
        await navigateTo('/Login')
        throw new Error('登录已过期，请重新登录')
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    // 检查业务状态码
    if (result.code !== 'SUCCESS') {
      throw new Error(result.message || '请求失败')
    }

    return result
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      throw new Error('请求超时')
    }
    
    throw error
  }
}

// 带重试的请求函数
export async function apiRequestWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = API_CONFIG.RETRY_COUNT
): Promise<ApiResponse<T>> {
  let lastError: Error
  
  for (let i = 0; i <= retryCount; i++) {
    try {
      return await apiRequest<T>(endpoint, options)
    } catch (error) {
      lastError = error as Error
      
      // 如果是认证错误或客户端错误，不重试
      if (error.message.includes('401') || error.message.includes('400')) {
        throw error
      }
      
      // 最后一次重试失败
      if (i === retryCount) {
        throw lastError
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  
  throw lastError!
}

// 文件上传请求
export async function uploadFile(
  endpoint: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<any>> {
  const token = getAuthToken()
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          resolve(result)
        } catch (error) {
          reject(new Error('响应解析失败'))
        }
      } else {
        reject(new Error(`上传失败: ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('网络错误'))
    })

    xhr.addEventListener('timeout', () => {
      reject(new Error('上传超时'))
    })

    xhr.open('POST', `${API_CONFIG.BASE_URL}${endpoint}`)
    
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }
    
    xhr.timeout = API_CONFIG.TIMEOUT
    xhr.send(formData)
  })
}

// 下载文件
export async function downloadFile(
  endpoint: string,
  filename?: string
): Promise<void> {
  const token = getAuthToken()
  
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    throw new Error(`下载失败: ${response.status}`)
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'download'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
