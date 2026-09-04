// Character count of every hero-opener candidate. Hard cap: 15 characters per line.
// Counts code points (not UTF-16 units), and flags any character that is not plain ASCII
// so a hair space / NBSP / curly quote cannot hide inside a count (STATE.md:91-92 trap).
const C = [
  ['A',  'One standard.',   'Every coach.',    'Every table.',   '13 / 12 / 12'],
  ['B',  'Your standard.',  'Every coach.',    'Every table.',   '14 / 12 / 12'],
  ['C',  'One standard.',   'Every coach.',    'Every class.',   '13 / 12 / 12'],
  ['D',  'One standard.',   'Every coach.',    'Go teach.',      '13 / 12 / 9'],
  ['E',  'One standard.',   'Same session.',   'Every coach.',   '13 / 13 / 12'],
  ['F',  'Walk in ready.',  'Every coach.',    'Every table.',   '14 / 12 / 12'],
  ['G',  'Any coach.',      'Any table.',      'Same hour.',     '10 / 10 / 10'],
  ['H',  'Hire Monday.',    'Teach Tuesday.',  'Same hour.',     '12 / 14 / 10'],
  ['I',  'Ask any coach.',  'Any Tuesday.',    'One answer.',    '14 / 12 / 11'],
  ['J',  'No Sunday prep.', 'No improvising.', 'Same hour.',     '15 / 15 / 10'],
  ['K',  'Second month.',   'Twentieth year.', 'Same hour.',     '13 / 15 / 10'],
  ['L',  'Your standard.',  'Every table.',    'Every week.',    '14 / 12 / 11'],
  ['M',  'Set the roster.', 'Not the lesson.', 'Every week.',    '15 / 15 / 11'],
  ['N',  'The standard.',   'In one head.',    'Unwritten.',     '13 / 12 / 10'],
  ['O',  'Every Sunday.',   'From scratch.',   'Again.',         '13 / 13 / 6'],
  ['P',  'The hour.',       'Never written.',  'Only taught.',   '9 / 14 / 12'],
  ['Q',  'Last Tuesday.',   'Table 4.',        'No record.',     '13 / 8 / 10'],
  ['R',  'The standard.',   'In one head.',    'Not yours.',     '13 / 12 / 10'],
  ['S',  'A parent asks.',  'You improvise.',  'Every time.',    '14 / 14 / 11'],
  ['T',  'One coach.',      'Three groups.',   'One Friday.',    '10 / 13 / 11'],
  ['**', 'Same session.',   'Every coach.',    'Every table.',   'INCUMBENT (shipped)'],
];
const CAP = 15;
let fails = 0, misclaimed = 0;
for (const [id, l1, l2, l3, claim] of C) {
  const ls = [l1, l2, l3];
  const n = ls.map((s) => [...s].length);
  const bad = n.map((v, i) => (v > CAP ? i + 1 : 0)).filter(Boolean);
  const odd = ls.flatMap((s, i) => [...s]
    .filter((ch) => ch.codePointAt(0) < 0x20 || ch.codePointAt(0) > 0x7e)
    .map((ch) => `L${i + 1}:U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`));
  const mine = n.join(' / ');
  const claimed = claim.replace(/\s/g, '') === mine.replace(/\s/g, '');
  if (bad.length) fails++;
  if (!claimed && !claim.startsWith('INCUMBENT')) misclaimed++;
  console.log(
    id.padEnd(3),
    ('"' + l1 + '"').padEnd(19) + ('"' + l2 + '"').padEnd(19) + ('"' + l3 + '"').padEnd(17),
    'MINE ' + mine.padEnd(13),
    'CLAIM ' + claim.padEnd(21),
    (claimed || claim.startsWith('INCUMBENT') ? 'count-ok ' : 'MISCLAIMED') + '  ' +
    (bad.length ? 'OVER CAP on line ' + bad.join(',') : 'all <= ' + CAP) +
    (odd.length ? '  NON-ASCII ' + odd.join(',') : ''));
}
console.log(`\n${C.length - 1} candidates + incumbent. Over-cap: ${fails}. Misclaimed counts: ${misclaimed}.`);
// longest line in the set, and the widest single line
const all = C.flatMap(([id, ...r]) => r.slice(0, 3).map((s, i) => [id, i + 1, s, [...s].length]));
all.sort((a, b) => b[3] - a[3]);
console.log('longest lines: ' + all.slice(0, 8).map((x) => `${x[0]}L${x[1]} "${x[2]}"=${x[3]}`).join('  '));
