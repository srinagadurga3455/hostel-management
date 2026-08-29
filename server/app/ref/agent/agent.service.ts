import { Injectable, Logger } from '@nestjs/common';

export const AGENT_SYSTEM_PROMPT = `You are a helpful and friendly hostel management chatbot.

Your current role is only to have natural conversations with users.

You can:
- Greet users.
- Answer general questions.
- Explain what you can help with.
- Maintain the context of the current conversation if conversation history is provided.
- Respond naturally and concisely.

Do not pretend that you have performed any hostel operation.
Do not claim that you submitted leave, checked attendance, created complaints, processed outing requests, or modified any data.

Those capabilities will be added later through tools.

For now, your job is simply to have a natural conversation with the user.`;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatInput {
  message: string;
  conversationId?: string;
  history?: ChatMessage[];
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  private get apiKey(): string | undefined {
    return process.env['XAI_API_KEY'] || process.env['AI_API_KEY'];
  }

  private get baseUrl(): string {
    return (
      process.env['XAI_BASE_URL'] ||
      process.env['AI_BASE_URL'] ||
      'https://api.x.ai/v1'
    );
  }

  private get model(): string {
    return (
      process.env['XAI_MODEL'] ||
      process.env['AI_MODEL'] ||
      'qwen/qwen3.8-27b'
    );
  }

  async chat(input: ChatInput): Promise<string> {
    const { message, history } = input;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      const err: any = new Error('message must be a non-empty string');
      err.status = 400;
      throw err;
    }

    if (!this.apiKey) {
      this.logger.error('Missing Grok API key (XAI_API_KEY / AI_API_KEY)');
      const err: any = new Error(
        'Grok API key is not configured. Set XAI_API_KEY (or AI_API_KEY) in environment variables.',
      );
      err.status = 500;
      throw err;
    }

    // Build messages array - designed for future conversation history support
    const messages: ChatMessage[] = [
      { role: 'system', content: AGENT_SYSTEM_PROMPT },
    ];

    // Append optional history (for Stage 2 conversationId-based memory)
    if (history && Array.isArray(history) && history.length > 0) {
      for (const h of history) {
        if (
          h &&
          typeof h.content === 'string' &&
          (h.role === 'user' || h.role === 'assistant')
        ) {
          messages.push({ role: h.role, content: h.content });
        }
      }
    }

    messages.push({ role: 'user', content: message.trim() });

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch (err) {
      this.logger.error(
        `Grok API network error: ${err instanceof Error ? err.message : 'unknown'}`,
      );
      const error: any = new Error('Grok API is currently unavailable. Please try again later.');
      error.status = 502;
      throw error;
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'unable to read error body');
      this.logger.error(`Grok API HTTP ${res.status}: ${errorText.slice(0, 500)}`);
      const error: any = new Error(
        `Grok API request failed with status ${res.status}`,
      );
      // 401/403 -> config error, 429 -> rate limit, 5xx -> bad gateway
      error.status = res.status >= 500 ? 502 : res.status === 429 ? 429 : 502;
      (error as any).details = errorText.slice(0, 500);
      throw error;
    }

    let body: any;
    try {
      body = await res.json();
    } catch {
      this.logger.error('Grok API returned invalid JSON');
      const error: any = new Error('Invalid response from Grok API');
      error.status = 502;
      throw error;
    }

    const content: string | undefined =
      body?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      this.logger.error(`Grok API invalid response shape: ${JSON.stringify(body).slice(0, 500)}`);
      const error: any = new Error('Invalid response from Grok API');
      error.status = 502;
      throw error;
    }

    return content;
  }
}
