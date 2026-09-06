/**
 * The shell every supporting page is built into: head, chrome, footer, breadcrumbs and
 * the structured-data graph.
 *
 * WHY THESE PAGES ARE GENERATED RATHER THAN WRITTEN. The curriculum page has to carry all
 * 213 session rows as real markup — the brief's own constraint, and the correct one: a
 * crawler and an answer engine both have to be able to read the syllabus without executing
 * a fetch. 213 hand-written rows would also be 213 places for a figure to drift. So the
 * templates hold the prose and `tools/pages/data.cjs` holds the counts, and every number
 * on every page is a field read at build time. Re-run `node tools/build-pages.cjs` when the
 * bundle changes; `--check` proves the committed HTML still matches the data.
 *
 * WHY THEY ARE PAPER. The film ends on paper: `director.js`'s RAMPS take --fg to #14141c
 * and --glass to near-white as the room lifts, and acts 5-8 are entirely on that side. So
 * the dark room is what a coach teaches FROM (/teach, the console) and the paper is what
 * gets read — which makes a document set on ivory the continuation of the homepage's own
 * tonal logic rather than a second identity. Every value in pages.css is one of those two
 * ends of an existing token. No new palette value enters the system.
 */
const { fmt } = require('./data.cjs');

/** Documented in ADR-0006 and 04-brand-identity.md §B. Not invented, and not a guess. */
const ORIGIN = 'https://efhaam.com';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** Curly quotes and dashes, so the prose reads set rather than typed. */
const t = (s) => String(s)
  .replace(/---/g, '&mdash;')
  .replace(/ -- /g, ' &ndash; ')
  .replace(/\.\.\./g, '&hellip;')
  .replace(/(\w)'(\w)/g, '$1&rsquo;$2')
  .replace(/'/g, '&rsquo;')
  .replace(/"([^"]*)"/g, '&ldquo;$1&rdquo;');

/** A non-breaking space in the last gap, so a heading never leaves one word alone. */
const knit = (s) => s.replace(/ ([^ ]+)$/, '&nbsp;$1');

/**
 * The site map, in one place, because it is the nav, the footer, the sitemap and the
 * breadcrumb trail. `nav` is whether the page appears in the header row.
 *
 * Six supporting pages and five stage pages, and the reason for each is written on it.
 * `/teach` is deliberately absent from the indexable set — see NOINDEX below.
 */
const PAGES = [
  { path: '/', title: 'Home', nav: false, label: 'The curriculum, as a film' },
  { path: '/curriculum', title: 'Curriculum', nav: true, label: 'Every stage, level, unit and session' },
  { path: '/inside-a-session', title: 'Inside a session', nav: true, label: 'What one hour actually contains' },
  { path: '/for-chess-coaches', title: 'For coaches', nav: true, label: 'The planning is already done' },
  { path: '/for-chess-academies', title: 'For academies', nav: true, label: 'One standard across every coach' },
  { path: '/about', title: 'About', nav: true, label: 'The name, the method, what is built' },
];

/**
 * /teach stays out of the index, and it is a decision rather than an oversight.
 *
 * The console renders entirely from `fetch('/data/showcase.json')` — its markup ships as an
 * empty shell with no session in it, so what a crawler stores is a page of blank panels.
 * It also takes `?s=S001|S042|S115`, which is three URLs for one document. Indexing it
 * would put a thin, duplicated, contentless page in front of readers who searched for the
 * thing /inside-a-session actually answers in prose. So it is `noindex, follow`: the link
 * equity passes, the page stays out of results, and the searchable version of it is a page
 * that can be read without JavaScript.
 */
const NOINDEX = ['/teach'];

const url = (p) => (p === '/' ? ORIGIN + '/' : ORIGIN + p);

/**
 * The structured-data graph, and it is deliberately short.
 *
 * WHAT GOOGLE STILL CONSUMES for a site like this, checked against the supported-features
 * gallery rather than against habit: Organization, WebSite (name and url, on the root page
 * only — the SearchAction sitelinks box was removed in 2024), BreadcrumbList, and Course
 * list, which is Course plus an ItemList of at least three course URLs on a summary page.
 * That is the whole list.
 *
 * WHAT IS DELIBERATELY ABSENT, each for a reason:
 *  - `FAQPage`. The rich result stopped appearing in May 2026 and the documentation was
 *    deleted in June 2026. A page here answers questions in prose because a reader wants
 *    the answer, not because a widget used to render it.
 *  - `Course info` (hasCourseInstance, courseSchedule, offers, syllabusSections,
 *    educationalCredentialAwarded). Retired in 2025 — and it never applied anyway: Efhaam
 *    licenses a written curriculum to academies and runs no classes, so there is no
 *    instance, no schedule and no enrolment to describe.
 *  - `EducationalOccupationalProgram`, `Syllabus`, `LearningResource`. Real vocabulary
 *    with no consumer. Adding them would be decoration.
 *  - `aggregateRating` / `review` anywhere. There are no customers to review anything, and
 *    self-serving ratings about your own organisation are the exact case that earns a
 *    structured-data manual action.
 *  - An `llms.txt`. Google states it neither helps nor harms; 97% of the files published
 *    across 137,210 measured domains were never fetched once in a month. No vendor's
 *    publisher documentation names a markup pattern that buys an AI citation. The
 *    documented levers are being crawlable, being indexable, and writing something that is
 *    not a commodity — so that is where the effort went.
 *
 * The binding rule on everything that IS here: mark up nothing a reader cannot see on the
 * page, and claim nothing the page does not support.
 */
function graph(page, extra = []) {
  const home = page.path === '/';
  const full = home || page.path === '/about';
  // Google's guidance is to put Organization on the home page or one about page rather than
  // on every page, so the full node lives on those two and every other page carries the
  // same @id with just enough to anchor the entity.
  const org = full ? {
    '@type': 'Organization',
    '@id': `${ORIGIN}/#organization`,
    name: 'Efhaam',
    url: ORIGIN + '/',
    logo: `${ORIGIN}/assets/monogram.png`,
    description: 'Efhaam publishes a complete written chess curriculum that academies license '
      + 'and their coaches teach from, session by session.',
    // إفهام, the Arabic causative of ف-ه-م — "to cause someone to understand". ADR-0006.
    alternateName: ['إفهام'],
    slogan: 'Your standard. Every coach. Every class.',
  } : {
    '@type': 'Organization',
    '@id': `${ORIGIN}/#organization`,
    name: 'Efhaam',
    url: ORIGIN + '/',
  };
  const nodes = [org];
  // WebSite is the site-name signal and belongs on the root page only.
  if (home) {
    nodes.push({
      '@type': 'WebSite',
      '@id': `${ORIGIN}/#website`,
      url: ORIGIN + '/',
      name: 'Efhaam',
      publisher: { '@id': `${ORIGIN}/#organization` },
      inLanguage: 'en',
    });
  }
  nodes.push({
    '@type': 'WebPage',
    '@id': url(page.path) + '#webpage',
    url: url(page.path),
    name: page.metaTitle,
    description: page.metaDesc,
    isPartOf: { '@id': `${ORIGIN}/#website` },
    about: { '@id': `${ORIGIN}/#organization` },
    inLanguage: 'en',
  });
  if (page.crumbs && page.crumbs.length > 1) {
    nodes.push({
      '@type': 'BreadcrumbList',
      '@id': url(page.path) + '#breadcrumbs',
      itemListElement: page.crumbs.map((c, i) => ({
        '@type': 'ListItem', position: i + 1, name: c.title,
        // The last crumb's `item` is omitted on purpose: Google uses the containing page.
        ...(i < page.crumbs.length - 1 ? { item: url(c.path) } : {}),
      })),
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [...nodes, ...extra] }, null, 1);
}

/**
 * The header. The five links are always in the markup — no disclosure widget, no JS — and
 * on a narrow screen the row wraps to two lines instead of collapsing behind a button.
 * A six-page site does not need a hamburger, and a menu that needs JavaScript to open is a
 * menu a crawler and a reader with a failed script both lose.
 */
function chrome(page) {
  const links = PAGES.filter((p) => p.nav).map((p) => {
    const here = p.path === page.path || (page.parent && p.path === page.parent);
    return `      <a href="${p.path}"${here ? ' aria-current="page"' : ''}>${t(p.title)}</a>`;
  }).join('\n');
  return `<header class="pg-nav">
  <a class="brand" href="/" aria-label="Efhaam, home">
    <span class="mark" aria-hidden="true"></span>
    <span class="word">Efhaam</span>
  </a>
  <nav class="pg-links" aria-label="Primary">
${links}
  </nav>
  <a class="cta cta-sm" href="/teach">Teach a free session</a>
</header>`;
}

/** Home &rsaquo; Curriculum &rsaquo; Bishop Stage. Marked up as a list, so it is a trail and not three links. */
function crumbs(page) {
  if (!page.crumbs || page.crumbs.length < 2) return '';
  const items = page.crumbs.map((c, i) => {
    const last = i === page.crumbs.length - 1;
    return last
      ? `    <li aria-current="page">${t(c.title)}</li>`
      : `    <li><a href="${c.path}">${t(c.title)}</a></li>`;
  }).join('\n');
  return `<nav class="pg-crumbs mono" aria-label="Breadcrumb">
  <ol>
${items}
  </ol>
</nav>`;
}

/**
 * The footer carries the whole map, which is what stops any page being reachable from only
 * one place, and the four facts a buyer looks for at the bottom of a page: how the name is
 * said, what the curriculum is, which bundle the figures were counted off, and the
 * attribution the piece artwork's licence requires.
 */
function footer(D) {
  const map = PAGES.map((p) => `      <li><a href="${p.path}">${t(p.title)}</a><span>${t(p.label)}</span></li>`).join('\n');
  const stageMap = D.byStage.map((s) => `      <li><a href="/curriculum/${s.slug}">${t(s.piece)} Stage</a>`
    + `<span>${t(s.themeName)} &middot; ages ${s.ages}</span></li>`).join('\n');
  return `<footer class="pg-foot">
  <div class="pg-foot-top">
    <div class="pg-foot-brand">
      <span class="mark" aria-hidden="true"></span>
      <span class="word">Efhaam</span>
      <p>${t('A complete chess curriculum for academies: five stages, ten levels, ')}${D.sessions}${t(' sessions in order, ages ')}${D.ageSpan}.</p>
      <a class="cta cta-sm" href="/teach">Teach a free session</a>
      <p class="mono pg-foot-micro">no email, no card</p>
    </div>
    <div class="pg-foot-col">
      <h2 class="mono">The site</h2>
      <ul>
${map}
      </ul>
    </div>
    <div class="pg-foot-col">
      <h2 class="mono">The five stages</h2>
      <ul>
${stageMap}
      </ul>
    </div>
  </div>
  <p class="pg-foot-fine mono">said ef-HAAM &middot; curriculum bundle ${esc(D.bundle)} &middot;
    ${fmt(D.sessions)} sessions &middot; ${fmt(D.puzzles)} puzzles &middot; no child accounts,
    no child emails, ever &middot; chess piece geometry: &ldquo;A Beautiful Game&rdquo;
    &copy; 2020 MaterialX Project / ASWF and &copy; 2022 Ed Mackey, CC BY 4.0, modified
    &middot; piece artwork: cburnett, CC BY-SA 3.0</p>
</footer>`;
}

/**
 * The page. `page.css` and `page.js` are extra sheets and modules; everything gets
 * tokens.css and pages.css, and nothing gets three.js — these pages carry no WebGL, no
 * video and no 3D, which is what makes them fast enough to be the site's infrastructure.
 */
function html(page, D, body) {
  const noindex = NOINDEX.includes(page.path);
  const sheets = ['/css/tokens.css', '/css/pages.css', ...(page.css || [])];
  const og = page.og || `/assets/og/${page.path === '/' ? 'home' : page.path.replace(/^\//, '').replace(/\//g, '-')}.png`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(page.metaTitle)}</title>
<meta name="description" content="${esc(page.metaDesc)}" />
<link rel="canonical" href="${url(page.path)}" />${noindex ? '\n<meta name="robots" content="noindex, follow" />' : ''}
<meta name="theme-color" content="#f2ece0" />
<meta property="og:type" content="${page.ogType || 'website'}" />
<meta property="og:site_name" content="Efhaam" />
<meta property="og:title" content="${esc(page.ogTitle || page.metaTitle)}" />
<meta property="og:description" content="${esc(page.ogDesc || page.metaDesc)}" />
<meta property="og:url" content="${url(page.path)}" />
<meta property="og:image" content="${ORIGIN}${og}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${esc(page.ogAlt || page.metaTitle)}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/assets/monogram.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..800,0,0&family=Inter+Tight:wght@300..600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
${sheets.map((s) => `<link rel="stylesheet" href="${s}" />`).join('\n')}
<script type="application/ld+json">
${graph(page, page.schema || [])}
</script>
</head>
<body class="pg${page.bodyClass ? ' ' + page.bodyClass : ''}"${page.hue ? ` style="--hue:${page.hue};--hue-soft:${page.hueSoft}"` : ''}>
<a class="pg-skip" href="#main">Skip to the ${esc(page.skip || 'page')}</a>
${chrome(page)}
<main id="main">
${crumbs(page)}
${body}
</main>
${footer(D)}
<script type="module" src="/js/pages/site.js"></script>${(page.js || []).map((s) => `\n<script type="module" src="${s}"></script>`).join('')}
</body>
</html>
`;
}

module.exports = { html, esc, t, knit, graph, chrome, footer, crumbs, PAGES, NOINDEX, ORIGIN, url };
