import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

// VITE_API_KEY 將在 Netlify 的後台設定
const apiKey = import.meta.env.VITE_API_KEY;

// 安全檢查，避免沒有 Key 時報錯導致白屏，但會在 Console 顯示警告
const ai = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY_FOR_BUILD' });

const SYSTEM_INSTRUCTION = `
You are an expert travel assistant for a mobile app called "Wanderlust AI".
Your target audience uses Traditional Chinese (zh-TW).
Keep responses concise, friendly, and formatted nicely with Markdown.
`;

export const sendMessageToGemini = async (
  history: ChatMessage[],
  newMessage: string
): Promise<{ text: string; sources: { title: string; uri: string }[] }> => {
  if (!apiKey) return { text: "請設定 VITE_API_KEY 環境變數", sources: [] };
  try {
    const prompt = `Previous context: ${history.map(m => `${m.role}: ${m.text}`).join('\n')} \n User: ${newMessage}`;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });
    const text = response.text || "無法回答。";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.filter((c: any) => c.web).map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
    return { text, sources };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "連線錯誤。", sources: [] };
  }
};

export const generateDestinationDetails = async (destinationName: string): Promise<string> => {
    if (!apiKey) return "請設定 API Key";
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `介紹 "${destinationName}" 的旅遊資訊(3個必去+1個必吃)。繁體中文 Markdown。`,
        });
        return response.text || "無法取得資訊。";
    } catch (e) {
        return "載入詳細資訊失敗。";
    }
}