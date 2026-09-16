/**
 * characters.ts
 * NPC and character configuration.
 * All display names are in Korean.
 */

export interface CharacterConfig {
  id: string;
  displayName: string;       // Korean
  portraitKey: string;       // Phaser texture key
  spriteKey: string;         // Phaser texture key for world sprite
  color: number;             // Fallback color for placeholder rectangle
  role?: string;             // Korean description
}

export const CHARACTERS: Record<string, CharacterConfig> = {
  player: {
    id: 'player',
    displayName: '노태일',
    portraitKey: 'portrait_player',
    spriteKey: 'sprite_player',
    color: 0x4a9eff,
  },

  teemo: {
    id: 'teemo',
    displayName: '티모',
    portraitKey: 'portrait_teemo',
    spriteKey: 'sprite_teemo',
    color: 0x2ecc40,
    role: '숲의 안내자 (길치)',
  },

  clerk: {
    id: 'clerk',
    displayName: '직원',
    portraitKey: 'portrait_clerk',
    spriteKey: 'sprite_clerk',
    color: 0xdda0dd,
    role: '별빛 마을 주민센터 직원',
  },

  shopkeeper: {
    id: 'shopkeeper',
    displayName: '복권 주인',
    portraitKey: 'portrait_shopkeeper',
    spriteKey: 'sprite_shopkeeper',
    color: 0xffa500,
    role: '복권 가게 주인',
  },

  elder: {
    id: 'elder',
    displayName: '할아버지',
    portraitKey: 'portrait_elder',
    spriteKey: 'sprite_elder',
    color: 0x8a9a5b,
    role: '마을 어르신',
  },

  npc1: {
    id: 'npc1',
    displayName: '마을 주민',
    portraitKey: 'portrait_npc1',
    spriteKey: 'sprite_npc1',
    color: 0xd4a96a,
  },

  // Birthday party guests — easily replaceable
  cinnamoroll: {
    id: 'cinnamoroll',
    displayName: '시나모롤',
    portraitKey: 'portrait_cinnamoroll',
    spriteKey: 'sprite_cinnamoroll',
    color: 0xaad4ff,
    role: '파티 게스트',
  },

  tahm_kench: {
    id: 'tahm_kench',
    displayName: '탐 켄치',
    portraitKey: 'portrait_tahm_kench',
    spriteKey: 'sprite_tahm_kench',
    color: 0x2a7a4a,
    role: '파티 게스트',
  },

  // Add more birthday party guests here
  guest_c: {
    id: 'guest_c',
    displayName: '???',
    portraitKey: 'portrait_guest_c',
    spriteKey: 'sprite_guest_c',
    color: 0xff6b9d,
    role: '파티 게스트',
  },
};

// Party guests shown in the birthday reveal scene
export const BIRTHDAY_PARTY_GUESTS = [
  'cinnamoroll',
  'tahm_kench',
  'guest_c',
  'teemo',
];
