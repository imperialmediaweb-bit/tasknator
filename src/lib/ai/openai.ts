import OpenAI from "openai";
import { AIProvider, AIGenerateOptions } from "./provider";

export class OpenAIProvider implements AIProvider {
  name = "OpenAI";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(options: AIGenerateOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    });

    return response.choices[0]?.message?.content || "";
  }
}
