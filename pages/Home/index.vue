<template>
  <main class="h-full pt-20">
    <div class="min-h-full flex flex-col px-4">
      <!-- 标题和行动号召部分 -->
      <div
        class="flex flex-col items-center justify-center md:justify-start text-center gap-y-8 flex-1 pb-10">
        <div class="max-w-3xl space-y-4">
          <h1 class="text-3xl sm:text-5xl md:text-6xl font-bold">
            现代化的在线文档协作平台
            <span class="underline">ThinkSync</span>
          </h1>
          <h3 class="text-base sm:text-xl md:text-2xl font-medium">
            基于 Nuxt3 + Vue3
            的知识管理与团队协作解决方案，让知识流动更高效、更智能
          </h3>
          <button
            @click="handleStartUsing"
            class="btn btn-primary inline-flex items-center justify-center gap-2">
            开始使用
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-arrow-right w-4 h-4 ml-2">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
        </div>

        <!-- 图片展示区 -->
        <div class="flex flex-col items-center justify-center max-w-5xl">
          <div class="flex items-center">
            <div
              class="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] md:h-[400px] md:w-[400px]">
              <img
                :src="'https://picsum.photos/400/400'"
                alt="Documents"
                class="object-cover rounded-lg shadow-xl" />
            </div>
            <div class="relative w-[400px] h-[400px] hidden md:block ml-4">
              <img
                :src="'https://picsum.photos/400/400'"
                alt="Reading"
                class="object-cover rounded-lg shadow-xl" />
            </div>
          </div>
        </div>
      </div>

      <!-- 功能特点 -->
      <section class="w-full py-12 md:py-24 lg:py-32" id="features">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-16">
            <h2
              class="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight sm:text-4xl">
              ✨ 主要功能
            </h2>
            <p
              class="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              ThinkSync 提供全面的协作工具，助力团队高效沟通与知识管理
            </p>
          </div>

          <div class="space-y-20 md:space-y-32">
            <!-- 功能1 -->
            <div class="flex flex-col gap-8 md:gap-12 md:flex-row">
              <div
                class="flex-1 md:w-1/2 flex flex-col justify-center space-y-4">
                <h3
                  class="text-2xl font-semibold text-gray-900 dark:text-gray-200">
                  🗂️ 知识库管理
                </h3>
                <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                  轻松创建、管理知识库，灵活设置权限，构建团队专属知识体系
                </p>
              </div>
              <div class="flex-1 md:w-1/2">
                <div
                  class="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <img
                    :src="'https://picsum.photos/600/400'"
                    alt="知识库管理"
                    class="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            <!-- 功能2 -->
            <div class="flex flex-col gap-8 md:gap-12 md:flex-row-reverse">
              <div
                class="flex-1 md:w-1/2 flex flex-col justify-center space-y-4">
                <h3
                  class="text-2xl font-semibold text-gray-900 dark:text-gray-200">
                  📝 文档协同编辑
                </h3>
                <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                  集成 Quill 和 Yjs，支持实时多人协作编辑，打破时空限制
                </p>
              </div>
              <div class="flex-1 md:w-1/2">
                <div
                  class="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <img
                    :src="'https://picsum.photos/600/400'"
                    alt="文档协同编辑"
                    class="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 在原有代码的适当位置添加这个部分 -->
      <div
        class="flex flex-col lg:flex-row rounded-lg overflow-hidden transition-colors duration-300">
        <div class="w-full lg:w-1/2 order-1 lg:order-none">
          <img
            src="https://picsum.photos/600/400"
            alt="Wiki Template"
            class="w-full h-full object-cover" />
        </div>
        <div
          class="w-full lg:w-1/2 p-4 lg:p-8 order-2 lg:order-none text-center">
          <h2
            class="text-xl lg:text-2xl font-bold mb-4 lg:mb-6 text-gray-800 dark:text-gray-100">
            探索ThinkSync的无限可能
          </h2>
          <div class="space-y-4 lg:space-y-6">
            <div
              class="p-4 lg:p-6 bg-white dark:bg-gray-700 rounded-lg transition-colors duration-300">
              <h3
                class="text-base lg:text-lg font-semibold mb-2 text-blue-600 dark:text-blue-400">
                团队协作新方式
              </h3>
              <p
                class="text-sm lg:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                打破信息孤岛，实现跨部门无缝协作，让项目进展一目了然。
              </p>
            </div>
            <div
              class="p-4 lg:p-6 bg-white dark:bg-gray-700 rounded-lg transition-colors duration-300">
              <h3
                class="text-base lg:text-lg font-semibold mb-2 text-green-600 dark:text-green-400">
                知识沉淀与传承
              </h3>
              <p
                class="text-sm lg:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                构建企业知识库，让经验与智慧得以积累和传承。
              </p>
            </div>
            <div
              class="p-4 lg:p-6 bg-white dark:bg-gray-700 rounded-lg transition-colors duration-300">
              <h3
                class="text-base lg:text-lg font-semibold mb-2 text-purple-600 dark:text-purple-400">
                个人成长加速器
              </h3>
              <p
                class="text-sm lg:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                打造个人知识体系，支持Markdown，让学习笔记更专业。
              </p>
            </div>
          </div>
        </div>
      </div>
      <!-- 项目成员 -->
      <div class="container mx-auto px-4 py-8">
        <h2 class="text-center text-2xl font-bold mb-8 dark:text-white">
          项目成员
        </h2>
        <div class="flex justify-center flex-wrap gap-8">
          <div
            v-for="member in teamMembers"
            :key="member.name"
            class="flex flex-col items-center space-y-2">
            <div
              class="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                :src="member.avatar"
                :alt="member.name"
                class="w-full h-full object-cover" />
            </div>
            <span class="text-center text-orange-500 dark:text-orange-300">
              {{ member.name }}
            </span>
          </div>
        </div>
      </div>
      <!-- 技术栈展示 -->
      <section class="w-full py-16 bg-gray-50 dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2
              class="text-3xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-4xl">
              🛠️ 技术栈
            </h2>
            <p class="mt-4 text-xl text-gray-600 dark:text-gray-400">
              现代化技术，极致性能与开发体验
            </p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div
              v-for="tech in techStack"
              :key="tech.name"
              class="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md hover:shadow-xl transition-all">
              <div class="text-3xl mb-4">{{ tech.icon }}</div>
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ tech.name }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {{ tech.description }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { defineEmits } from 'vue'

const emit = defineEmits(['hideHome'])

const handleStartUsing = () => {
  emit('hideHome')
}

const teamMembers = [
  {
    name: "一勺",
    avatar: "https://picsum.photos/200/200",
  },
  {
    name: "轻叶",
    avatar: "https://picsum.photos/201/201",
  },
]

const techStack = [
  {
    name: "Nuxt3/Vue3",
    icon: "🖥️",
    description: "现代前端框架",
  },
  {
    name: "Pinia",
    icon: "🗃️",
    description: "状态管理",
  },
  {
    name: "TailwindCSS",
    icon: "🎨",
    description: "原子化 CSS",
  },
  {
    name: "daisyUI",
    icon: "🌈",
    description: "主题与组件库",
  },
]
</script>

<style scoped>
/* 可以添加一些自定义样式 */
</style>
