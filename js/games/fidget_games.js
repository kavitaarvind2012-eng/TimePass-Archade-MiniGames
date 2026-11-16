/**
 * TimePass Arcade - New Chill / Fidget Games Pack (7 Games)
 * 1. RPS Lizard Spock
 * 2. Dice & Coin Fidget (D6, D20, Coin Flip)
 * 3. Lucky Slot Spinner
 * 4. Bouncing Logo Corner Watch
 * 5. Pegboard Plinko
 * 6. Energy Core Clicker
 * 7. Zen Stone Balancer
 */

// ============================================================================
// 1. ROCK PAPER SCISSORS LIZARD SPOCK (Chill / Fidget)
// ============================================================================
class RPSLSGame {
  constructor(container) {
    this.container = container;
    this.choices = ['rock', 'paper', 'scissors', 'lizard', 'spock'];
    this.rules = {
      scissors: { paper: 'cuts', lizard: 'decapitates' },
      paper: { rock: 'covers', spock: 'disproves' },
      rock: { lizard: 'crushes', scissors: 'crushes' },
      lizard: { spock: 'poisons', paper: 'eats' },
      spock: { scissors: 'smashes', rock: 'vaporizes' }
    };
    this.icons = { rock: '✊', paper: '✋', scissors: '✌️', lizard: '🦎', spock: '🖖' };
    this.streak = 0;
    this.best = window.storageManager.getHighScore('rpsls', 0);

    this.renderDOM();
    this.bindEvents();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper rpsls-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">WIN STREAK</span><span class="hud-val" id="rps-streak">0 🔥</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.best}</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="rps-reset">🔄</button></div>
        </div>
        <div class="rpsls-arena">
          <div class="rps-duel">
            <div class="rps-slot" id="rps-player">❓<span class="rps-name">YOU</span></div>
            <div class="rps-vs">VS</div>
            <div class="rps-slot" id="rps-ai">❓<span class="rps-name">AI</span></div>
          </div>
          <div class="rps-result-text" id="rps-result">Make your play below!</div>
        </div>
        <div class="rps-choices">
          <button class="rps-btn" data-choice="rock">✊ Rock</button>
          <button class="rps-btn" data-choice="paper">✋ Paper</button>
          <button class="rps-btn" data-choice="scissors">✌️ Scissors</button>
          <button class="rps-btn" data-choice="lizard">🦎 Lizard</button>
          <button class="rps-btn" data-choice="spock">🖖 Spock</button>
        </div>
        <div class="game-controls-hint"><span>Scissors cuts Paper, Paper covers Rock, Rock crushes Lizard, Lizard poisons Spock, Spock smashes Scissors...</span></div>
      </div>
    `;
  }

  bindEvents() {
    this.container.querySelectorAll('.rps-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const playerChoice = btn.getAttribute('data-choice');
        this.play(playerChoice);
      });
    });
    document.getElementById('rps-reset').addEventListener('click', () => {
      this.streak = 0;
      document.getElementById('rps-streak').textContent = '0 🔥';
      document.getElementById('rps-result').textContent = 'Make your play below!';
      document.getElementById('rps-player').firstChild.textContent = '❓';
      document.getElementById('rps-ai').firstChild.textContent = '❓';
    });
  }

  play(player) {
    const ai = this.choices[Math.floor(Math.random() * this.choices.length)];
    document.getElementById('rps-player').firstChild.textContent = this.icons[player];
    document.getElementById('rps-ai').firstChild.textContent = this.icons[ai];

    const resultEl = document.getElementById('rps-result');

    if (player === ai) {
      resultEl.textContent = `TIE! Both chose ${player.toUpperCase()}.`;
      window.audioEngine.paddle();
    } else if (this.rules[player] && this.rules[player][ai]) {
      const verb = this.rules[player][ai];
      this.streak++;
      resultEl.textContent = `VICTORY! ${player.toUpperCase()} ${verb} ${ai.toUpperCase()}.`;
      window.audioEngine.win();
      if (this.streak >= 3) window.storageManager.unlock('rps_spock');
      window.storageManager.setGameScore('rpsls', this.streak);
    } else {
      const verb = this.rules[ai][player];
      this.streak = 0;
      resultEl.textContent = `DEFEAT! ${ai.toUpperCase()} ${verb} ${player.toUpperCase()}.`;
      window.audioEngine.gameOver();
    }
    document.getElementById('rps-streak').textContent = `${this.streak} 🔥`;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
window.RPSLSGame = RPSLSGame;

// ============================================================================
// 2. DICE & COIN FIDGET (Chill / Fidget)
// ============================================================================
class DiceCoinGame {
  constructor(container) {
    this.container = container;
    this.rollHistory = [];
    this.renderDOM();
    this.bindEvents();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper dice-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">LAST ACTION</span><span class="hud-val" id="dice-last">Ready</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="dice-clear">🔄</button></div>
        </div>
        <div class="dice-arena">
          <div class="dice-box" id="dice-d6">
            <div class="dice-face" id="d6-face">🎲 6</div>
            <button class="btn btn-primary" id="btn-roll-d6">Roll D6</button>
          </div>
          <div class="dice-box" id="dice-d20">
            <div class="dice-face" id="d20-face">🛡️ 20</div>
            <button class="btn btn-secondary" id="btn-roll-d20">Roll D20</button>
          </div>
          <div class="dice-box" id="dice-coin">
            <div class="dice-face coin-face" id="coin-face">🪙 HEADS</div>
            <button class="btn btn-accent" id="btn-flip-coin">Flip Coin</button>
          </div>
        </div>
        <div class="dice-log" id="dice-log"></div>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('btn-roll-d6').addEventListener('click', () => this.rollD6());
    document.getElementById('btn-roll-d20').addEventListener('click', () => this.rollD20());
    document.getElementById('btn-flip-coin').addEventListener('click', () => this.flipCoin());
    document.getElementById('dice-clear').addEventListener('click', () => {
      this.rollHistory = [];
      document.getElementById('dice-log').innerHTML = '';
    });
  }

  rollD6() {
    const res = Math.floor(Math.random() * 6) + 1;
    window.audioEngine.click('blue');
    const face = document.getElementById('d6-face');
    face.classList.add('rolling');
    setTimeout(() => {
      face.classList.remove('rolling');
      face.textContent = `🎲 ${res}`;
      this.logAction(`Rolled D6: ${res}`);
    }, 250);
  }

  rollD20() {
    const res = Math.floor(Math.random() * 20) + 1;
    window.audioEngine.click('red');
    const face = document.getElementById('d20-face');
    face.classList.add('rolling');
    setTimeout(() => {
      face.classList.remove('rolling');
      face.textContent = `🛡️ ${res}`;
      if (res === 20) {
        window.audioEngine.win();
        window.storageManager.unlock('dice_d20');
        this.logAction(`CRITICAL NATURAL 20! 🌟`);
      } else {
        this.logAction(`Rolled D20: ${res}`);
      }
    }, 250);
  }

  flipCoin() {
    const isHeads = Math.random() < 0.5;
    window.audioEngine.coin();
    const face = document.getElementById('coin-face');
    face.classList.add('flipping');
    setTimeout(() => {
      face.classList.remove('flipping');
      face.textContent = isHeads ? '🪙 HEADS' : '🪙 TAILS';
      this.logAction(`Flipped: ${isHeads ? 'HEADS' : 'TAILS'}`);
    }, 300);
  }

  logAction(text) {
    document.getElementById('dice-last').textContent = text;
    const log = document.getElementById('dice-log');
    const entry = document.createElement('div');
    entry.className = 'dice-log-entry';
    entry.textContent = text;
    log.prepend(entry);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
window.DiceCoinGame = DiceCoinGame;

// ============================================================================
// 3. LUCKY SLOT SPINNER (Chill / Fidget)
// ============================================================================
class SlotSpinnerGame {
  constructor(container) {
    this.container = container;
    this.symbols = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
    this.reels = ['7️⃣', '7️⃣', '7️⃣'];
    this.coins = 500;
    this.bet = 25;
    this.isSpinning = false;

    this.renderDOM();
    this.bindEvents();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper slot-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">COINS</span><span class="hud-val" id="slot-coins">500</span></div>
          <div class="hud-item"><span class="hud-label">BET</span><span class="hud-val">25</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="slot-refill">🪙 +250</button></div>
        </div>
        <div class="slot-machine">
          <div class="slot-reels">
            <div class="slot-reel" id="reel-0">7️⃣</div>
            <div class="slot-reel" id="reel-1">7️⃣</div>
            <div class="slot-reel" id="reel-2">7️⃣</div>
          </div>
          <button class="btn btn-primary btn-lg slot-spin-btn" id="slot-spin">🎰 PULL LEVER</button>
          <div class="slot-msg" id="slot-msg">Line up 3 matching icons to win!</div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('slot-spin').addEventListener('click', () => this.spin());
    document.getElementById('slot-refill').addEventListener('click', () => {
      this.coins += 250;
      document.getElementById('slot-coins').textContent = this.coins;
      window.audioEngine.coin();
    });
  }

  spin() {
    if (this.isSpinning || this.coins < this.bet) return;
    this.isSpinning = true;
    this.coins -= this.bet;
    document.getElementById('slot-coins').textContent = this.coins;
    window.audioEngine.paddle();

    const reelEls = [document.getElementById('reel-0'), document.getElementById('reel-1'), document.getElementById('reel-2')];
    reelEls.forEach((r) => r.classList.add('blur-spin'));

    let count = 0;
    const interval = setInterval(() => {
      reelEls.forEach((r) => {
        r.textContent = this.symbols[Math.floor(Math.random() * this.symbols.length)];
      });
      count++;
      if (count > 14) {
        clearInterval(interval);
        reelEls.forEach((r) => r.classList.remove('blur-spin'));

        this.reels = [
          this.symbols[Math.floor(Math.random() * this.symbols.length)],
          this.symbols[Math.floor(Math.random() * this.symbols.length)],
          this.symbols[Math.floor(Math.random() * this.symbols.length)]
        ];
        reelEls[0].textContent = this.reels[0];
        reelEls[1].textContent = this.reels[1];
        reelEls[2].textContent = this.reels[2];

        this.evaluate();
        this.isSpinning = false;
      }
    }, 90);
  }

  evaluate() {
    const msg = document.getElementById('slot-msg');
    if (this.reels[0] === this.reels[1] && this.reels[1] === this.reels[2]) {
      // Jackpot!
      let payout = 500;
      if (this.reels[0] === '7️⃣') payout = 1500;
      this.coins += payout;
      window.audioEngine.win();
      window.storageManager.unlock('slot_jackpot');
      msg.textContent = `JACKPOT! Won +${payout} coins! 🎉`;
    } else if (this.reels[0] === this.reels[1] || this.reels[1] === this.reels[2] || this.reels[0] === this.reels[2]) {
      this.coins += 50;
      window.audioEngine.coin();
      msg.textContent = `Pair match! Won +50 coins.`;
    } else {
      msg.textContent = `No match. Spin again!`;
      window.audioEngine.paddle();
    }
    document.getElementById('slot-coins').textContent = this.coins;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
window.SlotSpinnerGame = SlotSpinnerGame;

// ============================================================================
// 4. BOUNCING LOGO CORNER WATCH (Chill / Fidget)
// ============================================================================
class BouncingLogoGame {
  constructor(container) {
    this.container = container;
    this.width = 540;
    this.height = 360;
    this.logo = { x: 100, y: 100, w: 80, h: 42, vx: 3.5, vy: 3 };
    this.colors = ['#00ffcc', '#3b82f6', '#f43f5e', '#ffd700', '#a855f7', '#10b981'];
    this.colorIdx = 0;
    this.cornerHits = 0;
    this.wallBounces = 0;
    this.animId = null;

    this.renderDOM();
    this.bindEvents();
    this.startLoop();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper dvd-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">CORNER HITS</span><span class="hud-val hud-accent" id="dvd-corners">0</span></div>
          <div class="hud-item"><span class="hud-label">BOUNCES</span><span class="hud-val" id="dvd-bounces">0</span></div>
          <div class="hud-actions">
            <button class="btn btn-sm btn-secondary" id="dvd-spd-up">⚡ Faster</button>
            <button class="btn btn-sm btn-icon" id="dvd-reset">🔄</button>
          </div>
        </div>
        <canvas id="dvd-canvas" width="540" height="360"></canvas>
        <div class="game-controls-hint"><span>Will it hit the corner? Relax and watch the iconic bounce!</span></div>
      </div>
    `;
    this.canvas = document.getElementById('dvd-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    document.getElementById('dvd-spd-up').addEventListener('click', () => {
      this.logo.vx *= 1.35;
      this.logo.vy *= 1.35;
    });
    document.getElementById('dvd-reset').addEventListener('click', () => {
      this.logo.x = 100;
      this.logo.y = 100;
      this.logo.vx = 3.5;
      this.logo.vy = 3;
    });
  }

  startLoop() {
    const loop = () => {
      this.logo.x += this.logo.vx;
      this.logo.y += this.logo.vy;

      let hitX = false, hitY = false;
      if (this.logo.x <= 0) { this.logo.x = 0; this.logo.vx *= -1; hitX = true; }
      else if (this.logo.x + this.logo.w >= this.width) { this.logo.x = this.width - this.logo.w; this.logo.vx *= -1; hitX = true; }

      if (this.logo.y <= 0) { this.logo.y = 0; this.logo.vy *= -1; hitY = true; }
      else if (this.logo.y + this.logo.h >= this.height) { this.logo.y = this.height - this.logo.h; this.logo.vy *= -1; hitY = true; }

      if (hitX && hitY) {
        // EXACT CORNER HIT!
        this.cornerHits++;
        document.getElementById('dvd-corners').textContent = this.cornerHits;
        window.audioEngine.win();
        window.storageManager.unlock('corner_hit');
      } else if (hitX || hitY) {
        this.wallBounces++;
        document.getElementById('dvd-bounces').textContent = this.wallBounces;
        this.colorIdx = (this.colorIdx + 1) % this.colors.length;
        window.audioEngine.paddle();
      }

      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = this.colors[this.colorIdx];
    ctx.shadowColor = this.colors[this.colorIdx];
    ctx.shadowBlur = 12;
    ctx.fillRect(this.logo.x, this.logo.y, this.logo.w, this.logo.h);

    ctx.fillStyle = '#060911';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TIMEPASS', this.logo.x + this.logo.w / 2, this.logo.y + this.logo.h / 2 + 5);
    ctx.shadowBlur = 0;
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.container.innerHTML = '';
  }
}
window.BouncingLogoGame = BouncingLogoGame;

// ============================================================================
// 5. PEGBOARD PLINKO (Chill / Fidget)
// ============================================================================
class PlinkoGame {
  constructor(container) {
    this.container = container;
    this.width = 460;
    this.height = 500;
    this.pegs = [];
    this.balls = [];
    this.buckets = [0.2, 0.5, 1.5, 3, 10, 3, 1.5, 0.5, 0.2];
    this.coins = 200;
    this.animId = null;

    this.renderDOM();
    this.initPegs();
    this.bindEvents();
    this.startLoop();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper plinko-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">COINS</span><span class="hud-val" id="plinko-coins">200</span></div>
          <div class="hud-actions"><button class="btn btn-primary" id="plinko-drop">DROP BALL (10🪙)</button></div>
        </div>
        <canvas id="plinko-canvas" width="460" height="500"></canvas>
      </div>
    `;
    this.canvas = document.getElementById('plinko-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  initPegs() {
    this.pegs = [];
    const rows = 8;
    for (let r = 0; r < rows; r++) {
      const count = r + 3;
      const spacing = this.width / (count + 1);
      for (let c = 0; c < count; c++) {
        this.pegs.push({ x: spacing * (c + 1), y: 70 + r * 45, radius: 4 });
      }
    }
  }

  bindEvents() {
    document.getElementById('plinko-drop').addEventListener('click', () => this.dropBall());
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.width / rect.width);
      this.dropBall(x);
    });
  }

  dropBall(x = null) {
    if (this.coins < 10) return;
    this.coins -= 10;
    document.getElementById('plinko-coins').textContent = this.coins;
    this.balls.push({
      x: x !== null ? x : this.width / 2 + (Math.random() - 0.5) * 40,
      y: 20,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 1,
      radius: 6
    });
    window.audioEngine.paddle();
  }

  startLoop() {
    const loop = () => {
      for (let i = this.balls.length - 1; i >= 0; i--) {
        const b = this.balls[i];
        b.vy += 0.22;
        b.x += b.vx;
        b.y += b.vy;

        // Peg collision
        this.pegs.forEach((p) => {
          const dist = Math.hypot(b.x - p.x, b.y - p.y);
          if (dist < b.radius + p.radius) {
            const angle = Math.atan2(b.y - p.y, b.x - p.x);
            b.vx = Math.cos(angle) * 2.5 + (Math.random() - 0.5);
            b.vy = Math.abs(Math.sin(angle) * 2.5);
            window.audioEngine.plink();
          }
        });

        // Floor / Buckets
        if (b.y > this.height - 40) {
          const bucketW = this.width / this.buckets.length;
          const bucketIdx = Math.max(0, Math.min(this.buckets.length - 1, Math.floor(b.x / bucketW)));
          const mult = this.buckets[bucketIdx];
          const won = Math.round(10 * mult);
          this.coins += won;
          document.getElementById('plinko-coins').textContent = this.coins;

          if (mult === 10) {
            window.audioEngine.win();
            window.storageManager.unlock('plinko_jackpot');
          } else {
            window.audioEngine.coin();
          }
          this.balls.splice(i, 1);
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

    // Pegs
    ctx.fillStyle = '#ffd700';
    this.pegs.forEach((p) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    });

    // Buckets
    const bucketW = this.width / this.buckets.length;
    this.buckets.forEach((m, idx) => {
      ctx.fillStyle = m >= 3 ? 'rgba(0,255,204,0.15)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(idx * bucketW + 2, this.height - 35, bucketW - 4, 30);
      ctx.fillStyle = m >= 3 ? '#00ffcc' : '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${m}x`, idx * bucketW + bucketW / 2, this.height - 15);
    });

    // Balls
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 8;
    this.balls.forEach((b) => {
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.container.innerHTML = '';
  }
}
window.PlinkoGame = PlinkoGame;

// ============================================================================
// 6. ENERGY CORE CLICKER (Chill / Fidget)
// ============================================================================
class CoreClickerGame {
  constructor(container) {
    this.container = container;
    this.watts = 0;
    this.wps = 0;
    this.clickPower = 1;
    this.upgrades = [
      { name: 'Auto-Sparks', cost: 15, wps: 1, owned: 0 },
      { name: 'Plasma Coil', cost: 80, wps: 6, owned: 0 },
      { name: 'Fusion Dynamo', cost: 350, wps: 28, owned: 0 },
      { name: 'Quantum Core', cost: 1500, wps: 140, owned: 0 }
    ];
    this.timer = null;

    this.renderDOM();
    this.bindEvents();
    this.startLoop();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper clicker-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">ENERGY</span><span class="hud-val" id="clicker-watts">0 W</span></div>
          <div class="hud-item"><span class="hud-label">OUTPUT</span><span class="hud-val" id="clicker-wps">0 W/s</span></div>
        </div>
        <div class="clicker-layout">
          <div class="clicker-core-wrap">
            <button class="core-reactor-btn" id="core-btn">⚡</button>
          </div>
          <div class="clicker-store" id="clicker-store"></div>
        </div>
      </div>
    `;
    this.renderStore();
  }

  renderStore() {
    const store = document.getElementById('clicker-store');
    store.innerHTML = '';
    this.upgrades.forEach((upg, idx) => {
      const btn = document.createElement('button');
      btn.className = `btn btn-secondary store-item ${this.watts < upg.cost ? 'disabled' : ''}`;
      btn.innerHTML = `<span class="upg-title">${upg.name} (${upg.owned})</span> <span class="upg-cost">${upg.cost} W (+${upg.wps} W/s)</span>`;
      btn.addEventListener('click', () => this.buyUpgrade(idx));
      store.appendChild(btn);
    });
  }

  bindEvents() {
    document.getElementById('core-btn').addEventListener('click', (e) => {
      this.watts += this.clickPower;
      window.audioEngine.click('blue');
      document.getElementById('clicker-watts').textContent = `${Math.floor(this.watts)} W`;
      this.renderStore();
    });
  }

  buyUpgrade(idx) {
    const upg = this.upgrades[idx];
    if (this.watts >= upg.cost) {
      this.watts -= upg.cost;
      upg.owned++;
      this.wps += upg.wps;
      upg.cost = Math.round(upg.cost * 1.25);
      window.audioEngine.coin();
      document.getElementById('clicker-wps').textContent = `${this.wps} W/s`;
      this.renderStore();
    }
  }

  startLoop() {
    this.timer = setInterval(() => {
      if (this.wps > 0) {
        this.watts += this.wps / 10;
        document.getElementById('clicker-watts').textContent = `${Math.floor(this.watts)} W`;
      }
    }, 100);
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    this.container.innerHTML = '';
  }
}
window.CoreClickerGame = CoreClickerGame;

// ============================================================================
// 7. ZEN STONE BALANCER (Chill / Fidget)
// ============================================================================
class StoneBalancerGame {
  constructor(container) {
    this.container = container;
    this.width = 440;
    this.height = 480;
    this.stones = [{ x: 170, y: 440, w: 100, h: 22, color: '#64748b' }];
    this.currentStone = { x: 180, y: 80, w: 90, h: 22, vx: 2 };
    this.score = 0;
    this.isOver = false;
    this.animId = null;

    this.renderDOM();
    this.bindEvents();
    this.startLoop();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper stone-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">STACK HEIGHT</span><span class="hud-val" id="stone-score">0</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="stone-reset">🔄</button></div>
        </div>
        <canvas id="stone-canvas" width="440" height="480"></canvas>
        <div class="game-controls-hint"><span>Tap or Click to release the stone. Keep the center of gravity balanced!</span></div>
      </div>
    `;
    this.canvas = document.getElementById('stone-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    this.boundDrop = () => {
      if (this.isOver) { this.reset(); return; }
      this.dropStone();
    };
    this.canvas.addEventListener('click', this.boundDrop);
    document.getElementById('stone-reset').addEventListener('click', () => this.reset());
  }

  reset() {
    this.stones = [{ x: 170, y: 440, w: 100, h: 22, color: '#64748b' }];
    this.score = 0;
    this.isOver = false;
    this.spawnStone();
    document.getElementById('stone-score').textContent = '0';
  }

  spawnStone() {
    const colors = ['#94a3b8', '#a8a29e', '#78716c', '#64748b', '#475569'];
    this.currentStone = {
      x: 40 + Math.random() * 200,
      y: 70,
      w: Math.max(50, 95 - this.score * 3),
      h: 22,
      vx: (Math.random() > 0.5 ? 2.5 : -2.5),
      color: colors[this.score % colors.length]
    };
  }

  dropStone() {
    const prev = this.stones[this.stones.length - 1];
    const curr = this.currentStone;
    const centerPrev = prev.x + prev.w / 2;
    const centerCurr = curr.x + curr.w / 2;

    if (Math.abs(centerPrev - centerCurr) > prev.w / 2) {
      this.isOver = true;
      window.audioEngine.gameOver();
      return;
    }

    curr.y = prev.y - 24;
    this.stones.push(curr);
    this.score++;
    window.audioEngine.paddle();
    document.getElementById('stone-score').textContent = this.score;

    if (curr.y < 160) {
      this.stones.forEach((s) => s.y += 24);
    }
    this.spawnStone();
  }

  startLoop() {
    const loop = () => {
      if (!this.isOver && this.currentStone) {
        this.currentStone.x += this.currentStone.vx;
        if (this.currentStone.x + this.currentStone.w >= this.width) {
          this.currentStone.x = this.width - this.currentStone.w;
          this.currentStone.vx *= -1;
        } else if (this.currentStone.x <= 0) {
          this.currentStone.x = 0;
          this.currentStone.vx *= -1;
        }
      }
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#070b12';
    ctx.fillRect(0, 0, this.width, this.height);

    // Stacked stones
    this.stones.forEach((s) => {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.roundRect(s.x, s.y, s.w, s.h, 10);
      ctx.fill();
    });

    // Falling / Swaying stone
    if (this.currentStone && !this.isOver) {
      ctx.fillStyle = this.currentStone.color;
      ctx.beginPath();
      ctx.roundRect(this.currentStone.x, this.currentStone.y, this.currentStone.w, this.currentStone.h, 10);
      ctx.fill();
    }

    if (this.isOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STONES TOPPLED! CLICK TO RETRY', this.width / 2, this.height / 2);
    }
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.canvas.removeEventListener('click', this.boundDrop);
    this.container.innerHTML = '';
  }
}
window.StoneBalancerGame = StoneBalancerGame;

