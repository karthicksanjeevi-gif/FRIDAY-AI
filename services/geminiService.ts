import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { FileAttachment } from "../types";

class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  // Using gemini-2.5-flash as it is the only verified working model for this key.
  private modelName = 'gemini-2.5-flash';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: (import.meta.env.VITE_GEMINI_API_KEY || "") as string });
  }

  initChat() {
    this.chatSession = this.ai.chats.create({
      model: this.modelName,
      config: {
        systemInstruction: `You are Friday, an advanced AI assistant with real-time web access and file analysis capabilities. 
        Always provide accurate, up-to-date information. If asked about recent events, 
        use your search tool. If a file is attached, analyze it thoroughly. Today's date is ${new Date().toLocaleDateString()}.`,
        tools: [{ googleSearch: {} }],
      },
    });
  }

  /**
   * Sends a message to the model and yields both text chunks and grounding metadata.
   */
  async *sendMessageStream(message: string, image?: { data: string, mimeType: string }, file?: FileAttachment): AsyncGenerator<{ text?: string, groundingChunks?: any[] }, void, unknown> {
    if (!this.chatSession) {
      this.initChat();
    }

    if (!this.chatSession) {
      throw new Error("Failed to initialize chat session.");
    }

    try {
      const timeContext = `[System Context: Current local time is ${new Date().toLocaleString()}]\n\n`;
      let messageParam: any = { parts: [] };

      // Add text part
      messageParam.parts.push({ text: timeContext + message });

      // Add Image part if exists
      if (image) {
        const base64Data = image.data.split(',')[1] || image.data;
        messageParam.parts.push({
          inlineData: { mimeType: image.mimeType, data: base64Data }
        });
      }

      // Add File part if exists
      if (file) {
        messageParam.parts.push({
          inlineData: { mimeType: file.type, data: file.data }
        });
      }

      const resultStream = await this.chatSession.sendMessageStream({ message: messageParam.parts });

      for await (const chunk of resultStream) {
        const responseChunk = chunk as GenerateContentResponse;
        const text = responseChunk.text;
        const groundingMetadata = responseChunk.candidates?.[0]?.groundingMetadata;

        yield {
          text,
          groundingChunks: groundingMetadata?.groundingChunks
        };
      }
    } catch (error: any) {
      console.error("Gemini API Error Detail:", error);

      // Explicitly check for 429 (Resource Exhausted) errors in the response
      const errorStr = JSON.stringify(error).toLowerCase();
      if (errorStr.includes('429') || errorStr.includes('resource_exhausted') || errorStr.includes('quota')) {
        throw new Error("QUOTA_EXCEEDED: You have exceeded your Gemini API free tier quota. Please wait a minute or check your billing settings at ai.google.dev.");
      }

      throw new Error(error.message || "An error occurred while communicating with the AI.");
    }
  }
}

export const geminiService = new GeminiService();
