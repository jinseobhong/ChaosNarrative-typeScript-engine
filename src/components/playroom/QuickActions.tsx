import React from 'react';
import { QuickOption } from '../../types/character';
import { ChevronRight, Sparkles, RefreshCw } from 'lucide-react';

interface QuickActionsProps {
  options: QuickOption[];
  onSelectOption: (option: QuickOption) => void;
  disabled?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  options,
  onSelectOption,
  disabled = false,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto my-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
          {disabled ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span className="text-purple-300 animate-pulse font-medium">
                AI 캐릭터가 실시간 서사를 집필 중입니다... (잠시만 기다려 주세요)
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>매 턴 상황 맞춤형 5대 실시간 선택지 (클릭 시 즉시 실행)</span>
            </>
          )}
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          {disabled ? '서사 완료 후 선택 가능' : '상황에 따른 자유 행동 분기'}
        </div>
      </div>

      {/* Choice Rows (Full text display without truncation) */}
      <div className="space-y-2.5">
        {options.map((opt) => {
          // Determine badge color
          let badgeBg = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50';
          let rowHover = 'hover:border-emerald-500/50 hover:bg-emerald-950/20';

          if (opt.type === 'rebuttal') {
            badgeBg = 'bg-rose-950/70 text-rose-300 border-rose-500/50';
            rowHover = 'hover:border-rose-500/50 hover:bg-rose-950/20';
          } else if (opt.type === 'seduce') {
            badgeBg = 'bg-purple-950/70 text-purple-300 border-purple-500/50';
            rowHover = 'hover:border-purple-500/50 hover:bg-purple-950/20';
          } else if (opt.type === 'dominate') {
            badgeBg = 'bg-fuchsia-950/70 text-fuchsia-300 border-fuchsia-500/50';
            rowHover = 'hover:border-fuchsia-500/50 hover:bg-fuchsia-950/20';
          } else if (opt.type === 'bypass') {
            badgeBg = 'bg-amber-950/70 text-amber-300 border-amber-500/50';
            rowHover = 'hover:border-amber-500/50 hover:bg-amber-950/20';
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectOption(opt)}
              className={`w-full text-left p-3.5 rounded-xl bg-[#0e1122]/95 border border-white/10 ${rowHover} flex items-start justify-between gap-3 text-xs transition-all duration-150 group shadow-md ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Badge */}
                <span
                  className={`px-2.5 py-1 rounded-md border text-xs font-bold font-mono shrink-0 mt-0.5 ${badgeBg}`}
                >
                  ★ {opt.badgeText}
                </span>

                {/* Full Text without truncation */}
                <span className="text-slate-200 group-hover:text-white transition-colors leading-relaxed font-sans text-xs">
                  {opt.text}
                </span>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
