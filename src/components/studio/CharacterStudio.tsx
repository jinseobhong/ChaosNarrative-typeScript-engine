import React, { useState, useRef } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { Character, ArchetypeTag } from '../../types/character';
import { CharacterCard } from './CharacterCard';
import { CharacterDetail } from './CharacterDetail';
import { CharacterModal } from './CharacterModal';
import { DynamicCreatorModal } from './DynamicCreatorModal';
import { DictionaryModal } from './DictionaryModal';
import { ModelSelector } from '../common/ModelSelector';
import {
  ArrowLeft,
  Search,
  Edit3,
  Upload,
  Trash2,
  BookOpen,
  Sparkles,
  Bot,
} from 'lucide-react';

interface CharacterStudioProps {
  onNavigateLobby: () => void;
  onEnterPlayRoom: (character: Character) => void;
}

export const CharacterStudio: React.FC<CharacterStudioProps> = ({
  onNavigateLobby,
  onEnterPlayRoom,
}) => {
  const {
    characters,
    selectedCharacterId,
    searchQuery,
    selectedArchetype,
    setSelectedCharacterId,
    setSearchQuery,
    setSelectedArchetype,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    duplicateCharacter,
    updateTrait,
    importCharactersJSON,
    exportCharacterJSON,
    getSelectedCharacter,
  } = useCharacterStore();

  const [isDynamicCreatorOpen, setIsDynamicCreatorOpen] = useState(false);
  const [isManualEditModalOpen, setIsManualEditModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedChar = getSelectedCharacter();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filtered characters list
  const filteredCharacters = characters.filter((char) => {
    const matchesArchetype =
      selectedArchetype === 'All' || char.archetype === selectedArchetype;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesArchetype;

    const matchesSearch =
      char.name.toLowerCase().includes(query) ||
      char.title.toLowerCase().includes(query) ||
      char.affiliation.toLowerCase().includes(query) ||
      char.code.toLowerCase().includes(query) ||
      char.egoSummary.toLowerCase().includes(query) ||
      char.weaknessSummary.toLowerCase().includes(query) ||
      char.traits.some((t) => t.description.toLowerCase().includes(query));

    return matchesArchetype && matchesSearch;
  });

  const handleEdit = (char: Character) => {
    setEditingCharacter(char);
    setIsManualEditModalOpen(true);
  };

  const handleSaveManualModal = (charData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingCharacter) {
      updateCharacter(editingCharacter.id, charData);
      showToast(`'${charData.name}' 캐릭터가 수정되었습니다.`);
    }
    setEditingCharacter(null);
  };

  // Dynamic Character Created Callback
  const handleDynamicCharacterCreated = (newChar: Character, enterPlayRoom?: boolean) => {
    addCharacter(newChar);
    showToast(`✨ '${newChar.name}' 캐릭터가 AI에 의해 동적 컴파일되어 등록되었습니다!`);
    if (enterPlayRoom) {
      onEnterPlayRoom(newChar);
    }
  };

  const handleDelete = (id: string) => {
    const char = characters.find((c) => c.id === id);
    if (window.confirm(`정말로 '${char?.name || '선택한 캐릭터'}'를 삭제하시겠습니까?`)) {
      deleteCharacter(id);
      showToast('캐릭터가 삭제되었습니다.');
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateCharacter(id);
    showToast('캐릭터가 성공적으로 복제되었습니다.');
  };

  const handleExportJSON = (char: Character) => {
    const jsonStr = exportCharacterJSON(char.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abyss-character-${char.code}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`'${char.name}' JSON 파일이 다운로드되었습니다.`);
  };

  const handleImportJSONClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importCharactersJSON(content);
        if (success) {
          showToast('캐릭터 JSON 데이터를 성공적으로 불러왔습니다!');
        } else {
          showToast('올바르지 않은 캐릭터 JSON 형식입니다.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleGenerateIllustration = (char: Character) => {
    if (char.appearance?.aiImagePrompt) {
      navigator.clipboard.writeText(char.appearance.aiImagePrompt);
      showToast(`'${char.name}'의 AI 일러스트 영문 프롬프트가 클립보드에 복사되었습니다!`);
    } else {
      showToast(`[AI 연동] '${char.name}'의 기본 스탠딩 묘사 프롬프트가 활성화되었습니다.`);
    }
  };

  const archetypesList: ArchetypeTag[] = ['All', 'Rigid', 'Endurer', 'Controller', 'Deprived'];

  return (
    <div className="min-h-screen bg-[#08090f] text-slate-200 flex flex-col justify-between">
      {/* Hidden File Input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 bg-purple-950 border border-purple-500/60 rounded-xl text-xs font-semibold text-purple-200 shadow-2xl animate-bounce">
          ✨ {toastMessage}
        </div>
      )}

      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#0c0e1a]/95 backdrop-blur-md border-b border-white/10 px-6 py-3.5">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Left: Lobby button & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateLobby}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 text-xs font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Lobby</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h1 className="text-sm font-bold text-white tracking-wide">
                  캐릭터 스튜디오
                </h1>
              </div>
              <p className="text-[11px] text-slate-400">
                AI 동적 생성 • 특성 및 금기 설계 • 수정 및 관리
              </p>
            </div>
          </div>

          {/* Right: Action Buttons Row */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* 1. 생성 (Dynamic AI Creator Modal) */}
            <button
              onClick={() => setIsDynamicCreatorOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-md shadow-purple-600/30 transition-all transform hover:-translate-y-0.5"
            >
              <Bot className="w-3.5 h-3.5 text-purple-200" />
              <span>+ 1. AI 동적 생성</span>
            </button>

            {/* 2. 조회 */}
            <button
              onClick={() => {
                if (selectedChar) showToast(`'${selectedChar.name}' 캐릭터를 상세 조회 중입니다.`);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-white/5 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>2. 조회</span>
            </button>

            {/* 3. 수정 */}
            <button
              onClick={() => {
                if (selectedChar) handleEdit(selectedChar);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-white/5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>3. 수정</span>
            </button>

            {/* 4. 불러오기 */}
            <button
              onClick={handleImportJSONClick}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-white/5 font-mono transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>4. 불러오기</span>
            </button>

            {/* 5. 삭제 */}
            <button
              onClick={() => {
                if (selectedChar) handleDelete(selectedChar.id);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg border border-rose-500/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>5. 삭제</span>
            </button>

            {/* 6. 거대 사전 */}
            <button
              onClick={() => setIsDictionaryOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 rounded-lg border border-purple-500/30 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>6. 거대 사전</span>
            </button>

            {/* Dynamic Model Cascade Selector */}
            <ModelSelector />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1700px] mx-auto w-full px-6 py-6 flex-1 flex flex-col gap-6">
        {/* Search & Archetype Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0e1122] p-3 rounded-xl border border-white/10">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 종족, 아키타입, 결핍/욕망 검색..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-900/80 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Archetype Filter Tabs */}
          <div className="flex items-center gap-1.5">
            {archetypesList.map((tag) => {
              const isSelected = selectedArchetype === tag;
              const label = tag === 'All' ? '전체' : tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedArchetype(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Character Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCharacters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              isSelected={char.id === selectedCharacterId}
              onSelect={setSelectedCharacterId}
              onEdit={handleEdit}
              onPlay={onEnterPlayRoom}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onExportJSON={handleExportJSON}
              onGenerateIllustration={handleGenerateIllustration}
            />
          ))}

          {/* Empty State / Add New Card */}
          <div
            onClick={() => setIsDynamicCreatorOpen(true)}
            className="rounded-xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-950/20 transition-all p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[260px] group shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-purple-950/80 border border-purple-500/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-purple-600/30">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-sm font-bold text-slate-200 mb-1">AI 캐릭터 동적 생성</div>
            <p className="text-xs text-slate-400 max-w-[200px]">
              Gemini & Claude AI가 GENE SEED, 5대 궤적, 외모 스펙 및 3만자 헌법을 실시간 생성합니다.
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Fixed/Sticky Detail Drawer */}
      {selectedChar && (
        <div className="max-w-[1700px] mx-auto w-full px-6 sticky bottom-0 z-20">
          <CharacterDetail
            character={selectedChar}
            onPlay={onEnterPlayRoom}
            onEdit={handleEdit}
            onExportJSON={handleExportJSON}
            onDelete={handleDelete}
            onUpdateTrait={updateTrait}
          />
        </div>
      )}

      {/* Dynamic AI Character Creator Modal (Dify 2-Step V1~V5 Wizard) */}
      <DynamicCreatorModal
        isOpen={isDynamicCreatorOpen}
        onClose={() => setIsDynamicCreatorOpen(false)}
        onCharacterCreated={handleDynamicCharacterCreated}
      />

      {/* Manual Edit Modal */}
      <CharacterModal
        isOpen={isManualEditModalOpen}
        onClose={() => {
          setIsManualEditModalOpen(false);
          setEditingCharacter(null);
        }}
        onSave={handleSaveManualModal}
        initialData={editingCharacter}
      />

      {/* Dictionary Modal */}
      <DictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
      />
    </div>
  );
};
