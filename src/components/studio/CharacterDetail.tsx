import React, { useState } from 'react';
import { Character, CharacterTrait } from '../../types/character';
import { ArchetypeBadge } from '../common/Badge';
import { useCharacterStore } from '../../store/useCharacterStore';
import { IllustriousPromptStudioModal } from './IllustriousPromptStudioModal';
import { Play, Edit3, FileJson, Copy, Trash2, Check, Sparkles, Crown, Flame, Palette } from 'lucide-react';

interface CharacterDetailProps {
  character: Character;
  onPlay: (char: Character) => void;
  onEdit: (char: Character) => void;
  onExportJSON: (char: Character) => void;
  onDelete: (id: string) => void;
  onUpdateTrait: (charId: string, traitId: string, updates: Partial<CharacterTrait>) => void;
}

export const CharacterDetail: React.FC<CharacterDetailProps> = ({
  character,
  onPlay,
  onEdit,
  onExportJSON,
  onDelete,
  onUpdateTrait,
}) => {
  const [editingTraitId, setEditingTraitId] = useState<string | null>(null);
  const [traitInput, setTraitInput] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isPromptStudioOpen, setIsPromptStudioOpen] = useState(false);
  const updateCharacter = useCharacterStore((state) => state.updateCharacter);

  const startEditTrait = (trait: CharacterTrait) => {
    setEditingTraitId(trait.id);
    setTraitInput(trait.description);
  };

  const saveTrait = (traitId: string) => {
    onUpdateTrait(character.id, traitId, { description: traitInput });
    setEditingTraitId(null);
  };

  const copyPrompt = () => {
    const promptText = `[Abyss Engine Character Persona]
Name: ${character.name} (${character.title} • ${character.affiliation})
ID: ${character.code}
Archetype: ${character.archetype} (${character.archetypeDetail})
Stage: ${character.stage}
Ego: ${character.egoSummary}
Weakness: ${character.weaknessSummary}
Stats: 자존심(DOM) ${character.stats.domRate}%, 타락도(TAINT) ${character.stats.taintRate}%
Traits:
${character.traits.map((t) => `- ${t.categoryLabel || t.title}: ${t.description}`).join('\n')}`;

    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="bg-[#0b0e1b] border-t-2 border-purple-500/40 p-5 shadow-2xl rounded-t-2xl">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        {/* Left: Avatar & Identity */}
        <div className="flex items-center gap-3">
          {character.avatarUrl ? (
            <img
              src={character.avatarUrl}
              alt={character.name}
              className="w-14 h-14 rounded-xl object-cover border-2 border-purple-500/50 shadow-neon-purple shadow-lg shrink-0"
            />
          ) : (
            <div
              className={`w-14 h-14 rounded-xl ${character.avatarColor} flex items-center justify-center font-serif text-2xl font-black text-white shadow-md shrink-0`}
            >
              {character.avatarInitial || character.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                {character.name}{' '}
                <span className="text-slate-300 font-normal">
                  ({character.title} • {character.affiliation})
                </span>
              </h3>
            </div>
            <div className="text-xs font-mono text-purple-400 mt-0.5">
              {character.code}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Illustrious XL 전용 프롬프트 스튜디오 버튼 */}
          <button
            type="button"
            onClick={() => setIsPromptStudioOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-yellow-300" />
            <span>Illustrious XL 비주얼 스튜디오</span>
          </button>

          {/* Play Room 입장 */}
          <button
            type="button"
            onClick={() => onPlay(character)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-purple-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>플레이 룸 입장</span>
          </button>

          {/* 수정 */}
          <button
            type="button"
            onClick={() => onEdit(character)}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-white/10 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>수정</span>
          </button>

          {/* 불러오기 / 내보내기 */}
          <button
            type="button"
            onClick={() => onExportJSON(character)}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-medium border border-white/10 font-mono transition-colors cursor-pointer"
            title="캐릭터 JSON 파일 내보내기 및 저장"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>불러오기</span>
          </button>

          {/* 프롬프트 복사 */}
          <button
            type="button"
            onClick={copyPrompt}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-xs font-medium border border-white/10 transition-colors cursor-pointer"
          >
            {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPrompt ? '복사 완료!' : '프롬프트 복사'}</span>
          </button>

          {/* 삭제 */}
          <button
            type="button"
            onClick={() => onDelete(character.id)}
            className="flex items-center gap-1 px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs font-medium border border-rose-500/20 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>삭제</span>
          </button>
        </div>
      </div>

      {/* Middle Status Breakdown: 7-Dimension Metrics */}
      <div className="py-3.5 border-b border-white/10 text-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: 모태 신체 경유 & 발현 단계 */}
          <div>
            <div className="text-slate-400 text-[11px] mb-1.5 font-medium">모태 성격 아키타입 & 발현 단계</div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-amber-950/40 text-amber-300 border border-amber-500/30 rounded-md font-mono flex items-center gap-1">
                🛡️ {character.archetype} ({character.archetypeDetail})
              </span>
              <span className="px-2.5 py-1 bg-purple-950/40 text-purple-300 border border-purple-500/30 rounded-md font-mono">
                {character.stage}
              </span>
            </div>
          </div>

          {/* Right: 생체 메타 지표 (자존심 / 타락도) */}
          <div>
            <div className="flex justify-between items-center text-slate-400 text-[11px] mb-1.5 font-medium">
              <span>핵심 메타 지표 (자존심 DOM / 타락도 TAINT)</span>
              <span className="text-purple-400 font-mono text-[10px]">Realtime Active Sync</span>
            </div>
            <div className="flex items-center gap-4 font-mono">
              {/* DOM */}
              <div className="flex-1 bg-black/40 p-2 rounded-lg border border-amber-500/20">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-current" /> 자존심:
                  </span>
                  <span className="text-amber-400 font-bold">{character.stats.domRate.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-yellow-500 rounded-full"
                    style={{ width: `${Math.min(100, character.stats.domRate)}%` }}
                  />
                </div>
              </div>

              {/* TAINT */}
              <div className="flex-1 bg-black/40 p-2 rounded-lg border border-rose-500/20">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-rose-300 font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-current text-rose-400" /> 타락도:
                  </span>
                  <span className="text-rose-400 font-bold">{character.stats.taintRate.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-pink-500 rounded-full"
                    style={{ width: `${Math.min(100, character.stats.taintRate)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Core State Gauges */}
        <div className="grid grid-cols-5 gap-2 font-mono text-center pt-1">
          <div className="p-2 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
            <div className="text-[10px] text-emerald-400/80">★ 친밀도</div>
            <div className="text-xs font-bold mt-0.5">{character.stats.trust}%</div>
          </div>
          <div className="p-2 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-500/30">
            <div className="text-[10px] text-rose-400/80">♥ 애정도</div>
            <div className="text-xs font-bold mt-0.5">{character.stats.love}%</div>
          </div>
          <div className="p-2 rounded-lg bg-purple-950/40 text-purple-300 border border-purple-500/30">
            <div className="text-[10px] text-purple-400/80">⚡ 방어 해제</div>
            <div className="text-xs font-bold mt-0.5">{character.stats.neutralize}</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-500/30">
            <div className="text-[10px] text-amber-400/80">● 수치심</div>
            <div className="text-xs font-bold mt-0.5">{character.stats.guilt}%</div>
          </div>
          <div className="p-2 rounded-lg bg-red-950/50 text-red-300 border border-red-500/40">
            <div className="text-[10px] text-red-400/80">▲ 복종도</div>
            <div className="text-xs font-bold mt-0.5">{character.stats.submission}%</div>
          </div>
        </div>

        {/* 3대 극적 당위성 & 목적성 (Core Agenda, Stakes, Leverage) */}
        {(character.coreAgenda || character.stakes || character.userLeverage) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2">
            <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/30 space-y-1">
              <span className="text-purple-300 font-bold flex items-center gap-1 text-[11px]">
                🎯 핵심 목적 (Core Agenda)
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {character.coreAgenda || '당신에게서 주도권과 가문의 비밀을 지켜내고 자신의 권위를 수호하는 것'}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 space-y-1">
              <span className="text-rose-300 font-bold flex items-center gap-1 text-[11px]">
                ⚖️ 파멸의 판돈 (Stakes)
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {character.stakes || '당신에게 굴복하거나 약점을 잡히면 가문이 몰락하고 영구 감금됨'}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 space-y-1">
              <span className="text-amber-300 font-bold flex items-center gap-1 text-[11px]">
                ⚔️ 유저의 레버리지 (Leverage)
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {character.userLeverage || '당신이 그녀의 절대적인 치부와 밀실의 열쇠를 쥐고 있음'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Subsection: 금기 & 고유 결함 (16 RGB Traits) */}
      <div className="pt-3.5">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-slate-300 text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>🚫 금기, 역린 & 고유 결함 (16 RGB Traits)</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">클릭하여 실시간 인라인 수정 가능</span>
        </div>

        <div className="space-y-2">
          {character.traits.map((trait) => (
            <div
              key={trait.id}
              className="flex items-center justify-between gap-3 p-2.5 bg-black/30 border border-white/5 rounded-lg text-xs hover:border-purple-500/30 transition-colors"
            >
              {/* Category Icon & Label */}
              <div className="w-32 shrink-0 flex items-center gap-1.5 font-semibold">
                {trait.category === 'taboo' && <span className="text-rose-400 font-bold">🚫 금기 & 역린</span>}
                {trait.category === 'weakness' && <span className="text-purple-400">🛡️ 약점 & 복종</span>}
                {trait.category === 'pleasure' && <span className="text-pink-400">💗 과성 반응</span>}
                {trait.category === 'secret' && <span className="text-amber-400">🗝️ 은밀한 비밀</span>}
                {trait.category === 'body' && <span className="text-sky-400">⚡ 신체 특성</span>}
                {trait.category === 'custom' && <span className="text-emerald-400">✨ 고유 특성</span>}
              </div>

              {/* Description (Editable or View) */}
              <div className="flex-1 min-w-0">
                {editingTraitId === trait.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={traitInput}
                      onChange={(e) => setTraitInput(e.target.value)}
                      className="flex-1 px-2.5 py-1 bg-slate-900 border border-purple-500 rounded text-slate-100 text-xs focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => saveTrait(trait.id)}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium cursor-pointer"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTraitId(null)}
                      className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white rounded text-xs cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => startEditTrait(trait)}
                    className="text-slate-300 truncate cursor-pointer hover:text-purple-200 transition-colors"
                    title="클릭하여 수정"
                  >
                    {trait.description}
                  </div>
                )}
              </div>

              {/* Trait Action Button */}
              {editingTraitId !== trait.id && (
                <button
                  type="button"
                  onClick={() => startEditTrait(trait)}
                  className="px-2 py-0.5 bg-slate-800/80 hover:bg-purple-900/50 text-slate-400 hover:text-purple-300 border border-white/5 rounded text-[10px] shrink-0 font-medium transition-colors cursor-pointer"
                >
                  수정
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Illustrious XL Dedicated Danbooru Prompt Box */}
      <div className="pt-3.5 border-t border-white/10 mt-3.5">
        <div className="p-3.5 rounded-xl bg-[#111326] border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>🎨 Illustrious XL 이미지 생성 단부루 프롬프트 (Danbooru Prompt)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPromptStudioOpen(true)}
                className="text-[11px] text-purple-300 hover:text-white bg-purple-900/60 hover:bg-purple-800 px-2 py-0.5 rounded border border-purple-500/30 font-medium cursor-pointer transition-colors"
              >
                비주얼 스튜디오 열기
              </button>
              <button
                type="button"
                onClick={() => {
                  if (character.appearance?.aiImagePrompt) {
                    navigator.clipboard.writeText(character.appearance.aiImagePrompt);
                    alert('단부루 프롬프트가 클립보드에 복사되었습니다!');
                  }
                }}
                className="text-[11px] text-purple-400 hover:text-purple-200 font-mono flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>복사</span>
              </button>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-black/60 border border-white/5 text-[11px] font-mono text-purple-200/90 leading-relaxed break-all">
            {character.appearance?.aiImagePrompt ||
              '등록된 단부루 프롬프트가 없습니다. [비주얼 스튜디오]에서 AI로 자동 컴파일하고 일러스트를 생성하세요.'}
          </div>
        </div>
      </div>

      {/* Illustrious XL Dedicated Danbooru Prompt Studio Modal */}
      <IllustriousPromptStudioModal
        isOpen={isPromptStudioOpen}
        onClose={() => setIsPromptStudioOpen(false)}
        character={character}
      />
    </div>
  );
};
