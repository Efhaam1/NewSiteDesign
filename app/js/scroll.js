import { clamp, inv, approach, prefersReduced } from './util.js';

/**
 * Native scroll stays native — nothing is hijacked, so trackpads, keyboards,
 * screen readers and mobile momentum all behave. Only the *animation values*
 * are damped, which is what gives the motion its weight.
 */
export class ScrollEngine {
  constructor() {
    this.raw = 0;          // document progress 0..1, unsmoothed
    this.p = 0;            // damped progress — everything reads this
    this.v = 0;            // signed velocity, damped
    this.dir = 1;
    this.height = 1;
    this.acts = [];
    this.reduced = prefersReduced();
    this._last = 0;
    this._prevRaw = 0;
    this.onFrame = [];
    this._measure();
    addEventListener('resize', () => this._measure(), { passive: true });
    addEventListener('orientationchange', () => setTimeout(() => this._measure(), 260));
  }

  /** Register an act: an element whose sticky stage is pinned for its scroll length. */
  register(el) {
    const act = { el, name: el.dataset.act, top: 0, len: 1, t: 0, e: 0, h: 0, _qt: -1, _qe: -1, _qh: -1, active: false, entered: false };
    this.acts.push(act);
    return act;
  }

  _measure() {
    this.height = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    for (const a of this.acts) {
      const r = a.el.getBoundingClientRect();
      a.top = r.top + scrollY;
      a.len = Math.max(1, a.el.offsetHeight - innerHeight);
    }
  }

  frame(now) {
    const dt = this._last ? Math.min(0.05, (now - this._last) / 1000) : 1 / 60;
    this._last = now;

    this.raw = clamp(scrollY / this.height);
    const rate = this.reduced ? 1 : 0.16;
    const before = this.p;
    this.p = approach(this.p, this.raw, rate, dt);
    const dp = this.p - before;
    this.v = approach(this.v, dp / Math.max(dt, 1e-4), 0.12, dt);
    if (Math.abs(this.raw - this._prevRaw) > 1e-5) {
      this.dir = this.raw > this._prevRaw ? 1 : -1;
      this._prevRaw = this.raw;
    }

    const y = this.p * this.height;
    for (const a of this.acts) {
      a.t = clamp(inv(a.top, a.top + a.len, y));
      const on = y >= a.top - innerHeight * 1.15 && y <= a.top + a.len + innerHeight * 1.15;
      if (on !== a.active) {
        a.active = on;
        a.el.classList.toggle('is-live', on);
      }
      if (on) {
        // t  = progress while the stage is pinned
        // e  = how far the stage has slid IN from below (1 = pinned)
        // x  = how far it has slid OUT above (0 = still pinned)
        // Reveals run off e and x, not t, so a handover never lands on an empty
        // screen: the outgoing scene is still legible while the next slides up.
        // e = how far this stage has slid in from below (1 = pinned)
        // h = the handover window: the last viewport of this stage's pin.
        // Consecutive acts overlap by exactly 100vh (see `.act + .act` margin),
        // so act N's h and act N+1's e describe the same scroll window and the
        // two scenes cross-dissolve with no gap and no double exposure.
        a.e = clamp(inv(a.top - innerHeight, a.top, y));
        a.h = clamp(inv(a.top + a.len - innerHeight, a.top + a.len, y));
        // Writing a custom property invalidates style for the whole subtree, and
        // these subtrees are full screens of elements. Quantised to 1/400, which
        // is finer than a pixel of travel on any of these reveals.
        // 1/120 is ~48 steps across a typical reveal band. Measured: going coarser
        // than this buys no frames, so it is set for smoothness, not for speed.
        const qt = Math.round(a.t * 120) / 120;
        const qe = Math.round(a.e * 120) / 120;
        const qh = Math.round(a.h * 120) / 120;
        if (qt !== a._qt) { a._qt = qt; a.el.style.setProperty('--t', qt.toFixed(4)); }
        if (qe !== a._qe) { a._qe = qe; a.el.style.setProperty('--e', qe.toFixed(4)); }
        if (qh !== a._qh) { a._qh = qh; a.el.style.setProperty('--h', qh.toFixed(4)); }
        if (!a.entered) { a.entered = true; a.el.classList.add('has-entered'); }
      }
    }
    for (const fn of this.onFrame) fn(this, dt);
    return dt;
  }
}
