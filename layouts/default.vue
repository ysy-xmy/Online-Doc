<template>
    <div class="flex h-screen bg-base-100">
        <!-- 左侧侧边栏 -->
        <Sidebar />

        <!-- 主内容区 -->
        <div class="flex-1 flex flex-col shadow-lg w-0">
            <!-- 顶部导航栏 -->
            <div
                class="navbar bg-base-100 border-b border-base-content/10 px-4 py-2 shadow-sm"
            >
                <div class="flex-1 relative">
                    <div class="form-control">
                        <div class="input-group">
                            <input
                                ref="searchInput"
                                v-model="searchKeyword"
                                type="text"
                                placeholder="搜索文档或知识库..."
                                class="input input-bordered input-sm w-full max-w-xs bg-base-200 focus:outline-primary text-base-content"
                                @input="handleSearchInput"
                                @focus="handleSearchFocus"
                                @blur="handleSearchBlur"
                                @keydown="handleKeydown"
                            />
                            <button
                                class="btn btn-square btn-sm"
                                @click="handleSearchSubmit"
                                :disabled="!searchKeyword.trim()"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- 搜索下拉面板 -->
                    <div
                        v-if="showSearchDropdown"
                        class="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-w-xs"
                        @mousedown.prevent
                    >
                        <!-- 搜索历史 -->
                        <div v-if="searchHistory.length > 0 && !searchKeyword.trim()" class="p-3">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-base-content/70">最近搜索</span>
                                <button
                                    class="text-xs text-base-content/50 hover:text-base-content/70"
                                    @click="clearSearchHistory"
                                >
                                    清除
                                </button>
                            </div>
                            <div class="space-y-1">
                                <div
                                    v-for="(keyword, index) in searchHistory.slice(0, 5)"
                                    :key="keyword"
                                    class="flex items-center justify-between p-2 hover:bg-base-200 rounded cursor-pointer text-sm"
                                    :class="{ 'bg-base-200': selectedIndex === index }"
                                    @click="selectHistoryKeyword(keyword)"
                                >
                                    <div class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{{ keyword }}</span>
                                    </div>
                                    <button
                                        class="text-base-content/30 hover:text-base-content/60"
                                        @click.stop="removeFromHistory(keyword)"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- 实时搜索结果 -->
                        <div v-if="searchKeyword.trim() && (searchSuggestions.workspaces.length > 0 || searchSuggestions.documents.length > 0)">
                            <!-- 搜索建议头部 -->
                            <div class="px-3 py-2 border-b border-base-300">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-base-content/70">在与我相关 搜索 "{{ searchKeyword }}"</span>
                                    <button
                                        class="text-xs text-primary hover:text-primary/80"
                                        @click="handleSearchSubmit"
                                    >
                                        跳转
                                    </button>
                                </div>
                            </div>

                            <!-- 知识库建议 -->
                            <div v-if="searchSuggestions.workspaces.length > 0">
                                <div class="px-3 py-2 text-xs text-base-content/50 bg-base-50">知识库</div>
                                <div
                                    v-for="(workspace, index) in searchSuggestions.workspaces.slice(0, 3)"
                                    :key="workspace.id"
                                    class="flex items-center p-3 hover:bg-base-200 cursor-pointer"
                                    :class="{ 'bg-base-200': selectedIndex === searchHistory.length + index }"
                                    @click="navigateToWorkspace(workspace.id)"
                                >
                                    <div class="w-6 h-6 bg-primary/10 rounded flex items-center justify-center mr-3">
                                        <span class="text-sm">{{ workspace.icon || '📁' }}</span>
                                    </div>
                                    <div class="flex-1">
                                        <div class="text-sm font-medium">{{ workspace.name }}</div>
                                        <div v-if="workspace.description && workspace.description.trim()" class="text-xs text-base-content/60 truncate">
                                            {{ workspace.description }}
                                        </div>
                                        <div v-else class="text-xs text-base-content/60 truncate">
                                            暂无描述
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 文档建议 -->
                            <div v-if="searchSuggestions.documents.length > 0">
                                <div class="px-3 py-2 text-xs text-base-content/50 bg-base-50">最近的文档</div>
                                <div
                                    v-for="(document, index) in searchSuggestions.documents.slice(0, 3)"
                                    :key="document.id"
                                    class="flex items-center p-3 hover:bg-base-200 cursor-pointer"
                                    :class="{ 'bg-base-200': selectedIndex === searchHistory.length + searchSuggestions.workspaces.length + index }"
                                    @click="navigateToDocument(document.id)"
                                >
                                    <div class="w-6 h-6 bg-info/10 rounded flex items-center justify-center mr-3">
                                        <span class="text-sm">{{ getDocumentIcon(document.type) }}</span>
                                    </div>
                                    <div class="flex-1">
                                        <div class="text-sm font-medium">{{ document.title }}</div>
                                        <div class="text-xs text-base-content/60">
                                            {{ document.workspaceName }} · {{ formatDate(document.updatedAt) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 无搜索结果 -->
                        <div v-else-if="searchKeyword.trim() && searchLoading === false" class="p-6 text-center">
                            <div class="text-sm text-base-content/60">未找到相关内容</div>
                            <div class="text-xs text-base-content/40 mt-1">尝试使用不同的关键词</div>
                        </div>

                        <!-- 搜索加载状态 -->
                        <div v-else-if="searchLoading" class="p-6 text-center">
                            <span class="loading loading-spinner loading-sm"></span>
                            <div class="text-xs text-base-content/60 mt-2">搜索中...</div>
                        </div>
                    </div>
                </div>

                <!-- 主题切换开关 -->
                <ThemeChange />
                <div class="text-base-content text-xl mx-2 text-bold">
                {{ userInfo.username }}
          </div>
              <div class="flex-none">

                  <div class="dropdown dropdown-end">
                      <div
                          tabindex="0"
                          role="button"
                          class="btn btn-ghost btn-circle avatar"
                      >

                          <div
                              class="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
                          >
                              <img
                                  alt="用户头像"
                                  :src="userInfo.avatar || '/avatar_1.webp'"
                                  class="object-cover"
                                  @error="handleAvatarError"
                              />
                          </div>
                      </div>
                      <ul
                          tabindex="0"
                          class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
                      >
                          <li>
                              <a
                                  class="text-base-content"
                                  @click="showUserInfo"
                                  >个人资料</a
                              >
                          </li>
                          <li>
                              <a class="text-base-content" @click="logout"
                                  >退出</a
                              >
                          </li>
                      </ul>
                  </div>
              </div>
          </div>

          <!-- 主内容插槽，占据剩余空间 -->
          <div class="flex-1 overflow-auto p-6 bg-base-200">
              <div
                  class="max-w-full mx-auto bg-base-100 rounded-xl shadow-md overflow-hidden h-full"
              >
                  <slot />
              </div>
          </div>
      </div>

    <UserInfo v-if="isUserInfoVisible" @close="hideUserInfo" />
    <!-- 搜索结果弹窗 -->
    <div v-if="showSearchModal" class="modal modal-open">
        <div class="modal-box w-11/12 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <!-- 弹窗头部 -->
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-lg">搜索结果：{{ currentSearchKeyword }}</h3>
                <button class="btn btn-sm btn-circle btn-ghost" @click="closeSearchModal">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- 搜索结果统计 -->
            <div class="mb-4 text-sm text-base-content/70">
                找到 {{ totalResults }} 个结果
                <span v-if="workspaceResults.length > 0">（{{ workspaceResults.length }} 个知识库</span><span v-if="workspaceResults.length > 0 && documentResults.length > 0">，</span><span v-if="documentResults.length > 0">{{ documentResults.length }} 个文档</span><span v-if="workspaceResults.length > 0 || documentResults.length > 0">）</span>
            </div>

            <!-- 搜索结果内容 -->
            <div class="flex-1 overflow-y-auto">
                <!-- 加载状态 -->
                <div v-if="searchLoading" class="flex justify-center py-12">
                    <span class="loading loading-spinner loading-lg"></span>
                </div>

                <!-- 搜索结果 -->
                <div v-else-if="hasResults" class="space-y-6">
                    <!-- 知识库结果 -->
                    <div v-if="workspaceResults.length > 0">
                        <h4 class="text-md font-semibold mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            知识库
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div
                                v-for="workspace in workspaceResults"
                                :key="workspace.id"
                                class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer border"
                                @click="navigateToWorkspace(workspace.id)"
                            >
                                <div class="card-body p-3">
                                    <h5 class="card-title text-sm flex items-center">
                                        <span class="text-base mr-2">{{ workspace.icon || '📁' }}</span>
                                        {{ workspace.name }}
                                    </h5>
                                    <p v-if="workspace.description" class="text-xs text-base-content/70 line-clamp-2">
                                        {{ workspace.description }}
                                    </p>
                                    <div class="flex items-center justify-between mt-2 text-xs text-base-content/60">
                                        <span>{{ formatDate(workspace.updatedAt) }}</span>
                                        <div class="flex items-center space-x-2">
                                            <span v-if="workspace.documentCount">{{ workspace.documentCount }} 文档</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 文档结果 -->
                    <div v-if="documentResults.length > 0">
                        <h4 class="text-md font-semibold mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            文档
                        </h4>
                        <div class="space-y-3">
                            <div
                                v-for="document in documentResults"
                                :key="document.id"
                                class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer border"
                                @click="navigateToDocument(document.id)"
                            >
                                <div class="card-body p-3">
                                    <div class="flex items-start justify-between">
                                        <div class="flex-1">
                                            <h5 class="card-title text-sm flex items-center mb-1">
                                                <span class="text-base mr-2">{{ getDocumentIcon(document.type) }}</span>
                                                {{ document.title }}
                                                <div class="badge badge-xs badge-outline ml-2">
                                                    {{ getDocumentTypeText(document.type) }}
                                                </div>
                                            </h5>
                                            <p v-if="document.content" class="text-xs text-base-content/70 line-clamp-2 mb-2">
                                                {{ document.content }}
                                            </p>
                                            <div class="flex items-center space-x-3 text-xs text-base-content/60">
                                                <span>{{ document.workspaceName }}</span>
                                                <span>{{ document.creator.nickname || document.creator.username }}</span>
                                                <span>{{ formatDate(document.updatedAt) }}</span>
                                            </div>
                                        </div>
                                        <div class="badge badge-xs" :class="{
                                            'badge-success': document.status === 'PUBLISHED',
                                            'badge-warning': document.status === 'DRAFT',
                                            'badge-error': document.status === 'ARCHIVED'
                                        }">
                                            {{ getDocumentStatusText(document.status) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 无结果 -->
                <div v-else-if="!searchLoading" class="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p class="text-base mb-2">未找到相关结果</p>
                    <p class="text-sm text-base-content/60">尝试使用不同的关键词或检查拼写</p>
                </div>
            </div>
        </div>
        <div class="modal-backdrop" @click="closeSearchModal"></div>
  </div>
  </div>
</template>

<script setup>
import { useCookie } from "#app";
import { ref, onMounted, computed } from "vue";
import Sidebar from "~/components/layouts/Sidebar.vue";
import ThemeChange from "~/components/layouts/ThemeChange.vue";
import UserInfo from "~/components/common/userInfo.vue";
import { useUserStore } from "~/stores/user";
import { useSearchStore } from '~/stores/search'

const searchInput = ref(null)
const searchKeyword = ref('')
const showSearchDropdown = ref(false)
const showSearchModal = ref(false)
const currentSearchKeyword = ref('')
const searchLoading = ref(false)
const searchResults = ref(null)
const searchSuggestions = ref({ workspaces: [], documents: [] })
const searchHistory = ref([])
const selectedIndex = ref(-1)
const searchTimeout = ref(null)

const searchStore = useSearchStore()

// 初始化
//获取用户信息
const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);
// 用户信息显示状态
const isUserInfoVisible = ref(false);

// 显示用户信息s
const showUserInfo = () => {
  isUserInfoVisible.value = true;
};

// 隐藏用户信息
const hideUserInfo = () => {
  isUserInfoVisible.value = false;
};

//退出登录
const logout = () => {
  //删除cookie
  useCookie("token").value = null;
  navigateTo("/login");
};

// 头像加载错误处理
const handleAvatarError = (event) => {
  console.log('头像加载失败，使用默认头像');
  console.log('当前头像URL:', userInfo.value.avatar);
  event.target.src = '/avatar_1.webp';
};

// console.log("test1");

//获取用户信息（如果没有则获取）
const { $axios } = useNuxtApp();

onMounted(() => {
  loadSearchHistory()

  if (localStorage.getItem("userInfo") === null) {
      console.log('从API获取用户信息');
      $axios("/api/auth/me", {
          method: "GET",
      })
          .then((res) => {
              console.log('API返回的用户信息:', res.data);
              userStore.setUserInfo({
                  id: res.data.id,
                  username: res.data.username,
                  nickname: res.data.nickname,
                  avatar: res.data.avatar,
                  email: res.data.email || "",
                  color: `hsl(${Math.random() * 360}, 70%, 50%)`,
              });
          })
          .catch((err) => {
              console.log(err);
          });
  } else {
      // 从localStorage加载用户信息
  
  }

  // 添加调试信息
  setTimeout(() => {
      console.log('当前用户store状态:', userStore.userInfo.value);
      console.log('当前头像URL:', userStore.avatar.value);
  }, 1000);
});

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

// 处理搜索输入
const handleSearchInput = async () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  if (!searchKeyword.value.trim()) {
    searchSuggestions.value = { workspaces: [], documents: [] }
    return
  }

  // 防抖搜索
  searchTimeout.value = setTimeout(async () => {
    await performSuggestionSearch()
  }, 300)
}

// 处理搜索框焦点
const handleSearchFocus = () => {
  showSearchDropdown.value = true
  selectedIndex.value = -1
}

// 处理搜索框失焦
const handleSearchBlur = () => {
  // 延迟关闭，允许点击下拉项
  setTimeout(() => {
    showSearchDropdown.value = false
  }, 200)
}

// 处理键盘事件
const handleKeydown = (event) => {
  if (!showSearchDropdown.value) return

  const totalItems = searchHistory.value.length +
                    searchSuggestions.value.workspaces.length +
                    searchSuggestions.value.documents.length

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, totalItems - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0) {
        selectItemByIndex(selectedIndex.value)
      } else {
        handleSearchSubmit()
      }
      break
    case 'Escape':
      showSearchDropdown.value = false
      searchInput.value?.blur()
      break
  }
}

// 根据索引选择项目
const selectItemByIndex = (index) => {
  if (index < searchHistory.value.length) {
    // 选择历史记录
    selectHistoryKeyword(searchHistory.value[index])
  } else if (index < searchHistory.value.length + searchSuggestions.value.workspaces.length) {
    // 选择知识库
    const workspaceIndex = index - searchHistory.value.length
    navigateToWorkspace(searchSuggestions.value.workspaces[workspaceIndex].id)
  } else {
    // 选择文档
    const documentIndex = index - searchHistory.value.length - searchSuggestions.value.workspaces.length
    navigateToDocument(searchSuggestions.value.documents[documentIndex].id)
  }
}

// 处理搜索提交
const handleSearchSubmit = async () => {
  if (!searchKeyword.value.trim()) return

  addToHistory(searchKeyword.value.trim())
  currentSearchKeyword.value = searchKeyword.value.trim()
  showSearchDropdown.value = false
  showSearchModal.value = true
  searchKeyword.value = ''

  await performSearch()
}

// 执行搜索建议
const performSuggestionSearch = async () => {
  if (!searchKeyword.value.trim()) return

  try {
    searchLoading.value = true
    const result = await searchStore.performGlobalSearch({
      keyword: searchKeyword.value.trim(),
      type: 'ALL'
    })

    // 限制建议数量
    searchSuggestions.value = {
      workspaces: result.workspaces.slice(0, 3),
      documents: result.documents.slice(0, 3)
    }
  } catch (error) {
    console.error('搜索建议失败:', error)
    searchSuggestions.value = { workspaces: [], documents: [] }
  } finally {
    searchLoading.value = false
  }
}

// 执行完整搜索
const performSearch = async () => {
  if (!currentSearchKeyword.value) return

  try {
    searchLoading.value = true
    const result = await searchStore.performGlobalSearch({
      keyword: currentSearchKeyword.value,
      type: 'ALL'
    })
    searchResults.value = result
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    searchLoading.value = false
  }
}

// 选择历史关键词
const selectHistoryKeyword = (keyword) => {
  searchKeyword.value = keyword
  showSearchDropdown.value = false
  handleSearchSubmit()
}

// 加载搜索历史
const loadSearchHistory = () => {
  try {
    const saved = localStorage.getItem('search_history')
    if (saved) {
      searchHistory.value = JSON.parse(saved)
    }
  } catch (error) {
    console.warn('Failed to load search history:', error)
    searchHistory.value = []
  }
}

// 添加到搜索历史
const addToHistory = (keyword) => {
  if (!keyword.trim()) return

  // 移除重复项
  const filtered = searchHistory.value.filter(item => item !== keyword)
  // 添加到开头
  searchHistory.value = [keyword, ...filtered].slice(0, 10) // 最多保存10条历史

  // 保存到localStorage
  try {
    localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
  } catch (error) {
    console.warn('Failed to save search history:', error)
  }
}

// 清除搜索历史
const clearSearchHistory = () => {
  searchHistory.value = []
  try {
    localStorage.removeItem('search_history')
  } catch (error) {
    console.warn('Failed to clear search history:', error)
  }
}

// 从历史中删除单项
const removeFromHistory = (keyword) => {
  searchHistory.value = searchHistory.value.filter(item => item !== keyword)
  try {
    localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
  } catch (error) {
    console.warn('Failed to update search history:', error)
  }
}

// 关闭搜索弹窗
const closeSearchModal = () => {
  showSearchModal.value = false
  searchResults.value = null
  currentSearchKeyword.value = ''
  searchType.value = 'ALL'
}

// 导航到知识库
const navigateToWorkspace = (workspaceId) => {
  closeSearchModal()
  navigateTo(`/knowledgeBase/${workspaceId}`)
}

// 导航到文档
const navigateToDocument = (documentId) => {
  closeSearchModal()
  navigateTo(`/document/${documentId}`)
}

// 获取文档图标
const getDocumentIcon = (type) => {
  switch (type) {
    case 'RICH_TEXT': return '📄'
    case 'MARKDOWN': return '📝'
    case 'CODE': return '💻'
    default: return '📄'
  }
}

// 获取文档类型文本
const getDocumentTypeText = (type) => {
  switch (type) {
    case 'RICH_TEXT': return '富文本'
    case 'MARKDOWN': return 'Markdown'
    case 'CODE': return '代码'
    default: return '富文本'
  }
}

// 获取文档状态文本
const getDocumentStatusText = (status) => {
  switch (status) {
    case 'DRAFT': return '草稿'
    case 'PUBLISHED': return '已发布'
    case 'ARCHIVED': return '已归档'
    case 'DELETED': return '已删除'
    default: return '草稿'
  }
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' +
           date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.3);
}
</style>

<style>
.table th:first-child {
    width: 40%;
}
</style>
