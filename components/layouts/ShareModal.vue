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
              <span class="label-text mr-2 w-24">邀请人数</span>
            </label>
            <input
              type="number"
              min="1"
              v-model="inviteeCount"
              class="input input-bordered"
              @blur="ensureMinimumValue1"
            />
          </div>

          <div
            v-for="(email, index) in inviteeEmails"
            :key="index"
            class="mt-4"
          >
            <div class="form-control mt-2">
              <label class="label">
                <span class="label-text mr-2 w-24"
                  >受邀人邮箱 {{ index + 1 }}</span
                >
              </label>
              <input
                type="email"
                placeholder="输入邮箱"
                class="input input-bordered"
                v-model="inviteeEmails[index]"
                @input="() => validateEmail(index)"
              />
              <div v-if="emailErrors[index]" class="text-red-500 text-sm mt-1">
                {{ emailErrors[index] }}
              </div>
            </div>
            <div class="form-control mt-2">
              <label class="label">
                <span class="label-text mr-2 w-24">权限</span>
              </label>
              <select
                class="select select-bordered"
                v-model="invitationRoles[index]"
              >
                <option value="VIEWER">查看</option>
                <option value="COMMENTER">评论</option>
                <option value="EDITOR">编辑</option>
              </select>
            </div>
          </div>

          <button class="btn btn-primary btn-sm mt-2" @click="inviteUser">
            发送邀请
          </button>
        </div>

        <!-- 生成分享链接部分 -->
        <div class="mt-4">
          <h4 class="text-md font-semibold">生成分享链接</h4>
          <div class="form-control mt-2">
            <label class="label">
              <span class="label-text mr-2 w-24">权限</span>
            </label>
            <select class="select select-bordered" v-model="linkPermission">
              <option value="VIEW">查看</option>
              <option value="COMMENT">评论</option>
              <option value="EDIT">编辑</option>
            </select>
          </div>
          <div class="form-control mt-2">
            <label class="label">
              <span class="label-text mr-2 w-24">有效期（天）</span>
            </label>
            <input
              type="number"
              placeholder="输入天数"
              min="1"
              class="input input-bordered"
              v-model="expirationDays"
              @blur="ensureMinimumValue2"
            />
          </div>
          <div class="form-control mt-2">
            <label class="label">
              <span class="label-text mr-2 w-24">访问密码</span>
            </label>
            <input
              type="password"
              placeholder="可选"
              class="input input-bordered"
              v-model="linkPassword"
            />
          </div>
          <button
            class="btn btn-primary btn-sm mt-2"
            @click="generateShareLink"
          >
            生成链接
          </button>
          <div v-if="shareLink" class="mt-2">
            <input
              type="text"
              :value="shareLink"
              class="input input-bordered w-full"
              readonly
            />
            <button class="btn btn-sm btn-info mt-2" @click="copyLink">
              复制链接
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "@/stores/user";
import { documentShareApi } from "~/api/collaborators";

const route = useRoute();
const documentId = route.params.id;
console.log("文档ID:", documentId);
const userStore = useUserStore();
const currentUserId = userStore.getUserInfo().id;

// 邀请他人相关数据
// 邀请他人相关数据
const inviteeCount = ref(1); // 新增：邀请人数
const inviteeEmails = ref([""]); // 新增：受邀人邮箱数组
const invitationRoles = ref(["VIEWER"]); // 新增：受邀人权限数组
const emailErrors = ref([]); // 存储每个邮箱的错误信息

// 更新邮箱和权限数组的长度
const updateInviteeFields = () => {
  while (inviteeEmails.value.length < inviteeCount.value) {
    inviteeEmails.value.push("");
    invitationRoles.value.push("VIEWER");
    emailErrors.value.push("");
  }
  inviteeEmails.value.splice(inviteeCount.value);
  invitationRoles.value.splice(inviteeCount.value);
  emailErrors.value.splice(inviteeCount.value);
};

// 监听邀请人数变化
watch(inviteeCount, updateInviteeFields);

// 初始化数组
updateInviteeFields();

// 邮箱验证函数
const validateEmail = (index) => {
  const email = inviteeEmails.value[index];
  if (!email.trim()) {
    emailErrors.value[index] = "邮箱不能为空";
    return;
  }

  // 检测中文字符 - 使用简单的Unicode范围检测
  const hasChinese = /[\u4e00-\u9fa5]/.test(email);
  if (hasChinese) {
    emailErrors.value[index] = "邮箱不能包含中文";
    console.log("检测到中文字符:", email);
    return;
  }

  // 邮箱格式验证
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) {
    emailErrors.value[index] = "请输入有效的邮箱地址";
    return;
  }

  emailErrors.value[index] = "";
  return true;
};

// 邀请他人方法
const inviteUser = async () => {
  // 先验证所有邮箱
  for (let i = 0; i < inviteeEmails.value.length; i++) {
    validateEmail(i);
  }

  console.log("emailErrors:", emailErrors.value);
  const errors = [];
  emailErrors.value.forEach((error, index) => {
    if (error) {
      errors.push(`第 ${index + 1} 个邮箱: ${error}`);
    }
  });
  if (errors.length > 0) {
    alert(`存在以下错误：\n${errors.join("\n")}`);
    return;
  }

  try {
    console.log("文档ID:", documentId);
    if (inviteeCount === 1) {
      const response1 = await documentShareApi.shareDocument(
        Number(documentId),
        {
          inviteeEmail: inviteeEmails.value[0],
          role: invitationRoles.value[0],
        }
      );
      console.log("1", response1);
    } else {
      for (let i = 0; i < inviteeEmails.value.length; i++) {
        if (inviteeEmails.value[i]) {
          const data = {
            inviteeEmail: inviteeEmails.value[i],
            role: invitationRoles.value[i],
          };
          const response2 = await documentShareApi.batchShareDocument(
            Number(documentId),
            data
          );
          console.log("2", response2);
        }
      }
    }
    alert("邀请发送成功！");
    inviteeEmails.value = inviteeEmails.value.map(() => "");
  } catch (error) {
    console.error("邀请发送失败:", error);
    alert("邀请发送失败，请重试！");
  }
};

// 生成分享链接相关数据
const linkPermission = ref("VIEW");
const expirationDays = ref(1);
const linkPassword = ref("");
const shareLink = ref("");
// const baseURL = "http://8.134.200.53:8080";
const baseURL = "http://localhost:3000"; // 本地开发环境

// 防止手动输入小于1的值
const ensureMinimumValue1 = () => {
  if (inviteeCount.value < 1) {
    inviteeCount.value = Math.abs(inviteeCount.value) || 1;
  }
};
const ensureMinimumValue2 = () => {
  if (expirationDays.value < 1) {
    expirationDays.value = Math.abs(expirationDays.value) || 1;
  }
};

// 生成分享链接方法
const generateShareLink = async () => {
  try {
    const data = {
      permission: linkPermission.value,
      expirationDays: expirationDays.value
        ? Number(expirationDays.value)
        : undefined,
      password: linkPassword.value || undefined,
    };
    const response = await documentShareApi.createShareLink(
      Number(documentId),
      data
    );

    console.log("生成分享链接响应:", response);
    if (response.code === "SUCCESS") {
      if (!response.data) {
        shareLink.value = `${baseURL}/document/${documentId}`;
      } else {
        shareLink.value = response.data; // 有链接后复制按钮显示
      }
    } else {
      throw new Error(response.message || "生成分享链接失败");
    }
  } catch (error) {
    console.error("分享链接生成失败:", error);
    alert("分享链接生成失败，请重试！");
  }
};

// 复制链接方法
const copyLink = () => {
  navigator.clipboard.writeText(shareLink.value);
  alert("链接已复制到剪贴板！");
};
</script>
<style scoped></style>
