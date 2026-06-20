import { GoogleGenAI } from '@google/genai';

export type ModelProvider = 'openai' | 'openrouter' | 'gemini' | 'mock';

export type ModelDescriptor = {
  id: string;
  provider: ModelProvider;
  label: string;
  configured: boolean;
};

export type GenerateTextInput = {
  prompt: string;
  system?: string;
};

export type GenerateTextOutput = {
  text: string;
  provider: ModelProvider;
  model: string;
  source: 'provider' | 'fallback';
};

function getProvider(): ModelProvider {
  const raw = (process.env.MODEL_PROVIDER ?? '').trim().toLowerCase();
  if (raw === 'openai' || raw === 'openrouter' || raw === 'gemini') {
    return raw;
  }
  return 'mock';
}

function getModelName(): string {
  return (process.env.MODEL_NAME ?? '').trim() || defaultModelName(getProvider());
}

function defaultModelName(provider: ModelProvider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4.1-mini';
    case 'openrouter':
      return 'openai/gpt-4.1-mini';
    case 'gemini':
      return 'gemini-2.5-flash';
    default:
      return 'mock-hello';
  }
}

function getBaseUrl(provider: ModelProvider): string {
  const envBase = (process.env.MODEL_BASE_URL ?? '').trim();
  if (envBase) return envBase;
  if (provider === 'openrouter') return 'https://openrouter.ai/api/v1';
  return 'https://api.openai.com/v1';
}

function hasProviderKey(provider: ModelProvider): boolean {
  if (provider === 'openai') return Boolean((process.env.OPENAI_API_KEY ?? '').trim());
  if (provider === 'openrouter') return Boolean((process.env.OPENROUTER_API_KEY ?? '').trim());
  if (provider === 'gemini') return Boolean((process.env.GEMINI_API_KEY ?? '').trim());
  return false;
}

function providerKey(provider: ModelProvider): string {
  if (provider === 'openai') return process.env.OPENAI_API_KEY ?? '';
  if (provider === 'openrouter') return process.env.OPENROUTER_API_KEY ?? '';
  if (provider === 'gemini') return process.env.GEMINI_API_KEY ?? '';
  return '';
}

function buildFallbackText(input: GenerateTextInput): string {
  const prompt = input.prompt.trim();
  const firstSentence = prompt.split(/[。！？!?]/)[0] || '你的任务';
  return [
    `这是 HelloMe 的本地降级结果，用于保证 demo 可跑通。`,
    `系统理解：${firstSentence}`,
    `建议下一步：先生成结构化要点，再进入具体内容生成。`,
  ].join('\n');
}

async function generateWithOpenAICompatible(
  provider: 'openai' | 'openrouter',
  input: GenerateTextInput,
): Promise<GenerateTextOutput> {
  const response = await fetch(`${getBaseUrl(provider)}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${providerKey(provider)}`,
      'Content-Type': 'application/json',
      ...(provider === 'openrouter'
        ? {
            'HTTP-Referer': process.env.APP_URL ?? 'http://localhost:3000',
            'X-Title': 'HelloMe Demo',
          }
        : {}),
    },
    body: JSON.stringify({
      model: getModelName(),
      messages: [
        ...(input.system ? [{ role: 'system', content: input.system }] : []),
        { role: 'user', content: input.prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`${provider} 响应失败：${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error(`${provider} 未返回文本内容`);
  }

  return {
    text,
    provider,
    model: getModelName(),
    source: 'provider',
  };
}

async function generateWithGemini(input: GenerateTextInput): Promise<GenerateTextOutput> {
  const ai = new GoogleGenAI({
    apiKey: providerKey('gemini'),
  });

  const response = await ai.models.generateContent({
    model: getModelName(),
    contents: input.prompt,
    config: {
      systemInstruction: input.system,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error('gemini 未返回文本内容');
  }

  return {
    text,
    provider: 'gemini',
    model: getModelName(),
    source: 'provider',
  };
}

export async function generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
  const provider = getProvider();

  try {
    if (provider === 'openai' && hasProviderKey(provider)) {
      return await generateWithOpenAICompatible('openai', input);
    }
    if (provider === 'openrouter' && hasProviderKey(provider)) {
      return await generateWithOpenAICompatible('openrouter', input);
    }
    if (provider === 'gemini' && hasProviderKey(provider)) {
      return await generateWithGemini(input);
    }
  } catch (error) {
    console.error('[modelAdapter] provider request failed, using fallback:', error);
  }

  return {
    text: buildFallbackText(input),
    provider: provider === 'mock' ? 'mock' : provider,
    model: getModelName(),
    source: 'fallback',
  };
}

export function listAvailableModels(): {
  provider: ModelProvider;
  activeModel: string;
  models: ModelDescriptor[];
} {
  const provider = getProvider();
  return {
    provider,
    activeModel: getModelName(),
    models: [
      {
        id: 'gpt-4.1-mini',
        provider: 'openai',
        label: 'OpenAI · gpt-4.1-mini',
        configured: hasProviderKey('openai'),
      },
      {
        id: 'openai/gpt-4.1-mini',
        provider: 'openrouter',
        label: 'OpenRouter · openai/gpt-4.1-mini',
        configured: hasProviderKey('openrouter'),
      },
      {
        id: 'gemini-2.5-flash',
        provider: 'gemini',
        label: 'Gemini · gemini-2.5-flash',
        configured: hasProviderKey('gemini'),
      },
      {
        id: 'mock-hello',
        provider: 'mock',
        label: 'Mock Fallback',
        configured: true,
      },
    ],
  };
}
