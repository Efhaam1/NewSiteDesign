import { el } from './console.js';

/**
 * The licence schedule, as four cards and one offer.
 *
 * IT WAS A RULED LEDGER UNTIL 2026-09-05, and the founder's reference replaced it:
 * a centred head, a pill billing control, four equal cards side by side, the
 * recommended one lifted out of the row, the last one inverted to an ink plate.
 * Copied from the mock, on the same instruction act 4's radius was copied under
 * (STATE.md decision 12) — so the cards carry a radius, and the shape of the
 * composition is the reference's, not a tidier version of it.
 *
 * What did NOT come from the mock, because the mock is a mock and this is a
 * product:
 *  - Its four cards are Individuals / Teams / Organizations / Enterprise. Ours
 *    are the four licences in `pricing.json`. The six-week pilot is the fifth
 *    band in that file and it is NOT a fifth card: it is an offer, not a tier,
 *    and it keeps the ruled-off strip it has always had, under the row.
 *  - Its badge says "Most Popular". We do not know that, so Growth keeps the chip
 *    it already had — "What the pilot runs on" — in the badge's position.
 *  - Its buttons say "Get started". There is no signup: /teach is the only route
 *    this site has (README, "links to nowhere"), so every card carries the one CTA
 *    the nav and the hero carry, and the pilot still carries none.
 *
 * The tick list is the one structural addition, and it invents nothing. Every
 * item is a clause of the band's own `adds` sentence, itemised in `pricing.json`;
 * the sentence itself survives as `addsShort` and takes the column back on short
 * windows, so no window ever loses a claim — it only reads it as prose instead of
 * as rows.
 *
 * The billing control swaps a PAIR of figures rather than an emphasis: monthly reads
 * the monthly price over the yearly one, yearly reads the yearly price over what it
 * works out to a month. The default state carries the whole schedule, so a reader who
 * never touches the control is never shown half of it.
 */

/**
 * One figure and its unit, from pricing.json, in three parts so that the control
 * can promote either figure without either one changing shape.
 *
 * Two demotions, and both exist because a mono glyph at price size is as wide as a
 * digit. `from $499` set whole makes Enterprise shout the one number on the sheet
 * that is a floor rather than a price, so a leading word is demoted to the size of
 * the unit after it. And `$390 a year` set whole gives the yearly figure two words
 * of price-size type that the monthly figure does not have, so the trailing unit is
 * demoted the same way `a month` already was.
 *
 * Neither split rewrites a string. The leading word is taken only when what follows
 * it starts with a currency mark, and the trailing unit only when what precedes it
 * is a figure - so `Quoted, not listed.`, which is the annual slot for Enterprise,
 * matches neither and is printed whole.
 */
function figure(fee, cls, text, unit) {
  const box = el(fee, 'span', cls + ' num');
  const pre = /^([^\d$]+)\s(\$.+)$/.exec(text);
  const body = pre ? pre[2] : text;
  const tail = /^(\$[\d,.]+)\s+(.+)$/.exec(body);
  // The spaces are real text nodes, not the margins that separate the parts visually.
  // Without them the box reads `$39a month` to anything that walks textContent — a
  // screen reader, a copy-paste, and this repo's own instruments — because the string
  // was split apart to be SET differently, not to be read differently.
  const gap = () => box.appendChild(document.createTextNode(' '));
  // An <i>, not a <small>: the unit selectors in terms.css are `small` and the
  // annual swap has to reach them at four classes deep, which no `.rate-pre` rule
  // could then outrank. A different element is cheaper than an !important.
  if (pre) { el(box, 'i', 'mono rate-pre', pre[1]); gap(); }
  el(box, 'span', 'rate-n', tail ? tail[1] : body);
  const u = tail ? tail[2] : unit;
  if (u) { gap(); el(box, 'small', 'mono', u); }
  return box;
}

function band(list, b, P) {
  const li = el(list, 'li', 'rate-band' + (b.recommended ? ' is-fit' : '')
    + (b.invert ? ' is-invert' : ''));

  // The card's name row. In the mock the badge sits on the plan name's line,
  // right-aligned, with an amber mark in front of it; `.kicker .dot` is this
  // page's amber mark and it is a rotated square, which is the same substitution
  // product.css:249 records for the mock's round dot.
  const top = el(li, 'span', 'rate-top');
  el(top, 'span', 'rate-name', b.name);
  if (b.chip) {
    const chip = el(top, 'span', 'rate-chip mono');
    el(chip, 'i', 'dot').setAttribute('aria-hidden', 'true');
    el(chip, 'span', '', b.chip);
  }

  // Two figures per state, and the control swaps the PAIR rather than just the emphasis:
  // monthly shows what a month costs and what a year costs; yearly shows what a year costs
  // and what that works out to a month. Each state answers the question its own basis
  // raises, neither puts two different `a month` figures in one card, and the state a
  // reader who never touches the control sees — the default — carries the whole schedule.
  // The one band whose annual slot is a sentence rather than a figure keeps the pair it
  // already has; see terms.css's note on `.is-invert`.
  const fee = el(li, 'span', 'rate-fee');
  figure(fee, 'rate-mo', b.monthly, b.per);
  figure(fee, 'rate-yr', b.annual);
  if (b.effective) el(fee, 'span', 'rate-eff mono', b.effective);

  // Two renderings of the same benefit, one element. The rows are the mock's; the
  // sentence is what a window shorter than the rows gets instead. Both come from
  // pricing.json and quote the same docs/product/05-pricing-and-funnel.md table,
  // so nothing is claimed in one that is not claimed in the other. The wrapper
  // keeps its `.rate-adds` class in both states, which is what the sheet is
  // measured on (gate id terms-explains-bands).
  //
  // The size of the academy heads the list rather than sitting beside the price,
  // which is where the mock puts its one bold line and what the mock uses it for:
  // who the card is for. Here that is the seat and roster band, because the
  // headline above says the size of the academy IS what is being paid for. It is
  // inside `.rate-adds` so the card has four blocks, not five - three gaps to
  // distribute instead of four, which is what keeps the name-to-price and
  // list-to-button air the mock draws.
  const adds = el(li, 'div', 'rate-adds');
  el(adds, 'span', 'rate-fit mono', b.fit);
  const ul = el(adds, 'ul', 'ra-l');
  // same reason as the row's own `role="list"`: terms.css takes the markers off, and
  // WebKit takes the list semantics off with them, so the count of what a licence adds
  // stops being announced.
  ul.setAttribute('role', 'list');
  (b.items || []).forEach((it) => el(ul, 'li', '', it));
  el(adds, 'span', 'ra-s', b.addsShort || b.adds);
  if (b.aside) el(adds, 'em', 'rate-aside', b.aside);

  // Bottom-aligned in every card, which is what makes four cards of unequal list
  // length read as one row rather than four boxes. terms.css does the aligning;
  // this is only the last child.
  const a = el(li, 'a', 'cta rate-go', P.cta.label);
  a.href = '/teach';
  a.setAttribute('aria-label', P.cta.label + ' — ' + b.name);
  return li;
}

/**
 * The pilot. Not a card: `pricing.json` marks it `pilot`, the sheet has always
 * ruled it off from the licences, and it has no button because /pilot has no
 * route. It keeps its own strip under the row, where the smallest number on the
 * sheet is the last one read.
 */
function pilot(root, b) {
  const s = el(root, 'div', 'rate-pilot');
  const who = el(s, 'span', 'rate-p-who');
  el(who, 'span', 'rate-p-k mono', 'Pilot');
  el(who, 'span', 'rate-name', b.name);

  // The one price on the sheet the control does not touch, so it carries no yearly
  // figure at all and the P5/P24 exception this row needed for one is gone with it:
  // a pilot is $199 flat in either billing state.
  figure(el(s, 'span', 'rate-fee'), 'rate-mo', b.monthly, b.per);

  const body = el(s, 'span', 'rate-p-body');
  el(body, 'span', 'rate-fit mono', b.fit);
  el(body, 'span', 'rate-p-adds', b.adds);
  // `annual` and `effective` are one sentence in pricing.json's own words -
  // "Credited in full" and "against your first annual licence" - and it is the
  // sentence that makes the price a floor rather than a cost, so it is set on the
  // hue rather than filed under the figure.
  el(body, 'span', 'rate-p-credit', b.annual + ' ' + b.effective + '.');
  return s;
}

/**
 * The mock draws a pill: two segments and a discount label sitting in the same
 * track, the live segment on a raised chip. `pricing.json` used to carry
 * "Yearly · 2 months free" as one string; it is two now — the button's label and
 * the note beside it — because the mock puts them at different weights and the
 * gate clicks the second `.rate-bill-b`, which has to be the yearly BUTTON.
 */
function billing(into, root, P) {
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
  if (P.annual.note) el(wrap, 'span', 'rate-bill-note mono', P.annual.note);
}

export function buildRate(root, P) {
  // The head's third line in the mock is the control. Everything in this row is
  // centred under the headline: the control first, then the line that states the
  // currency and what a licence is counted per — which is the only place the page
  // says either (B6), so it survives every thinning tier below 900px.
  const cap = el(root, 'div', 'rate-cap');
  billing(cap, root, P);
  // One line, and it carries two things the mock has no slot for: the currency and
  // what a licence is counted per (B6 - the only place the page says either), and
  // the sheet's own provenance for its figures. Two centred mono lines under the
  // pill was one line of centred small type too many between the head and the row.
  const capL = el(cap, 'span', 'rate-cap-l mono');
  el(capL, 'span', '', 'Licence schedule · ' + P.currency + ' · ' + P.billed);
  // Two spans on one line, and the separator belongs to the second one so that
  // hiding it does not leave a dangling middot: the short-window tiers drop the
  // provenance first and the currency last, which is the order B6 set.
  el(capL, 'span', 'rate-prov', ' · ' + P.provenance);

  // The one line that answers the question a price list always provokes. It sits
  // where the mock's subtitle sits, and it says something.
  const inv = el(root, 'p', 'rate-inv');
  el(inv, 'span', 'rate-inv-l mono', P.invariant.label);
  const c = el(inv, 'span', 'rate-inv-c', P.invariant.claim);
  if (P.invariant.claimMore) el(c, 'span', 'rate-inv-more', ' ' + P.invariant.claimMore);

  const list = el(root, 'ol', 'rate-list');
  // `role="list"` is not redundant here: terms.css sets `list-style: none` on this element
  // and WebKit drops the list/listitem roles when it does, which takes the aria-label with
  // them — an aria-label on a `generic` is not exposed. Without this, the one sentence that
  // tells a screen-reader user how the row is ordered is missing on VoiceOver.
  list.setAttribute('role', 'list');
  list.setAttribute('aria-label', 'Four licences, cheapest first');
  P.bands.filter((b) => !b.pilot).forEach((b) => band(list, b, P));

  // The micro line the four plates share, directly under the row it qualifies.
  // It used to sit beside a fifth, section-level CTA; with a button in every card
  // that button was the fifth identical plate on one screen, so the plate is gone
  // and the line it carried is not. Asserted at gate id terms-cta-on-stage, which
  // now measures the lowest card button and this line together.
  const cta = el(root, 'div', 'cta-row rate-cta');
  el(cta, 'span', 'mono tiny', P.cta.micro);

  const p = P.bands.find((b) => b.pilot);
  if (p) pilot(root, p);

  const led = el(root, 'div', 'rate-led');
  P.ledger.forEach((line) => el(led, 'p', '', line));


  // Nothing here needs a per-frame updater: every reveal is a clamp() on the
  // --t / --e / --h the scroll engine already writes onto the act.
  return function update() {};
}
