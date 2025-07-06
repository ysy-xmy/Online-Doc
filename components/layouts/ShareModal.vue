<template>
  <div>
    <!-- daisyui 弹窗 -->
    <input type="checkbox" id="share-modal" class="modal-toggle" />
    <div class="modal">
      <div class="modal-box relative">
        <label
          for="share-modal"
          class="btn btn-sm btn-circle absolute right-2 top-2"
          >✕</label
        >
        <h3 class="text-lg font-bold">文档分享</h3>

        <!-- 邀请他人部分 -->
        <div class="mt-4">
          <h4 class="text-md font-semibold">邀请他人</h4>

          <div class="form-control mt-2">
            <label class="label">
              <span class="label-text mr-2 w-24">用户名</span>
            </label>
            <input
              type="text"
              placeholder="输入用户名"
              class="input input-bordered"
              v-model="inviteeUsername"
              @input="validateAndCheckUser"
              @blur="validateAndCheckUser"
            />
            <div v-if="usernameError" class="text-red-500 text-sm mt-1">
              {{ usernameError }}
            </div>
            <div v-if="userCheckMessage" class="text-blue-500 text-sm mt-1">
              {{ userCheckMessage }}
            </div>
          </div>

          <div class="form-control mt-2">
            <label class="label">
              <span class="label-text mr-2 w-24">权限</span>
            </label>
            <select
              class="select select-bordered"
              v-model="invitationRole"
            >
              <option value="VIEWER">查看</option>
              <option value="COMMENTER">评论</option>
              <option value="EDITOR">编辑</option>
            </select>
          </div>

          <button
            class="btn btn-primary btn-sm mt-2"
            @click="inviteUser"
            :disabled="!canInvite"
          >
            发送邀请
          </button>
        </div>


      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "@/stores/user";
import { documentShareApi } from "~/api/collaborators";

const route = useRoute();
const documentId = route.params.id;
console.log("文档ID:", documentId);
const userStore = useUserStore();
const currentUserId = userStore.getUserInfo().id;

// 邀请他人相关数据
const inviteeUsername = ref(""); // 受邀人用户名
const invitationRole = ref("VIEWER"); // 受邀人权限
const usernameError = ref(""); // 用户名错误信息
const userCheckMessage = ref(""); // 用户检查消息
const isCheckingUser = ref(false); // 是否正在检查用户
const userExists = ref(false); // 用户是否存在

// 计算是否可以发送邀请
const canInvite = computed(() => {
  return inviteeUsername.value.trim() &&
         !usernameError.value &&
         userExists.value &&
         !isCheckingUser.value;
});

// 防抖函数
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 用户名验证和检查函数
const validateAndCheckUser = debounce(async () => {
  const username = inviteeUsername.value.trim();

  // 重置状态
  usernameError.value = "";
  userCheckMessage.value = "";
  userExists.value = false;

  if (!username) {
    usernameError.value = "用户名不能为空";
    return;
  }

  // 用户名格式验证：只允许字母、数字、下划线，长度3-20位
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    usernameError.value = "用户名只能包含字母、数字、下划线，长度3-20位";
    return;
  }

  // 检查用户是否存在
  try {
    isCheckingUser.value = true;
    userCheckMessage.value = "正在检查用户...";

    // 调用API检查用户是否存在
    const response = await $fetch(`/api/users/check-username/${username}`, {
      method: 'GET',
      baseURL: 'http://8.134.200.53:8080'
    });

    if (response.success && response.data) {
      userExists.value = true;
      userCheckMessage.value = "✓ 用户存在";
    } else {
      usernameError.value = "用户不存在";
    }
  } catch (error) {
    console.error("检查用户失败:", error);
    usernameError.value = "检查用户失败，请重试";
  } finally {
    isCheckingUser.value = false;
    if (!usernameError.value && !userExists.value) {
      userCheckMessage.value = "";
    }
  }
}, 500);

// 邀请他人方法
const inviteUser = async () => {
  if (!canInvite.value) {
    alert("请输入有效的用户名");
    return;
  }

  try {
    console.log("发送邀请: 文档ID=", documentId, "用户名=", inviteeUsername.value);

    const response = await documentShareApi.shareDocument(
      Number(documentId),
      {
        inviteeUsername: inviteeUsername.value,
        role: invitationRole.value,
        message: "", // 可选消息
        expirationDays: 7 // 默认7天过期
      }
    );

    console.log("邀请发送成功:", response);
    alert("邀请发送成功！");

    // 清空表单
    inviteeUsername.value = "";
    invitationRole.value = "VIEWER";
    usernameError.value = "";
    userCheckMessage.value = "";
    userExists.value = false;

  } catch (error) {
    console.error("邀请发送失败:", error);

    // 处理具体的错误信息
    if (error.response?.data?.message) {
      alert(`邀请发送失败：${error.response.data.message}`);
    } else if (error.message) {
      alert(`邀请发送失败：${error.message}`);
    } else {
      alert("邀请发送失败，请重试！");
    }
  }
};


</script>
<style scoped></style>
