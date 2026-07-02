type OllamaGenerateParams = {
  baseUrl: string;
  model: string;
  prompt: string;
  system?: string;
};

export class OllamaConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OllamaConfigError';
  }
}

export class OllamaRequestError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = 'OllamaRequestError';
    this.statusCode = statusCode;
  }
}

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export async function generateWithOllama(params: OllamaGenerateParams) {
  try {
    const response = await fetch(`${trimTrailingSlash(params.baseUrl)}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: params.model,
        prompt: params.prompt,
        stream: false,
        system: params.system,
      }),
    });

    if (!response.ok) {
      const upstreamBody = await response.text();
      throw new OllamaRequestError(
        `Ollama upstream request failed (${response.status}): ${upstreamBody || 'empty response body'}`,
        502,
      );
    }

    const data = (await response.json()) as { response?: unknown };
    if (typeof data.response !== 'string') {
      throw new OllamaRequestError('Ollama returned an invalid response payload');
    }

    return data.response;
  } catch (error) {
    if (error instanceof OllamaRequestError) {
      throw error;
    }

    throw new OllamaRequestError(
      `Unable to reach Ollama at ${params.baseUrl}. Ensure the service is running and accessible.`,
    );
  }
}
