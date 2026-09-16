/**
 * DialogueBox.tsx
 * Cinematic RPG dialogue overlay.
 *
 * Layout:
 *   ┌──◆ SPEAKER NAME ◆──┐
 *   └────────────────────┘
 *   ┌──────────────────────────────────────────────────────┐
 *   │ [portrait]  dialogue text with typewriter effect...  │
 *   │             ────────────────────────────────  계속 ▼ │
 *   └──────────────────────────────────────────────────────┘
 *
 * Game world stays fully visible behind (backdrop-filter blur + dark glass).
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EventBridge, type DialoguePayload } from '@/game/EventBridge';
import { getDialogue, type DialogueLine } from '@/data/dialogue';
import { getGameState } from '@/state/GameState';

// ── Typewriter hook ────────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 38) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone]           = useState(false);
  const timer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const cursor = useRef(0);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    cursor.current = 0;

    if (!text) { setDone(true); return; }

    timer.current = setInterval(() => {
      cursor.current += 1;
      setDisplayed(text.slice(0, cursor.current));
      if (cursor.current >= text.length) {
        clearInterval(timer.current!);
        setDone(true);
      }
    }, speed);

    return () => { if (timer.current) clearInterval(timer.current); };
  }, [text, speed]);

  const skip = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    setDisplayed(text);
    setDone(true);
  }, [text]);

  return { displayed, done, skip };
}

// ── State ──────────────────────────────────────────────────────────────────────

interface DialogueState {
  lines:       DialogueLine[];
  lineIndex:   number;
  onComplete?: () => void;
  sequenceId:  string;
}

// ── Palette ───────────────────────────────────────────────────────────────────

const GOLD        = 'rgba(210, 172, 80, 0.85)';
const GOLD_BRIGHT = '#e8c870';
const GOLD_DIM    = 'rgba(200, 160, 60, 0.45)';
const TEXT_MAIN   = '#f2ede0';
const TEXT_HINT   = 'rgba(200, 160, 60, 0.65)';
const TEXT_SKIP   = 'rgba(130, 130, 170, 0.6)';

// ── Component ──────────────────────────────────────────────────────────────────

export function DialogueBox() {
  const [state,   setState]   = useState<DialogueState | null>(null);
  const [visible, setVisible] = useState(false);

  // ── EventBridge ────────────────────────────────────────────────────────────

  useEffect(() => {
    const offShow = EventBridge.on('show_dialogue', (payload: DialoguePayload) => {
      const seq       = getDialogue(payload.sequenceId);
      const startLine = payload.startLine ?? 0;
      const saved     = !payload.startLine
        ? getGameState().getDialogueProgress(seq.id)
        : startLine;

      setState({
        lines:      seq.lines,
        lineIndex:  saved,
        onComplete: payload.onComplete,
        sequenceId: seq.id,
      });
      setVisible(true);
      EventBridge.emit('phaser_input_blocked', true);
    });

    const offHide = EventBridge.on('hide_dialogue', () => {
      setVisible(false);
      setState(null);
    });

    return () => { offShow(); offHide(); };
  }, []);

  // ── Advance ────────────────────────────────────────────────────────────────

  const currentLine = state?.lines[state.lineIndex] ?? null;
  const { displayed, done, skip } = useTypewriter(currentLine?.text ?? '');

  const advance = useCallback(() => {
    if (!state) return;
    if (!done) { skip(); return; }

    const next = state.lineIndex + 1;
    getGameState().setDialogueProgress(state.sequenceId, next);

    if (next >= state.lines.length) {
      const { onComplete, sequenceId } = state;
      setVisible(false);
      setState(null);
      EventBridge.emit('phaser_input_blocked', false);
      EventBridge.emit('dialogue_complete', { sequenceId });
      if (onComplete) setTimeout(onComplete, 80);
    } else {
      setState(prev => prev ? { ...prev, lineIndex: next } : null);
    }
  }, [state, done, skip]);

  // Auto-advance for cinematic beats — fires after typewriter finishes
  useEffect(() => {
    if (!done || !currentLine?.autoAdvanceMs) return;
    const ms = currentLine.autoAdvanceMs;
    const timer = setTimeout(advance, ms);
    return () => clearTimeout(timer);
  }, [done, currentLine, advance]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!visible || !state || !currentLine) return null;

  const isNarration = currentLine.speaker === '...' || !currentLine.speaker;
  const isLast      = state.lineIndex === state.lines.length - 1;

  return (
    <div
      onClick={advance}
      style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: '0 14px',
        paddingBottom: 'max(18px, env(safe-area-inset-bottom))',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* ── Speaker nameplate tab ── */}
      {!isNarration && (
        <div style={{ marginLeft: 12, marginBottom: -1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 16px 6px',
            background: 'linear-gradient(to bottom, rgba(14,18,48,0.98), rgba(8,12,30,0.97))',
            border: `1px solid ${GOLD_DIM}`,
            borderBottom: 'none',
            borderRadius: '8px 8px 0 0',
            boxShadow: `0 -2px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}>
            <span style={{ color: GOLD, fontSize: 9, letterSpacing: 2 }}>◆</span>
            <span style={{
              color: GOLD_BRIGHT,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Noto Sans KR', sans-serif",
              letterSpacing: '0.08em',
              textShadow: `0 0 12px ${GOLD}`,
            }}>
              {currentLine.speaker}
            </span>
            <span style={{ color: GOLD, fontSize: 9, letterSpacing: 2 }}>◆</span>
          </div>
        </div>
      )}

      {/* ── Main dialogue panel ── */}
      <div style={{
        display: 'flex',
        background: 'linear-gradient(160deg, rgba(10,14,38,0.95) 0%, rgba(6,8,22,0.97) 100%)',
        border: `1px solid ${GOLD_DIM}`,
        borderRadius: isNarration ? '10px' : '0 10px 10px 10px',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        boxShadow: [
          `0 0 0 1px rgba(200,160,60,0.10)`,
          `0 12px 48px rgba(0,0,0,0.75)`,
          `inset 0 1px 0 rgba(255,255,255,0.04)`,
          `inset 0 0 60px rgba(200,160,60,0.02)`,
        ].join(', '),
        overflow: 'hidden',
        minHeight: 108,
      }}>

        {/* Portrait panel */}
        {!isNarration && (
          <div style={{
            width: 76,
            flexShrink: 0,
            background: 'linear-gradient(160deg, rgba(20,26,62,0.85), rgba(10,14,36,0.90))',
            borderRight: `1px solid ${GOLD_DIM}`,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {currentLine.portrait ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/assets/characters/${currentLine.portrait}.svg`}
                alt={currentLine.speaker}
                style={{
                  width: 76,
                  height: 100,
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(40,50,100,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#5566aa', fontSize: 18, marginBottom: 26,
              }}>
                ?
              </div>
            )}
          </div>
        )}

        {/* Text + controls */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: isNarration ? '16px 18px 12px' : '14px 18px 12px',
          gap: 6,
        }}>
          {/* Dialogue text */}
          <p style={{
            margin: 0,
            flex: 1,
            color: TEXT_MAIN,
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: 16,
            lineHeight: 1.72,
            whiteSpace: 'pre-wrap',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            minHeight: '3em',
          }}>
            {displayed}
            {!done && (
              <span style={{ marginLeft: 2, color: '#a8c8ff', animation: 'blink 0.9s step-end infinite' }}>
                ▌
              </span>
            )}
          </p>

          {/* Bottom row: thin rule + advance hint */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingTop: 4,
            borderTop: `1px solid rgba(200,160,60,0.14)`,
          }}>
            <div style={{ flex: 1, height: 1 }} />
            {done ? (
              currentLine.autoAdvanceMs ? (
                <span style={{ color: TEXT_SKIP, fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>
                  ●●●
                </span>
              ) : (
                <span style={{
                  color: TEXT_HINT,
                  fontSize: 12,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  animation: isLast ? 'none' : 'hintBounce 1.6s ease-in-out infinite',
                }}>
                  {isLast ? '닫기 ▼' : '계속 ▼'}
                </span>
              )
            ) : (
              <span style={{ color: TEXT_SKIP, fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>
                탭하여 스킵
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress pips */}
      {state.lines.length > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 5,
          marginTop: 7,
        }}>
          {state.lines.map((_, i) => (
            <div key={i} style={{
              height: 3,
              borderRadius: 2,
              width: i === state.lineIndex ? 18 : 4,
              background: i <= state.lineIndex
                ? 'rgba(210,172,80,0.8)'
                : 'rgba(35,35,60,0.8)',
              transition: 'all 0.2s ease',
              boxShadow: i === state.lineIndex ? `0 0 6px ${GOLD}` : 'none',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
