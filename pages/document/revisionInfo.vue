<template>
  <div class="bg-base-100 p-4 rounded-lg shadow-md w-84">
    <div class="space-y-4">
      <div
        v-for="revision in sortedRevisions"
        :key="revision.id"
        class="card bg-base-200 hover:bg-base-300 transition-all duration-300 ease-in-out">
        <div class="card-body p-2">
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-2">
              <span class="">
                {{ revision.type === "add" ? "新增" : "删除" }}
              </span>
              <span class="text-xs text-gray-500">
                {{ formatTimestamp(revision.timestamp) }}
              </span>
            </div>
            <div class="text-xs text-gray-600">
              用户ID: {{ revision.userId }}
            </div>
          </div>

          <div class="mt-1">
            <p
              class="text-sm overflow-hidden whitespace-nowrap text-ellipsis"
              :class="{
                'text-green-600': revision.type === 'add',
                'text-red-600 line-through': revision.type === 'delete',
              }">
              {{ revision.content }}
            </p>
          </div>

          <div class="card-actions justify-end mt-1">
            <button
              @click="applyRevision(revision)"
              class="btn btn-xs btn-success">
              应用
            </button>
            <button
              @click="rejectRevision(revision)"
              class="btn btn-xs btn-error">
              拒绝
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  revisions: {
    type: Array,
    default: () => [],
  },
});

const sortedRevisions = computed(() =>
  [...props.revisions].sort((a, b) => a.timestamp - b.timestamp)
);

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
};

const applyRevision = (revision) => {
  // 实现应用修订的逻辑
  console.log("应用修订:", revision);
};

const rejectRevision = (revision) => {
  // 实现拒绝修订的逻辑
  console.log("拒绝修订:", revision);
};
</script>
