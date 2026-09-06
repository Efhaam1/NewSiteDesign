/**
 * Every supporting page loads this, and it does three things.
 *
 * It marks the document `js`, which is how the CSS knows it may hide one of two states
 * that are BOTH in the markup — the track readouts, the rail's nested levels, the filter.
 * Nothing is hidden until this line runs, so a reader with no JavaScript gets the whole
 * page rather than an empty one. That is the opposite of the homepage's contract and it is
 * deliberate: the film is an experience and these are documents.
 *
 * It binds the milled plate's pointer light, from ui/plates.js — the same function the
 * homepage uses, not a copy of it.
 *
 * And it drives the track control, which appears on three pages and is the one interaction
 * these pages share.
 */
import { bindPlates } from '../ui/plates.js';

document.documentElement.classList.add('js');
document.body.classList.add('js');

bindPlates();

/**
 * Explorer / Challenger. Both readouts are in the DOM; this only decides which one is on
 * and which button reads pressed. There is no fetch, no template and no state beyond the
 * attribute — press it, and the page says the other thing.
 *
 * Every group of buttons on the page that carries data-track is wired, so a page can hold
 * more than one and they stay independent.
 */
for (const wrap of document.querySelectorAll('.pg-track')) {
  const btns = [...wrap.querySelectorAll('.pg-way[data-track]')];
  const notes = [...wrap.querySelectorAll('.pg-track-note > [data-track]')];
  if (!btns.length || !notes.length) continue;
  const pick = (key) => {
    for (const b of btns) b.setAttribute('aria-pressed', String(b.dataset.track === key));
    for (const n of notes) n.classList.toggle('is-on', n.dataset.track === key);
  };
  for (const b of btns) b.addEventListener('click', () => pick(b.dataset.track));
  // Challenger is the pressed default in the markup, so the first paint already agrees
  // with itself; this only re-asserts it in case a browser restored a pressed state.
  pick((btns.find((b) => b.getAttribute('aria-pressed') === 'true') || btns[0]).dataset.track);
}
