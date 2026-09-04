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
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(ROOT, url);
    // /teach and /teach/ both mean app/teach/index.html
    if (url.endsWith('/')) file = path.join(file, 'index.html');
    else if (!path.extname(file) && fs.existsSync(path.join(file, 'index.html'))) {
      file = path.join(file, 'index.html');
    }
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    fs.stat(file, (err, stat) => {
      if (err || stat.isDirectory()) {
        const fallback = path.join(ROOT, 'index.html');
        fs.readFile(fallback, (e, buf) => {
          if (e) return res.writeHead(404).end('not found');
          res.writeHead(200, { 'Content-Type': TYPES['.html'] }).end(buf);
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
