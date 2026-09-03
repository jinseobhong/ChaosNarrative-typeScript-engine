import React from 'react';
import { Character } from '../../types/character';
import { ArchetypeBadge } from '../common/Badge';
import { Search, Edit3, Play, Trash2, FileJson, Copy, Sparkles, Crown, Flame } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (char: Character) => void;
  onPlay: (char: Character) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExportJSON: (char: Character) => void;
  onGenerateIllustration: (char: Character) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isSelected,
  onSelect,
  onEdit,
  onPlay,
  onDelete,
  onDuplicate,
  onExportJSON,
  onGenerateIllustration,
}) => {
  const domRate = character.stats.domRate ?? 95;
  const taintRate = character.stats.taintRate ?? 3;

  return (
    <div
      onClick={() => onSelect(character.id)}
      className={`relative rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'bg-[#12162a] border-2 border-purple-500 shadow-neon-purple shadow-lg'
          : 'bg-[#0e1120] border border-white/10 hover:border-purple-500/40 hover:bg-[#111528]'
      }`}
    >
      {/* Top Section */}
      <div>
        {/* Header: Avatar, Name, Code */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar Box */}
          {character.avatarUrl ? (
            <img
              src={character.avatarUrl}
              alt={character.name}
              className="w-12 h-12 rounded-lg object-cover border border-purple-500/40 shadow-md shrink-0"
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-lg ${character.avatarColor} flex items-center justify-center font-serif text-2xl font-black text-white shadow-md shrink-0`}
            >
              {character.avatarInitial || character.name.charAt(0)}
            </div>
          )}

          {/* Name & Title & Code */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono text-purple-400/80 leading-none mb-1">
              {character.code}
            </div>
            <div className="text-base font-bold text-white flex items-center gap-1.5 truncate">
              <span>{character.name}</span>
            </div>
            <div className="text-xs text-slate-400 truncate">
              {character.title}
            </div>
          </div>
        </div>

        {/* Archetype & Affiliation Badge Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <ArchetypeBadge archetype={character.archetype} />
          <span className="text-[11px] text-slate-400 font-mono truncate">
            {character.affiliation}
          </span>
        </div>

        {/* Summary Bullets */}
        <div className="space-y-1.5 text-[11px] text-slate-300 bg-black/25 p-2.5 rounded-lg border border-white/5 mb-3">
          <div className="truncate flex items-start gap-1">
            <span className="text-purple-400 font-semibold shrink-0">• 에고:</span>
            <span className="text-slate-300 truncate">{character.egoSummary}</span>
          </div>
          <div className="truncate flex items-start gap-1">
            <span className="text-pink-400 font-semibold shrink-0">• 약점:</span>
            <span className="text-slate-300 truncate">{character.weaknessSummary}</span>
          </div>
        </div>

        {/* 7-Dimension Complete Status Matrix */}
        <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              <Crown className="w-3 h-3 fill-current" />
              <span>DOM {domRate}%</span>
            </span>
            <span className="flex items-center gap-1 text-rose-300 font-bold">
              <Flame className="w-3 h-3 fill-current text-rose-400" />
              <span>TAINT {taintRate}%</span>
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1 text-[9px] font-mono text-center pt-1 border-t border-white/5">
            <div className="p-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/20">
              <div className="text-[8px] text-emerald-400/80">신뢰</div>
              <div className="font-bold">{character.stats.trust}%</div>
            </div>
            <div className="p-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-500/20">
              <div className="text-[8px] text-rose-400/80">상애</div>
              <div className="font-bold">{character.stats.love}%</div>
            </div>
            <div className="p-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/20">
              <div className="text-[8px] text-purple-400/80">무력</div>
              <div className="font-bold">{character.stats.neutralize}</div>
            </div>
            <div className="p-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/20">
              <div className="text-[8px] text-amber-400/80">죄책</div>
              <div className="font-bold">{character.stats.guilt}%</div>
            </div>
            <div className="p-0.5 rounded bg-red-950/40 text-red-300 border border-red-500/20">
              <div className="text-[8px] text-red-400/80">굴복</div>
              <div className="font-bold">{character.stats.submission}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="space-y-2">
        {/* Main Action Buttons Grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {/* 1. 조회 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(character.id);
            }}
            title="상세 조회"
            className="flex items-center justify-center p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* 2. 수정 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(character);
            }}
            title="캐릭터 정보 수정"
            className="flex items-center justify-center p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* 3. 플레이 (Play Room 입장) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlay(character);
            }}
            title="Play Room 대화 시작"
            className="flex items-center justify-center p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* 4. 삭제 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(character.id);
            }}
            title="캐릭터 삭제"
            className="flex items-center justify-center p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sub Action Buttons: JSON & 복사 & AI 일러스트 생성 */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExportJSON(character);
            }}
            className="flex items-center justify-center gap-1 py-1 px-2 rounded-md bg-amber-950/20 hover:bg-amber-900/30 text-amber-300 border border-amber-500/30 text-[11px] font-mono transition-colors"
          >
            <FileJson className="w-3 h-3" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(character.id);
            }}
            className="flex items-center justify-center gap-1 py-1 px-2 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5 text-[11px] transition-colors"
          >
            <Copy className="w-3 h-3" />
            <span>복사</span>
          </button>
        </div>

        {/* AI 일러스트 생성 버튼 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onGenerateIllustration(character);
          }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 text-xs font-semibold shadow-sm transition-all hover:border-purple-400"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI 일러스트 생성</span>
        </button>
      </div>
    </div>
  );
};
