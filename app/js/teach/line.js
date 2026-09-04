import { Chess } from '/vendor/chess/chess.js';

/**
 * A position plus a SAN line, turned into one FEN per ply so a coach can step a
 * demonstration move by move. chess.js is the same move-logic brain the curriculum
 * was verified with, so a line that steps here is a line that passed the legality checks.
 *
 * Never throws. Bundle validation already proved these lines legal, but a
 * malformed one has to degrade to "show the position" rather than blank the screen
 * in the middle of a class.
 */
export function buildLine(fen, moves = []) {
  const plies = [{ fen, san: null, highlight: [] }];
  let game;
  try {
    game = new Chess(fen);
  } catch {
    return plies;
  }
  for (const san of moves) {
    try {
      const m = game.move(san);
      plies.push({ fen: game.fen(), san: m.san, highlight: [m.from, m.to] });
    } catch {
      break;
    }
  }
  return plies;
}

/**
 * The same line as a PGN fragment a coach can paste into any board or engine.
 * SetUp + FEN is what the standard requires of a game that does not start from the
 * initial array, and the movetext starts at the FEN's own move number and side, so
 * a black-to-move puzzle reads `23... Kf8` rather than `1. Kf8`.
 */
export function buildPgn(fen, plies, meta = {}) {
  const field = fen.split(' ');
  let no = Number(field[5]) || 1;
  let black = field[1] === 'b';
  const text = [];
  plies.slice(1).forEach((p, i) => {
    if (!black) text.push(`${no}.`);
    else if (i === 0) text.push(`${no}...`);
    text.push(p.san);
    if (black) no += 1;
    black = !black;
  });
  const tags = [
    ['Event', meta.event || 'Efhaam session'],
    ['Site', 'Efhaam curriculum bundle 1.1.0'],
    ['Result', '*'],
    ['SetUp', '1'],
    ['FEN', fen],
  ];
  return `${tags.map(([k, v]) => `[${k} "${v}"]`).join('\n')}\n\n${text.join(' ')} *`;
}
