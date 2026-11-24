// Test-only static server: SPA fallback + vercel.json header emulation.
// usage: node serve.mjs <distDir> <port> [vercel.json]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const [dist, port = '4173', vercelJson] = process.argv.slice(2);
const root = path.resolve(dist);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json'
};
let headerRules = [];
if (vercelJson) {
  const cfg = JSON.parse(fs.readFileSync(vercelJson, 'utf8'));
  headerRules = (cfg.headers || []).map((r) => ({
    re: new RegExp('^' + r.source.replace(/\(\.\*\)/g, '.*') + '$'),
    headers: r.headers
  }));
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = path.join(root, decodeURIComponent(url.pathname));
  if (!p.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    const withHtml = p.replace(/\/$/, '') + '.html';
    p = fs.existsSync(withHtml) ? withHtml : path.join(root, 'index.html');
  }
  const ext = path.extname(p);
  const headers = { 'Content-Type': types[ext] || 'application/octet-stream' };
  if (url.pathname.startsWith('/assets/')) headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  for (const r of headerRules) if (r.re.test(url.pathname)) for (const h of r.headers) headers[h.key] = h.value;
  let body = fs.readFileSync(p);
  const compressible = /text|javascript|json|svg|xml/.test(headers['Content-Type']);
  if (compressible && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    body = zlib.gzipSync(body);
    headers['Content-Encoding'] = 'gzip';
  }
  res.writeHead(200, headers);
  res.end(body);
}).listen(Number(port), () => console.log(`serving ${root} on :${port}`));
