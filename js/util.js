export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, v) => (b === a ? 0 : clamp((v - a) / (b - a)));
export const smooth = (t) => t * t * (3 - 2 * t);
export const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t) => t * t * t;
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Frame-rate independent exponential approach. `rate` = fraction closed per 60th of a second. */
export const approach = (cur, target, rate, dt) =>
  cur + (target - cur) * (1 - Math.pow(1 - rate, dt * 60));

/** Map v from [a,b] to [0,1], smoothstepped. The workhorse of the whole timeline. */
export const band = (v, a, b) => smooth(inv(a, b, v));

/** A pulse that rises over [a,b] and falls over [c,d]. */
export const window_ = (v, a, b, c, d) => band(v, a, b) * (1 - band(v, c, d));

export const mix = (a, b, t) => {
  const k = clamp(t);
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
};

export const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
};

export const rgbToCss = (c) =>
  `rgb(${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(c[2] * 255)})`;

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const square = (file, rank) => `${FILES[file]}${rank}`;

export const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isTouch = () =>
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;

export const fmt = (n) => n.toLocaleString('en-US');

/** Deterministic pseudo-random so every reload composes identically. */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
