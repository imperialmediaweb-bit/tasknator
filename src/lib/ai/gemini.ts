import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, AIGenerateOptions } from "./provider";

export class GeminiProvider implements AIProvider {
  name = "Google Gemini";
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generate(options: AIGenerateOptions): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const systemMsg = options.messages.find((m) => m.role === "system");
    const userMessages = options.messages.filter((m) => m.role !== "system");

    const prompt = [
      systemMsg ? `System: ${systemMsg.content}\n\n` : "",
      ...userMessages.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`),
    ].join("\n");

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  }
}
