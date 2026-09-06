/**
 * /inside-a-session's one enhancement: hovering or focusing a legend row lifts its pin on
 * the screenshot and quiets the other seven.
 *
 * The same device act 6 uses on the session plate, and for the same reason — a diagram
 * with eight leaders is hard to read one leader at a time, and the pointer is the natural
 * way to ask which one. It is an enhancement only: the legend is numbered and the pins are
 * numbered, so the pairing is already legible to a reader who never moves a mouse, and the
 * pins are aria-hidden because they carry no information the list does not.
 */
const legend = [...document.querySelectorAll('.is-legend > li')];
const pins = [...document.querySelectorAll('.is-pins > li')];

if (legend.length && legend.length === pins.length) {
  const box = document.querySelector('.is-shot');
  const lift = (i) => {
    box.classList.toggle('is-lit', i >= 0);
    pins.forEach((p, k) => p.classList.toggle('is-lit', k === i));
  };
  legend.forEach((li, i) => {
    li.addEventListener('pointerenter', () => lift(i));
    li.addEventListener('pointerleave', () => lift(-1));
    // Focus, not only hover: the legend rows are reachable by keyboard when they hold a
    // link, and a sighted keyboard reader should get the same pairing a mouse does.
    li.addEventListener('focusin', () => lift(i));
    li.addEventListener('focusout', () => lift(-1));
  });
}
