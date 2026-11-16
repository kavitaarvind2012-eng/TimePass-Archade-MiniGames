/**
 * Neon Snake Game
 * Features: Power-ups, neon canvas glow, speed scaling, mobile D-pad, high score.
 */
class SnakeGame {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.gridSize = 20; // 20x20 grid
    this.tileSize = 25; // 500x500 canvas
    this.snake = [];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.score = 0;
    this.highScore = window.storageManager.getHighScore('snake') || 0;
    this.fruits = []; // Array of active fruits
    this.powerupActive = null; // { type, endTime }
    this.gameLoopInterval = null;
    this.animFrameId = null;
    this.baseSpeed = 130;
    this.currentSpeed = 130;
    this.isPaused = false;
    this.isGameOver = false;
    this.particles = [];
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.touchStartX = 0;
    this.touchStartY = 0;

    this.renderDOM();
    this.initGame();
    this.bindEvents();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper snake-wrapper">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">SCORE</span>
            <span class="hud-val" id="snake-score">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">BEST</span>
            <span class="hud-val" id="snake-best">${this.highScore}</span>
          </div>
          <div class="hud-item hud-powerup" id="snake-powerup-badge" style="display: none;">
            <span class="hud-label">POWER-UP</span>
            <span class="hud-val" id="snake-powerup-text">GHOST</span>
            <div class="powerup-bar"><div class="powerup-fill" id="snake-powerup-fill"></div></div>
          </div>
          <div class="hud-actions">
            <button class="btn btn-sm btn-icon" id="snake-pause-btn" title="Pause Game">⏸️</button>
            <button class="btn btn-sm btn-icon" id="snake-restart-btn" title="Restart">🔄</button>
          </div>
        </div>

        <div class="canvas-container">
          <canvas id="snake-canvas" width="500" height="500"></canvas>
          <div class="game-overlay" id="snake-overlay" style="display: none;">
            <div class="overlay-card">
              <h2 id="snake-overlay-title">GAME OVER</h2>
              <p id="snake-overlay-desc">Final Score: <span id="snake-final-score">0</span></p>
              <div class="overlay-buttons">
                <button class="btn btn-primary" id="snake-play-again-btn">Play Again</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Virtual Mobile D-Pad -->
        <div class="mobile-dpad">
          <button class="dpad-btn dpad-up" data-dir="up">▲</button>
          <div class="dpad-middle">
            <button class="dpad-btn dpad-left" data-dir="left">◀</button>
            <div class="dpad-center"></div>
            <button class="dpad-btn dpad-right" data-dir="right">▶</button>
          </div>
          <button class="dpad-btn dpad-down" data-dir="down">▼</button>
        </div>

        <div class="game-controls-hint">
          <span>Use <b>Arrow Keys</b> or <b>W A S D</b> to glide. Mobile: Swipe or tap D-pad.</span>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('snake-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  initGame() {
    this.snake = [
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 }
    ];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.score = 0;
    this.fruits = [];
    this.powerupActive = null;
    this.isGameOver = false;
    this.isPaused = false;
    this.currentSpeed = this.baseSpeed;
    this.particles = [];

    this.spawnFruit('normal');
    this.updateHUD();
    document.getElementById('snake-overlay').style.display = 'none';

    this.startLoop();
    this.startAnim();
  }

  bindEvents() {
    window.addEventListener('keydown', this.boundKeyDown);

    // Pause & Restart
    document.getElementById('snake-pause-btn').addEventListener('click', () => this.togglePause());
    document.getElementById('snake-restart-btn').addEventListener('click', () => this.initGame());
    document.getElementById('snake-play-again-btn').addEventListener('click', () => this.initGame());

    // Mobile D-Pad
    this.container.querySelectorAll('.dpad-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const dir = btn.getAttribute('data-dir');
        this.setDirectionFromName(dir);
      });
    });

    // Touch Swipe on Canvas
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches.length > 0) {
        const dx = e.changedTouches[0].clientX - this.touchStartX;
        const dy = e.changedTouches[0].clientY - this.touchStartY;
        if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
          if (Math.abs(dx) > Math.abs(dy)) {
            this.setDirectionFromName(dx > 0 ? 'right' : 'left');
          } else {
            this.setDirectionFromName(dy > 0 ? 'down' : 'up');
          }
        }
      }
    }, { passive: true });
  }

  handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        this.setDirection(0, -1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        this.setDirection(0, 1);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        this.setDirection(-1, 0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        this.setDirection(1, 0);
        break;
      case ' ':
        e.preventDefault();
        this.togglePause();
        break;
    }
  }

  setDirectionFromName(name) {
    if (name === 'up') this.setDirection(0, -1);
    if (name === 'down') this.setDirection(0, 1);
    if (name === 'left') this.setDirection(-1, 0);
    if (name === 'right') this.setDirection(1, 0);
  }

  setDirection(dx, dy) {
    if (this.isPaused || this.isGameOver) return;
    // Disallow 180 reverse
    if (dx !== 0 && this.dir.x === -dx) return;
    if (dy !== 0 && this.dir.y === -dy) return;
    this.nextDir = { x: dx, y: dy };
  }

  togglePause() {
    if (this.isGameOver) return;
    this.isPaused = !this.isPaused;
    const btn = document.getElementById('snake-pause-btn');
    if (btn) btn.textContent = this.isPaused ? '▶️' : '⏸️';

    if (this.isPaused) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    } else {
      this.startLoop();
    }
  }

  startLoop() {
    if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
    this.gameLoopInterval = setInterval(() => {
      this.tick();
    }, this.currentSpeed);
  }

  startAnim() {
    const loop = () => {
      this.draw();
      this.updatePowerupHUD();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  spawnFruit(type = 'normal') {
    let emptyCells = [];
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const inSnake = this.snake.some((s) => s.x === x && s.y === y);
        const inFruit = this.fruits.some((f) => f.x === x && f.y === y);
        if (!inSnake && !inFruit) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) return;
    const spot = emptyCells[Math.floor(Math.random() * emptyCells.length)];

    let fruit = {
      x: spot.x,
      y: spot.y,
      type: type, // 'normal', 'gold', 'freeze', 'ghost'
      spawnTime: Date.now(),
      lifetime: type === 'normal' ? null : 8000 // Power-ups vanish after 8s
    };

    this.fruits.push(fruit);
  }

  tick() {
    if (this.isPaused || this.isGameOver) return;

    this.dir = { ...this.nextDir };
    let head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

    const isGhost = this.powerupActive && this.powerupActive.type === 'ghost';

    // Wall collision / Ghost wrapping
    if (isGhost) {
      if (head.x < 0) head.x = this.gridSize - 1;
      if (head.x >= this.gridSize) head.x = 0;
      if (head.y < 0) head.y = this.gridSize - 1;
      if (head.y >= this.gridSize) head.y = 0;
    } else {
      if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
        this.gameOver();
        return;
      }
    }

    // Self collision
    for (let i = 0; i < this.snake.length; i++) {
      if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
        this.gameOver();
        return;
      }
    }

    this.snake.unshift(head);

    // Check fruit consumption
    let ateFruitIdx = this.fruits.findIndex((f) => f.x === head.x && f.y === head.y);
    if (ateFruitIdx !== -1) {
      const fruit = this.fruits[ateFruitIdx];
      this.fruits.splice(ateFruitIdx, 1);
      this.handleFruitEaten(fruit);
    } else {
      this.snake.pop(); // Remove tail if no fruit eaten
    }

    // Clean expired power-up fruits on field
    const now = Date.now();
    this.fruits = this.fruits.filter((f) => !f.lifetime || now - f.spawnTime < f.lifetime);

    // Random power-up spawn chance (approx once every 12-20 moves)
    if (Math.random() < 0.05 && this.fruits.length < 2) {
      const types = ['gold', 'freeze', 'ghost'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      this.spawnFruit(chosen);
    }

    // Ensure at least one normal apple is on the field
    if (!this.fruits.some((f) => f.type === 'normal')) {
      this.spawnFruit('normal');
    }

    // Check active power-up expiration
    if (this.powerupActive && Date.now() > this.powerupActive.endTime) {
      this.deactivatePowerup();
    }
  }

  handleFruitEaten(fruit) {
    this.createExplosion(
      fruit.x * this.tileSize + this.tileSize / 2,
      fruit.y * this.tileSize + this.tileSize / 2,
      fruit.type
    );

    if (fruit.type === 'normal') {
      this.score += 10;
      window.audioEngine.eat();
    } else if (fruit.type === 'gold') {
      this.score += 35;
      window.audioEngine.powerup();
      window.storageManager.unlock('snake_power');
    } else if (fruit.type === 'freeze') {
      this.score += 15;
      this.activatePowerup('freeze', 5000);
      window.audioEngine.powerup();
      window.storageManager.unlock('snake_power');
    } else if (fruit.type === 'ghost') {
      this.score += 20;
      this.activatePowerup('ghost', 6000);
      window.audioEngine.powerup();
      window.storageManager.unlock('snake_power');
    }

    // Update speed based on score (unless frozen)
    if (!this.powerupActive || this.powerupActive.type !== 'freeze') {
      this.currentSpeed = Math.max(65, this.baseSpeed - Math.floor(this.score / 40) * 8);
      this.startLoop();
    }

    this.updateHUD();
    this.spawnFruit('normal');
  }

  activatePowerup(type, duration) {
    this.powerupActive = {
      type: type,
      duration: duration,
      startTime: Date.now(),
      endTime: Date.now() + duration
    };

    if (type === 'freeze') {
      this.currentSpeed = 190; // Slow motion
      this.startLoop();
    }

    const badge = document.getElementById('snake-powerup-badge');
    const label = document.getElementById('snake-powerup-text');
    if (badge && label) {
      badge.style.display = 'flex';
      label.textContent = type === 'freeze' ? '❄️ FREEZE' : '👻 GHOST PASS';
    }
  }

  deactivatePowerup() {
    if (!this.powerupActive) return;
    this.powerupActive = null;
    this.currentSpeed = Math.max(65, this.baseSpeed - Math.floor(this.score / 40) * 8);
    this.startLoop();

    const badge = document.getElementById('snake-powerup-badge');
    if (badge) badge.style.display = 'none';
  }

  updatePowerupHUD() {
    if (!this.powerupActive) return;
    const remaining = Math.max(0, this.powerupActive.endTime - Date.now());
    const pct = (remaining / this.powerupActive.duration) * 100;
    const fill = document.getElementById('snake-powerup-fill');
    if (fill) fill.style.width = `${pct}%`;
  }

  updateHUD() {
    const scoreEl = document.getElementById('snake-score');
    const bestEl = document.getElementById('snake-best');
    if (scoreEl) scoreEl.textContent = this.score;
    if (bestEl) bestEl.textContent = Math.max(this.score, this.highScore);
  }

  createExplosion(x, y, type) {
    const colorMap = {
      normal: '#ff3366',
      gold: '#ffd700',
      freeze: '#00e5ff',
      ghost: '#b388ff'
    };
    const col = colorMap[type] || '#00ffcc';

    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5);
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: col,
        radius: 2 + Math.random() * 3,
        alpha: 1,
        decay: 0.03 + Math.random() * 0.03
      });
    }
  }

  gameOver() {
    this.isGameOver = true;
    clearInterval(this.gameLoopInterval);
    this.gameLoopInterval = null;

    window.audioEngine.gameOver();
    window.storageManager.setSnakeScore(this.score, this.snake.length);

    const overlay = document.getElementById('snake-overlay');
    const finalScore = document.getElementById('snake-final-score');
    if (overlay && finalScore) {
      finalScore.textContent = this.score;
      overlay.style.display = 'flex';
    }
  }

  draw() {
    const { ctx, canvas, tileSize, gridSize } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Neon Grid Background lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * tileSize, 0);
      ctx.lineTo(i * tileSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * tileSize);
      ctx.lineTo(canvas.width, i * tileSize);
      ctx.stroke();
    }

    // Border glow
    const isGhost = this.powerupActive && this.powerupActive.type === 'ghost';
    ctx.strokeStyle = isGhost ? 'rgba(179, 136, 255, 0.8)' : 'rgba(0, 255, 204, 0.3)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    // Draw Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Fruits
    const now = Date.now();
    this.fruits.forEach((f) => {
      const cx = f.x * tileSize + tileSize / 2;
      const cy = f.y * tileSize + tileSize / 2;
      const pulse = Math.sin(now * 0.008) * 1.5;

      ctx.save();
      if (f.type === 'normal') {
        ctx.fillStyle = '#ff3366';
        ctx.shadowColor = '#ff3366';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize / 2.6 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Stem
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(cx - 1, cy - tileSize / 2.2, 2, 4);
      } else if (f.type === 'gold') {
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize / 2.4 + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText('★', cx - 4, cy + 4);
      } else if (f.type === 'freeze') {
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize / 2.5 + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText('❄', cx - 4, cy + 4);
      } else if (f.type === 'ghost') {
        ctx.fillStyle = '#b388ff';
        ctx.shadowColor = '#d500f9';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize / 2.5 + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText('👻', cx - 6, cy + 4);
      }
      ctx.restore();
    });

    // Draw Snake
    const snakeLen = this.snake.length;
    this.snake.forEach((seg, index) => {
      const x = seg.x * tileSize;
      const y = seg.y * tileSize;
      const isHead = index === 0;

      ctx.save();
      const ratio = 1 - index / snakeLen;

      if (isHead) {
        ctx.fillStyle = isGhost ? '#b388ff' : '#00ffcc';
        ctx.shadowColor = isGhost ? '#d500f9' : '#00ffcc';
        ctx.shadowBlur = 15;
        this.drawRoundedRect(ctx, x + 2, y + 2, tileSize - 4, tileSize - 4, 6);
        ctx.fill();

        // Head Eyes
        ctx.fillStyle = '#0f172a';
        const eyeOffset = 6;
        let eye1 = { x: x + 6, y: y + 6 };
        let eye2 = { x: x + tileSize - 8, y: y + 6 };

        if (this.dir.x === 1) {
          eye1 = { x: x + tileSize - 7, y: y + 6 };
          eye2 = { x: x + tileSize - 7, y: y + tileSize - 8 };
        } else if (this.dir.x === -1) {
          eye1 = { x: x + 5, y: y + 6 };
          eye2 = { x: x + 5, y: y + tileSize - 8 };
        } else if (this.dir.y === 1) {
          eye1 = { x: x + 6, y: y + tileSize - 7 };
          eye2 = { x: x + tileSize - 8, y: y + tileSize - 7 };
        }

        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, 2, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Body segment
        const greenVal = Math.floor(200 + ratio * 55);
        ctx.fillStyle = isGhost
          ? `rgba(179, 136, 255, ${0.4 + ratio * 0.6})`
          : `rgba(0, ${greenVal}, ${Math.floor(180 + ratio * 75)}, ${0.4 + ratio * 0.6})`;

        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 6 * ratio;
        this.drawRoundedRect(ctx, x + 3, y + 3, tileSize - 6, tileSize - 6, 4);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  destroy() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('keydown', this.boundKeyDown);
    this.container.innerHTML = '';
  }
}

window.SnakeGame = SnakeGame;

