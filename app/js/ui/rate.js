import { el } from './console.js';

/**
 * The licence schedule.
 *
 * Pricing on this site is a document, not a card grid. Act 5 lifts the room to
 * paper and says so out loud — light is what the parent and the photocopier get —
 * so the price arrives as the next sheet on the same table: ruled in hairlines,
 * set in the same ink, one band per licence, cheapest first.
 *
 * It is a ledger rather than a tick matrix on purpose. A matrix of ticks invites
 * exactly one question — what am I not getting for $39? — and the honest answer
 * is "no lessons", because every tier above Starter reads "Everything +" in
 * docs/product/05-pricing-and-funnel.md. So the sheet says that once, at the top,
 * and then each band only has to say what it adds.
 *
 * Every figure comes from /data/pricing.json, which quotes that document. The
 * billing control moves the emphasis between the monthly and the yearly figure
 * and hides neither: a schedule that puts half its own numbers behind a switch is
 * not a schedule.
 */

function band(list, b) {
  const li = el(list, 'li', 'rate-band' + (b.recommended ? ' is-fit' : '')
    + (b.pilot ? ' is-pilot' : '') + (b.quiet ? ' is-quiet' : ''));
  el(li, 'span', 'rate-i mono', b.i);

  const who = el(li, 'span', 'rate-who');
  if (b.chip) el(who, 'span', 'rate-chip mono', b.chip);
  el(who, 'span', 'rate-name', b.name);
  el(who, 'span', 'rate-fit mono', b.fit);

  const fee = el(li, 'span', 'rate-fee');
  const mo = el(fee, 'span', 'rate-mo num', b.monthly);
  el(mo, 'small', 'mono', b.per);
  el(fee, 'span', 'rate-yr num', b.annual);
  el(fee, 'span', 'rate-eff mono', b.effective);

  // Two renderings of the same benefit, one element. Below 660px of height the sheet
  // used to delete this column outright for four of the five bands, so a reader at
  // 1244x620 saw five prices and one explanation; now the short form takes over.
  // Both come from pricing.json and quote the same docs/product/05-pricing-and-funnel.md
  // table, so nothing is claimed in one that is not claimed in the other. The wrapper
  // keeps its `.rate-adds` class in both states, which is what the sheet is measured on.
  const adds = el(li, 'span', 'rate-adds');
  el(adds, 'span', 'ra-l', b.adds);
  el(adds, 'span', 'ra-s', b.addsShort || b.adds);
  if (b.aside) el(adds, 'em', 'rate-aside', b.aside);
  return li;
}

/**
 * Both figures stay on the sheet at all times. The control only says which one a
 * reader is being asked to compare, so no price is ever unavailable to someone
 * who never touches it.
 */
function billing(root, into, P) {
  const wrap = el(into, 'span', 'rate-bill');
  const mk = (label, annual) => {
    const b = el(wrap, 'button', 'rate-bill-b mono', label);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(!annual));
    b.addEventListener('click', () => {
      root.classList.toggle('is-annual', annual);
      for (const other of wrap.querySelectorAll('.rate-bill-b')) {
        other.setAttribute('aria-pressed', String(other === b));
      }
    });
  };
  mk('Monthly', false);
  mk(P.annual.label, true);
}

export function buildRate(root, P) {
  const cap = el(root, 'div', 'rate-cap');
  const capL = el(cap, 'span', 'rate-cap-l');
  el(capL, 'span', 'mono', 'Licence schedule · ' + P.currency + ' · ' + P.billed);
  billing(root, capL, P);
  el(cap, 'span', 'mono rate-prov', P.provenance);

  // The one line that answers the question a price list always provokes.
  const inv = el(root, 'p', 'rate-inv');
  el(inv, 'span', 'rate-inv-l mono', P.invariant.label);
  const c = el(inv, 'span', 'rate-inv-c', P.invariant.claim);
  if (P.invariant.claimMore) el(c, 'span', 'rate-inv-more', ' ' + P.invariant.claimMore);

  const list = el(root, 'ol', 'rate-list');
  list.setAttribute('aria-label', 'Licence schedule, cheapest licence first, then the pilot');
  P.bands.forEach((b) => band(list, b));

  const led = el(root, 'div', 'rate-led');
  P.ledger.forEach((line) => el(led, 'p', '', line));

  // The same filled CTA the nav, the hero and act 7 carry, pointing at the one page that
  // exists. The pilot is prose, not a button: /pilot has no route yet.
  const cta = el(root, 'div', 'cta-row rate-cta');
  const a = el(cta, 'a', 'cta', 'Teach a free session');
  a.href = '/teach';
  el(cta, 'span', 'mono tiny', P.cta.micro);

  // Nothing here needs a per-frame updater: every reveal is a clamp() on the
  // --t / --e / --h the scroll engine already writes onto the act.
  return function update() {};
}
