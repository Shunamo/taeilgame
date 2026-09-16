/**
 * items.ts
 * All item definitions. Names and descriptions MUST be in Korean.
 * Add new memory items here — they will automatically appear in inventory.
 */

import type { InventoryItem } from '@/state/GameState';

// ─── Memory items found during forest exploration ─────────────────────────────

export const MEMORY_ITEMS: Record<string, Omit<InventoryItem, 'quantity'>> = {
  old_car_key: {
    id: 'old_car_key',
    name: '낡은 자동차 키',
    description:
      '이상하게 익숙한 냄새가 난다.\n누군가와 아주 많이 돌아다닌 것 같다.',
    icon: 'item_car_key',
    type: 'memory',
  },

  small_ticket: {
    id: 'small_ticket',
    name: '작은 티켓',
    description:
      '버리기에는 좋은 기억이 너무 많이 묻어 있다.',
    icon: 'item_ticket',
    type: 'memory',
  },

  star_fragment: {
    id: 'star_fragment',
    name: '별 모양 조각',
    description:
      '누군가 오래 전에 준비해둔 것 같다.',
    icon: 'item_star',
    type: 'memory',
  },

  old_photo: {
    id: 'old_photo',
    name: '색바랜 사진',
    description:
      '둘이서 어딘가를 다녀온 것 같다.\n언제인지 잘 기억이 나지 않지만,\n기분은 기억난다.',
    icon: 'item_photo',
    type: 'memory',
  },

  unopened_letter: {
    id: 'unopened_letter',
    name: '열리지 않은 편지',
    description:
      '아직 봉인되어 있다.\n열어볼 타이밍이 있을 것 같은 느낌이 든다.',
    icon: 'item_letter',
    type: 'memory',
  },
};

// ─── Key items ────────────────────────────────────────────────────────────────

export const KEY_ITEMS: Record<string, Omit<InventoryItem, 'quantity'>> = {
  resident_card: {
    id: 'resident_card',
    name: '임시 주민등록증',
    description:
      '별빛 마을 임시 주민등록증.\n유효기간: 오늘 자정까지.',
    icon: 'item_resident_card',
    type: 'key_item',
  },

  lottery_ticket: {
    id: 'lottery_ticket',
    name: '축제 복권',
    description:
      '오늘 파티 마지막에 추첨이 있다고 한다.\n당첨되면 뭔가 좋은 게 있겠지.',
    icon: 'item_lottery',
    type: 'key_item',
  },
};

// ─── All items combined (for lookup) ─────────────────────────────────────────

export const ALL_ITEMS: Record<string, Omit<InventoryItem, 'quantity'>> = {
  ...MEMORY_ITEMS,
  ...KEY_ITEMS,
};

export function getItem(id: string): Omit<InventoryItem, 'quantity'> | undefined {
  return ALL_ITEMS[id];
}

// ─── Forest memory item spawn config ─────────────────────────────────────────
// Defines where each memory item appears in ForestScene (in world coords).
// The `discoveryDialogue` maps to a dialogue sequence in dialogue.ts.

export interface MemoryItemSpawn {
  itemId: string;
  worldX: number;
  worldY: number;
  discoveryDialogue: string;
  glowColor: number;
}

export const FOREST_MEMORY_SPAWNS: MemoryItemSpawn[] = [
  {
    itemId: 'old_car_key',
    worldX: 320,
    worldY: 480,
    discoveryDialogue: 'memory_find_car_key',
    glowColor: 0xffd700,
  },
  {
    itemId: 'small_ticket',
    worldX: 650,
    worldY: 300,
    discoveryDialogue: 'memory_find_ticket',
    glowColor: 0xff8fa0,
  },
  {
    itemId: 'star_fragment',
    worldX: 900,
    worldY: 600,
    discoveryDialogue: 'memory_find_star',
    glowColor: 0xa0c4ff,
  },
  {
    itemId: 'old_photo',
    worldX: 480,
    worldY: 750,
    discoveryDialogue: 'memory_find_photo',
    glowColor: 0xffcc66,
  },
  {
    itemId: 'unopened_letter',
    worldX: 780,
    worldY: 420,
    discoveryDialogue: 'memory_find_letter',
    glowColor: 0xc0ffb0,
  },
];
