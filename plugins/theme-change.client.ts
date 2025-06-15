import { themeChange } from 'theme-change'

export default defineNuxtPlugin((nuxtApp) => {
  // 在客户端仅执行
  if (process.client) {
    // 初始化主题切换
    themeChange()

    // 检查并设置初始主题
    const savedTheme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
    
    // 确保 body 上也设置主题属性
    
    document.body.setAttribute('data-theme', savedTheme)
  }
}) 