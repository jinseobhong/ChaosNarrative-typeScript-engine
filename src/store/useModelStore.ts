import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ModelOption {
  id: string;
  name: string;
  provider: 'google' | 'anthropic';
  category: 'fast' | 'deep';
  maxOutputTokens: number;
  description: string;
  recommendedRole: 'chat' | 'compilation' | 'both';
}

interface ModelState {
  models: ModelOption[];
  activeModelId: string;
  cascadeList: string[];
  providersStatus: { google: boolean; anthropic: boolean };
  isLoading: boolean;

  // Actions
  setActiveModelId: (id: string) => void;
  setCascadeList: (list: string[]) => void;
  fetchModels: () => Promise<void>;
  getActiveModel: () => ModelOption | undefined;
}

const DEFAULT_FALLBACK_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    provider: 'google',
    category: 'fast',
    maxOutputTokens: 8192,
    description: '현재 가장 즉각적이고 안정적인 초고속 턴 대화 및 궤적 추출 모델 (기본 1순위)',
    recommendedRole: 'both',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'google',
    category: 'fast',
    maxOutputTokens: 8192,
    description: '안정적인 초고속 경량 플래시 모델',
    recommendedRole: 'chat',
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'google',
    category: 'fast',
    maxOutputTokens: 65536,
    description: '대용량 고성능 플래시 모델',
    recommendedRole: 'both',
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    provider: 'google',
    category: 'fast',
    maxOutputTokens: 65536,
    description: 'Google AI 최신 플래시 모델',
    recommendedRole: 'both',
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    category: 'deep',
    maxOutputTokens: 64000,
    description: '최신 플래그십 하이브리드 추론 모델 (Claude 유료 크레딧 필요)',
    recommendedRole: 'both',
  },
];

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      models: DEFAULT_FALLBACK_MODELS,
      activeModelId: 'gemini-3.5-flash-lite',
      cascadeList: [
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.6-flash',
        'gemini-3.7-flash',
        'claude-3-7-sonnet-20250219',
      ],
      providersStatus: { google: true, anthropic: false },
      isLoading: false,

      setActiveModelId: (id) => set({ activeModelId: id }),
      setCascadeList: (list) => set({ cascadeList: list }),

      fetchModels: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/models');
          if (res.ok) {
            const data = await res.json();
            set({
              models: data.models || DEFAULT_FALLBACK_MODELS,
              cascadeList: data.defaultCascade || get().cascadeList,
              providersStatus: data.providers || { google: true, anthropic: false },
            });
          }
        } catch (err) {
          console.warn('[ModelStore] Failed to fetch /api/models, using defaults.');
        } finally {
          set({ isLoading: false });
        }
      },

      getActiveModel: () => {
        const { models, activeModelId } = get();
        return models.find((m) => m.id === activeModelId) || models[0];
      },
    }),
    {
      name: 'abyss-model-settings-v4',
    }
  )
);
