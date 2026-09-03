import React, { useState } from 'react';
import { Character } from '../../types/character';
import { Target, Scale, ShieldAlert, ChevronDown, ChevronUp, Key, Flame } from 'lucide-react';

interface DramaticStakesHUDProps {
  character: Character;
}

export const DramaticStakesHUD: React.FC<DramaticStakesHUDProps> = ({ character }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const coreAgenda = character.coreAgenda || '당신에게서 주도권과 가문의 비밀을 지켜내고 자신의 권위를 수호하는 것';
  const stakes = character.stakes || '당신에게 굴복하거나 약점을 잡히면 가문이 몰락하고 영구 감금됨';
  const userLeverage = character.userLeverage || '당신이 그녀의 절대적인 치부와 밀실의 열쇠를 쥐고 있음';
  const taboo = character.traits?.find((t) => t.category === 'taboo')?.description || '영혼의 절대적 금기와 역린';
  const weakness = character.weaknessSummary || character.traits?.find((t) => t.category === 'weakness')?.description || '타인의 체온과 스킨십에 극도로 취약함';

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 pt-2 pb-1">
      <div className="rounded-xl bg-[#0f1225]/90 border border-purple-500/30 backdrop-blur-md shadow-lg transition-all duration-300">
        {/* Collapsed / Header Summary Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-purple-950/30 transition-colors select-none"
        >
          <div className="flex items-center flex-wrap gap-2.5 text-xs min-w-0">
            {/* HUD Title Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/50 text-purple-300 font-bold font-mono shrink-0">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>서사 목적성 & 위기 HUD</span>
            </div>

            {/* 1. Core Agenda Pill */}
            <div className="flex items-center gap-1 text-slate-300 truncate max-w-xs sm:max-w-md">
              <span className="text-purple-400 font-bold shrink-0">🎯 목적:</span>
              <span className="truncate">{coreAgenda}</span>
            </div>

            {/* 2. Stakes Pill */}
            <div className="hidden md:flex items-center gap-1 text-slate-300 truncate max-w-xs sm:max-w-md">
              <span className="text-rose-400 font-bold shrink-0">⚖️ 위기:</span>
              <span className="truncate">{stakes}</span>
            </div>

            {/* 3. User Leverage Pill */}
            <div className="hidden lg:flex items-center gap-1 text-slate-300 truncate max-w-xs">
              <span className="text-amber-400 font-bold shrink-0">⚔️ 레버리지:</span>
              <span className="truncate">{userLeverage}</span>
            </div>
          </div>

          {/* Expand / Collapse Button */}
          <div className="flex items-center gap-1 text-xs font-mono text-purple-400 shrink-0">
            <span className="hidden sm:inline text-[11px] text-slate-400">
              {isExpanded ? '간략히' : '전체 서사 지표'}
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Expanded Detailed Grid Panel */}
        {isExpanded && (
          <div className="p-4 pt-1 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs animate-fadeIn">
            {/* Card 1: 🎯 핵심 목적 */}
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-purple-300">
                <Target className="w-4 h-4 text-purple-400" />
                <span>🎯 핵심 목적 (Core Agenda)</span>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {coreAgenda}
              </p>
            </div>

            {/* Card 2: ⚖️ 파멸의 판돈 */}
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-300">
                <Scale className="w-4 h-4 text-rose-400" />
                <span>⚖️ 파멸의 판돈 (Stakes)</span>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {stakes}
              </p>
            </div>

            {/* Card 3: ⚔️ 유저의 레버리지 */}
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Key className="w-4 h-4 text-amber-400" />
                <span>⚔️ 당신의 레버리지 (Leverage)</span>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {userLeverage}
              </p>
            </div>

            {/* Card 4: 🚫 절대적 금기 & 역린 */}
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-red-300">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>🚫 절대적 금기 & 역린</span>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {taboo}
              </p>
            </div>

            {/* Card 5: 🛡️ 결핍 & 치명적 약점 */}
            <div className="p-3 rounded-xl bg-pink-950/40 border border-pink-500/30 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-pink-300">
                <Flame className="w-4 h-4 text-pink-400" />
                <span>🛡️ 고유 결핍 & 약점</span>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {weakness}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
