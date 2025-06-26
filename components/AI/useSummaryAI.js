import { ref } from "vue";

export default function useSummaryAI() {
  const isLoading = ref(false);
  const isProcessing = ref(false);   // 新增：分块处理状态
  const progress = ref(0);           // 处理进度
  const summary = ref(""); //结果
  const error = ref(null);
  const tokenUsage = ref(0);

  const fetchSummary = async (text) => {
    // deepseek接口
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer sk-c7b39394365c498381e3b312638b47f8",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "你是一位专业的内容摘要专家，请用简洁的中文总结以下内容，保留关键信息和数据。",
            },
            {
              role: "user",
              content: `请用简短的中文总结以下内容：\n\n${text}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        }),
      }
    );

    if (!response.ok) throw new Error("摘要生成失败");
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let partialSummary = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6);
          if (jsonStr === "[DONE]") {
            break;
          }
          try {
            const data = JSON.parse(jsonStr);
            if (data.choices && data.choices[0].delta?.content) {
              partialSummary += data.choices[0].delta.content;
            }
          } catch (parseError) {
            console.error("JSON解析错误:", parseError);
          }
        }
      }
    }

    summary.value = partialSummary.trim();
    return partialSummary.trim();
  };

// const apikey =
//       "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";
//     const url = "https://api.openai.com/v1/chat/completions";

//     // OpenAI API调用
//     const fetchSummary = async (text) => {
//       const response = await fetch(url, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${apikey}`,
//         },
//         body: JSON.stringify({
//           model: "gpt-4o-mini",
//           messages: [
//             {
//               role: "system",
//               content:
//                 "你是一位专业的内容摘要专家，请用简洁的中文总结以下内容，保留关键信息和数据。",
//             },
//             {
//               role: "user",
//               content: `请用简洁的中文总结以下内容：\n\n${text}`,
//             },
//           ],
//           temperature: 0.3,
//           max_tokens: 300,
//         }),
//       });

//     const data = await response.json();
//     console.log("摘要:", data);
//     if (!response.ok) throw new Error("摘要生成失败");

//     tokenUsage.value = data.usage?.total_tokens || 0;
//     const result = data.choices[0].message.content.trim();
//     console.log("结果：", result);
//     summary.value = result;
//     return result;
// }
  // 分块处理长文本（每块约600字符）
  const chunkText = (text, size = 700) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.substring(i, i + size));
    }
    return chunks;
  };
  // 分块摘要处理
  const summarizeLongText = async (fullText) => {
    isProcessing.value = false; // 初始为非分块处理状态
    progress.value = 0;
    if (fullText.length <= 700) {
      return await fetchSummary(fullText);
    }

    isProcessing.value = true; // 进入分块处理状态
    const chunks = chunkText(fullText);
    const chunkSummaries = [];


    for (const [index, chunk] of chunks.entries()) {
      progress.value = Math.round((index  / chunks.length) * 100) ;
      console.log(`正在处理第 ${index + 1}/${chunks.length} 块...`);
      const chunkSummary = await fetchSummary(chunk);
      if (chunkSummary) {
        chunkSummaries.push(chunkSummary);
      }
      // 添加延迟避免速率限制
      if (index < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 20000)); // ⏳ 15秒间隔
    }
    }
    
    // 合并分块摘要
    console.log("正在合并分块摘要...");
    const finalSummary = await fetchSummary(chunkSummaries.join("\n\n"));
    progress.value = Math.round((chunks.length/ chunks.length) * 100) ;
    await new Promise(resolve => setTimeout(resolve, 700)); // 5秒延迟
    isProcessing.value = false; // 退出分块处理状态
    return finalSummary;
  };
  // 公开接口
  return {
    isLoading,
    isProcessing, // 暴露分块处理状态
    progress,
    summary,
    error,
    tokenUsage,
    summarizeLongText,
  };
}
