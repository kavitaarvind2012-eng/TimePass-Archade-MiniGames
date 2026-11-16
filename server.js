/**
 * TimePass Arcade - Local HTTP Server
 * Static site server and Socket.IO multiplayer relay.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 8000;
const PUBLIC_DIR = __dirname;
const VALID_GAMES = new Set([
  'snake', 'puzzle2048', 'memory', 'aim', 'fidget', 'wordle', 'tetris', 'pong', 'ttt',
  'rpsls', 'flappy', 'starcatcher', 'mole', 'simon', 'minesweeper', 'mathblitz',
  'colorgate', 'towerstacker', 'wordtyper', 'dicecoin', 'mazerunner', 'hangman',
  'blackjack', 'slotspinner', 'bouncinglogo', 'plinko', 'lightsout', 'coreclicker',
  'vaultcracker', 'tileslide', 'bullethell', 'connectfour', 'hilo', 'rhythmtap',
  'asteroidblaster', 'stonebalancer'
]);
const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{4}$/;
const rooms = new Map();
const socketRooms = new Map();

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

  const segments = reqPath.split(/[\\/]+/).filter(Boolean);
  if (segments.some((segment) => segment === '..' || segment.startsWith('.') || segment.toLowerCase() === 'node_modules')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  const filePath = path.resolve(PUBLIC_DIR, ...segments);
  const relativePath = path.relative(PUBLIC_DIR, filePath);
  if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
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

const io = new Server(server);

io.on('connection', (socket) => {
  socket.on('create_room', (request, acknowledge = () => {}) => {
    const roomCode = typeof request?.roomCode === 'string' ? request.roomCode.toUpperCase() : '';
    const gameId = request?.gameId;
    if (!ROOM_CODE_PATTERN.test(roomCode) || !VALID_GAMES.has(gameId)) {
      acknowledge({ ok: false, error: 'Invalid room code or game.' });
      return;
    }
    if (rooms.has(roomCode)) {
      acknowledge({ ok: false, error: 'That room code is already in use. Generate another code.' });
      return;
    }

    rooms.set(roomCode, { gameId, hostId: socket.id, guestId: null });
    socketRooms.set(socket.id, roomCode);
    socket.join(roomCode);
    acknowledge({ ok: true, roomCode });
  });

  socket.on('join_room', (request, acknowledge = () => {}) => {
    const roomCode = typeof request?.roomCode === 'string' ? request.roomCode.toUpperCase() : '';
    const gameId = request?.gameId;
    if (!ROOM_CODE_PATTERN.test(roomCode) || !VALID_GAMES.has(gameId)) {
      acknowledge({ ok: false, error: 'Invalid room code or game.' });
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      acknowledge({ ok: false, error: 'Room not found. Check the code and try again.' });
      return;
    }
    if (room.gameId !== gameId) {
      acknowledge({ ok: false, error: 'That room is for a different game.' });
      return;
    }
    if (room.guestId) {
      acknowledge({ ok: false, error: 'That room already has two players.' });
      return;
    }
    if (socketRooms.has(socket.id)) {
      acknowledge({ ok: false, error: 'You are already connected to a room.' });
      return;
    }

    room.guestId = socket.id;
    socketRooms.set(socket.id, roomCode);
    socket.join(roomCode);
    acknowledge({ ok: true, roomCode });
    io.to(room.hostId).emit('player_joined');
  });

  socket.on('game_move', (message) => {
    const roomCode = socketRooms.get(socket.id);
    const room = roomCode && rooms.get(roomCode);
    if (!room || !room.guestId || !message || typeof message.data !== 'object' ||
        message.data === null || Array.isArray(message.data)) return;

    let messageSize;
    try {
      messageSize = Buffer.byteLength(JSON.stringify(message.data), 'utf8');
    } catch (error) {
      return;
    }
    if (messageSize > 16_384) return;

    const isHost = room.hostId === socket.id;
    const opponentId = isHost ? room.guestId : room.hostId;
    const type = message.data.action === 'state' ? 'state' : 'move';
    io.to(opponentId).emit('game_move', {
      type,
      data: message.data,
      sender: isHost ? 'host' : 'guest',
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    const roomCode = socketRooms.get(socket.id);
    if (!roomCode) return;
    socketRooms.delete(socket.id);

    const room = rooms.get(roomCode);
    if (!room) return;
    if (room.hostId === socket.id) {
      if (room.guestId) io.to(room.guestId).emit('room_closed');
      rooms.delete(roomCode);
      return;
    }

    if (room.guestId === socket.id) {
      room.guestId = null;
      io.to(room.hostId).emit('player_left');
    }
  });
});

server.listen(PORT, () => {
  console.log(`TimePass Arcade is live at http://localhost:${PORT}`);
});
