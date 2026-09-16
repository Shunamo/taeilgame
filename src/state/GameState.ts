/**
 * GameState.ts
 * Single source of truth for all persistent game data.
 * Uses Zustand with localStorage persist middleware.
 * Both Phaser scenes and React components read/write through this store.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ResidentCard {
  name: string;
  status: string;
  region: string;
  validUntil: string;
  issuedAt: number;
}

export interface InventoryItem {
  id: string;
  name: string;           // Korean
  description: string;    // Korean (multiline OK)
  icon: string;           // Phaser texture key
  type: 'memory' | 'key_item' | 'consumable';
  quantity: number;
}

export type QuestStatus = 'inactive' | 'active' | 'complete';

// ─── Store Interface ──────────────────────────────────────────────────────────

export interface IGameState {
  // Persistent fields (saved to localStorage)
  playerName: string;
  lotteryNumber: number | null;
  coins: number;
  inventory: InventoryItem[];
  memoryItems: string[];
  questProgress: Record<string, QuestStatus>;
  dialogueProgress: Record<string, number>;
  currentScene: string;
  residentCard: ResidentCard | null;
  saveVersion: number;
  startedAt: number;

  // ─── Actions ───────────────────────────────────────────────────────────────

  setLotteryNumber: (n: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;

  addToInventory: (item: Omit<InventoryItem, 'quantity'>) => void;
  hasItem: (id: string) => boolean;

  addMemoryItem: (id: string) => void;
  hasMemoryItem: (id: string) => boolean;

  setQuest: (id: string, status: QuestStatus) => void;
  isQuestComplete: (id: string) => boolean;

  setDialogueProgress: (sequenceId: string, lineIndex: number) => void;
  getDialogueProgress: (sequenceId: string) => number;

  setCurrentScene: (scene: string) => void;
  setResidentCard: (card: ResidentCard) => void;

  resetGame: () => void;
}

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_STATE = {
  playerName: '노태일',
  lotteryNumber: null as number | null,
  coins: 0,
  inventory: [] as InventoryItem[],
  memoryItems: [] as string[],
  questProgress: {} as Record<string, QuestStatus>,
  dialogueProgress: {} as Record<string, number>,
  currentScene: 'bedroom',
  residentCard: null as ResidentCard | null,
  saveVersion: 1,
  startedAt: Date.now(),
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<IGameState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setLotteryNumber: (n) => set({ lotteryNumber: n }),

      addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),

      spendCoins: (amount) => {
        if (get().coins < amount) return false;
        set((s) => ({ coins: s.coins - amount }));
        return true;
      },

      addToInventory: (item) => {
        const existing = get().inventory.find((i) => i.id === item.id);
        if (existing) {
          set((s) => ({
            inventory: s.inventory.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          }));
        } else {
          set((s) => ({ inventory: [...s.inventory, { ...item, quantity: 1 }] }));
        }
      },

      hasItem: (id) => get().inventory.some((i) => i.id === id),

      addMemoryItem: (id) => {
        if (!get().memoryItems.includes(id)) {
          set((s) => ({ memoryItems: [...s.memoryItems, id] }));
        }
      },

      hasMemoryItem: (id) => get().memoryItems.includes(id),

      setQuest: (id, status) =>
        set((s) => ({ questProgress: { ...s.questProgress, [id]: status } })),

      isQuestComplete: (id) => get().questProgress[id] === 'complete',

      setDialogueProgress: (sequenceId, lineIndex) =>
        set((s) => ({
          dialogueProgress: { ...s.dialogueProgress, [sequenceId]: lineIndex },
        })),

      getDialogueProgress: (sequenceId) => get().dialogueProgress[sequenceId] ?? 0,

      setCurrentScene: (scene) => set({ currentScene: scene }),

      setResidentCard: (card) => set({ residentCard: card }),

      resetGame: () =>
        set({ ...DEFAULT_STATE, startedAt: Date.now() }),
    }),
    {
      name: 'hbdti2-save',
      storage: createJSONStorage(() => localStorage),
      // Only persist the data fields, not the action functions
      partialize: (state) => ({
        playerName: state.playerName,
        lotteryNumber: state.lotteryNumber,
        coins: state.coins,
        inventory: state.inventory,
        memoryItems: state.memoryItems,
        questProgress: state.questProgress,
        dialogueProgress: state.dialogueProgress,
        currentScene: state.currentScene,
        residentCard: state.residentCard,
        saveVersion: state.saveVersion,
        startedAt: state.startedAt,
      }),
    }
  )
);

// ─── Convenience getter (for use inside Phaser scenes, outside React) ─────────

export const getGameState = () => useGameStore.getState();
