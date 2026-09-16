/**
 * EventBridge.ts
 * Singleton pub/sub bus that lets Phaser scenes and React components
 * communicate without direct coupling.
 *
 * Usage in Phaser:
 *   EventBridge.emit('show_dialogue', { sequenceId: 'meadow_crash' });
 *
 * Usage in React:
 *   useEffect(() => {
 *     const off = EventBridge.on('show_dialogue', (payload) => { ... });
 *     return off; // unsubscribe on unmount
 *   }, []);
 */

// ─── Event payload types ──────────────────────────────────────────────────────

export interface DialoguePayload {
  sequenceId: string;
  /** If provided, auto-start from this line index (for resume) */
  startLine?: number;
  /** Called when the entire sequence finishes */
  onComplete?: () => void;
}

export interface ChoicePayload {
  prompt: string;
  options: Array<{ id: string; label: string }>;
  onSelect: (choiceId: string) => void;
}

export interface ItemPickupPayload {
  itemId: string;
}

export interface SceneChangePayload {
  scene: string;
}

export interface LotteryResultPayload {
  winningNumber: number;
}

// ─── Interact prompt payload ──────────────────────────────────────────────────

export interface InteractPromptPayload {
  text: string;
  /** action id sent back when user taps the prompt */
  actionId: string;
}

// ─── Event map ────────────────────────────────────────────────────────────────

export interface CombatHpPayload {
  current: number;
  max: number;
}

export interface BossHpPayload {
  current: number;
  max: number;
  name: string;
}

export interface BridgeEventMap {
  // Game → React
  show_dialogue: DialoguePayload;
  hide_dialogue: void;
  show_choice: ChoicePayload;
  hide_choice: void;
  show_item_pickup: ItemPickupPayload;
  hide_item_pickup: void;
  show_inventory: void;
  hide_inventory: void;
  show_resident_card: void;
  show_lottery_ui: void;
  show_birthday_reveal: void;
  show_lottery_draw: LotteryResultPayload;
  show_ending: void;
  show_quest_popup: { questId: string };
  /** Show a small tap-to-interact prompt in the world */
  show_interact_prompt: InteractPromptPayload;
  hide_interact_prompt: void;
  /** Fade overlay (0 = transparent, 1 = black) */
  fade_screen: { opacity: number; durationMs: number };
  /** Combat player HP display */
  update_combat_hp: CombatHpPayload;
  hide_combat_hp: void;
  /** Boss HP bar */
  update_boss_hp: BossHpPayload;
  hide_boss_hp: void;
  /** Show Suhyeon's letter overlay */
  show_letter: void;
  /** Show CLEAR screen */
  show_clear: void;
  /** Lottery number picked by player */
  lottery_picked: { number: number };

  // React → Game
  dialogue_complete: { sequenceId: string };
  choice_made: { choiceId: string };
  lottery_number_selected: { number: number };
  resident_card_dismissed: void;
  /** true = block engine input, false = unblock */
  phaser_input_blocked: boolean;
  /** User tapped an interact prompt */
  interact_confirm: { actionId: string };
  /** Letter overlay was closed by player */
  letter_closed: void;
}

type Listener<T> = (payload: T) => void;

// ─── Bridge class ─────────────────────────────────────────────────────────────

class EventBridgeClass {
  private listeners: Partial<{
    [K in keyof BridgeEventMap]: Set<Listener<BridgeEventMap[K]>>;
  }> = {};

  on<K extends keyof BridgeEventMap>(
    event: K,
    listener: Listener<BridgeEventMap[K]>
  ): () => void {
    if (!this.listeners[event]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.listeners as any)[event] = new Set<Listener<BridgeEventMap[K]>>();
    }
    (this.listeners[event] as Set<Listener<BridgeEventMap[K]>>).add(listener);

    // Return unsubscribe function
    return () => {
      (this.listeners[event] as Set<Listener<BridgeEventMap[K]>>).delete(listener);
    };
  }

  emit<K extends keyof BridgeEventMap>(
    event: K,
    payload: BridgeEventMap[K]
  ): void {
    const set = this.listeners[event] as
      | Set<Listener<BridgeEventMap[K]>>
      | undefined;
    if (!set) return;
    set.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error(`[EventBridge] Error in listener for "${event}":`, err);
      }
    });
  }

  /** Remove all listeners for a given event. */
  off<K extends keyof BridgeEventMap>(event: K): void {
    delete this.listeners[event];
  }

  /** Remove all listeners entirely. */
  clear(): void {
    this.listeners = {};
  }
}

// ─── Export singleton ─────────────────────────────────────────────────────────

export const EventBridge = new EventBridgeClass();
