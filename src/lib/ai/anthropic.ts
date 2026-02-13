import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, AIGenerateOptions } from "./provider";

export class AnthropicProvider implements AIProvider {
  name = "Anthropic Claude";
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(options: AIGenerateOptions): Promise<string> {
    const systemMsg = options.messages.find((m) => m.role === "system");
    const userMessages = options.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      system: systemMsg?.content || "",
      messages: userMessages,
    });

    const block = response.content[0];
    if (block.type === "text") {
      return block.text;
    }
    throw new Error("Unexpected response type from Anthropic");
  }
}
