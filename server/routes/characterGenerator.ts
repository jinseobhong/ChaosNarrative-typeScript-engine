import { Router, Request, Response } from 'express';
import { executeCascadeJSON, executeCascadeVision } from '../services/cascadeEngine';
import {
  CLASSIFIER_5VECTORS_SYSTEM_PROMPT,
  STRUCTURED_CHARACTER_COMPILER_PROMPT,
  ILLUSTRIOUS_XL_PROMPT_EXPERT_SYSTEM_PROMPT,
  assembleMasterSystemPrompt,
} from '../prompts/masterDirectives';

export const characterRouter = Router();

/**
 * Step 0: 캐릭터 이미지(일러스트)에서 2대 제약선 (목적 + 금기), 4단계 공간 레이어, 비주얼 스펙 자동 역추출 (Multimodal Vision)
 */
/**
 * Hugging Face Spaces DeepDanbooru 공인 단부루 태거 신경망 직결 함수 (태그 + 수위 레벨 추출)
 */
interface DeepDanbooruAnalysis {
  rawTags: string;
  cleanedTags: string;
  rating: 'safe' | 'ecchi' | 'nsfw';
  ratingLabel: string;
  illustriousPrompt: string;
  suggestedNegative: string;
}

async function extractDeepDanbooruTags(imageBase64: string, mimeType: string): Promise<DeepDanbooruAnalysis | null> {
  try {
    const { Client } = await import('@gradio/client');
    const hfToken = process.env.HF_TOKEN;
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const imgBuffer = Buffer.from(cleanBase64, 'base64');
    const blob = new Blob([imgBuffer], { type: mimeType || 'image/png' });

    console.log('[DeepDanbooru] Connecting to hysts/DeepDanbooru...');
    const client = await Client.connect('hysts/DeepDanbooru', {
      token: hfToken,
    });

    const result = await client.predict('/predict', {
      image: blob,
      score_threshold: 0.45,
    });

    const tagString = (result.data as any)?.[2] as string;
    if (!tagString) return null;

    const rawTagList = tagString.split(',').map((t) => t.trim());

    // 1. 수위(Rating) 정밀 판별
    let rating: 'safe' | 'ecchi' | 'nsfw' = 'safe';
    let ratingLabel = '🟢 Safe (일반/건전)';

    const hasExplicit = rawTagList.some((t) =>
      ['rating:explicit', 'areolae', 'areola_slip', 'nipples', 'uncensored', 'pussy', 'penis', 'sex', 'nude', 'completely_nude'].includes(t)
    );
    const hasQuestionable = rawTagList.some((t) =>
      ['rating:questionable', 'bikini', 'swimsuit', 'cleavage', 'underwear', 'lingerie', 'thighs', 'huge_breasts', 'navel', 'string_bikini', 'wet'].includes(t)
    );

    if (hasExplicit) {
      rating = 'nsfw';
      ratingLabel = '🔴 NSFW (완전 성인/초고수위)';
    } else if (hasQuestionable) {
      rating = 'ecchi';
      ratingLabel = '🟡 Ecchi (약후방/선정적 노출)';
    }

    // 2. 태그 정제 (언더스코어 공백 치환, 중복/시스템 태그 정리)
    const cleanedTagList = rawTagList
      .map((t) => t.replace(/_/g, ' '))
      .filter((t) => t && !t.startsWith('rating:') && t !== 'general');

    // 3. Illustrious XL (SDXL v17) 마스터 규격으로 재조립
    const qualityAnchors = ['masterpiece', 'best quality', 'amazing quality', 'newest', 'very aesthetic'];
    
    // 주체 선언 (1girl, solo 우선)
    const subjectTags = ['1girl', 'solo'];
    const filteredTags = cleanedTagList.filter(
      (t) => !qualityAnchors.includes(t) && !subjectTags.includes(t) && t !== 'girl'
    );

    // 수위 맞춤형 보조 태그
    const ratingModifiers: string[] = [];
    if (rating === 'nsfw') {
      ratingModifiers.push('nsfw', 'explicit');
    } else if (rating === 'ecchi') {
      ratingModifiers.push('ecchi', 'suggestive');
    }

    const compiledIllustriousPrompt = [
      ...qualityAnchors,
      ...subjectTags,
      ...ratingModifiers,
      ...filteredTags,
    ].join(', ');

    // 4. 수위 맞춤형 다이내믹 네거티브 프롬프트
    let dynamicNegative = 'worst quality, low quality, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, blurry, cropped, watermark, username, text, signature';
    if (rating === 'safe') {
      dynamicNegative += ', nsfw, nude, nipples, cleavage, suggestive';
    }

    console.log(`[DeepDanbooru + Illustrious XL] Extracted ${filteredTags.length} tags [${ratingLabel}]`);

    return {
      rawTags: tagString,
      cleanedTags: cleanedTagList.join(', '),
      rating,
      ratingLabel,
      illustriousPrompt: compiledIllustriousPrompt,
      suggestedNegative: dynamicNegative,
    };
  } catch (err: any) {
    console.error('[DeepDanbooru Warning]:', err.message);
    return null;
  }
}

characterRouter.post('/analyze-character-image', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType, additionalContext, preferredModelId } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'imageBase64 is required' });
      return;
    }

    // 1. DeepDanbooru 신경망 직접 호출하여 100% 공인 단부루 태그 + 수위 레벨 추출
    const danbooruAnalysis = await extractDeepDanbooruTags(imageBase64, mimeType || 'image/png');

    // 2. Gemini Vision을 통해 2대 제약선(목적/금기) 및 한국어 외모 서술 추출
    const visionSystemPrompt = `[SYSTEM DIRECTIVE: MULTIMODAL CHARACTER PROFILER & NOVEL SPEC COMPILER]
당신은 애니메 일러스트로부터 [🎯 무조건 이루어내야 하는 목적], [🚫 절대적 금기 & 역린], 그리고 [👗 소설 서사용 한국어 외모 묘사]를 추출하는 수석 페르소나 아키텍트다.
DeepDanbooru 신경망이 추출한 단부루 태그와 이미지를 바탕으로 풍부한 심리 제약선과 자연어 외모 묘사를 JSON으로 추출하라.

[출력 JSON 포맷]
{
  "name": "추천 캐릭터 이름",
  "title": "추천 칭호/직책",
  "affiliation": "추천 소속",
  "archetype": "Rigid" | "Endurer" | "Controller" | "Deprived",
  "archetype_detail": "고유 심리 방어 기제",
  "spatialLayer": "Layer 3 (완전 밀실 - 사회적·심리적 제약 조건 해체 공간)",
  "positiveGoal": "🎯 캐릭터의 구체적 획득 목적",
  "negativeTaboo": "🚫 캐릭터의 절대적 금기 & 역린",
  "appearanceKorean": "소설 속 인물 묘사용 자연어 한국어 외모 묘사 (헤어, 눈동자, 복장, 체형, 피부 상태)",
  "narrativeProfile": "롤플레잉 상황 및 심리전 중심의 서사 설정"
}`;

    const promptText = `이 캐릭터 일러스트를 분석하여 [🎯 무조건 이루어야 할 목적]과 [🚫 절대적 금기], 그리고 소설 묘사용 한국어 외모 서술을 JSON으로 추출하라.${
      danbooruAnalysis ? `\n\n[DeepDanbooru 신경망이 1:1 역추출한 공인 단부루 태그 및 수위 (${danbooruAnalysis.ratingLabel})]:\n${danbooruAnalysis.illustriousPrompt}` : ''
    }${additionalContext ? `\n\n[사용자 추가 요청 메모]: ${additionalContext}` : ''}`;

    const result = await executeCascadeVision(
      imageBase64,
      mimeType || 'image/png',
      promptText,
      visionSystemPrompt,
      preferredModelId
    );

    const finalData = result.data || {};
    // DeepDanbooru 태그 및 수위 분석 데이터 주입
    if (danbooruAnalysis) {
      finalData.danbooruTags = danbooruAnalysis.illustriousPrompt;
      finalData.rating = danbooruAnalysis.rating;
      finalData.ratingLabel = danbooruAnalysis.ratingLabel;
      finalData.negativePrompt = danbooruAnalysis.suggestedNegative;
    }

    res.json({
      success: true,
      data: finalData,
      deepDanbooruUsed: !!danbooruAnalysis,
      rating: danbooruAnalysis?.rating || 'safe',
      ratingLabel: danbooruAnalysis?.ratingLabel || '🟢 Safe (일반/건전)',
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

    const goal = positiveGoal ? positiveGoal.trim() : '';
    const taboo = negativeTaboo ? negativeTaboo.trim() : '';
    const layer = spatialLayer || 'Layer 3 (완전 밀실 - 사회적·심리적 제약 조건 해체 공간)';
    const background = userPrompt || '';

    const prompt = `<positive_goal>\n${goal || '(사용자 미입력 - background_concept 자유 서사에서 가장 극적인 목적을 자동 도출하라)'}\n</positive_goal>\n<negative_taboo>\n${taboo || '(사용자 미입력 - background_concept 자유 서사에서 가장 치명적인 금기/역린을 자동 도출하라)'}\n</negative_taboo>\n<spatial_layer>\n${layer}\n</spatial_layer>\n<background_concept>\n${background}\n</background_concept>\n\n위 정보(제약선 및 자유 서사)를 기반으로, 캐릭터의 [🎯 목적], [🚫 금기]를 확정하고, 유저와 충돌하는 5가지 상호 직교(Orthogonal) 서사 궤적(V1~V5) JSON을 생성하라. (positive_goal/negative_taboo가 미입력인 경우 background_concept 자유 서사를 분석하여 boundary.positive_goal과 boundary.negative_taboo를 자동 도출하여 채워라)`;
    
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
    const {
      seed_hash,
      boundary,
      selected_vector,
      appearance_korean,
      danbooru_tags,
      narrative_context,
      avatar_url,
      preferredModelId,
    } = req.body;

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
      user_provided_specs: {
        appearance_korean: appearance_korean || '',
        narrative_context: narrative_context || '',
        danbooru_tags: danbooru_tags || '',
      },
    };

    const prompt = `<approved_baseline>\n${JSON.stringify(compilePayload, null, 2)}\n</approved_baseline>\n\n위 승인된 베이스라인 및 사용자 외모/서사 설정에 맞추어, 세부 외모 스펙, 2대 제약선(목적+금기), 4단계 공간 레이어, 현대 심리학 3대 욕구(autonomy, competence, relatedness), 초기 시나리오 및 5대 퀵 선택지를 포함한 완성형 캐릭터 구조화 JSON을 컴파일하라.`;

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
      appearance: {
        ...(rawCharacter.appearance || {}),
        aiImagePrompt: danbooru_tags || rawCharacter.appearance?.aiImagePrompt || '',
      },
      avatarUrl: avatar_url || rawCharacter.avatarUrl || undefined,
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

/**
 * Step 4.5: Illustrious XL 전용 단부루(Danbooru) 프롬프트 전문 컴파일러 API
 */
characterRouter.post('/compile-illustrious-prompt', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      character,
      appearanceKorean,
      mood,
      clothingStyle = 'default',
      rating = 'ecchi',
      locationOverride,
      additionalDirectives,
      preferredModelId,
    } = req.body;

    if (!character && !appearanceKorean) {
      res.status(400).json({ error: 'character or appearanceKorean data is required' });
      return;
    }

    const charName = character?.name || '';
    const appearance = character?.appearance || {};
    const hair = appearance.hair
      ? [appearance.hair.color, appearance.hair.style, appearance.hair.ornament].filter(Boolean).join(' ')
      : '';
    const eyes = appearance.eyes
      ? [appearance.eyes.color, appearance.eyes.gazeStyle, appearance.eyes.expression].filter(Boolean).join(' ')
      : '';
    const body = appearance.body
      ? [appearance.body.height, appearance.body.build, appearance.body.skinTone, appearance.body.specialFeatures].filter(Boolean).join(' ')
      : '';
    const outfit = appearance.outfit
      ? [appearance.outfit.baseClothing, ...(appearance.outfit.tensionPoints || []), appearance.outfit.jewelryOrChoker].filter(Boolean).join(', ')
      : '';
    const location = locationOverride || character?.currentLocation || character?.spatialLayer || '';

    const promptText = `<character_spec>
- Name / Identity: ${charName} (${character?.title || ''} • ${character?.affiliation || ''})
- Archetype & Detail: ${character?.archetype || ''} (${character?.archetypeDetail || ''})
${appearanceKorean ? `- Korean Appearance Description: ${appearanceKorean}` : ''}
${hair ? `- Hair: ${hair}` : ''}
${eyes ? `- Eyes & Gaze: ${eyes}` : ''}
${body ? `- Body & Skin: ${body}` : ''}
${outfit ? `- Outfit & Tensions: ${outfit}` : ''}
${location ? `- Location / Setting: ${location}` : ''}
${mood ? `- Emotional State / Mood: ${mood}` : ''}
${clothingStyle && clothingStyle !== 'default' ? `- Outfit Style: ${clothingStyle}` : ''}
${rating ? `- Rating: ${rating}` : ''}
${additionalDirectives ? `- Additional Directives: ${additionalDirectives}` : ''}
</character_spec>

Analyze the above character specification (especially Korean Appearance Description if provided) and compile a production-ready Danbooru Tag Sequence JSON according to your system directives.`;

    const result = await executeCascadeJSON(
      promptText,
      ILLUSTRIOUS_XL_PROMPT_EXPERT_SYSTEM_PROMPT,
      preferredModelId
    );

    res.json({
      success: true,
      data: result.data,
      modelUsed: result.modelUsed,
      provider: result.provider,
    });
  } catch (err: any) {
    console.error('[Compile Illustrious Prompt Error]:', err);
    res.status(500).json({
      error: err.message || 'Failed to compile Illustrious XL prompt',
    });
  }
});

/**
 * Step 5: Hugging Face Spaces Illustrious XL (WAI-NSFW-illustrious-SDXL) 고화질 일러스트 생성 API
 */
characterRouter.post('/generate-illustrious-image', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      prompt,
      negativePrompt,
      seed = 0,
      aspectRatio = '1344 x 1728',
      modelName = 'v17',
      numInferenceSteps = 25,
      guidanceScale = 7,
      sampler = 'Euler a',
      useUpscaler = false,
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    const hfToken = process.env.HF_TOKEN;
    const { Client } = await import('@gradio/client');

    const defaultNegativePrompt =
      'worst quality, low quality, bad anatomy, bad hands, blurry, sketch, missing fingers, cropped';
    const finalNegativePrompt = negativePrompt || defaultNegativePrompt;

    console.log(`[Illustrious XL] Generating image with space IbarakiDouji/WAI-NSFW-illustrious-SDXL...`);
    console.log(`[Prompt]: ${prompt.slice(0, 100)}...`);

    const client = await Client.connect('IbarakiDouji/WAI-NSFW-illustrious-SDXL', {
      token: hfToken,
    });

    const result = await client.predict('/generate', {
      prompt: prompt,
      negative_prompt: finalNegativePrompt,
      seed: seed || Math.floor(Math.random() * 2147483647),
      custom_width: 1024,
      custom_height: 1536,
      guidance_scale: guidanceScale,
      num_inference_steps: numInferenceSteps,
      sampler: sampler,
      model_name: modelName,
      aspect_ratio_selector: aspectRatio,
      use_upscaler: useUpscaler,
      upscaler_strength: 0.55,
      upscale_by: 1.5,
      add_quality_tags: true,
    });

    // Extract image object from result
    const resultData = result.data as any;
    const gallery = resultData?.[0];
    const imageObj = gallery?.[0]?.image;
    const rawUrl = imageObj?.url;

    if (!rawUrl) {
      throw new Error('No image URL returned from Illustrious XL space');
    }

    // Download image and convert to Base64 Data URL for permanent offline preservation
    const imgResponse = await fetch(rawUrl);
    const arrayBuffer = await imgResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = imgResponse.headers.get('content-type') || 'image/png';
    const base64DataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    console.log(`[Illustrious XL] Image generated successfully! Buffer size: ${buffer.length} bytes`);

    res.json({
      success: true,
      imageUrl: base64DataUrl,
      rawUrl: rawUrl,
      metadata: resultData?.[1] || {},
    });
  } catch (err: any) {
    console.error('[Illustrious XL Generation Error]:', err);
    res.status(500).json({
      error: err.message || 'Failed to generate image from Illustrious XL space',
    });
  }
});

