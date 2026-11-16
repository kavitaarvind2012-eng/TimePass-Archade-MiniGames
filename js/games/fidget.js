/**
 * Infinite Bubble Wrap & Fidget Board
 * Features:
 * 1. Popping bubble wrap with pitch-varied synthesized audio and infinite regen
 * 2. Mechanical keyboard switch grid with Blue/Red/Brown switch acoustics and RGB lighting
 * 3. Zen Sand & Particle Physics simulation with multi-mode fluid/gravitational interaction
 */
class FidgetGame {
  constructor(container) {
    this.container = container;
    this.activeTab = 'bubble'; // 'bubble', 'switch', 'zen'
    this.bubbleInfiniteRegen = true;
    this.bubblesPoppedSession = 0;

    // Switch state
    this.switchType = 'blue';
    this.rgbMode = 'ripple';
    this.keysClickedSession = 0;

    // Zen Sand canvas state
    this.zenCanvas = null;
    this.zenCtx = null;
    this.zenParticles = [];
    this.zenInteractionMode = 'vortex'; // 'attract', 'vortex', 'repel', 'stream'
    this.zenTheme = 'cyber'; // 'cyber', 'aurora', 'sunset', 'cosmos'
    this.zenAnimId = null;
    this.mouse = { x: -1000, y: -1000, isDown: false };

    this.boundKeyDown = this.handleKeyDown.bind(this);

    this.renderDOM();
    this.initActiveTab();
    this.bindEvents();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper fidget-wrapper">
        <div class="fidget-nav-bar">
          <button class="fidget-tab-btn active" data-tab="bubble">🫧 Bubble Wrap</button>
          <button class="fidget-tab-btn" data-tab="switch">⌨️ Mechanical Switches</button>
          <button class="fidget-tab-btn" data-tab="zen">🪐 Zen Sand Canvas</button>
        </div>

        <!-- PANEL 1: BUBBLE WRAP -->
        <div class="fidget-panel" id="panel-bubble">
          <div class="fidget-toolbar">
            <div class="fidget-stat">
              <span class="stat-label">POPPED:</span>
              <span class="stat-val" id="bubble-count-val">0</span>
            </div>
            <div class="fidget-actions">
              <label class="toggle-control">
                <input type="checkbox" id="bubble-infinite-toggle" checked />
                <span>Auto-Refill (Infinite)</span>
              </label>
              <button class="btn btn-sm btn-secondary" id="bubble-pop-all-btn">⚡ Pop All!</button>
              <button class="btn btn-sm btn-secondary" id="bubble-fresh-btn">🔄 Fresh Sheet</button>
            </div>
          </div>
          <div class="bubble-sheet-container" id="bubble-sheet-container">
            <div class="bubble-grid" id="bubble-grid">
              <!-- 60 bubbles generated -->
            </div>
          </div>
        </div>

        <!-- PANEL 2: MECHANICAL SWITCHES -->
        <div class="fidget-panel" id="panel-switch" style="display: none;">
          <div class="fidget-toolbar">
            <div class="fidget-stat">
              <span class="stat-label">CLICKS:</span>
              <span class="stat-val" id="switch-count-val">0</span>
            </div>
            <div class="switch-type-picker">
              <button class="switch-pill active" data-type="blue">🔵 Blue (Clicky)</button>
              <button class="switch-pill" data-type="red">🔴 Red (Linear)</button>
              <button class="switch-pill" data-type="brown">🟤 Brown (Tactile)</button>
            </div>
            <div class="rgb-picker">
              <span class="toolbar-hint">RGB:</span>
              <select id="switch-rgb-select" class="form-select">
                <option value="ripple">Ripple Waves</option>
                <option value="wave">Cyber Rainbow</option>
                <option value="static">Static Neon</option>
                <option value="off">Underglow Off</option>
              </select>
            </div>
          </div>
          <div class="keyboard-board-container">
            <div class="keyboard-grid" id="keyboard-grid">
              <!-- 16 keys -->
            </div>
          </div>
          <div class="game-controls-hint">
            <span>Click keycaps or type physical keys on your keyboard for realistic mechanical sound & feel!</span>
          </div>
        </div>

        <!-- PANEL 3: ZEN SAND -->
        <div class="fidget-panel" id="panel-zen" style="display: none;">
          <div class="fidget-toolbar zen-toolbar">
            <div class="zen-mode-picker">
              <span class="toolbar-hint">Mode:</span>
              <button class="zen-btn active" data-mode="vortex">🌀 Vortex</button>
              <button class="zen-btn" data-mode="attract">🧲 Attractor</button>
              <button class="zen-btn" data-mode="repel">💥 Repulsor</button>
              <button class="zen-btn" data-mode="stream">✨ Sand Spray</button>
            </div>
            <div class="zen-theme-picker">
              <span class="toolbar-hint">Palette:</span>
              <select id="zen-theme-select" class="form-select">
                <option value="cyber">Cyber Neon</option>
                <option value="aurora">Emerald Aurora</option>
                <option value="sunset">Solar Sunset</option>
                <option value="cosmos">Deep Cosmos</option>
              </select>
            </div>
            <button class="btn btn-sm btn-secondary" id="zen-reset-btn">🔄 Reset Sand</button>
          </div>
          <div class="zen-canvas-container">
            <canvas id="zen-canvas" width="700" height="420"></canvas>
          </div>
          <div class="game-controls-hint">
            <span>Drag cursor or touch to swirl and sculpt the glowing sand particles in real-time.</span>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    window.addEventListener('keydown', this.boundKeyDown);

    // Tab buttons
    this.container.querySelectorAll('.fidget-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.fidget-tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.switchTab(btn.getAttribute('data-tab'));
      });
    });

    // Panel 1: Bubble Wrap events
    document.getElementById('bubble-fresh-btn').addEventListener('click', () => this.generateBubbleSheet());
    document.getElementById('bubble-pop-all-btn').addEventListener('click', () => this.popAllBubbles());
    document.getElementById('bubble-infinite-toggle').addEventListener('change', (e) => {
      this.bubbleInfiniteRegen = e.target.checked;
    });

    // Panel 2: Mechanical Switch events
    this.container.querySelectorAll('.switch-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        this.container.querySelectorAll('.switch-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        this.switchType = pill.getAttribute('data-type');
      });
    });

    const rgbSelect = document.getElementById('switch-rgb-select');
    if (rgbSelect) {
      rgbSelect.addEventListener('change', (e) => {
        this.rgbMode = e.target.value;
        const kb = document.getElementById('keyboard-grid');
        if (kb) kb.className = `keyboard-grid rgb-${this.rgbMode}`;
      });
    }

    // Panel 3: Zen Sand events
    this.container.querySelectorAll('.zen-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.zen-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.zenInteractionMode = btn.getAttribute('data-mode');
      });
    });

    const themeSelect = document.getElementById('zen-theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        this.zenTheme = e.target.value;
        this.updateZenParticleColors();
      });
    }

    const resetZenBtn = document.getElementById('zen-reset-btn');
    if (resetZenBtn) {
      resetZenBtn.addEventListener('click', () => this.initZenParticles());
    }
  }

  switchTab(tab) {
    this.activeTab = tab;
    document.getElementById('panel-bubble').style.display = tab === 'bubble' ? 'flex' : 'none';
    document.getElementById('panel-switch').style.display = tab === 'switch' ? 'flex' : 'none';
    document.getElementById('panel-zen').style.display = tab === 'zen' ? 'flex' : 'none';

    if (tab === 'zen') {
      this.initZenCanvas();
    } else {
      if (this.zenAnimId) {
        cancelAnimationFrame(this.zenAnimId);
        this.zenAnimId = null;
      }
    }

    if (tab === 'switch') {
      this.initKeyboardGrid();
    }
  }

  initActiveTab() {
    this.generateBubbleSheet();
    this.initKeyboardGrid();
  }

  // --- SUB-PANEL 1: BUBBLE WRAP ---
  generateBubbleSheet() {
    const grid = document.getElementById('bubble-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const count = 64; // 8x8 sheet
    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('button');
      bubble.className = 'bubble-cell';
      bubble.setAttribute('type', 'button');
      bubble.setAttribute('aria-label', 'Bubble');

      bubble.addEventListener('click', (e) => this.popBubble(bubble, e));
      bubble.addEventListener('pointerenter', (e) => {
        if (e.buttons === 1) {
          this.popBubble(bubble, e);
        }
      });

      grid.appendChild(bubble);
    }
  }

  popBubble(bubbleEl, event) {
    if (bubbleEl.classList.contains('popped')) return;

    bubbleEl.classList.add('popped');
    this.bubblesPoppedSession++;

    // Randomize pitch for realistic varied pops
    const pitch = 0.85 + Math.random() * 0.35;
    window.audioEngine.pop(pitch);
    window.storageManager.incrementBubbles(1);

    document.getElementById('bubble-count-val').textContent = this.bubblesPoppedSession;

    // Auto-refill if infinite mode enabled
    if (this.bubbleInfiniteRegen) {
      setTimeout(() => {
        if (bubbleEl && bubbleEl.parentElement) {
          bubbleEl.classList.remove('popped');
          bubbleEl.classList.add('refilled');
          setTimeout(() => bubbleEl.classList.remove('refilled'), 300);
        }
      }, 2400 + Math.random() * 800);
    }
  }

  popAllBubbles() {
    const bubbles = Array.from(this.container.querySelectorAll('.bubble-cell:not(.popped)'));
    if (bubbles.length === 0) return;

    bubbles.forEach((b, idx) => {
      setTimeout(() => {
        this.popBubble(b);
      }, idx * 25);
    });
  }

  // --- SUB-PANEL 2: MECHANICAL KEYBOARD SWITCHES ---
  initKeyboardGrid() {
    const grid = document.getElementById('keyboard-grid');
    if (!grid) return;
    grid.innerHTML = '';
    grid.className = `keyboard-grid rgb-${this.rgbMode}`;

    const keys = [
      ['ESC', '1', '2', '3'],
      ['TAB', 'Q', 'W', 'E'],
      ['CAPS', 'A', 'S', 'D'],
      ['SHIFT', 'Z', 'X', 'SPACE']
    ];

    keys.flat().forEach((label, idx) => {
      const keyEl = document.createElement('div');
      keyEl.className = 'mech-key';
      keyEl.setAttribute('data-key', label.toLowerCase());

      keyEl.innerHTML = `
        <div class="key-housing">
          <div class="key-stem stem-${this.switchType}"></div>
          <div class="key-cap">
            <span class="key-label">${label}</span>
          </div>
          <div class="key-led"></div>
        </div>
      `;

      keyEl.addEventListener('mousedown', () => this.pressKey(keyEl));
      keyEl.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.pressKey(keyEl);
      }, { passive: false });

      grid.appendChild(keyEl);
    });
  }

  pressKey(keyEl) {
    if (!keyEl) return;
    keyEl.classList.add('pressed');
    window.audioEngine.click(this.switchType);

    this.keysClickedSession++;
    window.storageManager.incrementKeys(1);
    const counter = document.getElementById('switch-count-val');
    if (counter) counter.textContent = this.keysClickedSession;

    setTimeout(() => {
      keyEl.classList.remove('pressed');
    }, 120);
  }

  handleKeyDown(e) {
    if (this.activeTab !== 'switch') return;
    const pressedChar = e.key.toLowerCase();
    const keyMap = {
      ' ': 'space',
      'escape': 'esc',
      'tab': 'tab',
      'capslock': 'caps',
      'shift': 'shift'
    };
    const targetKey = keyMap[pressedChar] || pressedChar;
    const keyEl = this.container.querySelector(`.mech-key[data-key="${targetKey}"]`);
    if (keyEl) {
      e.preventDefault();
      this.pressKey(keyEl);
    }
  }

  // --- SUB-PANEL 3: ZEN SAND / PARTICLE SIMULATION ---
  initZenCanvas() {
    this.zenCanvas = document.getElementById('zen-canvas');
    if (!this.zenCanvas) return;
    this.zenCtx = this.zenCanvas.getContext('2d');

    this.initZenParticles();

    // Mouse / Touch handlers for sand
    const updateMousePos = (e) => {
      const rect = this.zenCanvas.getBoundingClientRect();
      const scaleX = this.zenCanvas.width / rect.width;
      const scaleY = this.zenCanvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    };

    this.zenCanvas.onmousemove = (e) => {
      updateMousePos(e);
      if (this.zenInteractionMode === 'stream' && this.mouse.isDown) {
        this.spawnStreamParticles(this.mouse.x, this.mouse.y);
      }
    };

    this.zenCanvas.onmousedown = (e) => {
      this.mouse.isDown = true;
      updateMousePos(e);
      if (this.zenInteractionMode === 'stream') {
        this.spawnStreamParticles(this.mouse.x, this.mouse.y);
      }
    };

    window.onmouseup = () => {
      this.mouse.isDown = false;
    };

    this.zenCanvas.ontouchstart = (e) => {
      if (e.touches.length > 0) {
        this.mouse.isDown = true;
        updateMousePos(e.touches[0]);
      }
    };

    this.zenCanvas.ontouchmove = (e) => {
      if (e.touches.length > 0) {
        updateMousePos(e.touches[0]);
      }
    };

    this.zenCanvas.ontouchend = () => {
      this.mouse.isDown = false;
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    };

    this.zenCanvas.onmouseleave = () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    };

    // Start render loop
    if (this.zenAnimId) cancelAnimationFrame(this.zenAnimId);
    const loop = () => {
      if (this.activeTab === 'zen') {
        this.updateZenPhysics();
        this.drawZen();
        this.zenAnimId = requestAnimationFrame(loop);
      }
    };
    this.zenAnimId = requestAnimationFrame(loop);
  }

  initZenParticles() {
    this.zenParticles = [];
    const count = 900;
    const w = this.zenCanvas ? this.zenCanvas.width : 700;
    const h = this.zenCanvas ? this.zenCanvas.height : 420;

    for (let i = 0; i < count; i++) {
      this.zenParticles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: 1.2 + Math.random() * 2,
        baseColor: this.getZenColor()
      });
    }
  }

  getZenColor() {
    const palettes = {
      cyber: ['#00ffcc', '#00b4d8', '#ff007f', '#7928ca'],
      aurora: ['#10b981', '#34d399', '#06b6d4', '#a7f3d0'],
      sunset: ['#f59e0b', '#ef4444', '#ec4899', '#fbbf24'],
      cosmos: ['#8b5cf6', '#c084fc', '#e879f9', '#6366f1']
    };
    const list = palettes[this.zenTheme] || palettes.cyber;
    return list[Math.floor(Math.random() * list.length)];
  }

  updateZenParticleColors() {
    this.zenParticles.forEach((p) => {
      p.baseColor = this.getZenColor();
    });
  }

  spawnStreamParticles(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 3;
      this.zenParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: 1.5 + Math.random() * 2,
        baseColor: this.getZenColor()
      });
    }
    // Cap particles to 1200 for 60fps performance
    if (this.zenParticles.length > 1200) {
      this.zenParticles.splice(0, this.zenParticles.length - 1200);
    }
  }

  updateZenPhysics() {
    const w = this.zenCanvas.width;
    const h = this.zenCanvas.height;
    const mx = this.mouse.x;
    const my = this.mouse.y;
    const isMouseActive = mx > 0 && my > 0;

    for (let i = 0; i < this.zenParticles.length; i++) {
      const p = this.zenParticles[i];

      if (isMouseActive) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.hypot(dx, dy);

        if (this.zenInteractionMode === 'vortex' && dist < 220) {
          // Tangential force for swirl vortex
          const force = (1 - dist / 220) * 1.8;
          p.vx += (-dy / dist) * force + (dx / dist) * 0.4;
          p.vy += (dx / dist) * force + (dy / dist) * 0.4;
        } else if (this.zenInteractionMode === 'attract' && dist < 250) {
          const force = (1 - dist / 250) * 1.5;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        } else if (this.zenInteractionMode === 'repel' && dist < 180) {
          const force = (1 - dist / 180) * 2.5;
          p.vx -= (dx / dist) * force;
          p.vy -= (dy / dist) * force;
        }
      }

      // Gentle damping and gravity
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.vy += 0.04; // subtle down gravity

      p.x += p.vx;
      p.y += p.vy;

      // Arena bounds bounce
      if (p.x < 0) {
        p.x = 0;
        p.vx *= -0.7;
      } else if (p.x > w) {
        p.x = w;
        p.vx *= -0.7;
      }
      if (p.y < 0) {
        p.y = 0;
        p.vy *= -0.7;
      } else if (p.y > h) {
        p.y = h;
        p.vy *= -0.7;
      }
    }
  }

  drawZen() {
    const { zenCtx: ctx, zenCanvas: canvas } = this;
    if (!ctx || !canvas) return;

    // Semi-transparent fade for silky particle trails
    ctx.fillStyle = 'rgba(11, 15, 25, 0.22)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < this.zenParticles.length; i++) {
      const p = this.zenParticles[i];
      ctx.fillStyle = p.baseColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cursor indicator
    if (this.mouse.x > 0 && this.mouse.y > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, 35, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  destroy() {
    if (this.zenAnimId) {
      cancelAnimationFrame(this.zenAnimId);
      this.zenAnimId = null;
    }
    window.removeEventListener('keydown', this.boundKeyDown);
    this.container.innerHTML = '';
  }
}

window.FidgetGame = FidgetGame;

