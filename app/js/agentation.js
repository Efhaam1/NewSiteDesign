/**
 * Agentation — click any element on the page, write a note, and the coding agent reads it
 * over MCP instead of you describing "the pawn that overlaps the headline" in prose.
 *
 * Dev-only by construction: the bundle is a dynamic import behind a hostname check, so a
 * deployed copy of `app/` never fetches those 586 KB.
 *
 * Wants `agentation-mcp server` running (HTTP on :4747) for annotations to reach the agent
 * directly; the toolbar's copy-to-clipboard path needs nothing.
 */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

/**
 * ...and not in an instrument. Every page load registers a session on :4747, and this repo's
 * measurement path is Playwright: one `tools/gate.cjs` run is ~50 loads, and `shot.cjs`,
 * `meas.cjs`, `contrast.cjs` and `say.cjs` are one each. By 2026-09-04 the server held 3,205
 * sessions, of which the founder had opened a handful — `agentation_list_sessions` returned
 * 554 KB and the real session could not be found in it. Those runs also paid to fetch and
 * mount 586 KB of toolbar they never click.
 *
 * `navigator.webdriver` is the automation flag Playwright, Puppeteer and Selenium all set.
 * `?agentation=1` forces the toolbar on anyway, for annotating inside a driven browser.
 */
const automated = navigator.webdriver === true;
const forced = new URLSearchParams(location.search).has('agentation');

if (LOCAL_HOSTS.has(location.hostname) && (forced || !automated)) {
  import('/vendor/agentation/agentation.js')
    .then((mod) => mod.mount())
    .catch((err) => console.warn('[agentation] toolbar unavailable:', err.message));
}
