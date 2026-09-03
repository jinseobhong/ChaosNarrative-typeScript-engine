import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const apiKey = process.env.GEMINI_API_KEY || '';
const fastModelName = process.env.GEMINI_MODEL_FAST || 'gemini-2.5-flash';
const deepModelName = process.env.GEMINI_MODEL_DEEP || 'gemini-2.5-flash';

if (!apiKey) {
  console.warn('[Gemini Client] Warning: GEMINI_API_KEY is not set in .env file. Please add your API key.');
}

const genAI = new GoogleGenerativeAI(apiKey);

export const getGeminiModel = (type: 'fast' | 'deep' = 'fast', systemInstruction?: string) => {
  const modelName = type === 'deep' ? deepModelName : fastModelName;
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction || undefined,
  });
};

export const generateText = async (
  prompt: string,
  type: 'fast' | 'deep' = 'fast',
  systemInstruction?: string
): Promise<string> => {
  const model = getGeminiModel(type, systemInstruction);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

export const generateJSON = async <T = any>(
  prompt: string,
  type: 'fast' | 'deep' = 'fast',
  systemInstruction?: string
): Promise<T> => {
  const model = getGeminiModel(type, systemInstruction);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const rawText = response.text();

  // Clean JSON code blocks
  let cleanText = rawText.trim();
  const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    cleanText = jsonMatch[0];
  }
  // Sanitize trailing commas
  cleanText = cleanText.replace(/,\s*([\]}])/g, '$1');

  try {
    return JSON.parse(cleanText) as T;
  } catch (err: any) {
    console.error('[Gemini JSON Parse Error]:', err.message, 'Raw Text:', rawText);
    throw new Error(`Failed to parse Gemini output as JSON: ${err.message}`);
  }
};

export const streamChatResponse = async (
  prompt: string,
  systemInstruction: string,
  onChunk: (chunk: string) => void
): Promise<string> => {
  const model = getGeminiModel('fast', systemInstruction);
  const result = await model.generateContentStream(prompt);

  let fullText = '';
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;
    onChunk(chunkText);
  }
  return fullText;
};
