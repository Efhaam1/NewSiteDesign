// Zero-dependency static server for the prototype.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'app');
const PORT = Number(process.env.PORT || 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.glb': 'model/gltf-binary',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    const [rawPath, query] = req.url.split('?');
    const url = decodeURIComponent(rawPath);

    // ONE URL PER PAGE. /curriculum and /curriculum/ are two different URLs to a crawler,
    // and before this both returned 200 with identical bodies — a duplicate that
    // rel=canonical then has to clean up as a hint rather than as a fact. The site links
    // and canonicalises the unslashed form, so the slashed one is a permanent redirect to
    // it. The root is the documented exception: https://host and https://host/ are the
    // same URL.
    if (url.length > 1 && url.endsWith('/')) {
      res.writeHead(301, { Location: url.replace(/\/+$/, '') + (query ? '?' + query : '') }).end();
      return;
    }

    let file = path.join(ROOT, url);
    // A directory means its index.html: /teach, /curriculum, /curriculum/pawn.
    if (!path.extname(file) && fs.existsSync(path.join(file, 'index.html'))) {
      file = path.join(file, 'index.html');
    }
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    fs.stat(file, (err, stat) => {
      if (err || stat.isDirectory()) {
        // A REAL 404. This used to serve the homepage with a 200, which is a soft 404: a
        // crawler stores a copy of the front page under every wrong URL anyone ever links
        // to, and reports it as a duplicate rather than as missing.
        fs.readFile(path.join(ROOT, '404.html'), (e, buf) => {
          if (e) return res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('not found');
          res.writeHead(404, { 'Content-Type': TYPES['.html'] }).end(buf);
        });
        return;
      }
      const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
      const range = req.headers.range;
      if (range && /^bytes=/.test(range)) {
        const [s, e] = range.replace('bytes=', '').split('-');
        const start = Number(s) || 0;
        const end = e ? Number(e) : stat.size - 1;
        res.writeHead(206, {
          'Content-Type': type,
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
        });
        fs.createReadStream(file, { start, end }).pipe(res);
        return;
      }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
  })
  .listen(PORT, () => console.log(`prototype on http://127.0.0.1:${PORT}`));
