/**
 * TimePass Arcade - Local HTTP Server
 * Simple, zero-dependency Node.js HTTP server running on port 8000.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // REST API Endpoint: Global Daily Leaderboard (Phase 2)
  if (reqPath === '/api/leaderboard') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    const leaderboard = [
      { rank: 1, player: 'NeonViper_99', country: '🇯🇵 JP', score: 3840, game: 'Tetris Block Drop', time: '12m ago', badge: 'Apex Legend' },
      { rank: 2, player: 'CyberGhost_X', country: '🇩🇪 DE', score: 2950, game: 'Neon Snake', time: '34m ago', badge: 'Grandmaster' },
      { rank: 3, player: 'PixelSamurai', country: '🇺🇸 US', score: 2710, game: 'Cyber Flappy', time: '1h ago', badge: 'Ace' },
      { rank: 4, player: 'QuantumLeap', country: '🇨🇦 CA', score: 2480, game: 'Falling Word Typer', time: '2h ago', badge: 'Pro' },
      { rank: 5, player: 'SynthQueen', country: '🇬🇧 UK', score: 2210, game: 'Reaction & Aim', time: '3h ago', badge: 'Pro' },
      { rank: 6, player: 'AstroChaser', country: '🇫🇷 FR', score: 1980, game: 'Color Gate Reflex', time: '4h ago', badge: 'Veteran' },
      { rank: 7, player: 'ZeroCool', country: '🇦🇺 AU', score: 1850, game: 'Star Catcher', time: '5h ago', badge: 'Veteran' },
      { rank: 8, player: 'BoredomSlayer', country: '🇧🇷 BR', score: 1690, game: 'Tower Stacker', time: '6h ago', badge: 'Rising' }
    ];
    res.end(JSON.stringify({ status: 'success', data: leaderboard }));
    return;
  }

  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const normalizedPath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, normalizedPath);

  // Security check: restrict to public directory
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`TimePass Arcade is live at http://localhost:${PORT}`);
});
