import React, { useState, useEffect } from 'react';
import { useModelStore, ModelOption } from '../../store/useModelStore';
import { Modal } from './Modal';
import { Cpu, ChevronDown, Check, Zap, Sparkles, Shield, AlertCircle, RefreshCw } from 'lucide-react';

export const ModelSelector: React.FC = () => {
  const { models, activeModelId, providersStatus, setActiveModelId, fetchModels, getActiveModel } =
    useModelStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const activeModel = getActiveModel();

  return (
    <>
      {/* Header Button Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#171b30] hover:bg-[#202542] text-purple-200 border border-purple-500/40 rounded-lg font-mono text-xs shadow-md transition-all hover:border-purple-400 group cursor-pointer"
        title="LLM 모델 및 캐스케이드 설정"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            activeModel?.provider === 'anthropic' ? 'bg-orange-400' : 'bg-purple-400'
          } animate-pulse`}
        />
        <span className="font-semibold text-white">{activeModel?.name || 'LLM Model'}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform" />
      </button>

      {/* Model Selection & Cascade Modal (Enlarged & Spacious) */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <div className="flex items-center gap-2 text-purple-300">
            <Cpu className="w-5 h-5 text-purple-400" />
            <span className="text-base font-bold">LLM 모델 선택 및 스마트 캐스케이드(Cascade) 설정</span>
          </div>
        }
        subtitle="원하는 주력 모델을 선택하세요. 응답 지연이나 트래픽 급증(503) 시 다음 모델로 자동 안전 폴백됩니다."
        maxWidth="3xl"
      >
        <div className="space-y-4 text-xs">
          {/* Provider Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                providersStatus.google
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900/80 border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🌐</span>
                <div>
                  <div className="font-bold text-slate-100">Google Gemini API</div>
                  <div className="text-[11px] text-slate-400">GEMINI_API_KEY</div>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                {providersStatus.google ? '연결됨 ✅' : '키 미설정 ⚠️'}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                providersStatus.anthropic
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900/80 border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">⚡</span>
                <div>
                  <div className="font-bold text-slate-100">Anthropic Claude API</div>
                  <div className="text-[11px] text-slate-400">ANTHROPIC_API_KEY</div>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300">
                {providersStatus.anthropic ? '연결됨 ✅' : '크레딧 확인 필요 ⚠️'}
              </span>
            </div>
          </div>

          {/* Model Options List (Generous Height with smooth scroll) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-200 font-bold text-xs">
                사용 가능한 공식 LLM 모델 목록 (클릭하여 1순위 모델 변경):
              </label>
              <span className="text-[11px] font-mono text-purple-400">
                현재 활성: {activeModel?.name}
              </span>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
              {models.map((model) => {
                const isSelected = activeModelId === model.id;
                const isGoogle = model.provider === 'google';

                return (
                  <div
                    key={model.id}
                    onClick={() => setActiveModelId(model.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#181d3d] border-purple-500 shadow-neon-purple text-white ring-1 ring-purple-500/50'
                        : 'bg-[#0e1122] border-white/10 hover:border-purple-500/40 hover:bg-[#13172e] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow ${
                          isGoogle
                            ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                            : 'bg-orange-950 text-orange-300 border border-orange-500/40'
                        }`}
                      >
                        {isGoogle ? 'G' : 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{model.name}</span>
                          <span className="text-[10px] font-mono text-purple-400 bg-purple-950/70 px-2 py-0.5 rounded border border-purple-500/30">
                            {model.id}
                          </span>
                          {model.id === 'gemini-3.5-flash-lite' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                              ⚡ 초고속 추천
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {model.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-purple-600 border-purple-400 text-white scale-110 shadow'
                          : 'border-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cascade Info Box */}
          <div className="p-3.5 rounded-xl bg-purple-950/25 border border-purple-500/30 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-purple-300 font-bold">스마트 캐스케이드(Cascade) 엔진 가동 중:</span>
              <p className="text-slate-400 mt-0.5 text-[11px]">
                선택한 1순위 모델이 Google 서버 트래픽 스파이크(503)나 Rate Limit(429)을 겪더라도 대화가 중단되지 않고,
                <code className="text-purple-300 mx-1">gemini-3.5-flash-lite ➔ gemini-3.1-flash-lite ➔ 3.5-flash</code> 순으로
                자동 안전 폴백되어 끊김 없는 롤플레잉을 진행합니다.
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              선택 완료 및 적용
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
