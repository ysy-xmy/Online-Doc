// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config';
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    // 守卫组件
    compatibilityDate: "2025-05-15",
    devtools: { enabled: true },
    css: ["~/assets/css/main.css", "quill/dist/quill.snow.css"],
    modules: [
        '@pinia/nuxt',
        '@pinia-plugin-persistedstate/nuxt',
        '@nuxt/icon'
    ],
    pinia: {
        autoImports: [
            // 自动引入 `defineStore()`
            'defineStore',
            // 自动引入 `defineStore()` 并重命名为 `definePiniaStore()`
            ['defineStore', 'definePiniaStore']
        ],
        storesDirs: ['~/stores/**']
    } as any,
    vite: {
        plugins: [
            tailwindcss() as any
        ]
    },
    plugins: [
        '~/plugins/quill.js'
    ],
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
            //8.134.200.53
            // API 基地址
            apiBase: process.env.API_BASE_URL || 'http://8.134.200.53:8080/api',

            // WebSocket 服务器地址
            websocketUrl: process.env.WEBSOCKET_URL || 'ws://8.134.200.53:1838'
        }
    },
    // 也可以在这里配置 fetch 选项
    nitro: {
        routeRules: {
            '/api/**': {
                proxy: process.env.API_BASE_URL || 'http://8.134.200.53:8080'
            },
            '/**': { 
                ssr: true,
                static: true
            },
            // 移除具体的文档代理，改用通用处理
            '/document/**': {
                ssr: true,
                static: true
            },
            '/knowledgeBase/**': {
                ssr: true,
                static: true
            },
        },
        devProxy: {
            '/api/**': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                prependPath: false
            }
        },
        // 完全禁用预渲染，避免Windows中文路径问题
        prerender: {
            ignore: ["**"]
        }
    },
    ssr: true, // 确保 SSR 模式启用
})
