// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: [[
    '@pinia/nuxt',

    {
      autoImports: [
        // 自动引入 `defineStore()`
        'defineStore',
        // 自动引入 `defineStore()` 并重命名为 `definePiniaStore()`
        ['defineStore', 'definePiniaStore'],
      ],
    }],'nuxt-icon'
  ],
  vite: {
    plugins: [
      tailwindcss(),
    ]
  },
  // 添加组件自动导入
  components: {
    dirs: ['~/components']
  },
  devServer: {
    port: 3000,
    host: 'localhost'
  },
  runtimeConfig: {
    public: {
      // API 基地址
      apiBase: process.env.API_BASE_URL || 'http://8.134.200.53:1838',
      
      // WebSocket 服务器地址
      websocketUrl: process.env.WEBSOCKET_URL || 'ws://8.134.200.53:1838'
    }
  },
  // 也可以在这里配置 fetch 选项
  nitro: {
    routeRules: {
      '/api/**': {
        proxy: process.env.API_BASE_URL || 'https://api.example.com'
      }
    }
  }
})
