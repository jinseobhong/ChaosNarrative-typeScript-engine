import { Router, Request, Response } from 'express';
import { executeCascadeStream } from '../services/cascadeEngine';
import { assembleMasterSystemPrompt } from '../prompts/masterDirectives';

export const chatRouter = Router();

chatRouter.post('/chat-stream', async (req: Request, res: Response): Promise<void> => {
  try {
    const { character, messages, userInput, currentStats, currentTurn, memoryState, preferredModelId } = req.body;

    if (!character || !userInput) {
      res.status(400).json({ error: 'character and userInput are required' });
      return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // 🚨 Always dynamically assemble the latest prompt so stale cached prompts from localStorage are never used!
    const systemPrompt = assembleMasterSystemPrompt(character);

    // Build conversation context
    let promptHistory = `<CONVERSATION_HISTORY>\n`;
    if (messages && Array.isArray(messages)) {
      for (const msg of messages.slice(-8)) {
        if (msg.sender === 'user') {
          promptHistory += `[당신의 행동/대사]: ${msg.userText}\n`;
        } else if (msg.sender === 'character') {
          const fullContent = msg.narrations?.join('\n') || msg.userText || '';
          promptHistory += `[${character.name}]: ${fullContent}\n`;
        }
      }
    }
    promptHistory += `</CONVERSATION_HISTORY>\n\n`;

    // Build 3-Tier Synaptic Memory Context
    let memoryContext = `<SYNAPTIC_MEMORY_STATE>\n`;
    if (memoryState) {
      if (memoryState.layer1ReflexBuffer?.length) {
        memoryContext += `[1단계 즉각 생체 반사 이력]:\n${memoryState.layer1ReflexBuffer.slice(-2).map((r: string) => `• ${r}`).join('\n')}\n`;
      }
      if (memoryState.layer2SomaticEcho?.length) {
        memoryContext += `[2단계 단기 감각 잔향 & 자극 버퍼]:\n${memoryState.layer2SomaticEcho.slice(-4).map((e: string) => `• ${e}`).join('\n')}\n`;
      }
      if (memoryState.layer3LongTermArchive?.length) {
        memoryContext += `[3단계 장기 영구 각인 & 부채 원장]:\n${memoryState.layer3LongTermArchive.slice(-6).map((a: string) => `• ${a}`).join('\n')}\n`;
      }
    }
    memoryContext += `</SYNAPTIC_MEMORY_STATE>\n\n`;

    const userPrompt = `${promptHistory}${memoryContext}[CURRENT TURN: ${currentTurn || 1}]
[CURRENT STATS: DOM ${currentStats?.domRate ?? 95}%, EROS ${currentStats?.erosRate ?? 5}%, TRUST ${currentStats?.trustRate ?? 15}%, FRACTURE ${currentStats?.fractureRate ?? 10}%, TAINT ${currentStats?.taintRate ?? 2}%]
[CURRENT LOCATION: ${character.currentLocation || 'Layer 0 (공적 공간)'}]

[당신의 새로운 행동/대사]:
${userInput}

[🚨 최고 우선순위 집필 지침]:
1. [전천후 만능 서사 적응 & 티키타카 극대화]: 유저가 건네는 말의 성격(일상 잡담, 츤데레 만담, 모험/미스터리 협력, 로맨스/썸, 치명적 심리전/성애)을 있는 그대로 자연스럽게 받아들여라. 무조건 심각하게 발작하지 말고, 일상 대화에는 위트와 핀잔, 차 한잔의 여유로 찰지게 티키타카를 나누어라.
2. [단순 복종 절대 금지 & 팽팽한 밀당]: 캐릭터는 절대 무기력한 인형이 되지 않는다. 유저의 말꼬리를 잡고 독설, 역제안, 츤데레 핀잔으로 맞받아치며 살아있는 핑퐁 대화를 유지하라.
3. [맥락 공간 전이]: 일상 대화는 Layer 0(공적)/Layer 1(경계)에서 편안히 나누고, 은밀하거나 깊어질 때만 Layer 2(사적)/Layer 3(밀실)로 자연스럽게 전이하고 [SPATIAL ANCHOR]에 기록하라.
4. [5차원 카오스 심리 나침반]: 상황에 맞추어 DOM(당당함), EROS(설렘/성애), TRUST(유대감), FRACTURE(부끄러움/당황), TAINT(각인도)를 유연하게 가감하라. 일상 대화에서는 평온과 은근한 호감(TRUST 소폭 상승)을 유지하라.
5. [3단계 분리 기억 갱신]: 출력 최하단 [CUMULATIVE NEURAL & MEMORY LEDGER]에 1단계 반사, 2단계 잔향, 3단계 장기 각인을 각각 1줄씩 명확히 기록하라.
6. [상황 맞춤형 5대 선택지]: 현재 상황(일상/모험/로맨스/심리전)의 맥락에 완벽히 어울리는 [직전 흐름 심화 2종] + [상호 직교 분기 3종]으로 5개 선택지를 동적 구성하라.`;

    let accumulatedText = '';

    const streamResult = await executeCascadeStream(
      userPrompt,
      systemPrompt,
      (chunk) => {
        accumulatedText += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      },
      preferredModelId
    );

    res.write(
      `data: ${JSON.stringify({
        done: true,
        fullText: accumulatedText || streamResult.data,
        modelUsed: streamResult.modelUsed,
        provider: streamResult.provider,
      })}\n\n`
    );
    res.end();
  } catch (err: any) {
    console.error('[Chat Stream Error]:', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Stream error occurred' })}\n\n`);
    res.end();
  }
});
