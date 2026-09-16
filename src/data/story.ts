/**
 * story.ts
 * Scene beat configs, quest definitions, and story structure.
 * This file drives the narrative flow across scenes.
 */

// ─── Quest definitions ────────────────────────────────────────────────────────

export interface QuestDefinition {
  id: string;
  title: string;          // Korean
  description: string;    // Korean
  hint?: string;          // Korean
}

export const QUESTS: Record<string, QuestDefinition> = {
  get_resident_card: {
    id: 'get_resident_card',
    title: '임시 주민등록증을 발급받자',
    description: '별빛 마을 주민센터에서 임시 주민등록증을 발급받아야 파티에 입장할 수 있다.',
    hint: '마을 주민센터는 광장 왼쪽에 있다.',
  },

  get_lottery_ticket: {
    id: 'get_lottery_ticket',
    title: '축제 복권을 구입하자',
    description: '복권 가게에서 1번부터 20번 중 하나를 골라야 한다.',
    hint: '복권 가게는 마을 오른쪽 골목에 있다.',
  },

  reach_mansion: {
    id: 'reach_mansion',
    title: '별빛 저택으로 가자',
    description: '마을을 나와 숲길을 따라 저택을 찾아간다.',
    hint: '티모를 따라가면 된다... 아마도.',
  },
};

// ─── Scene beats ──────────────────────────────────────────────────────────────
// Each beat is a named checkpoint in the story.
// GameState.questProgress keys map to these IDs.

export const STORY_BEATS = {
  // Scene 1
  BEDROOM_START: 'bedroom_start',
  BEDROOM_PORTAL: 'bedroom_portal',

  // Scene 2
  MEADOW_LANDED: 'meadow_landed',
  TEEMO_MET: 'teemo_met',
  PARTY_INVITED: 'party_invited',

  // Scene 3
  VILLAGE_ENTERED: 'village_entered',
  RESIDENT_CARD_ISSUED: 'resident_card_issued',
  LOTTERY_BOUGHT: 'lottery_bought',

  // Scene 4
  FOREST_ENTERED: 'forest_entered',
  MEMORY_ITEMS_FOUND: 'memory_items_found',

  // Scene 5
  MANSION_REACHED: 'mansion_reached',
  DOOR_KNOCKED: 'door_knocked',

  // Scene 6
  BIRTHDAY_REVEALED: 'birthday_revealed',
  LOTTERY_DRAWN: 'lottery_drawn',
  GIFT_OPENED: 'gift_opened',
} as const;

// ─── Origin choices for resident office ──────────────────────────────────────
// These are presented as a choice UI in React.

export const ORIGIN_CHOICES = [
  { id: 'earth', label: '지구' },
  { id: 'bed',   label: '침대' },
  { id: 'unknown', label: '잘 모르겠음' },
] as const;

// ─── Lottery number range ─────────────────────────────────────────────────────

export const LOTTERY_MIN = 1;
export const LOTTERY_MAX = 20;

// ─── Resident card template ───────────────────────────────────────────────────

export function buildResidentCard(playerName: string) {
  return {
    name: playerName,
    status: '임시 주민',
    region: '별빛 마을',
    validUntil: '오늘 자정까지',
    issuedAt: Date.now(),
  };
}

// ─── Ending screen config ─────────────────────────────────────────────────────
// Replace these values when the real gift is ready.

export const ENDING_CONFIG = {
  prizeLabel: '1등 상품',
  prizeSubtitle: '현실 세계에서 수령 가능합니다.',
  claimButtonText: '수현에게 상품 받으러 가기',
  finalLines: [
    '게임은 여기까지!',
    '근데 진짜 선물은 아직 안 끝났어.',
  ],
  // Slot for real gift content — replace with actual paths when ready
  giftImagePath: '/assets/gift/gift_photo.jpg',   // optional real photo
  giftVideoPath: '',                               // optional video URL
  birthdayLetterText: '',                         // fill in personal letter
} as const;
