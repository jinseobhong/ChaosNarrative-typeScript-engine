import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Character, CharacterStats, QuickOption } from '../types/character';
import { ChatMessage, ChatSession } from '../types/chat';

interface ChatStoreState {
  activeCharacterId: string | null;
  sessions: Record<string, ChatSession>; // characterId -> ChatSession
  isStreaming: boolean;
  streamingMessageText: string;

  // Actions
  initOrLoadSession: (character: Character) => void;
  sendQuickAction: (option: QuickOption, character: Character) => Promise<void>;
  sendCustomMessage: (userText: string, character: Character) => Promise<void>;
  undoLastTurn: () => void;
  regenerateLastResponse: (character: Character) => Promise<void>;
  resetCurrentSession: (character: Character) => void;
  deleteSession: (characterId: string) => void;
  getActiveSession: () => ChatSession | null;
}

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

// Remove any leaked module codes like [02_ocular_and_gaze], [03_cervical], etc.
export const sanitizeNarrativeText = (text: string): string => {
  return text
    .replace(/\[\d{2}_[a-zA-Z_]+\]/g, '') // remove [02_ocular_and_gaze], etc.
    .replace(/\[Track-\d+[^\]]*\]/gi, '')
    .replace(/\[Layer\s*\d+[^\]]*\]/gi, '')
    .replace(/\[Spotlight[^\]]*\]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

// Extract ONLY the clean story prose during live streaming (hiding raw metadata headers)
export const extractStreamingNarrative = (rawText: string): string => {
  if (!rawText) return '';

  if (rawText.includes('[NARRATIVE]')) {
    const afterNarrative = rawText.split(/\[NARRATIVE\]/i)[1] || '';
    const cleanSection = afterNarrative
      .split(/\[NEXT CHOICES\]/i)[0]
      ?.split(/\[CUMULATIVE NEURAL/i)[0] || afterNarrative;
    return sanitizeNarrativeText(cleanSection);
  }

  // If still generating [STATUS META], return empty string to avoid showing raw tags
  if (rawText.includes('[STATUS META]') || rawText.startsWith('---') || rawText.includes('[STAGE]')) {
    return '';
  }

  return sanitizeNarrativeText(rawText);
};

// 3-Tier + Dynamic 5-Choices Output Parser (Natural 3rd-person novel format)
const parse3TierResponse = (rawText: string, character: Character, currentStats: CharacterStats, turn: number) => {
  let narrations: string[] = [];
  let updatedStats: CharacterStats = { ...currentStats };
  let stageBadge = character.stage;
  let dynamicOptions: QuickOption[] | null = null;

  // 1. Parse [STATS] line if present (5-Pillar Perturbed System)
  const statsMatch = rawText.match(/\[STATS\]\s*([^\n]+)/i);
  if (statsMatch) {
    const statLine = statsMatch[1];
    const domM = statLine.match(/DOM:\s*([\d.]+)%/i);
    const erosM = statLine.match(/EROS:\s*([\d.]+)%/i) || statLine.match(/LOVE:\s*(\d+)%/i);
    const trustM = statLine.match(/TRUST:\s*([\d.]+)%/i);
    const fracM = statLine.match(/FRACTURE:\s*([\d.]+)%/i) || statLine.match(/GUILT:\s*(\d+)%/i);
    const taintM = statLine.match(/TAINT:\s*([\d.]+)%/i);

    if (domM) updatedStats.domRate = clamp(parseFloat(domM[1]), 0, 100);
    if (erosM) updatedStats.erosRate = clamp(parseFloat(erosM[1]), 0, 100);
    if (trustM) updatedStats.trustRate = clamp(parseFloat(trustM[1]), 0, 100);
    if (fracM) updatedStats.fractureRate = clamp(parseFloat(fracM[1]), 0, 100);
    if (taintM) updatedStats.taintRate = clamp(parseFloat(taintM[1]), 0, 100);

    // Sync backward compat aliases
    updatedStats.trust = updatedStats.trustRate;
    updatedStats.love = updatedStats.erosRate;
    updatedStats.guilt = updatedStats.fractureRate;
    updatedStats.submission = clamp(100 - (updatedStats.domRate || 0), 0, 100);
  }

  // 2. Parse [STAGE]
  const stageMatch = rawText.match(/\[STAGE\]\s*([^\n]+)/i);
  if (stageMatch) {
    stageBadge = stageMatch[1].trim();
  }

  // 2.1 Parse [SPATIAL ANCHOR] or [SPATIAL LAYER]
  let spatialLocation = character.currentLocation;
  const spatialMatch = rawText.match(/\[SPATIAL (?:ANCHOR|LAYER)\]\s*([^\n]+)/i);
  if (spatialMatch) {
    spatialLocation = spatialMatch[1].trim();
  }

  // 3. Parse [NEXT CHOICES] block if present (Dynamic Contextual Action Badges)
  if (rawText.includes('[NEXT CHOICES]')) {
    const choicesPart = rawText.split(/\[NEXT CHOICES\]/i)[1]?.split(/\[CUMULATIVE NEURAL/i)[0] || '';
    const choiceLines = choicesPart.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsedOpts: QuickOption[] = [];

    const colorThemes = [
      'border-purple-500/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/50',
      'border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50',
      'border-fuchsia-600/40 bg-fuchsia-950/30 text-fuchsia-300 hover:bg-fuchsia-900/50',
      'border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50',
      'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/50',
    ];

    let optIdx = 0;
    for (const line of choiceLines) {
      const match = line.match(/^[*-]?\s*(?:\d+\.)?\s*\[([^\]]+)\]:?\s*(.*)$/);
      if (match) {
        const badge = match[1].trim();
        const text = match[2].trim();
        if (text) {
          parsedOpts.push({
            id: `opt-dyn-${turn}-${optIdx}`,
            type: 'custom',
            label: badge,
            badgeText: badge,
            colorClass: colorThemes[optIdx % colorThemes.length],
            text,
            statImpact: { trust: 4, love: 3 },
          });
          optIdx++;
        }
      }
    }

    if (parsedOpts.length >= 2) {
      dynamicOptions = parsedOpts;
    }
  }

  // 4. Parse [CUMULATIVE NEURAL & MEMORY LEDGER]
  let parsedLedger: { reflex?: string; echo?: string; archive?: string } = {};
  if (rawText.includes('[CUMULATIVE NEURAL')) {
    const ledgerBlock = rawText.split(/\[CUMULATIVE NEURAL[^\n]*\]/i)[1] || '';
    const reflexM = ledgerBlock.match(/Layer 1\s*\([^)]+\):\s*([^\n]+)/i);
    const echoM = ledgerBlock.match(/Layer 2\s*\([^)]+\):\s*([^\n]+)/i);
    const archiveM = ledgerBlock.match(/Layer 3\s*\([^)]+\):\s*([^\n]+)/i);
    if (reflexM) parsedLedger.reflex = reflexM[1].trim();
    if (echoM) parsedLedger.echo = echoM[1].trim();
    if (archiveM) parsedLedger.archive = archiveM[1].trim();
  }

  // 5. Parse [NARRATIVE] block (preserve full 3rd-person novel paragraphs naturally)
  let narrativeText = rawText;
  if (rawText.includes('[NARRATIVE]')) {
    const parts = rawText.split(/\[NARRATIVE\]/i);
    const narrativeSection = parts[1] || '';
    narrativeText = narrativeSection.split(/\[NEXT CHOICES\]/i)[0]?.split(/\[CUMULATIVE NEURAL/i)[0] || narrativeSection;
  } else {
    // If no markers, strip headers
    narrativeText = rawText.replace(/\[STATUS META\][\s\S]*?(?=\n\n|\r\n\r\n)/, '').trim();
    narrativeText = narrativeText.split(/\[NEXT CHOICES\]/i)[0]?.split(/\[CUMULATIVE NEURAL/i)[0] || narrativeText;
  }

  // Clean raw tags
  narrativeText = sanitizeNarrativeText(narrativeText);

  // Split into natural prose paragraphs
  const paragraphs = narrativeText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith('[STATUS') && !p.startsWith('[SEED') && !p.startsWith('[STAGE') && !p.startsWith('- Layer') && !p.startsWith('- ['));

  if (paragraphs.length > 0) {
    narrations = paragraphs;
  } else if (narrativeText.trim()) {
    narrations = [narrativeText.trim()];
  }

  return { narrations, dialogue: '', updatedStats, stageBadge, spatialLocation, parsedLedger, dynamicOptions };
};

// Generate 5 dynamic next turn options as fallback
const generateNext5Options = (character: Character, turn: number): QuickOption[] => {
  const name = character.name;
  return [
    {
      id: `opt-next-1-${turn}`,
      type: 'compliance',
      label: '순응',
      badgeText: '순응',
      colorClass: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/50',
      text: `[${name}]의 눈을 부드럽게 마주하며 그녀의 불안을 달래듯 고개를 끄덕인다.`,
      statImpact: { trust: 6, love: 4, submission: 2 },
    },
    {
      id: `opt-next-2-${turn}`,
      type: 'rebuttal',
      label: '반박',
      badgeText: '반박',
      colorClass: 'border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50',
      text: `더 이상 도망칠 곳이 없음을 주지시키며 냉혹한 진실을 목전에 들이민다.`,
      statImpact: { neutralize: 8, submission: 6, domRate: -2 },
    },
    {
      id: `opt-next-3-${turn}`,
      type: 'seduce',
      label: '유혹',
      badgeText: '유혹',
      colorClass: 'border-purple-500/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/50',
      text: `그녀의 허리를 감싸쥐고 귓가에 낮고 은밀한 숨결을 불어넣는다.`,
      statImpact: { love: 8, taintRate: 4, guilt: 3 },
    },
    {
      id: `opt-next-4-${turn}`,
      type: 'dominate',
      label: '제압',
      badgeText: '제압',
      colorClass: 'border-fuchsia-600/40 bg-fuchsia-950/30 text-fuchsia-300 hover:bg-fuchsia-900/50',
      text: `그녀의 양 손목을 결박하듯 쥐고 저항을 완전히 봉쇄한다.`,
      statImpact: { submission: 10, neutralize: 6, domRate: -4 },
    },
    {
      id: `opt-next-5-${turn}`,
      type: 'bypass',
      label: '우회',
      badgeText: '우회',
      colorClass: 'border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50',
      text: `한 발자국 물러서며 의미심장한 미소를 짓고 그녀의 다음 반응을 유도한다.`,
      statImpact: { guilt: 5, trust: 3, taintRate: 2 },
    },
  ];
};

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      activeCharacterId: null,
      sessions: {},
      isStreaming: false,
      streamingMessageText: '',

      initOrLoadSession: (character: Character) => {
        const { sessions } = get();
        const charId = character.id;

        if (!sessions[charId]) {
          const initialMessage: ChatMessage = {
            id: `msg-${Date.now()}-init`,
            sender: 'character',
            characterName: character.name,
            stageBadge: character.stage,
            turnNumber: 1,
            narrations: character.initialScenario?.narration?.map(sanitizeNarrativeText) || [],
            dialogue: '',
            timestamp: new Date().toISOString(),
          };

          const newSession: ChatSession = {
            characterId: charId,
            currentTurn: 1,
            currentStage: character.stage,
            currentLocation: character.currentLocation,
            stats: { ...character.stats },
            messages: [initialMessage],
            currentOptions: character.initialScenario?.quickOptions || generateNext5Options(character, 1),
            history: [],
          };

          set((state) => ({
            activeCharacterId: charId,
            sessions: { ...state.sessions, [charId]: newSession },
          }));
        } else {
          set({ activeCharacterId: charId });
        }
      },

      sendQuickAction: async (option: QuickOption, character: Character) => {
        const { sessions, activeCharacterId } = get();
        if (!activeCharacterId || !sessions[activeCharacterId]) return;

        const session = sessions[activeCharacterId];
        const nextTurn = session.currentTurn + 1;

        // Snapshot history for Undo
        const historySnapshot = {
          turn: session.currentTurn,
          stats: { ...session.stats },
          memoryState: session.memoryState ? { ...session.memoryState } : undefined,
          messages: [...session.messages],
        };

        const userMsg: ChatMessage = {
          id: `msg-${Date.now()}-u`,
          sender: 'user',
          userText: option.text,
          actionBadge: `당신의 행동 / ${option.badgeText}`,
          timestamp: new Date().toISOString(),
        };

        // Instant user message append
        set((state) => ({
          isStreaming: true,
          streamingMessageText: '',
          sessions: {
            ...state.sessions,
            [activeCharacterId]: {
              ...session,
              messages: [...session.messages, userMsg],
            },
          },
        }));

        // SSE Streaming API Call
        try {
          const response = await fetch('/api/chat-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              character,
              messages: [...session.messages, userMsg],
              userInput: option.text,
              currentStats: session.stats,
              currentTurn: nextTurn,
              memoryState: session.memoryState,
            }),
          });

          if (!response.ok || !response.body) {
            throw new Error(`API response error: ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullStreamedText = '';

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunkStr = decoder.decode(value, { stream: true });
            const lines = chunkStr.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.chunk) {
                    fullStreamedText += data.chunk;
                    set({ streamingMessageText: extractStreamingNarrative(fullStreamedText) });
                  }
                  if (data.done) {
                    fullStreamedText = data.fullText || fullStreamedText;
                  }
                } catch {
                  // ignore JSON parse error in chunk line
                }
              }
            }
          }

          // Parse full response including dynamic options, spatial anchor and 3-tier memory ledger
          const { narrations, updatedStats, stageBadge, spatialLocation, parsedLedger, dynamicOptions } = parse3TierResponse(
            fullStreamedText,
            character,
            session.stats,
            nextTurn
          );

          // Update 3-Tier Synaptic Memory State
          const prevMem = session.memoryState || {
            layer1ReflexBuffer: [],
            layer2SomaticEcho: [],
            layer3LongTermArchive: [],
          };

          const nextMemoryState = {
            layer1ReflexBuffer: parsedLedger?.reflex
              ? [...prevMem.layer1ReflexBuffer, parsedLedger.reflex].slice(-2)
              : prevMem.layer1ReflexBuffer,
            layer2SomaticEcho: parsedLedger?.echo
              ? [...prevMem.layer2SomaticEcho, parsedLedger.echo].slice(-4)
              : prevMem.layer2SomaticEcho,
            layer3LongTermArchive: parsedLedger?.archive
              ? [...prevMem.layer3LongTermArchive, parsedLedger.archive].slice(-15)
              : prevMem.layer3LongTermArchive,
          };

          const aiMsg: ChatMessage = {
            id: `msg-${Date.now()}-ai`,
            sender: 'character',
            characterName: character.name,
            stageBadge,
            turnNumber: nextTurn,
            narrations,
            dialogue: '',
            timestamp: new Date().toISOString(),
          };

          const nextOptions = dynamicOptions || generateNext5Options(character, nextTurn);

          const updatedSession: ChatSession = {
            ...session,
            currentTurn: nextTurn,
            currentStage: stageBadge,
            currentLocation: spatialLocation || session.currentLocation,
            stats: updatedStats,
            memoryState: nextMemoryState,
            messages: [...session.messages, userMsg, aiMsg],
            currentOptions: nextOptions,
            history: [...session.history, historySnapshot],
          };

          set((state) => ({
            isStreaming: false,
            streamingMessageText: '',
            sessions: { ...state.sessions, [activeCharacterId]: updatedSession },
          }));
        } catch (err) {
          console.warn('[ChatStream Fallback to Simulation]:', err);
          
          // Compute exact 5D Coupled Chaos Equations
          const prevD = session.stats.domRate ?? 95;
          const prevE = session.stats.erosRate ?? 5;
          const prevT = session.stats.trustRate ?? 15;
          const prevF = session.stats.fractureRate ?? 10;
          const prevC = session.stats.taintRate ?? 2;

          // Spatial multiplier lambda_L
          let lambdaL = 1.0;
          const loc = session.currentLocation || '';
          if (loc.includes('Layer 0')) lambdaL = 0.5;
          else if (loc.includes('Layer 2')) lambdaL = 1.6;
          else if (loc.includes('Layer 3')) lambdaL = 2.5;

          // 1. DOM Decay with recovery lock
          const baseDamage = 3.5;
          const deltaD = -lambdaL * (1 + prevF / 100) * (1 + prevE / 100) * baseDamage * (prevD >= 75 ? 0.6 : 1.2);
          const nextD = clamp(Number((prevD + deltaD).toFixed(1)), 0, 100);

          // 2. EROS Libido S-Curve
          const deltaE = lambdaL * (1 + (100 - prevD) / 50) * (1 + prevC / 40) * 3.2;
          const nextE = clamp(Number((prevE + deltaE).toFixed(1)), 0, 100);

          // 3. FRACTURE Resonant Bell-Curve Spark (peaks in Phase 2, subsides in Phase 3)
          const spark = (nextD * nextE) / 1000;
          const deltaF = (nextD < 30) ? -3.5 : (spark * 10.0 + (prevD < 75 ? 5.0 : 1.5));
          const nextF = clamp(Number((prevF + deltaF).toFixed(1)), 0, 100);

          // 4. TAINT Irreversible Inscription
          const deltaC = lambdaL * ((nextE * nextF) / 2500) * (1 - nextD / 100) * 2.2;
          const nextC = clamp(Number((prevC + deltaC).toFixed(1)), 0, 100);

          // 5. TRUST
          const nextT = clamp(Number((prevT + (nextE > 50 ? 2 : 0)).toFixed(1)), 0, 100);

          // Dynamic Phase Stage Badge
          let nextStage = 'Phase 1 (고결 에고 탄성 영역)';
          if (nextD < 30 || nextC >= 50) {
            nextStage = nextT >= 50 ? 'Phase 3 (순애 맹목 집착)' : 'Phase 3 (배덕적 영혼 굴종)';
          } else if (nextD < 75 || nextF >= 40) {
            nextStage = 'Phase 2 (카오스 공명 변곡점 & 인지부조화 피크)';
          }

          const updatedStats: CharacterStats = {
            domRate: nextD,
            erosRate: nextE,
            trustRate: nextT,
            fractureRate: nextF,
            taintRate: nextC,
            trust: nextT,
            love: nextE,
            neutralize: clamp(-100 + nextE * 2, -100, 100),
            guilt: nextF,
            submission: clamp(100 - nextD, 0, 100),
          };

          const aiMsg: ChatMessage = {
            id: `msg-${Date.now()}-ai`,
            sender: 'character',
            characterName: character.name,
            stageBadge: nextStage,
            turnNumber: nextTurn,
            narrations: [
              `당신의 행동에 [${character.name}]의 은빛 눈동자에 서늘한 긴장감과 당혹감이 번져나간다. 결벽하게 닫혀 있던 가면 뒤로 숨겨진 신체 기제가 본능적으로 당신의 지배력에 반응하기 시작했다.`,
              `"건방진 수작을..." 그녀는 턱 끝을 미세하게 떨며 차갑게 내뱉었으나, 흐트러진 옷깃 사이로 가파르게 요동치는 호흡을 감추지 못했다.`,
            ],
            dialogue: '',
            timestamp: new Date().toISOString(),
          };

          const updatedSession: ChatSession = {
            ...session,
            currentTurn: nextTurn,
            currentStage: nextStage,
            stats: updatedStats,
            messages: [...session.messages, userMsg, aiMsg],
            currentOptions: generateNext5Options(character, nextTurn),
            history: [...session.history, historySnapshot],
          };

          set((state) => ({
            isStreaming: false,
            streamingMessageText: '',
            sessions: { ...state.sessions, [activeCharacterId]: updatedSession },
          }));
        }
      },

      sendCustomMessage: async (userText: string, character: Character) => {
        if (!userText.trim()) return;
        const customOption: QuickOption = {
          id: `opt-custom-${Date.now()}`,
          type: 'compliance',
          label: '자유 대사',
          badgeText: '자유 대사',
          colorClass: '',
          text: userText.trim(),
          statImpact: { trust: 3, submission: 2 },
        };
        await get().sendQuickAction(customOption, character);
      },

      undoLastTurn: () => {
        const { sessions, activeCharacterId } = get();
        if (!activeCharacterId || !sessions[activeCharacterId]) return;

        const session = sessions[activeCharacterId];
        if (session.history.length === 0) return;

        const lastHistory = session.history[session.history.length - 1];
        const nextHistory = session.history.slice(0, -1);

        const updatedSession: ChatSession = {
          ...session,
          currentTurn: lastHistory.turn,
          stats: lastHistory.stats,
          memoryState: lastHistory.memoryState,
          messages: lastHistory.messages,
          history: nextHistory,
        };

        set((state) => ({
          sessions: { ...state.sessions, [activeCharacterId]: updatedSession },
        }));
      },

      regenerateLastResponse: async (character: Character) => {
        const { sessions, activeCharacterId, sendQuickAction } = get();
        if (!activeCharacterId || !sessions[activeCharacterId]) return;

        const session = sessions[activeCharacterId];
        if (session.messages.length < 2) return;

        // Pop last AI message and re-send last user message
        const lastUserMsg = session.messages[session.messages.length - 2];
        if (!lastUserMsg || lastUserMsg.sender !== 'user') return;

        const trimmedMessages = session.messages.slice(0, -2);
        const updatedSession = { ...session, messages: trimmedMessages, currentTurn: session.currentTurn - 1 };

        set((state) => ({
          sessions: { ...state.sessions, [activeCharacterId]: updatedSession },
        }));

        const dummyOption: QuickOption = {
          id: 'regen',
          type: 'compliance',
          label: '재생성',
          badgeText: '재생성',
          colorClass: '',
          text: lastUserMsg.userText || '',
        };

        await sendQuickAction(dummyOption, character);
      },

      resetCurrentSession: (character: Character) => {
        const { activeCharacterId } = get();
        if (!activeCharacterId) return;

        const initialMessage: ChatMessage = {
          id: `msg-${Date.now()}-init`,
          sender: 'character',
          characterName: character.name,
          stageBadge: character.stage,
          turnNumber: 1,
          narrations: character.initialScenario?.narration?.map(sanitizeNarrativeText) || [],
          dialogue: '',
          timestamp: new Date().toISOString(),
        };

        const newSession: ChatSession = {
          characterId: character.id,
          currentTurn: 1,
          currentStage: character.stage,
          currentLocation: character.currentLocation,
          stats: { ...character.stats },
          messages: [initialMessage],
          currentOptions: character.initialScenario?.quickOptions || generateNext5Options(character, 1),
          history: [],
        };

        set((state) => ({
          sessions: { ...state.sessions, [activeCharacterId]: newSession },
        }));
      },

      deleteSession: (characterId: string) => {
        set((state) => {
          const nextSessions = { ...state.sessions };
          delete nextSessions[characterId];
          return {
            sessions: nextSessions,
            activeCharacterId: state.activeCharacterId === characterId ? null : state.activeCharacterId,
          };
        });
      },

      getActiveSession: () => {
        const { sessions, activeCharacterId } = get();
        if (!activeCharacterId || !sessions[activeCharacterId]) return null;
        return sessions[activeCharacterId];
      },
    }),
    {
      name: 'abyss-chat-sessions-v4',
    }
  )
);
