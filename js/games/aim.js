/**
 * Reaction & Aim Trainer Game
 * Features: 30s challenge, shrinking & moving targets, gold bonuses, hazard decoys,
 * live reaction time & accuracy tracker, combo streaks, rank grading.
 */
class AimTrainerGame {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.width = 700;
    this.height = 460;
    this.isPlaying = false;
    this.timeLeft = 30;
    this.timerInterval = null;
    this.animFrameId = null;

    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.reactionTimes = [];
    this.combo = 0;
    this.maxCombo = 0;

    this.targets = [];
    this.particles = [];
    this.nextTargetId = 1;
    this.lastSpawnTime = 0;
    this.spawnRate = 800; // ms

    this.boundClickHandler = this.handleClick.bind(this);
    this.boundTouchHandler = this.handleTouch.bind(this);

    this.renderDOM();
    this.bindEvents();
    this.resetHUD();
  }

  renderDOM() {
    const high = window.storageManager.getHighScore('aim') || {};
    this.container.innerHTML = `
      <div class="game-wrapper aim-wrapper">
        <div class="game-hud aim-hud">
          <div class="hud-item">
            <span class="hud-label">TIME</span>
            <span class="hud-val hud-accent" id="aim-time">30.0s</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">SCORE</span>
            <span class="hud-val" id="aim-score">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">ACCURACY</span>
            <span class="hud-val" id="aim-acc">100%</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">AVG REACTION</span>
            <span class="hud-val" id="aim-reaction">-- ms</span>
          </div>
          <div class="hud-item hud-combo" id="aim-combo-badge" style="display: none;">
            <span class="hud-label">STREAK</span>
            <span class="hud-val" id="aim-combo-text">x2 🔥</span>
          </div>
          <div class="hud-actions">
            <button class="btn btn-sm btn-icon" id="aim-restart-btn" title="Restart">🔄</button>
          </div>
        </div>

        <div class="aim-canvas-container">
          <canvas id="aim-canvas" width="700" height="460"></canvas>
          
          <div class="game-overlay" id="aim-overlay">
            <div class="overlay-card">
              <h2 id="aim-overlay-title">AIM & REACTION TRAINER</h2>
              <p id="aim-overlay-desc">Click as many targets as you can within 30 seconds! Avoid hazard skull decoys.</p>
              <div class="aim-summary-grid" id="aim-summary-grid" style="display: none;">
                <div class="summary-stat">
                  <span class="summary-label">Final Score</span>
                  <span class="summary-value" id="summary-score">0</span>
                </div>
                <div class="summary-stat">
                  <span class="summary-label">Accuracy</span>
                  <span class="summary-value" id="summary-acc">0%</span>
                </div>
                <div class="summary-stat">
                  <span class="summary-label">Avg Reaction</span>
                  <span class="summary-value" id="summary-react">0 ms</span>
                </div>
                <div class="summary-stat">
                  <span class="summary-label">Performance Rank</span>
                  <span class="summary-value rank-badge" id="summary-rank">S</span>
                </div>
              </div>
              <div class="overlay-buttons">
                <button class="btn btn-primary btn-lg" id="aim-start-btn">START 30s DRILL</button>
              </div>
            </div>
          </div>
        </div>

        <div class="game-controls-hint">
          <span>Click glowing rings before they shrink away. Golden = +300 pts, Moving = +200 pts, Skull = Hazard (-150 pts).</span>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('aim-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    document.getElementById('aim-start-btn').addEventListener('click', () => this.startGame());
    document.getElementById('aim-restart-btn').addEventListener('click', () => this.startGame());

    this.canvas.addEventListener('mousedown', this.boundClickHandler);
    this.canvas.addEventListener('touchstart', this.boundTouchHandler, { passive: false });
  }

  resetHUD() {
    document.getElementById('aim-time').textContent = '30.0s';
    document.getElementById('aim-score').textContent = '0';
    document.getElementById('aim-acc').textContent = '100%';
    document.getElementById('aim-reaction').textContent = '-- ms';
    document.getElementById('aim-combo-badge').style.display = 'none';
  }

  startGame() {
    this.isPlaying = true;
    this.timeLeft = 30;
    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.reactionTimes = [];
    this.combo = 0;
    this.maxCombo = 0;
    this.targets = [];
    this.particles = [];
    this.lastSpawnTime = performance.now();

    document.getElementById('aim-overlay').style.display = 'none';
    document.getElementById('aim-summary-grid').style.display = 'none';

    // Spawn 2 targets initially
    this.spawnTarget();
    this.spawnTarget();

    // Start 30s countdown
    if (this.timerInterval) clearInterval(this.timerInterval);
    const startTimestamp = performance.now();
    this.timerInterval = setInterval(() => {
      const elapsed = (performance.now() - startTimestamp) / 1000;
      this.timeLeft = Math.max(0, 30 - elapsed);
      const timeEl = document.getElementById('aim-time');
      if (timeEl) timeEl.textContent = `${this.timeLeft.toFixed(1)}s`;

      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 100);

    // Animation frame loop
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    const loop = (now) => {
      if (this.isPlaying) {
        this.update(now);
        this.draw();
        this.animFrameId = requestAnimationFrame(loop);
      }
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  spawnTarget() {
    const margin = 50;
    const x = margin + Math.random() * (this.width - margin * 2);
    const y = margin + Math.random() * (this.height - margin * 2);

    const rand = Math.random();
    let type = 'normal'; // standard
    let radius = 28;
    let lifetime = 1800; // ms to shrink
    let points = 100;
    let vx = 0;
    let vy = 0;

    if (rand < 0.15) {
      // Golden bonus
      type = 'gold';
      radius = 24;
      lifetime = 1200;
      points = 300;
    } else if (rand < 0.35) {
      // Moving target
      type = 'moving';
      radius = 26;
      lifetime = 2400;
      points = 200;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 1.5;
      vx = Math.cos(angle) * speed;
      vy = Math.sin(angle) * speed;
    } else if (rand < 0.48) {
      // Decoy Hazard
      type = 'hazard';
      radius = 30;
      lifetime = 2200;
      points = -150;
    }

    this.targets.push({
      id: this.nextTargetId++,
      x,
      y,
      vx,
      vy,
      baseRadius: radius,
      currentRadius: radius,
      type,
      points,
      spawnTime: performance.now(),
      lifetime
    });
  }

  update(now) {
    // Dynamic spawn rate (spawns faster as time runs down)
    const currentSpawnRate = Math.max(450, 750 - (30 - this.timeLeft) * 10);
    if (now - this.lastSpawnTime > currentSpawnRate && this.targets.length < 5) {
      this.spawnTarget();
      this.lastSpawnTime = now;
    }

    // Update targets
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const age = now - t.spawnTime;

      // Handle lifetime / shrink
      const progress = age / t.lifetime;
      if (progress >= 1) {
        // Expired target!
        if (t.type !== 'hazard') {
          // Missing a real target breaks combo
          this.misses++;
          this.combo = 0;
          this.updateHUD();
        }
        this.targets.splice(i, 1);
        continue;
      }

      // Moving target physics
      if (t.type === 'moving') {
        t.x += t.vx;
        t.y += t.vy;
        if (t.x < 30 || t.x > this.width - 30) t.vx *= -1;
        if (t.y < 30 || t.y > this.height - 30) t.vy *= -1;
      }

      t.currentRadius = t.baseRadius * (1 - progress * 0.4);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  handleClick(e) {
    if (!this.isPlaying) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    this.processShot(clickX, clickY);
  }

  handleTouch(e) {
    if (!this.isPlaying) return;
    e.preventDefault();
    const touch = e.touches[0] || e.changedTouches[0];
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const clickX = (touch.clientX - rect.left) * scaleX;
    const clickY = (touch.clientY - rect.top) * scaleY;

    this.processShot(clickX, clickY);
  }

  processShot(x, y) {
    let hitIndex = -1;
    let hitTarget = null;

    // Check hit against targets (topmost first)
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const dist = Math.hypot(x - t.x, y - t.y);
      if (dist <= t.currentRadius + 6) {
        hitIndex = i;
        hitTarget = t;
        break;
      }
    }

    if (hitTarget) {
      const reactionMs = performance.now() - hitTarget.spawnTime;
      this.targets.splice(hitIndex, 1);

      if (hitTarget.type === 'hazard') {
        // Hit skull decoy!
        this.score = Math.max(0, this.score + hitTarget.points);
        this.combo = 0;
        this.misses++;
        window.audioEngine.miss();
        this.createHitEffect(hitTarget.x, hitTarget.y, '#ef4444', 20);
      } else {
        // Successful hit
        this.hits++;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.reactionTimes.push(reactionMs);

        // Combo multiplier (x1 to x4)
        const mult = Math.min(4, 1 + Math.floor(this.combo / 5));
        const ptsEarned = hitTarget.points * mult;
        this.score += ptsEarned;

        window.audioEngine.hit();
        const colorMap = {
          normal: '#00ffcc',
          gold: '#ffd700',
          moving: '#3b82f6'
        };
        this.createHitEffect(hitTarget.x, hitTarget.y, colorMap[hitTarget.type] || '#00ffcc', 16);
      }
    } else {
      // Clicked blank space: Miss!
      this.misses++;
      this.combo = 0;
      window.audioEngine.miss();
      this.createBlankClickEffect(x, y);
    }

    this.updateHUD();
  }

  createHitEffect(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 2 + Math.random() * 3,
        alpha: 1,
        decay: 0.04 + Math.random() * 0.03
      });
    }
  }

  createBlankClickEffect(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#64748b',
        radius: 1.5,
        alpha: 0.8,
        decay: 0.06
      });
    }
  }

  updateHUD() {
    const totalShots = this.hits + this.misses;
    const accuracy = totalShots > 0 ? Math.round((this.hits / totalShots) * 100) : 100;
    const avgReaction = this.reactionTimes.length > 0
      ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length)
      : null;

    document.getElementById('aim-score').textContent = this.score;
    document.getElementById('aim-acc').textContent = `${accuracy}%`;
    document.getElementById('aim-reaction').textContent = avgReaction ? `${avgReaction} ms` : '-- ms';

    const comboBadge = document.getElementById('aim-combo-badge');
    const comboText = document.getElementById('aim-combo-text');
    if (this.combo >= 3) {
      comboBadge.style.display = 'flex';
      const mult = Math.min(4, 1 + Math.floor(this.combo / 5));
      comboText.textContent = `x${mult} (${this.combo} STREAK 🔥)`;
    } else {
      comboBadge.style.display = 'none';
    }
  }

  endGame() {
    this.isPlaying = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;

    const totalShots = this.hits + this.misses;
    const accuracy = totalShots > 0 ? Math.round((this.hits / totalShots) * 100) : 0;
    const avgReaction = this.reactionTimes.length > 0
      ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length)
      : 0;

    // Calculate Rank
    let rank = 'C';
    if (this.score >= 1800 && accuracy >= 90) rank = 'S+';
    else if (this.score >= 1400 && accuracy >= 80) rank = 'S';
    else if (this.score >= 1000 && accuracy >= 70) rank = 'A';
    else if (this.score >= 600) rank = 'B';

    window.storageManager.setAimScore(this.score, accuracy, avgReaction);
    window.audioEngine.win();

    // Show summary overlay
    const overlay = document.getElementById('aim-overlay');
    const title = document.getElementById('aim-overlay-title');
    const desc = document.getElementById('aim-overlay-desc');
    const summaryGrid = document.getElementById('aim-summary-grid');
    const startBtn = document.getElementById('aim-start-btn');

    title.textContent = 'SESSION COMPLETE!';
    desc.textContent = `Great reflexes! Check your breakdown below:`;
    summaryGrid.style.display = 'grid';

    document.getElementById('summary-score').textContent = this.score;
    document.getElementById('summary-acc').textContent = `${accuracy}%`;
    document.getElementById('summary-react').textContent = `${avgReaction} ms`;
    const rankEl = document.getElementById('summary-rank');
    rankEl.textContent = rank;
    rankEl.className = `summary-value rank-badge rank-${rank.replace('+', '-plus')}`;

    startBtn.textContent = 'DRILL AGAIN';
    overlay.style.display = 'flex';
  }

  draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Crosshair grid background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Center arena target reticle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Targets
    this.targets.forEach((t) => {
      ctx.save();
      const r = Math.max(4, t.currentRadius);

      if (t.type === 'normal') {
        // Outer glow ring
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Inner bullseye
        ctx.fillStyle = '#00ffcc';
        ctx.beginPath();
        ctx.arc(t.x, t.y, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (t.type === 'gold') {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.arc(t.x, t.y, r * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+300', t.x, t.y);
      } else if (t.type === 'moving') {
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Motion trail indicator
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
        ctx.beginPath();
        ctx.moveTo(t.x - t.vx * 10, t.y - t.vy * 10);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(t.x, t.y, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (t.type === 'hazard') {
        // Skull Hazard
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💀', t.x, t.y);
      }

      ctx.restore();
    });

    // Draw Particles
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  destroy() {
    this.isPlaying = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.canvas.removeEventListener('mousedown', this.boundClickHandler);
    this.canvas.removeEventListener('touchstart', this.boundTouchHandler);
    this.container.innerHTML = '';
  }
}

window.AimTrainerGame = AimTrainerGame;

