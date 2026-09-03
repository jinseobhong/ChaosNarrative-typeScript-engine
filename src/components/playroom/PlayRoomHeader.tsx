import React from 'react';
import { Character, CharacterStats } from '../../types/character';
import { ModelSelector } from '../common/ModelSelector';
import {
  ArrowLeft,
  Layers,
  RotateCcw,
  RefreshCw,
  Trash2,
  Heart,
  Zap,
  Crown,
  Flame,
  Lock,
  Target,
} from 'lucide-react';

interface PlayRoomHeaderProps {
  character: Character;
  stats: CharacterStats;
  currentStage: string;
  currentLocation: string;
  onNavigateLobby: () => void;
  onNavigateStudio: () => void;
  onOpenDossier: () => void;
  onUndo: () => void;
  onRegenerate: () => void;
  onReset: () => void;
  canUndo: boolean;
}

export const PlayRoomHeader: React.FC<PlayRoomHeaderProps> = ({
  character,
  stats,
  currentStage,
  currentLocation,
  onNavigateLobby,
  onNavigateStudio,
  onOpenDossier,
  onUndo,
  onRegenerate,
  onReset,
  canUndo,
}) => {
  const domRate = stats.domRate ?? character.stats.domRate ?? 95;
  const taintRate = stats.taintRate ?? character.stats.taintRate ?? 3;

  return (
    <header className="sticky top-0 z-30 bg-[#0c0e1a]/95 backdrop-blur-md border-b border-white/10 px-6 py-3">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Lobby Button & Character Identity & Stage Badges */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Lobby Button */}
          <button
            onClick={onNavigateLobby}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>로비</span>
          </button>

          {/* Character Avatar, Name & Code */}
          <div className="flex items-center gap-2.5">
            {character.avatarUrl ? (
              <img
                src={character.avatarUrl}
                alt={character.name}
                className="w-7 h-7 rounded-lg object-cover border border-purple-500/50 shadow shrink-0"
              />
            ) : (
              <div
                className={`w-7 h-7 rounded-lg ${character.avatarColor} flex items-center justify-center font-serif text-xs font-bold text-white shadow shrink-0`}
              >
                {character.avatarInitial || character.name.charAt(0)}
              </div>
            )}
            <span className="text-sm font-bold text-white tracking-wide">
              {character.name}
            </span>
            <span className="text-xs text-slate-400 font-medium">{character.title}</span>
            <span className="text-xs font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
              {character.code}
            </span>
          </div>

          {/* Archetype & Stage Badges */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="px-2 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-500/40 rounded">
              🛡️ {character.archetype} ({character.archetypeDetail})
            </span>
            <span className="px-2 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-500/40 rounded">
              {currentStage}
            </span>
          </div>
        </div>

        {/* Center: 5-Pillar Perturbed System Gauges */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono font-medium">
          {/* 1. 👑 주도권 (DOM) */}
          <div
            className={`flex items-center gap-1 px-3 py-1 rounded-md border shadow-sm font-bold ${
              domRate > 70
                ? 'bg-amber-950/70 text-amber-300 border-amber-500/60'
                : domRate > 40
                ? 'bg-purple-950/70 text-purple-300 border-purple-500/60'
                : 'bg-rose-950/70 text-rose-300 border-rose-500/60'
            }`}
            title="캐릭터의 자존심과 에고 통제권 (공략 시 감소, 반격 성공 시 회복)"
          >
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span>주도권 {domRate.toFixed(1)}%</span>
          </div>

          {/* 2. 💋 성애 (EROS) */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-950/60 text-rose-300 border border-rose-500/50 shadow-sm font-bold">
            <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
            <span>성애 {stats.erosRate?.toFixed(1) ?? stats.love ?? 5}%</span>
          </div>

          {/* 3. 💚 신뢰 (TRUST) */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 shadow-sm">
            <span className="text-emerald-400">★</span>
            <span>신뢰 {stats.trustRate?.toFixed(1) ?? stats.trust ?? 15}%</span>
          </div>

          {/* 4. ⚡ 균열 (FRACTURE) */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950/50 text-amber-300 border border-amber-500/40 shadow-sm">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>균열 {stats.fractureRate?.toFixed(1) ?? stats.guilt ?? 10}%</span>
          </div>

          {/* 5. 🖤 타락 (TAINT) */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border shadow-sm font-bold ${
              taintRate > 50
                ? 'bg-fuchsia-950/80 text-fuchsia-200 border-fuchsia-500/70 animate-pulse'
                : taintRate > 20
                ? 'bg-purple-950/70 text-purple-300 border-purple-500/60'
                : 'bg-slate-900/80 text-slate-300 border-white/10'
            }`}
            title="신체적 감각 각인 및 쾌락 종속도 (유혹/스킨십 시 증가)"
          >
            <Flame className="w-3.5 h-3.5 fill-current text-rose-400" />
            <span>타락 {taintRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* Right: Model, Secret Dossier & Navigation Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Model Cascade Selector */}
          <ModelSelector />

          {/* 🔍 1급 기밀 심리 분석 답지 버튼 */}
          <button
            onClick={onOpenDossier}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-500/40 font-semibold transition-all shadow-sm cursor-pointer"
            title="캐릭터의 진짜 목적, 3대 심리 욕구 결핍, 그리고 공략 힌트가 담긴 기밀 답지를 열람합니다."
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>1급 기밀 답지</span>
          </button>

          {/* 🎨 캐릭터 스튜디오 바로가기 */}
          <button
            onClick={onNavigateStudio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-500/40 font-semibold transition-colors cursor-pointer"
            title="캐릭터 스튜디오로 바로 이동하여 캐릭터를 생성/수정/관리합니다."
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>스튜디오</span>
          </button>

          {/* Undo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors ${
              canUndo
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/10 cursor-pointer'
                : 'bg-slate-900/50 text-slate-600 border-white/5 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>

          {/* Regenerate */}
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
