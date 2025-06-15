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
})
