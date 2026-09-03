import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { MODEL_REGISTRY, DEFAULT_CASCADE_LIST, getModelById, LLMModelInfo } from '../models/modelRegistry';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const isRealKey = (key?: string) => {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.length < 10) return false;
  if (trimmed.includes('your_') || trimmed === 'AIzaSy...' || trimmed === 'sk-ant-api03-...') return false;
  return true;
};

const geminiApiKey = process.env.GEMINI_API_KEY || '';
const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';
const anthropicWorkspaceId = process.env.ANTHROPIC_WORKSPACE_ID || '';

const genAI = isRealKey(geminiApiKey) ? new GoogleGenerativeAI(geminiApiKey) : null;

const anthropicDefaultHeaders: Record<string, string> = {};
if (anthropicWorkspaceId && anthropicWorkspaceId.trim()) {
  anthropicDefaultHeaders['anthropic-workspace-id'] = anthropicWorkspaceId.trim();
}

const anthropicClient = isRealKey(anthropicApiKey)
  ? new Anthropic({
      apiKey: anthropicApiKey,
      defaultHeaders: Object.keys(anthropicDefaultHeaders).length > 0 ? anthropicDefaultHeaders : undefined,
    })
  : null;

export interface CascadeResult<T = string> {
  data: T;
  modelUsed: string;
  provider: 'google' | 'anthropic';
  attemptedModels: string[];
  failureLogs?: Array<{ model: string; error: string }>;
}

/**
 * Check availability of API keys
 */
export const getApiProviderStatus = () => {
  return {
    google: isRealKey(geminiApiKey),
    anthropic: isRealKey(anthropicApiKey),
    hasWorkspaceId: Boolean(anthropicWorkspaceId && anthropicWorkspaceId.trim()),
  };
};

/**
 * Execute a single JSON generation for a specific model
 */
const callModelForJSON = async <T = any>(
  modelInfo: LLMModelInfo,
  prompt: string,
  systemInstruction?: string
): Promise<T> => {
  if (modelInfo.provider === 'google') {
    if (!genAI) throw new Error('GEMINI_API_KEY is not configured or invalid in .env');
    const model = genAI.getGenerativeModel({
      model: modelInfo.id,
      systemInstruction: systemInstruction || undefined,
    });
    const res = await model.generateContent(prompt);
    const rawText = (await res.response).text();

    let cleanText = rawText.trim();
    const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) cleanText = jsonMatch[0];
    cleanText = cleanText.replace(/,\s*([\]}])/g, '$1');

    return JSON.parse(cleanText) as T;
  } else if (modelInfo.provider === 'anthropic') {
    if (!anthropicClient) throw new Error('ANTHROPIC_API_KEY is not configured or invalid in .env');

    const response = await anthropicClient.messages.create({
      model: modelInfo.id,
      max_tokens: Math.min(modelInfo.maxOutputTokens, 4096),
      system: systemInstruction || undefined,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content
      .filter((b) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    let cleanText = rawText.trim();
    const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) cleanText = jsonMatch[0];
    cleanText = cleanText.replace(/,\s*([\]}])/g, '$1');

    return JSON.parse(cleanText) as T;
  }

  throw new Error(`Unsupported provider: ${modelInfo.provider}`);
};

/**
 * Execute a cascading JSON generation across fallback models
 */
export const executeCascadeJSON = async <T = any>(
  prompt: string,
  systemInstruction?: string,
  preferredModelId?: string
): Promise<CascadeResult<T>> => {
  const cascadeModels = [
    ...(preferredModelId ? [preferredModelId] : []),
    ...DEFAULT_CASCADE_LIST.filter((id) => id !== preferredModelId),
  ];

  const attemptedModels: string[] = [];
  const failureLogs: Array<{ model: string; error: string }> = [];

  for (const modelId of cascadeModels) {
    const modelInfo = getModelById(modelId);
    if (!modelInfo) continue;

    if (modelInfo.provider === 'google' && !isRealKey(geminiApiKey)) continue;
    if (modelInfo.provider === 'anthropic' && !isRealKey(anthropicApiKey)) continue;

    attemptedModels.push(modelId);

    try {
      console.log(`[LLM Cascade Engine] Attempting model: ${modelInfo.name} (${modelId})...`);
      const result = await callModelForJSON<T>(modelInfo, prompt, systemInstruction);
      console.log(`[LLM Cascade Engine] Success with ${modelInfo.name} (${modelId})!`);
      return {
        data: result,
        modelUsed: modelId,
        provider: modelInfo.provider,
        attemptedModels,
        failureLogs,
      };
    } catch (err: any) {
      const errMsg = err.message || String(err);
      console.warn(`[LLM Cascade Engine] Failed with ${modelInfo.name} (${modelId}): ${errMsg}. Cascading to next model...`);
      failureLogs.push({ model: modelId, error: errMsg });
    }
  }

  if (attemptedModels.length === 0) {
    throw new Error(
      '.env 파일에 유효한 API 키가 설정되지 않았습니다. GEMINI_API_KEY 또는 ANTHROPIC_API_KEY를 입력해 주세요.'
    );
  }

  const detailedSummary = failureLogs.map((f) => `• [${f.model}]: ${f.error}`).join('\n');
  throw new Error(
    `모든 캐스케이드 모델 호출에 실패했습니다.\n시도된 모델: [${attemptedModels.join(', ')}]\n\n상세 오류 내역:\n${detailedSummary}`
  );
};

/**
 * Execute Multimodal Vision Analysis (Image-to-Concept) with cascade
 */
export const executeCascadeVision = async <T = any>(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  systemInstruction?: string,
  preferredModelId?: string
): Promise<CascadeResult<T>> => {
  let cleanBase64 = imageBase64;
  let cleanMime = mimeType || 'image/png';

  if (imageBase64.includes('base64,')) {
    const parts = imageBase64.split('base64,');
    cleanBase64 = parts[1];
    const mimeMatch = parts[0].match(/data:([^;]+);/);
    if (mimeMatch) cleanMime = mimeMatch[1];
  }

  const cascadeModels = [
    ...(preferredModelId ? [preferredModelId] : []),
    ...DEFAULT_CASCADE_LIST.filter((id) => id !== preferredModelId),
  ];

  const attemptedModels: string[] = [];
  const failureLogs: Array<{ model: string; error: string }> = [];

  for (const modelId of cascadeModels) {
    const modelInfo = getModelById(modelId);
    if (!modelInfo) continue;

    if (modelInfo.provider === 'google' && !isRealKey(geminiApiKey)) continue;
    if (modelInfo.provider === 'anthropic' && !isRealKey(anthropicApiKey)) continue;

    attemptedModels.push(modelId);

    try {
      console.log(`[LLM Cascade Vision] Attempting model: ${modelInfo.name} (${modelId})...`);

      if (modelInfo.provider === 'google' && genAI) {
        const model = genAI.getGenerativeModel({
          model: modelInfo.id,
          systemInstruction: systemInstruction || undefined,
        });

        const imagePart = {
          inlineData: {
            data: cleanBase64,
            mimeType: cleanMime,
          },
        };

        const res = await model.generateContent([prompt, imagePart]);
        const rawText = (await res.response).text();

        let cleanText = rawText.trim();
        const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonMatch) cleanText = jsonMatch[0];
        cleanText = cleanText.replace(/,\s*([\]}])/g, '$1');

        const parsed = JSON.parse(cleanText) as T;

        console.log(`[LLM Cascade Vision] Success with ${modelInfo.name} (${modelId})!`);
        return {
          data: parsed,
          modelUsed: modelId,
          provider: modelInfo.provider,
          attemptedModels,
          failureLogs,
        };
      } else if (modelInfo.provider === 'anthropic' && anthropicClient) {
        const response = await anthropicClient.messages.create({
          model: modelInfo.id,
          max_tokens: Math.min(modelInfo.maxOutputTokens, 4096),
          system: systemInstruction || undefined,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: (cleanMime as any) || 'image/png',
                    data: cleanBase64,
                  },
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
        });

        const rawText = response.content
          .filter((b) => b.type === 'text')
          .map((b: any) => b.text)
          .join('');

        let cleanText = rawText.trim();
        const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonMatch) cleanText = jsonMatch[0];
        cleanText = cleanText.replace(/,\s*([\]}])/g, '$1');

        const parsed = JSON.parse(cleanText) as T;

        console.log(`[LLM Cascade Vision] Success with ${modelInfo.name} (${modelId})!`);
        return {
          data: parsed,
          modelUsed: modelId,
          provider: modelInfo.provider,
          attemptedModels,
          failureLogs,
        };
      }
    } catch (err: any) {
      const errMsg = err.message || String(err);
      console.warn(`[LLM Cascade Vision] Failed with ${modelInfo.name} (${modelId}): ${errMsg}. Cascading...`);
      failureLogs.push({ model: modelId, error: errMsg });
    }
  }

  const detailedSummary = failureLogs.map((f) => `• [${f.model}]: ${f.error}`).join('\n');
  throw new Error(`모든 비전 모델 호출에 실패했습니다.\n${detailedSummary}`);
};

/**
 * Execute streaming generation with fallback cascade
 */
export const executeCascadeStream = async (
  prompt: string,
  systemInstruction?: string,
  onChunk: (chunk: string) => void = () => {},
  preferredModelId?: string
): Promise<CascadeResult<string>> => {
  const cascadeModels = [
    ...(preferredModelId ? [preferredModelId] : []),
    ...DEFAULT_CASCADE_LIST.filter((id) => id !== preferredModelId),
  ];

  const attemptedModels: string[] = [];
  const failureLogs: Array<{ model: string; error: string }> = [];

  for (const modelId of cascadeModels) {
    const modelInfo = getModelById(modelId);
    if (!modelInfo) continue;

    if (modelInfo.provider === 'google' && !isRealKey(geminiApiKey)) continue;
    if (modelInfo.provider === 'anthropic' && !isRealKey(anthropicApiKey)) continue;

    attemptedModels.push(modelId);

    try {
      console.log(`[LLM Cascade Stream] Attempting model: ${modelInfo.name} (${modelId})...`);
      let fullText = '';

      if (modelInfo.provider === 'google' && genAI) {
        const model = genAI.getGenerativeModel({
          model: modelInfo.id,
          systemInstruction: systemInstruction || undefined,
        });
        const result = await model.generateContentStream(prompt);
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          onChunk(chunkText);
        }
      } else if (modelInfo.provider === 'anthropic' && anthropicClient) {
        const stream = anthropicClient.messages.stream({
          model: modelInfo.id,
          max_tokens: Math.min(modelInfo.maxOutputTokens, 8192),
          system: systemInstruction || undefined,
          messages: [{ role: 'user', content: prompt }],
        });

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && (event.delta as any).text) {
            const chunkText = (event.delta as any).text;
            fullText += chunkText;
            onChunk(chunkText);
          }
        }
      }

      console.log(`[LLM Cascade Stream] Completed with ${modelInfo.name} (${modelId})!`);
      return {
        data: fullText,
        modelUsed: modelId,
        provider: modelInfo.provider,
        attemptedModels,
        failureLogs,
      };
    } catch (err: any) {
      const errMsg = err.message || String(err);
      console.warn(`[LLM Cascade Stream] Failed with ${modelInfo.name} (${modelId}): ${errMsg}. Cascading to next model...`);
      failureLogs.push({ model: modelId, error: errMsg });
    }
  }

  if (attemptedModels.length === 0) {
    throw new Error(
      '.env 파일에 유효한 API 키가 설정되지 않았습니다. GEMINI_API_KEY 또는 ANTHROPIC_API_KEY를 입력해 주세요.'
    );
  }

  const detailedSummary = failureLogs.map((f) => `• [${f.model}]: ${f.error}`).join('\n');
  throw new Error(
    `모든 캐스케이드 스트리밍 호출에 실패했습니다.\n시도된 모델: [${attemptedModels.join(', ')}]\n\n상세 오류 내역:\n${detailedSummary}`
  );
};
