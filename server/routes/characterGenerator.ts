import { Router, Request, Response } from 'express';
import { executeCascadeJSON, executeCascadeVision } from '../services/cascadeEngine';
import {
  CLASSIFIER_5VECTORS_SYSTEM_PROMPT,
  STRUCTURED_CHARACTER_COMPILER_PROMPT,
  assembleMasterSystemPrompt,
} from '../prompts/masterDirectives';

export const characterRouter = Router();

/**
 * Step 0: 캐릭터 이미지(일러스트)에서 2대 제약선 (목적 + 금기), 4단계 공간 레이어, 비주얼 스펙 자동 역추출 (Multimodal Vision)
 */
characterRouter.post('/analyze-character-image', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType, additionalContext, preferredModelId } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'imageBase64 is required' });
      return;
    }

    const visionSystemPrompt = `[SYSTEM DIRECTIVE: MULTIMODAL DUAL-INVARIANT CHARACTER DECODER]
당신은 세계 최고 수준의 판타지 캐릭터 디자이너이자 심리 프로파일러다.
제공된 캐릭터 이미지/일러스트를 정밀하게 시각적 분석하여, 
(1) [🎯 무조건 이루어내야 하는 목적 (Positive Goal)]
(2) [🚫 절대적인 금기 & 뺏기면 안 되는 역린 (Negative Taboo)]
(3) [🏛️ 4단계 공간 압력 레이어 (Layer 0: 공적, Layer 1: 경계면, Layer 2: 사적 내실, Layer 3: 완전 밀실)]
(4) [외모 해부학 비주얼 스펙 및 심리학적 욕구 결핍]
을 추출하여 완벽한 JSON으로 반환하라.

[출력 JSON 포맷]
{
  "name": "추천 캐릭터 이름",
  "title": "추천 칭호/직책 (예: 제1황녀, 성기사단장, 대마도사, 흑성녀, 도발적인 악마소녀 등)",
  "affiliation": "추천 소속 (예: 제국 황실, 성전 수호기사단, 마계 군단 등)",
  "archetype": "Rigid" | "Endurer" | "Controller" | "Deprived",
  "archetype_detail": "고유 방어 기제 (예: 결벽증적 척추 방어, 에나멜 슈트와 다리를 치켜든 도발적 시각 압도)",
  "spatialLayer": "Layer 3 (완전 밀실 - 사회적·심리적 제약 조건 해체 공간)",
  "positiveGoal": "🎯 캐릭터가 이 공간에서 플레이어에게서 반드시 얻어내야 할 목적 (예: 영혼 계약서 강탈, 비밀 서약서 탈환)",
  "negativeTaboo": "🚫 캐릭터가 절대 들키거나 뺏기면 안 될 금기 & 역린 (예: 바디슈트 속 봉인 마법진, 서출 혈통의 비밀)",
  "visualSummary": {
    "hair": "헤어 컬러 및 스타일",
    "eyes": "눈동자 색상 및 시선",
    "outfit": "의복 특징 및 장력 포인트",
    "mood": "전체적인 분위기"
  },
  "inferredWeakness": "시각적 요소에서 유추되는 치명적 약점 및 취약 부위",
  "narrativeProfile": "외모, 신분, 심리적 방어 기제, 2대 제약선(목적/금기) 및 공간 긴장감이 집약된 캐릭터 완성형 서사 프로필"
}`;

    const promptText = `이 캐릭터 일러스트를 정밀 분석하여 [🎯 무조건 이루어야 할 목적]과 [🚫 절대적 금기], 그리고 외모 스펙을 JSON으로 추출하라.${
      additionalContext ? `\n\n[사용자 추가 요청 메모]: ${additionalContext}` : ''
    }`;

    const result = await executeCascadeVision(
      imageBase64,
      mimeType || 'image/png',
      promptText,
      visionSystemPrompt,
      preferredModelId
    );

    res.json({
      success: true,
      data: result.data,
      modelUsed: result.modelUsed,
      provider: result.provider,
    });
  } catch (err: any) {
    console.error('[Vision Analysis Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze character image' });
  }
});

/**
 * Step 1: 2대 제약선 (목적 + 금기) & 4단계 공간 레이어 기반 5대 서사 궤적(V1~V5) 및 GENE SEED 도출
 */
characterRouter.post('/generate-vectors', async (req: Request, res: Response): Promise<void> => {
  try {
    const { positiveGoal, negativeTaboo, spatialLayer, userPrompt, preferredModelId } = req.body;

    const goal = positiveGoal || '당신에게서 주도권과 가문의 비밀을 지켜내고 자신의 권위를 수호하는 것';
    const taboo = negativeTaboo || '자신의 과거나 혈통의 비밀을 타인에게 간파당하는 것';
    const layer = spatialLayer || 'Layer 3 (완전 밀실 - 사회적·심리적 제약 조건 해체 공간)';
    const background = userPrompt || '';

    const prompt = `<positive_goal>\n${goal}\n</positive_goal>\n<negative_taboo>\n${taboo}\n</negative_taboo>\n<spatial_layer>\n${layer}\n</spatial_layer>\n<background_concept>\n${background}\n</background_concept>\n\n위 2대 핵심 제약선(목적+금기)과 공간 레이어를 100% 확정하여, 캐릭터가 목적을 달성하기 위해 유저와 충돌하는 5가지 상호 직교(Orthogonal) 서사 궤적(V1~V5) JSON을 생성하라.`;
    
    const result = await executeCascadeJSON(
      prompt,
      CLASSIFIER_5VECTORS_SYSTEM_PROMPT,
      preferredModelId
    );

    res.json({
      success: true,
      data: result.data,
      modelUsed: result.modelUsed,
      provider: result.provider,
      attemptedModels: result.attemptedModels,
    });
  } catch (err: any) {
    console.error('[Generate Vectors Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to generate resolution vectors' });
  }
});

/**
 * Step 2: 외모 해부학 스펙, 현대 심리학 3대 욕구, 공간 레이어, 초기 시나리오 및 25대 마스터 프롬프트 컴파일
 */
characterRouter.post('/compile-character', async (req: Request, res: Response): Promise<void> => {
  try {
    const { seed_hash, boundary, selected_vector, preferredModelId } = req.body;

    const compilePayload = {
      seed_hash: seed_hash || '#HERO-70G-INIT',
      boundary: boundary || { 
        target_domain: '등장인물', 
        positive_goal: '당신에게서 주도권을 지켜내고 자신의 권위를 수호하는 것',
        negative_taboo: '자신의 과거나 혈통의 비밀을 타인에게 간파당하는 것',
        spatial_layer: 'Layer 3 (완전 밀실 - 사회적·심리적 제약 조건 해체 공간)',
        archetype: 'Rigid', 
        archetype_detail: '고유 방어 기제' 
      },
      selected_vector: selected_vector || { vector_id: 'V1', vector_name: '순응과 저항' },
    };

    const prompt = `<approved_baseline>\n${JSON.stringify(compilePayload, null, 2)}\n</approved_baseline>\n\n위 승인된 베이스라인에 맞추어, 세부 외모 스펙, 2대 제약선(목적+금기), 4단계 공간 레이어, 현대 심리학 3대 욕구(autonomy, competence, relatedness), 초기 시나리오 및 5대 퀵 선택지를 포함한 완성형 캐릭터 구조화 JSON을 컴파일하라.`;

    const result = await executeCascadeJSON(
      prompt,
      STRUCTURED_CHARACTER_COMPILER_PROMPT,
      preferredModelId
    );

    const rawCharacter = result.data || {};

    // Safe 5-pillar stats normalization
    const normalizedStats = {
      domRate: Number(rawCharacter?.stats?.domRate ?? rawCharacter?.stats?.dom_rate ?? 95.0),
      erosRate: Number(rawCharacter?.stats?.erosRate ?? rawCharacter?.stats?.eros_rate ?? rawCharacter?.stats?.love ?? 5.0),
      trustRate: Number(rawCharacter?.stats?.trustRate ?? rawCharacter?.stats?.trust_rate ?? rawCharacter?.stats?.trust ?? 15.0),
      fractureRate: Number(rawCharacter?.stats?.fractureRate ?? rawCharacter?.stats?.fracture_rate ?? rawCharacter?.stats?.guilt ?? 10.0),
      taintRate: Number(rawCharacter?.stats?.taintRate ?? rawCharacter?.stats?.taint_rate ?? 2.0),
      trust: Number(rawCharacter?.stats?.trust ?? 20),
      love: Number(rawCharacter?.stats?.love ?? 0),
      neutralize: Number(rawCharacter?.stats?.neutralize ?? -20),
      guilt: Number(rawCharacter?.stats?.guilt ?? 15),
      submission: Number(rawCharacter?.stats?.submission ?? 20),
    };

    const finalGoal = rawCharacter.coreAgenda || boundary?.positive_goal || '당신에게서 주도권과 가문의 비밀을 지켜내고 자신의 권위를 수호하는 것';
    const finalTaboo = boundary?.negative_taboo || rawCharacter.traits?.find((t: any) => t.category?.includes('taboo'))?.description || '자신의 과거나 혈통의 비밀을 타인에게 간파당하는 것';
    const finalSpatialLayer = rawCharacter.spatialLayer || boundary?.spatial_layer || 'Layer 0 (공적 공간)';

    // Safe traits normalization with 4 Orthogonal Taboos
    let normalizedTraits = Array.isArray(rawCharacter?.traits) ? rawCharacter.traits : [];
    if (normalizedTraits.length === 0) {
      normalizedTraits = [
        {
          id: 't-1',
          category: 'taboo_somatic',
          categoryLabel: '🩸 생체/신경 금기',
          title: '생체/신경 금기',
          description: rawCharacter?.weaknessSummary || '취약 신경대 및 마력 코어 접촉',
        },
        {
          id: 't-2',
          category: 'taboo_social',
          categoryLabel: '🛡️ 신분/사회 금기',
          title: '신분/사회 금기',
          description: finalTaboo,
        },
        {
          id: 't-3',
          category: 'taboo_moral',
          categoryLabel: '🧠 도덕/신념 금기',
          title: '도덕/신념 금기',
          description: '신성 맹세 및 굴종 거부 긍지',
        },
        {
          id: 't-4',
          category: 'taboo_secret',
          categoryLabel: '🗝️ 비밀/계약 금기',
          title: '비밀/계약 금기',
          description: '진명 및 영혼 서약서 유출',
        },
      ];
    }

    // Generate unique ID and code
    const charId = `char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullCode = seed_hash || `#${(rawCharacter.name || 'HERO').toUpperCase()}-70G-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const completeCharacter = {
      ...rawCharacter,
      id: charId,
      code: fullCode,
      name: rawCharacter.name || '미지의 인물',
      title: rawCharacter.title || '칭호',
      affiliation: rawCharacter.affiliation || '소속',
      avatarInitial: rawCharacter.avatarInitial || (rawCharacter.name ? rawCharacter.name.charAt(0) : '캐'),
      avatarColor: rawCharacter.avatarColor || 'bg-purple-700',
      archetype: rawCharacter.archetype || boundary?.archetype || 'Rigid',
      archetypeDetail: rawCharacter.archetypeDetail || boundary?.archetype_detail || '고유 방어 기제',
      spatialLayer: finalSpatialLayer,
      stage: rawCharacter.stage || 'Stage 1 (오만과 철벽 - 목적 달성을 위한 경계)',
      currentLocation: rawCharacter.currentLocation || '#심연의밀실',
      egoSummary: rawCharacter.egoSummary || '절대적인 자존심과 고결한 방어 프로토콜',
      weaknessSummary: rawCharacter.weaknessSummary || '타인의 체온과 스킨십에 극도로 취약함',
      coreAgenda: finalGoal,
      stakes: rawCharacter.stakes || '당신에게 굴복하거나 약점을 잡히면 가문이 몰락하고 영구적인 종속 상태로 전락함',
      userLeverage: rawCharacter.userLeverage || '당신이 그녀의 절대적인 치부와 밀실의 열쇠를 쥐고 있음',
      psychology: rawCharacter.psychology || {
        autonomyDrive: '자율성 & 통제벽 92%',
        competenceDefense: '에고 자존감 방어 및 반동형성',
        relatednessDeficit: '만성적 소마틱 체온 결핍 및 억압된 애착 갈망',
      },
      stats: normalizedStats,
      traits: normalizedTraits,
      appearance: rawCharacter.appearance || {},
      initialScenario: rawCharacter.initialScenario || {
        turn: 1,
        narration: ['서늘한 밀실 안에서 캐릭터가 당신을 차갑게 노려보고 있다.'],
        dialogue: '',
        quickOptions: [],
      },
      selectedVector: selected_vector,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 25,000자급 마스터 시스템 지시사항 조립
    completeCharacter.masterSystemPrompt = assembleMasterSystemPrompt(completeCharacter);

    res.json({
      success: true,
      character: completeCharacter,
      modelUsed: result.modelUsed,
      provider: result.provider,
      attemptedModels: result.attemptedModels,
    });
  } catch (err: any) {
    console.error('[Compile Character Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to compile character' });
  }
});
