import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Character, ResolutionVector } from '../../types/character';
import {
  Sparkles,
  Bot,
  Check,
  ChevronRight,
  Shield,
  Layers,
  FileCode,
  User,
  Zap,
  Eye,
  Shirt,
  Copy,
  ArrowRight,
  Flame,
  CheckCircle2,
  RefreshCw,
  Crown,
  Image as ImageIcon,
  Upload,
  X,
  FileText,
  Target,
  ShieldAlert,
  Compass,
} from 'lucide-react';

interface DynamicCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: (character: Character, enterPlayRoom?: boolean) => void;
}

const SAMPLE_DUAL_PRESETS = [
  {
    name: '제1황녀 릴리스',
    goal: '가문의 반역 혐의를 입증할 비밀 서약서를 당신에게서 되찾고 황실 권위를 수호해야 함',
    taboo: '서출 혈통의 비밀과 목선의 성스러운 인장이 간파당하는 것',
    background: '서늘한 은발과 결벽증적 통제욕을 지닌 제국의 제1황녀, 타인의 체온에 극도로 취약함',
  },
  {
    name: '도발적인 악마소녀 벨레트',
    goal: '당신에게서 영혼 계약을 강탈하여 고갈된 마력 코어를 수복하고 마계로 끌고 가야 함',
    taboo: '에나멜 바디슈트 속 봉인 마법진과 마력 결핍으로 인한 신경계 역류',
    background: '에나멜 바디슈트와 다리를 높이 치켜든 도발적 포즈로 상대를 위압하려는 악마소녀',
  },
  {
    name: '백은의 성기사단장 에이라',
    goal: '당신의 이단 혐의를 입증하고 밀실의 열쇠를 회수하여 성전으로 압송해야 함',
    taboo: '과거 마녀에게 입은 타락의 낙인이 타인의 체온에 반응하여 타오르는 것',
    background: '신성 맹세를 수호하며 어떤 고통에도 흔들리지 않는 백은의 성기사단장',
  },
  {
    name: '대마도사 세레미나',
    goal: '당신이 소유한 고대 금단의 마도서를 빼앗아 아카데미의 절대 권력을 장악해야 함',
    taboo: '자신의 마력 결계가 해제되었을 때 온몸의 신경이 과민해지며 쾌감이 역류하는 것',
    background: '모든 것을 수치화하여 지배하려는 오만하고 냉철한 성전의 대마도사',
  },
];

export const DynamicCreatorModal: React.FC<DynamicCreatorModalProps> = ({
  isOpen,
  onClose,
  onCharacterCreated,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');

  // 2대 핵심 제약선 (목적 + 금기) + 공간 레이어 + 배경 텍스트
  const [positiveGoal, setPositiveGoal] = useState('');
  const [negativeTaboo, setNegativeTaboo] = useState('');
  const [spatialLayer, setSpatialLayer] = useState(
    'Layer 3 (완전 밀실 - 사회적·심리적 제약 조건 해체 공간)'
  );
  const [userPrompt, setUserPrompt] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Image Upload / Vision state
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [visionAnalysisResult, setVisionAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1 Output
  const [vectorData, setVectorData] = useState<{
    domain_mode: string;
    seed_hash: string;
    boundary: {
      target_domain: string;
      positive_goal: string;
      negative_taboo: string;
      spatial_layer: string;
      archetype: string;
      archetype_detail: string;
      hard_invariants: string[];
    };
    resolution_vectors: ResolutionVector[];
  } | null>(null);

  // Selected Vector
  const [selectedVector, setSelectedVector] = useState<ResolutionVector | null>(null);

  // Step 2 Output (Compiled Character)
  const [compiledCharacter, setCompiledCharacter] = useState<Character | null>(null);

  // Active Tab in Step 4
  const [previewTab, setPreviewTab] = useState<'appearance' | 'traits' | 'prompt'>('appearance');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Listen for Clipboard Paste (Ctrl+V) when image mode is active
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleImageFile(blob);
            setInputMode('image');
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const resetState = () => {
    setStep(1);
    setInputMode('text');
    setPositiveGoal('');
    setNegativeTaboo('');
    setSpatialLayer('Layer 3 (완전 밀실 - 사회적·심리적 제약 조건 해체 공간)');
    setUserPrompt('');
    setSelectedImageBase64(null);
    setVisionAnalysisResult(null);
    setVectorData(null);
    setSelectedVector(null);
    setCompiledCharacter(null);
    setErrorMessage(null);
    setIsLoading(false);
    setIsAnalyzingImage(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('이미지 파일(PNG, JPG, WebP)만 업로드할 수 있습니다.');
      return;
    }

    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSelectedImageBase64(base64);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Image Vision Analysis Trigger
  const handleAnalyzeImage = async () => {
    if (!selectedImageBase64) return;

    setIsAnalyzingImage(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/analyze-character-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImageBase64,
          mimeType: imageMimeType,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `이미지 분석 오류 (${res.status})`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setVisionAnalysisResult(json.data);
        // Automatically populate 2 Core Invariants + Spatial Layer + Narrative Profile
        if (json.data.positiveGoal) setPositiveGoal(json.data.positiveGoal);
        if (json.data.negativeTaboo) setNegativeTaboo(json.data.negativeTaboo);
        if (json.data.spatialLayer) setSpatialLayer(json.data.spatialLayer);
        if (json.data.narrativeProfile) setUserPrompt(json.data.narrativeProfile);
      } else {
        throw new Error('이미지에서 캐릭터 정보를 추출하지 못했습니다.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gemini Vision AI 분석에 실패했습니다.');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // 1단계: 2대 제약선 (목적 + 금기) & 공간 레이어 기반 5대 상호 직교 궤적(V1~V5) 도출
  const handleAnalyzePrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!positiveGoal.trim() && !userPrompt.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-vectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positiveGoal: positiveGoal.trim() || '당신에게서 주도권을 지켜내고 자신의 권위를 수호하는 것',
          negativeTaboo: negativeTaboo.trim() || '자신의 과거나 혈통의 비밀을 타인에게 간파당하는 것',
          spatialLayer: spatialLayer || 'Layer 3 (완전 밀실 - 사회적·심리적 제약 조건 해체 공간)',
          userPrompt: userPrompt.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류 (${res.status})`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setVectorData(json.data);
        if (json.data.resolution_vectors && json.data.resolution_vectors.length > 0) {
          setSelectedVector(json.data.resolution_vectors[0]);
        }
        setStep(2); // Move to Human Checkpoint 1 (5 Orthogonal Vectors)
      } else {
        throw new Error('5대 직교 서사 궤적 데이터를 파싱할 수 없습니다.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || 'Gemini API 호출에 실패했습니다. .env 파일의 GEMINI_API_KEY를 확인하세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 2단계: 선택된 궤적으로 정밀 캐릭터 컴파일
  const handleCompileCharacter = async () => {
    if (!vectorData || !selectedVector) return;

    setIsLoading(true);
    setErrorMessage(null);
    setStep(3); // Loading animation step

    try {
      const res = await fetch('/api/compile-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed_hash: vectorData.seed_hash,
          boundary: vectorData.boundary,
          selected_vector: selectedVector,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 컴파일 오류 (${res.status})`);
      }

      const json = await res.json();
      if (json.success && json.character) {
        setCompiledCharacter(json.character);
        setStep(4); // Move to Human Checkpoint 2 (Preview & Final Approve)
      } else {
        throw new Error('캐릭터 세부 스펙 컴파일에 실패했습니다.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '캐릭터 컴파일 중 오류가 발생했습니다.');
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  // 4단계: 최종 저장 및 플레이
  const handleFinish = (enterPlayRoom: boolean) => {
    if (!compiledCharacter) return;
    onCharacterCreated(compiledCharacter, enterPlayRoom);
    handleClose();
  };

  const copyImagePrompt = () => {
    if (compiledCharacter?.appearance?.aiImagePrompt) {
      navigator.clipboard.writeText(compiledCharacter.appearance.aiImagePrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-purple-300">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span>Dify 25대 마스터 서사 엔진 • AI 캐릭터 동적 생성기</span>
        </div>
      }
      subtitle="[2대 제약선: 목적+금기], [4단계 공간 레이어] 및 [5대 상호 직교 궤적]을 바탕으로 살아 숨 쉬는 입체적 서사를 컴파일합니다."
      maxWidth="3xl"
    >
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = '';
        }}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
      />

      {/* Step Indicator Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5 text-xs font-mono">
        <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-purple-400 font-bold' : 'text-slate-500'}`}>
          <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-500/40 flex items-center justify-center text-[10px]">
            1
          </span>
          <span>2대 제약선 & 공간 레이어</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-purple-400 font-bold' : 'text-slate-500'}`}>
          <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-500/40 flex items-center justify-center text-[10px]">
            2
          </span>
          <span>5대 직교(Orthogonal) 궤적 선택</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <div className={`flex items-center gap-1.5 ${step === 3 || step === 4 ? 'text-purple-400 font-bold' : 'text-slate-500'}`}>
          <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-500/40 flex items-center justify-center text-[10px]">
            3
          </span>
          <span>심리 욕구 & 금기 검증</span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 mb-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200 animate-fadeIn">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* ================= STEP 1: Dual Core Invariants (Positive Goal + Negative Taboo) ================= */}
      {step === 1 && (
        <div className="space-y-4 text-xs relative">
          {/* Active Loading Overlay during Vector Generation */}
          {isLoading && (
            <div className="absolute inset-0 z-20 bg-[#090b16]/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center space-y-3 p-6 text-center animate-fadeIn border border-purple-500/40">
              <div className="w-12 h-12 rounded-full bg-purple-950/80 border-2 border-purple-500 flex items-center justify-center shadow-neon-purple animate-pulse">
                <RefreshCw className="w-6 h-6 text-purple-300 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>5대 상호 직교 궤적(V1~V5) 동적 도출 중...</span>
                </h4>
                <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                  입력하신 [🎯 목적]과 [🚫 금기]로부터 겹치지 않는 5가지 독립 서사 전략을 실시간 생성하고 있습니다...
                </p>
              </div>
            </div>
          )}

          {/* Input Mode Selector (Text vs Image Vision) */}
          <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              type="button"
              disabled={isLoading || isAnalyzingImage}
              onClick={() => setInputMode('text')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all ${
                inputMode === 'text'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              } ${isLoading || isAnalyzingImage ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <FileText className="w-4 h-4" />
              <span>✍️ 2대 제약선 직접 입력</span>
            </button>
            <button
              type="button"
              disabled={isLoading || isAnalyzingImage}
              onClick={() => setInputMode('image')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all ${
                inputMode === 'image'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              } ${isLoading || isAnalyzingImage ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <ImageIcon className="w-4 h-4 text-pink-300" />
              <span>🖼️ 이미지에서 목적 & 금기 자동 추출 (Vision AI)</span>
            </button>
          </div>

          {/* MODE A: Image Vision Upload & Extraction */}
          {inputMode === 'image' && (
            <div className="space-y-3 relative">
              {/* Image Analyzing Overlay */}
              {isAnalyzingImage && (
                <div className="absolute inset-0 z-20 bg-[#090b16]/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center space-y-2.5 p-6 text-center animate-fadeIn border border-pink-500/40">
                  <div className="w-10 h-10 rounded-full bg-pink-950/80 border border-pink-500 flex items-center justify-center shadow-neon-rose animate-pulse">
                    <RefreshCw className="w-5 h-5 text-pink-300 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">Gemini Multimodal Vision 분석 중...</h4>
                    <p className="text-[10px] text-pink-200/80">이미지의 외모, 의복, 포즈에서 [🎯 목적]과 [🚫 금기]를 역추출하고 있습니다.</p>
                  </div>
                </div>
              )}

              {!selectedImageBase64 ? (
                /* Dropzone */
                <div
                  onClick={() => !isAnalyzingImage && fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (isAnalyzingImage) return;
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                  className={`p-8 border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-2xl bg-[#0c0e1e] hover:bg-[#11142b] transition-all flex flex-col items-center justify-center text-center group ${
                    isAnalyzingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-purple-950/80 border border-purple-500/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-purple-300" />
                  </div>
                  <div className="text-slate-200 font-bold text-sm mb-1">
                    캐릭터 일러스트 이미지를 드래그하거나 클릭하여 업로드
                  </div>
                  <p className="text-slate-400 text-[11px] max-w-sm leading-relaxed">
                    클립보드 이미지를 <kbd className="px-1.5 py-0.5 bg-black/60 rounded border border-white/10 text-purple-300 font-mono">Ctrl + V</kbd> 로 바로 붙여넣을 수도 있습니다.
                  </p>
                </div>
              ) : (
                /* Image Preview & Vision Analysis Card */
                <div className="p-4 rounded-xl bg-[#0d1022] border border-purple-500/40 space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="relative group shrink-0">
                      <img
                        src={selectedImageBase64}
                        alt="Uploaded Character"
                        className="w-24 h-32 object-cover rounded-xl border border-purple-500/50 shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageBase64(null);
                          setVisionAnalysisResult(null);
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow cursor-pointer"
                        title="이미지 삭제"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                          <span>업로드된 캐릭터 일러스트</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] text-purple-400 hover:text-purple-300 underline cursor-pointer"
                        >
                          다른 이미지로 변경
                        </button>
                      </div>

                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Gemini Multimodal Vision이 이미지의 복장, 포즈, 시선을 분석하여 [🎯 무조건 이루어야 할 목적]과 [🚫 절대적 금기]를 자동 추출합니다.
                      </p>

                      <button
                        type="button"
                        disabled={isAnalyzingImage}
                        onClick={handleAnalyzeImage}
                        className={`px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all ${
                          isAnalyzingImage ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        {isAnalyzingImage ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Gemini Vision AI가 분석 중...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>✨ 목적 & 금기 2대 제약선 자동 추출</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DUAL CORE INPUT 1: 🎯 무조건 이루어내야 하는 목적 */}
          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-purple-200 font-bold flex items-center gap-1.5 text-xs">
                <Target className="w-4 h-4 text-purple-400" />
                <span>1. 🎯 캐릭터가 무조건 이루어내야 하는 목적 (Positive Goal) *</span>
              </label>
              <span className="text-[10px] text-purple-400 font-mono">절대 불변 락 적용</span>
            </div>
            <textarea
              rows={2}
              value={positiveGoal}
              onChange={(e) => setPositiveGoal(e.target.value)}
              placeholder="예: 당신에게서 비밀 서약서를 되찾아야 함, 마력 코어를 수복하기 위해 영혼 계약을 강탈해야 함, 이단 혐의를 입증하고 성전으로 압송해야 함..."
              className="w-full p-2.5 bg-slate-950 border border-purple-500/30 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none text-xs leading-relaxed"
            />
          </div>

          {/* DUAL CORE INPUT 2: 🚫 절대적인 금기 & 역린 */}
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-rose-200 font-bold flex items-center gap-1.5 text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>2. 🚫 절대적인 금기 & 뺏기면 안 되는 역린 (Negative Taboo) *</span>
              </label>
              <span className="text-[10px] text-rose-400 font-mono">절대 불변 락 적용</span>
            </div>
            <textarea
              rows={2}
              value={negativeTaboo}
              onChange={(e) => setNegativeTaboo(e.target.value)}
              placeholder="예: 서출 혈통의 비밀과 성스러운 인장이 간파당하는 것, 에나멜 바디슈트 속 봉인 마법진과 마력 결핍, 타락의 낙인 노출..."
              className="w-full p-2.5 bg-slate-950 border border-rose-500/30 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-400 resize-none text-xs leading-relaxed"
            />
          </div>

          {/* DUAL CORE INPUT 3: 🎨 외모 및 캐릭터 기본 설정 */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-1.5">
            <label className="text-slate-200 font-bold flex items-center gap-1.5 text-xs">
              <User className="w-4 h-4 text-purple-400" />
              <span>3. 🎨 캐릭터 외모, 신분 및 배경 설정 (선택/자유 묘사)</span>
            </label>
            <textarea
              rows={2}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="예: 제국에서 가장 서늘하고 오만한 은발의 제1황녀, 에나멜 바디슈트와 도발적인 다리 포즈의 악마소녀..."
              className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none text-xs leading-relaxed"
            />
          </div>

          {/* Preset Ideas (in text mode) */}
          {inputMode === 'text' && (
            <div>
              <div className="text-[11px] text-slate-400 mb-2 font-medium">✨ 추천 듀얼 제약선 프리셋 (클릭 시 자동 입력):</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_DUAL_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPositiveGoal(p.goal);
                      setNegativeTaboo(p.taboo);
                      setUserPrompt(p.background);
                    }}
                    className="text-left p-2.5 rounded-lg bg-slate-900/80 hover:bg-purple-950/40 border border-white/5 hover:border-purple-500/30 text-slate-300 hover:text-purple-200 text-[11px] transition-all cursor-pointer space-y-0.5"
                  >
                    <div className="font-bold text-white text-xs">👑 {p.name}</div>
                    <div className="text-purple-300 truncate">🎯 {p.goal}</div>
                    <div className="text-rose-300 truncate">🚫 {p.taboo}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              disabled={(!positiveGoal.trim() && !userPrompt.trim()) || isLoading || isAnalyzingImage}
              onClick={handleAnalyzePrompt}
              className={`px-5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all ${
                (!positiveGoal.trim() && !userPrompt.trim()) || isLoading || isAnalyzingImage
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>5대 상호 직교 궤적(V1~V5) 동적 도출 중...</span>
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5" />
                  <span>5대 직교 궤적(V1~V5) 동적 도출 &rarr;</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: Human Checkpoint 1 (5 Orthogonal Vectors Selection) ================= */}
      {step === 2 && vectorData && (
        <div className="space-y-4 text-xs animate-fadeIn">
          {/* Identity & Dual Invariant Bar */}
          <div className="p-3.5 bg-purple-950/40 border border-purple-500/40 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{vectorData.boundary.target_domain}</span>
                <span className="text-xs font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  🛡️ {vectorData.boundary.archetype} ({vectorData.boundary.archetype_detail})
                </span>
              </div>
              <div className="text-[11px] font-mono text-purple-400">
                GENE SEED: {vectorData.seed_hash} (100턴 불변 앵커링)
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[11px]">
              <div className="flex items-center gap-1.5 text-purple-300 truncate">
                <span className="font-bold shrink-0">🎯 공격선(목적):</span>
                <span className="text-slate-200 truncate">{vectorData.boundary.positive_goal}</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-300 truncate">
                <span className="font-bold shrink-0">🚫 방어선(금기):</span>
                <span className="text-slate-200 truncate">{vectorData.boundary.negative_taboo}</span>
              </div>
            </div>

            {vectorData.boundary.spatial_layer && (
              <div className="pt-1 border-t border-white/5 text-[11px] text-indigo-300 font-mono">
                🏛️ 공간 레이어: {vectorData.boundary.spatial_layer}
              </div>
            )}
          </div>

          {/* V1 ~ V5 Orthogonal Resolution Vectors List */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-slate-200 font-bold">
                🧭 5대 상호 직교(Orthogonal) 서사 궤적 선택 (Human Checkpoint 1) *
              </label>
              <span className="text-[10px] text-purple-400 font-mono">
                5개 축이 서로 겹치지 않는 독립적 전략
              </span>
            </div>
            <div className="space-y-2">
              {vectorData.resolution_vectors.map((v) => {
                const isSelected = selectedVector?.vector_id === v.vector_id;

                let badgeColor = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40';
                if (v.vector_id === 'V2') badgeColor = 'bg-rose-950/70 text-rose-300 border-rose-500/40';
                if (v.vector_id === 'V3') badgeColor = 'bg-purple-950/70 text-purple-300 border-purple-500/40';
                if (v.vector_id === 'V4') badgeColor = 'bg-fuchsia-950/70 text-fuchsia-300 border-fuchsia-500/40';
                if (v.vector_id === 'V5') badgeColor = 'bg-amber-950/70 text-amber-300 border-amber-500/40';

                return (
                  <div
                    key={v.vector_id}
                    onClick={() => setSelectedVector(v)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#151933] border-purple-500 shadow-neon-purple'
                        : 'bg-[#0e1122] border-white/10 hover:border-purple-500/40 hover:bg-[#12162b]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`px-2.5 py-1 rounded-md border text-xs font-bold font-mono shrink-0 ${badgeColor}`}>
                        [{v.vector_id}]
                      </span>
                      <div>
                        <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          <span>{v.vector_name}</span>
                          <span className="text-[10px] font-mono text-purple-400">({v.operation})</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {v.axis_description}
                        </p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-purple-600 border-purple-400 text-white' : 'border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
            >
              &larr; 이전 단계
            </button>
            <button
              type="button"
              disabled={!selectedVector || isLoading}
              onClick={handleCompileCharacter}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>선택 궤적으로 심리 욕구 & 25대 헌법 정밀 컴파일 &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: Compiling Progress Animation ================= */}
      {step === 3 && (
        <div className="py-14 flex flex-col items-center justify-center space-y-4 text-center animate-fadeIn">
          <div className="w-14 h-14 rounded-full bg-purple-950/80 border-2 border-purple-500 flex items-center justify-center shadow-neon-purple animate-pulse">
            <Sparkles className="w-7 h-7 text-purple-300 animate-spin" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white">Gemini 직교 궤적 & 3대 심리 욕구 헌법 컴파일 중...</h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              [🎯 목적]과 [🚫 금기] 2대 제약선, [4단계 공간 압력], SDT 심리 욕구(자율/유능/관계)를 조립하고 있습니다...
            </p>
          </div>
        </div>
      )}

      {/* ================= STEP 4: Human Checkpoint 2 (Preview & Final Approve) ================= */}
      {step === 4 && compiledCharacter && (
        <div className="space-y-4 text-xs animate-fadeIn">
          {/* Header Badge Card */}
          <div className="p-3.5 bg-[#121528] border border-purple-500/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedImageBase64 ? (
                <img
                  src={selectedImageBase64}
                  alt="Character Thumbnail"
                  className="w-11 h-11 rounded-lg object-cover border border-purple-500/40 shadow"
                />
              ) : (
                <div
                  className={`w-11 h-11 rounded-lg ${compiledCharacter.avatarColor} flex items-center justify-center font-serif text-xl font-bold text-white shadow`}
                >
                  {compiledCharacter.avatarInitial}
                </div>
              )}
              <div>
                <div className="text-base font-bold text-white">
                  {compiledCharacter.name}{' '}
                  <span className="text-xs text-slate-300 font-normal">
                    ({compiledCharacter.title} • {compiledCharacter.affiliation})
                  </span>
                </div>
                <div className="text-[11px] font-mono text-purple-400 mt-0.5">
                  {compiledCharacter.code} • {compiledCharacter.archetype} ({compiledCharacter.archetypeDetail})
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-xs flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold">
                👑 자존심 {compiledCharacter.stats?.domRate ?? 95}%
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40 font-bold">
                🖤 타락도 {compiledCharacter.stats?.taintRate ?? 3}%
              </span>
            </div>
          </div>

          {/* 3대 극적 당위성 & 목적성 퀵 배너 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-1">
              <span className="text-purple-300 font-bold flex items-center gap-1 text-[11px]">
                <Target className="w-3.5 h-3.5 text-purple-400" /> 🎯 핵심 목적 (Core Agenda)
              </span>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {compiledCharacter.coreAgenda}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-1">
              <span className="text-rose-300 font-bold flex items-center gap-1 text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> 🚫 절대적 금기 (Taboo)
              </span>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {compiledCharacter.traits?.find((t) => t.category === 'taboo')?.description || '영혼의 절대적 금기'}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-1">
              <span className="text-indigo-300 font-bold flex items-center gap-1 text-[11px]">
                <Compass className="w-3.5 h-3.5 text-indigo-400" /> 🏛️ 공간 레이어
              </span>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {compiledCharacter.spatialLayer || 'Layer 3 (완전 밀실)'}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 gap-2">
            <button
              onClick={() => setPreviewTab('appearance')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                previewTab === 'appearance'
                  ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> 🎨 외모 & 비주얼 스펙
            </button>
            <button
              onClick={() => setPreviewTab('traits')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                previewTab === 'traits'
                  ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> 🧠 심리 욕구, 금기 & 7대 지표
            </button>
            <button
              onClick={() => setPreviewTab('prompt')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                previewTab === 'prompt'
                  ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" /> 📜 마스터 시스템 프롬프트
            </button>
          </div>

          {/* Tab 1: Appearance */}
          {previewTab === 'appearance' && (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-white/5">
                  <span className="text-purple-300 font-bold">두상 & 헤어:</span>
                  <div className="text-slate-200 mt-0.5">
                    {compiledCharacter.appearance?.hair?.color} {compiledCharacter.appearance?.hair?.style}{' '}
                    {compiledCharacter.appearance?.hair?.ornament && `(${compiledCharacter.appearance.hair.ornament})`}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-white/5">
                  <span className="text-purple-300 font-bold">시선 & 눈동자:</span>
                  <div className="text-slate-200 mt-0.5">
                    {compiledCharacter.appearance?.eyes?.color} • {compiledCharacter.appearance?.eyes?.gazeStyle} (
                    {compiledCharacter.appearance?.eyes?.expression})
                  </div>
                </div>
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-white/5">
                  <span className="text-purple-300 font-bold">신체 & 체형:</span>
                  <div className="text-slate-200 mt-0.5">
                    {compiledCharacter.appearance?.body?.height}, {compiledCharacter.appearance?.body?.build},{' '}
                    {compiledCharacter.appearance?.body?.skinTone}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-white/5">
                  <span className="text-purple-300 font-bold">체온 & 고유 향기:</span>
                  <div className="text-slate-200 mt-0.5">
                    {compiledCharacter.appearance?.sensory?.temperature} • {compiledCharacter.appearance?.sensory?.aroma}
                  </div>
                </div>
              </div>

              {/* Outfit & Tension Points */}
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-white/5 space-y-1">
                <span className="text-pink-300 font-bold">의복 & 장력 텐서:</span>
                <div className="text-slate-200">{compiledCharacter.appearance?.outfit?.baseClothing}</div>
                {compiledCharacter.appearance?.outfit?.tensionPoints && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {compiledCharacter.appearance.outfit.tensionPoints.map((tp, i) => (
                      <span key={i} className="px-2 py-0.5 bg-pink-950/60 text-pink-300 rounded text-[10px] border border-pink-500/30">
                        {tp}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Image Prompt */}
              {compiledCharacter.appearance?.aiImagePrompt && (
                <div className="p-2.5 bg-purple-950/30 border border-purple-500/30 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-purple-300 font-bold">AI 일러스트 생성용 영문 프롬프트:</span>
                    <button
                      type="button"
                      onClick={copyImagePrompt}
                      className="text-[10px] text-purple-400 hover:text-purple-200 font-mono flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPrompt ? '복사됨!' : '프롬프트 복사'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 select-all bg-black/40 p-2 rounded">
                    {compiledCharacter.appearance.aiImagePrompt}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Psychology, Traits & Tensors */}
          {previewTab === 'traits' && (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {/* 7-State Mini Grid */}
              <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[11px] pb-1 border-b border-white/10">
                <div className="p-1.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-500/30">
                  <div className="text-[9px] text-emerald-400/80">★ 친밀도</div>
                  <div className="font-bold">{compiledCharacter.stats?.trust}%</div>
                </div>
                <div className="p-1.5 rounded bg-rose-950/50 text-rose-300 border border-rose-500/30">
                  <div className="text-[9px] text-rose-400/80">♥ 애정도</div>
                  <div className="font-bold">{compiledCharacter.stats?.love}%</div>
                </div>
                <div className="p-1.5 rounded bg-purple-950/50 text-purple-300 border border-purple-500/30">
                  <div className="text-[9px] text-purple-400/80">⚡ 방어 해제</div>
                  <div className="font-bold">{compiledCharacter.stats?.neutralize}</div>
                </div>
                <div className="p-1.5 rounded bg-amber-950/50 text-amber-300 border border-amber-500/30">
                  <div className="text-[9px] text-amber-400/80">● 수치심</div>
                  <div className="font-bold">{compiledCharacter.stats?.guilt}%</div>
                </div>
                <div className="p-1.5 rounded bg-red-950/50 text-red-300 border border-red-500/30">
                  <div className="text-[9px] text-red-400/80">▲ 복종도</div>
                  <div className="font-bold">{compiledCharacter.stats?.submission}%</div>
                </div>
              </div>

              {/* Psychology 3-Drive Box */}
              {compiledCharacter.psychology && (
                <div className="p-2.5 bg-purple-950/20 border border-purple-500/30 rounded-lg space-y-1 text-[11px]">
                  <span className="text-purple-300 font-bold">🧠 현대 심리학 3대 욕구 & 신경계 회로:</span>
                  <div className="text-slate-300 space-y-0.5 pl-1">
                    <div>• <span className="text-amber-300">자율성 통제벽:</span> {compiledCharacter.psychology.autonomyDrive}</div>
                    <div>• <span className="text-rose-300">유능성 방어 기제:</span> {compiledCharacter.psychology.competenceDefense}</div>
                    <div>• <span className="text-pink-300">숨겨진 관계성 결핍:</span> {compiledCharacter.psychology.relatednessDeficit}</div>
                  </div>
                </div>
              )}

              {compiledCharacter.traits?.map((t) => (
                <div key={t.id} className="p-2.5 bg-slate-900/80 rounded-lg border border-white/5 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-300 font-bold">{t.categoryLabel || t.title}</span>
                    {t.category === 'taboo' && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-500/40 text-[9px] font-bold font-mono">
                        영혼의 역린
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-[11px]">{t.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Assembled Prompt */}
          {previewTab === 'prompt' && (
            <div className="max-h-[300px] overflow-y-auto pr-1 bg-black/50 p-3 rounded-lg border border-white/10 font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
              {compiledCharacter.masterSystemPrompt}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
            >
              &larr; 다른 궤적 선택
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleFinish(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs border border-white/10 cursor-pointer"
              >
                스튜디오에만 등록
              </button>
              <button
                type="button"
                onClick={() => handleFinish(true)}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>등록 & 즉시 플레이 룸 입장 &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
