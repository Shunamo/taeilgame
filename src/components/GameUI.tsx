/**
 * GameUI.tsx
 * Root React UI layer above the Babylon.js canvas.
 * Handles: dialogue, overlays, lottery picker, combat HP, boss HP, letter, CLEAR.
 */

import React, { useEffect, useState } from 'react';
import { DialogueBox } from './DialogueBox';
import { MobileHUD }   from './MobileHUD';
import { EventBridge } from '@/game/EventBridge';
import { getGameState } from '@/state/GameState';

type OverlayKind =
  | 'none'
  | 'lottery_ui'
  | 'lottery_draw'
  | 'letter'
  | 'clear';

interface InteractPrompt { text: string; actionId: string; }
interface CombatHp { current: number; max: number; }
interface BossHp { current: number; max: number; name: string; }

export function GameUI() {
  const [overlay,         setOverlay]         = useState<OverlayKind>('none');
  const [lotteryWinNum,   setLotteryWinNum]   = useState<number>(1);
  const [interact,        setInteract]        = useState<InteractPrompt | null>(null);
  const [combatHp,        setCombatHp]        = useState<CombatHp | null>(null);
  const [bossHp,          setBossHp]          = useState<BossHp | null>(null);
  const [showDesktopHint, setShowDesktopHint] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    if (navigator.maxTouchPoints === 0) {
      setShowDesktopHint(true);
      const t = setTimeout(() => setShowDesktopHint(false), 6000);
      return () => clearTimeout(t);
    }
  }, []);

  // ── EventBridge subscriptions ──────────────────────────────────────────────

  useEffect(() => {
    const offLottery   = EventBridge.on('show_lottery_ui',  () => setOverlay('lottery_ui'));
    const offDraw      = EventBridge.on('show_lottery_draw', ({ winningNumber }) => {
      setLotteryWinNum(winningNumber);
      setOverlay('lottery_draw');
    });
    const offLetter    = EventBridge.on('show_letter',      () => setOverlay('letter'));
    const offClear     = EventBridge.on('show_clear',       () => setOverlay('clear'));
    const offInteract  = EventBridge.on('show_interact_prompt', (p) => setInteract(p));
    const offHideInt   = EventBridge.on('hide_interact_prompt', () => setInteract(null));
    const offCombatHp  = EventBridge.on('update_combat_hp', (hp) => setCombatHp(hp));
    const offHideCombat= EventBridge.on('hide_combat_hp',  () => setCombatHp(null));
    const offBossHp    = EventBridge.on('update_boss_hp',  (hp) => setBossHp(hp));
    const offHideBoss  = EventBridge.on('hide_boss_hp',   () => setBossHp(null));

    return () => {
      offLottery(); offDraw(); offLetter(); offClear();
      offInteract(); offHideInt();
      offCombatHp(); offHideCombat(); offBossHp(); offHideBoss();
    };
  }, []);

  const handleInteractTap = () => {
    if (!interact) return;
    EventBridge.emit('interact_confirm', { actionId: interact.actionId });
    if (interact.actionId === 'resume') setInteract(null);
  };

  const onLotteryPick = (n: number) => {
    getGameState().setLotteryNumber(n);
    EventBridge.emit('lottery_picked', { number: n });
    setOverlay('none');
  };

  const onLetterClose = () => {
    setOverlay('none');
    EventBridge.emit('letter_closed', undefined);
  };

  return (
    <div
      id="ui-root"
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 100,
      }}
    >
      {/* Minimap hidden during combat/clear screens */}
      {overlay === 'none' && <Minimap />}

      {/* Top-right buttons */}
      <TopRightButtons />

      {/* Combat HP (hearts) */}
      {combatHp && <CombatHpBar hp={combatHp} />}

      {/* Boss HP bar */}
      {bossHp && <BossHpBar hp={bossHp} />}

      {/* Interact prompt */}
      {interact && (
        <div
          style={{
            pointerEvents: 'auto',
            position: 'absolute', bottom: 170, left: '50%',
            transform: 'translateX(-50%)', cursor: 'pointer',
          }}
          onClick={handleInteractTap}
          onTouchStart={(e) => { e.preventDefault(); handleInteractTap(); }}
        >
          <InteractPromptBadge text={interact.text} />
        </div>
      )}

      {/* Dialogue box */}
      <div style={{ pointerEvents: 'auto', position: 'absolute', inset: 0 }}>
        <DialogueBox />
      </div>

      {/* Desktop hint */}
      {showDesktopHint && overlay === 'none' && <DesktopHintBar />}

      {/* Mobile HUD */}
      <MobileHUD />

      {/* ── Overlays ── */}
      {overlay === 'lottery_ui' && (
        <LotteryPicker onPick={onLotteryPick} />
      )}
      {overlay === 'lottery_draw' && (
        <LotteryDraw winningNumber={lotteryWinNum} onClose={() => setOverlay('none')} />
      )}
      {overlay === 'letter' && (
        <LetterOverlay onClose={onLetterClose} />
      )}
      {overlay === 'clear' && (
        <ClearScreen />
      )}
    </div>
  );
}

// ── Combat HP display (hearts) ─────────────────────────────────────────────────

function CombatHpBar({ hp }: { hp: CombatHp }) {
  const hearts = Array.from({ length: hp.max }, (_, i) => i < hp.current);
  return (
    <div style={{
      position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 6, zIndex: 120, pointerEvents: 'none',
    }}>
      {hearts.map((alive, i) => (
        <span key={i} style={{ fontSize: 26, filter: alive ? 'none' : 'grayscale(1) opacity(0.35)' }}>
          ♥
        </span>
      ))}
    </div>
  );
}

// ── Boss HP bar ────────────────────────────────────────────────────────────────

function BossHpBar({ hp }: { hp: BossHp }) {
  const pct = Math.max(0, hp.current / hp.max) * 100;
  return (
    <div style={{
      position: 'absolute', bottom: 110, left: '50%', transform: 'translateX(-50%)',
      width: 280, zIndex: 120, pointerEvents: 'none',
    }}>
      <div style={{
        color: '#e8d090', fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif",
        fontWeight: 700, textAlign: 'center', marginBottom: 4,
        textShadow: '0 0 8px rgba(0,0,0,0.8)',
      }}>
        {hp.name}
      </div>
      <div style={{
        background: 'rgba(0,0,0,0.7)', borderRadius: 8,
        border: '1.5px solid rgba(200,60,60,0.6)', overflow: 'hidden', height: 14,
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(to right, #cc2020, #ff4444)',
          transition: 'width 0.3s ease', borderRadius: 6,
        }} />
      </div>
    </div>
  );
}

// ── Lottery picker ─────────────────────────────────────────────────────────────

function LotteryPicker({ onPick }: { onPick: (n: number) => void }) {
  return (
    <div style={{
      pointerEvents: 'auto', position: 'absolute', inset: 0,
      background: 'rgba(5,3,20,0.97)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 28, zIndex: 200,
    }}>
      <div style={{ color: '#e8c870', fontSize: 22, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif" }}>
        🎟 복권 번호를 골라주세요
      </div>
      <div style={{ color: 'rgba(200,190,160,0.7)', fontSize: 13, fontFamily: "'Noto Sans KR', sans-serif" }}>
        한 번 고르면 바꿀 수 없어요!
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 360 }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button
            key={n}
            onClick={() => onPick(n)}
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(145deg, #1e1448, #0e0c30)',
              border: '2px solid rgba(210,172,80,0.65)',
              color: '#e8d080', fontSize: 24, fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(210,172,80,0.18), 0 4px 12px rgba(0,0,0,0.5)',
              transition: 'transform 0.1s, box-shadow 0.1s',
              fontFamily: 'monospace',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.12)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px rgba(210,172,80,0.45), 0 6px 16px rgba(0,0,0,0.6)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 16px rgba(210,172,80,0.18), 0 4px 12px rgba(0,0,0,0.5)';
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Lottery draw reveal ────────────────────────────────────────────────────────

function LotteryDraw({ winningNumber, onClose }: { winningNumber: number; onClose: () => void }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      pointerEvents: 'auto', position: 'absolute', inset: 0,
      background: 'rgba(5,3,20,0.97)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24, zIndex: 200,
    }}>
      <div style={{ color: '#e8c870', fontSize: 20, fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700 }}>
        🎉 당첨 번호 공개!
      </div>
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        background: revealed
          ? 'linear-gradient(145deg, #c83030, #ff6040)'
          : 'rgba(40,30,80,0.8)',
        border: '3px solid rgba(210,172,80,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: revealed ? 52 : 24,
        color: '#fff',
        fontWeight: 900,
        boxShadow: revealed ? '0 0 40px rgba(200,60,40,0.6), 0 0 80px rgba(200,80,40,0.3)' : 'none',
        transition: 'all 0.6s ease',
        fontFamily: 'monospace',
      }}>
        {revealed ? winningNumber : '?'}
      </div>
      {revealed && (
        <div style={{ color: '#f0e8d0', fontSize: 16, fontFamily: "'Noto Sans KR', sans-serif", textAlign: 'center' }}>
          축하합니다! 1등 당첨!
        </div>
      )}
      {revealed && (
        <button
          onClick={onClose}
          style={{
            marginTop: 8,
            background: 'rgba(30,20,60,0.9)', color: '#e8c870',
            border: '1.5px solid rgba(210,172,80,0.5)', borderRadius: 8,
            padding: '10px 32px', fontSize: 15, fontFamily: "'Noto Sans KR', sans-serif",
            cursor: 'pointer',
          }}
        >
          확인
        </button>
      )}
    </div>
  );
}

// ── Letter overlay (Suhyeon's letter) ─────────────────────────────────────────

function LetterOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      pointerEvents: 'auto', position: 'absolute', inset: 0,
      background: 'rgba(248,244,235,0.97)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 200,
      padding: '40px 24px',
    }}>
      {/* Letter paper */}
      <div style={{
        maxWidth: 420, width: '100%',
        background: '#fffdf5',
        border: '1px solid #d4c8a0',
        borderRadius: 4,
        padding: '36px 40px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18), 4px 4px 0 rgba(180,160,100,0.15)',
        position: 'relative',
        fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
      }}>
        {/* Top decoration line */}
        <div style={{ borderBottom: '2px solid #c8b878', paddingBottom: 12, marginBottom: 20, textAlign: 'center' }}>
          <span style={{ color: '#8a6c30', fontSize: 12, letterSpacing: '0.15em', fontWeight: 700 }}>
            — To. 태일에게 —
          </span>
        </div>

        {/* Letter body */}
        <div style={{ lineHeight: 1.9, color: '#3a2c18', fontSize: 15 }}>
          <p>태일아,</p>
          <p style={{ marginTop: 16 }}>
            생일 축하해. 올해도 이렇게 생일을 맞이하게 돼서 기쁘다.
          </p>
          <p style={{ marginTop: 12 }}>
            네가 모르는 게 있는데, 사실 나는 네가 힘들 때마다
            옆에 있고 싶었어. 말로 잘 못 해서 그냥 옆에만 있었는데,
            그걸 알아줬으면 해서.
          </p>
          <p style={{ marginTop: 12 }}>
            네가 열심히 사는 거 항상 보고 있어.
            오늘만큼은 걱정 다 내려놓고 즐겨.
          </p>
          <p style={{ marginTop: 12 }}>
            앞으로도 잘 부탁해. 언제나 응원할게.
          </p>
          <p style={{ marginTop: 20, textAlign: 'right', color: '#6a4c20' }}>
            수현이가 🌙
          </p>
        </div>

        {/* Bottom decoration */}
        <div style={{ borderTop: '1px dashed #c8b878', marginTop: 24, paddingTop: 12, textAlign: 'center' }}>
          <span style={{ color: '#a08040', fontSize: 11 }}>★ ☆ ★</span>
        </div>
      </div>

      <button
        onClick={onClose}
        style={{
          marginTop: 28,
          background: '#2a1808', color: '#e8c870',
          border: '1.5px solid rgba(210,172,80,0.5)', borderRadius: 8,
          padding: '12px 40px', fontSize: 15, fontFamily: "'Noto Sans KR', sans-serif",
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        편지 접기
      </button>
    </div>
  );
}

// ── CLEAR screen ───────────────────────────────────────────────────────────────

function ClearScreen() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      pointerEvents: 'auto', position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 20, zIndex: 250,
      background: 'transparent',
    }}>
      <div style={{
        fontSize: 72, fontWeight: 900, fontFamily: 'monospace',
        background: 'linear-gradient(135deg, #f0d050, #ff8040, #ff4488, #8040ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textShadow: 'none',
        opacity: show ? 1 : 0,
        transform: show ? 'scale(1)' : 'scale(0.5)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
        letterSpacing: '0.08em',
      }}>
        CLEAR
      </div>
      <div style={{
        color: '#f0e8d0', fontSize: 22, fontFamily: "'Noto Sans KR', sans-serif",
        fontWeight: 700, textShadow: '0 0 20px rgba(210,172,80,0.5)',
        opacity: show ? 1 : 0, transition: 'opacity 1s ease 0.5s',
      }}>
        생일 축하해, 태일아! 🎂
      </div>
      <div style={{
        color: 'rgba(230,220,190,0.8)', fontSize: 14,
        fontFamily: "'Noto Sans KR', sans-serif",
        textAlign: 'center', lineHeight: 1.8,
        maxWidth: 320, padding: '0 20px',
        opacity: show ? 1 : 0, transition: 'opacity 1s ease 1s',
      }}>
        오늘 하루 수고했어.<br />
        진짜 선물은 현실에서 기다리고 있어 🎁
      </div>
      <div style={{
        marginTop: 12, fontSize: 12, color: 'rgba(200,180,140,0.5)',
        fontFamily: 'monospace', letterSpacing: '0.15em',
        opacity: show ? 1 : 0, transition: 'opacity 1s ease 1.5s',
      }}>
        — Made with ♥ —
      </div>
    </div>
  );
}

// ── Minimap ────────────────────────────────────────────────────────────────────

function Minimap() {
  return (
    <div style={{ position: 'absolute', top: 14, left: 14, pointerEvents: 'none', zIndex: 110 }}>
      <div style={{
        width: 82, height: 82, borderRadius: '50%',
        border: '2.5px solid rgba(210,172,80,0.82)', overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 60%, #2d7020 0%, #1a4c14 55%, #0d2a08 100%)',
        boxShadow: '0 0 16px rgba(0,0,0,0.65), inset 0 0 12px rgba(0,0,0,0.4)',
        position: 'relative',
      }}>
        <span style={{
          position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,220,100,0.75)', fontSize: 8, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1,
        }}>N</span>
        <div style={{
          position: 'absolute', left: '50%', top: '18%', width: 4, height: '64%',
          background: 'rgba(200,170,90,0.48)', transform: 'translateX(-50%)', borderRadius: 2,
        }} />
        <div style={{
          position: 'absolute', left: '50%', top: '12%', transform: 'translate(-50%, 0)',
          width: 9, height: 9, background: '#e8a040', borderRadius: 2,
          boxShadow: '0 0 4px rgba(232,160,64,0.7)',
        }} />
        <div style={{
          position: 'absolute', left: '50%', bottom: '28%', transform: 'translateX(-50%)',
          width: 8, height: 8, background: '#4aafff', borderRadius: '50%',
          boxShadow: '0 0 6px rgba(74,175,255,0.9)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.45) 100%)',
        }} />
      </div>
    </div>
  );
}

// ── Top-right icon buttons ─────────────────────────────────────────────────────

function TopRightButtons() {
  return (
    <div style={{
      position: 'absolute', top: 14, right: 14,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'auto', zIndex: 110,
    }}>
      {(['≡', '⚔', '◎'] as string[]).map((icon) => (
        <button
          key={icon}
          style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(8,12,32,0.84)',
            border: '1.5px solid rgba(200,160,60,0.52)',
            color: '#e8c870', fontSize: 17, cursor: 'pointer',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 2px 14px rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, outline: 'none',
          }}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

// ── Desktop hint bar ───────────────────────────────────────────────────────────

function DesktopHintBar() {
  const keys: [string, string][] = [
    ['WASD', '이동'], ['E', '상호작용'], ['J', '공격'], ['K', '스킬'], ['ESC', '일시정지'],
  ];
  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 6, pointerEvents: 'none',
    }}>
      {keys.map(([k, desc]) => (
        <div key={k} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          padding: '5px 10px', background: 'rgba(8,12,32,0.78)',
          border: '1px solid rgba(200,160,60,0.3)', borderRadius: 6,
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ color: '#e8c870', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>{k}</span>
          <span style={{ color: 'rgba(200,200,220,0.65)', fontSize: 9, fontFamily: "'Noto Sans KR', sans-serif" }}>{desc}</span>
        </div>
      ))}
    </div>
  );
}

// ── Interact prompt badge ──────────────────────────────────────────────────────

function InteractPromptBadge({ text }: { text: string }) {
  return (
    <div style={{
      background: 'linear-gradient(to bottom, rgba(12,16,40,0.92), rgba(7,10,26,0.95))',
      border: '1px solid rgba(200,160,60,0.5)', borderRadius: 24,
      padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 10,
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      boxShadow: '0 0 22px rgba(200,160,60,0.2), 0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <span style={{ fontSize: 14, color: '#e8c870' }}>◆</span>
      <span style={{
        color: '#e8d090', fontFamily: "'Noto Sans KR', sans-serif",
        fontSize: 14, fontWeight: 600, letterSpacing: '0.04em',
      }}>
        {text}
      </span>
    </div>
  );
}
