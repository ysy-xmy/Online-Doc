import { ref } from "vue";

export default function useSummaryAI() {
  const isLoading = ref(false);
  const summary = ref("");//结果
  const error = ref(null);
  const tokenUsage = ref(0);

  const apikey =
    "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";
  const url = "https://api.openai.com/v1/chat/completions";
 
  // OpenAI API调用
  const fetchSummary = async (text) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apikey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "你是一位专业的内容摘要专家，请用简洁的中文总结以下内容，保留关键信息和数据。",
          },
          {
            role: "user",
            content: `请用简洁的中文总结以下内容：\n\n${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    console.log("摘要:", data);
    if (!response.ok) throw new Error(data.error?.message || "摘要生成失败");

    tokenUsage.value = data.usage?.total_tokens || 0;
    const result = data.choices[0].message.content.trim();
    console.log('结果：',result);
    summary.value = result;
    return result;
  };
  // 分块处理长文本（每块约2000字符）
  const chunkText = (text, size = 2000) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.substring(i, i + size));
    }
    return chunks;
  };
  // 分块摘要处理
  const summarizeLongText = async (fullText) => {
    if (fullText.length <= 2000) {
      return await fetchSummary(fullText);
    }

    const chunks = chunkText(fullText);
    const chunkSummaries = [];

    for (const chunk of chunks) {
      const chunkSummary = await fetchSummary(chunk);
      chunkSummaries.push(chunkSummary);
    }

    return await fetchSummary(chunkSummaries.join("\n\n"));
  };
  // 公开接口
  return {
    isLoading,
    summary,
    error,
    tokenUsage,
    summarizeLongText,
  };
}
