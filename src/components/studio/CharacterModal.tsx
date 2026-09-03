import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Character, CharacterTrait, QuickOption } from '../../types/character';
import { Sparkles, Save, Trash2, Plus } from 'lucide-react';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (charData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Character | null;
}

const COLOR_OPTIONS = [
  { label: 'Amber', value: 'bg-amber-600' },
  { label: 'Sky', value: 'bg-sky-600' },
  { label: 'Purple', value: 'bg-purple-700' },
  { label: 'Emerald', value: 'bg-emerald-700' },
  { label: 'Rose', value: 'bg-rose-800' },
  { label: 'Indigo', value: 'bg-indigo-700' },
  { label: 'Fuchsia', value: 'bg-fuchsia-700' },
];

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [avatarInitial, setAvatarInitial] = useState('');
  const [avatarColor, setAvatarColor] = useState('bg-amber-600');
  const [archetype, setArchetype] = useState<'Rigid' | 'Endurer' | 'Controller' | 'Deprived'>('Rigid');
  const [archetypeDetail, setArchetypeDetail] = useState('');
  const [stage, setStage] = useState('');
  const [currentLocation, setCurrentLocation] = useState('#침실');
  const [egoSummary, setEgoSummary] = useState('');
  const [weaknessSummary, setWeaknessSummary] = useState('');
  const [domRate, setDomRate] = useState(90);
  const [taintRate, setTaintRate] = useState(5);

  const [traits, setTraits] = useState<CharacterTrait[]>([
    {
      id: 't-1',
      category: 'weakness',
      categoryLabel: '약점 & 복종',
      title: '약점 & 복종',
      description: '국가를 뒤흔든 서늘한 고결 명분, 하체 마비산 서늘한 군축 초기',
    },
    {
      id: 't-2',
      category: 'pleasure',
      categoryLabel: '과성 반응 & 쾌감',
      title: '과성 반응 & 쾌감',
      description: '관능 자극에 약하며 부계의 흔적 서약의 뇌리에 결박됨',
    },
    {
      id: 't-3',
      category: 'secret',
      categoryLabel: '은밀한 비밀 & 약점',
      title: '은밀한 비밀 & 약점',
      description: '가문의 비밀 금고 열쇠를 소유하고 있으며 체온에 극도로 취약함',
    },
  ]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCode(initialData.code);
      setTitle(initialData.title);
      setAffiliation(initialData.affiliation);
      setAvatarInitial(initialData.avatarInitial || initialData.name.charAt(0));
      setAvatarColor(initialData.avatarColor || 'bg-amber-600');
      setArchetype(initialData.archetype);
      setArchetypeDetail(initialData.archetypeDetail);
      setStage(initialData.stage);
      setCurrentLocation(initialData.currentLocation);
      setEgoSummary(initialData.egoSummary);
      setWeaknessSummary(initialData.weaknessSummary);
      setDomRate(initialData.stats.domRate);
      setTaintRate(initialData.stats.taintRate);
      setTraits(initialData.traits);
    } else {
      // Defaults for new
      const randCode = `R${(Math.random() * 30 + 10).toFixed(1)}-700-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setName('');
      setCode(randCode);
      setTitle('새로운 등장인물');
      setAffiliation('판타지 제국');
      setAvatarInitial('');
      setAvatarColor('bg-purple-700');
      setArchetype('Rigid');
      setArchetypeDetail('결벽증적 척추 방어');
      setStage('Stage 1 (단성 게릴 - 온전한 오만과 냉철)');
      setCurrentLocation('#개인 집무실');
      setEgoSummary('');
      setWeaknessSummary('');
      setDomRate(95);
      setTaintRate(2);
    }
  }, [initialData, isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const charData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      code: code || `R12.0-700-0000`,
      title: title.trim() || '등장인물',
      affiliation: affiliation.trim() || '미지의 세력',
      avatarInitial: avatarInitial.trim() || name.trim().charAt(0),
      avatarColor,
      archetype,
      archetypeDetail: archetypeDetail.trim() || '고유 방어 기제',
      stage: stage.trim() || 'Stage 1 (단성 게릴 - 온전한 오만과 냉철)',
      currentLocation: currentLocation.trim() || '#미지의 공간',
      egoSummary: egoSummary.trim() || '스스로를 통제하려는 서늘한 에고 프로토콜',
      weaknessSummary: weaknessSummary.trim() || '치명적인 약점과 비밀',
      stats: {
        domRate,
        erosRate: initialData?.stats.erosRate ?? 5.0,
        trustRate: initialData?.stats.trustRate ?? 20.0,
        fractureRate: initialData?.stats.fractureRate ?? 10.0,
        taintRate,
        trust: initialData?.stats.trust ?? 20,
        love: initialData?.stats.love ?? 0,
        neutralize: initialData?.stats.neutralize ?? -20,
        guilt: initialData?.stats.guilt ?? 15,
        submission: initialData?.stats.submission ?? 20,
      },
      traits,
      initialScenario: initialData?.initialScenario ?? {
        turn: 1,
        narration: [
          `서늘한 침묵이 감도는 공간, [${name}]은(는) 당신을 차가운 눈빛으로 응시하고 있다.`,
          `그녀의 빈틈없는 방어 태세 너머로 숨길 수 없는 긴장감이 느껴진다.`,
        ],
        dialogue: `${name}: "선을 넘지 마라. 무례한 자여, 나의 긍지는 네 얄팍한 수작에 흔들리지 않는다."`,
        quickOptions: [
          {
            id: 'opt-new-1',
            type: 'compliance',
            label: '순응',
            badgeText: '순응',
            colorClass: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400',
            text: '차분하게 고개를 숙이며 그녀의 경계심을 누그러뜨린다.',
            statImpact: { trust: 5, love: 2, submission: 2 },
          },
          {
            id: 'opt-new-2',
            type: 'rebuttal',
            label: '반박',
            badgeText: '반박',
            colorClass: 'border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 hover:border-rose-400',
            text: '그녀의 오만함을 날카롭게 지적하며 대등한 입장을 요구한다.',
            statImpact: { neutralize: 8, submission: 5, domRate: -2 },
          },
          {
            id: 'opt-new-3',
            type: 'seduce',
            label: '유혹',
            badgeText: '유혹',
            colorClass: 'border-purple-500/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/50 hover:border-purple-400',
            text: '그녀의 손을 부드럽게 감싸쥐며 은밀한 제안을 건넨다.',
            statImpact: { love: 7, taintRate: 3, trust: 4 },
          },
          {
            id: 'opt-new-4',
            type: 'dominate',
            label: '제압',
            badgeText: '제압',
            colorClass: 'border-fuchsia-600/40 bg-fuchsia-950/30 text-fuchsia-300 hover:bg-fuchsia-900/50 hover:border-fuchsia-400',
            text: '단호한 태도로 다가가 그녀를 벽으로 몰아세운다.',
            statImpact: { submission: 10, neutralize: 6, domRate: -3 },
          },
          {
            id: 'opt-new-5',
            type: 'bypass',
            label: '우회',
            badgeText: '우회',
            colorClass: 'border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50 hover:border-amber-400',
            text: '침묵을 지키며 서늘한 시선으로 그녀의 심리를 압박한다.',
            statImpact: { guilt: 6, trust: -1, taintRate: 1 },
          },
        ],
      },
    };

    onSave(charData);
    onClose();
  };

  const updateTraitDesc = (index: number, val: string) => {
    setTraits((prev) => prev.map((t, i) => (i === index ? { ...t, description: val } : t)));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-purple-300">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span>{initialData ? '캐릭터 수정 (Character Edit)' : '새 캐릭터 생성 (Character Creation)'}</span>
        </div>
      }
      subtitle="Abyss Engine 페르소나, 아키타입, 16 RGB 고유 결함 및 생체 수치 설정"
      maxWidth="3xl"
    >
      <form onSubmit={handleSave} className="space-y-5 text-xs">
        {/* Row 1: Name, Code, Title */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">캐릭터 이름 *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!avatarInitial) setAvatarInitial(e.target.value.charAt(0));
              }}
              placeholder="예: 릴리스"
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">고유 식별 코드</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="예: R12.2-700-BFFF"
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-purple-300 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">신분 / 직책</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 제1황녀"
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Row 2: Affiliation, Archetype, Detail */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">소속 세력</label>
            <input
              type="text"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder="예: 제국 황실"
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">아키타입 (Archetype)</label>
            <select
              value={archetype}
              onChange={(e) => setArchetype(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
            >
              <option value="Rigid">Rigid (강박 / 결벽형)</option>
              <option value="Endurer">Endurer (인내 / 수호형)</option>
              <option value="Controller">Controller (지배 / 분석형)</option>
              <option value="Deprived">Deprived (결핍 / 갈망형)</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">아키타입 상세 방어 기제</label>
            <input
              type="text"
              value={archetypeDetail}
              onChange={(e) => setArchetypeDetail(e.target.value)}
              placeholder="예: 결벽증적 척추 방어"
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Row 3: Avatar Color & Initial */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">아바타 이니셜 (1자)</label>
            <input
              type="text"
              maxLength={2}
              value={avatarInitial}
              onChange={(e) => setAvatarInitial(e.target.value)}
              placeholder="예: 릴"
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">아바타 컬러 테마</label>
            <div className="flex gap-2 mt-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setAvatarColor(c.value)}
                  className={`w-7 h-7 rounded-lg ${c.value} transition-transform ${
                    avatarColor === c.value ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">현재 위치 태그</label>
            <input
              type="text"
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              placeholder="예: #침실"
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Row 4: Stage & Summaries */}
        <div className="space-y-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">발현 단계 (Stage)</label>
            <input
              type="text"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              placeholder="예: Stage 1 (단성 게릴 - 온전한 오만과 냉철)"
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">에고 특징 요약</label>
            <input
              type="text"
              value={egoSummary}
              onChange={(e) => setEgoSummary(e.target.value)}
              placeholder="예: 국가를 통솔하는 서늘한 고결 프로토콜..."
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">유일한 약점 요약</label>
            <input
              type="text"
              value={weaknessSummary}
              onChange={(e) => setWeaknessSummary(e.target.value)}
              placeholder="예: 가문의 거대한 빚과 영지를 동결시킬..."
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Row 5: Biological Stats (DOM / TAINT) */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-white/10 grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span className="text-purple-300">DOM % (자존심 / 지배력)</span>
              <span className="text-purple-400 font-mono">{domRate.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={domRate}
              onChange={(e) => setDomRate(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>
          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span className="text-rose-300">TAINT % (타락 / 침식도)</span>
              <span className="text-rose-400 font-mono">{taintRate.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={taintRate}
              onChange={(e) => setTaintRate(parseFloat(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>
        </div>

        {/* Row 6: 16 RGB Traits */}
        <div className="space-y-2">
          <label className="block text-slate-300 font-semibold">고유 결함 & 욕망 악법 (16 RGB Traits)</label>
          {traits.map((t, idx) => (
            <div key={t.id} className="p-3 bg-slate-900/80 rounded-lg border border-white/5 space-y-1">
              <span className="text-purple-300 font-semibold">{t.categoryLabel}</span>
              <input
                type="text"
                value={t.description}
                onChange={(e) => updateTraitDesc(idx, e.target.value)}
                className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded text-slate-200 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>저장하기</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
