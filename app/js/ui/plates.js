/**
 * bindPlates, lifted out of ui/chrome.js on 2026-09-06 so the supporting pages can use it
 * without pulling in ui/console.js (and through it board2d and the whole act-5 console) for
 * one function. chrome.js re-exports it, so js/main.js's import is unchanged.
 *
 * The full reasoning for every choice in here is in the comment below, which came with it.
 */
/**
 * The pointer, written onto the button under it. product.css's .cta face is a
 * radial gradient whose light source is `var(--mx) var(--my)`, so moving those two
 * properties moves the highlight: the plate is brightest exactly where the cursor
 * is and rolls into its own chamfer away from it. That is the whole of the liquid.
 *
 * Three deliberate choices about cost:
 *  - The properties are set on the ELEMENT, never on :root. A custom property on
 *    the root element recalculates style for the entire document on every write,
 *    which is the 12ms-a-frame trap acts.css:118 records; on the element it
 *    invalidates one ~168x49 box.
 *  - `pointermove` does not exist until the pointer is inside a button, and is
 *    removed on the way out. Off-hover this costs exactly nothing, which is what
 *    lets it run beside eight pinned acts and two WebGL contexts.
 *  - The write is coalesced into a rAF, so a 1000Hz mouse still writes once a frame.
 *
 * Every .cta is in the DOM by the time boot() calls this (act 6's pair is built by
 * buildRate, act 7's is authored markup), and none is created afterwards.
 */
export function bindPlates(root = document) {
  // A coarse pointer has no hover state to track, and no cursor to follow.
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // At most one plate is ever lit. `pointerleave` does not always fire when the
  // element leaves the POINTER — an act scrolling out from under the cursor takes
  // its stage to `visibility: hidden` instead — so a button could keep a stale light
  // position. Measured: one of seven held a stale --mx after a sweep of all eight
  // acts. Handing the previous holder over on the next enter fixes the case that can
  // actually be seen, which is two buttons on screen at once during a handover.
  let lit = null;
  const douse = (btn) => {
    btn.style.removeProperty('--mx');
    btn.style.removeProperty('--my');
    if (lit === btn) lit = null;
  };

  // `.sy-plate` is act 6's session artefact, which carries the same milled face as a
  // .cta (system.css) for the same reason: a flat rectangle reads as unfinished, and the
  // face's light source IS --mx/--my. Nothing else about the two elements is shared.
  for (const btn of root.querySelectorAll('.cta, .sy-plate')) {
    let raf = 0;
    let px = 0;
    let py = 0;

    const write = () => {
      raf = 0;
      const r = btn.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = ((px - r.left) / r.width) * 100;
      // The light stays ABOVE the plate — a highlight from below reads as a
      // different, wrong material. The cursor's vertical position leans it, from
      // -34% at the top edge to -6% at the bottom, rather than placing it.
      const y = -34 + ((py - r.top) / r.height) * 28;
      btn.style.setProperty('--mx', x.toFixed(1) + '%');
      btn.style.setProperty('--my', y.toFixed(1) + '%');
    };

    const move = (e) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(write);
    };

    const off = () => {
      btn.removeEventListener('pointermove', move);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      // Back to the declared rest state, so the plate is lit the same way on every
      // button until a pointer says otherwise.
      douse(btn);
    };

    btn.addEventListener('pointerenter', (e) => {
      if (lit && lit !== btn) douse(lit);
      lit = btn;
      btn.addEventListener('pointermove', move);
      move(e);
    });

    btn.addEventListener('pointerleave', off);
    btn.addEventListener('pointercancel', off);

    /**
     * The press, at the point it was actually pressed.
     *
     * product.css:.cta-rip is a 22px disc of the label's own ink that scales out
     * and fades; all this does is put it where the finger went down. Same three
     * cost rules as the light above: one absolutely positioned child, so no
     * layout; `currentColor`, so no second declaration for the ink plate; and it
     * removes itself.
     *
     * The removal is a timer rather than `animationend`, deliberately. base.css:91
     * pauses every animation inside an act that stops being live, so a plate
     * pressed on the way out of an act would keep a paused disc forever and
     * `animationend` would never arrive.
     */
    btn.addEventListener('pointerdown', (e) => {
      if (still || e.button !== 0) return;
      const r = btn.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const rip = document.createElement('span');
      rip.className = 'cta-rip';
      rip.setAttribute('aria-hidden', 'true');
      rip.style.setProperty('--rx', (e.clientX - r.left).toFixed(1) + 'px');
      rip.style.setProperty('--ry', (e.clientY - r.top).toFixed(1) + 'px');
      btn.appendChild(rip);
      setTimeout(() => rip.remove(), 700);
    });
  }
}
