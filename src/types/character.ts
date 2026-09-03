export type ArchetypeTag = 'Rigid' | 'Endurer' | 'Controller' | 'Deprived' | 'All';

export interface AppearanceSpec {
  hair: {
    color: string;
    style: string;
    ornament?: string;
  };
  eyes: {
    color: string;
    gazeStyle: string;
    expression: string;
  };
  body: {
    height?: string;
    build: string;
    skinTone: string;
    specialFeatures?: string; // 뿔, 날개, 꼬리, 마력 각인 등
  };
  outfit: {
    baseClothing: string;
    tensionPoints: string[]; // 초커 장력, 코르셋 압박, 갑주 이음새 등
    jewelryOrChoker?: string;
  };
  sensory: {
    temperature: string;    // 차가운 체온, 서늘한 미열 등
    aroma: string;          // 은은한 백합 향, 서늘한 마력 잔향 등
  };
  aiImagePrompt: string;    // AI 일러스트 생성용 영문 프롬프트 (e.g. "1girl, silver hair, glowing golden eyes, gothic choker...")
}

export interface CharacterTrait {
  id: string;
  category: 'taboo_somatic' | 'taboo_social' | 'taboo_moral' | 'taboo_secret' | 'taboo' | 'weakness' | 'pleasure' | 'secret' | 'body' | 'custom';
  categoryLabel: string;
  title: string;
  description: string;
}

export interface CharacterStats {
  domRate: number;       // 👑 주도권 / 자존심 (0~100%)
  erosRate: number;      // 💋 성애 / 리비도 (0~100%)
  trustRate: number;     // 💚 신뢰 / 정서 유대 (0~100%)
  fractureRate: number;  // ⚡ 균열 / 수치심 (0~100%)
  taintRate: number;     // 🖤 타락 / 소마틱 각인 (0~100%)
  // Backward compatibility aliases
  trust?: number;
  love?: number;
  neutralize?: number;
  guilt?: number;
  submission?: number;
}

export interface QuickOption {
  id: string;
  type: 'compliance' | 'rebuttal' | 'seduce' | 'dominate' | 'bypass' | 'custom';
  label: string;
  badgeText: string;
  colorClass: string;
  text: string;
  statImpact?: Partial<CharacterStats>;
}

export interface ResolutionVector {
  vector_id: 'V1' | 'V2' | 'V3' | 'V4' | 'V5';
  vector_name: string;
  axis_description: string;
  operation: string;
  target_entity: string;
}

export interface UniversalTensor {
  id: string;
  name: string;
  state: string;
  active: boolean;
}

export interface NeuralMemoryLedger {
  layer1_primitive_reflex: string[];      // 무조건 반사, 조건 반사
  layer2_short_term_somatic: string[];    // 단기 감각 잔향, 이력현상, 흐트러짐
  layer3_long_term_archive: string[];     // 영구 신체 각인, 정서적 부채, 비밀
}

export interface Character {
  id: string;
  code: string;               // e.g. "R12.2-700-BFFF" / "#LILITH-70G-BFFF"
  name: string;               // e.g. "릴리스"
  title: string;              // e.g. "제1황녀"
  affiliation: string;        // e.g. "제국 황실"
  avatarInitial: string;      // e.g. "릴"
  avatarColor: string;        // Tailwind bg color e.g. "bg-amber-600"
  archetype: 'Rigid' | 'Endurer' | 'Controller' | 'Deprived';
  archetypeDetail: string;    // e.g. "결벽증적 척추 방어"
  spatialLayer?: string;      // e.g. "Layer 3 (완전 밀실 - 사회적·심리적 제약 조건 해체 공간)"
  stage: string;              // e.g. "Stage 1 (단성 게릴 - 온전한 오만과 냉철)"
  currentLocation: string;    // e.g. "#침실"
  egoSummary: string;         // e.g. "국가를 통솔하는 서늘한 고결 프로토콜..."
  weaknessSummary: string;    // e.g. "가문의 거대한 빚과 영지를 동결시킬 수 있는 권능에 취약..."
  coreAgenda?: string;        // 🎯 핵심 목적 & 긴급 과제 (이 자리에서 꼭 얻어내거나 지켜야 하는 것)
  stakes?: string;            // ⚖️ 파멸의 판돈 & 위기 (실패하거나 굴복했을 때 잃게 되는 것)
  userLeverage?: string;      // ⚔️ 유저와의 권력 역학 & 레버리지 (유저가 쥔 결정적 약점/패)
  psychology?: {
    autonomyDrive: string;
    competenceDefense: string;
    relatednessDeficit: string;
  };
  appearance?: AppearanceSpec;
  stats: CharacterStats;
  traits: CharacterTrait[];
  universalTensors?: UniversalTensor[];
  memoryLedger?: NeuralMemoryLedger;
  selectedVector?: ResolutionVector;
  masterSystemPrompt?: string; // 25,000~30,000자 풀 스펙 마스터 지시사항
  initialScenario: {
    turn: number;
    narration: string[];
    dialogue: string;
    quickOptions: QuickOption[];
  };
  promptNote?: string;
  createdAt: string;
  updatedAt: string;
}
