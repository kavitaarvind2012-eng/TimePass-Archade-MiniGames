/**
 * TimePass Arcade - Arcade Maker (Custom Game Creator)
 * Features: Custom Maze Designer, Custom Wordle Creator, Custom Tetris Mod
 * Shareable Base64 URL codes and auto-launch parser
 */
class ArcadeMaker {
  constructor() {
    this.activeTab = 'maze';
    this.mazeGrid = this.createEmptyMaze();
    this.mazeStart = { r: 0, c: 0 };
    this.mazeExit = { r: 14, c: 14 };
    this.wordleWord = '';
    this.wordleHint = '';
    this.tetrisSpeed = 800;
    this.tetrisGravity = 1.15;
    this.tetrisPalette = 'neon';
    this.isPainting = false;
    this.stopPainting = () => { this.isPainting = false; };
    window.addEventListener('pointerup', this.stopPainting);
  }

  createEmptyMaze() {
    const grid = [];
    for (let r = 0; r < 15; r++) {
      grid[r] = [];
      for (let c = 0; c < 15; c++) {
        grid[r][c] = 0; // 0 = open, 1 = wall, 2 = start, 3 = exit
      }
    }
    grid[0][0] = 2;  // Start
    grid[14][14] = 3; // Exit
    return grid;
  }

  // --- Serialize/Deserialize for URL sharing ---
  serializeConfig() {
    const config = { v: 2, type: this.activeTab };

    if (this.activeTab === 'maze') {
      const packed = new Uint8Array(Math.ceil(225 / 4));
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
          const index = r * 15 + c;
          packed[index >> 2] |= (this.mazeGrid[r][c] & 3) << ((index & 3) * 2);
        }
      }
      config.walls = ArcadeMaker.bytesToBase64Url(packed);
      config.start = [this.mazeStart.r, this.mazeStart.c];
      config.exit = [this.mazeExit.r, this.mazeExit.c];
    } else if (this.activeTab === 'wordle') {
      config.word = this.wordleWord.toUpperCase();
      config.hint = this.wordleHint;
    } else if (this.activeTab === 'tetris') {
      config.speed = this.tetrisSpeed;
      config.gravity = this.tetrisGravity;
      config.palette = this.tetrisPalette;
    }

    const json = JSON.stringify(config);
    return ArcadeMaker.bytesToBase64Url(new TextEncoder().encode(json));
  }

  static bytesToBase64Url(bytes) {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  static deserializeConfig(base64Str) {
    try {
      const base64 = base64Str.replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(base64 + '='.repeat((4 - base64.length % 4) % 4));
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const config = JSON.parse(new TextDecoder().decode(bytes));

      if (config.type === 'maze') {
        let grid;
        if (config.v === 2 && typeof config.walls === 'string') {
          const packedBase64 = config.walls.replace(/-/g, '+').replace(/_/g, '/');
          const packedBinary = atob(packedBase64 + '='.repeat((4 - packedBase64.length % 4) % 4));
          if (packedBinary.length !== 57) return null;
          const packed = Uint8Array.from(packedBinary, (char) => char.charCodeAt(0));
          grid = Array.from({ length: 15 }, (_, r) =>
            Array.from({ length: 15 }, (_, c) => {
              const index = r * 15 + c;
              return (packed[index >> 2] >> ((index & 3) * 2)) & 3;
            })
          );
        } else if (typeof config.maze === 'string' && config.maze.length === 225 && /^[0-3]+$/.test(config.maze)) {
          grid = Array.from({ length: 15 }, (_, r) =>
            Array.from({ length: 15 }, (_, c) => Number(config.maze[r * 15 + c]))
          );
        } else {
          return null;
        }

        const validPosition = (position) =>
          Array.isArray(position) && position.length === 2 &&
          position.every((value) => Number.isInteger(value) && value >= 0 && value < 15);
        if (!validPosition(config.start) || !validPosition(config.exit)) return null;
        const [startRow, startCol] = config.start;
        const [exitRow, exitCol] = config.exit;
        grid.forEach((row) => row.forEach((value, col) => {
          if (value === 2 || value === 3) row[col] = 0;
        }));
        grid[startRow][startCol] = 0;
        grid[exitRow][exitCol] = 0;
        return { type: 'maze', mazeGrid: grid, start: config.start, exit: config.exit };
      }

      if (config.type === 'wordle') {
        if (typeof config.word !== 'string' || !/^[A-Z]{5}$/i.test(config.word)) return null;
        return {
          type: 'wordle',
          word: config.word.toUpperCase(),
          hint: typeof config.hint === 'string' ? config.hint.slice(0, 80) : ''
        };
      }

      if (config.type === 'tetris') {
        const palettes = ['neon', 'mono', 'retro', 'cyber'];
        if (!Number.isFinite(config.speed) || config.speed < 100 || config.speed > 1500 ||
            !Number.isFinite(config.gravity) || config.gravity < 1 || config.gravity > 2 ||
            !palettes.includes(config.palette)) return null;
        return {
          type: 'tetris',
          speed: Math.round(config.speed),
          gravity: config.gravity,
          palette: config.palette
        };
      }

      return null;
    } catch (e) {
      console.warn('Failed to decode custom config:', e);
      return null;
    }
  }

  getShareURL() {
    const encoded = this.serializeConfig();
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('custom', encoded);
    return url.toString();
  }

  // --- Auto-Launch: Parse URL on page load ---
  static checkURLForCustomLevel() {
    const params = new URLSearchParams(window.location.search);
    const customParam = params.get('custom');
    if (!customParam) return null;
    return ArcadeMaker.deserializeConfig(customParam);
  }

  // --- Open the Arcade Maker Modal ---
  openModal() {
    const modal = document.getElementById('arcademaker-modal');
    if (!modal) return;
    window.audioEngine.click('blue');
    this.renderModalContent();
    modal.classList.add('open');
  }

  renderModalContent() {
    const body = document.getElementById('arcademaker-body');
    if (!body) return;

    body.innerHTML = `
      <div class="maker-tabs">
        <button class="maker-tab ${this.activeTab === 'maze' ? 'active' : ''}" data-maker-tab="maze">🏗️ Custom Maze</button>
        <button class="maker-tab ${this.activeTab === 'wordle' ? 'active' : ''}" data-maker-tab="wordle">📝 Custom Wordle</button>
        <button class="maker-tab ${this.activeTab === 'tetris' ? 'active' : ''}" data-maker-tab="tetris">🧱 Tetris Mod</button>
      </div>

      <div class="maker-workspace" id="maker-workspace">
        ${this.renderActiveEditor()}
      </div>

      <div class="maker-actions">
        <button class="btn btn-primary btn-sm" id="maker-play-btn">▶️ Play My Creation</button>
        <button class="btn btn-secondary btn-sm" id="maker-share-btn">🔗 Copy Share Link</button>
      </div>
    `;

    // Tab switching
    body.querySelectorAll('.maker-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.activeTab = tab.getAttribute('data-maker-tab');
        this.renderModalContent();
      });
    });

    // Play button
    const playBtn = document.getElementById('maker-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.readCurrentEditorValues();
        if (this.activeTab === 'wordle' && !/^[A-Z]{5}$/.test(this.wordleWord)) {
          window.arcadeApp.showToastNotification('Invalid Wordle word', 'Enter exactly five letters before playing or sharing.');
          return;
        }
        const config = ArcadeMaker.deserializeConfig(this.serializeConfig());
        if (!config) {
          window.arcadeApp.showToastNotification('Invalid custom level', 'Check the settings and try again.');
          return;
        }
        document.getElementById('arcademaker-modal').classList.remove('open');
        window.arcadeApp.launchCustomGame(config);
      });
    }

    // Share button
    const shareBtn = document.getElementById('maker-share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        this.readCurrentEditorValues();
        if (this.activeTab === 'wordle' && !/^[A-Z]{5}$/.test(this.wordleWord)) {
          window.arcadeApp.showToastNotification('Invalid Wordle word', 'Enter exactly five letters before playing or sharing.');
          return;
        }
        const url = this.getShareURL();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(() => {
            window.arcadeApp.showToastNotification('🔗 Share Link Copied!', 'Send this URL to a friend to play your custom level!');
          }).catch(() => window.arcadeApp.fallbackCopy(
            url,
            '🔗 Share link copied!',
            'Send this URL to a friend to play your custom level.'
          ));
        } else {
          window.arcadeApp.fallbackCopy(
            url,
            '🔗 Share link copied!',
            'Send this URL to a friend to play your custom level.'
          );
        }
        window.audioEngine.click('blue');
      });
    }

    // Bind editor-specific events
    if (this.activeTab === 'maze') {
      this.bindMazeEditor();
    }
    this.bindEditorEvents();
  }

  renderActiveEditor() {
    switch (this.activeTab) {
      case 'maze': return this.renderMazeEditor();
      case 'wordle': return this.renderWordleEditor();
      case 'tetris': return this.renderTetrisEditor();
      default: return '';
    }
  }

  // --- MAZE DESIGNER ---
  renderMazeEditor() {
    let gridHtml = '<div class="maker-maze-grid">';
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const val = this.mazeGrid[r][c];
        let cls = 'maze-cell';
        if (val === 1) cls += ' maze-wall';
        else if (val === 2) cls += ' maze-start';
        else if (val === 3) cls += ' maze-exit';
        gridHtml += `<div class="${cls}" data-mr="${r}" data-mc="${c}"></div>`;
      }
    }
    gridHtml += '</div>';

    return `
      <div class="maker-editor-info">
        <h4>🏗️ Custom Maze Designer (15×15)</h4>
        <p>Click cells to toggle walls. Right-click or shift-click to set Start (🟢) and Exit (🔴).</p>
        <div class="maze-legend">
          <span class="legend-item"><span class="legend-dot open"></span> Open</span>
          <span class="legend-item"><span class="legend-dot wall"></span> Wall</span>
          <span class="legend-item"><span class="legend-dot start"></span> Start</span>
          <span class="legend-item"><span class="legend-dot exit"></span> Exit</span>
        </div>
        <div class="maze-tools">
          <button class="btn btn-sm btn-secondary" id="maze-clear-btn">Clear All</button>
          <button class="btn btn-sm btn-secondary" id="maze-random-btn">Random Walls</button>
        </div>
      </div>
      ${gridHtml}
    `;
  }

  bindMazeEditor() {
    const cells = document.querySelectorAll('.maker-maze-grid .maze-cell');
    let paintMode = 1; // 1 = wall, 0 = erase

    cells.forEach((cell) => {
      const r = parseInt(cell.getAttribute('data-mr'));
      const c = parseInt(cell.getAttribute('data-mc'));

      cell.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (e.button === 2) {
          if (this.mazeGrid[r][c] === 2) return;
          this.mazeGrid[this.mazeExit.r][this.mazeExit.c] = 0;
          this.mazeGrid[r][c] = 3;
          this.mazeExit = { r, c };
        } else if (e.shiftKey) {
          if (this.mazeGrid[r][c] !== 3) {
            this.mazeGrid[this.mazeStart.r][this.mazeStart.c] = 0;
            this.mazeGrid[r][c] = 2;
            this.mazeStart = { r, c };
          }
        } else {
          const current = this.mazeGrid[r][c];
          if (current === 2 || current === 3) return; // Don't overwrite start/exit
          paintMode = current === 1 ? 0 : 1;
          this.mazeGrid[r][c] = paintMode;
          this.isPainting = true;
        }
        this.refreshMazeCells();
        window.audioEngine.click('red');
      });

      cell.addEventListener('pointerenter', () => {
        if (!this.isPainting) return;
        const current = this.mazeGrid[r][c];
        if (current === 2 || current === 3) return;
        this.mazeGrid[r][c] = paintMode;
        this.refreshMazeCells();
      });

      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (this.mazeGrid[r][c] !== 2) {
          this.mazeGrid[this.mazeExit.r][this.mazeExit.c] = 0;
          this.mazeGrid[r][c] = 3;
          this.mazeExit = { r, c };
          this.refreshMazeCells();
          window.audioEngine.click('blue');
        }
      });
    });

    const clearBtn = document.getElementById('maze-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.mazeGrid = this.createEmptyMaze();
        this.mazeStart = { r: 0, c: 0 };
        this.mazeExit = { r: 14, c: 14 };
        this.refreshMazeCells();
        window.audioEngine.click('red');
      });
    }

    const randomBtn = document.getElementById('maze-random-btn');
    if (randomBtn) {
      randomBtn.addEventListener('click', () => {
        for (let r = 0; r < 15; r++) {
          for (let c = 0; c < 15; c++) {
            if (this.mazeGrid[r][c] === 2 || this.mazeGrid[r][c] === 3) continue;
            this.mazeGrid[r][c] = Math.random() < 0.3 ? 1 : 0;
          }
        }
        this.refreshMazeCells();
        window.audioEngine.click('blue');
      });
    }
  }

  refreshMazeCells() {
    const cells = document.querySelectorAll('.maker-maze-grid .maze-cell');
    cells.forEach((cell) => {
      const r = parseInt(cell.getAttribute('data-mr'));
      const c = parseInt(cell.getAttribute('data-mc'));
      const val = this.mazeGrid[r][c];
      cell.className = 'maze-cell';
      if (val === 1) cell.classList.add('maze-wall');
      else if (val === 2) cell.classList.add('maze-start');
      else if (val === 3) cell.classList.add('maze-exit');
    });
  }

  // --- WORDLE CREATOR ---
  renderWordleEditor() {
    return `
      <div class="maker-editor-info">
        <h4>📝 Custom Wordle Creator</h4>
        <p>Set your own secret 5-letter word and share it with a friend!</p>
      </div>
      <div class="maker-form">
        <div class="maker-field">
          <label for="maker-wordle-word">Secret 5-Letter Word</label>
          <input type="text" id="maker-wordle-word" maxlength="5" placeholder="CRANE" value="${this.escapeHtml(this.wordleWord)}" class="maker-input maker-input-lg" style="text-transform: uppercase; letter-spacing: 0.2em; font-family: var(--font-mono);" />
          <span class="maker-field-hint" id="wordle-char-count">${this.wordleWord.length}/5 characters</span>
        </div>
        <div class="maker-field">
          <label for="maker-wordle-hint">Custom Hint Message (optional)</label>
          <input type="text" id="maker-wordle-hint" maxlength="80" placeholder="Something you see in the sky..." value="${this.escapeHtml(this.wordleHint)}" class="maker-input" />
        </div>
        <div class="maker-preview-card" id="wordle-preview">
          <span class="preview-label">Preview</span>
          <div class="wordle-preview-tiles" id="wordle-preview-tiles">
            ${this.renderWordlePreviewTiles()}
          </div>
        </div>
      </div>
    `;

    // Note: we bind input events via readCurrentEditorValues before play/share
  }

  renderWordlePreviewTiles() {
    const word = (this.wordleWord || '     ').padEnd(5, ' ').slice(0, 5).toUpperCase();
    return word.split('').map((ch, i) =>
      `<div class="wp-tile ${ch.trim() ? 'wp-filled' : ''}">${ch.trim() || '?'}</div>`
    ).join('');
  }

  // --- TETRIS MOD ---
  renderTetrisEditor() {
    return `
      <div class="maker-editor-info">
        <h4>🧱 Custom Tetris Mod</h4>
        <p>Adjust speed, gravity, and color palette to create your custom ruleset.</p>
      </div>
      <div class="maker-form">
        <div class="maker-field">
          <label>Starting Drop Speed: <b id="tetris-speed-val">${this.tetrisSpeed}ms</b></label>
          <input type="range" id="maker-tetris-speed" min="100" max="1500" step="50" value="${this.tetrisSpeed}" class="maker-slider" />
          <div class="slider-labels"><span>Ultra Fast (100ms)</span><span>Slow (1500ms)</span></div>
        </div>
        <div class="maker-field">
          <label>Gravity Acceleration: <b id="tetris-gravity-val">${this.tetrisGravity.toFixed(2)}x</b></label>
          <input type="range" id="maker-tetris-gravity" min="1.0" max="2.0" step="0.05" value="${this.tetrisGravity}" class="maker-slider" />
          <div class="slider-labels"><span>Gentle (1.0x)</span><span>Intense (2.0x)</span></div>
        </div>
        <div class="maker-field">
          <label>Color Palette</label>
          <div class="tetris-palette-options">
            <button class="palette-opt ${this.tetrisPalette === 'neon' ? 'active' : ''}" data-pal="neon">
              <span class="pal-swatch" style="background: linear-gradient(135deg, #00ffcc, #a855f7, #f43f5e);"></span>
              Neon Classic
            </button>
            <button class="palette-opt ${this.tetrisPalette === 'mono' ? 'active' : ''}" data-pal="mono">
              <span class="pal-swatch" style="background: linear-gradient(135deg, #e2e8f0, #94a3b8, #475569);"></span>
              Monochrome
            </button>
            <button class="palette-opt ${this.tetrisPalette === 'retro' ? 'active' : ''}" data-pal="retro">
              <span class="pal-swatch" style="background: linear-gradient(135deg, #f59e0b, #10b981, #3b82f6);"></span>
              Retro Warm
            </button>
            <button class="palette-opt ${this.tetrisPalette === 'cyber' ? 'active' : ''}" data-pal="cyber">
              <span class="pal-swatch" style="background: linear-gradient(135deg, #00ff66, #0ff, #ff00ff);"></span>
              Cyberpunk
            </button>
          </div>
        </div>
      </div>
    `;
  }

  escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  readCurrentEditorValues() {
    if (this.activeTab === 'wordle') {
      const wordInput = document.getElementById('maker-wordle-word');
      const hintInput = document.getElementById('maker-wordle-hint');
      if (wordInput) this.wordleWord = wordInput.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
      if (hintInput) this.wordleHint = hintInput.value.trim();
    } else if (this.activeTab === 'tetris') {
      const speedSlider = document.getElementById('maker-tetris-speed');
      const gravitySlider = document.getElementById('maker-tetris-gravity');
      if (speedSlider) this.tetrisSpeed = parseInt(speedSlider.value);
      if (gravitySlider) this.tetrisGravity = parseFloat(gravitySlider.value);

      const activePal = document.querySelector('.palette-opt.active');
      if (activePal) this.tetrisPalette = activePal.getAttribute('data-pal');
    }
    // Maze is already updated live
  }

  // Bind dynamic editor events (called after renderModalContent)
  bindEditorEvents() {
    // Tetris sliders
    const speedSlider = document.getElementById('maker-tetris-speed');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        this.tetrisSpeed = parseInt(e.target.value);
        const label = document.getElementById('tetris-speed-val');
        if (label) label.textContent = this.tetrisSpeed + 'ms';
      });
    }

    const gravitySlider = document.getElementById('maker-tetris-gravity');
    if (gravitySlider) {
      gravitySlider.addEventListener('input', (e) => {
        this.tetrisGravity = parseFloat(e.target.value);
        const label = document.getElementById('tetris-gravity-val');
        if (label) label.textContent = this.tetrisGravity.toFixed(2) + 'x';
      });
    }

    // Palette buttons
    document.querySelectorAll('.palette-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.palette-opt').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.tetrisPalette = btn.getAttribute('data-pal');
        window.audioEngine.click('red');
      });
    });

    // Wordle live preview
    const wordInput = document.getElementById('maker-wordle-word');
    if (wordInput) {
      wordInput.addEventListener('input', () => {
        this.wordleWord = wordInput.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
        wordInput.value = this.wordleWord;
        const charCount = document.getElementById('wordle-char-count');
        if (charCount) charCount.textContent = `${this.wordleWord.length}/5 characters`;
        const tiles = document.getElementById('wordle-preview-tiles');
        if (tiles) tiles.innerHTML = this.renderWordlePreviewTiles();
      });
    }

    const hintInput = document.getElementById('maker-wordle-hint');
    if (hintInput) {
      hintInput.addEventListener('input', () => {
        this.wordleHint = hintInput.value.slice(0, 80);
      });
    }
  }
}

window.ArcadeMaker = ArcadeMaker;
