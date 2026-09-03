import React, { useEffect, useRef, useState } from 'react';
import { Character, QuickOption } from '../../types/character';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useChatStore } from '../../store/useChatStore';
import { PlayRoomHeader } from './PlayRoomHeader';
import { MessageBubble } from './MessageBubble';
import { QuickActions } from './QuickActions';
import { InputBar } from './InputBar';
import { Modal } from '../common/Modal';
import { ClassifiedDossierModal } from './ClassifiedDossierModal';
import { Users, Check, Sparkles, RefreshCw } from 'lucide-react';

interface PlayRoomProps {
  onNavigateLobby: () => void;
  onNavigateStudio: () => void;
}

export const PlayRoom: React.FC<PlayRoomProps> = ({
  onNavigateLobby,
  onNavigateStudio,
}) => {
  const { characters, selectedCharacterId, setSelectedCharacterId, getSelectedCharacter } =
    useCharacterStore();
  const {
    sessions,
    activeCharacterId,
    isStreaming,
    streamingMessageText,
    initOrLoadSession,
    sendQuickAction,
    sendCustomMessage,
    undoLastTurn,
    regenerateLastResponse,
    resetCurrentSession,
    getActiveSession,
  } = useChatStore();

  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const character = getSelectedCharacter() || characters[0];
  const activeSession = getActiveSession();

  // Initialize session on mount or character change
  useEffect(() => {
    if (character) {
      initOrLoadSession(character);
    }
  }, [character?.id]);

  // Scroll to bottom on new messages or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages?.length, streamingMessageText]);

  if (!character || !activeSession) {
    return (
      <div className="min-h-screen bg-[#08090f] flex items-center justify-center text-slate-400 font-mono">
        <RefreshCw className="w-5 h-5 animate-spin text-purple-400 mr-2" />
        플레이 룸 데이터를 불러오는 중입니다...
      </div>
    );
  }

  const handleSelectOption = (option: QuickOption) => {
    if (isStreaming) return;
    sendQuickAction(option, character);
  };

  const handleSendMessage = (text: string) => {
    if (isStreaming) return;
    sendCustomMessage(text, character);
  };

  const handleUndo = () => {
    if (isStreaming) return;
    undoLastTurn();
  };

  const handleRegenerate = () => {
    if (isStreaming) return;
    regenerateLastResponse(character);
  };

  const handleReset = () => {
    if (isStreaming) return;
    if (window.confirm(`'${character.name}'와의 대화 세션을 턴 1로 초기화하시겠습니까?`)) {
      resetCurrentSession(character);
    }
  };

  const handleSwitchCharacter = (char: Character) => {
    setSelectedCharacterId(char.id);
    initOrLoadSession(char);
    setIsSwitchModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#08090f] text-slate-200 flex flex-col justify-between">
      {/* Top Header */}
      <PlayRoomHeader
        character={character}
        stats={activeSession.stats}
        currentStage={activeSession.currentStage}
        currentLocation={activeSession.currentLocation}
        onNavigateLobby={onNavigateLobby}
        onNavigateStudio={onNavigateStudio}
        onOpenDossier={() => setIsDossierOpen(true)}
        onUndo={handleUndo}
        onRegenerate={handleRegenerate}
        onReset={handleReset}
        canUndo={activeSession.history.length > 0 && !isStreaming}
      />

      {/* 🔍 1급 기밀 심리·신경 분석 리포트 (답지 모달) */}
      <ClassifiedDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        character={character}
        currentStats={activeSession.stats}
      />

      {/* Main Conversation Stream */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-[1700px] mx-auto w-full flex flex-col">
        <div className="flex-1 space-y-4">
          {activeSession.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} character={character} />
          ))}

          {/* Streaming Live Message Preview */}
          {isStreaming && (
            <MessageBubble
              message={{
                id: 'streaming-preview',
                sender: 'character',
                characterName: character.name,
                stageBadge: activeSession.currentStage,
                turnNumber: activeSession.currentTurn,
                narrations: streamingMessageText ? [streamingMessageText] : [],
                timestamp: new Date().toISOString(),
              }}
              character={character}
              isStreaming={true}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Real-time Quick Action Choice Buttons (Disabled while streaming) */}
        <QuickActions
          options={activeSession.currentOptions}
          onSelectOption={handleSelectOption}
          disabled={isStreaming}
        />

        {/* Custom Input Bar (Send button locked while streaming) */}
        <InputBar onSendMessage={handleSendMessage} disabled={isStreaming} />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-3 px-6 text-[11px] text-slate-500 font-mono flex items-center justify-between max-w-[1700px] mx-auto w-full">
        <div>© 2026 Abyss Engine • Enterprise 25-Master Architecture</div>
        <div>Released under the MIT License</div>
      </footer>

      {/* Switch Character Modal */}
      <Modal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-purple-300">
            <Users className="w-5 h-5 text-purple-400" />
            <span>플레이 룸 캐릭터 교체</span>
          </div>
        }
        subtitle="대화할 대상을 선택하거나 새로운 캐릭터를 불러옵니다."
        maxWidth="xl"
      >
        <div className="space-y-3">
          {characters.map((char) => {
            const isCurrent = char.id === character.id;
            return (
              <div
                key={char.id}
                onClick={() => handleSwitchCharacter(char)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-md'
                    : 'bg-slate-900/60 border-white/10 hover:border-purple-500/40 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${char.avatarColor} flex items-center justify-center font-serif font-bold text-white shadow`}
                  >
                    {char.avatarInitial || char.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{char.name}</span>
                      <span className="text-xs text-slate-400 font-normal">
                        ({char.title} • {char.affiliation})
                      </span>
                    </div>
                    <div className="text-xs font-mono text-purple-400 mt-0.5">
                      {char.code} • {char.archetype} ({char.stage})
                    </div>
                  </div>
                </div>

                {isCurrent && (
                  <div className="flex items-center gap-1 text-xs text-purple-300 font-bold">
                    <Check className="w-4 h-4" />
                    <span>선택됨</span>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-3 border-t border-white/10 flex justify-between items-center">
            <button
              onClick={() => {
                setIsSwitchModalOpen(false);
                onNavigateStudio();
              }}
              className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-4 cursor-pointer"
            >
              캐릭터 스튜디오에서 새로 만들기 &rarr;
            </button>
            <button
              onClick={() => setIsSwitchModalOpen(false)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
