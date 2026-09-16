/**
 * dialogue.ts
 * ALL player-facing dialogue must be in Korean.
 * Each sequence is an ordered array of lines.
 * `speaker` and `text` are both Korean.
 * `portrait` maps to a character portrait key.
 * `autoAdvanceMs` — if set, the line auto-closes after typing completes.
 */

export interface DialogueLine {
  speaker: string;
  text: string;
  portrait?: string;
  /** If set, triggers a game event after this line advances */
  onComplete?: string;
  /** Auto-close this line N ms after typing finishes (for cinematic beats) */
  autoAdvanceMs?: number;
}

export interface DialogueSequence {
  id: string;
  lines: DialogueLine[];
}

// ─── Narration speaker constant ───────────────────────────────────────────────
const NARRATION = '...';

// ─── All dialogue sequences ───────────────────────────────────────────────────

export const DIALOGUES: Record<string, DialogueSequence> = {

  // ── Scene 1A: Taeil's Studio (Desk) ───────────────────────────────────────

  apartment_desk_monologue: {
    id: 'apartment_desk_monologue',
    lines: [
      { speaker: '태일', text: '하… 고칠 건 왜 볼 때마다 늘어나냐.', portrait: 'portrait_player' },
    ],
  },

  apartment_inspect_laptop: {
    id: 'apartment_inspect_laptop',
    lines: [
      { speaker: NARRATION, text: '지금 당장은 답이 안 나온다.' },
    ],
  },

  apartment_inspect_papers: {
    id: 'apartment_inspect_papers',
    lines: [
      { speaker: NARRATION, text: '고칠 표시만 늘어난 것 같다.' },
    ],
  },

  apartment_inspect_notes: {
    id: 'apartment_inspect_notes',
    lines: [
      { speaker: NARRATION, text: '내일 보면 다르게 보이겠지.' },
    ],
  },

  apartment_inspect_bed: {
    id: 'apartment_inspect_bed',
    lines: [
      { speaker: '태일', text: '일단 자고 생각하자.', portrait: 'portrait_player' },
    ],
  },

  apartment_inspect_yongbin: {
    id: 'apartment_inspect_yongbin',
    lines: [
      { speaker: NARRATION, text: '잘 자고는 있네…' },
    ],
  },

  // ── Scene 1A: Sleep sequence ───────────────────────────────────────────────

  apartment_snoring: {
    id: 'apartment_snoring',
    lines: [
      { speaker: '태일', text: '김용빈. 좀 조용히 해.', portrait: 'portrait_player' },
      { speaker: NARRATION, text: '쿨쿨쿨쿨쿨쿨쿨쿨쿨쿨쿨쿨쿨쿨쿨' },
      { speaker: '태일', text: '야 조용히 해 김용비이이이이인!!!', portrait: 'portrait_player' },
    ],
  },

  // ── Scene 1A: Portal ───────────────────────────────────────────────────────

  apartment_portal_notice: {
    id: 'apartment_portal_notice',
    lines: [
      { speaker: '태일', text: '…뭐야.', portrait: 'portrait_player', autoAdvanceMs: 1500 },
    ],
  },

  apartment_portal_fall: {
    id: 'apartment_portal_fall',
    lines: [
      { speaker: '태일', text: '잠깐—', portrait: 'portrait_player', autoAdvanceMs: 1100 },
    ],
  },

  // ── Scene 1B: Falling transition ──────────────────────────────────────────
  // (no dialogue — visual only)

  // ── Scene 1C: Fantasy Meadow Arrival ──────────────────────────────────────

  meadow_taeil_scream: {
    id: 'meadow_taeil_scream',
    lines: [
      { speaker: '태일', text: '아아아아악!', portrait: 'portrait_player', autoAdvanceMs: 1800 },
    ],
  },

  meadow_crash: {
    id: 'meadow_crash',
    lines: [
      { speaker: '티모', text: '아야ㅠㅠ 갑자기 하늘에서 사람이 떨어졌잖아!', portrait: 'portrait_teemo' },
      { speaker: '태일', text: '아…', portrait: 'portrait_player' },
    ],
  },

  meadow_where_am_i: {
    id: 'meadow_where_am_i',
    lines: [
      { speaker: '태일', text: '…여기가 어디야?', portrait: 'portrait_player' },
      { speaker: '티모', text: '그건 내가 묻고 싶은데. 너 방금 하늘에서 떨어졌어.', portrait: 'portrait_teemo' },
      { speaker: '태일', text: '어디 나라냐니까.', portrait: 'portrait_player' },
      { speaker: '티모', text: '…별바람 초원인데?', portrait: 'portrait_teemo' },
    ],
  },

  meadow_light_body: {
    id: 'meadow_light_body',
    lines: [
      { speaker: '태일', text: '몸이 왜 이렇게 가볍지.', portrait: 'portrait_player' },
      { speaker: '티모', text: '원래 무거웠어? 그럼 잘 됐네.', portrait: 'portrait_teemo' },
    ],
  },

  meadow_party_hook: {
    id: 'meadow_party_hook',
    lines: [
      { speaker: '티모', text: '나 저 마을 가는 중인데, 같이 갈래?', portrait: 'portrait_teemo' },
      { speaker: '태일', text: '멀잖아. 길은 알아?', portrait: 'portrait_player' },
      { speaker: '티모', text: '응… 아마. 오늘 저녁에 별빛 저택 파티도 있거든.', portrait: 'portrait_teemo' },
      { speaker: '태일', text: '무슨 파티?', portrait: 'portrait_player' },
      { speaker: '티모', text: '가면 알겠지.', portrait: 'portrait_teemo' },
    ],
  },

  meadow_objective: {
    id: 'meadow_objective',
    lines: [
      { speaker: NARRATION, text: '별바람 마을로 가보자.', autoAdvanceMs: 2500 },
    ],
  },

  // ── Scene 1: Bedroom (legacy / non-3D fallback) ────────────────────────────
  bedroom_narration: {
    id: 'bedroom_narration',
    lines: [
      { speaker: NARRATION, text: '조용한 밤. 노태일은 깊이 잠들어 있었다.' },
      { speaker: NARRATION, text: '그런데...' },
    ],
  },

  bedroom_glow: {
    id: 'bedroom_glow',
    lines: [
      { speaker: NARRATION, text: '침대 아래에서 초록빛이 점점 밝아진다.' },
    ],
  },

  bedroom_fall: {
    id: 'bedroom_fall',
    lines: [
      { speaker: NARRATION, text: '......!' },
    ],
  },

  // ── Scene 2: Meadow (legacy) ───────────────────────────────────────────────
  meadow_landing: {
    id: 'meadow_landing',
    lines: [
      { speaker: NARRATION, text: '눈앞이 환해졌다 싶더니—' },
    ],
  },

  meadow_party_invite: {
    id: 'meadow_party_invite',
    lines: [
      { speaker: '티모', text: '아무튼, 난 티모야. 오늘 저녁에 저택 파티가 있어. 갈래?', portrait: 'portrait_teemo' },
      { speaker: '노태일', text: '...파티?', portrait: 'portrait_player' },
      { speaker: '티모', text: '외지인은 임시 주민등록증이 있어야 돼. 마을 주민센터에서 발급받을 수 있어.', portrait: 'portrait_teemo' },
      {
        speaker: '티모',
        text: '저기 보이는 다리 건너면 별빛 마을이야.',
        portrait: 'portrait_teemo',
        onComplete: 'quest_resident_card_active',
      },
    ],
  },

  // ── Quest popup text ───────────────────────────────────────────────────────
  quest_resident_card: {
    id: 'quest_resident_card',
    lines: [
      { speaker: '퀘스트', text: '임시 주민등록증을 발급받자. 별빛 마을 주민센터로 가야 한다.' },
    ],
  },

  // ── Scene 3: Village NPCs ──────────────────────────────────────────────────
  npc_fountain: {
    id: 'npc_fountain',
    lines: [
      { speaker: '마을 주민', text: '이 분수는 소원을 들어준다고 하던데… 지금까지 이루어진 소원이 없어서 그냥 전설이겠지.', portrait: 'portrait_npc1' },
    ],
  },

  npc_bench: {
    id: 'npc_bench',
    lines: [
      { speaker: '할아버지', text: '오늘 파티 때문에 마을이 시끌벅적하구먼. 복권도 산다고?', portrait: 'portrait_elder' },
    ],
  },

  npc_notice_board: {
    id: 'npc_notice_board',
    lines: [
      { speaker: NARRATION, text: '[별빛 마을 공지] 오늘 저녁, 별빛 저택에서 특별 파티가 열립니다.\n외지인 입장 시 임시 주민등록증 필수. 오늘 한정 축제 복권 판매 중!' },
    ],
  },

  // ── Scene 4: Resident Office ───────────────────────────────────────────────
  office_intro: {
    id: 'office_intro',
    lines: [
      { speaker: '직원', text: '어서 오세요. 임시 주민등록 신청이세요?', portrait: 'portrait_clerk' },
    ],
  },

  office_name_prompt: {
    id: 'office_name_prompt',
    lines: [
      { speaker: '직원', text: '성명?', portrait: 'portrait_clerk' },
    ],
  },

  office_name_confirm: {
    id: 'office_name_confirm',
    lines: [
      { speaker: '직원', text: '노태일... 확인했습니다.', portrait: 'portrait_clerk' },
    ],
  },

  office_origin_prompt: {
    id: 'office_origin_prompt',
    lines: [
      { speaker: '직원', text: '출신 지역?', portrait: 'portrait_clerk' },
    ],
  },

  office_origin_response: {
    id: 'office_origin_response',
    lines: [
      { speaker: '직원', text: '흠... 흔한 경우군요.', portrait: 'portrait_clerk' },
    ],
  },

  office_printing: {
    id: 'office_printing',
    lines: [
      { speaker: '직원', text: '등록증을 발급하겠습니다. 잠시만요...', portrait: 'portrait_clerk' },
    ],
  },

  office_complete: {
    id: 'office_complete',
    lines: [
      { speaker: '직원', text: '발급 완료입니다. 유효기간은 오늘 자정까지예요. 파티 잘 즐기세요!', portrait: 'portrait_clerk' },
    ],
  },

  // ── Scene 5: Lottery Shop ──────────────────────────────────────────────────
  lottery_teemo_hint: {
    id: 'lottery_teemo_hint',
    lines: [
      { speaker: '티모', text: '아 맞다! 오늘 주민들은 축제 복권도 살 수 있어. 추첨은 파티 마지막에 한대!', portrait: 'portrait_teemo' },
    ],
  },

  lottery_shop_intro: {
    id: 'lottery_shop_intro',
    lines: [
      { speaker: '복권 주인', text: '어서 와요~ 오늘의 특별 복권이에요! 1번부터 20번 중에 하나 고르면 돼요.', portrait: 'portrait_shopkeeper' },
    ],
  },

  lottery_warning: {
    id: 'lottery_warning',
    lines: [
      { speaker: '복권 주인', text: '한 번 고르면 못 바꿔요. …아마도.', portrait: 'portrait_shopkeeper' },
    ],
  },

  lottery_complete: {
    id: 'lottery_complete',
    lines: [
      { speaker: '복권 주인', text: '선택하셨군요! 행운을 빕니다~', portrait: 'portrait_shopkeeper' },
    ],
  },

  // ── Scene 6: Forest ────────────────────────────────────────────────────────
  forest_enter: {
    id: 'forest_enter',
    lines: [
      { speaker: NARRATION, text: '마을을 벗어나자 숲길이 시작됐다. 반딧불이들이 반겨주는 것 같기도 하고…' },
    ],
  },

  forest_direction_1: {
    id: 'forest_direction_1',
    lines: [
      { speaker: '노태일', text: '티모, 길 맞아?', portrait: 'portrait_player' },
      { speaker: '티모', text: '응. 아마.', portrait: 'portrait_teemo' },
    ],
  },

  forest_direction_2: {
    id: 'forest_direction_2',
    lines: [
      { speaker: '티모', text: '저기서 왼쪽인가… 일단 가보자.', portrait: 'portrait_teemo' },
    ],
  },

  forest_direction_3: {
    id: 'forest_direction_3',
    lines: [
      { speaker: '티모', text: '다 왔어! 저기 저택 보이잖아.', portrait: 'portrait_teemo' },
    ],
  },

  // ── Memory item discoveries ────────────────────────────────────────────────
  memory_find_car_key: {
    id: 'memory_find_car_key',
    lines: [
      { speaker: NARRATION, text: '반짝이는 낡은 자동차 키… 이상하게 익숙한 냄새가 난다.' },
    ],
  },

  memory_find_ticket: {
    id: 'memory_find_ticket',
    lines: [
      { speaker: NARRATION, text: '바위 위의 작은 티켓. 버리기에는 좋은 기억이 너무 많이 묻어 있다.' },
    ],
  },

  memory_find_star: {
    id: 'memory_find_star',
    lines: [
      { speaker: NARRATION, text: '별 모양 조각… 누군가 오래 전에 준비해둔 것 같다.' },
    ],
  },

  memory_find_photo: {
    id: 'memory_find_photo',
    lines: [
      { speaker: NARRATION, text: '나뭇가지에 걸린 낡은 사진. …둘이서 찍은 것 같다.' },
    ],
  },

  memory_find_letter: {
    id: 'memory_find_letter',
    lines: [
      { speaker: NARRATION, text: '버섯 아래 작은 봉투. 아직 열어보지 않은 편지다.' },
    ],
  },

  // ── Scene 8: Mansion Exterior ──────────────────────────────────────────────
  mansion_arrive: {
    id: 'mansion_arrive',
    lines: [
      { speaker: '노태일', text: '이게… 저택이야?', portrait: 'portrait_player' },
      { speaker: '티모', text: '지역마다 기준이 다른 거지.', portrait: 'portrait_teemo' },
    ],
  },

  mansion_door_prompt: {
    id: 'mansion_door_prompt',
    lines: [
      { speaker: '티모', text: '문 두드려봐.', portrait: 'portrait_teemo' },
    ],
  },

  // ── Scene 9: Birthday Reveal ───────────────────────────────────────────────
  birthday_reveal: {
    id: 'birthday_reveal',
    lines: [
      { speaker: '전원', text: '노태일 생일 축하해!!!' },
    ],
  },

  // ── Scene 10: Lottery Draw ─────────────────────────────────────────────────
  lottery_host_intro: {
    id: 'lottery_host_intro',
    lines: [
      { speaker: '사회자', text: '그리고 오늘의 마지막 행사! 축제 특별 복권 추첨을 시작하겠습니다!', portrait: 'portrait_teemo' },
    ],
  },

  lottery_host_result: {
    id: 'lottery_host_result',
    lines: [
      { speaker: '사회자', text: '당첨 번호는...', portrait: 'portrait_teemo' },
    ],
  },

  lottery_winner: {
    id: 'lottery_winner',
    lines: [
      { speaker: '사회자', text: '축하합니다!!! 당첨되셨어요!', portrait: 'portrait_teemo' },
    ],
  },

  // ── Scene 11: Gift Reveal ──────────────────────────────────────────────────
  gift_chest_open: {
    id: 'gift_chest_open',
    lines: [
      { speaker: NARRATION, text: '상자 안에서 빛이 새어 나온다...' },
    ],
  },

  // ── Scene 2: Playable Village Entrance ─────────────────────────────────────

  teemo_village_hint: {
    id: 'teemo_village_hint',
    lines: [
      { speaker: '티모', text: '저기가 별바람 마을이야. 주민등록증을 받아야 파티에 입장할 수 있어.', portrait: 'portrait_teemo' },
      { speaker: '티모', text: '마을로 가자! WASD로 움직이고 E로 대화해.', portrait: 'portrait_teemo' },
    ],
  },

  teemo_idle: {
    id: 'teemo_idle',
    lines: [
      { speaker: '티모', text: '별바람 마을은 가까워. 조금만 더!', portrait: 'portrait_teemo' },
    ],
  },

  gift_reveal: {
    id: 'gift_reveal',
    lines: [
      { speaker: NARRATION, text: '1등 상품 — 현실 세계에서 수령 가능합니다.' },
    ],
  },

  ending_final: {
    id: 'ending_final',
    lines: [
      { speaker: NARRATION, text: '게임은 여기까지! 근데 진짜 선물은 아직 안 끝났어.' },
    ],
  },

  // ── Scene 3: Village ───────────────────────────────────────────────────────

  village_arrive: {
    id: 'village_arrive',
    lines: [
      { speaker: '티모', text: '별바람 마을이야! 오늘 파티 때문에 사람들이 많네.', portrait: 'portrait_teemo' },
      { speaker: '태일', text: '주민등록증 먼저 받아야 한다고 했지?', portrait: 'portrait_player' },
      { speaker: '티모', text: '왼쪽 건물이 주민센터야. 그리고 복권도 꼭 사야 해!', portrait: 'portrait_teemo' },
    ],
  },

  village_register: {
    id: 'village_register',
    lines: [
      { speaker: '직원', text: '어서 오세요! 임시 주민등록 신청이세요?', portrait: 'portrait_clerk' },
      { speaker: '태일', text: '네.', portrait: 'portrait_player' },
      { speaker: '직원', text: '성함 확인했습니다 — 노태일 씨! 등록증 발급 완료입니다.', portrait: 'portrait_clerk' },
      { speaker: '직원', text: '파티 잘 즐기세요!', portrait: 'portrait_clerk', autoAdvanceMs: 2000 },
    ],
  },

  village_lottery_done: {
    id: 'village_lottery_done',
    lines: [
      { speaker: '복권 주인', text: '선택하셨군요! 파티에서 당첨 번호 확인하세요~', portrait: 'portrait_shopkeeper', autoAdvanceMs: 2500 },
    ],
  },

  village_quests_done: {
    id: 'village_quests_done',
    lines: [
      { speaker: '티모', text: '다 됐어! 근데 마을에 좀 도와줄 일이 있대.', portrait: 'portrait_teemo' },
      { speaker: '태일', text: '어떤 일?', portrait: 'portrait_player' },
      { speaker: '티모', text: '포로라는 애가 위험한 곳으로 달아났고, 시나모롤 케이크를 힐리춤들이 훔쳐갔고…', portrait: 'portrait_teemo' },
      { speaker: '티모', text: '탐 켄치가 다리를 막고 있어. 저택 가려면 그 다리를 건너야 해.', portrait: 'portrait_teemo' },
      { speaker: '태일', text: '…전부 다?', portrait: 'portrait_player' },
      { speaker: '티모', text: '빨리 하면 금방이야! 자신 있지?', portrait: 'portrait_teemo' },
    ],
  },

  // ── Scene 4: Poro Rescue ──────────────────────────────────────────────────

  poro_find: {
    id: 'poro_find',
    lines: [
      { speaker: NARRATION, text: '저기— 힐리춤들이 포로를 가두고 있다!', autoAdvanceMs: 2000 },
      { speaker: '티모', text: '저 애들 쫓아내야 해! 공격은 J, 스킬은 K야!', portrait: 'portrait_teemo' },
    ],
  },

  poro_rescued: {
    id: 'poro_rescued',
    lines: [
      { speaker: NARRATION, text: '포로가 풀려났다!', autoAdvanceMs: 1500 },
      { speaker: '티모', text: '잘했어! 포로도 파티에 오고 싶대.', portrait: 'portrait_teemo' },
      { speaker: '태일', text: '…얘가 말을 해?', portrait: 'portrait_player' },
      { speaker: '티모', text: '눈빛으로 하는 거야.', portrait: 'portrait_teemo', autoAdvanceMs: 2500 },
    ],
  },

  // ── Scene 5: Cinnamoroll ──────────────────────────────────────────────────

  cinnamoroll_meet: {
    id: 'cinnamoroll_meet',
    lines: [
      { speaker: '시나모롤', text: '…힐리춤들이 제 케이크를 다 가져갔어요ㅠ 파티용 케이크인데…', portrait: 'portrait_teemo' },
      { speaker: '태일', text: '저 빼앗아 올게요.', portrait: 'portrait_player' },
      { speaker: '티모', text: '고고! 셋이야 이번엔!', portrait: 'portrait_teemo' },
    ],
  },

  cinnamoroll_thanks: {
    id: 'cinnamoroll_thanks',
    lines: [
      { speaker: '시나모롤', text: '감사해요! 케이크 되찾았어요! 파티에서 봬요~', portrait: 'portrait_teemo', autoAdvanceMs: 2500 },
      { speaker: '티모', text: '시나모롤도 파티 온대. 다음은 탐 켄치야.', portrait: 'portrait_teemo' },
    ],
  },

  // ── Scene 6: Tahm Kench ───────────────────────────────────────────────────

  tahm_kench_meet: {
    id: 'tahm_kench_meet',
    lines: [
      { speaker: '탐 켄치', text: '흠…흠…. 이 다리는 내 구역이야. 지나가고 싶으면 이겨봐.', portrait: 'portrait_teemo' },
      { speaker: '태일', text: '진짜?', portrait: 'portrait_player' },
      { speaker: '티모', text: '그냥 원래 그런 애야. 해보자!', portrait: 'portrait_teemo' },
    ],
  },

  tahm_kench_defeated: {
    id: 'tahm_kench_defeated',
    lines: [
      { speaker: '탐 켄치', text: '…좋아. 네가 이겼다. 다리 써도 돼.', portrait: 'portrait_teemo', autoAdvanceMs: 2500 },
      { speaker: '티모', text: '탐 켄치도 파티 온대! 이제 저택으로!', portrait: 'portrait_teemo' },
    ],
  },

  // ── Scene 7: Memory Forest ────────────────────────────────────────────────

  forest_arrive: {
    id: 'forest_arrive',
    lines: [
      { speaker: NARRATION, text: '다리를 건너자 조용한 숲길이 나타났다.', autoAdvanceMs: 2200 },
      { speaker: '티모', text: '여기… 내가 자주 오는 곳이야. 신기한 버섯들이 있어.', portrait: 'portrait_teemo' },
      { speaker: '태일', text: '버섯이 왜 빛나?', portrait: 'portrait_player' },
      { speaker: '티모', text: '기억을 담고 있거든. 만져보면 알아.', portrait: 'portrait_teemo' },
    ],
  },

  forest_memory_1: {
    id: 'forest_memory_1',
    lines: [
      { speaker: NARRATION, text: '버섯에 손을 얹자 따뜻한 빛이 번진다…', autoAdvanceMs: 2000 },
      { speaker: NARRATION, text: '「 처음 만났을 때 네가 웃어줬잖아. 그게 계속 기억에 남아. 」', autoAdvanceMs: 3000 },
      { speaker: '태일', text: '…누구 기억이지.', portrait: 'portrait_player' },
      { speaker: '티모', text: '버섯도 몰라. 그냥 느낌이잖아.', portrait: 'portrait_teemo' },
    ],
  },

  forest_memory_2: {
    id: 'forest_memory_2',
    lines: [
      { speaker: NARRATION, text: '두 번째 버섯… 훨씬 밝게 빛난다.', autoAdvanceMs: 1800 },
      { speaker: NARRATION, text: '「 힘들 때 네가 옆에 있어줘서 고마웠어. 말 안 해도 알아줬잖아. 」', autoAdvanceMs: 3500 },
      { speaker: '태일', text: '…', portrait: 'portrait_player', autoAdvanceMs: 1500 },
    ],
  },

  forest_memory_3: {
    id: 'forest_memory_3',
    lines: [
      { speaker: NARRATION, text: '마지막 버섯. 빛이 가장 따뜻하다.', autoAdvanceMs: 2000 },
      { speaker: NARRATION, text: '「 생일 축하해. 오늘 하루만큼은 네 걱정은 내려놓고 즐겨. 」', autoAdvanceMs: 3500 },
      { speaker: '태일', text: '…생일이잖아.', portrait: 'portrait_player' },
      { speaker: '티모', text: '알았어? 이제 저택 가자!', portrait: 'portrait_teemo' },
    ],
  },

  forest_done: {
    id: 'forest_done',
    lines: [
      { speaker: NARRATION, text: '세 개의 기억을 모두 만났다.', autoAdvanceMs: 2000 },
      { speaker: '티모', text: '별빛 저택까지 이제 조금만 더야!', portrait: 'portrait_teemo', autoAdvanceMs: 2500 },
    ],
  },

  // ── Scene 8: Sunset ───────────────────────────────────────────────────────

  sunset_narration: {
    id: 'sunset_narration',
    lines: [
      { speaker: NARRATION, text: '저 멀리 별빛 저택이 보이기 시작했다.', autoAdvanceMs: 2500 },
      { speaker: NARRATION, text: '노을빛이 모든 걸 따뜻하게 물들였다.', autoAdvanceMs: 2500 },
    ],
  },

  // ── Scene 9: Party ────────────────────────────────────────────────────────

  birthday_reveal_party: {
    id: 'birthday_reveal_party',
    lines: [
      { speaker: '전원', text: '노태일 생일 축하해!!!! 🎉', autoAdvanceMs: 1000 },
      { speaker: '포로', text: '뿌우우♡', autoAdvanceMs: 1500 },
      { speaker: '시나모롤', text: '행복한 생일이에요~!', portrait: 'portrait_teemo' },
      { speaker: '탐 켄치', text: '…생일 축하한다. 진심으로.', portrait: 'portrait_teemo' },
      { speaker: '태일', text: '뭐야 다들… 준비한 거야?', portrait: 'portrait_player' },
      { speaker: '티모', text: '당연하지! 오늘 주인공은 너잖아.', portrait: 'portrait_teemo' },
    ],
  },

  lottery_host_intro_party: {
    id: 'lottery_host_intro_party',
    lines: [
      { speaker: '티모', text: '아, 그리고! 아까 복권 번호 기억해?', portrait: 'portrait_teemo' },
      { speaker: '태일', text: '어?', portrait: 'portrait_player' },
      { speaker: '티모', text: '오늘의 특별 추첨 시간이야!', portrait: 'portrait_teemo', autoAdvanceMs: 2000 },
    ],
  },

  lottery_host_result_party: {
    id: 'lottery_host_result_party',
    lines: [
      { speaker: '티모', text: '당첨 번호 공개합니다…!', portrait: 'portrait_teemo', autoAdvanceMs: 2000 },
    ],
  },

  lottery_winner_party: {
    id: 'lottery_winner_party',
    lines: [
      { speaker: '전원', text: '축하해!!!', autoAdvanceMs: 1200 },
      { speaker: '태일', text: '설마… 내 번호야?', portrait: 'portrait_player' },
      { speaker: '티모', text: '응! 1등이야! 상품은… 현실 세계에서 수령 가능~', portrait: 'portrait_teemo' },
    ],
  },

  party_before_letter: {
    id: 'party_before_letter',
    lines: [
      { speaker: '티모', text: '참, 태일아. 편지 하나 와 있었어.', portrait: 'portrait_teemo' },
      { speaker: '태일', text: '편지?', portrait: 'portrait_player' },
      { speaker: '티모', text: '발신인이… 수현이래.', portrait: 'portrait_teemo' },
    ],
  },

  // ── Scene 10: Return home ─────────────────────────────────────────────────

  return_narration: {
    id: 'return_narration',
    lines: [
      { speaker: NARRATION, text: '문이 열리더니 태일은 다시 자기 방에 있었다.', autoAdvanceMs: 2500 },
      { speaker: '태일', text: '꿈이었나…', portrait: 'portrait_player' },
      { speaker: NARRATION, text: '책상 위에 선물 상자가 하나 놓여 있다.', autoAdvanceMs: 2500 },
      { speaker: '태일', text: '…이건 꿈이 아니네.', portrait: 'portrait_player', autoAdvanceMs: 2000 },
    ],
  },
};

// ─── Helper: get a dialogue sequence safely ───────────────────────────────────
export function getDialogue(id: string): DialogueSequence {
  const seq = DIALOGUES[id];
  if (!seq) {
    console.warn(`[Dialogue] Missing sequence: "${id}"`);
    return { id, lines: [{ speaker: '???', text: '...' }] };
  }
  return seq;
}
