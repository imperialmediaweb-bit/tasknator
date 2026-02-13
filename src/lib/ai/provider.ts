export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIGenerateOptions {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
}

export interface AIProvider {
  name: string;
  generate(options: AIGenerateOptions): Promise<string>;
}

export type ProviderType = "ANTHROPIC" | "OPENAI" | "GEMINI";

import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { GeminiProvider } from "./gemini";

export function createProvider(type: ProviderType, apiKey: string): AIProvider {
  switch (type) {
    case "ANTHROPIC":
      return new AnthropicProvider(apiKey);
    case "OPENAI":
      return new OpenAIProvider(apiKey);
    case "GEMINI":
      return new GeminiProvider(apiKey);
    default:
      throw new Error(`Unknown provider: ${type}`);
  }
}

export async function generateWithFallback(
  providers: { type: ProviderType; apiKey: string }[],
  options: AIGenerateOptions
): Promise<string> {
  let lastError: Error | null = null;

  for (const { type, apiKey } of providers) {
    try {
      const provider = createProvider(type, apiKey);
      return await provider.generate(options);
    } catch (err) {
      lastError = err as Error;
      console.error(`Provider ${type} failed:`, (err as Error).message);
      continue;
    }
  }

  throw lastError || new Error("All AI providers failed");
}
