import React, { useState, useRef } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useChatStore } from '../../store/useChatStore';
import { Character } from '../../types/character';
import { DictionaryModal } from '../studio/DictionaryModal';
import { ModelSelector } from '../common/ModelSelector';
import { SettingsModal } from '../common/SettingsModal';
import { IllustriousPromptStudioModal } from '../studio/IllustriousPromptStudioModal';
import { CharacterModal } from '../studio/CharacterModal';
import { DynamicCreatorModal } from '../studio/DynamicCreatorModal';
import { Modal } from '../common/Modal';
import {
  Sparkles,
  Play,
  Layers,
  BookOpen,
  Settings,
  CheckCircle2,
  Crown,
  Flame,
  Heart,
  Zap,
  RefreshCw,
  Target,
  ShieldAlert,
  Compass,
  ArrowRight,
  UserCheck,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Shield,
  Activity,
  PlusCircle,
  Palette,
  Edit3,
  FolderOpen,
  Trash2,
  Upload,
} from 'lucide-react';

interface MainLobbyProps {
  onNavigateStudio: () => void;
  onEnterPlayRoom: (character: Character) => void;
}

const getWithParticle = (name: string) => {
  if (!name) return '와';
  const lastChar = name.charCodeAt(name.length - 1);
  if (lastChar < 0xac00 || lastChar > 0xd7a3) return '와';
  return (lastChar - 0xac00) % 28 > 0 ? '과' : '와';
};

export const MainLobby: React.FC<MainLobbyProps> = ({
  onNavigateStudio,
  onEnterPlayRoom,
}) => {
  const {
    characters,
    selectedCharacterId,
    setSelectedCharacterId,
    getSelectedCharacter,
    updateCharacter,
    deleteCharacter,
    importCharactersJSON,
  } = useCharacterStore();
  const { sessions, resetCurrentSession, deleteSession } = useChatStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDictOpen, setIsDictOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [isPromptStudioOpen, setIsPromptStudioOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const activeChar = getSelectedCharacter() || characters[0];
  const activeSession = activeChar ? sessions[activeChar.id] : undefined;
  const lastMessage =
    activeSession?.messages && activeSession.messages.length > 0
      ? activeSession.messages[activeSession.messages.length - 1]
      : null;

  const handleSaveEdit = (charData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (activeChar) {
      updateCharacter(activeChar.id, charData);
      setIsEditOpen(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importCharactersJSON(content);
        if (ok) {
          alert('캐릭터 JSON을 성공적으로 불러왔습니다!');
        } else {
          alert('올바른 캐릭터 JSON 파일 형식이 아닙니다.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteActiveChar = () => {
    if (!activeChar) return;
    if (characters.length <= 1) {
      alert('최소 1명의 캐릭터는 유지되어야 합니다.');
      return;
    }
    if (confirm(`'${activeChar.name}' 캐릭터를 영구 삭제하시겠습니까?`)) {
      deleteSession(activeChar.id);
      deleteCharacter(activeChar.id);
    }
  };

  // Calculate stats for secondary collapsible panel
  const validSessionList = Object.entries(sessions).filter(([charId]) =>
    characters.some((c) => c.id === charId)
  );
  const totalSessions = validSessionList.length;

  // Active character 5D stats
  const dom = activeChar?.stats.domRate ?? 95;
  const eros = activeChar?.stats.erosRate ?? 10;
  const trust = activeChar?.stats.trustRate ?? 15;
  const fracture = activeChar?.stats.fractureRate ?? 5;
  const taint = activeChar?.stats.taintRate ?? 3;

  const tabooTrait =
    activeChar?.traits.find(
      (t) =>
        t.category === 'taboo_somatic' ||
        t.category === 'taboo_social' ||
        t.category === 'taboo_moral' ||
        t.category === 'taboo_secret' ||
        t.category === 'taboo'
    )?.description ||
    activeChar?.weaknessSummary ||
    '절대적인 역린과 금기';

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-200 flex flex-col justify-between select-none">
      {/* ================= TOP NAVBAR ================= */}
      <header className="border-b border-white/10 bg-[#0b0d19]/95 backdrop-blur-md px-6 py-3 sticky top-0 z-30 shadow-lg">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-600/40">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-wider">
                  CHAOS NARRATIVE
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40">
                  5D Chaos Engine v6.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                5차원 결합 카오스 섭동 & 3단계 뇌신경망 기억 서사 시스템
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2.5 text-xs">
            {/* Model Cascade Selector */}
            <ModelSelector />

            {/* Dictionary Button */}
            <button
              onClick={() => setIsDictOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>백과 사전</span>
            </button>

            {/* Settings Modal Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition-colors cursor-pointer"
              title="시스템 환경 및 API 키 설정"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span>설정</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN DASHBOARD: 3 CORE PILLARS ================= */}
      <main className="max-w-[1700px] mx-auto w-full px-6 py-6 flex-1 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
          
          {/* ========================================================
              [PILLAR 1] 액티브 페르소나 대형 프로필 & 캐릭터 교체기 (7 Cols)
             ======================================================== */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500/40 bg-gradient-to-br from-[#12152b] via-[#0d1021] to-[#080914] p-6 sm:p-7 shadow-2xl flex-1 flex flex-col justify-between">
              
              {/* Background Ambient Glows */}
              <div className="absolute right-0 top-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-10 bottom-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-5">
                {/* Header Row: Active Persona Label & Switcher Button */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-mono font-bold tracking-wider text-purple-300 uppercase">
                      ACTIVE PERSONA (현재 선택된 페르소나)
                    </span>
                  </div>

                  {/* Character Switcher Button */}
                  <button
                    onClick={() => setIsSwitcherOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900/90 text-purple-200 border border-purple-500/50 hover:border-purple-400 text-xs font-bold shadow-md shadow-purple-950/50 transition-all transform hover:scale-[1.02] cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-purple-300" />
                    <span>캐릭터 교체 ({characters.length}명)</span>
                  </button>
                </div>

                {/* Main Hero Persona Card Body */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-1">
                  
                  {/* Left: Large Visual Portrait / Illustrious XL Image */}
                  <div className="relative group shrink-0">
                    {activeChar?.avatarUrl ? (
                      <div className="relative w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden border-2 border-purple-500/60 shadow-2xl shadow-purple-600/30">
                        <img
                          src={activeChar.avatarUrl}
                          alt={activeChar.name}
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-36 h-48 sm:w-44 sm:h-56 rounded-2xl ${activeChar?.avatarColor || 'bg-purple-800'} flex flex-col items-center justify-center p-4 text-center border-2 border-purple-500/40 shadow-2xl`}
                      >
                        <span className="font-serif text-5xl font-black text-white mb-2 shadow-sm">
                          {activeChar?.avatarInitial || activeChar?.name.charAt(0)}
                        </span>
                        <span className="text-[10px] text-purple-200/80 font-mono">
                          NO AI PORTRAIT
                        </span>
                        <span className="text-[9px] text-purple-300/60 font-sans mt-1">
                          스튜디오에서 생성 가능
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Identity & Dual Invariants */}
                  <div className="flex-1 min-w-0 space-y-3 w-full">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                          {activeChar?.code}
                        </span>
                        <span className="text-xs font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                          🛡️ {activeChar?.archetype} ({activeChar?.archetypeDetail})
                        </span>
                        <span className="text-xs font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-white/10">
                          {activeChar?.stage || 'Stage 1'}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                        <span>{activeChar?.name}</span>
                        <span className="text-base text-slate-400 font-normal">
                          ({activeChar?.title} • {activeChar?.affiliation})
                        </span>
                      </h2>
                    </div>

                    {/* 2대 절대 제약선 (Invariant Lines) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {/* 🎯 Positive Goal */}
                      <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-500/40 space-y-1">
                        <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs">
                          <Target className="w-3.5 h-3.5 text-purple-400" />
                          <span>🎯 핵심 목적 (Core Agenda)</span>
                        </div>
                        <p className="text-slate-200 text-xs leading-relaxed line-clamp-2">
                          {activeChar?.coreAgenda || '당신과의 주도권 싸움에서 자신의 위치를 지켜내는 것'}
                        </p>
                      </div>

                      {/* 🚫 Negative Taboo */}
                      <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 space-y-1">
                        <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          <span>🚫 절대적 금기 (Negative Taboo)</span>
                        </div>
                        <p className="text-slate-200 text-xs leading-relaxed line-clamp-2">
                          {tabooTrait}
                        </p>
                      </div>
                    </div>

                    {/* Narrative Ego Summary */}
                    <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5 line-clamp-2">
                      {activeChar?.egoSummary}
                    </p>
                  </div>
                </div>

                {/* 5D Coupled Chaos Dynamics Live Gauges */}
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-purple-400" />
                      <span>5차원 결합 카오스 섭동계 상태 수치</span>
                    </span>
                    <span className="text-[11px] text-purple-400">
                      {activeChar?.spatialLayer || 'Layer 3 (완전 밀실)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-center font-mono">
                    {/* DOM */}
                    <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30">
                      <div className="text-[10px] text-amber-400 font-semibold mb-0.5">👑 주도권(DOM)</div>
                      <div className="text-base font-black text-amber-300">{dom}%</div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${dom}%` }} />
                      </div>
                    </div>

                    {/* EROS */}
                    <div className="p-2 rounded-lg bg-pink-950/40 border border-pink-500/30">
                      <div className="text-[10px] text-pink-400 font-semibold mb-0.5">💋 성애(EROS)</div>
                      <div className="text-base font-black text-pink-300">{eros}%</div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-pink-400 h-full rounded-full" style={{ width: `${eros}%` }} />
                      </div>
                    </div>

                    {/* TRUST */}
                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                      <div className="text-[10px] text-emerald-400 font-semibold mb-0.5">💚 신뢰(TRUST)</div>
                      <div className="text-base font-black text-emerald-300">{trust}%</div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${trust}%` }} />
                      </div>
                    </div>

                    {/* FRACTURE */}
                    <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/30">
                      <div className="text-[10px] text-purple-400 font-semibold mb-0.5">⚡ 동요(FRACTURE)</div>
                      <div className="text-base font-black text-purple-300">{fracture}%</div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-purple-400 h-full rounded-full" style={{ width: `${fracture}%` }} />
                      </div>
                    </div>

                    {/* TAINT */}
                    <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30">
                      <div className="text-[10px] text-rose-400 font-semibold mb-0.5">🖤 각인(TAINT)</div>
                      <div className="text-base font-black text-rose-300">{taint}%</div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-rose-400 h-full rounded-full" style={{ width: `${taint}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              [PILLAR 2 & 3] 플레이 룸 & 캐릭터 스튜디오 전면 모듈 (5 Cols)
             ======================================================== */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
            
            {/* ================= PILLAR 2: 플레이 룸 모듈 ================= */}
            <div className="rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-[#131733] via-[#0e1224] to-[#080b18] p-6 shadow-2xl flex-1 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
                      <Play className="w-4 h-4 text-indigo-300 fill-current" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">플레이 룸 (Play Room)</h3>
                      <p className="text-[11px] text-slate-400">실시간 3인칭 소설형 텍스트 롤플레잉</p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                    LIVE SESSION
                  </span>
                </div>

                {/* Session Status & Teaser */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>현재 대상: <strong className="text-white font-sans">{activeChar.name}</strong></span>
                    <span className="text-emerald-400 font-bold">● 세션 연결됨</span>
                  </div>

                  {lastMessage ? (
                    <div className="text-xs text-slate-300 italic line-clamp-2 pl-2 border-l-2 border-indigo-500/50">
                      &ldquo;{lastMessage.narrations?.[0] || lastMessage.userText}&rdquo;
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      &ldquo;서늘한 밀실 안에서 {activeChar.name}이(가) 당신의 첫 마디를 기다리고 있습니다...&rdquo;
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2">
                <button
                  onClick={() => onEnterPlayRoom(activeChar)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{activeChar.name}{getWithParticle(activeChar.name)} 플레이 룸 입장 &rarr;</span>
                </button>

                {activeSession && activeSession.messages.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm(`'${activeChar.name}'과의 대화 세션을 초기화하고 1턴부터 다시 시작하시겠습니까?`)) {
                        resetCurrentSession(activeChar);
                      }
                    }}
                    className="w-full py-1.5 text-center text-xs text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    처음부터 다시 시작 (세션 리셋)
                  </button>
                )}
              </div>
            </div>

            {/* ================= PILLAR 3: 캐릭터 스튜디오 모듈 ================= */}
            <div className="rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-[#191330] via-[#100d24] to-[#0a0818] p-6 shadow-2xl flex-1 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
                      <Layers className="w-4 h-4 text-purple-300" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">캐릭터 스튜디오 (Studio)</h3>
                      <p className="text-[11px] text-slate-400">페르소나 설계, 수정, 불러오기 & AI 일러스트</p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-500/40">
                    {characters.length}명 보유 중
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  2대 제약선(목적/금기)과 5대 상호 직교 서사 궤적을 설계하고, <strong>Illustrious XL Danbooru 전용 일러스트</strong>를 생성하여 영구 장착하세요.
                </p>
              </div>

              {/* Action Buttons: 스튜디오 룸 입장 + 빠른 관리 (생성, 수정, 불러오기, 삭제, 비주얼) */}
              <div className="pt-4 flex flex-col gap-2">
                {/* 1. 캐릭터 스튜디오 룸 전체 입장 (Primary) */}
                <button
                  onClick={onNavigateStudio}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-purple-200" />
                  <span>🎨 캐릭터 스튜디오 룸 입장 &rarr;</span>
                </button>

                {/* 2. 빠른 액션 바 (생성, 수정, 불러오기, 삭제, 비주얼) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  {/* AI 생성 */}
                  <button
                    type="button"
                    onClick={() => setIsCreatorOpen(true)}
                    className="py-1.5 px-2 rounded-lg bg-slate-900/90 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="4단계 AI 캐릭터 동적 생성기"
                  >
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    <span>생성</span>
                  </button>

                  {/* 수정 */}
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(true)}
                    className="py-1.5 px-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 hover:border-purple-500/50 font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title={`${activeChar?.name} 스펙 수정`}
                  >
                    <Edit3 className="w-3 h-3 text-indigo-400" />
                    <span>수정</span>
                  </button>

                  {/* 불러오기 */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-1.5 px-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 hover:border-purple-500/50 font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="JSON 캐릭터 파일 불러오기"
                  >
                    <FolderOpen className="w-3 h-3 text-amber-400" />
                    <span>불러오기</span>
                  </button>

                  {/* 삭제 */}
                  <button
                    type="button"
                    onClick={handleDeleteActiveChar}
                    className="py-1.5 px-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 hover:border-rose-400 font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title={`${activeChar?.name} 영구 삭제`}
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>삭제</span>
                  </button>
                </div>

                {/* Hidden File Input for JSON import */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </div>
            </div>

          </div>
        </div>

        {/* ================= COLLAPSIBLE SECONDARY STATS PANEL ================= */}
        <div className="border border-white/10 rounded-xl bg-[#090b14]/90 overflow-hidden transition-all">
          <button
            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
            className="w-full px-5 py-3 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 font-mono">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>시스템 세션 및 로컬 DB 통계</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-purple-400">
                캐릭터 {characters.length}명 • 활성 세션 {totalSessions}개
              </span>
              {isStatsExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {isStatsExpanded && (
            <div className="px-5 pb-4 pt-1 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
              <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                <div className="text-[11px] text-slate-400 mb-0.5">등록된 캐릭터</div>
                <div className="text-xl font-bold font-mono text-white">{characters.length}명</div>
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                <div className="text-[11px] text-slate-400 mb-0.5">활성 대화 세션</div>
                <div className="text-xl font-bold font-mono text-emerald-400">{totalSessions}개</div>
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                <div className="text-[11px] text-slate-400 mb-0.5">로컬 스토리지 DB</div>
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>동기화 완료</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/10 bg-[#070810] px-6 py-3 text-center text-xs text-slate-400">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="text-slate-300 font-bold font-mono">Abyss Neural Narrative Engine</span> • High-Performance Local First Architecture
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">Illustrious XL (SDXL v17) Live Generation Ready</span>
            <span className="text-purple-400">TypeScript 5.x + React 18 + TailwindCSS</span>
          </div>
        </div>
      </footer>

      {/* ================= SWITCHER MODAL ================= */}
      <Modal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        title={
          <div className="flex items-center gap-2 text-purple-300">
            <RefreshCw className="w-5 h-5 text-purple-400" />
            <span>액티브 페르소나 캐릭터 교체</span>
          </div>
        }
        subtitle="원하는 캐릭터 카드를 클릭하면 즉시 메인 화면의 액티브 대상이 전환됩니다."
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {characters.map((c) => {
              const isSelected = c.id === activeChar.id;
              const session = sessions[c.id];
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCharacterId(c.id);
                    setIsSwitcherOpen(false);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer relative group ${
                    isSelected
                      ? 'bg-purple-950/80 border-purple-400 shadow-lg shadow-purple-600/30'
                      : 'bg-slate-900/70 border-white/10 hover:border-purple-500/50 hover:bg-slate-800/80'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono text-purple-200 bg-purple-600 px-1.5 py-0.5 rounded-md font-bold">
                      <CheckCircle2 className="w-3 h-3" /> 선택됨
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    {c.avatarUrl ? (
                      <img
                        src={c.avatarUrl}
                        alt={c.name}
                        className="w-12 h-12 rounded-xl object-cover border border-purple-400 shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-xl ${c.avatarColor} flex items-center justify-center font-serif text-xl font-bold text-white shadow shrink-0`}
                      >
                        {c.avatarInitial || c.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {c.title} • {c.affiliation}
                      </div>
                      <div className="text-[10px] font-mono text-purple-400 mt-0.5 truncate">
                        {c.code}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-white/5 text-slate-400">
                    <span>👑 {c.stats?.domRate ?? 90}%</span>
                    <span>🖤 {c.stats?.taintRate ?? 0}%</span>
                    <span className="text-indigo-400">T{session?.currentTurn || 1}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsSwitcherOpen(false);
                setIsCreatorOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>새로운 캐릭터 생성하러 가기</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSwitcherOpen(false)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </Modal>

      {/* Dictionary Modal */}
      <DictionaryModal isOpen={isDictOpen} onClose={() => setIsDictOpen(false)} />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Dynamic Creator Modal (Step 1~4 AI Generator) */}
      <DynamicCreatorModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onCharacterCreated={(newChar) => {
          setSelectedCharacterId(newChar.id);
          setIsCreatorOpen(false);
        }}
      />

      {/* Edit Character Modal */}
      {isEditOpen && activeChar && (
        <CharacterModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSaveEdit}
          initialData={activeChar}
        />
      )}

      {/* Illustrious XL Dedicated Prompt Studio Modal */}
      {activeChar && (
        <IllustriousPromptStudioModal
          isOpen={isPromptStudioOpen}
          onClose={() => setIsPromptStudioOpen(false)}
          character={activeChar}
        />
      )}
    </div>
  );
};

