import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Character, ArchetypeTag, CharacterTrait } from '../types/character';
import { DEFAULT_CHARACTERS } from '../data/defaultCharacters';

interface CharacterState {
  characters: Character[];
  selectedCharacterId: string;
  searchQuery: string;
  selectedArchetype: ArchetypeTag;
  
  // Actions
  setSelectedCharacterId: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedArchetype: (archetype: ArchetypeTag) => void;
  
  // CRUD
  addCharacter: (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  duplicateCharacter: (id: string) => string;
  updateTrait: (characterId: string, traitId: string, updates: Partial<CharacterTrait>) => void;
  
  // Import / Export / Reset
  importCharactersJSON: (jsonString: string) => boolean;
  exportCharacterJSON: (id: string) => string;
  exportAllCharactersJSON: () => string;
  resetToDefaults: () => void;
  
  // Getter
  getSelectedCharacter: () => Character | undefined;
}

export const useCharacterStore = create<CharacterState>()(
  persist<CharacterState>(
    (set, get) => ({
      characters: DEFAULT_CHARACTERS,
      selectedCharacterId: DEFAULT_CHARACTERS[0].id,
      searchQuery: '',
      selectedArchetype: 'All',

      setSelectedCharacterId: (id) => set({ selectedCharacterId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedArchetype: (archetype) => set({ selectedArchetype: archetype }),

      addCharacter: (charData) => {
        const id = `char-${Date.now()}`;
        const newChar: Character = {
          ...charData,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          characters: [newChar, ...state.characters],
          selectedCharacterId: id,
        }));
        return id;
      },

      updateCharacter: (id, updates) => {
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      deleteCharacter: (id) => {
        set((state) => {
          const remaining = state.characters.filter((c) => c.id !== id);
          const nextSelected = remaining.length > 0 ? remaining[0].id : '';
          return {
            characters: remaining,
            selectedCharacterId: state.selectedCharacterId === id ? nextSelected : state.selectedCharacterId,
          };
        });
      },

      duplicateCharacter: (id) => {
        const target = get().characters.find((c) => c.id === id);
        if (!target) return '';
        const newId = `char-${Date.now()}`;
        const cloned: Character = {
          ...JSON.parse(JSON.stringify(target)),
          id: newId,
          name: `${target.name} (사본)`,
          code: target.code.replace(/-\w+$/, `-${Math.random().toString(36).substring(2, 6).toUpperCase()}`),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          characters: [cloned, ...state.characters],
          selectedCharacterId: newId,
        }));
        return newId;
      },

      updateTrait: (characterId, traitId, updates) => {
        set((state) => ({
          characters: state.characters.map((c) => {
            if (c.id !== characterId) return c;
            return {
              ...c,
              traits: c.traits.map((t) => (t.id === traitId ? { ...t, ...updates } : t)),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      importCharactersJSON: (jsonString) => {
        try {
          const parsed = JSON.parse(jsonString);
          const listToImport: Character[] = Array.isArray(parsed) ? parsed : [parsed];
          if (listToImport.length === 0 || !listToImport[0].name) return false;
          
          set((state) => {
            const existingIds = new Set(state.characters.map((c) => c.id));
            const processed = listToImport.map((c) => ({
              ...c,
              id: existingIds.has(c.id) ? `char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` : c.id,
            }));
            return {
              characters: [...processed, ...state.characters],
              selectedCharacterId: processed[0].id,
            };
          });
          return true;
        } catch {
          return false;
        }
      },

      exportCharacterJSON: (id) => {
        const char = get().characters.find((c) => c.id === id);
        return char ? JSON.stringify(char, null, 2) : '';
      },

      exportAllCharactersJSON: () => {
        return JSON.stringify(get().characters, null, 2);
      },

      resetToDefaults: () => {
        set({
          characters: DEFAULT_CHARACTERS,
          selectedCharacterId: DEFAULT_CHARACTERS[0].id,
        });
      },

      getSelectedCharacter: () => {
        const { characters, selectedCharacterId } = get();
        return characters.find((c) => c.id === selectedCharacterId) || characters[0];
      },
    }),
    {
      name: 'abyss-character-vault-v1',
      merge: (persistedState: any, currentState: any) => {
        const persistedChars = persistedState?.characters || [];
        const mergedChars = [...persistedChars];
        for (const defChar of DEFAULT_CHARACTERS) {
          const idx = mergedChars.findIndex((c: any) => c.id === defChar.id);
          if (idx === -1) {
            mergedChars.unshift(defChar);
          } else if (!mergedChars[idx].avatarUrl && defChar.avatarUrl) {
            mergedChars[idx] = { ...mergedChars[idx], avatarUrl: defChar.avatarUrl };
          }
        }
        return {
          ...currentState,
          ...persistedState,
          characters: mergedChars,
          selectedCharacterId: persistedState?.selectedCharacterId || DEFAULT_CHARACTERS[0].id,
        };
      },
    }
  )
);
