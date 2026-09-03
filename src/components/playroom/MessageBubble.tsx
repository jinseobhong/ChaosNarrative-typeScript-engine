import React, { useState } from 'react';
import { ChatMessage } from '../../types/chat';
import { Character } from '../../types/character';
import { sanitizeNarrativeText } from '../../store/useChatStore';
import { User, Brain, ChevronDown, ChevronUp } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  character: Character;
  isStreaming?: boolean;
}

// Format quotes within paragraph with subtle glowing text
const renderFormattedParagraph = (paragraph: string, showCursor: boolean = false) => {
  const parts = paragraph.split(/(".*?")/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('"') && part.endsWith('"')) {
          return (
            <span
              key={index}
              className="text-purple-200 font-medium font-serif tracking-wide bg-purple-950/20 px-1 py-0.5 rounded border border-purple-500/20 shadow-sm"
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
      {showCursor && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-purple-400 rounded-xs animate-pulse align-middle" />
      )}
    </>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  character,
  isStreaming = false,
}) => {
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  if (message.sender === 'user') {
    return (
      <div className="w-full max-w-4xl mx-auto my-4 pl-6 sm:pl-16 animate-fadeIn">
        <div className="bg-[#18152e]/90 border border-purple-500/40 rounded-2xl p-4 sm:p-5 shadow-lg relative backdrop-blur-sm">
          {/* User Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/80 border border-purple-500/50 rounded-full text-xs font-semibold text-purple-300 mb-2 font-mono shadow-sm">
            <User className="w-3 h-3 text-purple-400" />
            <span>{message.actionBadge || '당신의 행동 / 대사'}</span>
          </div>

          {/* User Text */}
          <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans pl-1">
            {message.userText}
          </div>
        </div>
      </div>
    );
  }

  const hasNarrations = message.narrations && message.narrations.length > 0 && message.narrations.some((n) => n.trim().length > 0);

  // Character / AI message (Rich 3rd-Person Novel Narrative)
  return (
    <div className="w-full max-w-4xl mx-auto my-5 animate-fadeIn">
      <div className="bg-[#0f1222]/95 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl relative backdrop-blur-md">
        {/* Header: Avatar, Name + Stage, Turn Number */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {character.avatarUrl ? (
              <img
                src={character.avatarUrl}
                alt={character.name}
                className="w-9 h-9 rounded-xl object-cover border border-purple-500/40 shadow-md shrink-0"
              />
            ) : (
              <div
                className={`w-9 h-9 rounded-xl ${character.avatarColor} flex items-center justify-center font-serif text-sm font-bold text-white shadow-md shrink-0`}
              >
                {character.avatarInitial || character.name.charAt(0)}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-purple-300">
                {message.characterName || character.name}
              </span>
              <span className="text-xs font-mono text-slate-400">
                [{message.stageBadge || character.stage}]
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isStreaming && (
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                <span>AI 집필 중...</span>
              </span>
            )}
            {message.turnNumber && (
              <div className="text-xs font-mono text-slate-500 tracking-wider">
                TURN {message.turnNumber.toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </div>

        {/* 3rd-Person Novel Prose Narrative Body */}
        {hasNarrations ? (
          <div className="space-y-4 text-slate-100 text-[14px] leading-[1.85] font-sans">
            {message.narrations!.map((narration, idx) => {
              const isLast = idx === message.narrations!.length - 1;
              return (
                <p key={idx} className="tracking-normal">
                  {renderFormattedParagraph(sanitizeNarrativeText(narration), isStreaming && isLast)}
                </p>
              );
            })}
          </div>
        ) : isStreaming ? (
          /* Initial thinking placeholder before narrative text starts */
          <div className="flex items-center gap-2.5 text-xs text-purple-300 font-mono py-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>{character.name}의 상황 반응과 대사를 작성하고 있습니다...</span>
          </div>
        ) : (
          message.dialogue && (
            <p className="text-slate-100 text-[14px] leading-[1.85]">
              {renderFormattedParagraph(sanitizeNarrativeText(message.dialogue))}
            </p>
          )
        )}

        {/* Tier 3: Expandable Neural & Memory Ledger Drawer (hidden while streaming) */}
        {!isStreaming && (
          <div className="mt-5 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsLedgerOpen(!isLedgerOpen)}
              className="flex items-center justify-between w-full text-left text-xs text-slate-400 hover:text-purple-300 transition-colors py-1 font-mono cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span>[Tier 3] 3계층 신경·메모리 원장 (반사계 / 단기버퍼 / 장기기록)</span>
              </div>
              {isLedgerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {isLedgerOpen && (
              <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 text-[11px] font-mono text-slate-300 animate-fadeIn">
                <div className="p-2 rounded bg-purple-950/20 border border-purple-500/20">
                  <span className="text-purple-300 font-bold">• Layer 1 (Primitive Reflex):</span>{' '}
                  <span className="text-slate-300">스킨십 및 물리적 개입 시 척추 반사적 경직과 호흡의 미세한 파열</span>
                </div>
                <div className="p-2 rounded bg-rose-950/20 border border-rose-500/20">
                  <span className="text-rose-300 font-bold">• Layer 2 (Short-Term Somatic Buffer):</span>{' '}
                  <span className="text-slate-300">피부 표면에 남은 체온 잔향과 한계점까지 당겨진 의복의 장력 이력</span>
                </div>
                <div className="p-2 rounded bg-amber-950/20 border border-amber-500/20">
                  <span className="text-amber-300 font-bold">• Layer 3 (Long-Term Somatic Archive):</span>{' '}
                  <span className="text-slate-300">군림해온 고결 에고에 치명적 균열이 발생하고 소마틱 복종이 영구 각인됨</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
