import { CharacterStats, QuickOption } from './character';

export interface ChatMessage {
  id: string;
  sender: 'character' | 'user' | 'system';
  characterName?: string;
  stageBadge?: string;
  turnNumber?: number;
  narrations?: string[];
  dialogue?: string;
  userText?: string;
  actionBadge?: string;
  statChanges?: Partial<CharacterStats>;
  timestamp: string;
}

export interface NeuralMemoryState {
  layer1ReflexBuffer: string[];      // 1단계: 즉각 생체 반사 버퍼 (직전 1~2개 턴의 반사/호흡/경련)
  layer2SomaticEcho: string[];       // 2단계: 단기 감각 잔향 & 자극 버퍼 (최근 3~4개 턴의 스킨십/체온/수치심 여운)
  layer3LongTermArchive: string[];   // 3단계: 장기 영구 각인 & 심리적 부채 원장 (영구 누적되는 트라우마/서약서 탈취/비밀 폭로)
}

export interface ChatSession {
  characterId: string;
  currentTurn: number;
  currentStage: string;
  currentLocation: string;
  stats: CharacterStats;
  memoryState?: NeuralMemoryState;
  messages: ChatMessage[];
  currentOptions: QuickOption[];
  history: Array<{
    turn: number;
    stats: CharacterStats;
    memoryState?: NeuralMemoryState;
    messages: ChatMessage[];
  }>;
}
