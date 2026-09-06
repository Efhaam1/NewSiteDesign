#!/usr/bin/env node
/**
 * Build the supporting pages.
 *
 *   node tools/build-pages.cjs            write every page, the sitemap and robots.txt
 *   node tools/build-pages.cjs --check    rebuild in memory and fail if a committed file drifts
 *
 * WHY A GENERATOR AND NOT ELEVEN HAND-WRITTEN FILES. Two reasons, both of them the brief's.
 * The curriculum map has to carry all 213 session rows as real markup, so a crawler and an
 * answer engine can read the syllabus without executing a script — that is 213 rows a
 * person is not going to keep in sync by hand. And every figure on every page has to be a
 * count off app/data, not a typed number, which is only true if no template contains a
 * digit. `--check` is what keeps the committed HTML honest: it is wired into
 * tools/gate.cjs, so a bundle change that nobody rebuilt for shows up as a failed
 * assertion rather than as a stale page.
 *
 * The output is committed. These are static files on a static server; there is no build
 * step at request time and no framework anywhere near them.
 */
const fs = require('fs');
const path = require('path');
const { load, fmt } = require('./pages/data.cjs');
const shell = require('./pages/shell.cjs');
const cu = require('./pages/curriculum.cjs');
const session = require('./pages/session.cjs');
const roles = require('./pages/roles.cjs');
const about = require('./pages/about.cjs');

const APP = path.join(__dirname, '..', 'app');
const CHECK = process.argv.includes('--check');

const ctx = load();
const { D } = ctx;

/** Every indexable page, in the order the sitemap lists them. */
function build() {
  const out = [];
  const add = ({ page, body }) => {
    out.push({ path: page.path, file: page.path === '/' ? null : page.path.replace(/^\//, '') + '/index.html',
      html: shell.html(page, D, body), page });
  };

  add(cu.mapPage(ctx));
  for (const st of D.byStage) add(cu.stagePage(st, ctx));
  add(session.page(ctx));
  add(roles.coaches(ctx));
  add(roles.academies(ctx));
  add(about.page(ctx));
  return out.filter((p) => p.file);
}

/* -------------------------------------------------------------------- sitemap.xml
   Canonical URLs only, and only pages that should be in the index: `/`, the six
   supporting pages and the five stage pages. /teach is absent on purpose — it is
   noindex (see shell.cjs's NOINDEX note), and a sitemap that lists a noindexed URL is
   telling a crawler two different things.

   No `priority` and no `changefreq`. Google has said for years that it ignores both;
   `lastmod` is the one hint it uses, and it is only worth sending if it is true — so it
   is the mtime of the file that actually produces each page, not the day the build ran. */
function sitemap(pages) {
  const src = [
    path.join(APP, 'index.html'),
    path.join(__dirname, 'pages', 'data.cjs'),
    path.join(__dirname, 'pages', 'shell.cjs'),
    path.join(APP, 'data', 'catalog.json'),
  ];
  const stamp = (extra = []) => {
    const times = [...src, ...extra].filter((f) => fs.existsSync(f))
      .map((f) => fs.statSync(f).mtime.getTime());
    return new Date(Math.max(...times)).toISOString().slice(0, 10);
  };
  const rows = [
    { loc: shell.url('/'), mod: stamp() },
    ...pages.map((p) => ({
      loc: shell.url(p.path),
      mod: stamp([path.join(APP, p.file)]),
    })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.map((r) => `  <url>
    <loc>${r.loc}</loc>
    <lastmod>${r.mod}</lastmod>
  </url>`).join('\n')}
</urlset>
`;
}

/* ---------------------------------------------------------------------- robots.txt
   Everything is allowed, and that is a decision rather than laziness.

   There is no Disallow on /teach even though /teach is out of the index, because
   robots.txt is not a de-indexing tool: a disallowed URL can still be indexed, URL-only
   and description-less, and disallowing it is what stops a crawler ever reading the
   `noindex` that would have kept it out properly. The meta tag does that job; blocking the
   path would break it.

   No AI crawler is blocked either. OpenAI, Perplexity and Anthropic all document the same
   thing: their search crawlers are what put a site into an answer with a link, and
   blocking them removes it. Anthropic's own wording for Claude-SearchBot is that blocking
   it "may reduce your site's visibility and accuracy in user search results". A curriculum
   whose whole argument is that it can be checked has no reason to hide from the systems
   people now check things with. */
const robots = () => `# Efhaam — a complete chess curriculum for academies.
#
# Everything here is meant to be read. Nothing is cloaked, nothing is generated per
# crawler, and no bot is blocked — including the AI search crawlers, which are how a
# reader now finds a page like this and follows the link back to it.
#
# One page carries <meta name="robots" content="noindex, follow">: /teach, the console.
# It renders its session from JSON at runtime, so its markup holds no session to index.
# The readable version of it is /inside-a-session, and that page is indexable.

User-agent: *
Allow: /

Sitemap: ${shell.ORIGIN}/sitemap.xml
`;

/* --------------------------------------------------------------------------- 404
   Served with a real 404 status by tools/serve.cjs. Before this, an unknown path fell
   back to the homepage with a 200, which is a soft 404: a crawler stores a copy of the
   front page under every wrong URL anyone ever links to. */
function notFound() {
  const page = {
    path: '/404', skip: 'page',
    metaTitle: 'Page not found | Efhaam',
    metaDesc: 'That URL is not part of this site. The curriculum, the session anatomy and the '
      + 'two role pages are all one click away.',
    og: '/assets/og/home.png',
  };
  const body = `<section class="pg-sec pg-hero">
  <div class="pg-wrap">
    <p class="pg-kick mono"><span class="dot" aria-hidden="true"></span>404</p>
    <h1>That page is not&nbsp;here.</h1>
    <p class="lead">Nothing at this address. The whole site is six pages and a console, so
      whatever you were after is one of these.</p>
    <ul class="pg-list">
      <li><a href="/curriculum">Curriculum</a><span>${D.sessions} sessions in order</span></li>
      <li><a href="/inside-a-session">Inside a session</a><span>what one hour contains</span></li>
      <li><a href="/for-chess-coaches">For coaches</a><span>the planning is already done</span></li>
      <li><a href="/for-chess-academies">For academies</a><span>one standard, every coach</span></li>
      <li><a href="/about">About</a><span>the name and the method</span></li>
      <li><a href="/teach">Teach a session</a><span>${D.free.length} of them are free</span></li>
    </ul>
  </div>
</section>`;
  // The 404 must never be indexed and must never be canonicalised to itself.
  const out = shell.html(page, D, body)
    .replace(`<link rel="canonical" href="${shell.ORIGIN}/404" />`,
      '<meta name="robots" content="noindex, follow" />');
  return out;
}

/* ------------------------------------------------------------------------- runner */
const files = [];
const pages = build();
for (const p of pages) files.push([p.file, p.html]);
files.push(['sitemap.xml', sitemap(pages)]);
files.push(['robots.txt', robots()]);
files.push(['404.html', notFound()]);

let drift = 0;
for (const [rel, body] of files) {
  const abs = path.join(APP, rel);
  const cur = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  if (CHECK) {
    if (cur !== body) { drift++; console.log(`DRIFT  ${rel}`); }
    continue;
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body, 'utf8');
  const kb = (Buffer.byteLength(body) / 1024).toFixed(1);
  console.log(`${cur === body ? 'same  ' : 'wrote '} ${rel.padEnd(38)} ${kb.padStart(7)} KB`);
}

if (CHECK) {
  console.log(drift
    ? `\n  ${drift} generated file(s) drift from app/data. Run: node tools/build-pages.cjs\n`
    : `\n  ${files.length} generated files match app/data (bundle ${D.bundle}, ${D.sessions} sessions).\n`);
  process.exit(drift ? 1 : 0);
} else {
  console.log(`\n  ${files.length} files, ${fmt(D.sessions)} sessions, ${fmt(D.puzzles)} positions,`
    + ` bundle ${D.bundle}.\n`);
}
