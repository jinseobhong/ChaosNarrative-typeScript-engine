export interface LLMModelInfo {
  id: string;
  name: string;
  provider: 'google' | 'anthropic';
  category: 'fast' | 'deep';
  maxOutputTokens: number;
  description: string;
  recommendedRole: 'chat' | 'compilation' | 'both';
}

/**
 * 공식 지원 LLM 모델 내부 레지스트리 (Google Gemini & Anthropic Claude)
 */
export const MODEL_REGISTRY: LLMModelInfo[] = [
  // ================= Google Gemini Models (실제 검증 완료 활성 모델) =================
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
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    provider: 'google',
    category: 'fast',
    maxOutputTokens: 65536,
    description: '최신 플래그십 플래시 모델',
    recommendedRole: 'both',
  },

  // ================= Anthropic Claude Models =================
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    category: 'deep',
    maxOutputTokens: 64000,
    description: '최신 플래그십 하이브리드 추론 모델 (Claude 유료 크레딧 필요)',
    recommendedRole: 'both',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    category: 'deep',
    maxOutputTokens: 8192,
    description: '업계 표준 고성능 서사/코딩 모델 (Claude 유료 크레딧 필요)',
    recommendedRole: 'both',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    category: 'fast',
    maxOutputTokens: 8192,
    description: '초고속 경량화 모델 (Claude 유료 크레딧 필요)',
    recommendedRole: 'chat',
  },
];

/**
 * 기본 캐스케이드 우선순위 목록 (1차 실패 시 2차 ➔ 3차 ➔ 4차로 자동 폴백)
 */
export const DEFAULT_CASCADE_LIST: string[] = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
];

export const getModelById = (id: string): LLMModelInfo | undefined => {
  return MODEL_REGISTRY.find((m) => m.id === id);
};
