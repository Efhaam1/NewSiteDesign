import { FILES } from '../util.js';

export const GLYPH = { p: 'P', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };
// the same map in words, because a screen reader has to say the piece, not spell it
const WORD = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** FEN -> an 8x8 grid of {c: 'w'|'b', t: 'p'...} or null, rank 8 first. */
export function parseFen(fen) {
  const rows = fen.split(' ')[0].split('/');
  return rows.map((row) => {
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
 * A board that is drawn, not embedded. Own component on purpose: chessground is
 * GPL-3.0 and this is a commercial product (ADR-0007). Pieces are cburnett SVG,
 * CC BY-SA 3.0, which is GPL-compatible for artwork; the credit line still has
 * to ship in the footer, and there is no ATTRIBUTION file in this prototype.
 */
export class Board2D {
  constructor(el, opts = {}) {
    this.el = el;
    this.flip = !!opts.flip;
    this.el.classList.add('board2d');
    this.el.setAttribute('role', 'img');
    this.cells = [];
    for (let i = 0; i < 64; i++) {
      const sq = document.createElement('div');
      sq.className = 'sq';
      this.el.appendChild(sq);
      this.cells.push(sq);
    }
  }

  /** grid index -> algebraic, honouring flip */
  name(i) {
    const r = Math.floor(i / 8), f = i % 8;
    return this.flip ? `${FILES[7 - f]}${r + 1}` : `${FILES[f]}${8 - r}`;
  }

  render(fen, highlight = []) {
    let grid = parseFen(fen);
    if (this.flip) grid = grid.slice().reverse().map((r) => r.slice().reverse());
    const men = [];
    for (let i = 0; i < 64; i++) {
      const r = Math.floor(i / 8), f = i % 8;
      const sq = this.cells[i];
      const nm = this.name(i);
      const light = (r + f) % 2 === 0;
      sq.className = `sq ${light ? 'l' : 'd'}`;
      if (nm === highlight[0]) sq.classList.add('from');
      else if (highlight.includes(nm)) sq.classList.add('to');
      sq.textContent = '';
      // coordinates on the outer rim only, like a tournament board
      if (r === 7) {
        const c = document.createElement('span');
        c.className = 'co f'; c.textContent = nm[0]; sq.appendChild(c);
      }
      if (f === 0) {
        const c = document.createElement('span');
        c.className = 'co r'; c.textContent = nm[1]; sq.appendChild(c);
      }
      const p = grid[r][f];
      if (p) {
        const img = document.createElement('img');
        img.src = `/assets/cburnett/${p.c}${GLYPH[p.t]}.svg`;
        img.alt = '';
        img.decoding = 'async';
        sq.appendChild(img);
        men.push(`${p.c === 'w' ? 'white' : 'black'} ${WORD[p.t]} on ${nm}`);
      }
    }
    // side to move first: a position no one can act on is not a position
    const turn = fen.split(' ')[1] === 'b' ? 'Black' : 'White';
    const list = men.length ? ` ${cap(men.join(', '))}.` : '';
    // the last move is a fact about the position, not decoration, so it is said
    const last = highlight.length === 2 ? ` Last move ${highlight[0]} to ${highlight[1]}.` : '';
    this.el.setAttribute('aria-label', `${turn} to move.${last}${list}`);
  }
}
