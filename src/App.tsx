import React, { useState } from 'react';
import { useCharacterStore } from './store/useCharacterStore';
import { Character } from './types/character';
import { MainLobby } from './components/lobby/MainLobby';
import { CharacterStudio } from './components/studio/CharacterStudio';
import { PlayRoom } from './components/playroom/PlayRoom';

type AppView = 'lobby' | 'studio' | 'playroom';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('lobby');
  const { setSelectedCharacterId } = useCharacterStore();

  const handleEnterPlayRoom = (character: Character) => {
    setSelectedCharacterId(character.id);
    setCurrentView('playroom');
  };

  const handleNavigateLobby = () => {
    setCurrentView('lobby');
  };

  const handleNavigateStudio = () => {
    setCurrentView('studio');
  };

  return (
    <div className="min-h-screen bg-[#08090f] text-slate-200">
      {currentView === 'lobby' && (
        <MainLobby
          onNavigateStudio={handleNavigateStudio}
          onEnterPlayRoom={handleEnterPlayRoom}
        />
      )}

      {currentView === 'studio' && (
        <CharacterStudio
          onNavigateLobby={handleNavigateLobby}
          onEnterPlayRoom={handleEnterPlayRoom}
        />
      )}

      {currentView === 'playroom' && (
        <PlayRoom
          onNavigateLobby={handleNavigateLobby}
          onNavigateStudio={handleNavigateStudio}
        />
      )}
    </div>
  );
};

export default App;
