/**
 * InputManager.ts
 * Unified input abstraction — keyboard + mouse (desktop) or virtual HUD (mobile).
 * Babylon.js scenes poll this singleton each render frame via getMovementVector()
 * and consumeJustPressed(). The React MobileHUD drives the virtual inputs.
 */

export type GameAction = 'interact' | 'attack' | 'skill' | 'pause';

class InputManager {
  private readonly _keys  = new Set<string>();
  private readonly _held  = new Map<GameAction, boolean>();
  private readonly _justP = new Set<GameAction>();
  private _vx = 0;
  private _vy = 0;
  private _attached = false;

  // ── Device detection ──────────────────────────────────────────────────────

  /** True when the primary input device is touch (mobile / tablet). */
  get isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return navigator.maxTouchPoints > 0;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /** Attach global keyboard + mouse listeners. Call once after canvas mounts. */
  attach(): void {
    if (this._attached || typeof window === 'undefined') return;
    this._attached = true;
    window.addEventListener('keydown',     this._onKeyDown,  { passive: false });
    window.addEventListener('keyup',       this._onKeyUp);
    window.addEventListener('mousedown',   this._onMDown);
    window.addEventListener('mouseup',     this._onMUp);
    window.addEventListener('contextmenu', this._noPrev);
  }

  detach(): void {
    if (!this._attached) return;
    this._attached = false;
    window.removeEventListener('keydown',     this._onKeyDown);
    window.removeEventListener('keyup',       this._onKeyUp);
    window.removeEventListener('mousedown',   this._onMDown);
    window.removeEventListener('mouseup',     this._onMUp);
    window.removeEventListener('contextmenu', this._noPrev);
    this._keys.clear();
    this._held.clear();
    this._justP.clear();
  }

  // ── Keyboard handlers ─────────────────────────────────────────────────────

  private _onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    this._keys.add(e.code);
    const a = this._k2a(e.code);
    if (a) { this._justP.add(a); this._held.set(a, true); }
  };

  private _onKeyUp = (e: KeyboardEvent) => {
    this._keys.delete(e.code);
    const a = this._k2a(e.code);
    if (a) this._held.set(a, false);
  };

  private _k2a(code: string): GameAction | null {
    switch (code) {
      case 'KeyE':   return 'interact';
      case 'KeyJ':   return 'attack';
      case 'KeyK':   return 'skill';
      case 'Escape': return 'pause';
      default:       return null;
    }
  }

  // ── Mouse handlers ────────────────────────────────────────────────────────

  private _onMDown = (e: MouseEvent) => {
    // Left click = attack, right click = skill (only in gameplay context)
    const a: GameAction | null = e.button === 0 ? 'attack' : e.button === 2 ? 'skill' : null;
    if (a) { this._justP.add(a); this._held.set(a, true); }
  };

  private _onMUp = (e: MouseEvent) => {
    const a: GameAction | null = e.button === 0 ? 'attack' : e.button === 2 ? 'skill' : null;
    if (a) this._held.set(a, false);
  };

  private _noPrev = (e: Event) => e.preventDefault();

  // ── Virtual inputs (driven by MobileHUD React component) ──────────────────

  /** Called by joystick with normalized -1..1 values. */
  setVirtualAxis(x: number, y: number): void {
    this._vx = x;
    this._vy = y;
  }

  /** Called by action buttons; pressed=true on touchstart, false on touchend. */
  setVirtualButton(action: GameAction, pressed: boolean): void {
    if (pressed && !this._held.get(action)) this._justP.add(action);
    this._held.set(action, pressed);
  }

  // ── Query API (called from render loop) ───────────────────────────────────

  /**
   * Returns a normalized movement vector.
   *   x : left(−1) … right(+1)
   *   y : backward(−1) … forward(+1)
   * Forward (+y) maps to −Z in Babylon.js world space.
   */
  getMovementVector(): { x: number; y: number } {
    if (this.isMobile) return { x: this._vx, y: this._vy };
    let x = 0, y = 0;
    if (this._keys.has('ArrowLeft')  || this._keys.has('KeyA')) x -= 1;
    if (this._keys.has('ArrowRight') || this._keys.has('KeyD')) x += 1;
    if (this._keys.has('ArrowUp')    || this._keys.has('KeyW')) y += 1;
    if (this._keys.has('ArrowDown')  || this._keys.has('KeyS')) y -= 1;
    const len = Math.sqrt(x * x + y * y);
    if (len > 0) { x /= len; y /= len; }
    return { x, y };
  }

  isHeld(action: GameAction): boolean {
    return this._held.get(action) ?? false;
  }

  /**
   * Returns true the first time it's called after a press.
   * The flag is cleared on read (one-shot).
   */
  consumeJustPressed(action: GameAction): boolean {
    if (this._justP.has(action)) {
      this._justP.delete(action);
      return true;
    }
    return false;
  }
}

export const inputManager = new InputManager();
