<template>
  <div class="summary-panel" :class="{ visible: isVisible }">
    <div class="panel-header">
      <h3>AI生成内容摘要</h3>
      <!-- 折叠/展开按钮 -->
      <div
        class="absolute top-1/2 -left-8 bg-base-300 rounded-l-lg shadow-md cursor-pointer transition-all duration-300 hover:bg-base-content/10"
        @click="closePanel"
      >
        <div class="p-1.5 flex items-center justify-center">
          <Icon name="mdi:arrow-right" class="h-8 w-8" />
        </div>
      </div>
    </div>

    <div class="panel-content">
      <div v-if="error" class="error-state">{{ error }}</div>
      <template v-else>
        <div v-if="isLoading || isAISummaryLoading" class="loading-state">
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>

        <div v-else-if="isProcessing" class="processing-state loading-state">
          <div class="spinner"></div>
          <div class="progress-bar">
            <div class="progress" :style="{ width: `${progress}%` }"></div>
          </div>
          <span>{{ progress }}% 处理中...</span>
        </div>
        <div v-else class="summary-box" ref="summaryBox" @scroll="handleScroll">
          <div
            v-for="(summary, index) in summaries"
            :key="index"
            class="summary-item"
          >
            {{ summary }}
          </div>
        </div>
      </template>
    </div>

    <div class="panel-footer">
      <span class="token-usage">字数: {{ summaryCharCount }}</span>
      <div class="panel-footer">
        <button @click="retryOperation" class="copy-btn retry-btn">重试</button>
        <button class="copy-btn" @click="copySummary">复制摘要</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import useSummaryAI from "~/components/AI/useSummaryAI.js";
const { $axios } = useNuxtApp(); // 使用插件中提供的 $axios
// 定义响应式变量
const summaries = ref([]);
// const documentContent = ref('报道提到，当被问及英国最终是否会允许美国飞机使用英国位于塞浦路斯和迪戈加西亚岛的军事基地但不提供任何其他支持时，哈曼回答说，“正是如此”。'); // 直接使用预设文本
// const documentContent = ref(
//   '时下正值荔枝上市的季节，在广东汕头潮南区雷岭镇，一树树荔枝硕果累累，当地的荔农们喜迎丰收。为助力"雷岭荔枝"种植、销售及品牌提档升级，推动果农增收，"荔香四海产销共赢"广东荔枝产销对接汕头分会场活动(简称"产销对接活动")25日在汕头潮南雷岭镇举行。\n\n有"荔枝之乡"美誉的汕头潮南雷岭镇是广东晚熟荔枝主产区之一。汕头潮南区雷岭镇党委书记何壁生25日向记者介绍，雷岭荔枝种植面积4.4万亩，居民人均拥有近1亩。主要种植有乌叶、桂味、糯米糍、冰荔、仙进奉、井冈红糯等品种。2025年预计雷岭荔枝产量达1.54万吨。\n\n何壁生称，雷岭镇农业产业强镇二期项目计划总投资1608万元(人民币，下同)，将开展生产用水肥药系统的建设及智能监测与无人机巡园系统建设；病虫害监测与防控预警智慧系统及示范园建设；目前荔枝产业发展科技支撑体系建设项目正在进行荔枝生产标准制定。6月25日"荔香四海 产销共赢"广东荔枝产销对接汕头分会场活动在广东汕头潮南雷岭镇举行。图为雷岭荔枝。　中新社记者 李怡青 摄\n\n时下正值荔枝上市的季节，在广东汕头潮南区雷岭镇，一树树荔枝硕果累累，当地的荔农们喜迎丰收。为助力"雷岭荔枝"种植、销售及品牌提档升级，推动果农增收，"荔香四海 产销共赢"广东荔枝产销对接汕头分会场活动(简称"产销对接活动")25日在汕头潮南雷岭镇举行。\n\n有"荔枝之乡"美誉的汕头潮南雷岭镇是广东晚熟荔枝主产区之一。汕头潮南区雷岭镇党委书记何壁生25日向记者介绍，雷岭荔枝种植面积4.4万亩，居民人均拥有近1亩。主要种植有乌叶、桂味、糯米糍、冰荔、仙进奉、井冈红糯等品种。2025年预计雷岭荔枝产量达1.54万吨。\n\n该镇还通过主动对接高校、科研院所建立产学研合作机制。何壁生称，目前雷岭乌叶、桂味等传统品种上成功嫁接观音绿、巨美人、冰荔等优新品种，进一步提升果品附加值。\n\n记者在位于雷岭镇荔宝冷链中心产销对接活动看到，现场购销两旺。果农们将刚采的新鲜荔枝一筐筐送到现场，活动为果农和采购商提供便利、快捷的荔枝采购对接平台。\n\n雷岭镇荔枝协会会长古城钦称，"雷岭荔枝""雷岭乌叶荔枝"两项地理标志证明商标蜚声海内外，当地荔枝已连续22年销往北美市场，2025年新拓展了中东地区市场。\n\n他说，目前，雷岭镇建成5000亩标准化出口示范基地，荔枝协会通过组织培训、技术指导、销售对接等推进全镇荔枝产业发展。今年雷岭荔枝将增加出口量及出口品种。\n\n产销对接活动主办方介绍，雷岭荔枝鲜果销售占比约七成，主要销往北美、中东等出口市场及大湾区、长三角地区。荔枝深加工产品销售约1500吨，主要是荔枝干、荔枝酒及"荔小吉"系列饮料。雷岭镇与广药集团、汕头饮品连锁企业"一杯潮茶"达成采购意向。\n\n雷岭荔枝电商与直播销售占比约两成，预计电商均价每公斤28元。日前，广东潮剧院组织了潮剧演员，以新编潮剧《荔镜记》经典片段为载体，打造潮剧助农短视频，同时开展荔枝品鉴、线上销售等活动。传统潮剧与荔枝碰撞，线上订单量节节攀升，线上线下同掀"荔枝热"。\n\n近两年来当地拓宽荔枝销售市场，新增家庭农场12家、自摘园20余个，通过探索"合作社+农户+旅游"的融合发展模式推动产业业态创新。目前该镇以麻埔村荔枝园为典型代表，将荔枝采摘与休闲旅游相结合，打造集生态观光、农事体验、亲子活动于一体的乡村旅游综合体。\n一年来，云南法院始终把严防境外毒品渗透内流作为首要任务，持续加大对走私和大宗贩卖、运输毒品等源头性犯罪从严惩处力度，全力遏制境外毒品渗透内流，对保某林、杨某堂等一批罪行极其严重的毒品犯罪分子依法判处死刑。\n\n同时，云南法院加大对毒品消费末端犯罪的惩处力度，依法惩治非法买卖、持有毒品原植物种子和非法种植毒品原植物犯罪，加大对新型毒品犯罪及侵害青少年毒品犯罪的惩处力度，严格规范毒品犯罪刑罚适用。一年来，全省法院一审审结容留他人吸毒案件220件、非法持有毒品案件28件，判决生效268人；一审审结非法种植毒品原植物案件18件、非法买卖、持有毒品原植物种子案件197件，判决生效222人。\n\n经过严厉打击和有效治理，近年来，全省毒品犯罪案件呈持续下降态势，但形势依然严峻，大宗毒品贩运增多，毒品犯罪网络化特点突出，涉案毒品种类呈现多元化趋势。此次发布的10起毒品犯罪典型案例彰显了云南法院严厉打击源头性毒品犯罪、严惩主观恶性深的毒品犯罪分子的坚定立场，依法严惩毒品消费末端犯罪、麻精药品犯罪、侵害未成年人毒品犯罪的鲜明态度，全链条打击毒品上下游犯罪的坚定决心，对宽严相济刑事政策的全面贯彻。\n\n下一步，云南法院将始终坚持党对禁毒工作的绝对领导，坚持依法从严惩处毒品犯罪不动摇，严格贯彻宽严相济刑事政策，持续推进禁毒源头治理、综合治理，不断加强毒品案件审判专业化、规范化建设，奋力推进新时代云南法院禁毒工作高质量发展，全力打好打赢云南省第五轮禁毒人民战争。(完)'
// );
const documentContent = ref("");
const summaryBox = ref(null);
const isLoading = ref(true);
const error = ref(null); // 新增统一错误状态

// 初始化 AI 摘要相关逻辑
const {
  isLoading: isAISummaryLoading,
  isProcessing,
  progress,
  summary: aiSummary,
  error: aiError,
  tokenUsage: aiTokenUsage,
  summarizeLongText,
} = useSummaryAI();

const props = defineProps({
  isVisible: Boolean,
  summary: String,
  error: String,
  tokenUsage: Number,
  documentId: String, // 接收文档ID
});

const emit = defineEmits(["close"]);
const closePanel = () => {
  summaries.value = [];
  isLoading.value = false;
  isProcessing.value = false;
  progress.value = 0;
  emit("close");
};

// 添加对 props.summary 的监听
watch(
  () => props.summary,
  (newVal) => {
    if (newVal) {
      summaries.value = [newVal];
    }
  }
);

// 添加对 aiSummary 的监听
watch(aiSummary, (newVal) => {
  if (newVal) {
    summaries.value = [newVal];
    isLoading.value = false;
  }
});
watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) {
      generateAISummary(); // 面板打开时自动生成摘要
    }
  }
);

// 初始化 WebSocket 连接
const ws = new WebSocket("ws://8.134.200.53:1234"); // 或 ws://8.134.200.53:1234

console.log("接收到的文档ID:", props.documentId);

// 封装根据文档 ID 通过 WebSocket 获取文档的函数
const fetchDocumentById = (id) => {
  return new Promise((resolve, reject) => {
    // 确保 WebSocket 已连接
    if (ws.readyState !== WebSocket.OPEN) {
      ws.onopen = () => {
        sendDocumentRequest(id);
      };
    } else {
      sendDocumentRequest(id);
    }

    function sendDocumentRequest(docId) {
      // 发送获取文档的请求
      ws.send(JSON.stringify({
        action: "getDocument",
        documentId: docId
      }));

      // 应在 sendDocumentRequest 内添加：
const timeout = setTimeout(() => {
  ws.removeEventListener("message", handleMessage);
  reject(new Error("请求超时"));
}, 5000); // 5秒超时
      // 处理服务器响应
      const handleMessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (response.documentId === id && response.action === "getDocument") {
            clearTimeout(timeout);
            ws.removeEventListener("message", handleMessage);
            
            if (response.error) {
              reject(new Error(response.error));
            } else {
              documentContent.value = response.data;
              console.log("通过WebSocket获取的文档内容:", documentContent.value);
              resolve(response);
            }
          }
        } catch (e) {
          console.error("解析响应失败:", e);
        }
      };

      ws.addEventListener("message", handleMessage);
    }
  });
};

const generateAISummary = async () => {
  try {
    const response = await fetchDocumentById(props.documentId);
    console.log("API响应:", response);

    // 2. 检查内容是否为空
    if (!documentContent.value) {
      error.value = "内容为空";
      return; // 直接返回，不继续执行
    }

    await summarizeLongText(documentContent.value);
  
  } catch (Error) {
    error.value = "生成AI摘要失败";
    console.error("生成AI摘要失败:", Error);
  }
};

// 计算有效字数（中文按字算，英文按单词算）
const summaryCharCount = computed(() => {
  const text = aiSummary.value || summaries.value.join("");
  if (!text) return 0;

  // 移除所有空格和标点（按需求调整）
  const cleanText = text.replace(/[\s\.,;:!?]/g, "");
  return cleanText.length;
});
const copySummary = async () => {
  try {
    // 检查是否存在错误
    if (error.value) {
      alert("当前存在错误，无法复制内容");
      return;
    }
    await navigator.clipboard.writeText(aiSummary.value);
    alert("AI摘要已复制");
  } catch (err) {
    console.error("复制失败:", err);
    alert("AI摘要复制失败");
  }
};

// 重试操作
const retryOperation = () => {
  error.value = null;
  generateAISummary();
};
</script>

<style scoped>
.summary-panel {
  position: absolute;
  right: -400px;
  top: 0;
  bottom: 0;
  height: 90vh;
  width: 21rem;
  background: #f8f8f8;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 998;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #eee;
}

.summary-panel.visible {
  right: 0;
}

.panel-header {
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  color: #10a37f;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0 8px;
}

.panel-content {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.error-state {
  background-color: #fff5f5; /* 浅红色背景 */
  color: #dc2626; /* 更柔和的红色文字 */
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #ef4444; /* 左侧强调色条 */
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.3s ease-out;
}

.summary-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.summary-text {
  flex-grow: 1;
  line-height: 1.6;
  overflow-y: auto;
  padding-bottom: 20px;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #eee;
  margin-top: auto;
}

.token-usage {
  font-size: 12px;
  color: #888;
}
.panel-footer {
  /* 添加以下属性 */
  display: flex;
  gap: 8px; /* 控制按钮间距 */
  padding: 6px 10px;
  align-items: center;
}
.copy-btn {
  background: #10a37f;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.copy-btn:hover {
  background: #0d8e6f;
}
.copy-btn .retry-btn {
  padding: 6px 10px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #10a37f;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
