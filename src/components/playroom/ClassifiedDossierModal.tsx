import React from 'react';
import { Modal } from '../common/Modal';
import { Character, CharacterStats } from '../../types/character';
import {
  FileText,
  Target,
  ShieldAlert,
  Brain,
  Scale,
  Key,
  Flame,
  Sparkles,
  Heart,
  Zap,
  Lock,
} from 'lucide-react';

interface ClassifiedDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  currentStats: CharacterStats;
}

export const ClassifiedDossierModal: React.FC<ClassifiedDossierModalProps> = ({
  isOpen,
  onClose,
  character,
  currentStats,
}) => {
  const goal = character.coreAgenda || '당신에게서 주도권과 가문의 비밀을 지켜내고 자신의 권위를 수호하는 것';
  const somaticTaboo = character.traits?.find((t) => t.category === 'taboo_somatic' || t.category === 'weakness')?.description || '취약 신경대 및 마력 코어 접촉';
  const socialTaboo = character.traits?.find((t) => t.category === 'taboo_social' || t.category === 'taboo')?.description || '혈통의 치부와 가문 스캔들';
  const moralTaboo = character.traits?.find((t) => t.category === 'taboo_moral')?.description || '신성 맹세 및 굴종 거부 긍지';
  const secretTaboo = character.traits?.find((t) => t.category === 'taboo_secret' || t.category === 'secret')?.description || '진명 및 영혼 서약서 유출';
  const stakes = character.stakes || '당신에게 굴복하거나 약점을 잡히면 가문이 몰락하고 영구 감금됨';
  const userLeverage = character.userLeverage || '당신이 그녀의 절대적인 치부와 밀실의 열쇠를 쥐고 있음';

  const psychology = character.psychology || {
    autonomyDrive: '자율성 & 통제벽 (지배권 상실 공포)',
    competenceDefense: '유능성 에고 방어 (반동형성을 통한 가학적 도발)',
    relatednessDeficit: '만성적 소마틱 체온 결핍 (억압된 애착 갈망)',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-300">
          <Lock className="w-5 h-5 text-rose-400" />
          <span>1급 기밀: [{character.name}] 심리·신경 분석 리포트 (기밀 답지)</span>
        </div>
      }
      subtitle="겉모습(도발/오만) 뒤에 숨겨진 2대 제약선, 상호 직교 4대 금기, 그리고 SDT 3대 심리 결핍 단서입니다."
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Banner */}
        <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center justify-between text-red-200 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span className="font-bold">CLASSIFIED NEURAL DOSSIER</span>
          </div>
          <span className="text-[10px] text-red-400">
            {character.spatialLayer || 'Layer 0 (공적 공간)'}
          </span>
        </div>

        {/* 1. 🎯 절대적 목적 & ⚔️ 레버리지 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-1">
            <span className="text-purple-300 font-bold flex items-center gap-1.5 text-xs">
              <Target className="w-4 h-4 text-purple-400" />
              <span>🎯 캐릭터의 무조건적인 목적</span>
            </span>
            <p className="text-slate-200 text-[11px] leading-relaxed pl-1">
              {goal}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
            <span className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
              <Key className="w-3.5 h-3.5" />
              <span>⚔️ 당신의 레버리지 & 명분</span>
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed pl-1">
              {userLeverage}
            </p>
          </div>
        </div>

        {/* 2. 🚫 상호 직교 4대 금기 매트릭스 (Qualitative Deep Clues) */}
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-rose-300 font-bold flex items-center gap-1.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>🚫 4대 직교 금기 & 잠재적 취약선 (Orthogonal Taboos)</span>
            </span>
            <span className="text-[10px] text-rose-400/80 font-mono">기밀 관찰 기록</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-black/40 border border-rose-500/20 space-y-0.5">
              <span className="text-rose-300 font-bold">🩸 생체/신경 금기:</span>
              <p className="text-slate-300 text-[10.5px] leading-relaxed">{somaticTaboo}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-amber-500/20 space-y-0.5">
              <span className="text-amber-300 font-bold">🛡️ 신분/사회 금기:</span>
              <p className="text-slate-300 text-[10.5px] leading-relaxed">{socialTaboo}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-purple-500/20 space-y-0.5">
              <span className="text-purple-300 font-bold">🧠 도덕/신념 금기:</span>
              <p className="text-slate-300 text-[10.5px] leading-relaxed">{moralTaboo}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 space-y-0.5">
              <span className="text-emerald-300 font-bold">🗝️ 비밀/계약 금기:</span>
              <p className="text-slate-300 text-[10.5px] leading-relaxed">{secretTaboo}</p>
            </div>
          </div>
        </div>

        {/* 2. 현대 심리학 3대 욕구 & 내적 갈등 매트릭스 */}
        <div className="p-3.5 rounded-xl bg-[#10132a] border border-purple-500/30 space-y-2">
          <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs">
            <Brain className="w-4 h-4 text-purple-400" />
            <span>🧠 현대 심리학 3대 욕구 & 신경계 회로 (SDT Matrix)</span>
          </div>

          <div className="space-y-2 text-slate-200 text-[11px]">
            <div className="p-2 rounded bg-black/40 border border-amber-500/20">
              <span className="text-amber-300 font-bold">• 👑 자율성 통제벽:</span> {psychology.autonomyDrive}
              <p className="text-slate-400 text-[10px] mt-0.5">
                (통제권을 뺏기지 않기 위해 발악하는 겉모습의 오만함과 가학적 도발)
              </p>
            </div>

            <div className="p-2 rounded bg-black/40 border border-rose-500/20">
              <span className="text-rose-300 font-bold">• 🛡️ 유능성 에고 방어:</span> {psychology.competenceDefense}
              <p className="text-slate-400 text-[10px] mt-0.5">
                (치부와 약점을 들키지 않기 위해 부리는 인지부조화와 자기합리화)
              </p>
            </div>

            <div className="p-2 rounded bg-black/40 border border-pink-500/20">
              <span className="text-pink-300 font-bold">• 💗 숨겨진 관계성 결핍:</span> {psychology.relatednessDeficit}
              <p className="text-slate-400 text-[10px] mt-0.5">
                (오랫동안 억압해 온 체온과 스킨십에 노출될 때 무의식적으로 안도하고 무너지는 신경계의 배반)
              </p>
            </div>
          </div>
        </div>

        {/* 3. 위기 및 레버리지 & 공략 힌트 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
            <span className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
              <Key className="w-3.5 h-3.5" />
              <span>⚔️ 당신의 레버리지 & 명분</span>
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {userLeverage}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
            <span className="text-pink-300 font-bold flex items-center gap-1.5 text-xs">
              <Flame className="w-3.5 h-3.5" />
              <span>💡 핵심 신경계 공략 힌트</span>
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {character.weaknessSummary || somaticTaboo}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs shadow cursor-pointer"
          >
            기밀 답지 닫기
          </button>
        </div>
      </div>
    </Modal>
  );
};
