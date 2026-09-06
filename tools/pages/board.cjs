/**
 * A position, as one <svg>, generated at build time.
 *
 * The same idiom act 1's board uses (compare.js:258): everything in one `0 0 8 8` user
 * space — thirty-two dark squares, the men, the rim coordinates and any mark — so a
 * mark's coordinates ARE squares and the registration is exact at every size. One box to
 * lay out instead of sixty-five, no JavaScript, no 64 divs, and the position ships in the
 * HTML rather than arriving from a fetch.
 *
 * The square colours are /teach's and act 4's (#e8dcc4 / #a98a63, teach.css:186), set in
 * pages.css, so the same FEN reads the same on every route in the product.
 *
 * The FEN parser is deliberately the site's own — the accessible name it builds is the
 * board's real content for a reader who cannot see it, and it must not diverge from what
 * board2d.js says about the same position.
 */

const GLYPH = { p: 'P', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };
const WORD = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** FEN -> an 8x8 grid of {c,t} or null, rank 8 first. Ported from board2d.js. */
function parseFen(fen) {
  return fen.split(' ')[0].split('/').map((row) => {
    const out = [];
    for (const ch of row) {
      if (/\d/.test(ch)) { for (let i = 0; i < +ch; i++) out.push(null); }
      else out.push({ c: ch === ch.toUpperCase() ? 'w' : 'b', t: ch.toLowerCase() });
    }
    while (out.length < 8) out.push(null);
    return out;
  });
}

/**
 * The sentence a screen reader gets, and the alt text a search engine reads: side to
 * move first, because a position nobody can act on is not a position, then every man on
 * the board. board2d.js's own wording, so the two agree.
 */
function describe(fen, note) {
  const grid = parseFen(fen);
  const men = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = grid[r][f];
      if (p) men.push(`${p.c === 'w' ? 'white' : 'black'} ${WORD[p.t]} on ${FILES[f]}${8 - r}`);
    }
  }
  const turn = fen.split(' ')[1] === 'b' ? 'Black' : 'White';
  return `${turn} to move.${note ? ' ' + note : ''}${men.length ? ' ' + cap(men.join(', ')) + '.' : ''}`;
}

/**
 * @param fen   the position, straight from the bundle
 * @param opts  .label   a sentence prefixed to the accessible name (the puzzle's own prompt)
 *              .coords  draw the rim coordinates (off for the small diagrams, where a
 *                       0.3-unit glyph is sub-pixel — act 1 drops them below 901px for
 *                       exactly this reason)
 *              .cls     extra classes
 */
function board(fen, opts = {}) {
  const grid = parseFen(fen);
  const out = [];
  out.push(`<svg class="pg-board${opts.cls ? ' ' + opts.cls : ''}" viewBox="0 0 8 8" role="img"`
    + ` aria-label="${esc(describe(fen, opts.label))}">`);
  out.push('<rect class="b-l" x="0" y="0" width="8" height="8"/>');
  const dark = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) if ((x + y) % 2) dark.push(`M${x} ${y}h1v1h-1z`);
  }
  out.push(`<path class="b-d" d="${dark.join('')}"/>`);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const p = grid[y][x];
      if (!p) continue;
      out.push(`<image href="/assets/cburnett/${p.c}${GLYPH[p.t]}.svg"`
        + ` x="${(x + 0.06).toFixed(2)}" y="${(y + 0.06).toFixed(2)}" width="0.88" height="0.88"/>`);
    }
  }
  if (opts.coords) {
    out.push('<g class="b-co" font-size="0.3">');
    for (let f = 0; f < 8; f++) {
      out.push(`<text x="${f + 0.5}" y="7.78" text-anchor="middle">${FILES[f]}</text>`);
    }
    for (let k = 0; k < 8; k++) out.push(`<text x="0.12" y="${k + 0.3}">${8 - k}</text>`);
    out.push('</g>');
  }
  out.push('</svg>');
  return out.join('');
}

module.exports = { board, describe, parseFen };
