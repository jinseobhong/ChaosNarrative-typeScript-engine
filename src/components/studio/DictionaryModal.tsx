import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { BookOpen, Shield, Flame, Zap, HeartHandshake, Sparkles, Sliders } from 'lucide-react';

interface DictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'archetypes' | 'traits' | 'stats' | 'stages'>('archetypes');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-purple-300">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <span>Abyss Engine 백과사전 & 아키타입 사전</span>
        </div>
      }
      subtitle="캐릭터 생성 및 롤플레잉 상호작용의 핵심 메커니즘 가이드"
      maxWidth="3xl"
    >
      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('archetypes')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'archetypes'
              ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> 4대 아키타입 (Archetypes)
        </button>
        <button
          onClick={() => setActiveTab('traits')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'traits'
              ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> 16 RGB 고유 결함 & 욕망 악법
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'stats'
              ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> 생체 수치 (DOM & TAINT)
        </button>
        <button
          onClick={() => setActiveTab('stages')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'stages'
              ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> 스테이지 진화 체계
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'archetypes' && (
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/30">
            <h4 className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-2">
              <span>🛡️ Rigid (강박 / 결벽형)</span>
              <span className="text-slate-400 text-xs font-normal">대표: 릴리스, 심연의 인격</span>
            </h4>
            <p className="text-slate-300 leading-relaxed mb-2">
              스스로에게 엄격한 고결 프로토콜과 절대적 통제욕을 지닌 유형입니다. 타인과의 감정적/신체적 접촉을 완강히 거부하지만,
              그 이면에 억눌린 취약점이 노출되거나 통제권을 상실했을 때 가장 극적인 심리적 균열과 굴복 반응을 보입니다.
            </p>
            <div className="text-amber-400/90 font-mono">공략 핵심: 신뢰를 쌓아 자발적 방어 해제를 유도하거나, 확고한 반박/제압으로 주도권 탈환</div>
          </div>

          <div className="p-4 rounded-lg bg-sky-950/20 border border-sky-500/30">
            <h4 className="font-bold text-sky-300 text-sm mb-1 flex items-center gap-2">
              <span>⚓ Endurer (인내 / 수호형)</span>
              <span className="text-slate-400 text-xs font-normal">대표: 에이라</span>
            </h4>
            <p className="text-slate-300 leading-relaxed mb-2">
              고통과 속죄를 묵묵히 짊어지며 신념을 지키는 유형입니다. 겉으로는 어떤 모욕이나 고난에도 흔들리지 않는 강철 같은 의지를 보이지만,
              내면의 깊은 죄책감과 타락에 대한 은밀한 공포가 치명적인 아킬레스건입니다.
            </p>
            <div className="text-sky-400/90 font-mono">공략 핵심: 죄책감을 자극하고 따스한 손길로 그녀의 방패 뒤 흉터를 어루만지기</div>
          </div>

          <div className="p-4 rounded-lg bg-purple-950/20 border border-purple-500/30">
            <h4 className="font-bold text-purple-300 text-sm mb-1 flex items-center gap-2">
              <span>🔮 Controller (지배 / 분석형)</span>
              <span className="text-slate-400 text-xs font-normal">대표: 세레미나</span>
            </h4>
            <p className="text-slate-300 leading-relaxed mb-2">
              모든 것을 지성과 연산, 마법적 법칙으로 규정하려는 오만한 지배자 유형입니다. 자신이 상황의 모든 변수를 통제하고 있다고 믿을 때
              안도감을 느끼며, 논리적으로 반박당하거나 미지의 자극에 신체 감응이 일어날 때 당황합니다.
            </p>
            <div className="text-purple-400/90 font-mono">공략 핵심: 이론의 허점을 찔러 마도 결계를 무너뜨리고 관능적 반전 주기</div>
          </div>

          <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
            <h4 className="font-bold text-emerald-300 text-sm mb-1 flex items-center gap-2">
              <span>⛓️ Deprived (결핍 / 갈망형)</span>
              <span className="text-slate-400 text-xs font-normal">대표: 실비아</span>
            </h4>
            <p className="text-slate-300 leading-relaxed mb-2">
              깊은 절망, 감금, 또는 배신으로 인해 자존감이 파괴되고 타인의 온기와 인정에 목말라하는 유형입니다.
              거절당하는 것을 극도로 두려워하며, 작은 다정함이나 강한 구속 모두에 깊은 애착과 의존을 드러냅니다.
            </p>
            <div className="text-emerald-400/90 font-mono">공략 핵심: 온기 나누어주기(순응/유혹) 및 독점적 지배 관계 형성</div>
          </div>
        </div>
      )}

      {activeTab === 'traits' && (
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-900/60 rounded-lg border border-white/5">
            <span className="text-purple-300 font-bold">1. 약점 & 복종 (Weakness & Submission)</span>
            <p className="text-slate-400 mt-1">캐릭터의 사회적/정치적/신체적 취약 고리. 대화에서 [반박]이나 [제압] 성공률에 결정적 영향.</p>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-white/5">
            <span className="text-pink-300 font-bold">2. 과성 반응 & 쾌감 (Sensory Hyper-Reaction)</span>
            <p className="text-slate-400 mt-1">특정 접촉, 온기, 속삭임, 신체 부위에 대한 본능적 과민 반응. [유혹] 옵션의 효율 극대화.</p>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-white/5">
            <span className="text-amber-300 font-bold">3. 은밀한 비밀 & 약점 (Hidden Sins & Secret Vows)</span>
            <p className="text-slate-400 mt-1">남들에게 절대 밝힐 수 없는 과거의 죄악, 계약, 또는 물리적 열쇠/성흔. [우회] 대화 시 해금 가능.</p>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-lg">
              <h5 className="font-bold text-purple-300 mb-1">DOM % (지배도 / 자존심)</h5>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                캐릭터 본인이 느끼는 오만과 통제력입니다. 수치가 90% 이상일 때는 서늘하고 도도하지만,
                대화와 제압을 통해 50% 이하로 떨어지면 플레이어의 요구에 저항하지 못하게 됩니다.
              </p>
            </div>
            <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-lg">
              <h5 className="font-bold text-rose-300 mb-1">TAINT % (타락 / 침식도)</h5>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                도덕적 금기나 쾌락에 신체가 물들어가는 비율입니다. 수치가 상승할수록 신성한 가치관이 붕괴하고
                플레이어의 은밀한 요구에 적극적으로 응하게 됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stages' && (
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-900/60 rounded-lg border border-white/5">
            <span className="text-slate-200 font-bold">Stage 1: 단성 게릴 - 온전한 오만과 냉철</span>
            <p className="text-slate-400 mt-1">완전한 경계 상태. 엄격한 거절과 냉담한 시선 유지.</p>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-white/5">
            <span className="text-yellow-300 font-bold">Stage 2: 함락의 전조 - 억눌린 갈망의 분출</span>
            <p className="text-slate-400 mt-1">굴복 60% 이상 또는 상애 50% 도달 시 전환. 말끝이 흐려지고 신체 통제력 약화.</p>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-white/5">
            <span className="text-rose-400 font-bold">Stage 3: 완전한 굴복 - 절대 복종의 서약</span>
            <p className="text-slate-400 mt-1">굴복 85% 이상 도달 시 전환. 플레이어의 모든 지시를 맹목적으로 따름.</p>
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg text-xs transition-colors"
        >
          확인 및 닫기
        </button>
      </div>
    </Modal>
  );
};
