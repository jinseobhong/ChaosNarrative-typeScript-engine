import React, { useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useChatStore } from '../../store/useChatStore';
import { Character } from '../../types/character';
import { DictionaryModal } from '../studio/DictionaryModal';
import { ModelSelector } from '../common/ModelSelector';
import { SettingsModal } from '../common/SettingsModal';
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
} from 'lucide-react';

interface MainLobbyProps {
  onNavigateStudio: () => void;
  onEnterPlayRoom: (character: Character) => void;
}

export const MainLobby: React.FC<MainLobbyProps> = ({
  onNavigateStudio,
  onEnterPlayRoom,
}) => {
  const { characters, getSelectedCharacter } = useCharacterStore();
  const { sessions } = useChatStore();

  const [isDictOpen, setIsDictOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const activeChar = getSelectedCharacter() || characters[0];

  // Calculate only valid sessions that belong to currently existing characters
  const validSessionList = Object.entries(sessions).filter(([charId]) =>
    characters.some((c) => c.id === charId)
  );
  const totalSessions = validSessionList.length;
  const totalTurns = validSessionList.reduce((acc, [, s]) => acc + s.currentTurn, 0);

  return (
    <div className="min-h-screen bg-[#08090f] text-slate-200 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-[#0c0e1a]/95 backdrop-blur-md px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/40">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-wider">
                  ABYSS ENGINE
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40">
                  v3.0 Master Architecture
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                PC 브라우저 판타지 연애 시뮬레이션 & 텍스트 RPG 시스템
              </p>
            </div>
          </div>

          {/* Top Quick Links */}
          <div className="flex items-center gap-2.5 text-xs">
            {/* Model Cascade Selector */}
            <ModelSelector />

            {/* Dictionary Button */}
            <button
              onClick={() => setIsDictOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>거대 사전</span>
            </button>

            {/* Settings Modal Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 transition-colors cursor-pointer"
              title="시스템 환경 및 로컬 DB 관리"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span>설정</span>
            </button>

            {/* Studio Button */}
            <button
              onClick={onNavigateStudio}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-200 border border-purple-500/40 font-semibold transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>캐릭터 스튜디오</span>
            </button>

            {/* Quick Play Button */}
            {activeChar && (
              <button
                onClick={() => onEnterPlayRoom(activeChar)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>빠른 시작</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero & Dashboard */}
      <main className="max-w-[1600px] mx-auto w-full px-6 py-8 flex-1 flex flex-col gap-8">
        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-gradient-to-br from-[#12162f] via-[#0e1022] to-[#090b14] p-8 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-xs font-mono text-purple-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Dynamic DOM / TAINT & 7-State Core Engine Active</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              심연의 서사와 은밀한 갈망이 교차하는<br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                성인 판타지 텍스트 롤플레잉 엔진
              </span>
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
              캐릭터 스튜디오에서 고유한 성격, 금기, 결핍을 지닌 대상을 설계하고,
              플레이 룸에서 7대 상태 지표(자존심, 타락도, 친밀도, 애정도, 방어 해제, 수치심, 복종도)를 기반으로
              살아 숨 쉬는 3인칭 상호작용 서사를 경험하세요.
            </p>

            {/* Dynamic Main Action Buttons */}
            <div className="flex items-center flex-wrap gap-3 pt-2">
              {activeChar && (
                <button
                  onClick={() => onEnterPlayRoom(activeChar)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/40 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{activeChar.name} ({activeChar.title}) 플레이 룸 입장</span>
                </button>
              )}

              <button
                onClick={onNavigateStudio}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#171b33] hover:bg-[#1f2445] text-slate-100 font-semibold text-sm border border-purple-500/30 transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                <span>캐릭터 스튜디오 관리</span>
              </button>
            </div>
          </div>

          {/* Background Decorative Glow */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-32 bottom-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* System Stats Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0e1122] border border-white/10">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>등록된 캐릭터</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">{characters.length}명</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e1122] border border-white/10">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>활성 세션</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{totalSessions}개</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e1122] border border-white/10">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>누적 진행 턴</span>
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">{totalTurns} Turn</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e1122] border border-white/10">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>로컬 스토리지 동기화</span>
            </div>
            <div className="text-sm font-bold text-cyan-300 font-mono mt-1">100% Active</div>
          </div>
        </div>

        {/* Featured Characters Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-base font-bold text-white">공략 대상 캐릭터</h3>
            </div>
            <button
              onClick={onNavigateStudio}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>전체 캐릭터 관리 & 생성</span>
              <span>&rarr;</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {characters.slice(0, 3).map((char) => (
              <div
                key={char.id}
                className="p-5 rounded-xl bg-[#0e1122] border border-white/10 hover:border-purple-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-lg ${char.avatarColor} flex items-center justify-center font-serif text-2xl font-bold text-white shadow-md`}
                    >
                      {char.avatarInitial || char.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-purple-400">{char.code}</div>
                      <div className="text-base font-bold text-white">{char.name}</div>
                      <div className="text-xs text-slate-400">
                        {char.title} • {char.affiliation}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mb-4 line-clamp-2">
                    {char.egoSummary}
                  </p>

                  {/* 7-Dimension Complete Character Status Matrix */}
                  <div className="bg-black/40 p-3 rounded-lg border border-white/5 space-y-2 mb-4">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      {/* DOM */}
                      <span className="flex items-center gap-1 text-amber-300 font-bold">
                        <Crown className="w-3 h-3 fill-current" />
                        <span>DOM {char.stats.domRate}%</span>
                      </span>
                      {/* TAINT */}
                      <span className="flex items-center gap-1 text-rose-300 font-bold">
                        <Flame className="w-3 h-3 fill-current text-rose-400" />
                        <span>TAINT {char.stats.taintRate}%</span>
                      </span>
                    </div>

                    {/* 5 Core State Gauges Strip */}
                    <div className="grid grid-cols-5 gap-1 text-[10px] font-mono text-center pt-1 border-t border-white/5">
                      <div className="p-1 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/20">
                        <div className="text-[9px] text-emerald-400/80">신뢰</div>
                        <div className="font-bold">{char.stats.trust}%</div>
                      </div>
                      <div className="p-1 rounded bg-rose-950/40 text-rose-300 border border-rose-500/20">
                        <div className="text-[9px] text-rose-400/80">상애</div>
                        <div className="font-bold">{char.stats.love}%</div>
                      </div>
                      <div className="p-1 rounded bg-purple-950/40 text-purple-300 border border-purple-500/20">
                        <div className="text-[9px] text-purple-400/80">무력</div>
                        <div className="font-bold">{char.stats.neutralize}</div>
                      </div>
                      <div className="p-1 rounded bg-amber-950/40 text-amber-300 border border-amber-500/20">
                        <div className="text-[9px] text-amber-400/80">죄책</div>
                        <div className="font-bold">{char.stats.guilt}%</div>
                      </div>
                      <div className="p-1 rounded bg-red-950/40 text-red-300 border border-red-500/20">
                        <div className="text-[9px] text-red-400/80">굴복</div>
                        <div className="font-bold">{char.stats.submission}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onEnterPlayRoom(char)}
                  className="w-full py-2.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>플레이 룸 입장</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 px-6 text-xs text-slate-500 font-mono flex items-center justify-between max-w-[1600px] mx-auto w-full">
        <div>© 2026 Abyss Engine • All rights reserved.</div>
        <div>Released under the MIT License</div>
      </footer>

      {/* Dictionary Modal */}
      <DictionaryModal isOpen={isDictOpen} onClose={() => setIsDictOpen(false)} />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
