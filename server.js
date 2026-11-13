// server.js —— 极简静态服务器（零依赖）
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 5173);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

http.createServer(function(req, res){
  let p = decodeURIComponent(String(req.url || '/').split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  const file = path.join(ROOT, path.normalize(p).replace(/^[\\/]+/, ''));
  if (file.indexOf(ROOT) !== 0) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(file, function(err, data){
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 ' + p);
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}).listen(PORT, '0.0.0.0', function(){
  const nets = os.networkInterfaces();
  const ips = [];
  Object.keys(nets).forEach(function(k){
    (nets[k] || []).forEach(function(ni){
      if (ni.family === 'IPv4' && !ni.internal) ips.push(ni.address);
    });
  });
  console.log('[save-money] listening on ' + PORT);
  ips.forEach(function(ip){ console.log('[save-money] http://' + ip + ':' + PORT); });
});
