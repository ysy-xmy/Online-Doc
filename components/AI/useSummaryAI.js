import { ref } from "vue";

export default function useSummaryAI() {
  const isLoading = ref(false);
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

    // const apikey =
    //   "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";
    // const url = "https://api.openai.com/v1/chat/completions";

    // OpenAI API调用
    // const fetchSummary = async (text) => {
    //   const response = await fetch(url, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${apikey}`,
    //     },
    //     body: JSON.stringify({
    //       model: "gpt-4o-mini",
    //       messages: [
    //         {
    //           role: "system",
    //           content:
    //             "你是一位专业的内容摘要专家，请用简洁的中文总结以下内容，保留关键信息和数据。",
    //         },
    //         {
    //           role: "user",
    //           content: `请用简洁的中文总结以下内容：\n\n${text}`,
    //         },
    //       ],
    //       temperature: 0.3,
    //       max_tokens: 300,
    //     }),
    //   });

    // const data = await response.json();
    // console.log("摘要:", data);
    // if (!response.ok) throw new Error("摘要生成失败");

    // tokenUsage.value = data.usage?.total_tokens || 0;
    // const result = data.choices[0].message.content.trim();
    // console.log("结果：", result);
    // summary.value = result;
    // return result;
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

  // 分块处理长文本（每块约200字符）
  const chunkText = (text, size = 200) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.substring(i, i + size));
    }
    return chunks;
  };
  // 分块摘要处理
  const summarizeLongText = async (fullText) => {
    if (fullText.length <= 200) {
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
