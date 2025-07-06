// 用户相关API类型定义
export interface UserDTO {
  id: number
  username: string
  email?: string
  nickname?: string
  avatar?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED'
  createdAt: string
  updatedAt: string
}

export interface UserUpdateRequest {
  nickname?: string
  avatar?: string
  email?: string
}

export interface UserPasswordUpdateRequest {
  oldPassword: string
  newPassword: string
}

export interface UserResponse {
  code: string
  message: string
  data: UserDTO
}

import { apiRequest, type ApiResponse } from './config'

// 用户API函数
export const userApi = {
  /**
   * 获取当前登录用户信息
   */
  async getCurrentUser(): Promise<ApiResponse<UserDTO>> {
    return apiRequest('/auth/me')
  },

}