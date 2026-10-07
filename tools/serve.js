// Minimal static server for previewing the app locally:  node tools/serve.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'src');
const port = +process.argv[2] || 5173;
http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(root, p === '/' ? 'SmartEngineering_App.html' : p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(port, () => console.log('serving src on http://localhost:' + port));
