/**
 * TimePass Arcade - New Arcade Games Pack (10 Games)
 * 1. Tetris Block Drop
 * 2. Neon Pong
 * 3. Cyber Flappy
 * 4. Star Catcher
 * 5. Neon Whack-A-Mole
 * 6. Color Gate Reflex
 * 7. Tower Stacker
 * 8. Bullet Hell Dodge
 * 9. Synth Rhythm Tap
 * 10. Vector Asteroid Blaster
 */

// ============================================================================
// 1. TETRIS BLOCK DROP (Arcade)
// ============================================================================
class TetrisGame {
  constructor(container, options = {}) {
    this.container = container;
    this.customConfig = options.customConfig?.type === 'tetris' ? options.customConfig : null;
    this.cols = 10;
    this.rows = 20;
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.bestScore = window.storageManager.getHighScore('tetris', 0);
    this.isGameOver = false;
    this.startingSpeed = this.customConfig ? this.customConfig.speed : 700;
    this.gravityAcceleration = this.customConfig ? this.customConfig.gravity : 1;
    this.dropInterval = this.startingSpeed;
    this.lastDropTime = 0;
    this.animId = null;

    this.shapes = {
      I: { color: '#00ffcc', matrix: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
      J: { color: '#3b82f6', matrix: [[1,0,0],[1,1,1],[0,0,0]] },
      L: { color: '#f59e0b', matrix: [[0,0,1],[1,1,1],[0,0,0]] },
      O: { color: '#ffd700', matrix: [[1,1],[1,1]] },
      S: { color: '#10b981', matrix: [[0,1,1],[1,1,0],[0,0,0]] },
      T: { color: '#a855f7', matrix: [[0,1,0],[1,1,1],[0,0,0]] },
      Z: { color: '#ef4444', matrix: [[1,1,0],[0,1,1],[0,0,0]] }
    };
    const palettes = {
      neon: ['#00ffcc', '#3b82f6', '#f59e0b', '#ffd700', '#10b981', '#a855f7', '#ef4444'],
      mono: ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#f8fafc', '#475569', '#334155'],
      retro: ['#f59e0b', '#10b981', '#3b82f6', '#f97316', '#84cc16', '#a855f7', '#ef4444'],
      cyber: ['#00ff66', '#00ffff', '#ff00ff', '#ffff00', '#00ccff', '#ff3366', '#66ff00']
    };
    if (this.customConfig) {
      const palette = palettes[this.customConfig.palette];
      Object.keys(this.shapes).forEach((key, index) => {
        this.shapes[key].color = palette[index];
      });
    }
    this.keys = Object.keys(this.shapes);
    this.currentPiece = null;
    this.nextPieceType = this.randomPieceKey();

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.renderDOM();
    this.spawnPiece();
    this.bindEvents();
    this.startLoop();
  }

  randomPieceKey() {
    return this.keys[Math.floor(Math.random() * this.keys.length)];
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper tetris-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-val" id="tetris-score">0</span></div>
          <div class="hud-item"><span class="hud-label">LINES</span><span class="hud-val" id="tetris-lines">0</span></div>
          <div class="hud-item"><span class="hud-label">LEVEL</span><span class="hud-val" id="tetris-level">1</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.bestScore}</span></div>
          <div class="hud-actions">
            <button class="btn btn-sm btn-icon" id="tetris-restart-btn" title="Restart">🔄</button>
          </div>
        </div>
        <div class="tetris-layout">
          <canvas id="tetris-canvas" width="250" height="500"></canvas>
          <div class="tetris-sidebar">
            <span class="sidebar-label">NEXT</span>
            <canvas id="tetris-next-canvas" width="100" height="100"></canvas>
          </div>
        </div>
        <div class="mobile-dpad">
          <button class="dpad-btn" id="t-rot">↻</button>
          <div class="dpad-middle">
            <button class="dpad-btn" id="t-left">◀</button>
            <button class="dpad-btn" id="t-drop">▼▼</button>
            <button class="dpad-btn" id="t-right">▶</button>
          </div>
          <button class="dpad-btn" id="t-down">▼</button>
        </div>
        <div class="game-controls-hint">
          <span><b>A/D or ◄/►</b> Move, <b>W or ▲</b> Rotate, <b>S or ▼</b> Soft drop, <b>Space</b> Hard drop.</span>
        </div>
      </div>
    `;
    this.canvas = document.getElementById('tetris-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.nextCanvas = document.getElementById('tetris-next-canvas');
    this.nextCtx = this.nextCanvas.getContext('2d');
  }

  bindEvents() {
    window.addEventListener('keydown', this.boundKeyDown);
    document.getElementById('tetris-restart-btn').addEventListener('click', () => this.reset());
    document.getElementById('t-rot')?.addEventListener('click', () => this.rotate());
    document.getElementById('t-left')?.addEventListener('click', () => this.move(-1));
    document.getElementById('t-right')?.addEventListener('click', () => this.move(1));
    document.getElementById('t-down')?.addEventListener('click', () => this.drop());
    document.getElementById('t-drop')?.addEventListener('click', () => this.hardDrop());
  }

  reset() {
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.isGameOver = false;
    this.dropInterval = this.startingSpeed;
    this.nextPieceType = this.randomPieceKey();
    this.spawnPiece();
    this.updateHUD();
  }

  spawnPiece() {
    const key = this.nextPieceType;
    this.nextPieceType = this.randomPieceKey();
    const shape = this.shapes[key];
    this.currentPiece = {
      key: key,
      color: shape.color,
      matrix: shape.matrix.map((row) => [...row]),
      x: Math.floor((this.cols - shape.matrix[0].length) / 2),
      y: 0
    };
    if (this.collides(this.currentPiece)) {
      this.isGameOver = true;
      window.audioEngine.gameOver();
      window.storageManager.setGameScore('tetris', this.score);
    }
    this.drawNext();
  }

  collides(piece) {
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c]) {
          const gx = piece.x + c;
          const gy = piece.y + r;
          if (gx < 0 || gx >= this.cols || gy >= this.rows) return true;
          if (gy >= 0 && this.grid[gy][gx]) return true;
        }
      }
    }
    return false;
  }

  handleKeyDown(e) {
    if (this.isGameOver) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); this.move(-1); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); this.move(1); }
    else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); this.drop(); }
    else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); this.rotate(); }
    else if (e.key === ' ') { e.preventDefault(); this.hardDrop(); }
  }

  move(dir) {
    this.currentPiece.x += dir;
    if (this.collides(this.currentPiece)) {
      this.currentPiece.x -= dir;
    } else {
      window.audioEngine.key();
    }
  }

  rotate() {
    const m = this.currentPiece.matrix;
    const rotated = m[0].map((_, idx) => m.map((row) => row[idx]).reverse());
    const old = this.currentPiece.matrix;
    this.currentPiece.matrix = rotated;
    if (this.collides(this.currentPiece)) {
      this.currentPiece.matrix = old;
    } else {
      window.audioEngine.paddle();
    }
  }

  drop() {
    this.currentPiece.y++;
    if (this.collides(this.currentPiece)) {
      this.currentPiece.y--;
      this.lockPiece();
    }
  }

  hardDrop() {
    while (!this.collides(this.currentPiece)) {
      this.currentPiece.y++;
    }
    this.currentPiece.y--;
    this.lockPiece();
  }

  lockPiece() {
    window.audioEngine.paddle();
    const p = this.currentPiece;
    for (let r = 0; r < p.matrix.length; r++) {
      for (let c = 0; c < p.matrix[r].length; c++) {
        if (p.matrix[r][c] && p.y + r >= 0) {
          this.grid[p.y + r][p.x + c] = p.color;
        }
      }
    }
    this.clearLines();
    this.spawnPiece();
  }

  clearLines() {
    let cleared = 0;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r].every((cell) => cell !== 0)) {
        this.grid.splice(r, 1);
        this.grid.unshift(Array(this.cols).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared > 0) {
      const pts = [0, 100, 300, 500, 800][cleared] * this.level;
      this.score += pts;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = this.customConfig
        ? Math.max(100, this.startingSpeed - (this.level - 1) * 60 * this.gravityAcceleration)
        : Math.max(150, 700 - (this.level - 1) * 60);
      window.audioEngine.merge(cleared * 256);
      if (this.lines >= 4) window.storageManager.unlock('tetris_clear');
      this.updateHUD();
    }
  }

  updateHUD() {
    document.getElementById('tetris-score').textContent = this.score;
    document.getElementById('tetris-lines').textContent = this.lines;
    document.getElementById('tetris-level').textContent = this.level;
  }

  startLoop() {
    const loop = (now) => {
      if (!this.lastDropTime) this.lastDropTime = now;
      if (!this.isGameOver && now - this.lastDropTime > this.dropInterval) {
        this.drop();
        this.lastDropTime = now;
      }
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const tw = 25;
    const th = 25;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    for (let c = 0; c <= this.cols; c++) {
      ctx.beginPath(); ctx.moveTo(c * tw, 0); ctx.lineTo(c * tw, this.canvas.height); ctx.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * th); ctx.lineTo(this.canvas.width, r * th); ctx.stroke();
    }

    // Locked blocks
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) {
          ctx.fillStyle = this.grid[r][c];
          ctx.fillRect(c * tw + 1, r * th + 1, tw - 2, th - 2);
        }
      }
    }

    // Ghost Piece projection
    if (this.currentPiece && !this.isGameOver) {
      let ghost = { ...this.currentPiece, y: this.currentPiece.y };
      while (!this.collides(ghost)) ghost.y++;
      ghost.y--;
      ctx.strokeStyle = this.currentPiece.color;
      ctx.lineWidth = 1.5;
      for (let r = 0; r < ghost.matrix.length; r++) {
        for (let c = 0; c < ghost.matrix[r].length; c++) {
          if (ghost.matrix[r][c]) {
            ctx.strokeRect((ghost.x + c) * tw + 2, (ghost.y + r) * th + 2, tw - 4, th - 4);
          }
        }
      }

      // Active piece
      ctx.fillStyle = this.currentPiece.color;
      for (let r = 0; r < this.currentPiece.matrix.length; r++) {
        for (let c = 0; c < this.currentPiece.matrix[r].length; c++) {
          if (this.currentPiece.matrix[r][c]) {
            ctx.fillRect((this.currentPiece.x + c) * tw + 1, (this.currentPiece.y + r) * th + 1, tw - 2, th - 2);
          }
        }
      }
    }

    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 10);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '14px sans-serif';
      ctx.fillText('Press 🔄 to play again', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
  }

  drawNext() {
    const ctx = this.nextCtx;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    const shape = this.shapes[this.nextPieceType];
    if (!shape) return;
    const m = shape.matrix;
    const size = 18;
    const offsetX = (this.nextCanvas.width - m[0].length * size) / 2;
    const offsetY = (this.nextCanvas.height - m.length * size) / 2;
    ctx.fillStyle = shape.color;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (m[r][c]) {
          ctx.fillRect(offsetX + c * size + 1, offsetY + r * size + 1, size - 2, size - 2);
        }
      }
    }
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this.boundKeyDown);
    this.container.innerHTML = '';
  }
}
window.TetrisGame = TetrisGame;

// ============================================================================
// 2. NEON PONG (Arcade)
// ============================================================================
class PongGame {
  constructor(container, options = {}) {
    this.container = container;
    this.online = Boolean(options.online && options.network);
    this.isHost = Boolean(options.isHost);
    this.network = options.network || null;
    this.width = 640;
    this.height = 400;
    this.playerY = 160;
    this.aiY = 160;
    this.paddleH = 80;
    this.paddleW = 12;
    this.ball = { x: 320, y: 200, vx: 5, vy: 3, radius: 8 };
    this.playerScore = 0;
    this.aiScore = 0;
    this.rally = 0;
    this.bestRally = window.storageManager.getHighScore('pong_rally', 0);
    this.animId = null;

    this.renderDOM();
    this.bindEvents();
    this.startLoop();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper pong-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">PLAYER</span><span class="hud-val" id="pong-p1">0</span></div>
          <div class="hud-item"><span class="hud-label">RALLY</span><span class="hud-val" id="pong-rally">0</span></div>
          <div class="hud-item"><span class="hud-label">AI</span><span class="hud-val" id="pong-ai">0</span></div>
          <div class="hud-item"><span class="hud-label">BEST RALLY</span><span class="hud-val">${this.bestRally}</span></div>
          <div class="hud-actions">
            <button class="btn btn-sm btn-icon" id="pong-restart-btn">🔄</button>
            <button class="btn btn-sm btn-secondary" id="pong-online-btn">🌐 Play Online vs Friend</button>
          </div>
        </div>
        <canvas id="pong-canvas" width="640" height="400"></canvas>
        <div class="game-controls-hint">
          <span>Move mouse / touch or use <b>W / S</b> or <b>▲ / ▼</b> to steer paddle. First to 7 wins!</span>
        </div>
      </div>
    `;
    this.canvas = document.getElementById('pong-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    this.boundMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const scaleY = this.canvas.height / rect.height;
      const y = Math.max(0, Math.min(this.height - this.paddleH, (clientY - rect.top) * scaleY - this.paddleH / 2));
      this.setLocalPaddle(y);
    };
    this.canvas.addEventListener('mousemove', this.boundMove);
    this.canvas.addEventListener('touchmove', this.boundMove, { passive: true });

    this.boundKey = (e) => {
      const y = this.getLocalPaddle();
      if (e.key === 'ArrowUp' || e.key === 'w') this.setLocalPaddle(Math.max(0, y - 25));
      if (e.key === 'ArrowDown' || e.key === 's') this.setLocalPaddle(Math.min(this.height - this.paddleH, y + 25));
    };
    window.addEventListener('keydown', this.boundKey);
    document.getElementById('pong-restart-btn').addEventListener('click', () => this.reset());
    document.getElementById('pong-online-btn').addEventListener('click', () => window.arcadeApp.openMultiplayerModal('pong'));
    if (this.online) {
      document.getElementById('pong-p1').previousElementSibling.textContent = this.isHost ? 'YOU' : 'HOST';
      document.getElementById('pong-ai').previousElementSibling.textContent = this.isHost ? 'GUEST' : 'YOU';
    }
  }

  getLocalPaddle() {
    return this.online && !this.isHost ? this.aiY : this.playerY;
  }

  setLocalPaddle(y) {
    if (this.online && !this.isHost) {
      this.aiY = y;
      this.network.sendMove({ game: 'pong', action: 'paddle', y });
    } else {
      this.playerY = y;
    }
  }

  handleNetworkMessage(payload) {
    const data = payload?.data;
    if (!this.online || !['move', 'state'].includes(payload.type) || data?.game !== 'pong') return;
    if (this.isHost && data.action === 'paddle') {
      if (Number.isFinite(data.y)) this.aiY = Math.max(0, Math.min(this.height - this.paddleH, data.y));
    } else if (!this.isHost && data.action === 'state') {
      if (!Number.isFinite(data.playerY) || !Number.isFinite(data.aiY) ||
          !Number.isFinite(data.playerScore) || !Number.isFinite(data.aiScore) ||
          !Number.isFinite(data.rally) || !data.ball ||
          !['x', 'y', 'vx', 'vy'].every((key) => Number.isFinite(data.ball[key]))) return;
      this.playerY = Math.max(0, Math.min(this.height - this.paddleH, data.playerY));
      this.aiY = Math.max(0, Math.min(this.height - this.paddleH, data.aiY));
      this.ball = { ...this.ball, ...data.ball };
      this.playerScore = data.playerScore;
      this.aiScore = data.aiScore;
      this.rally = data.rally;
      this.updateHUD();
    } else if (data.action === 'reset') {
      this.reset(true);
    }
  }

  reset(isRemote = false) {
    this.playerScore = 0;
    this.aiScore = 0;
    this.rally = 0;
    this.resetBall(1);
    this.updateHUD();
    if (this.online && !isRemote) this.network.sendMove({ game: 'pong', action: 'reset' });
  }

  resetBall(dir) {
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    this.ball.vx = (dir > 0 ? 5 : -5);
    this.ball.vy = (Math.random() - 0.5) * 6;
    this.rally = 0;
    this.updateHUD();
  }

  updateHUD() {
    document.getElementById('pong-p1').textContent = this.playerScore;
    document.getElementById('pong-ai').textContent = this.aiScore;
    document.getElementById('pong-rally').textContent = this.rally;
  }

  startLoop() {
    const loop = () => {
      if (this.online && !this.isHost) {
        this.draw();
        this.animId = requestAnimationFrame(loop);
        return;
      }

      // AI tracking with slight delay
      if (!this.online) {
        const aiCenter = this.aiY + this.paddleH / 2;
        if (aiCenter < this.ball.y - 12) this.aiY += 3.8;
        else if (aiCenter > this.ball.y + 12) this.aiY -= 3.8;
        this.aiY = Math.max(0, Math.min(this.height - this.paddleH, this.aiY));
      }

      // Ball movement
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;

      // Top/bottom bounce
      if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.height) {
        this.ball.vy *= -1;
        window.audioEngine.paddle();
      }

      // Player paddle collision
      if (this.ball.x - this.ball.radius <= 24 && this.ball.x + this.ball.radius >= 12) {
        if (this.ball.y >= this.playerY && this.ball.y <= this.playerY + this.paddleH) {
          this.ball.vx = Math.abs(this.ball.vx) * 1.05 + 0.2;
          const delta = (this.ball.y - (this.playerY + this.paddleH / 2)) / (this.paddleH / 2);
          this.ball.vy = delta * 6;
          this.rally++;
          if (this.rally >= 10) window.storageManager.unlock('pong_rally');
          window.storageManager.setGameScore('pong_rally', this.rally);
          window.audioEngine.paddle();
          this.updateHUD();
        }
      }

      // AI paddle collision
      if (this.ball.x + this.ball.radius >= this.width - 24 && this.ball.x - this.ball.radius <= this.width - 12) {
        if (this.ball.y >= this.aiY && this.ball.y <= this.aiY + this.paddleH) {
          this.ball.vx = -Math.abs(this.ball.vx) * 1.05 - 0.2;
          const delta = (this.ball.y - (this.aiY + this.paddleH / 2)) / (this.paddleH / 2);
          this.ball.vy = delta * 6;
          this.rally++;
          window.audioEngine.paddle();
          this.updateHUD();
        }
      }

      // Score check
      if (this.ball.x < 0) {
        this.aiScore++;
        window.audioEngine.miss();
        this.resetBall(1);
      } else if (this.ball.x > this.width) {
        this.playerScore++;
        window.audioEngine.win();
        this.resetBall(-1);
      }

      this.draw();
      if (this.online && this.isHost && performance.now() - (this.lastStateSent || 0) > 40) {
        this.network.sendState({
          game: 'pong',
          action: 'state',
          playerY: this.playerY,
          aiY: this.aiY,
          ball: this.ball,
          playerScore: this.playerScore,
          aiScore: this.aiScore,
          rally: this.rally
        });
        this.lastStateSent = performance.now();
      }
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, this.width, this.height);

    // Center divider
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(this.width / 2, this.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Player Paddle (Cyan)
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 10;
    ctx.fillRect(12, this.playerY, this.paddleW, this.paddleH);

    // AI Paddle (Pink)
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.fillRect(this.width - 24, this.aiY, this.paddleW, this.paddleH);

    // Ball (Gold)
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.canvas.removeEventListener('mousemove', this.boundMove);
    this.canvas.removeEventListener('touchmove', this.boundMove);
    window.removeEventListener('keydown', this.boundKey);
    this.container.innerHTML = '';
  }
}
window.PongGame = PongGame;

// ============================================================================
// 3. CYBER FLAPPY (Arcade)
// ============================================================================
class FlappyGame {
  constructor(container) {
    this.container = container;
    this.width = 480;
    this.height = 540;
    this.bird = { x: 90, y: 240, vy: 0, gravity: 0.38, jump: -6.8, radius: 14 };
    this.pipes = [];
    this.score = 0;
    this.best = window.storageManager.getHighScore('flappy', 0);
    this.isDead = false;
    this.isStarted = false;
    this.spawnTimer = 0;
    this.animId = null;

    this.renderDOM();
    this.bindEvents();
    this.startLoop();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper flappy-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-val" id="flappy-score">0</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.best}</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="flappy-reset">🔄</button></div>
        </div>
        <canvas id="flappy-canvas" width="480" height="540"></canvas>
        <div class="game-controls-hint"><span>Tap or press <b>Space</b> to flap upwards and fly between neon pipes.</span></div>
      </div>
    `;
    this.canvas = document.getElementById('flappy-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    this.boundJump = (e) => {
      e.preventDefault();
      if (this.isDead) { this.reset(); return; }
      this.isStarted = true;
      this.bird.vy = this.bird.jump;
      window.audioEngine.paddle();
    };
    this.canvas.addEventListener('mousedown', this.boundJump);
    this.canvas.addEventListener('touchstart', this.boundJump, { passive: false });
    this.boundKey = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp') this.boundJump(e);
    };
    window.addEventListener('keydown', this.boundKey);
    document.getElementById('flappy-reset').addEventListener('click', () => this.reset());
  }

  reset() {
    this.bird = { x: 90, y: 240, vy: 0, gravity: 0.38, jump: -6.8, radius: 14 };
    this.pipes = [];
    this.score = 0;
    this.isDead = false;
    this.isStarted = false;
    this.spawnTimer = 0;
    document.getElementById('flappy-score').textContent = '0';
  }

  startLoop() {
    const loop = () => {
      if (this.isStarted && !this.isDead) {
        this.bird.vy += this.bird.gravity;
        this.bird.y += this.bird.vy;

        // Ground / Ceiling
        if (this.bird.y + this.bird.radius >= this.height || this.bird.y - this.bird.radius <= 0) {
          this.die();
        }

        // Pipe spawn
        this.spawnTimer++;
        if (this.spawnTimer > 105) {
          this.spawnTimer = 0;
          const gap = 125;
          const topH = 60 + Math.random() * (this.height - gap - 140);
          this.pipes.push({ x: this.width, topH, bottomY: topH + gap, passed: false });
        }

        // Pipe update
        for (let i = this.pipes.length - 1; i >= 0; i--) {
          const p = this.pipes[i];
          p.x -= 2.6;

          // Score check
          if (!p.passed && p.x + 45 < this.bird.x) {
            p.passed = true;
            this.score++;
            window.audioEngine.coin();
            if (this.score >= 10) window.storageManager.unlock('flappy_10');
            window.storageManager.setGameScore('flappy', this.score);
            document.getElementById('flappy-score').textContent = this.score;
          }

          // Collision check
          if (this.bird.x + this.bird.radius > p.x && this.bird.x - this.bird.radius < p.x + 45) {
            if (this.bird.y - this.bird.radius < p.topH || this.bird.y + this.bird.radius > p.bottomY) {
              this.die();
            }
          }

          if (p.x < -60) this.pipes.splice(i, 1);
        }
      }
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  die() {
    this.isDead = true;
    window.audioEngine.gameOver();
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, this.width, this.height);

    // Pipes
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 8;
    this.pipes.forEach((p) => {
      ctx.fillRect(p.x, 0, 45, p.topH);
      ctx.fillRect(p.x, p.bottomY, 45, this.height - p.bottomY);
    });

    // Bird
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(this.bird.x, this.bird.y, this.bird.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (!this.isStarted) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CLICK / TAP TO FLY', this.width / 2, this.height / 2 - 20);
    } else if (this.isDead) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CRASHED!', this.width / 2, this.height / 2 - 20);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '14px sans-serif';
      ctx.fillText('Tap to restart', this.width / 2, this.height / 2 + 15);
    }
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.canvas.removeEventListener('mousedown', this.boundJump);
    this.canvas.removeEventListener('touchstart', this.boundJump);
    window.removeEventListener('keydown', this.boundKey);
    this.container.innerHTML = '';
  }
}
window.FlappyGame = FlappyGame;

// ============================================================================
// 4. STAR CATCHER (Arcade)
// ============================================================================
class StarCatcherGame {
  constructor(container) {
    this.container = container;
    this.width = 540;
    this.height = 420;
    this.paddle = { x: 230, w: 90, h: 14 };
    this.items = [];
    this.score = 0;
    this.starsCaught = 0;
    this.lives = 3;
    this.best = window.storageManager.getHighScore('star_catcher', 0);
    this.animId = null;

    this.renderDOM();
    this.bindEvents();
    this.startLoop();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper star-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-val" id="star-score">0</span></div>
          <div class="hud-item"><span class="hud-label">LIVES</span><span class="hud-val" id="star-lives">❤️❤️❤️</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.best}</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="star-reset">🔄</button></div>
        </div>
        <canvas id="star-canvas" width="540" height="420"></canvas>
        <div class="game-controls-hint"><span>Catch golden stars (+10) and gems (+25). Dodge dangerous red bombs!</span></div>
      </div>
    `;
    this.canvas = document.getElementById('star-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    this.boundMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const scaleX = this.canvas.width / rect.width;
      this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.w, (clientX - rect.left) * scaleX - this.paddle.w / 2));
    };
    this.canvas.addEventListener('mousemove', this.boundMove);
    this.canvas.addEventListener('touchmove', this.boundMove, { passive: true });
    document.getElementById('star-reset').addEventListener('click', () => this.reset());
  }

  reset() {
    this.items = [];
    this.score = 0;
    this.starsCaught = 0;
    this.lives = 3;
    this.updateHUD();
  }

  updateHUD() {
    document.getElementById('star-score').textContent = this.score;
    const hearts = '❤️'.repeat(Math.max(0, this.lives)) || '💀';
    document.getElementById('star-lives').textContent = hearts;
  }

  startLoop() {
    let spawnCount = 0;
    const loop = () => {
      if (this.lives > 0) {
        spawnCount++;
        if (spawnCount > 40) {
          spawnCount = 0;
          const isBomb = Math.random() < 0.28;
          const isGem = !isBomb && Math.random() < 0.25;
          this.items.push({
            x: 20 + Math.random() * (this.width - 40),
            y: -15,
            vy: 2.2 + Math.random() * 2.8,
            type: isBomb ? 'bomb' : isGem ? 'gem' : 'star',
            radius: isBomb ? 12 : 10
          });
        }

        // Move and collide
        for (let i = this.items.length - 1; i >= 0; i--) {
          const item = this.items[i];
          item.y += item.vy;

          // Catch collision
          if (item.y + item.radius >= this.height - 35 && item.y - item.radius <= this.height - 20) {
            if (item.x >= this.paddle.x && item.x <= this.paddle.x + this.paddle.w) {
              if (item.type === 'bomb') {
                this.lives--;
                window.audioEngine.explosion();
                this.updateHUD();
              } else if (item.type === 'gem') {
                this.score += 25;
                this.starsCaught++;
                window.audioEngine.coin();
                this.updateHUD();
              } else {
                this.score += 10;
                this.starsCaught++;
                window.audioEngine.plink();
                this.updateHUD();
              }
              if (this.starsCaught >= 25) window.storageManager.unlock('star_catcher');
              window.storageManager.setGameScore('star_catcher', this.score);
              this.items.splice(i, 1);
              continue;
            }
          }

          if (item.y > this.height + 20) {
            this.items.splice(i, 1);
          }
        }
      }
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0d17';
    ctx.fillRect(0, 0, this.width, this.height);

    // Paddle
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 10;
    ctx.fillRect(this.paddle.x, this.height - 30, this.paddle.w, this.paddle.h);

    // Items
    this.items.forEach((item) => {
      ctx.beginPath();
      if (item.type === 'star') {
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
      } else if (item.type === 'gem') {
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#a855f7';
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
      }
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    if (this.lives <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OUT OF LIVES', this.width / 2, this.height / 2);
    }
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.canvas.removeEventListener('mousemove', this.boundMove);
    this.canvas.removeEventListener('touchmove', this.boundMove);
    this.container.innerHTML = '';
  }
}
window.StarCatcherGame = StarCatcherGame;

// ============================================================================
// 5. NEON WHACK-A-MOLE (Arcade)
// ============================================================================
class WhackAMoleGame {
  constructor(container) {
    this.container = container;
    this.score = 0;
    this.whacks = 0;
    this.timeLeft = 30;
    this.timer = null;
    this.spawnInterval = null;
    this.best = window.storageManager.getHighScore('whack_mole', 0);
    this.holes = Array(9).fill(null);

    this.renderDOM();
    this.bindEvents();
    this.startGame();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper mole-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">TIME</span><span class="hud-val" id="mole-time">30s</span></div>
          <div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-val" id="mole-score">0</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.best}</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="mole-reset">🔄</button></div>
        </div>
        <div class="mole-grid" id="mole-grid">
          ${Array(9).fill(0).map((_, i) => `<div class="mole-hole" data-idx="${i}"><div class="mole-head"></div></div>`).join('')}
        </div>
        <div class="game-controls-hint"><span>Click or tap popping cyber bots quickly before they burrow back down!</span></div>
      </div>
    `;
  }

  bindEvents() {
    document.querySelectorAll('.mole-hole').forEach((hole) => {
      hole.addEventListener('click', () => {
        const idx = parseInt(hole.getAttribute('data-idx'));
        if (this.holes[idx]) {
          const type = this.holes[idx];
          this.holes[idx] = null;
          hole.classList.remove('active', 'gold', 'bomb');
          if (type === 'gold') {
            this.score += 300;
            window.audioEngine.coin();
          } else if (type === 'bomb') {
            this.score = Math.max(0, this.score - 150);
            window.audioEngine.explosion();
          } else {
            this.score += 100;
            this.whacks++;
            window.audioEngine.hit();
          }
          if (this.whacks >= 20) window.storageManager.unlock('mole_whacker');
          window.storageManager.setGameScore('whack_mole', this.score);
          document.getElementById('mole-score').textContent = this.score;
        }
      });
    });
    document.getElementById('mole-reset').addEventListener('click', () => this.startGame());
  }

  startGame() {
    if (this.timer) clearInterval(this.timer);
    if (this.spawnInterval) clearInterval(this.spawnInterval);
    this.score = 0;
    this.whacks = 0;
    this.timeLeft = 30;
    this.holes = Array(9).fill(null);
    document.getElementById('mole-score').textContent = '0';
    document.getElementById('mole-time').textContent = '30s';

    this.timer = setInterval(() => {
      this.timeLeft--;
      document.getElementById('mole-time').textContent = `${this.timeLeft}s`;
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        clearInterval(this.spawnInterval);
        window.audioEngine.win();
      }
    }, 1000);

    this.spawnInterval = setInterval(() => {
      if (this.timeLeft <= 0) return;
      const idx = Math.floor(Math.random() * 9);
      if (!this.holes[idx]) {
        const rand = Math.random();
        const type = rand < 0.15 ? 'gold' : rand < 0.35 ? 'bomb' : 'normal';
        this.holes[idx] = type;
        const holeEl = document.querySelector(`.mole-hole[data-idx="${idx}"]`);
        if (holeEl) {
          holeEl.classList.add('active', type);
          setTimeout(() => {
            if (this.holes[idx] === type) {
              this.holes[idx] = null;
              holeEl.classList.remove('active', 'gold', 'bomb');
            }
          }, 850);
        }
      }
    }, 600);
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.spawnInterval) clearInterval(this.spawnInterval);
    this.container.innerHTML = '';
  }
}
window.WhackAMoleGame = WhackAMoleGame;

// ============================================================================
// 6. COLOR GATE REFLEX (Arcade)
// ============================================================================
class ColorGateGame {
  constructor(container) {
    this.container = container;
    this.width = 440;
    this.height = 500;
    this.ball = { x: 220, y: 380, vy: 0, colorIdx: 0, radius: 10 };
    this.colors = ['#00ffcc', '#f43f5e', '#ffd700', '#a855f7'];
    this.rings = [];
    this.score = 0;
    this.best = window.storageManager.getHighScore('color_gate', 0);
    this.isDead = false;
    this.animId = null;

    this.renderDOM();
    this.bindEvents();
    this.reset();
    this.startLoop();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper gate-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">GATES PASSED</span><span class="hud-val" id="gate-score">0</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.best}</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="gate-reset">🔄</button></div>
        </div>
        <canvas id="gate-canvas" width="440" height="500"></canvas>
        <div class="game-controls-hint"><span>Tap or Space to bounce! Pass only through matching colored arc segments.</span></div>
      </div>
    `;
    this.canvas = document.getElementById('gate-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    this.boundTap = (e) => {
      e.preventDefault();
      if (this.isDead) { this.reset(); return; }
      this.ball.vy = -6.2;
      window.audioEngine.paddle();
    };
    this.canvas.addEventListener('mousedown', this.boundTap);
    this.canvas.addEventListener('touchstart', this.boundTap, { passive: false });
    this.boundKey = (e) => { if (e.key === ' ' || e.key === 'ArrowUp') this.boundTap(e); };
    window.addEventListener('keydown', this.boundKey);
    document.getElementById('gate-reset').addEventListener('click', () => this.reset());
  }

  reset() {
    this.ball = { x: 220, y: 380, vy: 0, colorIdx: Math.floor(Math.random() * 4), radius: 10 };
    this.rings = [
      { y: 220, radius: 65, angle: 0, speed: 0.025, passed: false },
      { y: 0, radius: 65, angle: 0, speed: -0.025, passed: false }
    ];
    this.score = 0;
    this.isDead = false;
    document.getElementById('gate-score').textContent = '0';
  }

  startLoop() {
    const loop = () => {
      if (!this.isDead) {
        this.ball.vy += 0.3;
        this.ball.y += this.ball.vy;

        // Camera scroll
        if (this.ball.y < 240) {
          const delta = 240 - this.ball.y;
          this.ball.y = 240;
          this.rings.forEach((r) => r.y += delta);
        }

        // Spawn next ring
        if (this.rings[this.rings.length - 1].y > 80) {
          this.rings.push({
            y: this.rings[this.rings.length - 1].y - 220,
            radius: 65,
            angle: Math.random() * Math.PI,
            speed: (Math.random() > 0.5 ? 0.025 : -0.025),
            passed: false
          });
        }

        // Update rings and collision
        for (let i = this.rings.length - 1; i >= 0; i--) {
          const r = this.rings[i];
          r.angle += r.speed;

          // Check pass
          if (!r.passed && this.ball.y < r.y - r.radius) {
            r.passed = true;
            this.score++;
            this.ball.colorIdx = Math.floor(Math.random() * 4);
            window.audioEngine.coin();
            if (this.score >= 8) window.storageManager.unlock('gate_pass');
            window.storageManager.setGameScore('color_gate', this.score);
            document.getElementById('gate-score').textContent = this.score;
          }

          // Check arc collision when crossing bottom or top perimeter
          const dist = Math.hypot(this.ball.x - 220, this.ball.y - r.y);
          if (Math.abs(dist - r.radius) < this.ball.radius) {
            // Find angle on circle
            let contactAngle = Math.atan2(this.ball.y - r.y, this.ball.x - 220) - r.angle;
            contactAngle = ((contactAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const quadrant = Math.floor(contactAngle / (Math.PI / 2));
            if (quadrant !== this.ball.colorIdx) {
              this.isDead = true;
              window.audioEngine.gameOver();
            }
          }

          if (r.y > this.height + 100) this.rings.splice(i, 1);
        }

        if (this.ball.y > this.height) {
          this.isDead = true;
          window.audioEngine.gameOver();
        }
      }
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, this.width, this.height);

    // Rings
    this.rings.forEach((r) => {
      for (let q = 0; q < 4; q++) {
        ctx.strokeStyle = this.colors[q];
        ctx.lineWidth = 12;
        ctx.beginPath();
        const start = r.angle + q * (Math.PI / 2);
        const end = start + Math.PI / 2;
        ctx.arc(220, r.y, r.radius, start, end);
        ctx.stroke();
      }
    });

    // Ball
    ctx.fillStyle = this.colors[this.ball.colorIdx];
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();

    if (this.isDead) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MISMATCH! CLICK TO RETRY', this.width / 2, this.height / 2);
    }
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.canvas.removeEventListener('mousedown', this.boundTap);
    this.canvas.removeEventListener('touchstart', this.boundTap);
    window.removeEventListener('keydown', this.boundKey);
    this.container.innerHTML = '';
  }
}
window.ColorGateGame = ColorGateGame;

// ============================================================================
// 7. TOWER STACKER (Arcade)
// ============================================================================
class TowerStackerGame {
  constructor(container) {
    this.container = container;
    this.width = 460;
    this.height = 500;
    this.blockH = 26;
    this.blocks = [];
    this.currentBlock = null;
    this.speed = 4;
    this.dir = 1;
    this.score = 0;
    this.best = window.storageManager.getHighScore('tower_stack', 0);
    this.isOver = false;
    this.animId = null;

    this.renderDOM();
    this.bindEvents();
    this.reset();
    this.startLoop();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper stacker-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">HEIGHT</span><span class="hud-val" id="stack-score">0</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.best}</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="stack-reset">🔄</button></div>
        </div>
        <canvas id="stack-canvas" width="460" height="500"></canvas>
        <div class="game-controls-hint"><span>Click, tap, or press <b>Space</b> to drop the sliding block. Cut off overhang!</span></div>
      </div>
    `;
    this.canvas = document.getElementById('stack-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    this.boundDrop = (e) => {
      e.preventDefault();
      if (this.isOver) { this.reset(); return; }
      this.placeBlock();
    };
    this.canvas.addEventListener('mousedown', this.boundDrop);
    this.canvas.addEventListener('touchstart', this.boundDrop, { passive: false });
    this.boundKey = (e) => { if (e.key === ' ' || e.key === 'ArrowDown') this.boundDrop(e); };
    window.addEventListener('keydown', this.boundKey);
    document.getElementById('stack-reset').addEventListener('click', () => this.reset());
  }

  reset() {
    this.blocks = [
      { x: 130, y: this.height - 40, w: 200, color: '#00ffcc' }
    ];
    this.score = 0;
    this.isOver = false;
    this.speed = 4;
    this.spawnBlock();
    document.getElementById('stack-score').textContent = '0';
  }

  spawnBlock() {
    const prev = this.blocks[this.blocks.length - 1];
    const colors = ['#00ffcc', '#3b82f6', '#ffd700', '#f43f5e', '#a855f7'];
    this.currentBlock = {
      x: 0,
      y: prev.y - this.blockH,
      w: prev.w,
      color: colors[this.blocks.length % colors.length]
    };
  }

  placeBlock() {
    const prev = this.blocks[this.blocks.length - 1];
    const curr = this.currentBlock;
    const diff = curr.x - prev.x;

    if (Math.abs(diff) < 4) {
      // Perfect drop!
      curr.x = prev.x;
      window.audioEngine.win();
    } else if (diff > 0) {
      curr.w -= diff;
      window.audioEngine.paddle();
    } else {
      curr.w += diff;
      curr.x = prev.x;
      window.audioEngine.paddle();
    }

    if (curr.w <= 0) {
      this.isOver = true;
      window.audioEngine.gameOver();
      return;
    }

    this.blocks.push(curr);
    this.score++;
    if (this.score >= 12) window.storageManager.unlock('tower_stack');
    window.storageManager.setGameScore('tower_stack', this.score);
    document.getElementById('stack-score').textContent = this.score;

    this.speed = Math.min(8.5, 4 + this.score * 0.15);

    // Scroll tower down when high
    if (curr.y < 200) {
      this.blocks.forEach((b) => b.y += this.blockH);
    }
    this.spawnBlock();
  }

  startLoop() {
    const loop = () => {
      if (!this.isOver && this.currentBlock) {
        this.currentBlock.x += this.speed * this.dir;
        if (this.currentBlock.x + this.currentBlock.w >= this.width) {
          this.currentBlock.x = this.width - this.currentBlock.w;
          this.dir = -1;
        } else if (this.currentBlock.x <= 0) {
          this.currentBlock.x = 0;
          this.dir = 1;
        }
      }
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, this.width, this.height);

    // Placed blocks
    this.blocks.forEach((b) => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, this.blockH - 2);
    });

    // Active sliding block
    if (this.currentBlock && !this.isOver) {
      ctx.fillStyle = this.currentBlock.color;
      ctx.fillRect(this.currentBlock.x, this.currentBlock.y, this.currentBlock.w, this.blockH - 2);
    }

    if (this.isOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TOWER COLLAPSED! TAP TO RETRY', this.width / 2, this.height / 2);
    }
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.canvas.removeEventListener('mousedown', this.boundDrop);
    this.canvas.removeEventListener('touchstart', this.boundDrop);
    window.removeEventListener('keydown', this.boundKey);
    this.container.innerHTML = '';
  }
}
window.TowerStackerGame = TowerStackerGame;

// ============================================================================
// 8. BULLET HELL DODGE (Arcade)
// ============================================================================
class BulletHellGame {
  constructor(container) {
    this.container = container;
    this.width = 540;
    this.height = 420;
    this.ship = { x: 270, y: 210, radius: 7 };
    this.bullets = [];
    this.startTime = Date.now();
    this.survivalSeconds = 0;
    this.best = window.storageManager.getHighScore('bullet_hell', 0);
    this.isDead = false;
    this.animId = null;

    this.renderDOM();
    this.bindEvents();
    this.startLoop();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper bullet-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">SURVIVED</span><span class="hud-val" id="bullet-time">0.0s</span></div>
          <div class="hud-item"><span class="hud-label">BULLETS</span><span class="hud-val" id="bullet-count">0</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.best}s</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="bullet-reset">🔄</button></div>
        </div>
        <canvas id="bullet-canvas" width="540" height="420"></canvas>
        <div class="game-controls-hint"><span>Guide your ship with mouse/touch or <b>WASD</b> to dodge incoming plasma orbs!</span></div>
      </div>
    `;
    this.canvas = document.getElementById('bullet-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    this.boundMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.ship.x = (clientX - rect.left) * scaleX;
      this.ship.y = (clientY - rect.top) * scaleY;
    };
    this.canvas.addEventListener('mousemove', this.boundMove);
    this.canvas.addEventListener('touchmove', this.boundMove, { passive: true });
    document.getElementById('bullet-reset').addEventListener('click', () => this.reset());
  }

  reset() {
    this.bullets = [];
    this.startTime = Date.now();
    this.isDead = false;
  }

  startLoop() {
    let spawnTimer = 0;
    const loop = () => {
      if (!this.isDead) {
        this.survivalSeconds = ((Date.now() - this.startTime) / 1000).toFixed(1);
        document.getElementById('bullet-time').textContent = `${this.survivalSeconds}s`;
        document.getElementById('bullet-count').textContent = this.bullets.length;

        if (this.survivalSeconds >= 20) window.storageManager.unlock('bullet_survivor');
        window.storageManager.setGameScore('bullet_hell', parseFloat(this.survivalSeconds));

        // Spawn bullets from perimeter
        spawnTimer++;
        if (spawnTimer > 15) {
          spawnTimer = 0;
          const edge = Math.floor(Math.random() * 4);
          let bx = 0, by = 0;
          if (edge === 0) { bx = Math.random() * this.width; by = 0; }
          else if (edge === 1) { bx = this.width; by = Math.random() * this.height; }
          else if (edge === 2) { bx = Math.random() * this.width; by = this.height; }
          else { bx = 0; by = Math.random() * this.height; }

          const angle = Math.atan2(this.ship.y - by, this.ship.x - bx) + (Math.random() - 0.5) * 0.4;
          const speed = 2.5 + Math.random() * 3.5;
          this.bullets.push({
            x: bx,
            y: by,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 5 + Math.random() * 4
          });
        }

        // Move bullets and collide
        for (let i = this.bullets.length - 1; i >= 0; i--) {
          const b = this.bullets[i];
          b.x += b.vx;
          b.y += b.vy;

          // Wall bounce
          if (b.x < 0 || b.x > this.width) b.vx *= -1;
          if (b.y < 0 || b.y > this.height) b.vy *= -1;

          // Check hit
          if (Math.hypot(b.x - this.ship.x, b.y - this.ship.y) < b.radius + this.ship.radius) {
            this.isDead = true;
            window.audioEngine.explosion();
          }
        }
      }
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, this.width, this.height);

    // Bullets
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 8;
    this.bullets.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.beginPath();
    ctx.arc(this.ship.x, this.ship.y, this.ship.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (this.isDead) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`HIT! SURVIVED: ${this.survivalSeconds}s`, this.width / 2, this.height / 2);
    }
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.canvas.removeEventListener('mousemove', this.boundMove);
    this.canvas.removeEventListener('touchmove', this.boundMove);
    this.container.innerHTML = '';
  }
}
window.BulletHellGame = BulletHellGame;

// ============================================================================
// 9. SYNTH RHYTHM TAP (Arcade)
// ============================================================================
class RhythmTapGame {
  constructor(container) {
    this.container = container;
    this.width = 440;
    this.height = 500;
    this.lanes = 4;
    this.laneW = this.width / this.lanes;
    this.notes = [];
    this.score = 0;
    this.combo = 0;
    this.best = window.storageManager.getHighScore('rhythm_tap', 0);
    this.keyMap = { 'd': 0, 'f': 1, 'j': 2, 'k': 3 };
    this.freqs = [261.63, 329.63, 392.00, 523.25];
    this.animId = null;

    this.renderDOM();
    this.bindEvents();
    this.startLoop();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper rhythm-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-val" id="rhythm-score">0</span></div>
          <div class="hud-item"><span class="hud-label">COMBO</span><span class="hud-val" id="rhythm-combo">0</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.best}</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="rhythm-reset">🔄</button></div>
        </div>
        <canvas id="rhythm-canvas" width="440" height="500"></canvas>
        <div class="rhythm-buttons">
          <button class="rhythm-key" data-lane="0">D</button>
          <button class="rhythm-key" data-lane="1">F</button>
          <button class="rhythm-key" data-lane="2">J</button>
          <button class="rhythm-key" data-lane="3">K</button>
        </div>
        <div class="game-controls-hint"><span>Tap or press <b>D, F, J, K</b> precisely when falling notes hit the glowing baseline!</span></div>
      </div>
    `;
    this.canvas = document.getElementById('rhythm-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    this.boundKey = (e) => {
      const k = e.key.toLowerCase();
      if (this.keyMap[k] !== undefined) {
        this.hitLane(this.keyMap[k]);
      }
    };
    window.addEventListener('keydown', this.boundKey);
    this.container.querySelectorAll('.rhythm-key').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.hitLane(parseInt(btn.getAttribute('data-lane')));
      });
    });
    document.getElementById('rhythm-reset').addEventListener('click', () => this.reset());
  }

  reset() {
    this.notes = [];
    this.score = 0;
    this.combo = 0;
    this.updateHUD();
  }

  hitLane(lane) {
    const targetY = this.height - 60;
    let hitIndex = -1;
    let closestDist = 999;

    for (let i = 0; i < this.notes.length; i++) {
      const n = this.notes[i];
      if (n.lane === lane) {
        const dist = Math.abs(n.y - targetY);
        if (dist < 45 && dist < closestDist) {
          closestDist = dist;
          hitIndex = i;
        }
      }
    }

    if (hitIndex !== -1) {
      this.notes.splice(hitIndex, 1);
      this.combo++;
      const pts = closestDist < 18 ? 100 : 50;
      this.score += pts * Math.min(4, 1 + Math.floor(this.combo / 5));
      window.audioEngine.tone(this.freqs[lane], 0.15, 'triangle');
      window.storageManager.setGameScore('rhythm_tap', this.score);
    } else {
      this.combo = 0;
      window.audioEngine.miss();
    }
    this.updateHUD();
  }

  updateHUD() {
    document.getElementById('rhythm-score').textContent = this.score;
    document.getElementById('rhythm-combo').textContent = this.combo;
  }

  startLoop() {
    let spawnTimer = 0;
    const loop = () => {
      spawnTimer++;
      if (spawnTimer > 32) {
        spawnTimer = 0;
        this.notes.push({
          lane: Math.floor(Math.random() * 4),
          y: -15,
          speed: 4.8
        });
      }

      for (let i = this.notes.length - 1; i >= 0; i--) {
        this.notes[i].y += this.notes[i].speed;
        if (this.notes[i].y > this.height) {
          this.notes.splice(i, 1);
          this.combo = 0;
          this.updateHUD();
        }
      }

      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, this.width, this.height);

    // Lane dividers
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    for (let i = 1; i < this.lanes; i++) {
      ctx.beginPath();
      ctx.moveTo(i * this.laneW, 0);
      ctx.lineTo(i * this.laneW, this.height);
      ctx.stroke();
    }

    // Hit baseline
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, this.height - 60);
    ctx.lineTo(this.width, this.height - 60);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Notes
    const colors = ['#00ffcc', '#3b82f6', '#ffd700', '#f43f5e'];
    this.notes.forEach((n) => {
      ctx.fillStyle = colors[n.lane];
      ctx.fillRect(n.lane * this.laneW + 8, n.y - 10, this.laneW - 16, 20);
    });
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this.boundKey);
    this.container.innerHTML = '';
  }
}
window.RhythmTapGame = RhythmTapGame;

// ============================================================================
// 10. VECTOR ASTEROID BLASTER (Arcade)
// ============================================================================
class AsteroidBlasterGame {
  constructor(container) {
    this.container = container;
    this.width = 600;
    this.height = 420;
    this.ship = { x: 300, y: 210, angle: 0, vx: 0, vy: 0 };
    this.lasers = [];
    this.asteroids = [];
    this.score = 0;
    this.lives = 3;
    this.best = window.storageManager.getHighScore('asteroids', 0);
    this.keys = {};
    this.animId = null;

    this.renderDOM();
    this.bindEvents();
    this.reset();
    this.startLoop();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper asteroid-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-val" id="ast-score">0</span></div>
          <div class="hud-item"><span class="hud-label">LIVES</span><span class="hud-val" id="ast-lives">🚀🚀🚀</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.best}</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="ast-reset">🔄</button></div>
        </div>
        <canvas id="ast-canvas" width="600" height="420"></canvas>
        <div class="game-controls-hint"><span><b>A / D or ◄ / ►</b> Rotate, <b>W or ▲</b> Thrust, <b>Space</b> Fire Laser!</span></div>
      </div>
    `;
    this.canvas = document.getElementById('ast-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    this.boundDown = (e) => { this.keys[e.key] = true; if (e.key === ' ') { e.preventDefault(); this.fireLaser(); } };
    this.boundUp = (e) => { this.keys[e.key] = false; };
    window.addEventListener('keydown', this.boundDown);
    window.addEventListener('keyup', this.boundUp);
    document.getElementById('ast-reset').addEventListener('click', () => this.reset());
  }

  reset() {
    this.ship = { x: 300, y: 210, angle: -Math.PI / 2, vx: 0, vy: 0 };
    this.lasers = [];
    this.asteroids = [];
    this.score = 0;
    this.lives = 3;
    for (let i = 0; i < 5; i++) {
      this.spawnAsteroid(35);
    }
    this.updateHUD();
  }

  spawnAsteroid(radius) {
    this.asteroids.push({
      x: Math.random() < 0.5 ? 20 : this.width - 20,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      radius: radius
    });
  }

  fireLaser() {
    if (this.lives <= 0) return;
    this.lasers.push({
      x: this.ship.x + Math.cos(this.ship.angle) * 15,
      y: this.ship.y + Math.sin(this.ship.angle) * 15,
      vx: Math.cos(this.ship.angle) * 8,
      vy: Math.sin(this.ship.angle) * 8,
      life: 50
    });
    window.audioEngine.laser();
  }

  updateHUD() {
    document.getElementById('ast-score').textContent = this.score;
    const ships = '🚀'.repeat(Math.max(0, this.lives)) || '💥';
    document.getElementById('ast-lives').textContent = ships;
  }

  startLoop() {
    const loop = () => {
      if (this.lives > 0) {
        // Controls
        if (this.keys['ArrowLeft'] || this.keys['a']) this.ship.angle -= 0.07;
        if (this.keys['ArrowRight'] || this.keys['d']) this.ship.angle += 0.07;
        if (this.keys['ArrowUp'] || this.keys['w']) {
          this.ship.vx += Math.cos(this.ship.angle) * 0.15;
          this.ship.vy += Math.sin(this.ship.angle) * 0.15;
        }

        // Friction & Move
        this.ship.vx *= 0.985;
        this.ship.vy *= 0.985;
        this.ship.x = (this.ship.x + this.ship.vx + this.width) % this.width;
        this.ship.y = (this.ship.y + this.ship.vy + this.height) % this.height;

        // Lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
          const l = this.lasers[i];
          l.x = (l.x + l.vx + this.width) % this.width;
          l.y = (l.y + l.vy + this.height) % this.height;
          l.life--;
          if (l.life <= 0) this.lasers.splice(i, 1);
        }

        // Asteroids
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
          const a = this.asteroids[i];
          a.x = (a.x + a.vx + this.width) % this.width;
          a.y = (a.y + a.vy + this.height) % this.height;

          // Hit with laser
          for (let j = this.lasers.length - 1; j >= 0; j--) {
            const l = this.lasers[j];
            if (Math.hypot(a.x - l.x, a.y - l.y) < a.radius) {
              window.audioEngine.explosion();
              this.score += a.radius > 25 ? 50 : 100;
              this.lasers.splice(j, 1);
              if (a.radius > 20) {
                this.asteroids.push({ x: a.x, y: a.y, vx: -a.vy, vy: a.vx, radius: a.radius / 1.7 });
                this.asteroids.push({ x: a.x, y: a.y, vx: a.vy, vy: -a.vx, radius: a.radius / 1.7 });
              }
              this.asteroids.splice(i, 1);
              window.storageManager.setGameScore('asteroids', this.score);
              this.updateHUD();
              break;
            }
          }

          // Hit with ship
          if (Math.hypot(a.x - this.ship.x, a.y - this.ship.y) < a.radius + 10) {
            this.lives--;
            window.audioEngine.explosion();
            this.ship.x = this.width / 2;
            this.ship.y = this.height / 2;
            this.ship.vx = 0;
            this.ship.vy = 0;
            this.updateHUD();
          }
        }

        if (this.asteroids.length === 0) {
          for (let i = 0; i < 6; i++) this.spawnAsteroid(35);
        }
      }
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, this.width, this.height);

    // Lasers
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 6;
    this.lasers.forEach((l) => {
      ctx.beginPath();
      ctx.arc(l.x, l.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Asteroids
    ctx.strokeStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.lineWidth = 2;
    this.asteroids.forEach((a) => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Ship
    if (this.lives > 0) {
      ctx.save();
      ctx.translate(this.ship.x, this.ship.y);
      ctx.rotate(this.ship.angle);
      ctx.strokeStyle = '#00ffcc';
      ctx.shadowColor = '#00ffcc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-10, -8);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SHIP DESTROYED!', this.width / 2, this.height / 2);
    }
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this.boundDown);
    window.removeEventListener('keyup', this.boundUp);
    this.container.innerHTML = '';
  }
}
window.AsteroidBlasterGame = AsteroidBlasterGame;
