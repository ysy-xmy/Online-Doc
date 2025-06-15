<template>
    <div class="bg-base-100 p-4">
      <h2 class="text-lg font-semibold mb-4 text-base-content">最近</h2>
      
      <!-- 文档列表 -->
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>文档名称</th>
              <th>创建人</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in recentDocs" :key="doc.id" @click="openDocument(doc.id)">
              <td>{{ doc.name }}</td>
              <td>{{ doc.creator }}</td>
              <td>{{ doc.time }}</td>
              <td>
                <button class="btn btn-ghost btn-xs" >查看</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
</template>

<script setup>
const recentDocs = [
  { id: 1, name: '【飞书训练营】龙威天周会', creator: '韩华维', time: '今天 22:13' },
  { id: 2, name: '后端开发工程师', creator: 'Peter', time: '今天 21:16' },
  { id: 3, name: '招聘：AchoBeta现行招新制度', creator: 'Peter', time: '今天 21:16' },
]

const openDocument = (id) => {
  navigateTo(`/document/${id}`)
}
</script>

<style scoped>
.table th:first-child {
  width: 40%;
}
</style> 