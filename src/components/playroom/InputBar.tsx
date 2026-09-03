import React, { useState, useRef } from 'react';
import { Send, RefreshCw } from 'lucide-react';

interface InputBarProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({ onSendMessage, disabled = false }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || disabled) return;
    onSendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) {
        handleSubmit();
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-2">
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center bg-[#0d1020] border rounded-xl p-2 shadow-2xl transition-all ${
          disabled
            ? 'border-purple-500/30 bg-[#0b0e1c]'
            : 'border-white/10 focus-within:border-purple-500/60'
        }`}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? 'AI가 서사를 집필하고 있습니다... (입력은 가능하며 완료 후 전송됩니다)'
              : '당신의 행동이나 대사를 자유롭게 입력하세요... (Enter 전송 / Shift+Enter 줄바꿈)'
          }
          className="w-full px-3 py-1.5 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none max-h-28"
        />

        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className={`flex items-center gap-1.5 px-4 py-2 text-white font-bold rounded-lg text-xs shadow-md transition-all shrink-0 ml-2 ${
            disabled
              ? 'bg-purple-950/80 border border-purple-500/30 text-purple-300 opacity-70 cursor-not-allowed'
              : !input.trim()
              ? 'bg-slate-800 text-slate-500 opacity-40 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30 cursor-pointer'
          }`}
        >
          {disabled ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>집필 중...</span>
            </>
          ) : (
            <>
              <span>전송</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
