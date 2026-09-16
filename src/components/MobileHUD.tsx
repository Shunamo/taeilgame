/**
 * MobileHUD.tsx
 * Virtual joystick + action buttons for touch devices.
 * Only rendered when navigator.maxTouchPoints > 0.
 * Drives inputManager's virtual axis + button state directly.
 *
 * Left  side : floating virtual joystick
 * Right side : 공격 / 바람스킬 / 상호작용  (attack / skill / interact)
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { inputManager, type GameAction } from '@/game/InputManager';

const RING_R  = 52;   // outer ring radius (px)
const THUMB_R = 21;   // inner thumb radius (px)

// ── Reusable action button ─────────────────────────────────────────────────────

interface BtnProps {
  action:   GameAction;
  label:    string;
  sub?:     string;
  size?:    number;
  primary?: boolean;  // true = larger gold-bordered main button
}

function ActionBtn({ action, label, sub, size = 52, primary = false }: BtnProps) {
  const handleStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    inputManager.setVirtualButton(action, true);
  }, [action]);

  const handleEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    inputManager.setVirtualButton(action, false);
  }, [action]);

  return (
    <div
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      style={{
        width:  size,
        height: size,
        borderRadius: '50%',
        background: primary
          ? 'linear-gradient(145deg, rgba(18,24,60,0.92), rgba(8,12,38,0.95))'
          : 'rgba(12,18,44,0.80)',
        border: primary
          ? '2px solid rgba(210,172,80,0.78)'
          : '1.5px solid rgba(150,120,60,0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: 'pointer',
        boxShadow: primary
          ? '0 0 16px rgba(210,172,80,0.20), 0 6px 24px rgba(0,0,0,0.55)'
          : '0 4px 16px rgba(0,0,0,0.40)',
        gap: 1,
      }}
    >
      <span style={{
        color: primary ? '#e8c870' : 'rgba(220,210,180,0.90)',
        fontSize: sub ? 11 : (primary ? 14 : 12),
        fontWeight: 700,
        fontFamily: "'Noto Sans KR', sans-serif",
        lineHeight: 1.2,
        textAlign: 'center',
        textShadow: primary ? '0 0 8px rgba(210,172,80,0.5)' : 'none',
      }}>
        {label}
      </span>
      {sub && (
        <span style={{
          color: primary ? 'rgba(210,172,80,0.75)' : 'rgba(200,190,160,0.65)',
          fontSize: 9,
          fontFamily: "'Noto Sans KR', sans-serif",
          lineHeight: 1.2,
        }}>
          {sub}
        </span>
      )}
    </div>
  );
}

// ── Main HUD component ─────────────────────────────────────────────────────────

export function MobileHUD() {
  const [visible, setVisible] = useState(false);

  // Thumb position (relative to ring center, in px)
  const [thumb, setThumb] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const ringRef    = useRef<HTMLDivElement>(null);
  const centerRef  = useRef({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const activeRef  = useRef(false);

  // Only show on touch devices (checked after mount to avoid SSR mismatch)
  useEffect(() => { setVisible(inputManager.isMobile); }, []);

  // ── Joystick math ────────────────────────────────────────────────────────────

  const updateThumb = useCallback((cx: number, cy: number) => {
    const { x: bx, y: by } = centerRef.current;
    const dx   = cx - bx;
    const dy   = cy - by;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const max  = RING_R - THUMB_R;
    const ang  = Math.atan2(dy, dx);
    const clamped = Math.min(dist, max);

    setThumb({
      x: Math.cos(ang) * clamped,
      y: Math.sin(ang) * clamped,
    });

    const ratio = Math.min(dist / max, 1);
    inputManager.setVirtualAxis(
      dist > 6 ?  Math.cos(ang) * ratio : 0,
      dist > 6 ? -Math.sin(ang) * ratio : 0,  // -sin: screen-up → forward (+Y)
    );
  }, []);

  // ── Touch handlers ────────────────────────────────────────────────────────────

  const onStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    const t = e.changedTouches[0];
    touchIdRef.current = t.identifier;
    activeRef.current  = true;

    const rect = ringRef.current!.getBoundingClientRect();
    centerRef.current = { x: rect.left + RING_R, y: rect.top + RING_R };
    updateThumb(t.clientX, t.clientY);
  }, [updateThumb]);

  const onMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        updateThumb(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        return;
      }
    }
  }, [updateThumb]);

  const onEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        activeRef.current  = false;
        setThumb({ x: 0, y: 0 });
        inputManager.setVirtualAxis(0, 0);
        return;
      }
    }
  }, []);

  if (!visible) return null;

  const safeBottom = 'max(24px, calc(env(safe-area-inset-bottom) + 24px))';

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 200 }}>

      {/* ── Left: Virtual joystick ── */}
      <div
        ref={ringRef}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onTouchCancel={onEnd}
        style={{
          position: 'absolute',
          left: 18,
          bottom: safeBottom,
          width:  RING_R * 2,
          height: RING_R * 2,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          border: '1.5px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          pointerEvents: 'auto',
          touchAction: 'none',
          boxShadow: '0 4px 28px rgba(0,0,0,0.35)',
        }}
      >
        {/* Thumb */}
        <div style={{
          position: 'absolute',
          left: RING_R - THUMB_R + thumb.x,
          top:  RING_R - THUMB_R + thumb.y,
          width:  THUMB_R * 2,
          height: THUMB_R * 2,
          borderRadius: '50%',
          background: 'rgba(168, 212, 255, 0.58)',
          border: '2px solid rgba(168, 212, 255, 0.92)',
          boxShadow: '0 0 16px rgba(168,212,255,0.45)',
          pointerEvents: 'none',
          transition: activeRef.current ? 'none' : 'left 0.12s ease, top 0.12s ease',
        }} />
      </div>

      {/* ── Right: Action buttons ── */}
      <div style={{
        position: 'absolute',
        right: 14,
        bottom: safeBottom,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'center',
        pointerEvents: 'auto',
      }}>
        {/* Top row: skill + attack smaller buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <ActionBtn
            action="skill"
            label="스킬"
            size={46}
          />
          <ActionBtn
            action="attack"
            label="공격"
            size={46}
          />
        </div>

        {/* Primary interact button — large, gold-bordered */}
        <ActionBtn
          action="interact"
          label="대화"
          sub="탐험"
          size={64}
          primary
        />
      </div>
    </div>
  );
}
