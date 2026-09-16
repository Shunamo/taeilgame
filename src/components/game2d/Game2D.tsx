import React, { useEffect, useRef, useState } from 'react';

type SceneType =
  | 'TITLE'
  | 'PROLOGUE'
  | 'FALL'
  | 'MEADOW'
  | 'VILLAGE'
  | 'REGISTRATION'
  | 'LOTTERY'
  | 'QUEST_PREP'
  | 'PORO_RESCUE'
  | 'FRUIT_QUEST'
  | 'MUSHROOM_QUEST'
  | 'COMBAT1'
  | 'RIVER_REST'
  | 'DUNGEON'
  | 'REVISION_BOSS'
  | 'SUNSET_JOURNEY'
  | 'MANSION_EXT'
  | 'PARTY_REVEAL'
  | 'PARTY_TALK'
  | 'LOTTERY_PAYOFF'
  | 'FIRST_PRIZE'
  | 'SUHYEON_LETTER'
  | 'QUIET_ROOM'
  | 'TEEMO_GOODBYE'
  | 'END_SCREEN'
  | 'COOKIE';

interface DialogueLine {
  speaker: string;
  text: string;
  portrait?: string;
}

interface ItemToast {
  title: string;
  desc: string;
  iconColor?: string;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  name: string;
  isBoss?: boolean;
  tier?: 1 | 2 | 3;
}

export function Game2D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // State Machine
  const [scene, setScene] = useState<SceneType>('TITLE');
  const [dialogue, setDialogue] = useState<DialogueLine[] | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState<number>(0);
  const [objective, setObjective] = useState<string>('');
  const [lotteryNumber, setLotteryNumber] = useState<number | null>(null);
  const [showLotteryGrid, setShowLotteryGrid] = useState<boolean>(false);
  const [showRegChoices, setShowRegChoices] = useState<boolean>(false);
  const [regOrigin, setRegOrigin] = useState<string>('');
  const [toast, setToast] = useState<ItemToast | null>(null);
  const [collectedItems, setCollectedItems] = useState<string[]>([]);
  const [showLetterModal, setShowLetterModal] = useState<boolean>(false);
  const [showPhonePopup, setShowPhonePopup] = useState<boolean>(false);
  const [statusAnimation, setStatusAnimation] = useState<{ fatigue: number; focus: number; back: number } | null>(null);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        setIsPortrait(window.innerHeight > window.innerWidth);
      }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Gameplay references
  const playerRef = useRef({
    x: 180,
    y: 260,
    hp: 100,
    maxHp: 100,
    dir: 'down',
    isAttacking: false,
    attackTimer: 0,
    isSkill: false,
    skillTimer: 0,
    walkFrame: 0,
    isMoving: false,
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const stepRef = useRef<number>(0);
  const enemiesRef = useRef<Enemy[]>([]);
  const combatActiveRef = useRef<boolean>(false);
  const windSkillCdRef = useRef<number>(0);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; life: number; size: number }[]>([]);
  const screenShakeRef = useRef<number>(0);
  const animFrameCounterRef = useRef<number>(0);

  // Quest counters & Poro follower state
  const fruitCountRef = useRef<number>(0);
  const mushroomCountRef = useRef<number>(0);
  const isPoroRescuedRef = useRef<boolean>(false);
  const poroPosRef = useRef<{ x: number; y: number }>({ x: 140, y: 280 });

  // Mandatory Village Quest Progress Flags
  const hasRegisteredRef = useRef<boolean>(false);
  const hasLotteryRef = useRef<boolean>(false);
  const hasCinnamorollQuestRef = useRef<boolean>(false);
  const hasTahmQuestRef = useRef<boolean>(false);
  const meadowStartTimeRef = useRef<number>(0);
  const collectedMushroomsRef = useRef<Set<number>>(new Set());

  // Virtual Analog Joystick State & Event Handlers (iOS Safari, Chrome, Mouse)
  const joystickVectorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joystickKnob, setJoystickKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isJoystickDraggingRef = useRef<boolean>(false);
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);

  const handleJoystickStart = (clientX: number, clientY: number) => {
    isJoystickDraggingRef.current = true;
    updateJoystickPos(clientX, clientY);
  };

  const handleJoystickMove = (clientX: number, clientY: number) => {
    if (!isJoystickDraggingRef.current) return;
    updateJoystickPos(clientX, clientY);
  };

  const handleJoystickEnd = () => {
    isJoystickDraggingRef.current = false;
    joystickVectorRef.current = { x: 0, y: 0 };
    setJoystickKnob({ x: 0, y: 0 });
  };

  const updateJoystickPos = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const dist = Math.hypot(deltaX, deltaY);
    const maxRadius = 38;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(deltaY, deltaX);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setJoystickKnob({ x: knobX, y: knobY });
    joystickVectorRef.current = {
      x: Math.cos(angle) * (clampedDist / maxRadius),
      y: Math.sin(angle) * (clampedDist / maxRadius),
    };
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      keysRef.current[e.code] = true;

      // Debug Scene Jump Shortcuts
      if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(e.key)) {
        jumpToScene(e.key);
      }

      if (k === 'e') handleInteract();
      if (k === 'j') handleAttack();
      if (k === 'k') handleSkill();
      if (e.key === 'Enter' || e.key === ' ') advanceDialogue();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = false;
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [scene, dialogue, dialogueIndex, showLotteryGrid, showRegChoices, showLetterModal]);

  // Scene Jump Shortcut Helper
  const jumpToScene = (key: string) => {
    setDialogue(null);
    setShowLotteryGrid(false);
    setShowRegChoices(false);
    setShowLetterModal(false);
    setShowPhonePopup(false);
    combatActiveRef.current = false;
    enemiesRef.current = [];

    switch (key) {
      case '1': initPrologue(); break;
      case '2': initMeadow(); break;
      case '3': initVillage(); break;
      case '4': initFruitQuest(); break;
      case '5': initMushroomQuest(); break;
      case '6': initRiverRest(); break;
      case '7': initDungeon(); break;
      case '8': initSunsetJourney(); break;
      case '9': initPartyReveal(); break;
      case '0': setScene('END_SCREEN'); break;
    }
  };

  const triggerDialogue = (lines: DialogueLine[], onComplete?: () => void) => {
    setDialogue(lines);
    setDialogueIndex(0);
    (window as any)._onDialogueComplete = onComplete;
  };

  const advanceDialogue = () => {
    if (showLetterModal) {
      setShowLetterModal(false);
      initQuietRoom();
      return;
    }

    if (!dialogue) return;
    if (dialogueIndex < dialogue.length - 1) {
      setDialogueIndex((prev) => prev + 1);
    } else {
      setDialogue(null);
      const cb = (window as any)._onDialogueComplete;
      if (cb) {
        (window as any)._onDialogueComplete = null;
        cb();
      }
    }
  };

  const showItemToast = (title: string, desc: string, iconColor = '#ffd700', onDone?: () => void) => {
    setToast({ title, desc, iconColor });
    setCollectedItems((prev) => Array.from(new Set([...prev, title])));
    setTimeout(() => {
      setToast(null);
      if (onDone) onDone();
    }, 3200);
  };

  const triggerScreenShake = (amount = 8) => {
    screenShakeRef.current = amount;
  };

  // -------------------------------------------------------------
  // SCENE INITIALIZERS
  // -------------------------------------------------------------

  const initPrologue = () => {
    setScene('PROLOGUE');
    playerRef.current.x = 220;
    playerRef.current.y = 250;
    stepRef.current = 0;
    setObjective('침대로 가서 쉬자 [E]');
    triggerDialogue([
      { speaker: '태일', text: '......' },
      { speaker: '태일', text: '아니. 뭔가 핵심 기여가 안 보이는데.' },
      { speaker: '태일', text: '고칠 건 왜 볼 때마다 늘어나냐...' },
      { speaker: '태일', text: '오늘은 진짜 자야겠다.' },
    ]);
  };

  const triggerPortal = () => {
    stepRef.current = 1;
    triggerScreenShake(24);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 250, 100, 400]);
    }
    triggerDialogue([
      { speaker: '태일', text: '......' },
      { speaker: '태일', text: '야. 김용빈.' },
      { speaker: '태일', text: '야 좀 조용히 해.' },
      { speaker: '김용빈', text: '드르르르르르르르르르르르렁!!!!!' },
      { speaker: '태일', text: '야 조용히 해 김용비이이이이인!!!!' },
    ], () => {
      initFall();
    });
  };

  const initFall = () => {
    setScene('FALL');
    triggerScreenShake(18);
    triggerDialogue([
      { speaker: '태일', text: '어? 잠깐... 침대 밑이...?' },
      { speaker: '태일', text: '아아아아아아악!!!!!' },
    ], () => {
      setTimeout(() => initMeadow(), 1500);
    });
  };

  const initMeadow = () => {
    setScene('MEADOW');
    playerRef.current.x = 200;
    playerRef.current.y = 280;
    stepRef.current = 0;
    meadowStartTimeRef.current = Date.now();
    setObjective('티모와 함께 별바람 마을로 가자');

    setTimeout(() => {
      triggerScreenShake(14);
      triggerDialogue([
        { speaker: '티모', text: '오늘 날씨도 좋고 버섯도 푹신하네~ 🎵' },
        { speaker: '효과음', text: '💥 쿵!! (태일이가 하늘에서 떨어지며 티모의 탐험 모자에 머리를 박는다!)' },
        { speaker: '티모', text: '아야야야!! ㅠㅠ 아구 내 머리! 갑자기 하늘에서 떨어져서 머리를 쿵 박으면 어떡해!' },
        { speaker: '태일', text: '아쿠쿠... 머리야... 어? 어라... 버섯 모자를 쓴 요들 티모...?!' },
        { speaker: '티모', text: '머리에 혹 나겠다구! 그건 그렇고 넌 어디서 날아온 거야?' },
        { speaker: '태일', text: '......어? 나 세게 부딪혔는데 하나도 안 아파... 피로도 0...?!' },
      ], () => {
        setStatusAnimation({ fatigue: 4, focus: 83, back: 0 });
        setTimeout(() => {
          triggerDialogue([
            { speaker: '태일', text: '미쳤다. 여기 바람이 이렇게 시원하고 따뜻한 천국이야?' },
            { speaker: '티모', text: '아니. 별바람 마을 근처 몬드 숲인데.' },
            { speaker: '티모', text: '오늘 별빛 저택에서 엄청 중요한 비밀 초대 파티가 있거든. 나랑 같이 마을 가자!' },
            { speaker: '태일', text: '좋아!' },
            { speaker: '티모', text: '아... 근데 넌 주민이 아니네. 주민센터에서 주민 등록부터 해야겠어.' },
          ]);
        }, 1000);
      });
    }, 1400);
  };

  const updateVillageObjective = () => {
    if (!hasRegisteredRef.current) {
      setObjective('[마을 퀘스트 1/4] 주민센터에서 캐서린을 만나 임시 주민 등록을 하자 [E]');
    } else if (!hasLotteryRef.current) {
      setObjective('[마을 퀘스트 2/4] 광장의 상인 각청을 만나 축제 복권을 구매하자 [E]');
    } else if (!hasCinnamorollQuestRef.current) {
      setObjective('[마을 퀘스트 3/4] 시나모롤을 만나 특제 케이크 퀘스트를 받자 [E]');
    } else if (!hasTahmQuestRef.current) {
      setObjective('[마을 퀘스트 4/4] 탐켄치 셰프를 만나 특제 탕 퀘스트를 받자 [E]');
    } else {
      setObjective('[마을 퀘스트 완료] 숲 입구로 이동하여 파티 재료 수집을 시작하자! [오른쪽 이동]');
    }
  };

  const initVillage = () => {
    setScene('VILLAGE');
    playerRef.current.x = 100;
    playerRef.current.y = 290;
    updateVillageObjective();
  };

  const startRegistration = () => {
    setShowRegChoices(true);
  };

  const finishRegistration = (origin: string) => {
    setShowRegChoices(false);
    setRegOrigin(origin);
    hasRegisteredRef.current = true;
    triggerDialogue([
      { speaker: '캐서린', text: `출생지: ${origin}... 입국경로: 침대 아래.` },
      { speaker: '캐서린', text: '흠. 흔한 경우군요. 최근 침대 아래 입국자가 아주 많습니다.' },
      { speaker: '태일', text: '많다고요...?' },
      { speaker: '캐서린', text: '별과 심연을... 아 아니! 찰칵! 임시 주민증 발급 완료입니다. 체류목적: 휴식!' },
      { speaker: '캐서린', text: '이제 중앙 광장의 상인 [각청] 님에게 가셔서 축제 복권을 구매하시고, [시나모롤]과 [탐켄치]를 만나 파티 요리 퀘스트를 도와주세요!' },
    ], () => {
      showItemToast('별바람 마을 임시 주민증', '유효기간: 오늘 자정까지 / 체류목적: 휴식', '#4cc9f0');
      updateVillageObjective();
    });
  };

  const selectLotteryNumber = (num: number) => {
    setLotteryNumber(num);
    setShowLotteryGrid(false);
    hasLotteryRef.current = true;
    showItemToast(`별빛 축제 복권 NO. ${num}`, '오늘 밤 별빛 저택 파티에서 추첨 결과가 발표된다.', '#ffd700', () => {
      triggerDialogue([
        { speaker: '각청', text: `축제 복권 NO. ${num}번 등록을 마쳤어! 오늘 밤 저택 파티에서 1등 추첨 결과를 발표할 테니 기대해!` },
        { speaker: '티모', text: '좋았어! 각청한테 복권을 샀으니, 이제 [시나모롤]과 [탐켄치]를 만나서 파티 요리 퀘스트를 받고 출발하자!' },
      ], () => {
        updateVillageObjective();
      });
    });
  };

  const initQuestPrep = () => {
    setScene('QUEST_PREP');
    setObjective('푸푸(포로) 구출 작전!');
    triggerDialogue([
      { speaker: '티모', text: '앗, 큰일이야! 파티 재료(일몰열매, 기억의 버섯, 달콤달콤 꽃)를 구하러 가야 하는데...' },
      { speaker: '티모', text: '숲 입구에서 히리츄르 무리가 나타나서 푸푸(포로)를 철창에 가뒀대!' },
      { speaker: '태일', text: '뭐라고?! 귀여운 포로가 갇혔다고?! 가만둘 수 없지! 당장 구하러 가자!' },
    ], () => {
      initPoroRescue();
    });
  };

  const initPoroRescue = () => {
    setScene('PORO_RESCUE');
    combatActiveRef.current = true;
    playerRef.current.x = 140;
    playerRef.current.y = 280;
    setObjective('[1단계] 츄츄족 파수꾼을 물리치자! [J] 공격 [K] 바람스킬');
    enemiesRef.current = [
      { id: 10, x: 620, y: 280, hp: 35, maxHp: 35, speed: 1.1, name: '츄츄족 파수꾼', tier: 1 },
    ];
  };

  const initFruitQuest = () => {
    setScene('FRUIT_QUEST');
    fruitCountRef.current = 0;
    setObjective('[탐켄치 퀘스트] 사과나무에서 일몰열매 3개를 수집하자 (0/3)');
  };

  const initMushroomQuest = () => {
    setScene('MUSHROOM_QUEST');
    mushroomCountRef.current = 0;
    setObjective('[탐켄치 퀘스트] 버섯 골짜기에서 기억의 버섯 2개를 찾자 (0/2)');
  };

  const startCombat1 = () => {
    setScene('COMBAT1');
    combatActiveRef.current = true;
    setObjective('방해하는 히리츄르 2마리를 물리치자! [J] 공격 [K] 바람스킬');
    enemiesRef.current = [
      { id: 1, x: 600, y: 240, hp: 40, maxHp: 40, speed: 1.2, name: '히리츄르 A' },
      { id: 2, x: 680, y: 320, hp: 40, maxHp: 40, speed: 1.0, name: '히리츄르 B' },
    ];
  };

  const initRiverRest = () => {
    setScene('RIVER_REST');
    combatActiveRef.current = false;
    setObjective('[시나모롤 퀘스트] 달콤달콤 꽃을 획득하고 벤치에서 잠깐 쉬자 [E]');
  };

  const initDungeon = () => {
    setScene('DUNGEON');
    setObjective('고대 유적 보물상자를 탐색하자 [E]');
    triggerDialogue([
      { speaker: '티모', text: '방금 생각났는데 유적 보물상자에 든 유물도 파티에 챙겨가자!' },
      { speaker: '태일', text: '좋아, 보물상자를 열어보자!' },
    ]);
  };

  const startBossCombat = () => {
    setScene('REVISION_BOSS');
    combatActiveRef.current = true;
    setObjective('끝없는 수정의 정령을 퇴치하자!');
    enemiesRef.current = [
      { id: 99, x: 680, y: 270, hp: 120, maxHp: 120, speed: 0.8, name: 'Revision 1', isBoss: true },
    ];
  };

  const initSunsetJourney = () => {
    setScene('SUNSET_JOURNEY');
    combatActiveRef.current = false;
    playerRef.current.x = 100;
    playerRef.current.y = 290;
    setObjective('노을빛 은하수 길을 따라 별빛 저택으로 가자');
    triggerDialogue([
      { speaker: '마을 주민', text: '재료 다 구했어? 파티 잘 다녀와~' },
      { speaker: '태일', text: '다들 나를 향해 웃어주네!' },
    ]);
  };

  const initMansionExt = () => {
    setScene('MANSION_EXT');
    playerRef.current.x = 180;
    playerRef.current.y = 290;
    setObjective('별빛 저택 문을 열자 [E]');
    triggerDialogue([
      { speaker: '태일', text: '드디어 별빛 저택에 도착했어!' },
      { speaker: '티모', text: '자, 문을 두드려봐!' },
    ]);
  };

  const initPartyReveal = () => {
    setScene('PARTY_REVEAL');
    playerRef.current.x = 250;
    playerRef.current.y = 320;
    triggerScreenShake(10);
    setObjective('생일 파티를 즐기고 사람들과 대화하자 [E]');
    triggerDialogue([
      { speaker: '전원', text: '노태일 26세 생일 축하해!!! 🎉🎉🎉' },
      { speaker: '태일', text: '......뭐? 나...?!' },
      { speaker: '티모', text: '응! 오늘 파티 주인공은 너였어!' },
      { speaker: '시나모롤', text: '태일 님이 구해다 주신 [달콤달콤 꽃] 덕분에 26세 촛불이 빛나는 4단 케이크가 완성되었어요! 🍰' },
      { speaker: '탐켄치', text: '허허! 구해다 준 [일몰열매 3개]와 [기억의 버섯 2개]로 푹 우려낸 생일 특제 탕이라네! 🍲' },
      { speaker: '캐서린', text: '별바람 마을 최고의 귀빈 노태일 님, 26번째 생일을 진심으로 축하드립니다!' },
      { speaker: '푸푸(포로)', text: '헤헤~! (태일이 옆에서 꼬리를 흔들며 26세 생일을 축하한다!)' },
      { speaker: '각청', text: '자! 그럼 모두가 기다리던 별빛 축제 특별 복권 1등 추첨을 시작해볼까?!' },
    ], () => {
      initPartyTalk();
    });
  };

  const initPartyTalk = () => {
    setScene('PARTY_TALK');
    setObjective('상인 각청의 복권 추첨 발표를 기다리자 [E]');
  };

  const startLotteryPayoff = () => {
    setScene('LOTTERY_PAYOFF');
    const winningNum = lotteryNumber || 7;
    triggerDialogue([
      { speaker: '각청 (복권 상인)', text: '오늘의 하이라이트! 별빛 축제 특별 복권 추첨!' },
      { speaker: '각청 (복권 상인)', text: '1등 당첨 번호는...' },
      { speaker: '각청 (복권 상인)', text: `NO. ${winningNum} 번!!! 당첨!!!` },
      { speaker: '태일', text: '어?! 내가 각청에게 산 복권 번호잖아?!' },
      { speaker: '티모', text: '미쳤다! 1등 당첨이야!' },
    ], () => {
      initFirstPrize();
    });
  };

  const initFirstPrize = () => {
    setScene('FIRST_PRIZE');
    setObjective('1등 보물상자를 열자 [E]');
  };

  const openFirstPrizeChest = () => {
    showItemToast('1등 상품 수령권', '현실 세계에서 수령 가능합니다.', '#ff4500', () => {
      initSuhyeonLetter();
    });
  };

  const initSuhyeonLetter = () => {
    setScene('SUHYEON_LETTER');
    setShowLetterModal(true);
  };

  const initQuietRoom = () => {
    setScene('QUIET_ROOM');
    setObjective('');
    setTimeout(() => {
      initTeemoGoodbye();
    }, 4500);
  };

  const initTeemoGoodbye = () => {
    setScene('TEEMO_GOODBYE');
    playerRef.current.x = 440;
    playerRef.current.y = 300;
    setObjective('');
    triggerDialogue([
      { speaker: '태일', text: '나 이제 돌아가야 돼?' },
      { speaker: '티모', text: '아마.' },
      { speaker: '태일', text: '돌아가면 논문 있겠지?' },
      { speaker: '티모', text: '아마.' },
      { speaker: '티모', text: '그래도 다음에 너무 피곤하면 또 와. 침대 밑으로!' },
      { speaker: '태일', text: '고마웠어, 티모.' },
    ], () => {
      setScene('END_SCREEN');
    });
  };

  const startCookie = () => {
    setScene('COOKIE');
    playerRef.current.x = 200;
    playerRef.current.y = 260;
    triggerScreenShake(8);
    setObjective('');
    triggerDialogue([
      { speaker: '태일', text: '......꿈이었나?' },
      { speaker: '김용빈', text: '드르르르르렁... zZZ (침대가 울리도록 시끄럽게 코를 곤다)' },
      { speaker: '태일', text: `어?! 책상 위에... 각청에게서 받은 별빛 축제 추첨권(NO. ${lotteryNumber || 7})이 왜 진짜로 있는 거지...?!` },
      { speaker: '태일', text: '설마... 진짜 별바람 마을에 갔다 온 건가...?' },
    ], () => {
      setShowPhonePopup(true);
    });
  };

  // -------------------------------------------------------------
  // INTERACTION LOGIC
  // -------------------------------------------------------------

  const handleInteract = () => {
    if (dialogue) {
      advanceDialogue();
      return;
    }

    const p = playerRef.current;

    if (scene === 'PROLOGUE') {
      const distBed = Math.hypot(p.x - 740, p.y - 200);
      if (distBed < 90) {
        triggerPortal();
      }
    } else if (scene === 'VILLAGE') {
      const distKatheryne = Math.hypot(p.x - 300, p.y - 200);
      const distKeqing = Math.hypot(p.x - 225, p.y - 340);
      const distPurpleGirl = Math.hypot(p.x - 580, p.y - 220);
      const distCinnamoroll = Math.hypot(p.x - 740, p.y - 190);
      const distTahm = Math.hypot(p.x - 840, p.y - 340);
      const distPoro = Math.hypot(p.x - 540, p.y - 320);

      if (distKatheryne < 90) {
        if (!hasRegisteredRef.current) {
          triggerDialogue([
            { speaker: '캐서린', text: '별과 심연을... 아, 아니! 별바람 마을 주민센터에 오신 것을 환영합니다!' },
            { speaker: '태일', text: '캐서린?! 원신의 캐서린이 왜 여기서 일하고 계신가요...?' },
            { speaker: '캐서린', text: '오늘 밤 별빛 저택의 비밀 초호화 파티 입장을 위해 임시 주민 등록을 진행해 드릴게요!' },
          ], () => {
            startRegistration();
          });
        } else {
          triggerDialogue([
            { speaker: '캐서린', text: '임시 주민증 발급이 완료되었습니다! 각청 님, 시나모롤 님, 탐켄치 님을 만나보세요!' },
          ]);
        }
      } else if (distKeqing < 90) {
        if (!hasRegisteredRef.current) {
          triggerDialogue([
            { speaker: '각청', text: '안녕! 축제 복권을 사려면 먼저 주민센터의 캐서린 님에게 가 임시 주민 등록부터 마쳐야 해!' },
          ]);
        } else if (!hasLotteryRef.current) {
          triggerDialogue([
            { speaker: '각청', text: '어서 와! 별빛 축제 특별 복권 가판대야.' },
            { speaker: '각청', text: '오늘 저택 파티에서 1등 당첨 번호가 발표된다구. 1번부터 20번 중 행운의 번호를 골라봐!' },
          ], () => {
            setShowLotteryGrid(true);
          });
        } else {
          triggerDialogue([
            { speaker: '각청', text: `축제 복권 NO. ${lotteryNumber}번 등록이 끝났어! 저택 파티장에서 결과를 기다려봐!` },
          ]);
        }
      } else if (distCinnamoroll < 80) {
        if (!hasRegisteredRef.current || !hasLotteryRef.current) {
          triggerDialogue([
            { speaker: '시나모롤', text: '어서 오세요! 주민 등록을 마치고 각청 님에게 복권을 사신 뒤 말씀해 주세요! 🍰' },
          ]);
        } else if (!hasCinnamorollQuestRef.current) {
          triggerDialogue([
            { speaker: '시나모롤', text: '어서 오세요! 별구름 디저트 카페의 시나모롤이에요! 🍰' },
            { speaker: '시나모롤', text: '오늘 밤 별빛 저택 파티에 쓸 최고급 디저트 케이크를 구우려면 강가 근처의 [달콤달콤 꽃] 1개가 꼭 필요해요!' },
            { speaker: '시나모롤', text: '달콤달콤 꽃을 구해다 주시면 아주 폭신한 4단 특제 케이크를 만들어 드릴게요!' },
            { speaker: '태일', text: '좋아! 시나모롤, 꼭 구해올게!' },
          ], () => {
            hasCinnamorollQuestRef.current = true;
            showItemToast('[시나모롤 퀘스트] 수락 완료!', '강가 근처에서 [달콤달콤 꽃 1개] 구하기', '#ffb703');
            updateVillageObjective();
            if (hasTahmQuestRef.current) {
              setTimeout(() => initQuestPrep(), 1200);
            }
          });
        } else {
          triggerDialogue([
            { speaker: '시나모롤', text: '강가 근처의 [달콤달콤 꽃] 1개를 부탁드려요! 디저트 오븐을 덥혀놓고 있을게요! 🍰' },
          ]);
        }
      } else if (distTahm < 90) {
        if (!hasRegisteredRef.current || !hasLotteryRef.current) {
          triggerDialogue([
            { speaker: '탐켄치', text: '허허! 복권도 사고 주민 등록도 마친 뒤 찾아오시게나!' },
          ]);
        } else if (!hasTahmQuestRef.current) {
          triggerDialogue([
            { speaker: '탐켄치', text: '허허! 파티를 위한 특제 한입 탕 요리를 보글보글 끓이는 중이라네.' },
            { speaker: '탐켄치', text: '사과나무의 [일몰열매] 3개와 숲속 [기억의 버섯] 2개가 들어가야 국물이 깊어진다네!' },
            { speaker: '태일', text: '맛있는 요리 재료군요! 신선하게 구해다 드릴게요.' },
          ], () => {
            hasTahmQuestRef.current = true;
            showItemToast('[탐켄치 퀘스트] 수락 완료!', '사과나무 [일몰열매 3개] & 숲속 [기억의 버섯 2개] 구하기', '#00f5d4');
            updateVillageObjective();
            if (hasCinnamorollQuestRef.current) {
              setTimeout(() => initQuestPrep(), 1200);
            }
          });
        } else {
          triggerDialogue([
            { speaker: '탐켄치', text: '사과나무의 [일몰열매 3개]와 숲속의 [기억의 버섯 2개]를 구해다 주시게나! 🍲' },
          ]);
        }
      } else if (distPurpleGirl < 80) {
        triggerDialogue([
          { speaker: '보라색 주민', text: '오늘 별빛 저택 간다며?' },
          { speaker: '태일', text: '네!' },
          { speaker: '보라색 주민', text: '축하해~ 저택 파티 음식 엄청 맛있다더라!' },
        ]);
      } else if (distPoro < 80) {
        triggerDialogue([
          { speaker: '푸푸(포로)', text: '헤헤~! (복슬복슬한 털을 털어내며 태일이에게 반갑게 애교를 부린다!)' },
          { speaker: '태일', text: '포로잖아?! 너무 푹신푹신하고 귀엽다.' },
        ]);
      }
    } else if (scene === 'FRUIT_QUEST') {
      const distTree = Math.hypot(p.x - 300, p.y - 270);
      if (distTree > 95) {
        showItemToast('접근 필요 🍎', '사과나무 근처로 가까이 걸어가서 [E] 키를 누르세요!', '#ff4d6d');
        return;
      }
      fruitCountRef.current++;
      showItemToast('피로 회복 일몰열매', '사과나무 가지에서 따낸 붉은 일몰열매. 한입 베어 물면 피로가 감쪽같이 사라진다.', '#ff4d6d');
      setObjective(`[탐켄치 퀘스트] 사과나무에서 일몰열매 3개를 수집하자 (${fruitCountRef.current}/3)`);
      if (fruitCountRef.current >= 3) {
        setTimeout(() => initMushroomQuest(), 1500);
      }
    } else if (scene === 'MUSHROOM_QUEST') {
      const mushrooms = [
        { id: 1, x: 280, y: 270 },
        { id: 2, x: 520, y: 370 },
        { id: 3, x: 740, y: 260 },
      ];
      const nearMushroom = mushrooms.find((m) => {
        if (collectedMushroomsRef.current.has(m.id)) return false;
        return Math.hypot(p.x - m.x, p.y - m.y) < 90;
      });

      if (!nearMushroom) {
        showItemToast('접근 필요 🍄', '기억의 버섯 근처로 가까이 걸어가서 [E] 키를 누르세요!', '#00f5d4');
        return;
      }

      collectedMushroomsRef.current.add(nearMushroom.id);
      mushroomCountRef.current++;
      if (mushroomCountRef.current === 1) {
        showItemToast('기억의 버섯 (1/2)', '흩어진 생각을 하나씩 제자리로 돌려놓는 신비로운 픽셀 버섯.', '#00f5d4');
        setObjective('[탐켄치 퀘스트] 버섯 골짜기에서 기억의 버섯 2개를 찾자 (1/2)');
      } else {
        triggerDialogue([{ speaker: '태일', text: '마지막 기억의 버섯이다! 어? 어디선가 무시무시한 포효 소리가...!' }], () => {
          startCombat1();
        });
      }
    } else if (scene === 'RIVER_REST') {
      if (stepRef.current === 0) {
        const distFlower = Math.hypot(p.x - 400, p.y - 250);
        if (distFlower > 90) {
          showItemToast('접근 필요 🌸', '빛나는 달콤달콤 꽃 근처로 가까이 걸어가서 [E] 키를 누르세요!', '#ffd166');
          return;
        }
        showItemToast('달콤달콤 꽃', '노란 꽃잎과 달콤한 꿀향기가 흩날리는 신비로운 꽃. 마음에 깊은 여유를 선사한다.', '#ffd166', () => {
          stepRef.current = 1;
          setObjective('벤치에 앉아서 잠깐 쉬자 [E]');
        });
      } else if (stepRef.current === 1) {
        triggerDialogue([
          { speaker: '태일', text: '......좋네.' },
          { speaker: '티모', text: '응. 잠시 아무것도 하지 않아도 괜찮아.' },
        ], () => {
          initDungeon();
        });
      }
    } else if (scene === 'DUNGEON') {
      if (stepRef.current === 0) {
        showItemToast('수정자의 깃털', '문서를 수없이 수정해도 다시 열 수 있는 여유를 준다. (멘탈+18)', '#e2afff');
        showItemToast('마감의 시계', '마감이 가까워질수록 초침이 빨라진다. (집중+22, 수면-40)', '#ffd166');
        stepRef.current = 1;
        setObjective('유적 깊은 곳으로 가자');
      } else {
        startBossCombat();
      }
    } else if (scene === 'MANSION_EXT') {
      const distDoor = Math.hypot(p.x - 700, p.y - 250);
      if (distDoor < 100) {
        initPartyReveal();
      }
    } else if (scene === 'PARTY_TALK') {
      startLotteryPayoff();
    } else if (scene === 'FIRST_PRIZE') {
      openFirstPrizeChest();
    }
  };

  // -------------------------------------------------------------
  // COMBAT ATTACKS & FEEDBACK
  // -------------------------------------------------------------

  const handleAttack = () => {
    if (!combatActiveRef.current) return;
    const p = playerRef.current;
    p.isAttacking = true;
    p.attackTimer = 10;

    enemiesRef.current.forEach((enemy) => {
      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist < 70) {
        enemy.hp -= 15;
        triggerScreenShake(4);
        for (let i = 0; i < 6; i++) {
          particlesRef.current.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: '#fff',
            life: 12,
            size: 3,
          });
        }
      }
    });

    checkCombatState();
  };

  const handleSkill = () => {
    if (!combatActiveRef.current || windSkillCdRef.current > 0) return;
    const p = playerRef.current;
    p.isSkill = true;
    p.skillTimer = 15;
    windSkillCdRef.current = 80;
    triggerScreenShake(8);

    enemiesRef.current.forEach((enemy) => {
      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist < 120) {
        enemy.hp -= 30;
        for (let i = 0; i < 10; i++) {
          particlesRef.current.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: '#66eeff',
            life: 18,
            size: 4,
          });
        }
      }
    });

    checkCombatState();
  };

  const checkCombatState = () => {
    enemiesRef.current = enemiesRef.current.filter((e) => {
      if (e.hp <= 0 && e.isBoss) {
        // Boss Phase Rename Gag
        if (e.name === 'Revision 1') {
          e.name = 'Revision 2';
          e.hp = 100;
          triggerScreenShake(10);
          return true;
        } else if (e.name === 'Revision 2') {
          e.name = 'Final_v2';
          e.hp = 80;
          triggerScreenShake(12);
          return true;
        } else if (e.name === 'Final_v2') {
          e.name = 'FINAL_REAL_LAST';
          e.hp = 60;
          triggerScreenShake(15);
          return true;
        }
      }
      return e.hp > 0;
    });

    if (enemiesRef.current.length === 0) {
      combatActiveRef.current = false;
      if (scene === 'PORO_RESCUE') {
        isPoroRescuedRef.current = true;
        poroPosRef.current.x = 740;
        poroPosRef.current.y = 260;
        showItemToast('동료 푸푸(포로) 구출 완료!', '포로가 무사히 구출되어 태일이의 동료가 되었습니다. 이제 태일이를 졸졸 따라다닙니다!', '#ff758f', () => {
          triggerDialogue([
            { speaker: '푸푸(포로)', text: '헤헤~! (태일이 옆으로 달라붙으며 신나게 꼬리를 든다!)' },
            { speaker: '태일', text: '다행이다! 포로야, 이제부터 나랑 계속 같이 가자!' },
            { speaker: '티모', text: '좋았어! 포로도 구했으니 이제 파티 재료 구하러 가자!' },
          ], () => {
            initFruitQuest();
          });
        });
      } else if (scene === 'COMBAT1') {
        showItemToast('기억의 버섯 획득 완료', '모든 기억의 버섯을 되찾았습니다!', '#00f5d4', () => {
          showItemToast('낡은 자동차 키', '금속 가장자리가 조금 닳아 있다. 목적지 없는 밤들의 기억이 묻어 있다.', '#ffd166', () => {
            initRiverRest();
          });
        });
      } else if (scene === 'REVISION_BOSS') {
        showItemToast('봉인의 성배', '무언가를 끝내야 하는 순간, 초스피드로 정답을 찾게 해준다.', '#ff4500', () => {
          showItemToast('작은 티켓 & 익숙한 향의 조각', '어딘가 함께 갔던 날의 티켓과 익숙한 향 조각.', '#e2afff', () => {
            initSunsetJourney();
          });
        });
      }
    }
  };

  // -------------------------------------------------------------
  // MAIN RENDER & ANIMATION LOOP
  // -------------------------------------------------------------

  useEffect(() => {
    let animId: number;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      animFrameCounterRef.current++;
      const time = animFrameCounterRef.current;

      if (windSkillCdRef.current > 0) windSkillCdRef.current--;

      const p = playerRef.current;
      if (p.attackTimer > 0) {
        p.attackTimer--;
        if (p.attackTimer === 0) p.isAttacking = false;
      }
      if (p.skillTimer > 0) {
        p.skillTimer--;
        if (p.skillTimer === 0) p.isSkill = false;
      }

      // Movement Physics
      if (!dialogue && !showLotteryGrid && !showRegChoices && !showLetterModal && scene !== 'FALL' && scene !== 'QUIET_ROOM') {
        let dx = 0;
        let dy = 0;
        let speed = 3.8;

        if (keysRef.current['w'] || keysRef.current['ArrowUp'] || keysRef.current['btnUp']) dy -= 1;
        if (keysRef.current['s'] || keysRef.current['ArrowDown'] || keysRef.current['btnDown']) dy += 1;
        if (keysRef.current['a'] || keysRef.current['ArrowLeft'] || keysRef.current['btnLeft']) dx -= 1;
        if (keysRef.current['d'] || keysRef.current['ArrowRight'] || keysRef.current['btnRight']) dx += 1;

        const joyVec = joystickVectorRef.current;
        if (joyVec.x !== 0 || joyVec.y !== 0) {
          dx += joyVec.x;
          dy += joyVec.y;
        }

        if (dx !== 0 || dy !== 0) {
          p.isMoving = true;
          if (time % 16 === 0) p.walkFrame = (p.walkFrame + 1) % 4;
          const mag = Math.hypot(dx, dy);
          if (mag > 1) {
            dx /= mag;
            dy /= mag;
          }
          p.x += dx * speed;
          p.y += dy * speed;
        } else {
          p.isMoving = false;
        }

        p.x = Math.max(40, Math.min(920, p.x));
        p.y = Math.max(140, Math.min(500, p.y));

        // Automatic Scene Transition Triggers when reaching map exit (right side)
        if (scene === 'MEADOW' && p.x > 840) {
          initVillage();
        } else if (scene === 'VILLAGE' && p.x > 850 && regOrigin) {
          initQuestPrep();
        } else if (scene === 'SUNSET_JOURNEY' && p.x > 840) {
          initMansionExt();
        }
      }

      // Smooth Poro Follower Lerp Physics
      if (isPoroRescuedRef.current) {
        poroPosRef.current.x += (p.x - 45 - poroPosRef.current.x) * 0.12;
        poroPosRef.current.y += (p.y + 8 - poroPosRef.current.y) * 0.12;
      }

      // Enemy AI
      if (combatActiveRef.current) {
        enemiesRef.current.forEach((enemy) => {
          const dx = p.x - enemy.x;
          const dy = p.y - enemy.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 30) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
          } else {
            p.hp -= 0.1;
            if (p.hp <= 0) p.hp = 100; // Fail-safe respawn
          }
        });
      }

      // Camera Shake
      ctx.save();
      if (screenShakeRef.current > 0) {
        const sx = (Math.random() - 0.5) * screenShakeRef.current;
        const sy = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(sx, sy);
        screenShakeRef.current *= 0.85;
        if (screenShakeRef.current < 0.5) screenShakeRef.current = 0;
      }

      // Clear Screen
      ctx.clearRect(0, 0, 960, 540);

      // Render Scene Layers
      if (scene === 'TITLE') drawTitleScene(ctx, time);
      else if (scene === 'PROLOGUE') drawPrologue(ctx, p, time);
      else if (scene === 'FALL') drawFall(ctx, time);
      else if (scene === 'MEADOW') drawMeadow(ctx, p, time);
      else if (scene === 'VILLAGE' || scene === 'REGISTRATION' || scene === 'LOTTERY') drawVillage(ctx, p, time);
      else if (scene === 'QUEST_PREP' || scene === 'PORO_RESCUE') drawPoroRescueMap(ctx, p, time);
      else if (scene === 'FRUIT_QUEST') drawFruitMap(ctx, p, time);
      else if (scene === 'MUSHROOM_QUEST' || scene === 'COMBAT1') drawMushroomMap(ctx, p, time);
      else if (scene === 'RIVER_REST') drawRiverMap(ctx, p, time);
      else if (scene === 'DUNGEON' || scene === 'REVISION_BOSS') drawDungeonMap(ctx, p, time);
      else if (scene === 'SUNSET_JOURNEY') drawSunsetMap(ctx, p, time);
      else if (scene === 'MANSION_EXT') drawMansionExtMap(ctx, p, time);
      else if (scene === 'PARTY_REVEAL' || scene === 'PARTY_TALK' || scene === 'LOTTERY_PAYOFF' || scene === 'FIRST_PRIZE') drawPartyMap(ctx, p, time);
      else if (scene === 'QUIET_ROOM') drawQuietRoom(ctx, time);
      else if (scene === 'TEEMO_GOODBYE') drawGoodbyeMap(ctx, p, time);
      else if (scene === 'END_SCREEN') drawEndScreen(ctx);
      else if (scene === 'COOKIE') drawCookieMap(ctx, p, time);

      // Render Attack Effects
      if (p.isAttacking) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(p.x + 25, p.y - 10, 45, -Math.PI / 3, Math.PI / 3);
        ctx.fill();
      }

      if (p.isSkill) {
        ctx.fillStyle = 'rgba(100, 230, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(p.x, p.y - 10, 90, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Particles
      particlesRef.current.forEach((part) => {
        ctx.fillStyle = part.color;
        ctx.fillRect(part.x, part.y, part.size, part.size);
        part.x += part.vx;
        part.y += part.vy;
        part.life--;
      });
      particlesRef.current = particlesRef.current.filter((pt) => pt.life > 0);

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [scene, dialogue, showLotteryGrid, showRegChoices, showLetterModal]);

  // -------------------------------------------------------------
  // HIGH-DENSITY DENSE SPRITE & MAP PROCEDURAL DRAWINGS
  // -------------------------------------------------------------

  const drawTaeilSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.save();
    const bounce = Math.sin(time / 20) * 1.5;
    const p = playerRef.current;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 14, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs / Walk Cycle
    ctx.fillStyle = '#1e1e24';
    const legOffset = p.isMoving ? Math.sin(time / 10) * 4 : 0;
    ctx.fillRect(x - 8, y + legOffset, 6, 14);
    ctx.fillRect(x + 2, y - legOffset, 6, 14);

    // Sneakers
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 9, y + 12 + legOffset, 7, 4);
    ctx.fillRect(x + 2, y + 12 - legOffset, 7, 4);

    // Body / Brown Check Shirt (Layered pixel detail)
    ctx.fillStyle = '#6b3e26';
    ctx.fillRect(x - 12, y - 22 + bounce, 24, 22);
    // Dark check pattern
    ctx.fillStyle = '#3d2010';
    ctx.fillRect(x - 12, y - 16 + bounce, 24, 3);
    ctx.fillRect(x - 2, y - 22 + bounce, 4, 22);
    // Light inner shirt
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 3, y - 22 + bounce, 6, 12);

    // Head
    ctx.fillStyle = '#ffe0bd';
    ctx.fillRect(x - 10, y - 40 + bounce, 20, 18);

    // Brown hair
    ctx.fillStyle = '#4a2810';
    ctx.fillRect(x - 12, y - 44 + bounce, 24, 8);
    ctx.fillRect(x - 12, y - 38 + bounce, 4, 6);

    // Glasses (Thick black outline)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x - 8, y - 36 + bounce, 7, 7);
    ctx.strokeRect(x + 1, y - 36 + bounce, 7, 7);
    ctx.beginPath();
    ctx.moveTo(x - 1, y - 33 + bounce);
    ctx.lineTo(x + 1, y - 33 + bounce);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 5, y - 33 + bounce, 2, 3);
    ctx.fillRect(x + 4, y - 33 + bounce, 2, 3);

    // Name Tag
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('태일', x, y - 48 + bounce);

    ctx.restore();
  };

  const drawTeemoSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.save();
    // KNEE HEIGHT (Tiny ~22px height!)
    const bounce = Math.sin(time / 18) * 1.2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Beige furry body
    ctx.fillStyle = '#e6c594';
    ctx.beginPath();
    ctx.arc(x, y - 8 + bounce, 9, 0, Math.PI * 2);
    ctx.fill();

    // Green Scout Hat
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.arc(x, y - 15 + bounce, 10, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - 11, y - 15 + bounce, 22, 3);

    // Red Scarf & Goggles
    ctx.fillStyle = '#e63946';
    ctx.fillRect(x - 6, y - 6 + bounce, 12, 3);
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(x - 6, y - 14 + bounce, 4, 4);
    ctx.fillRect(x + 2, y - 14 + bounce, 4, 4);

    // Name Tag
    ctx.fillStyle = '#a8edd5';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('티모', x, y - 22 + bounce);

    ctx.restore();
  };

  const drawHilichurlSprite = (ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) => {
    ctx.save();
    const tier = enemy.tier || (enemy.isBoss ? 2 : 1);
    const scale = tier === 3 ? 2.4 : tier === 2 ? 1.7 : 1.0;
    ctx.scale(scale, scale);

    const x = enemy.x / scale;
    const y = enemy.y / scale;
    const hop = Math.sin(time / 14) * 1.8;

    // 1. TIER 3 LION'S MANE (갈기) - Wild Fur around neck and shoulders
    if (tier === 3) {
      ctx.fillStyle = '#6b1111';
      ctx.beginPath();
      ctx.arc(x, y - 28 + hop, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8b0000';
      for (let i = 0; i < 8; i++) {
        const mAngle = (i * Math.PI) / 4 + Math.sin(time / 10 + i) * 0.2;
        const mX = x + Math.cos(mAngle) * 20;
        const mY = y - 28 + hop + Math.sin(mAngle) * 20;
        ctx.beginPath();
        ctx.arc(mX, mY, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Dark Body & Shoulder Armor
    ctx.fillStyle = tier === 3 ? '#1c1012' : tier === 2 ? '#2b1b16' : '#3a2820';
    ctx.fillRect(x - 10, y - 22 + hop, 20, 22);

    if (tier >= 2) {
      ctx.fillStyle = '#4a4e69';
      ctx.fillRect(x - 14, y - 22 + hop, 5, 8);
      ctx.fillRect(x + 9, y - 22 + hop, 5, 8);
    }

    // 3. Mask (White with Tribal Paints)
    ctx.fillStyle = '#f4f4f9';
    ctx.fillRect(x - 8, y - 34 + hop, 16, 14);

    // Glowing Red Eyes
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = tier >= 2 ? 6 : 2;
    ctx.fillRect(x - 5, y - 30 + hop, 3, 3);
    ctx.fillRect(x + 2, y - 30 + hop, 3, 3);
    ctx.shadowBlur = 0;

    // 4. HORNS (뿔 - Tier 2 & Tier 3)
    if (tier === 2) {
      // Two sharp white horns on mask
      ctx.fillStyle = '#e9ecef';
      ctx.beginPath();
      ctx.moveTo(x - 7, y - 34 + hop);
      ctx.lineTo(x - 12, y - 48 + hop);
      ctx.lineTo(x - 3, y - 34 + hop);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 3, y - 34 + hop);
      ctx.lineTo(x + 12, y - 48 + hop);
      ctx.lineTo(x + 7, y - 34 + hop);
      ctx.fill();
    } else if (tier === 3) {
      // Two MASSIVE curved gold/obsidian demon horns!
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 34 + hop);
      ctx.bezierCurveTo(x - 18, y - 45 + hop, x - 22, y - 55 + hop, x - 16, y - 62 + hop);
      ctx.bezierCurveTo(x - 10, y - 55 + hop, x - 4, y - 42 + hop, x - 2, y - 34 + hop);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 2, y - 34 + hop);
      ctx.bezierCurveTo(x + 4, y - 42 + hop, x + 10, y - 55 + hop, x + 16, y - 62 + hop);
      ctx.bezierCurveTo(x + 22, y - 55 + hop, x + 18, y - 45 + hop, x + 8, y - 34 + hop);
      ctx.fill();
    }

    // 5. Weapon (Club / Spiked Mace / Giant Warhammer)
    if (tier === 1) {
      ctx.fillStyle = '#6c584c';
      ctx.fillRect(x + 10, y - 18 + hop, 6, 18);
    } else if (tier === 2) {
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(x + 10, y - 24 + hop, 7, 26);
      ctx.fillStyle = '#d90429';
      ctx.fillRect(x + 8, y - 22 + hop, 11, 4);
      ctx.fillRect(x + 8, y - 14 + hop, 11, 4);
    } else if (tier === 3) {
      ctx.fillStyle = '#111111';
      ctx.fillRect(x + 10, y - 32 + hop, 8, 38);
      ctx.fillStyle = '#d90429';
      ctx.fillRect(x + 4, y - 34 + hop, 20, 16);
      ctx.fillStyle = '#ffb703';
      ctx.fillRect(x + 6, y - 32 + hop, 16, 12);
    }

    ctx.restore();

    // HP Bar & Name
    ctx.fillStyle = '#111111';
    ctx.fillRect(enemy.x - 25, enemy.y - 45 * scale, 50, 7);
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(enemy.x - 24, enemy.y - 44 * scale, 48 * Math.max(0, enemy.hp / enemy.maxHp), 5);

    ctx.fillStyle = tier === 3 ? '#ffea00' : tier === 2 ? '#ff758f' : '#ffffff';
    ctx.font = `bold ${tier === 3 ? '13px' : '11px'} sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(enemy.name, enemy.x, enemy.y - 50 * scale);
    ctx.shadowBlur = 0;
  };

  const drawCinnamorollSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.save();
    const earBob = Math.sin(time / 16) * 2;
    const bounce = Math.sin(time / 18) * 1.2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + 6, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // White body
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y - 10 + bounce, 14, 0, Math.PI * 2);
    ctx.fill();

    // Long horizontal floppy ears
    ctx.fillRect(x - 30, y - 14 + earBob, 20, 8);
    ctx.fillRect(x + 10, y - 14 - earBob, 20, 8);

    // Blue eyes & Pink cheeks
    ctx.fillStyle = '#4cc9f0';
    ctx.fillRect(x - 5, y - 11 + bounce, 3, 4);
    ctx.fillRect(x + 2, y - 11 + bounce, 3, 4);
    ctx.fillStyle = '#ff758f';
    ctx.fillRect(x - 9, y - 8 + bounce, 4, 3);
    ctx.fillRect(x + 5, y - 8 + bounce, 4, 3);

    // Curly tail
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + 12, y - 4 + bounce, 4, 0, Math.PI * 1.5);
    ctx.stroke();

    // Name Tag
    ctx.fillStyle = '#ffb3c1';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('시나모롤', x, y - 26 + bounce);

    ctx.restore();
  };

  const drawTahmKenchSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.save();
    const bellyBounce = Math.sin(time / 20) * 1.5;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Huge blue-green body
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(x - 24, y - 36 + bellyBounce, 48, 42);

    // Enormous mouth
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 20, y - 18 + bellyBounce, 40, 10);
    ctx.fillStyle = '#ff4d6d'; // Tongue
    ctx.fillRect(x - 10, y - 14 + bellyBounce, 20, 5);

    // Fancy vest
    ctx.fillStyle = '#1b4332';
    ctx.fillRect(x - 22, y - 30 + bellyBounce, 10, 24);
    ctx.fillRect(x + 12, y - 30 + bellyBounce, 10, 24);

    // Small eyes
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(x - 14, y - 30 + bellyBounce, 5, 5);
    ctx.fillRect(x + 9, y - 30 + bellyBounce, 5, 5);

    // Name Tag
    ctx.fillStyle = '#74c69d';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('탐켄치', x, y - 44 + bellyBounce);

    ctx.restore();
  };

  const drawKeqingSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.save();
    const bounce = Math.sin(time / 8) * 1.5;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Purple dress / outfit
    ctx.fillStyle = '#7b2cbf';
    ctx.fillRect(x - 8, y - 20 + bounce, 16, 22);
    ctx.fillStyle = '#e0aaff';
    ctx.fillRect(x - 4, y - 16 + bounce, 8, 14);

    // Head
    ctx.fillStyle = '#ffe0bd';
    ctx.fillRect(x - 7, y - 34 + bounce, 14, 14);

    // Lavender / Purple hair
    ctx.fillStyle = '#9d4edd';
    ctx.fillRect(x - 9, y - 38 + bounce, 18, 8);
    // Cat-ear hair buns silhouette!
    ctx.fillRect(x - 10, y - 44 + bounce, 7, 7);
    ctx.fillRect(x + 3, y - 44 + bounce, 7, 7);
    // Hair strands
    ctx.fillRect(x - 10, y - 32 + bounce, 3, 16);
    ctx.fillRect(x + 7, y - 32 + bounce, 3, 16);

    // Eyes
    ctx.fillStyle = '#c77dff';
    ctx.fillRect(x - 4, y - 29 + bounce, 2, 3);
    ctx.fillRect(x + 2, y - 29 + bounce, 2, 3);

    // Name Tag
    ctx.fillStyle = '#e0aaff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('각청', x, y - 48 + bounce);

    ctx.restore();
  };

  const drawKatheryneSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.save();
    const bounce = Math.sin(time / 8) * 1.5;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark Green / Teal Outfit with White Apron
    ctx.fillStyle = '#1b4332';
    ctx.fillRect(x - 8, y - 20 + bounce, 16, 22);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 5, y - 16 + bounce, 10, 14);

    // Head
    ctx.fillStyle = '#ffe0bd';
    ctx.fillRect(x - 7, y - 34 + bounce, 14, 14);

    // Brown Hair with Side Ribbons
    ctx.fillStyle = '#6c584c';
    ctx.fillRect(x - 9, y - 38 + bounce, 18, 8);
    ctx.fillRect(x - 10, y - 32 + bounce, 4, 14);
    ctx.fillRect(x + 6, y - 32 + bounce, 4, 14);

    // Blue Hair Ribbons (Genshin Katheryne)
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(x - 11, y - 34 + bounce, 4, 4);
    ctx.fillRect(x + 7, y - 34 + bounce, 4, 4);

    // Eyes
    ctx.fillStyle = '#2b9348';
    ctx.fillRect(x - 4, y - 29 + bounce, 2, 3);
    ctx.fillRect(x + 2, y - 29 + bounce, 2, 3);

    // Name Tag
    ctx.fillStyle = '#52b788';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('캐서린(주민센터)', x, y - 48 + bounce);

    ctx.restore();
  };

  const drawPurpleGirlSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.save();
    const bounce = Math.sin(time / 9) * 1.5;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark purple outfit
    ctx.fillStyle = '#3c096c';
    ctx.fillRect(x - 8, y - 20 + bounce, 16, 22);
    ctx.fillStyle = '#7b2cbf';
    ctx.fillRect(x - 5, y - 18 + bounce, 10, 16);

    // Head
    ctx.fillStyle = '#ffe0bd';
    ctx.fillRect(x - 7, y - 34 + bounce, 14, 14);

    // Deep Violet Long Hair
    ctx.fillStyle = '#5a189a';
    ctx.fillRect(x - 9, y - 38 + bounce, 18, 10);
    ctx.fillRect(x - 10, y - 30 + bounce, 4, 18);
    ctx.fillRect(x + 6, y - 30 + bounce, 4, 18);

    // Eyes
    ctx.fillStyle = '#9d4edd';
    ctx.fillRect(x - 4, y - 29 + bounce, 2, 3);
    ctx.fillRect(x + 2, y - 29 + bounce, 2, 3);

    // Name Tag
    ctx.fillStyle = '#c77dff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('마을 주민', x, y - 44 + bounce);

    ctx.restore();
  };

  const drawPoroSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.save();
    const bounce = Math.abs(Math.sin(time / 6)) * 4;

    // Glowing fluffy aura
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x, y - 12 - bounce, 20, 0, Math.PI * 2);
    ctx.fill();

    // White round fluffy body
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y - 12 - bounce, 15, 0, Math.PI * 2);
    ctx.fill();

    // Golden Curved Horns
    ctx.fillStyle = '#e9c46a';
    ctx.beginPath();
    ctx.arc(x - 9, y - 24 - bounce, 5, 0, Math.PI * 2);
    ctx.arc(x + 9, y - 24 - bounce, 5, 0, Math.PI * 2);
    ctx.fill();

    // Cute Glossy Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 6, y - 16 - bounce, 3, 4);
    ctx.fillRect(x + 3, y - 16 - bounce, 3, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 5, y - 16 - bounce, 1, 1);
    ctx.fillRect(x + 4, y - 16 - bounce, 1, 1);

    // Big Floppy Pink Tongue
    ctx.fillStyle = '#ff758f';
    ctx.beginPath();
    ctx.arc(x, y - 9 - bounce, 6, 0, Math.PI);
    ctx.fill();

    // Pink Cheeks
    ctx.fillStyle = '#ffb3c1';
    ctx.fillRect(x - 11, y - 13 - bounce, 3, 2);
    ctx.fillRect(x + 8, y - 13 - bounce, 3, 2);

    // Heart particles
    ctx.fillStyle = '#ff4d6d';
    ctx.font = '10px sans-serif';
    ctx.fillText('♥', x - 18, y - 25 - bounce + Math.sin(time / 8) * 3);

    // Name Tag
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('푸푸(포로)', x, y - 34 - bounce);

    ctx.restore();
  };

  const drawCageWithPoro = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.save();

    // Heavy Wooden Gallows Frame
    ctx.fillStyle = '#3d261a';
    ctx.fillRect(x - 45, y - 80, 12, 100);
    ctx.fillRect(x - 45, y - 80, 55, 12);
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(x + 2, y - 68, 4, 38);

    // Shadow on Ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y + 25, 34, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Poro inside cage
    drawPoroSprite(ctx, x, y + 8, time);

    // Heavy Iron Cage Bars
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(x - 28, y - 30, 56, 7);
    ctx.fillRect(x - 28, y + 20, 56, 7);
    for (let bx = x - 22; bx <= x + 22; bx += 11) {
      ctx.fillRect(bx, y - 30, 4, 57);
    }
    ctx.fillStyle = '#555555';
    ctx.fillRect(x - 28, y - 30, 56, 2);

    // Glowing Golden Keyhole Lock
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x - 7, y - 4, 14, 14);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x, y + 1, 3, 0, Math.PI * 2);
    ctx.fill();

    // Rescue Label
    ctx.fillStyle = '#ff758f';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('🔒 [갇힌 푸푸(포로) - 처치 후 구조!]', x, y - 44);
    ctx.shadowBlur = 0;

    ctx.restore();
  };

  const drawAppleTreeSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, labelText = '사과나무 (일몰열매)') => {
    ctx.save();
    const leafSway = Math.sin(time / 15 + x) * 2;

    // Tree Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 40, 45, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#5c3d2e';
    ctx.fillRect(x - 14, y - 20, 28, 60);
    ctx.fillStyle = '#3d261c'; // Bark detail
    ctx.fillRect(x - 6, y - 20, 6, 60);

    // Foliage Layer 1 (Dark Green)
    ctx.fillStyle = '#1b4332';
    ctx.beginPath();
    ctx.arc(x - 20 + leafSway, y - 50, 40, 0, Math.PI * 2);
    ctx.arc(x + 20 + leafSway, y - 50, 40, 0, Math.PI * 2);
    ctx.arc(x + leafSway, y - 80, 45, 0, Math.PI * 2);
    ctx.fill();

    // Foliage Layer 2 (Bright Green)
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.arc(x - 15 + leafSway, y - 55, 34, 0, Math.PI * 2);
    ctx.arc(x + 15 + leafSway, y - 55, 34, 0, Math.PI * 2);
    ctx.arc(x + leafSway, y - 85, 38, 0, Math.PI * 2);
    ctx.fill();

    // Foliage Layer 3 (Highlight Green)
    ctx.fillStyle = '#52b788';
    ctx.beginPath();
    ctx.arc(x - 10 + leafSway, y - 60, 25, 0, Math.PI * 2);
    ctx.arc(x + 10 + leafSway, y - 60, 25, 0, Math.PI * 2);
    ctx.arc(x + leafSway, y - 90, 28, 0, Math.PI * 2);
    ctx.fill();

    // SUNSET FRUITS (일몰열매) hanging on branches!
    const fruitPositions = [
      { fx: x - 25, fy: y - 60 },
      { fx: x + 22, fy: y - 50 },
      { fx: x - 5, fy: y - 75 },
      { fx: x + 15, fy: y - 95 },
      { fx: x - 30, fy: y - 35 },
    ];

    fruitPositions.forEach((pos) => {
      const fx = pos.fx + leafSway;
      const fy = pos.fy;
      ctx.strokeStyle = '#3d261c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, fy - 8);
      ctx.lineTo(fx, fy - 2);
      ctx.stroke();

      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath();
      ctx.arc(fx, fy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff758f';
      ctx.beginPath();
      ctx.arc(fx - 3, fy - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#74c69d';
      ctx.fillRect(fx - 2, fy - 10, 4, 3);
    });

    ctx.fillStyle = '#ffb703';
    ctx.font = '12px sans-serif';
    ctx.fillText('✨', x - 35 + Math.sin(time / 8) * 4, y - 40);
    ctx.fillText('✨', x + 25 + Math.cos(time / 8) * 4, y - 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labelText, x, y + 55);

    ctx.restore();
  };

  const drawMushroomSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, labelText = '기억의 버섯') => {
    ctx.save();
    const bob = Math.sin(time / 8 + x) * 2;

    ctx.fillStyle = 'rgba(0, 245, 212, 0.25)';
    ctx.beginPath();
    ctx.arc(x, y - 15 + bob, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.quadraticCurveTo(x - 2, y - 14 + bob, x - 5, y - 20 + bob);
    ctx.lineTo(x + 5, y - 20 + bob);
    ctx.quadraticCurveTo(x + 2, y - 14 + bob, x + 6, y);
    ctx.fill();

    ctx.fillStyle = '#00f5d4';
    ctx.beginPath();
    ctx.arc(x, y - 22 + bob, 18, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#05b292';
    ctx.fillRect(x - 18, y - 22 + bob, 36, 4);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 8, y - 30 + bob, 4, 0, Math.PI * 2);
    ctx.arc(x + 7, y - 28 + bob, 3.5, 0, Math.PI * 2);
    ctx.arc(x, y - 34 + bob, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#80ffea';
    ctx.font = '10px sans-serif';
    ctx.fillText('✨', x - 20, y - 35 + Math.sin(time / 6) * 3);
    ctx.fillText('✨', x + 15, y - 30 + Math.cos(time / 6) * 3);

    ctx.fillStyle = '#80ffea';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labelText, x, y + 14);

    ctx.restore();
  };

  const drawSweetFlowerSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, labelText = '달콤달콤 꽃') => {
    ctx.save();
    const sway = Math.sin(time / 14) * 2;

    // Glowing Golden Light Halo (Aura around Sweet Flower)
    const haloGrad = ctx.createRadialGradient(x + sway, y - 18, 3, x + sway, y - 18, 48);
    haloGrad.addColorStop(0, 'rgba(255, 223, 0, 0.75)');
    haloGrad.addColorStop(0.4, 'rgba(255, 183, 3, 0.35)');
    haloGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(x + sway, y - 18, 48, 0, Math.PI * 2);
    ctx.fill();

    // Floating Golden Sparkle Particles
    for (let i = 0; i < 6; i++) {
      const spAngle = (i * Math.PI) / 3 + time * 0.03;
      const spDist = 22 + Math.sin(time / 8 + i) * 6;
      const spX = x + sway + Math.cos(spAngle) * spDist;
      const spY = y - 18 + Math.sin(spAngle) * spDist;
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.arc(spX, spY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stem
    ctx.strokeStyle = '#38b000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + sway, y - 18);
    ctx.stroke();

    // Leaves
    ctx.fillStyle = '#70e000';
    ctx.fillRect(x - 8 + sway, y - 10, 7, 4);
    ctx.fillRect(x + 2 + sway, y - 14, 7, 4);

    // Golden Petals
    ctx.fillStyle = '#ffb703';
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const px = x + sway + Math.cos(angle) * 11;
      const py = y - 18 + Math.sin(angle) * 11;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Flower Center
    ctx.fillStyle = '#fb8500';
    ctx.beginPath();
    ctx.arc(x + sway, y - 18, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + sway - 2, y - 20, 2, 0, Math.PI * 2);
    ctx.fill();

    // Honey drop
    ctx.fillStyle = '#ffd700';
    ctx.font = '10px sans-serif';
    ctx.fillText('🍯', x + sway + 14, y - 25 + Math.sin(time / 10) * 3);

    // Glowing Label
    ctx.fillStyle = '#ffea00';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(labelText, x, y + 14);
    ctx.shadowBlur = 0;

    ctx.restore();
  };

  // -------------------------------------------------------------
  // SCENE MAP DRAWING FUNCTIONS (GENSHIN MONDSTADT PARALLAX & DEPTH)
  // -------------------------------------------------------------

  const drawTitleScene = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.fillStyle = '#0a0c1b';
    ctx.fillRect(0, 0, 960, 540);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const sx = (i * 37) % 960;
      const sy = (i * 53 + Math.sin(time / 20 + i) * 2) % 540;
      ctx.fillRect(sx, sy, 2, 2);
    }

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('별빛 저택으로 가는 길', 480, 200);

    ctx.fillStyle = '#ffffff';
    ctx.font = '22px sans-serif';
    ctx.fillText('노태일 생일 퀘스트', 480, 260);

    ctx.fillStyle = '#88aaff';
    ctx.font = '15px sans-serif';
    ctx.fillText('"생일 하루 정도는 아무것도 고치지 않아도 된다."', 480, 320);
  };

  const drawPrologue = (ctx: CanvasRenderingContext2D, p: any, time: number) => {
    ctx.fillStyle = '#0d1321';
    ctx.fillRect(0, 0, 960, 540);

    ctx.fillStyle = '#1d2d44';
    ctx.fillRect(40, 80, 880, 420);
    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(40, 80, 880, 80);

    ctx.fillStyle = '#1e3d59';
    ctx.fillRect(400, 90, 80, 60);
    ctx.fillStyle = '#ffecb3';
    ctx.beginPath();
    ctx.arc(430, 115, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('02:47 AM', 520, 115);

    ctx.fillStyle = '#f4f4f9';
    ctx.fillRect(140, 140, 160, 80);
    ctx.fillStyle = '#111';
    ctx.fillRect(170, 150, 50, 30);
    ctx.fillStyle = '#4cc9f0';
    ctx.fillRect(173, 153, 44, 24);
    ctx.fillStyle = '#fff';
    ctx.font = '7px sans-serif';
    ctx.fillText('INTRODUCTION', 176, 162);
    ctx.fillText('METHOD', 176, 170);

    ctx.fillStyle = '#e63946';
    ctx.fillRect(150, 165, 8, 10);
    ctx.fillStyle = '#fff';
    ctx.fillRect(235, 155, 22, 28);
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(265, 170, 12, 16);

    ctx.fillStyle = '#3d2010';
    ctx.fillRect(680, 140, 140, 160);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(690, 145, 120, 35);
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(690, 180, 120, 115);
    ctx.fillStyle = '#e63946';
    for (let bx = 710; bx <= 790; bx += 35) {
      for (let by = 200; by <= 270; by += 30) {
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = '#457b9d';
    ctx.fillRect(680, 340, 110, 120);
    ctx.fillStyle = '#ffe0bd';
    ctx.fillRect(700, 350, 22, 22);
    ctx.fillStyle = '#000';
    ctx.fillRect(698, 345, 26, 10);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('드르렁...', 705, 335);

    drawTaeilSprite(ctx, p.x, p.y, time);
  };

  const drawFall = (ctx: CanvasRenderingContext2D, time: number) => {
    // Serene Azure Falling Sky
    const fallSkyGrad = ctx.createLinearGradient(0, 0, 0, 540);
    fallSkyGrad.addColorStop(0, '#3a86ff');
    fallSkyGrad.addColorStop(0.5, '#48cae4');
    fallSkyGrad.addColorStop(1, '#caf0f8');
    ctx.fillStyle = fallSkyGrad;
    ctx.fillRect(0, 0, 960, 540);

    // Drifting Fluffy Background Clouds (Clean, smooth rendering)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    [
      { x: (time * 1.5) % 1100 - 100, y: 80, r: 40 },
      { x: (time * 2.2 + 300) % 1100 - 100, y: 220, r: 55 },
      { x: (time * 1.8 + 700) % 1100 - 100, y: 380, r: 45 },
    ].forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.arc(c.x + 30, c.y + 10, c.r * 0.75, 0, Math.PI * 2);
      ctx.arc(c.x - 30, c.y + 10, c.r * 0.75, 0, Math.PI * 2);
      ctx.fill();
    });

    // Speed lines rushing upward
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const lineX = (i * 60 + 20) % 940;
      const lineY = (time * 14 + i * 35) % 540;
      ctx.beginPath();
      ctx.moveTo(lineX, lineY);
      ctx.lineTo(lineX, lineY + 40);
      ctx.stroke();
    }

    // Taeil spinning 360 degrees smoothly while falling down
    ctx.save();
    const fallY = 80 + (time * 5) % 360;
    ctx.translate(480, fallY);
    ctx.rotate((time * 0.12) % (Math.PI * 2));
    drawTaeilSprite(ctx, 0, 0, time);
    ctx.restore();
  };

  const drawMeadow = (ctx: CanvasRenderingContext2D, p: any, time: number) => {
    // 1. Serene Azure Sky & Soft Sunlight
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 190);
    skyGrad.addColorStop(0, '#48cae4');
    skyGrad.addColorStop(0.5, '#90e0ef');
    skyGrad.addColorStop(1, '#caf0f8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 960, 190);

    // Fluffy White Clouds Drifting
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    [
      { x: (120 + time * 0.4) % 1100 - 100, y: 50, r: 25 },
      { x: (480 + time * 0.3) % 1100 - 100, y: 70, r: 35 },
      { x: (820 + time * 0.5) % 1100 - 100, y: 40, r: 28 },
    ].forEach((c) => {
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c.x + 20, c.y + 5, c.r * 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c.x - 20, c.y + 5, c.r * 0.7, 0, Math.PI * 2); ctx.fill();
    });

    // Distant Mondstadt Green Mountain Peaks & Windmill Silhouette
    ctx.fillStyle = 'rgba(116, 198, 157, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, 170);
    ctx.lineTo(180, 80);
    ctx.lineTo(380, 170);
    ctx.lineTo(620, 75);
    ctx.lineTo(840, 170);
    ctx.lineTo(960, 110);
    ctx.lineTo(960, 190);
    ctx.lineTo(0, 190);
    ctx.fill();

    // Windmill Silhouette on Distant Peak (x: 620, y: 75)
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(618, 55, 4, 20);
    const bladeAngle = time * 0.02;
    ctx.strokeStyle = '#2d6a4f'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(620 + Math.cos(bladeAngle) * 15, 55 + Math.sin(bladeAngle) * 15);
    ctx.lineTo(620 - Math.cos(bladeAngle) * 15, 55 - Math.sin(bladeAngle) * 15);
    ctx.moveTo(620 + Math.sin(bladeAngle) * 15, 55 - Math.cos(bladeAngle) * 15);
    ctx.lineTo(620 - Math.sin(bladeAngle) * 15, 55 + Math.cos(bladeAngle) * 15);
    ctx.stroke();

    // Lush Sunlit Grass Ground (y=190..540)
    const grassGrad = ctx.createLinearGradient(0, 190, 0, 540);
    grassGrad.addColorStop(0, '#52b788');
    grassGrad.addColorStop(1, '#2d6a4f');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, 190, 960, 350);

    // Dirt Path through Meadow
    ctx.fillStyle = '#d4a373';
    ctx.beginPath();
    ctx.moveTo(0, 290);
    ctx.lineTo(960, 270);
    ctx.lineTo(960, 330);
    ctx.lineTo(0, 350);
    ctx.fill();

    // Windblown Dandelion Fluff & Wildflowers
    for (let i = 0; i < 40; i++) {
      const fx = (i * 29 + Math.sin(time / 20 + i) * 6) % 940 + 10;
      const fy = (i * 19) % 310 + 200;
      const sway = Math.sin(time / 15 + i) * 3;
      ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? '#ffd166' : '#ff758f';
      ctx.beginPath();
      ctx.arc(fx + sway, fy, i % 3 === 0 ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shady Mondstadt Pine Trees on Sides
    [40, 920].forEach((tx) => {
      ctx.fillStyle = '#5c3d2e';
      ctx.fillRect(tx - 8, 170, 16, 60);
      ctx.fillStyle = '#1b4332';
      ctx.beginPath(); ctx.arc(tx, 150, 40, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(tx, 120, 30, 0, Math.PI * 2); ctx.fill();
    });

    drawTeemoSprite(ctx, p.x - 30, p.y + 8, time);
    if (isPoroRescuedRef.current) {
      drawPoroSprite(ctx, poroPosRef.current.x, poroPosRef.current.y, time);
    }

    // Taeil 360-degree falling + Teemo head bump animation sequence
    const elapsed = Date.now() - meadowStartTimeRef.current;
    if (elapsed < 1400) {
      const t = Math.min(1, elapsed / 1100);
      const fallY = -60 + t * (p.y - (-60));
      const spinAngle = t * Math.PI * 4; // 360-deg rotation spin twice!

      ctx.save();
      ctx.translate(p.x, fallY);
      ctx.rotate(spinAngle);
      drawTaeilSprite(ctx, 0, 0, time);
      ctx.restore();

      // Comic head-bump impact effect on Teemo's hat when landing!
      if (t >= 0.85) {
        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 8;
        ctx.fillText('💥 쿵!!', p.x - 15, p.y - 45);
        ctx.shadowBlur = 0;

        // Dizzy stars wobbling over Teemo
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px sans-serif';
        ctx.fillText('💫 💫 💫', p.x - 30, p.y - 30);
      }
    } else {
      drawTaeilSprite(ctx, p.x, p.y, time);
    }

    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('별바람 마을 입구 ▶', 920, 270);
    ctx.fillStyle = 'rgba(255, 255, 0, 0.25)';
    ctx.fillRect(880, 190, 80, 350);
  };

  const drawPoroRescueMap = (ctx: CanvasRenderingContext2D, p: any, time: number) => {
    // 1. Ominous Dark Crimson / Obsidian Storm Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 180);
    skyGrad.addColorStop(0, '#120816');
    skyGrad.addColorStop(0.6, '#281122');
    skyGrad.addColorStop(1, '#3d1c2b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 960, 180);

    // Reddish Ambient Dust & Smoke Particles
    for (let i = 0; i < 25; i++) {
      const sx = (i * 41 + Math.sin(time / 15 + i) * 12) % 940;
      const sy = (i * 23 + Math.cos(time / 15 + i) * 10) % 170;
      ctx.fillStyle = `rgba(230, 57, 70, ${0.2 + Math.sin(time / 10 + i) * 0.15})`;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 3 === 0 ? 3 : 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant Jagged Obsidian Mountain Peaks
    ctx.fillStyle = '#1c101a';
    ctx.beginPath();
    ctx.moveTo(0, 170);
    ctx.lineTo(140, 70);
    ctx.lineTo(280, 170);
    ctx.lineTo(450, 55);
    ctx.lineTo(620, 170);
    ctx.lineTo(790, 65);
    ctx.lineTo(960, 170);
    ctx.lineTo(960, 180);
    ctx.lineTo(0, 180);
    ctx.fill();

    // 2. Dark Scorched Dirt Floor (y=180 to 540)
    const groundGrad = ctx.createLinearGradient(0, 180, 0, 540);
    groundGrad.addColorStop(0, '#2b1b22');
    groundGrad.addColorStop(1, '#150c11');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 180, 960, 360);

    // Ground cracks with glowing red energy lines
    ctx.strokeStyle = 'rgba(230, 57, 70, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(120, 240); ctx.lineTo(180, 280); ctx.lineTo(240, 260);
    ctx.moveTo(500, 320); ctx.lineTo(560, 370); ctx.lineTo(640, 340);
    ctx.moveTo(750, 220); ctx.lineTo(820, 260);
    ctx.stroke();

    // 3. Spiked Wooden Palisade Fortress Walls in Background
    for (let wx = 0; wx < 960; wx += 24) {
      ctx.fillStyle = '#3d261a';
      ctx.beginPath();
      ctx.moveTo(wx, 190);
      ctx.lineTo(wx + 12, 145);
      ctx.lineTo(wx + 24, 190);
      ctx.fill();
      ctx.fillRect(wx, 190, 24, 60);
      ctx.fillStyle = '#24160f';
      ctx.fillRect(wx + 2, 190, 4, 60);
    }
    // Heavy Horizontal Iron Reinforcement Bars on Palisade
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(0, 165, 960, 8);
    ctx.fillRect(0, 210, 960, 8);

    // 4. Hilichurl Watchtowers on Left & Right with Burning Brazier Fire Bowls
    [90, 870].forEach((towerX) => {
      ctx.fillStyle = '#4a2e1b';
      ctx.fillRect(towerX - 18, 120, 10, 140);
      ctx.fillRect(towerX + 8, 120, 10, 140);
      ctx.strokeStyle = '#2b1b0f'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(towerX - 18, 140); ctx.lineTo(towerX + 18, 240);
      ctx.moveTo(towerX + 18, 140); ctx.lineTo(towerX - 18, 240);
      ctx.stroke();

      ctx.fillStyle = '#6b4426';
      ctx.fillRect(towerX - 30, 110, 60, 14);

      // Skull on Stake
      ctx.fillStyle = '#e9ecef';
      ctx.beginPath(); ctx.arc(towerX - 25, 98, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#212529';
      ctx.fillRect(towerX - 27, 98, 2, 2); ctx.fillRect(towerX - 23, 98, 2, 2);

      // Burning Brazier Fire Bowl
      const fireGlow = ctx.createRadialGradient(towerX, 90, 4, towerX, 90, 65);
      fireGlow.addColorStop(0, 'rgba(255, 87, 51, 0.65)');
      fireGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = fireGlow;
      ctx.beginPath(); ctx.arc(towerX, 90, 65, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#111';
      ctx.fillRect(towerX - 12, 100, 24, 10);
      ctx.fillStyle = '#ff5733';
      ctx.beginPath();
      const fSway = Math.sin(time / 4 + towerX) * 4;
      ctx.moveTo(towerX - 10, 100);
      ctx.lineTo(towerX + fSway, 75);
      ctx.lineTo(towerX + 10, 100);
      ctx.fill();
    });

    // 5. Hilichurl Tribal Red Banner in Center
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(450, 160, 60, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👹', 480, 205);

    // 6. Caged Poro / Rescue Gallows
    if (!isPoroRescuedRef.current) {
      drawCageWithPoro(ctx, 740, 260, time);
    }

    drawTeemoSprite(ctx, p.x - 30, p.y + 8, time);
    if (isPoroRescuedRef.current) {
      drawPoroSprite(ctx, poroPosRef.current.x, poroPosRef.current.y, time);
    }
    drawTaeilSprite(ctx, p.x, p.y, time);

    enemiesRef.current.forEach((e) => drawHilichurlSprite(ctx, e, time));
  };

  const drawVillage = (ctx: CanvasRenderingContext2D, p: any, time: number) => {
    // Genshin Mondstadt Town Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
    skyGrad.addColorStop(0, '#588b8b');
    skyGrad.addColorStop(0.5, '#90e0ef');
    skyGrad.addColorStop(1, '#caf0f8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 960, 200);

    // Distant Misty Mountains
    ctx.fillStyle = 'rgba(114, 239, 221, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, 160);
    ctx.lineTo(180, 70);
    ctx.lineTo(360, 160);
    ctx.lineTo(600, 80);
    ctx.lineTo(840, 160);
    ctx.lineTo(960, 110);
    ctx.lineTo(960, 200);
    ctx.lineTo(0, 200);
    ctx.fill();

    // Mid-distance Green Hills
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.lineTo(140, 130);
    ctx.lineTo(320, 200);
    ctx.lineTo(480, 150);
    ctx.lineTo(700, 200);
    ctx.lineTo(960, 140);
    ctx.lineTo(960, 230);
    ctx.lineTo(0, 230);
    ctx.fill();

    // GRAND MONDSTADT WINDMILL
    ctx.save();
    const wX = 760;
    const wY = 110;
    ctx.fillStyle = '#d8f3dc';
    ctx.fillRect(wX - 22, wY, 44, 100);
    ctx.fillStyle = '#52b788';
    ctx.beginPath();
    ctx.moveTo(wX - 28, wY);
    ctx.lineTo(wX, wY - 35);
    ctx.lineTo(wX + 28, wY);
    ctx.fill();
    ctx.translate(wX, wY + 25);
    ctx.rotate(time * 0.02);
    ctx.fillStyle = '#7f4f24';
    for (let b = 0; b < 4; b++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(-3, 0, 6, 60);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(3, 10, 16, 45);
      ctx.fillStyle = '#7f4f24';
    }
    ctx.restore();

    // Cobblestone Square
    ctx.fillStyle = '#b7e4c7';
    ctx.fillRect(0, 200, 960, 340);

    ctx.strokeStyle = 'rgba(45, 106, 79, 0.2)';
    ctx.lineWidth = 1;
    for (let cy = 200; cy < 540; cy += 30) {
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(960, cy);
      ctx.stroke();
    }
    for (let cx = 0; cx < 960; cx += 40) {
      ctx.beginPath();
      ctx.moveTo(cx, 200);
      ctx.lineTo(cx, 540);
      ctx.stroke();
    }

    ctx.fillStyle = '#d8f3dc';
    ctx.fillRect(0, 260, 960, 80);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 260, 960, 6);
    ctx.fillRect(0, 334, 960, 6);

    // 1. Resident Center (Katheryne)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(90, 200, 160, 15);
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(100, 110, 140, 95);
    ctx.fillStyle = '#3d261c';
    ctx.fillRect(100, 110, 140, 6);
    ctx.fillRect(100, 155, 140, 6);
    ctx.fillRect(100, 200, 140, 5);
    ctx.fillRect(100, 110, 8, 95);
    ctx.fillRect(232, 110, 8, 95);
    ctx.fillRect(166, 110, 8, 95);
    ctx.fillStyle = '#d90429';
    ctx.beginPath();
    ctx.moveTo(80, 110);
    ctx.lineTo(170, 40);
    ctx.lineTo(260, 110);
    ctx.fill();
    ctx.fillStyle = '#ef233c';
    ctx.beginPath();
    ctx.moveTo(170, 40);
    ctx.lineTo(260, 110);
    ctx.lineTo(170, 110);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('주민센터', 170, 135);
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(105, 125, 5, 0, Math.PI * 2);
    ctx.arc(235, 125, 5, 0, Math.PI * 2);
    ctx.fill();

    drawKatheryneSprite(ctx, 300, 190, time);

    // 2. Cinnamoroll Bakery "별구름 디저트"
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(650, 185, 150, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(660, 120, 130, 65);
    for (let aw = 650; aw < 790; aw += 20) {
      ctx.fillStyle = (aw / 20) % 2 === 0 ? '#ffb3c1' : '#ffffff';
      ctx.fillRect(aw, 100, 20, 25);
    }
    ctx.fillStyle = '#8338ec';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('별구름 디저트', 725, 118);
    ctx.fillStyle = '#7f4f24';
    ctx.fillRect(665, 150, 120, 30);
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(680, 155, 14, 14);
    ctx.fillRect(720, 155, 14, 14);
    drawCinnamorollSprite(ctx, 735, 190, time);

    // 3. Tahm Kench Restaurant "탐켄치 식당"
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(790, 305, 150, 10);
    ctx.fillStyle = '#ffb5a7';
    ctx.fillRect(800, 270, 140, 35);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('탐켄치의 한입식당', 870, 292);
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(880, 370, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(875, 335 - (time % 20), 10, 12);
    drawTahmKenchSprite(ctx, 840, 340, time);

    // 4. Central Multi-Tiered Stone Fountain
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(480, 425, 55, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6c757d';
    ctx.beginPath();
    ctx.ellipse(480, 410, 50, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00b4d8';
    ctx.beginPath();
    ctx.ellipse(480, 410, 42, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#495057';
    ctx.fillRect(474, 375, 12, 35);
    ctx.fillStyle = '#90e0ef';
    ctx.beginPath();
    ctx.arc(480, 370, 8 + Math.sin(time / 5) * 2, 0, Math.PI * 2);
    ctx.fill();

    // 5. FESTIVE BUNTING
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(250, 110);
    ctx.quadraticCurveTo(450, 160, 650, 110);
    ctx.stroke();
    for (let b = 280; b < 630; b += 35) {
      const bY = 110 + Math.sin((b - 250) / 400 * Math.PI) * 45;
      ctx.fillStyle = b % 70 === 0 ? '#ff4d6d' : b % 105 === 0 ? '#ffb703' : '#4cc9f0';
      ctx.beginPath();
      ctx.moveTo(b - 6, bY);
      ctx.lineTo(b + 6, bY);
      ctx.lineTo(b, bY + 14);
      ctx.fill();
    }

    // Keqing (각청) at Lottery Stall!
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(180, 320, 90, 40);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('축제 복권', 225, 335);
    drawKeqingSprite(ctx, 225, 320, time);

    const purpleX = 580 + Math.cos(time / 20) * 15;
    drawPurpleGirlSprite(ctx, purpleX, 220, time);

    if (!isPoroRescuedRef.current) {
      drawPoroSprite(ctx, 540, 320, time);
    }

    drawTeemoSprite(ctx, p.x - 30, p.y + 8, time);
    if (isPoroRescuedRef.current) {
      drawPoroSprite(ctx, poroPosRef.current.x, poroPosRef.current.y, time);
    }
    drawTaeilSprite(ctx, p.x, p.y, time);
  };

  const drawFruitMap = (ctx: CanvasRenderingContext2D, p: any, time: number) => {
    // Forest Sky Gradient & Sunbeams
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 180);
    skyGrad.addColorStop(0, '#1b4332');
    skyGrad.addColorStop(0.7, '#2d6a4f');
    skyGrad.addColorStop(1, '#40916c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 960, 180);

    // Distant Mountain Ridges & Pine Trees
    ctx.fillStyle = 'rgba(27, 67, 50, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, 150);
    ctx.lineTo(200, 70);
    ctx.lineTo(450, 150);
    ctx.lineTo(720, 80);
    ctx.lineTo(960, 150);
    ctx.lineTo(960, 180);
    ctx.lineTo(0, 180);
    ctx.fill();

    // Forest Ground with Dirt Pathway
    ctx.fillStyle = '#40916c';
    ctx.fillRect(0, 180, 960, 360);

    // Dirt Path
    ctx.fillStyle = '#7f4f24';
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.quadraticCurveTo(480, 240, 960, 320);
    ctx.lineTo(960, 380);
    ctx.quadraticCurveTo(480, 300, 0, 360);
    ctx.fill();

    // Sunbeams filtering through leaves
    ctx.fillStyle = 'rgba(255, 255, 200, 0.12)';
    ctx.beginPath();
    ctx.moveTo(200, 0);
    ctx.lineTo(350, 540);
    ctx.lineTo(420, 540);
    ctx.lineTo(270, 0);
    ctx.fill();

    // 3 Grand Apple Trees with hanging red Sunset Fruits (일몰열매)
    drawAppleTreeSprite(ctx, 240, 220, time, '사과나무 (일몰열매 #1) [E]');
    drawAppleTreeSprite(ctx, 520, 200, time, '사과나무 (일몰열매 #2) [E]');
    drawAppleTreeSprite(ctx, 780, 240, time, '사과나무 (일몰열매 #3) [E]');

    drawTeemoSprite(ctx, p.x - 30, p.y + 8, time);
    if (isPoroRescuedRef.current) {
      drawPoroSprite(ctx, poroPosRef.current.x, poroPosRef.current.y, time);
    }
    drawTaeilSprite(ctx, p.x, p.y, time);
  };

  const drawMushroomMap = (ctx: CanvasRenderingContext2D, p: any, time: number) => {
    // 1. Deep Bioluminescent Canyon Atmosphere (Sky / Background Gradient)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 300);
    skyGrad.addColorStop(0, '#060a17');
    skyGrad.addColorStop(0.5, '#0f2438');
    skyGrad.addColorStop(1, '#164e63');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 960, 540);

    // 2. Distant Jagged Mountain Peaks in Fog
    ctx.fillStyle = '#101f33';
    ctx.beginPath();
    ctx.moveTo(0, 180);
    ctx.lineTo(140, 80);
    ctx.lineTo(320, 190);
    ctx.lineTo(520, 90);
    ctx.lineTo(740, 180);
    ctx.lineTo(960, 100);
    ctx.lineTo(960, 240);
    ctx.lineTo(0, 240);
    ctx.fill();

    // 3. Layered Canyon Cliffs (Left & Right Flanks)
    const cliffGrad = ctx.createLinearGradient(0, 0, 200, 0);
    cliffGrad.addColorStop(0, '#1c2541');
    cliffGrad.addColorStop(1, '#0b132b');
    ctx.fillStyle = cliffGrad;

    // Left Cliff Wall
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(220, 0);
    ctx.lineTo(170, 220);
    ctx.lineTo(240, 360);
    ctx.lineTo(150, 540);
    ctx.lineTo(0, 540);
    ctx.fill();

    // Right Cliff Wall
    ctx.beginPath();
    ctx.moveTo(960, 0);
    ctx.lineTo(740, 0);
    ctx.lineTo(790, 240);
    ctx.lineTo(720, 380);
    ctx.lineTo(810, 540);
    ctx.lineTo(960, 540);
    ctx.fill();

    // Creeping Bioluminescent Cyan Moss on Cliffs
    ctx.fillStyle = 'rgba(0, 245, 212, 0.35)';
    ctx.fillRect(80, 80, 50, 280);
    ctx.fillRect(780, 120, 60, 300);

    // 4. GIANT BACKGROUND BIOLUMINESCENT MUSHROOMS (Height ~140px!)
    [
      { x: 140, y: 220, capCol: '#00f5d4', stemCol: '#155d57', scale: 1.1 },
      { x: 820, y: 200, capCol: '#7209b7', stemCol: '#3c096c', scale: 1.3 },
      { x: 480, y: 160, capCol: '#4cc9f0', stemCol: '#1d4e89', scale: 0.9 },
    ].forEach((m) => {
      ctx.save();
      // Stem
      ctx.fillStyle = m.stemCol;
      ctx.fillRect(m.x - 12 * m.scale, m.y - 60 * m.scale, 24 * m.scale, 65 * m.scale);
      // Cap Dome
      ctx.fillStyle = m.capCol;
      ctx.beginPath();
      ctx.arc(m.x, m.y - 60 * m.scale, 45 * m.scale, Math.PI, 0);
      ctx.fill();
      // Spots on Cap
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(m.x - 20 * m.scale, m.y - 75 * m.scale, 6 * m.scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(m.x + 15 * m.scale, m.y - 80 * m.scale, 8 * m.scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(m.x, m.y - 92 * m.scale, 5 * m.scale, 0, Math.PI * 2); ctx.fill();
      // Bioluminescent Glow Pulse
      const glowGrad = ctx.createRadialGradient(m.x, m.y - 60 * m.scale, 10, m.x, m.y - 60 * m.scale, 70 * m.scale);
      glowGrad.addColorStop(0, 'rgba(0, 245, 212, 0.4)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(m.x, m.y - 60 * m.scale, 70 * m.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. Ancient Weathered Mondstadt Stone Pillars & Arch
    ctx.fillStyle = '#2d3a4e';
    ctx.fillRect(220, 110, 45, 140);
    ctx.fillRect(695, 90, 45, 160);
    // Gold Rune Inlays on Pillars
    ctx.fillStyle = '#00f5d4';
    ctx.fillRect(238, 130, 8, 100);
    ctx.fillRect(713, 110, 8, 120);

    // 6. Canyon Floor Dirt & Moss Path (y=210 to 540)
    const groundGrad = ctx.createLinearGradient(0, 210, 0, 540);
    groundGrad.addColorStop(0, '#101d28');
    groundGrad.addColorStop(1, '#080d12');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 210, 960, 330);

    // Winding Cobblestone Dirt Path
    ctx.fillStyle = '#1e2d3b';
    ctx.beginPath();
    ctx.moveTo(180, 210);
    ctx.lineTo(260, 210);
    ctx.lineTo(380, 540);
    ctx.lineTo(220, 540);
    ctx.fill();

    // 7. Floating Glowing Spore Particles
    for (let i = 0; i < 35; i++) {
      const sx = (i * 37 + Math.sin(time / 20 + i) * 15) % 940;
      const sy = (i * 29 + Math.cos(time / 20 + i) * 15) % 520;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(0, 245, 212, 0.75)' : 'rgba(255, 215, 0, 0.65)';
      ctx.beginPath();
      ctx.arc(sx, sy, i % 3 === 0 ? 3 : 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. 3 INTERACTIVE MEMORY MUSHROOMS (`기억의 버섯`) WITH 3D SHADING
    drawMushroomSprite(ctx, 280, 270, time, '기억의 버섯 #1 [E]');
    drawMushroomSprite(ctx, 520, 370, time, '기억의 버섯 #2 [E]');
    drawMushroomSprite(ctx, 740, 260, time, '기억의 버섯 #3 [E]');

    drawTeemoSprite(ctx, p.x - 30, p.y + 8, time);
    if (isPoroRescuedRef.current) {
      drawPoroSprite(ctx, poroPosRef.current.x, poroPosRef.current.y, time);
    }
    drawTaeilSprite(ctx, p.x, p.y, time);

    enemiesRef.current.forEach((e) => drawHilichurlSprite(ctx, e, time));
  };

  const drawRiverMap = (ctx: CanvasRenderingContext2D, p: any, time: number) => {
    // Sky & Distant Mountain Ridge
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 180);
    skyGrad.addColorStop(0, '#52b788');
    skyGrad.addColorStop(0.6, '#90e0ef');
    skyGrad.addColorStop(1, '#caf0f8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 960, 180);

    ctx.fillStyle = 'rgba(72, 202, 228, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, 160);
    ctx.lineTo(250, 80);
    ctx.lineTo(500, 160);
    ctx.lineTo(750, 70);
    ctx.lineTo(960, 160);
    ctx.lineTo(960, 180);
    ctx.lineTo(0, 180);
    ctx.fill();

    // Grass Riverbank Floor
    ctx.fillStyle = '#52b788';
    ctx.fillRect(0, 180, 960, 360);

    // Field of Varied Colorful Wildflowers (Non-glowing)
    const wildflowers = [
      { x: 80, y: 220, color: '#e63946' },
      { x: 140, y: 270, color: '#4cc9f0' },
      { x: 210, y: 230, color: '#f72585' },
      { x: 280, y: 310, color: '#7209b7' },
      { x: 330, y: 225, color: '#ffffff' },
      { x: 360, y: 290, color: '#ffb703' },
      { x: 480, y: 300, color: '#e63946' },
      { x: 540, y: 235, color: '#4cc9f0' },
      { x: 610, y: 285, color: '#f72585' },
      { x: 680, y: 220, color: '#ffffff' },
      { x: 740, y: 295, color: '#7209b7' },
      { x: 810, y: 245, color: '#ffb703' },
      { x: 870, y: 290, color: '#e63946' },
      { x: 920, y: 230, color: '#4cc9f0' },
    ];
    wildflowers.forEach((wf) => {
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(wf.x, wf.y, 2, 10);
      ctx.fillStyle = wf.color;
      ctx.beginPath();
      ctx.arc(wf.x + 1, wf.y - 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffee83';
      ctx.beginPath();
      ctx.arc(wf.x + 1, wf.y - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Animated River with Water Currents
    ctx.fillStyle = '#0077b6';
    ctx.fillRect(0, 350, 960, 100);
    ctx.fillStyle = '#90e0ef';
    for (let x = (time * 1.5) % 60; x < 960; x += 60) {
      ctx.fillRect(x, 375, 24, 4);
      ctx.fillRect(x + 20, 410, 18, 3);
    }

    // Cobblestone River Bridge / Bank Wall
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(0, 345, 960, 8);

    // Shady Oak Tree on Left
    ctx.fillStyle = '#5c3d2e';
    ctx.fillRect(120, 150, 30, 90);
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.arc(135, 120, 55, 0, Math.PI * 2);
    ctx.fill();

    // Wooden Bench under Oak Tree
    ctx.fillStyle = '#7f4f24';
    ctx.fillRect(450, 240, 80, 25);
    ctx.fillStyle = '#4a2b0f';
    ctx.fillRect(455, 235, 70, 5);

    // ONLY SWEET FLOWER (달콤달콤 꽃) GLOWS RADIANTLY!
    drawSweetFlowerSprite(ctx, 400, 250, time, '달콤달콤 꽃 [E]');

    drawTeemoSprite(ctx, p.x - 30, p.y + 8, time);
    if (isPoroRescuedRef.current) {
      drawPoroSprite(ctx, poroPosRef.current.x, poroPosRef.current.y, time);
    }
    drawTaeilSprite(ctx, p.x, p.y, time);
  };

  const drawDungeonMap = (ctx: CanvasRenderingContext2D, p: any, time: number) => {
    // 1. Deep Cavern Obsidian/Basalt Wall Background
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, 0, 960, 540);

    // Stone Wall Block Grid Pattern
    ctx.strokeStyle = '#1b2028';
    ctx.lineWidth = 1;
    for (let wy = 0; wy < 230; wy += 35) {
      ctx.beginPath(); ctx.moveTo(0, wy); ctx.lineTo(960, wy); ctx.stroke();
      const offsetX = (wy / 35) % 2 === 0 ? 0 : 40;
      for (let wx = offsetX; wx < 960; wx += 80) {
        ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + 35); ctx.stroke();
      }
    }

    // Wall Rune Carvings
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(480, 100, 60, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Cavern Floor Polished Basalt Tiles (y=210 to 540)
    const floorGrad = ctx.createLinearGradient(0, 210, 0, 540);
    floorGrad.addColorStop(0, '#1b2028');
    floorGrad.addColorStop(1, '#0e1116');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 210, 960, 330);

    // Floor Tile Grid
    ctx.strokeStyle = '#28303d';
    ctx.lineWidth = 1;
    for (let fx = 0; fx < 960; fx += 80) {
      ctx.beginPath(); ctx.moveTo(fx, 210); ctx.lineTo(fx, 540); ctx.stroke();
    }
    for (let fy = 210; fy < 540; fy += 50) {
      ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(960, fy); ctx.stroke();
    }

    // 3. 4 Massive Fluted Stone Columns with Ornate Capitals
    [120, 260, 700, 840].forEach((colX) => {
      // Column Base & Shaft
      ctx.fillStyle = '#2c3340';
      ctx.fillRect(colX - 20, 60, 40, 380);
      ctx.fillStyle = '#3f495c';
      ctx.fillRect(colX - 18, 60, 8, 380);
      // Capital & Base Trim
      ctx.fillStyle = '#4f5b73';
      ctx.fillRect(colX - 26, 60, 52, 16);
      ctx.fillRect(colX - 24, 430, 48, 14);
    });

    // 4. Wall Torches with Dynamic Flames & Warm Lighting Halos
    [190, 770].forEach((tX) => {
      // Sconce Bracket
      ctx.fillStyle = '#b8860b';
      ctx.fillRect(tX - 4, 120, 8, 25);
      ctx.fillRect(tX - 10, 120, 20, 6);

      // Light Radial Glow
      const torchGrad = ctx.createRadialGradient(tX, 105, 5, tX, 105, 120);
      torchGrad.addColorStop(0, 'rgba(255, 183, 3, 0.55)');
      torchGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = torchGrad;
      ctx.beginPath();
      ctx.arc(tX, 105, 120, 0, Math.PI * 2);
      ctx.fill();

      // Flame Flickering
      const flameOffset = Math.sin(time / 8 + tX) * 2.5;
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath(); ctx.arc(tX, 108 + flameOffset, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(tX, 106 + flameOffset, 4, 0, Math.PI * 2); ctx.fill();
    });

    // 5. Center Shrine Altar Platform (y=160..220)
    ctx.fillStyle = '#1c222e';
    ctx.fillRect(360, 175, 240, 45);
    ctx.fillStyle = '#374154';
    ctx.fillRect(350, 210, 260, 15);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(360, 175, 240, 4); // Gold trim

    // 6. Radiant Divine Light Beam Shining Down on Treasure Chest
    const beamGrad = ctx.createLinearGradient(480, 0, 480, 230);
    beamGrad.addColorStop(0, 'rgba(255, 215, 0, 0.35)');
    beamGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(430, 0);
    ctx.lineTo(530, 0);
    ctx.lineTo(560, 230);
    ctx.lineTo(400, 230);
    ctx.fill();

    // 7. GRAND ORNATE GOLDEN TREASURE CHEST (보물상자)
    ctx.save();
    const cX = 480;
    const cY = 195;

    // Chest Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(cX, cY + 25, 45, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chest Body (Gold & Wood Trim)
    ctx.fillStyle = '#8d5b12';
    ctx.fillRect(cX - 32, cY - 12, 64, 38);
    ctx.fillStyle = '#ffd700'; // Gold lid dome
    ctx.beginPath();
    ctx.arc(cX, cY - 12, 32, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cX - 32, cY - 12, 64, 6);

    // Gold Lock & Ruby Keyhole
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(cX - 8, cY - 4, 16, 16);
    ctx.fillStyle = '#d90429';
    ctx.fillRect(cX - 4, cY, 8, 8);

    // Sparkling Treasure Aura
    for (let i = 0; i < 4; i++) {
      const spX = cX - 40 + (i * 25);
      const spY = cY - 30 + Math.sin(time / 10 + i) * 6;
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.fillText('✦', spX, spY);
    }

    // Label Tag
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('고대 유적 보물상자 [E]', cX, cY + 45);
    ctx.restore();

    drawTeemoSprite(ctx, p.x - 30, p.y + 8, time);
    if (isPoroRescuedRef.current) {
      drawPoroSprite(ctx, poroPosRef.current.x, poroPosRef.current.y, time);
    }
    drawTaeilSprite(ctx, p.x, p.y, time);

    enemiesRef.current.forEach((e) => drawHilichurlSprite(ctx, e, time));
  };

  const drawSunsetMap = (ctx: CanvasRenderingContext2D, p: any, time: number) => {
    // Cosmic Nebula Galaxy Sky Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 540);
    bgGrad.addColorStop(0, '#03071e');
    bgGrad.addColorStop(0.3, '#370617');
    bgGrad.addColorStop(0.7, '#6b0071');
    bgGrad.addColorStop(1, '#10002b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 960, 540);

    // Swirling Nebula Cloud Blends
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const nGrad = ctx.createRadialGradient(480, 200, 50, 480, 200, 400);
    nGrad.addColorStop(0, 'rgba(255, 0, 110, 0.35)');
    nGrad.addColorStop(0.5, 'rgba(131, 56, 236, 0.25)');
    nGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nGrad;
    ctx.fillRect(0, 0, 960, 540);
    ctx.restore();

    // Twinkling Stars & Shooting Star Streaks
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 80; i++) {
      const sx = (i * 43 + Math.sin(time / 15 + i) * 3) % 960;
      const sy = (i * 31 + Math.cos(time / 15 + i) * 3) % 400;
      const size = i % 3 === 0 ? 3 : 1.5;
      ctx.fillRect(sx, sy, size, size);
    }

    const starX = (time * 8) % 1200 - 200;
    const starY = (time * 4) % 600 - 100;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(starX, starY);
    ctx.lineTo(starX - 60, starY - 30);
    ctx.stroke();

    // Distant Mountain Silhouettes
    ctx.fillStyle = 'rgba(58, 12, 163, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, 280);
    ctx.lineTo(200, 180);
    ctx.lineTo(440, 280);
    ctx.lineTo(700, 160);
    ctx.lineTo(960, 280);
    ctx.lineTo(960, 360);
    ctx.lineTo(0, 360);
    ctx.fill();

    // CELESTIAL MILKY WAY HIGHWAY (은하수 길)
    const roadGrad = ctx.createLinearGradient(0, 240, 0, 380);
    roadGrad.addColorStop(0, 'rgba(224, 170, 255, 0.45)');
    roadGrad.addColorStop(0.5, 'rgba(157, 78, 221, 0.6)');
    roadGrad.addColorStop(1, 'rgba(60, 9, 108, 0.45)');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, 240, 960, 130);

    ctx.fillStyle = '#ffc6ff';
    ctx.fillRect(0, 238, 960, 4);
    ctx.fillRect(0, 368, 960, 4);

    // Floating Stardust Particles
    ctx.fillStyle = '#e0aaff';
    for (let pIdx = 0; pIdx < 35; pIdx++) {
      const px = (pIdx * 29 + time * 2) % 960;
      const py = 250 + (pIdx * 11) % 110 + Math.sin(time / 8 + pIdx) * 6;
      ctx.fillRect(px, py, 3, 3);
    }

    ctx.fillStyle = '#ffc6ff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌌 은하수 노을빛 길 (Milky Way Road)', 480, 210);

    drawKeqingSprite(ctx, 380, 290, time);
    drawPurpleGirlSprite(ctx, 520, 290, time);

    drawTeemoSprite(ctx, p.x - 30, p.y + 8, time);
    if (isPoroRescuedRef.current) {
      drawPoroSprite(ctx, poroPosRef.current.x, poroPosRef.current.y, time);
    }
    drawTaeilSprite(ctx, p.x, p.y, time);
  };

  const drawMansionExtMap = (ctx: CanvasRenderingContext2D, p: any, time: number) => {
    // Night Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
    skyGrad.addColorStop(0, '#03071e');
    skyGrad.addColorStop(1, '#1a1c2e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 960, 200);

    // Pine Trees Flanking the Pathway
    ctx.fillStyle = '#1b4332';
    ctx.fillRect(0, 180, 960, 360);

    // Cobblestone Cottage Dirt Pathway leading to Mansion Door
    ctx.fillStyle = '#d8f3dc';
    ctx.beginPath();
    ctx.moveTo(100, 540);
    ctx.lineTo(250, 540);
    ctx.lineTo(690, 310);
    ctx.lineTo(670, 250);
    ctx.lineTo(550, 250);
    ctx.closePath();
    ctx.fill();

    // Wooden Fences along Path
    ctx.fillStyle = '#7f4f24';
    for (let fx = 150; fx < 600; fx += 50) {
      ctx.fillRect(fx, 340, 6, 25);
      ctx.fillRect(fx - 10, 345, 50, 4);
    }

    // Warm Wooden Post Lanterns
    [300, 500].forEach((lx) => {
      ctx.fillStyle = '#4a2b0f';
      ctx.fillRect(lx, 290, 8, 40);
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(lx + 4, 285, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // GRAND EUROPEAN MANSION FACADE (오두막/대저택)
    ctx.fillStyle = '#582f0e';
    ctx.fillRect(640, 180, 140, 120);
    ctx.fillStyle = '#9a8c98'; // Roof
    ctx.beginPath();
    ctx.moveTo(620, 180);
    ctx.lineTo(710, 110);
    ctx.lineTo(800, 180);
    ctx.fill();

    // Door
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(690, 240, 40, 60);

    drawTeemoSprite(ctx, p.x - 30, p.y + 8, time);
    drawTaeilSprite(ctx, p.x, p.y, time);
  };

  const drawPartyMap = (ctx: CanvasRenderingContext2D, p: any, time: number) => {
    // 1. Luxury Mansion Wallpaper (Light Yellow & Gold Silk Stripe)
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(0, 0, 960, 540);

    for (let x = 0; x < 960; x += 40) {
      ctx.fillStyle = (x / 40) % 2 === 0 ? '#fff3c4' : '#fffbeb';
      ctx.fillRect(x, 0, 40, 240);
      // Gold pinstripes
      ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.fillRect(x + 38, 0, 2, 240);
    }

    // Wood Trim / Crown Molding at Wall Base (y=230)
    ctx.fillStyle = '#653c15';
    ctx.fillRect(0, 230, 960, 15);
    ctx.fillStyle = '#9c6628';
    ctx.fillRect(0, 230, 960, 4);
    ctx.fillStyle = '#3d2208';
    ctx.fillRect(0, 243, 960, 2);

    // 2. Polished Cream & Gold Marble Floor (y=245 to 540)
    const floorGrad = ctx.createLinearGradient(0, 245, 0, 540);
    floorGrad.addColorStop(0, '#fbf3d5');
    floorGrad.addColorStop(1, '#e8d2a0');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 245, 960, 295);

    // Marble tile grid lines
    ctx.strokeStyle = 'rgba(180, 140, 60, 0.3)';
    ctx.lineWidth = 1;
    for (let tx = 0; tx < 960; tx += 80) {
      ctx.beginPath();
      ctx.moveTo(tx, 245);
      ctx.lineTo(tx, 540);
      ctx.stroke();
    }
    for (let ty = 245; ty < 540; ty += 60) {
      ctx.beginPath();
      ctx.moveTo(0, ty);
      ctx.lineTo(960, ty);
      ctx.stroke();
    }

    // 3. Grand Royal Red & Gold Carpet Runway in Center
    const carpetGrad = ctx.createLinearGradient(340, 0, 620, 0);
    carpetGrad.addColorStop(0, '#b7094c');
    carpetGrad.addColorStop(0.1, '#d90429');
    carpetGrad.addColorStop(0.5, '#ef233c');
    carpetGrad.addColorStop(0.9, '#d90429');
    carpetGrad.addColorStop(1, '#b7094c');
    ctx.fillStyle = carpetGrad;
    ctx.fillRect(360, 245, 240, 295);

    // Gold Tassel Borders on Carpet
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(355, 245, 5, 295);
    ctx.fillRect(600, 245, 5, 295);
    for (let cy = 250; cy < 540; cy += 12) {
      ctx.fillRect(350, cy, 5, 4);
      ctx.fillRect(605, cy, 5, 4);
    }

    // 4. Stained Glass Windows in Wall Background
    [100, 860].forEach((winX) => {
      ctx.fillStyle = '#3d2208';
      ctx.fillRect(winX - 45, 30, 90, 150);
      ctx.fillStyle = '#0f2b46';
      ctx.fillRect(winX - 40, 35, 80, 140);

      // Glass arch pattern
      const winGrad = ctx.createRadialGradient(winX, 100, 10, winX, 100, 60);
      winGrad.addColorStop(0, '#ffd166');
      winGrad.addColorStop(0.5, '#4cc9f0');
      winGrad.addColorStop(1, '#7209b7');
      ctx.fillStyle = winGrad;
      ctx.beginPath();
      ctx.arc(winX, 85, 35, 0, Math.PI * 2);
      ctx.fill();

      // Window Frame Bars
      ctx.strokeStyle = '#3d2208';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(winX, 35); ctx.lineTo(winX, 175);
      ctx.moveTo(winX - 40, 100); ctx.lineTo(winX + 40, 100);
      ctx.stroke();
    });

    // 5. Grand Crystal Chandeliers with Warm Lighting Glow
    [260, 700].forEach((chanX) => {
      // Chain
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(chanX, 0); ctx.lineTo(chanX, 40);
      ctx.stroke();

      // Light Radial Aura
      const lightGrad = ctx.createRadialGradient(chanX, 60, 5, chanX, 60, 120);
      lightGrad.addColorStop(0, 'rgba(255, 225, 120, 0.45)');
      lightGrad.addColorStop(1, 'rgba(255, 225, 120, 0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.arc(chanX, 60, 120, 0, Math.PI * 2);
      ctx.fill();

      // Chandelier Structure
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(chanX - 35, 40, 70, 8);
      ctx.fillRect(chanX - 25, 48, 50, 6);

      // Crystals
      for (let i = -30; i <= 30; i += 12) {
        const cryY = 54 + Math.abs(i) * 0.3;
        ctx.fillStyle = time % 10 < 5 ? '#ffffff' : '#ffd700';
        ctx.beginPath();
        ctx.arc(chanX + i, cryY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Candle flame
        const flameFlicker = Math.sin(time / 4 + i) * 2;
        ctx.fillStyle = '#ff7b00';
        ctx.beginPath();
        ctx.arc(chanX + i, 36 + flameFlicker, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.arc(chanX + i, 36 + flameFlicker, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 6. Luxury Party Bunting & Hanging Star Streamers
    for (let bx = 0; bx < 960; bx += 40) {
      const bColor = bx % 80 === 0 ? '#ff4d6d' : bx % 120 === 0 ? '#4cc9f0' : '#ffd166';
      const bY = 15 + Math.sin(bx * 0.05) * 8;
      ctx.fillStyle = bColor;
      ctx.beginPath();
      ctx.moveTo(bx, bY);
      ctx.lineTo(bx + 20, bY + 25);
      ctx.lineTo(bx + 40, bY);
      ctx.fill();
    }

    // Colorful Balloon Clusters Floating in Ceiling Corners
    const floatOffset = Math.sin(time / 15) * 6;
    [
      { x: 50, y: 120, col: '#ff4d6d' }, { x: 75, y: 100, col: '#ffd166' }, { x: 30, y: 95, col: '#4cc9f0' },
      { x: 910, y: 120, col: '#7209b7' }, { x: 885, y: 100, col: '#ff4d6d' }, { x: 930, y: 95, col: '#06d6a0' }
    ].forEach((b) => {
      ctx.fillStyle = b.col;
      ctx.beginPath();
      ctx.arc(b.x, b.y + floatOffset, 16, 0, Math.PI * 2);
      ctx.fill();
      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(b.x - 5, b.y - 5 + floatOffset, 4, 0, Math.PI * 2);
      ctx.fill();
      // String
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + 16 + floatOffset);
      ctx.lineTo(b.x, b.y + 45 + floatOffset);
      ctx.stroke();
    });

    // 7. Grand Center Stage Platform & Red Velvet Arch (Lowered slightly)
    ctx.fillStyle = '#5c2d13';
    ctx.fillRect(320, 205, 320, 65);
    ctx.fillStyle = '#8d4a23';
    ctx.fillRect(325, 210, 310, 55);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(320, 205, 320, 5); // Stage lip

    // 8. Main Birthday Banner
    ctx.fillStyle = '#ff4d6d';
    ctx.fillRect(260, 45, 440, 45);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(263, 48, 434, 39);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 HAPPY 26TH BIRTHDAY TAEIL! 🎉', 480, 76);

    // 9. GRAND 4-TIERED BIRTHDAY CAKE WITH 26 CANDLES & SUNSET FRUITS (Lowered to y=215)
    const cakeX = 480;
    const cakeBaseY = 215;

    // Table under cake
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(410, cakeBaseY, 140, 18);
    ctx.fillStyle = '#ff4d6d';
    ctx.fillRect(410, cakeBaseY + 5, 140, 4);

    // Tier 1 (Bottom)
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(425, cakeBaseY - 28, 110, 28);
    ctx.fillStyle = '#ff758f';
    ctx.fillRect(425, cakeBaseY - 10, 110, 6);

    // Tier 2
    ctx.fillStyle = '#ffc6ff';
    ctx.fillRect(440, cakeBaseY - 50, 80, 22);
    ctx.fillStyle = '#9bf6ff';
    ctx.fillRect(440, cakeBaseY - 38, 80, 5);

    // Tier 3
    ctx.fillStyle = '#fdffb6';
    ctx.fillRect(452, cakeBaseY - 68, 56, 18);
    ctx.fillStyle = '#ffadad';
    ctx.fillRect(452, cakeBaseY - 58, 56, 4);

    // Tier 4 (Top)
    ctx.fillStyle = '#caffbf';
    ctx.fillRect(464, cakeBaseY - 82, 32, 14);

    // Sunset Fruit Topping on Top Tier
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath();
    ctx.arc(480, cakeBaseY - 86, 6, 0, Math.PI * 2);
    ctx.fill();

    // 26 CANDLES ON THE CAKE!
    for (let c = 0; c < 26; c++) {
      const tierIndex = c < 10 ? 0 : c < 18 ? 1 : c < 23 ? 2 : 3;
      let candX = 0;
      let candY = 0;

      if (tierIndex === 0) {
        candX = 430 + (c % 10) * 11;
        candY = cakeBaseY - 34;
      } else if (tierIndex === 1) {
        candX = 444 + ((c - 10) % 8) * 10;
        candY = cakeBaseY - 56;
      } else if (tierIndex === 2) {
        candX = 456 + ((c - 18) % 5) * 11;
        candY = cakeBaseY - 74;
      } else {
        candX = 468 + ((c - 23) % 3) * 12;
        candY = cakeBaseY - 88;
      }

      // Candle Stick
      ctx.fillStyle = c % 2 === 0 ? '#e63946' : '#4cc9f0';
      ctx.fillRect(candX - 1, candY, 3, 8);

      // Flame
      const flameOffset = Math.sin(time / 5 + c) * 1.5;
      ctx.fillStyle = '#ffbe0b';
      ctx.beginPath();
      ctx.arc(candX, candY - 3 + flameOffset, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff006e';
      ctx.beginPath();
      ctx.arc(candX, candY - 2 + flameOffset, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // 10. Tahm Kench's Giant Feast Soup Pot & Banquet Table (Left side)
    ctx.fillStyle = '#3a5a40';
    ctx.fillRect(120, 230, 140, 15);
    ctx.fillStyle = '#a3b18a';
    ctx.fillRect(120, 235, 140, 3);

    // Giant Golden Soup Pot
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(190, 220, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(190, 215, 18, 0, Math.PI * 2);
    ctx.fill();
    // Steaming Broth Bubbles & Mushrooms floating
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath(); ctx.arc(182 + Math.sin(time / 8) * 3, 213, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#00f5d4';
    ctx.beginPath(); ctx.arc(198 + Math.cos(time / 8) * 3, 216, 4, 0, Math.PI * 2); ctx.fill();

    // 11. Gift Boxes & Present Stack (Right side)
    [
      { x: 780, y: 225, w: 30, h: 25, col: '#ff4d6d', rib: '#ffd700' },
      { x: 815, y: 220, w: 35, h: 30, col: '#4cc9f0', rib: '#ffffff' },
      { x: 795, y: 205, w: 25, h: 20, col: '#7209b7', rib: '#ffb703' },
    ].forEach((gift) => {
      ctx.fillStyle = gift.col;
      ctx.fillRect(gift.x, gift.y, gift.w, gift.h);
      ctx.fillStyle = gift.rib;
      ctx.fillRect(gift.x + gift.w / 2 - 2, gift.y, 4, gift.h);
      ctx.fillRect(gift.x, gift.y + gift.h / 2 - 2, gift.w, 4);
    });

    // 12. Confetti & Sparkles Floating Streamers
    for (let i = 0; i < 60; i++) {
      const cx = (i * 27 + time * 2.5) % 960;
      const cy = (i * 17 + time * 3.2) % 540;
      ctx.fillStyle = i % 4 === 0 ? '#ff4d6d' : i % 3 === 0 ? '#ffd166' : i % 2 === 0 ? '#4cc9f0' : '#ffffff';
      ctx.fillRect(cx, cy, i % 2 === 0 ? 6 : 4, i % 2 === 0 ? 6 : 4);
    }

    // 13. ORGANIC, NATURAL PARTY CROWD (Cinnamoroll front-center next to Taeil!)
    drawKatheryneSprite(ctx, 330, 260, time); // Back-Left near stage
    drawTahmKenchSprite(ctx, 220, 275, time); // Left near giant soup pot
    drawTeemoSprite(ctx, 405, 365, time); // Front-Left
    drawCinnamorollSprite(ctx, 495, 385, time); // FRONT & CENTER next to Taeil!
    drawKeqingSprite(ctx, 620, 280, time); // Back-Right near stage
    drawPoroSprite(ctx, 555, 365, time); // Front-Right
    drawPurpleGirlSprite(ctx, 740, 320, time); // Far-Right near presents
    drawHilichurlSprite(ctx, { id: 88, x: 160, y: 340, hp: 10, maxHp: 10, speed: 0, name: '축하 히리츄르' }, time);
    drawHilichurlSprite(ctx, { id: 89, x: 820, y: 335, hp: 10, maxHp: 10, speed: 0, name: '보스 히리츄르', isBoss: true }, time);

    drawTaeilSprite(ctx, p.x, p.y, time);
  };

  const drawQuietRoom = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, 960, 540);

    // Floating collected items
    collectedItems.forEach((item, idx) => {
      const floatY = 180 + idx * 30 + Math.sin(time / 10 + idx) * 5;
      ctx.fillStyle = '#ffd700';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`✦ ${item}`, 480, floatY);
    });

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('태일아 생일 축하해.', 480, 480);
  };

  const drawGoodbyeMap = (ctx: CanvasRenderingContext2D, p: any, time: number) => {
    // 1. Quiet Dark Midnight Sky with Twinkling Stars
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
    skyGrad.addColorStop(0, '#060814');
    skyGrad.addColorStop(1, '#0e1326');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 960, 200);

    // Soft Twinkling Stars
    for (let i = 0; i < 40; i++) {
      const starX = (i * 27 + 15) % 940;
      const starY = (i * 19 + 10) % 170;
      const starAlpha = 0.35 + Math.sin(time / 15 + i) * 0.35;
      ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha})`;
      ctx.beginPath();
      ctx.arc(starX, starY, i % 3 === 0 ? 2 : 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Soft Crescent Moon in Top Right
    ctx.fillStyle = '#fffdf0';
    ctx.beginPath();
    ctx.arc(840, 50, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#060814';
    ctx.beginPath();
    ctx.arc(832, 45, 20, 0, Math.PI * 2);
    ctx.fill();

    // Distant Quiet Windmill Silhouette against Night Sky
    ctx.fillStyle = '#141a2e';
    ctx.fillRect(160, 110, 24, 70);
    const bladeAng = time * 0.01;
    ctx.strokeStyle = '#1b233d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(172 + Math.cos(bladeAng) * 25, 110 + Math.sin(bladeAng) * 25);
    ctx.lineTo(172 - Math.cos(bladeAng) * 25, 110 - Math.sin(bladeAng) * 25);
    ctx.moveTo(172 + Math.sin(bladeAng) * 25, 110 - Math.cos(bladeAng) * 25);
    ctx.lineTo(172 - Math.sin(bladeAng) * 25, 110 + Math.cos(bladeAng) * 25);
    ctx.stroke();

    // 2. Quiet Mondstadt Plaza Background & Unlit Houses (불꺼진 광장)
    [
      { x: 40, w: 140, h: 100 },
      { x: 220, w: 160, h: 120 },
      { x: 580, w: 170, h: 110 },
      { x: 780, w: 140, h: 95 },
    ].forEach((h) => {
      // Roof
      ctx.fillStyle = '#1a1f33';
      ctx.beginPath();
      ctx.moveTo(h.x - 10, 190 - h.h);
      ctx.lineTo(h.x + h.w / 2, 190 - h.h - 40);
      ctx.lineTo(h.x + h.w + 10, 190 - h.h);
      ctx.fill();
      // House Body
      ctx.fillStyle = '#111625';
      ctx.fillRect(h.x, 190 - h.h, h.w, h.h);
      // Dark Unlit Windows (불꺼진 창문)
      ctx.fillStyle = '#1c2338';
      ctx.fillRect(h.x + 20, 190 - h.h + 25, 25, 30);
      ctx.fillRect(h.x + h.w - 45, 190 - h.h + 25, 25, 30);
      ctx.strokeStyle = '#0d111d';
      ctx.strokeRect(h.x + 20, 190 - h.h + 25, 25, 30);
      ctx.strokeRect(h.x + h.w - 45, 190 - h.h + 25, 25, 30);
    });

    // 3. Dark Cobblestone Plaza Floor (y=190 to 540)
    const floorGrad = ctx.createLinearGradient(0, 190, 0, 540);
    floorGrad.addColorStop(0, '#121726');
    floorGrad.addColorStop(1, '#090c14');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 190, 960, 350);

    // Cobblestone Tile Grid Lines (Dark subtle texture)
    ctx.strokeStyle = '#1a2035';
    ctx.lineWidth = 1;
    for (let py = 190; py < 540; py += 40) {
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(960, py); ctx.stroke();
    }
    for (let px = 0; px < 960; px += 60) {
      ctx.beginPath(); ctx.moveTo(px, 190); ctx.lineTo(px, 540); ctx.stroke();
    }

    // Central Unlit Fountain in Background
    ctx.fillStyle = '#192033';
    ctx.beginPath();
    ctx.ellipse(480, 210, 70, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#232b45';
    ctx.fillRect(472, 185, 16, 25);

    // 4. SINGLE WARM STREETLIGHT LANTERN IN THE CENTER (가로등)
    const lampX = 480;
    const lampY = 160;

    // Streetlight Cone of Warm Golden Light
    const lightCone = ctx.createRadialGradient(lampX, lampY + 40, 15, lampX, lampY + 160, 170);
    lightCone.addColorStop(0, 'rgba(255, 215, 0, 0.55)');
    lightCone.addColorStop(0.5, 'rgba(255, 183, 3, 0.28)');
    lightCone.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lightCone;
    ctx.beginPath();
    ctx.moveTo(lampX - 15, lampY + 30);
    ctx.lineTo(lampX - 180, 540);
    ctx.lineTo(lampX + 180, 540);
    ctx.lineTo(lampX + 15, lampY + 30);
    ctx.fill();

    // Streetlight Iron Post
    ctx.fillStyle = '#222836';
    ctx.fillRect(lampX - 5, lampY + 30, 10, 140);
    ctx.fillRect(lampX - 15, lampY + 165, 30, 8);
    ctx.fillRect(lampX - 12, lampY + 30, 24, 6);

    // Glowing Lantern Top
    ctx.fillStyle = '#ffea00';
    ctx.beginPath();
    ctx.arc(lampX, lampY + 20, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(lampX, lampY + 20, 7, 0, Math.PI * 2);
    ctx.fill();

    // Black Cap on Lantern
    ctx.fillStyle = '#111622';
    ctx.beginPath();
    ctx.moveTo(lampX - 16, lampY + 12);
    ctx.lineTo(lampX, lampY);
    ctx.lineTo(lampX + 16, lampY + 12);
    ctx.fill();

    // 5. Taeil & Teemo Standing Together Under the Warm Streetlight Beam
    const charX = p.x || 440;
    const charY = p.y || 300;

    drawTaeilSprite(ctx, charX, charY, time);
    drawTeemoSprite(ctx, charX + 50, charY + 8, time);

    // Warm ambient hint title
    ctx.fillStyle = 'rgba(255, 235, 180, 0.85)';
    ctx.font = 'italic 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌙 조용한 별바람 마을 밤 광장, 가로등 불빛 아래에서...', 480, 480);
  };

  const drawEndScreen = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#1d3557';
    ctx.fillRect(0, 0, 960, 540);

    ctx.fillStyle = '#f1faee';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('별빛 저택으로 가는 길', 480, 180);

    ctx.fillStyle = '#e63946';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('CLEAR', 480, 240);

    ctx.fillStyle = '#a8edd5';
    ctx.font = '16px sans-serif';
    ctx.fillText('오늘의 피로도: 0  |  행복도: MAX', 480, 300);

    ctx.fillStyle = '#f1faee';
    ctx.font = 'italic 14px sans-serif';
    ctx.fillText('For Taeil, who needed one day off.', 480, 350);
  };

  const drawCookieMap = (ctx: CanvasRenderingContext2D, p: any, time: number) => {
    // 1. Render Scene 1 Room (Prologue Room)
    drawPrologue(ctx, p, time);

    // 2. Yongbin Snoring Vibration & Zzz Bubble above Yongbin's bed (x: 740, y: 340)
    const snoreY = 320 + Math.sin(time / 4) * 5;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💤 드르르르르렁... zZZ', 735, snoreY);

    // 3. Golden Festival Lottery Ticket lying on desk next to Taeil's laptop (x: 230, y: 155)
    const ticketGlow = Math.sin(time / 6) * 3;
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(235, 145 + ticketGlow, 55, 26);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(237, 147 + ticketGlow, 51, 22);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('축제 복권', 262, 157 + ticketGlow);
    ctx.fillStyle = '#e63946';
    ctx.fillText(`NO. ${lotteryNumber || 7}`, 262, 166 + ticketGlow);
  };

  // -------------------------------------------------------------
  // REACT JSX OVERLAY RENDERING
  // -------------------------------------------------------------

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        style={{
          width: '100%',
          maxHeight: '100vh',
          aspectRatio: '16/9',
          imageRendering: 'pixelated',
          display: 'block',
        }}
      />

      {/* OBJECTIVE BANNER (COMPACT 50% SCALE) */}
      {objective && scene !== 'TITLE' && scene !== 'END_SCREEN' && scene !== 'COOKIE' && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            background: 'rgba(0, 0, 0, 0.82)',
            color: '#ffd700',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #ffd700',
            fontSize: '11px',
            fontWeight: 'bold',
            zIndex: 90,
          }}
        >
          [목표] {objective}
        </div>
      )}

      {/* STATUS ANIM TOAST (COMPACT 50% SCALE) */}
      {statusAnimation && (
        <div
          style={{
            position: 'absolute',
            top: 42,
            left: 12,
            background: 'rgba(10, 20, 40, 0.88)',
            color: '#4cc9f0',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #4cc9f0',
            fontSize: '10px',
            zIndex: 90,
            display: 'flex',
            gap: '8px',
          }}
        >
          <div>피로도: {statusAnimation.fatigue}</div>
          <div>집중력: {statusAnimation.focus}</div>
          <div>허리통증: {statusAnimation.back}</div>
        </div>
      )}

      {/* START TITLE BUTTON */}
      {scene === 'TITLE' && (
        <button
          onClick={initPrologue}
          style={{
            position: 'absolute',
            bottom: 110,
            padding: '16px 48px',
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#000000',
            background: '#ffd700',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(255, 215, 0, 0.6)',
          }}
        >
          START (게임 시작)
        </button>
      )}

      {/* DIALOGUE BOX (COMPACT 50% SCALE) */}
      {dialogue && (
        <div
          onClick={advanceDialogue}
          style={{
            position: 'absolute',
            bottom: 12,
            width: '85%',
            maxWidth: '460px',
            background: 'rgba(10, 15, 35, 0.94)',
            border: '1.5px solid #ffd700',
            borderRadius: '8px',
            padding: '8px 14px',
            color: '#ffffff',
            cursor: 'pointer',
            zIndex: 110,
            boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '13px', marginBottom: '3px' }}>
            {dialogue[dialogueIndex]?.speaker}
          </div>
          <div style={{ fontSize: '11.5px', lineHeight: '1.4' }}>
            {dialogue[dialogueIndex]?.text}
          </div>
          <div style={{ textAlign: 'right', fontSize: '9.5px', color: '#aaa', marginTop: '4px' }}>
            ▶ 클릭 또는 [Space/Enter/E] 로 진행
          </div>
        </div>
      )}

      {/* REGISTRATION CHOICES MODAL */}
      {showRegChoices && (
        <div
          style={{
            position: 'absolute',
            background: 'rgba(0, 0, 0, 0.92)',
            border: '2px solid #4cc9f0',
            borderRadius: '12px',
            padding: '24px',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <h3>출생지를 선택하세요</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            {['대한민국', '침대', '잘 모르겠음'].map((opt) => (
              <button
                key={opt}
                onClick={() => finishRegistration(opt)}
                style={{
                  padding: '10px 16px',
                  background: '#4cc9f0',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LOTTERY GRID (1-20) */}
      {showLotteryGrid && (
        <div
          style={{
            position: 'absolute',
            background: 'rgba(0,0,0,0.95)',
            border: '2px solid #ffd700',
            borderRadius: '12px',
            padding: '20px',
            color: '#fff',
            textAlign: 'center',
            maxWidth: '440px',
          }}
        >
          <h3 style={{ color: '#ffd700', marginBottom: '12px' }}>별빛 축제 복권 번호 선택</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => selectLotteryNumber(n)}
                style={{
                  padding: '10px',
                  background: '#222',
                  border: '1px solid #ffd700',
                  color: '#fff',
                  fontWeight: 'bold',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ITEM TOAST NOTIFICATION (COMPACT) */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            top: 45,
            background: 'rgba(20, 20, 40, 0.95)',
            border: `1.5px solid ${toast.iconColor}`,
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#fff',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
            zIndex: 100,
          }}
        >
          <div style={{ color: toast.iconColor, fontWeight: 'bold', fontSize: '12px', marginBottom: '2px' }}>
            🎁 획득: {toast.title}
          </div>
          <div style={{ fontSize: '10.5px', color: '#ccc' }}>{toast.desc}</div>
        </div>
      )}

      {/* SUHYEON LETTER MODAL */}
      {showLetterModal && (
        <div
          onClick={() => advanceDialogue()}
          style={{
            position: 'absolute',
            inset: 40,
            background: '#faf4e8',
            color: '#2c221e',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div>
            <h2 style={{ textAlign: 'center', color: '#8b4513', marginBottom: '24px' }}>
              수현이의 편지
            </h2>
            <div style={{ fontSize: '15px', lineHeight: '1.9', whiteSpace: 'pre-line' }}>
              {`태일이오빠!

요즘 논문 때문에
쉬고 있어도 계속 머릿속은 바빠 보였어.

그래서 생일 하루만큼은
아무것도 고치지 않아도 되는 곳에
보내주고 싶었어.

그냥 돌아다니고,
이상한 애들이랑 놀고,
예쁜 곳도 보고,
잠깐 아무 생각 없이 쉬라고.

오늘 모은 것들이
오빠한테 조금이라도 힘이 됐으면 좋겠다.

앞으로도 같이 많이 돌아다니고
별거 아닌 날들도 많이 남기자.

생일 진짜 많이 축하해.

오늘은 논문보다 오빠가 더 중요해.

세상에서 제일 사랑해!!

- 영원한 오빠 편 슈`}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px', color: '#888', fontSize: '13px' }}>
            [ 클릭하여 편지 닫기 ]
          </div>
        </div>
      )}

      {/* PHONE POPUP */}
      {scene === 'COOKIE' && showPhonePopup && (
        <div
          onClick={() => {
            setShowPhonePopup(false);
            setScene('END_SCREEN');
          }}
          style={{
            position: 'absolute',
            background: '#ffffff',
            color: '#000',
            borderRadius: '16px',
            padding: '20px',
            width: '300px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            zIndex: 99,
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>카카오톡</div>
          <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>수현</div>
          <div style={{ fontSize: '14px', background: '#ffe600', padding: '8px 12px', borderRadius: '10px', display: 'inline-block' }}>
            잘 잤어? 생일 축하해!
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', color: '#999', textAlign: 'right' }}>
            [ 터치하여 닫기 ]
          </div>
        </div>
      )}

      {/* END SCREEN BUTTONS */}
      {scene === 'END_SCREEN' && (
        <div style={{ position: 'absolute', bottom: 60, display: 'flex', gap: '20px' }}>
          <button
            onClick={startCookie}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: '#ffd700',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            쿠키 보기
          </button>
          <button
            onClick={initPrologue}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            처음부터
          </button>
        </div>
      )}

      {/* TOUCH & MOUSE CONTROLS (VIRTUAL ANALOG JOYSTICK & ACTION BUTTONS) */}
      {scene !== 'END_SCREEN' && !dialogue && !showLotteryGrid && !showRegChoices && !showLetterModal && !showPhonePopup && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            padding: '0 24px',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          {/* VIRTUAL ANALOG JOYSTICK */}
          <div
            ref={joystickBaseRef}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              handleJoystickStart(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => handleJoystickMove(e.clientX, e.clientY)}
            onPointerUp={handleJoystickEnd}
            onPointerCancel={handleJoystickEnd}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              if (touch) handleJoystickStart(touch.clientX, touch.clientY);
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              if (touch) handleJoystickMove(touch.clientX, touch.clientY);
            }}
            onTouchEnd={handleJoystickEnd}
            onTouchCancel={handleJoystickEnd}
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.65)',
              border: '2px solid rgba(255, 215, 0, 0.6)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(255, 215, 0, 0.25)',
              backdropFilter: 'blur(6px)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              cursor: 'grab',
            }}
          >
            {/* Joystick Center Ring */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px dashed rgba(255, 255, 255, 0.35)',
                position: 'absolute',
                pointerEvents: 'none',
              }}
            />
            {/* Movable Knob */}
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #ffd700 0%, #ff8c00 100%)',
                border: '2px solid #ffffff',
                boxShadow: '0 0 12px rgba(255, 215, 0, 0.8), 0 2px 6px rgba(0, 0, 0, 0.4)',
                transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)`,
                transition: isJoystickDraggingRef.current ? 'none' : 'transform 0.15s ease-out',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Touch Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
            <button
              onPointerDown={handleInteract}
              onTouchStart={(e) => { e.preventDefault(); handleInteract(); }}
              style={actionBtnStyle}
            >
              [E] 상호작용
            </button>
            <button
              onPointerDown={handleAttack}
              onTouchStart={(e) => { e.preventDefault(); handleAttack(); }}
              style={actionBtnStyle}
            >
              [J] 공격
            </button>
            <button
              onPointerDown={handleSkill}
              onTouchStart={(e) => { e.preventDefault(); handleSkill(); }}
              style={actionBtnStyle}
            >
              [K] 바람스킬
            </button>
          </div>
        </div>
      )}

      {/* PORTRAIT ORIENTATION FORCE WARNING OVERLAY */}
      <div
        className="portrait-warning-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: 'rgba(10, 10, 18, 0.96)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: isPortrait ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          textAlign: 'center',
          padding: '24px',
          boxSizing: 'border-box',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            fontSize: '56px',
            marginBottom: '16px',
            animation: 'rotatePhone 2.5s infinite ease-in-out',
          }}
        >
          📱
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffd700', marginBottom: '10px', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
          화면을 가로로 돌려주세요!
        </h2>
        <p style={{ fontSize: '13.5px', color: '#d0d0e0', lineHeight: 1.6, maxWidth: '280px', margin: 0 }}>
          태일이 게임은 가로 모드(Landscape)에 최적화되어 있습니다.<br />
          화면 자동 회전을 켜고 핸드폰을 가로로 기울여주세요.
        </p>
        <style>{`
          @keyframes rotatePhone {
            0%, 15% { transform: rotate(0deg); }
            45%, 65% { transform: rotate(-90deg); }
            95%, 100% { transform: rotate(0deg); }
          }
          @media (orientation: portrait) {
            .portrait-warning-overlay {
              display: flex !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

const mobileBtnStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  background: 'rgba(255, 255, 255, 0.25)',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const actionBtnStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'rgba(0, 0, 0, 0.7)',
  border: '1px solid #ffd700',
  borderRadius: '8px',
  color: '#ffd700',
  fontSize: '13px',
  fontWeight: 'bold',
  cursor: 'pointer',
};
