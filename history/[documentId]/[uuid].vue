<template>
  <div class="bg-base-100 p-4 relative">
    <!-- 头部信息和按钮 -->
    <div class="flex items-center space-x-2 mb-4 justify-between">
      <div class="flex items-center space-x-2">
        <button
            @click="goBack"
            class="btn btn-ghost btn-sm btn-circle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div class="flex flex-col items-start">
          <h2 class="text-xl font-bold text-base-content" v-if="historyTitle">{{ historyTitle }}</h2>
          <div class="text-gray-500 text-sm" v-if="creatorName || formattedCreateTime">
            {{ creatorName }} | {{ formattedCreateTime }}
          </div>
        </div>
      </div>
      <!-- 还原历史版本按钮 -->
      <button
          class="btn btn-primary btn-sm"
          @click="restoreHistoryVersion"
      >
        还原历史版本
      </button>
    </div>
    <!-- 添加滚动条样式 -->
    <div v-if="parsedHistoryContent" class="overflow-x-auto overflow-y-auto max-h-[700px]">
      <div v-html="parsedHistoryContent"></div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useDocumentStore } from '@/stores/document';
import { ref, onMounted, computed } from 'vue';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const documentStore = useDocumentStore();
const historyTitle = ref('');
const historyContent = ref('');
const parsedHistoryContent = ref('');
const creatorName = ref('');
const createTime = ref('');
const param1 = route.params.documentId;
const param2 = route.params.uuid;
const loading = ref(false);

// 格式化日期
const formattedCreateTime = computed(() => {
  if (!createTime.value) return '';
  return dayjs(createTime.value).format('YYYY-MM-DD HH:mm:ss');
});

//获取版本详情
const fetchVersionDetails = async (param1, param2) => {
  try {
    console.log("route.params", route.params);
    console.log("param2", param2);
    const apiUrl = `http://8.134.200.53:8080/api/documents/${param1}/versions/${param2}`;

    const tokenCookie = useCookie('token');
    const token = tokenCookie.value;

    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json'
    };

    console.log("请求URL:", apiUrl);
    console.log("请求头:", headers);

    const { data, error } = await useFetch(apiUrl, {
      headers,
      method: 'GET'
    });

    if (error.value) {
      throw new Error(error.value.message || '获取版本详情失败');
    }

    console.log("API响应数据:", data.value);

    if (!data.value || !data.value.success || !data.value.data) {
      throw new Error('接口返回数据格式不正确');
    }

    return data.value.data;
  } catch (error) {
    console.error('获取版本详情失败:', error);
    throw error;
  }
};

// 提取 <p> 标签内容的函数
const extractParagraphs = (html) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const paragraphs = tempDiv.querySelectorAll('p');
  let result = '';
  paragraphs.forEach((p) => {
    result += p.outerHTML;
  });
  return result;
};

// 加载历史数据
const loadHistoryData = async () => {
  loading.value = true;
  try {
    //获取版本详情
    const versionData = await fetchVersionDetails(param1, param2);

    console.log("完整的版本数据:", versionData);
    historyTitle.value = versionData.title;
    historyContent.value = versionData.content;
    parsedHistoryContent.value = extractParagraphs(historyContent.value);

    // 提取用户名和创建时间
    creatorName.value = versionData.creator?.username || '未知用户';
    createTime.value = versionData.createdAt || '';

    console.log("历史版本标题：", historyTitle.value);
    console.log("历史版本内容：", historyContent.value);
    console.log("创建者：", creatorName.value);
    console.log("创建时间：", createTime.value);
    console.log("格式化后的创建时间：", formattedCreateTime.value);
  } catch (error) {
    console.error('加载历史版本失败:', error);
  } finally {
    loading.value = false;
  }
};

import { useEditorStore } from '~/stores/editorStore.js';

const editorStore = useEditorStore();

const goBack = () => {
  router.back();
};

const restoreHistoryVersion = async () => {
  try {
    // 调用版本回滚接口
    const apiUrl = `http://8.134.200.53:8080/api/documents/${param1}/versions/${param2}/rollback`;

    const tokenCookie = useCookie('token');
    const token = tokenCookie.value;

    const headers = {
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      'Content-Type': 'application/json'
    };

    const requestBody = {
      description: '回滚到历史版本'
    };

    console.log("还原历史版本请求URL:", apiUrl);
    console.log("还原历史版本请求头:", headers);
    console.log("还原历史版本请求体:", requestBody);

    const {data, error} = await useFetch(apiUrl, {
      headers,
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    if (error.value) {
      throw new Error(error.value.message || '版本回滚失败');
    }

    console.log("还原历史版本响应:", data.value);

    if (!data.value || !data.value.success) {
      throw new Error('接口返回数据格式不正确或回滚失败');
    }

    // 设置编辑器内容为历史版本内容
    editorStore.setEditorContent(historyContent.value);

    // 返回上一页
    router.back();
  } catch (error) {
    console.error('还原历史版本失败', error);
  }
};

onMounted(() => {
  loadHistoryData();
});
</script>
