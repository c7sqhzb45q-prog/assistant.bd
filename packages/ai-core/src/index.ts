export type LLMProvider = 'openai' | 'anthropic';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  provider: LLMProvider;
  model: string;
  messages: LLMMessage[];
  temperature?: number;
}

export interface LLMResponse {
  provider: LLMProvider;
  model: string;
  content: string;
}

export async function runLLM(request: LLMRequest): Promise<LLMResponse> {
  return {
    provider: request.provider,
    model: request.model,
    content:
      'ai-core is scaffolded. Wire provider SDK calls (OpenAI/Anthropic) here.',
  };
}
