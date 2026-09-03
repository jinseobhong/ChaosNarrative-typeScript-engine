import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Character } from '../../types/character';
import { useCharacterStore } from '../../store/useCharacterStore';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  Wand2,
  Sliders,
  Eye,
  Shirt,
  Moon,
  Flame,
  Shield,
  Palette,
  AlertCircle,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

interface IllustriousPromptStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
}

const MOOD_PRESETS = [
  { id: 'cynical', label: '😏 냉소 & 오만', value: 'smug, slight smirk, cynical expression, sharp eyes' },
  { id: 'seductive', label: '💋 치명적 유혹', value: 'seductive smile, bedroom eyes, half-closed eyes, parted lips' },
  { id: 'blush', label: '😳 부끄러움 & 홍조', value: 'blush, embarrassed, looking away, flustered, trembling lips' },
  { id: 'cold', label: '❄️ 차가운 철벽', value: 'cold expression, sharp eyes, expressionless, aloof, dignified' },
  { id: 'tears', label: '💧 굴복 직전 눈물', value: 'teared up, moist eyes, biting lip, pleading expression' },
];

const OUTFIT_PRESETS = [
  { id: 'bikini', label: '👙 시크 비키니', value: 'chic black bikini, wet skin, collarbone' },
  { id: 'gothic', label: '🖤 고딕 코르셋', value: 'gothic corset dress, black choker, lace trim, cleavage' },
  { id: 'bodysuit', label: '⚡ 에나멜 바디슈트', value: 'tight latex bodysuit, shiny enamel, high leg cut, collarbone' },
  { id: 'armor', label: '🛡️ 성기사 은빛 갑주', value: 'silver plate armor, metal gorget, pauldrons, glowing runes' },
  { id: 'uniform', label: '👑 제국 황실 정복', value: 'imperial military uniform, gold epaulets, aiguillette, white gloves' },
  { id: 'lingerie', label: '✨ 시스루 란제리', value: 'sheer lace lingerie, see-through nightgown, exposed shoulders' },
  { id: 'suit', label: '👔 밀착 정장', value: 'tailored office suit, unbuttoned collar, tight pencil skirt' },
];

const LOCATION_PRESETS = [
  { id: 'poolside', label: '🏊‍♀️ 달빛 풀사이드', value: 'luxury poolside, nighttime, moonlight reflection on water ripples, wet floor' },
  { id: 'bedroom', label: '🕯️ 촛불 앤틱 침실', value: 'candlelit antique bedroom, dim moody lighting, silk bed sheets, velvet curtains' },
  { id: 'throne', label: '🏛️ 호화 옥좌', value: 'gothic throne room, stained glass window, grand marble pillars, dramatic shadows' },
  { id: 'library', label: '📚 비전 마법 서재', value: 'arcane library, floating ancient tomes, glowing magic circles, mystical aura' },
  { id: 'dungeon', label: '⛓️ 지하 납골당', value: 'damp stone dungeon, rusted chains, mossy stone walls, torchlight' },
];

export const IllustriousPromptStudioModal: React.FC<IllustriousPromptStudioModalProps> = ({
  isOpen,
  onClose,
  character,
}) => {
  const updateCharacter = useCharacterStore((state) => state.updateCharacter);

  const [selectedMood, setSelectedMood] = useState(MOOD_PRESETS[0].value);
  const [selectedOutfit, setSelectedOutfit] = useState(OUTFIT_PRESETS[0].value);
  const [selectedLocation, setSelectedLocation] = useState(LOCATION_PRESETS[0].value);
  const [rating, setRating] = useState<'safe' | 'suggestive' | 'ecchi' | 'explicit'>('ecchi');
  const [aspectRatio, setAspectRatio] = useState('1344 x 1728');

  // Prompts
  const [positivePrompt, setPositivePrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(
    'worst quality, low quality, bad anatomy, bad hands, missing fingers, extra digit, blurry, cropped, watermark, username, text, signature'
  );

  // States
  const [isCompilingPrompt, setIsCompilingPrompt] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isExtractingImage, setIsExtractingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const referenceFileInputRef = React.useRef<HTMLInputElement>(null);

  // Initial prompt setup on modal open
  useEffect(() => {
    if (isOpen && character) {
      if (character.appearance?.aiImagePrompt) {
        setPositivePrompt(character.appearance.aiImagePrompt);
      } else {
        handleAutoCompilePrompt();
      }
    }
  }, [isOpen, character?.id]);

  // DeepDanbooru Reference Image Extraction Handler
  const handleReferenceImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('이미지 파일(PNG, JPG, WebP)만 업로드할 수 있습니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      if (!base64) return;
      setIsExtractingImage(true);
      setErrorMessage(null);
      try {
        const res = await fetch('/api/analyze-character-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.danbooruTags) {
            setPositivePrompt(json.data.danbooruTags);
            if (json.data.negativePrompt) setNegativePrompt(json.data.negativePrompt);
            if (json.rating) {
              setRating(json.rating === 'nsfw' ? 'explicit' : json.rating === 'ecchi' ? 'ecchi' : 'safe');
            }
          }
        }
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || 'DeepDanbooru 태그 역추출 실패');
      } finally {
        setIsExtractingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // AI Prompt Compiler Call
  const handleAutoCompilePrompt = async () => {
    if (!character) return;
    setIsCompilingPrompt(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/compile-illustrious-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character,
          mood: selectedMood,
          clothingStyle: selectedOutfit,
          locationOverride: selectedLocation,
          rating,
        }),
      });

      if (!res.ok) {
        throw new Error('프롬프트 컴파일 요청 실패');
      }

      const json = await res.json();
      if (json.success && json.data) {
        setPositivePrompt(json.data.positivePrompt || '');
        if (json.data.negativePrompt) {
          setNegativePrompt(json.data.negativePrompt);
        }
      }
    } catch (err: any) {
      console.error(err);
      // Fallback dynamic Danbooru synthesis if network fails
      const hairTags = [
        character.appearance?.hair?.color,
        character.appearance?.hair?.style,
      ].filter(Boolean).join(', ') || 'hair';
      const eyeTags = [
        character.appearance?.eyes?.color,
        character.appearance?.eyes?.expression,
      ].filter(Boolean).join(', ') || 'eyes';
      const fallbackPos = `masterpiece, best quality, amazing quality, newest, very aesthetic, 1girl, solo, ${hairTags}, ${eyeTags}, ${selectedMood}, ${selectedOutfit}, ${selectedLocation}, cinematic lighting, highres`;
      setPositivePrompt(fallbackPos);
    } finally {
      setIsCompilingPrompt(false);
    }
  };

  // Generate with Illustrious XL
  const handleGenerateImage = async () => {
    if (!positivePrompt.trim()) return;
    setIsGeneratingImage(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-illustrious-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: positivePrompt,
          negativePrompt: negativePrompt,
          aspectRatio,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `이미지 생성 실패 (${res.status})`);
      }

      const json = await res.json();
      if (json.success && json.imageUrl) {
        setGeneratedImage(json.imageUrl);
      } else {
        throw new Error('생성된 이미지 URL을 받지 못했습니다.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Illustrious XL 렌더링 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Set as character avatar & save exact used Danbooru prompt
  const handleSaveToProfile = () => {
    if (!generatedImage || !character) return;
    updateCharacter(character.id, {
      avatarUrl: generatedImage,
      appearance: {
        ...(character.appearance || {}),
        aiImagePrompt: positivePrompt,
      },
    });
    onClose();
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(positivePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-purple-300">
          <Palette className="w-5 h-5 text-purple-400" />
          <span>Illustrious XL v17 • 전용 단부루(Danbooru) 프롬프트 스튜디오</span>
        </div>
      }
      subtitle={`[${character.name}]의 헤어, 눈동자, 고유 체형을 보존하며 최적의 단부루 태그를 컴파일하고 실시간 일러스트를 생성합니다.`}
      maxWidth="3xl"
    >
      <div className="space-y-4 text-xs">
        {/* ================= 1. Character Identity Pill Bar ================= */}
        <div className="p-3 bg-[#111428] border border-purple-500/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            {character.avatarUrl ? (
              <img
                src={character.avatarUrl}
                alt={character.name}
                className="w-10 h-10 rounded-lg object-cover border border-purple-400 shadow shrink-0"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-lg ${character.avatarColor} flex items-center justify-center font-serif text-lg font-bold text-white shadow shrink-0`}
              >
                {character.avatarInitial || character.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="text-sm font-bold text-white">
                {character.name}{' '}
                <span className="text-slate-400 font-normal">
                  ({character.title} • {character.affiliation})
                </span>
              </div>
              <div className="text-[11px] font-mono text-purple-400">
                {character.appearance?.hair?.color || '은발'} • {character.appearance?.eyes?.color || '푸른 눈'} • {character.archetype}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={referenceFileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleReferenceImageFile(file);
                e.target.value = '';
              }}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              disabled={isExtractingImage || isCompilingPrompt}
              onClick={() => referenceFileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              title="참조 이미지에서 DeepDanbooru 태그를 100% 역추출합니다."
            >
              {isExtractingImage ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>DeepDanbooru 추출 중...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-pink-200" />
                  <span>🖼️ 참조 이미지 태그 역추출</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isCompilingPrompt}
              onClick={handleAutoCompilePrompt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isCompilingPrompt ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Danbooru 컴파일 중...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-yellow-300" />
                  <span>AI 프롬프트 자동 재컴파일</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ================= 2. Interactive Danbooru Category Selectors ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Mood / Expression Selector */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span>1. 표정 & 무드 (Emotion)</span>
            </div>
            <div className="flex flex-col gap-1">
              {MOOD_PRESETS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMood(m.value)}
                  className={`px-2.5 py-1 rounded-lg text-left text-[11px] transition-all flex items-center justify-between cursor-pointer ${
                    selectedMood === m.value
                      ? 'bg-purple-600 text-white font-bold shadow-sm'
                      : 'bg-black/40 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{m.label}</span>
                  {selectedMood === m.value && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Outfit Selector */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-1.5 text-pink-300 font-bold text-[11px]">
              <Shirt className="w-3.5 h-3.5 text-pink-400" />
              <span>2. 의상 & 텐션 (Outfit)</span>
            </div>
            <div className="flex flex-col gap-1">
              {OUTFIT_PRESETS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedOutfit(o.value)}
                  className={`px-2.5 py-1 rounded-lg text-left text-[11px] transition-all flex items-center justify-between cursor-pointer ${
                    selectedOutfit === o.value
                      ? 'bg-pink-600 text-white font-bold shadow-sm'
                      : 'bg-black/40 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{o.label}</span>
                  {selectedOutfit === o.value && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Location & Atmosphere */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>3. 배경 & 조명 (Location)</span>
            </div>
            <div className="flex flex-col gap-1">
              {LOCATION_PRESETS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedLocation(l.value)}
                  className={`px-2.5 py-1 rounded-lg text-left text-[11px] transition-all flex items-center justify-between cursor-pointer ${
                    selectedLocation === l.value
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'bg-black/40 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{l.label}</span>
                  {selectedLocation === l.value && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= 3. Rating & Aspect Ratio Options ================= */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
          {/* Rating */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium text-[11px]">수위 (Rating):</span>
            <div className="flex items-center gap-1">
              {(['safe', 'suggestive', 'ecchi', 'explicit'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRating(r)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono capitalize transition-all cursor-pointer ${
                    rating === r
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-black/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium text-[11px]">비율:</span>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="bg-black/60 border border-white/10 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-purple-500 font-mono"
            >
              <option value="1344 x 1728">세로형 (1344 x 1728 - 추천)</option>
              <option value="1248 x 1824">슬림 세로 (1248 x 1824)</option>
              <option value="1536 x 1536">정사각형 (1536 x 1536)</option>
              <option value="1824 x 1248">가로형 (1824 x 1248)</option>
            </select>
          </div>
        </div>

        {/* ================= 4. Danbooru Prompt Editor ================= */}
        <div className="space-y-2">
          {/* Positive Prompt */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-purple-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Illustrious XL 단부루(Danbooru) 프롬프트:</span>
              </span>
              <button
                type="button"
                onClick={copyPrompt}
                className="text-[10px] text-purple-400 hover:text-purple-200 font-mono flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? '복사됨!' : '프롬프트 복사'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={positivePrompt}
              onChange={(e) => setPositivePrompt(e.target.value)}
              placeholder="masterpiece, best quality, amazing quality, 1girl, solo, silver hair..."
              className="w-full bg-black/70 border border-purple-500/40 rounded-lg p-2.5 text-slate-200 text-xs font-mono focus:border-purple-400 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Negative Prompt */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium text-[11px]">네거티브 프롬프트 (색상 오염 및 왜곡 방지):</span>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-400 text-xs font-mono focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* ================= 5. Live Preview & Generate Button ================= */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {generatedImage && (
              <img
                src={generatedImage}
                alt="Live Preview"
                className="w-16 h-20 rounded-lg object-cover border-2 border-emerald-400 shadow-neon-purple shadow shrink-0"
              />
            )}
            {generatedImage && (
              <div className="space-y-0.5">
                <div className="text-emerald-300 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>렌더링 완료!</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  우측의 [프로필에 확정 적용] 버튼을 눌러 저장하세요.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={isGeneratingImage || !positivePrompt.trim()}
              onClick={handleGenerateImage}
              className="px-5 py-2.5 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingImage ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Illustrious XL 렌더링 중 (약 10초)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>Illustrious XL 실시간 일러스트 생성 &rarr;</span>
                </>
              )}
            </button>

            {generatedImage && (
              <button
                type="button"
                onClick={handleSaveToProfile}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>프로필에 확정 적용</span>
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
