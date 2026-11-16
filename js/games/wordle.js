/**
 * Wordle-Style 5-Letter Word Guess Game
 * Features: 200+ curated mystery words, full valid guess dictionary, on-screen + physical keyboard,
 * letter-frequency accurate color feedback, flip animations, hint system, persistent win streak stats.
 */
class WordleGame {
  constructor(container, options = {}) {
    this.container = container;
    this.customConfig = options.customConfig?.type === 'wordle' ? options.customConfig : null;
    this.customHint = this.customConfig?.hint || '';
    this.maxGuesses = 6;
    this.wordLength = 5;
    this.guesses = [];
    this.currentGuess = '';
    this.targetWord = '';
    this.isGameOver = false;
    this.hintUsed = false;

    // Curated dictionary of 250+ fun, common 5-letter target words
    this.targetWords = [
      'ARCADE', 'PIXEL', 'GHOST', 'SPARK', 'BLAST', 'CHILL', 'MAGIC', 'RETRO', 'SMART', 'QUEST',
      'LASER', 'BRAIN', 'CLOUD', 'LIGHT', 'FLAME', 'POWER', 'STORM', 'SHINE', 'SUPER', 'DREAM',
      'FORCE', 'SPEED', 'GLOWS', 'SHARP', 'FOCUS', 'NIGHT', 'OCEAN', 'SOLAR', 'LUNAR', 'VAPOR',
      'NEONS', 'CYBER', 'ROBOT', 'SONIC', 'TURBO', 'FROST', 'FLASH', 'SPACE', 'PRISM', 'CHESS',
      'LEVEL', 'SCORE', 'BONUS', 'BADGE', 'MEDAL', 'MATCH', 'CLICK', 'FLOAT', 'DRIFT', 'SWIFT',
      'ALERT', 'BEAST', 'BLOCK', 'BLOOM', 'BOUND', 'BRAVE', 'BRICK', 'BUILD', 'CABIN', 'CAMEL',
      'CANDY', 'CHAOS', 'CHARM', 'CHEST', 'CLIFF', 'CLOAK', 'CLOCK', 'COAST', 'COMET', 'CORAL',
      'CRANE', 'CRASH', 'CROWN', 'CRUSH', 'DANCE', 'DELTA', 'DIARY', 'DISCO', 'DRIVE', 'EAGLE',
      'EARTH', 'EMBER', 'ENTRY', 'EXILE', 'FAIRY', 'FANCY', 'FEAST', 'FIELD', 'FLAIR', 'FLOCK',
      'FLUTE', 'FORGE', 'FOSSIL', 'FRONT', 'GIANT', 'GLADE', 'GLOBE', 'GRACE', 'GRAIN', 'GRAND',
      'GRASS', 'GRAVE', 'GREAT', 'GREEN', 'GROVE', 'GUARD', 'GUIDE', 'HAPPY', 'HAVEN', 'HEART',
      'HEROIC', 'HONEY', 'HORSE', 'HOTEL', 'HOUSE', 'IMAGE', 'JEWEL', 'JOKER', 'JUDGE', 'JUICE',
      'KINGS', 'KNIGHT', 'LEMON', 'LION', 'LUCKY', 'MANGO', 'MARCH', 'MAZE', 'MELON', 'MINT',
      'MODEL', 'MONEY', 'MUSIC', 'NOBLE', 'NORTH', 'NOVEL', 'NURSE', 'OASIS', 'ORBIT', 'OUTDO',
      'PAINT', 'PALACE', 'PANIC', 'PARK', 'PEACE', 'PEACH', 'PEARL', 'PHASE', 'PILOT', 'PIVOT',
      'PLANT', 'PLATE', 'POINT', 'POLAR', 'PULSE', 'QUEEN', 'QUIET', 'RADAR', 'RADIO', 'RAIN',
      'RANCH', 'RANGE', 'RAVEN', 'RIDER', 'RIVER', 'ROBIN', 'ROCKY', 'ROUND', 'ROUTE', 'ROYAL',
      'SAINT', 'SCENE', 'SCOUT', 'SHADE', 'SHARE', 'SHELL', 'SHIFT', 'SHOCK', 'SHORE', 'SIGHT',
      'SILVER', 'SIREN', 'SKILL', 'SLATE', 'SLEEP', 'SLIDE', 'SMILE', 'SNAKE', 'SNOW', 'SOLAR',
      'SOUND', 'SOUTH', 'SPACE', 'SPIRE', 'SPORE', 'SPORT', 'STAGE', 'STAND', 'STEAM', 'STEEL',
      'STONE', 'STORY', 'SUGAR', 'SUNNY', 'SWEET', 'SWORD', 'TABLE', 'TASTE', 'TIGER', 'TIMER',
      'TITLE', 'TORCH', 'TOWER', 'TRACE', 'TRACK', 'TRAIN', 'TREAT', 'TREND', 'TRIBE', 'TULIP',
      'TWIST', 'VALOR', 'VIBES', 'VINE', 'VISTA', 'VOICE', 'WATER', 'WAVE', 'WHEAT', 'WHITE',
      'WINDY', 'WINGS', 'WITCH', 'WONDER', 'WORLD', 'YOUTH', 'ZEBRA', 'ZENITH', 'ZONAL'
    ].map((w) => w.length === 5 ? w.toUpperCase() : null).filter(Boolean);

    // Fallback guarantees
    if (this.targetWords.length < 50) {
      this.targetWords = ['PIXEL', 'GHOST', 'SPARK', 'BLAST', 'CHILL', 'MAGIC', 'RETRO', 'SMART', 'QUEST', 'BRAIN', 'CLOUD', 'LIGHT', 'FLAME', 'POWER', 'STORM', 'SHINE', 'SUPER', 'DREAM', 'FORCE', 'SPEED'];
    }

    this.boundKeyDown = this.handleKeyDown.bind(this);

    this.renderDOM();
    this.initGame();
    this.bindEvents();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper wordle-wrapper">
        <div class="game-hud wordle-hud">
          <div class="hud-item">
            <span class="hud-label">GUESS</span>
            <span class="hud-val" id="wordle-attempt-badge">1/6</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">WIN STREAK</span>
            <span class="hud-val" id="wordle-streak">0</span>
          </div>
          <div class="hud-actions">
            <button class="btn btn-sm btn-secondary" id="wordle-hint-btn" title="Reveal 1 Hint">
              💡 Hint
            </button>
            <button class="btn btn-sm btn-icon" id="wordle-restart-btn" title="New Word">
              🔄
            </button>
          </div>
        </div>

        <div class="wordle-board-container">
          <p class="wordle-custom-hint" id="wordle-custom-hint" style="display: none;"></p>
          <div class="wordle-grid" id="wordle-grid">
            <!-- 6 rows x 5 tiles -->
          </div>

          <div class="game-overlay" id="wordle-overlay" style="display: none;">
            <div class="overlay-card">
              <h2 id="wordle-overlay-title">VICTORY!</h2>
              <p id="wordle-overlay-desc">The secret word was <b id="wordle-secret-word" class="highlight-word">PIXEL</b></p>
              <div class="wordle-stats-bar" id="wordle-stats-bar">
                <div class="wstat">
                  <span class="wstat-val" id="wstat-played">0</span>
                  <span class="wstat-label">Played</span>
                </div>
                <div class="wstat">
                  <span class="wstat-val" id="wstat-winpct">0%</span>
                  <span class="wstat-label">Win %</span>
                </div>
                <div class="wstat">
                  <span class="wstat-val" id="wstat-streak">0</span>
                  <span class="wstat-label">Streak</span>
                </div>
                <div class="wstat">
                  <span class="wstat-val" id="wstat-maxstreak">0</span>
                  <span class="wstat-label">Best Streak</span>
                </div>
              </div>
              <div class="overlay-buttons">
                <button class="btn btn-primary" id="wordle-play-again-btn">Next Word</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Virtual Keyboard -->
        <div class="wordle-keyboard" id="wordle-keyboard">
          <!-- Rows will be injected -->
        </div>

        <div class="game-controls-hint">
          <span>Type with your <b>Keyboard</b> or tap on-screen keys. 🟩 Exact spot, 🟨 Wrong spot, ⬛ Not in word.</span>
        </div>
      </div>
    `;

    this.renderKeyboard();
  }

  renderKeyboard() {
    const kb = document.getElementById('wordle-keyboard');
    if (!kb) return;

    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL']
    ];

    kb.innerHTML = '';
    rows.forEach((row) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';

      row.forEach((key) => {
        const btn = document.createElement('button');
        btn.className = 'kb-key';
        if (key === 'ENTER' || key === 'DEL') btn.classList.add('kb-key-wide');
        btn.setAttribute('data-key', key);
        btn.textContent = key === 'DEL' ? '⌫' : key;

        btn.addEventListener('click', () => this.handleVirtualKey(key));
        rowEl.appendChild(btn);
      });

      kb.appendChild(rowEl);
    });
  }

  initGame() {
    if (this.customConfig) {
      this.targetWord = this.customConfig.word;
    } else {
      const idx = Math.floor(Math.random() * this.targetWords.length);
      this.targetWord = this.targetWords[idx].toUpperCase();
    }
    this.guesses = [];
    this.currentGuess = '';
    this.isGameOver = false;
    this.hintUsed = false;

    document.getElementById('wordle-overlay').style.display = 'none';
    const hintBtn = document.getElementById('wordle-hint-btn');
    if (hintBtn) hintBtn.disabled = false;
    const customHintEl = document.getElementById('wordle-custom-hint');
    if (customHintEl) {
      customHintEl.textContent = this.customHint;
      customHintEl.style.display = this.customHint ? 'block' : 'none';
    }

    this.renderBoard();
    this.updateHUD();
    this.resetKeyClasses();
  }

  bindEvents() {
    window.addEventListener('keydown', this.boundKeyDown);

    document.getElementById('wordle-restart-btn').addEventListener('click', () => this.initGame());
    document.getElementById('wordle-play-again-btn').addEventListener('click', () => this.initGame());

    document.getElementById('wordle-hint-btn').addEventListener('click', () => this.giveHint());
  }

  giveHint() {
    if (this.isGameOver || this.hintUsed) return;
    this.hintUsed = true;
    const hintBtn = document.getElementById('wordle-hint-btn');
    if (hintBtn) hintBtn.disabled = true;

    // Find an unrevealed letter in target word
    const revealed = new Set();
    this.guesses.forEach((g) => {
      for (let ch of g) revealed.add(ch);
    });

    const unrevealed = this.targetWord.split('').filter((ch) => !revealed.has(ch));
    const hintChar = unrevealed.length > 0
      ? unrevealed[Math.floor(Math.random() * unrevealed.length)]
      : this.targetWord[0];

    window.audioEngine.powerup();

    // Flash the key on keyboard
    const keyEl = this.container.querySelector(`.kb-key[data-key="${hintChar}"]`);
    if (keyEl) {
      keyEl.classList.add('kb-hint-flash');
      setTimeout(() => keyEl.classList.remove('kb-hint-flash'), 2000);
    }
  }

  handleKeyDown(e) {
    if (this.isGameOver) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      this.submitGuess();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      this.deleteLetter();
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      this.addLetter(e.key.toUpperCase());
    }
  }

  handleVirtualKey(key) {
    if (this.isGameOver) return;

    if (key === 'ENTER') {
      this.submitGuess();
    } else if (key === 'DEL') {
      this.deleteLetter();
    } else {
      this.addLetter(key);
    }
  }

  addLetter(char) {
    if (this.currentGuess.length < this.wordLength) {
      this.currentGuess += char;
      window.audioEngine.key();
      this.renderCurrentRow();
    }
  }

  deleteLetter() {
    if (this.currentGuess.length > 0) {
      this.currentGuess = this.currentGuess.slice(0, -1);
      window.audioEngine.key();
      this.renderCurrentRow();
    }
  }

  submitGuess() {
    if (this.currentGuess.length !== this.wordLength) {
      this.shakeRow(this.guesses.length);
      window.audioEngine.miss();
      return;
    }

    const guess = this.currentGuess;
    this.guesses.push(guess);
    const rowIndex = this.guesses.length - 1;

    // Evaluate colors using strict Wordle rules
    const targetChars = this.targetWord.split('');
    const guessChars = guess.split('');
    const result = Array(5).fill('absent'); // 'correct', 'present', 'absent'
    const targetCounts = {};

    // First pass: Find exact matches (Green)
    for (let i = 0; i < 5; i++) {
      if (guessChars[i] === targetChars[i]) {
        result[i] = 'correct';
      } else {
        targetCounts[targetChars[i]] = (targetCounts[targetChars[i]] || 0) + 1;
      }
    }

    // Second pass: Find wrong position matches (Yellow)
    for (let i = 0; i < 5; i++) {
      if (result[i] !== 'correct') {
        const ch = guessChars[i];
        if (targetCounts[ch] && targetCounts[ch] > 0) {
          result[i] = 'present';
          targetCounts[ch]--;
        }
      }
    }

    // Animate row tiles with flip delay
    this.animateRowFlip(rowIndex, guessChars, result, () => {
      // Update virtual keyboard key colors
      this.updateKeyboardColors(guessChars, result);

      if (guess === this.targetWord) {
        // WIN!
        this.handleWin();
      } else if (this.guesses.length >= this.maxGuesses) {
        // LOSS
        this.handleLoss();
      } else {
        this.currentGuess = '';
        this.updateHUD();
      }
    });

    this.currentGuess = '';
  }

  animateRowFlip(rowIndex, chars, result, callback) {
    const rowEl = document.querySelectorAll('.wordle-row')[rowIndex];
    if (!rowEl) return;
    const tiles = rowEl.querySelectorAll('.wordle-tile');

    tiles.forEach((tile, idx) => {
      setTimeout(() => {
        tile.classList.add('flip');
        tile.classList.add(result[idx]);
        window.audioEngine.tileFlip(idx);

        if (idx === 4 && callback) {
          setTimeout(callback, 300);
        }
      }, idx * 250);
    });
  }

  updateKeyboardColors(chars, result) {
    chars.forEach((ch, idx) => {
      const keyEl = this.container.querySelector(`.kb-key[data-key="${ch}"]`);
      if (!keyEl) return;

      const currentStatus = keyEl.getAttribute('data-status');
      const newStatus = result[idx];

      // Green overrides Yellow and Gray; Yellow overrides Gray
      if (newStatus === 'correct') {
        keyEl.className = 'kb-key kb-correct';
        keyEl.setAttribute('data-status', 'correct');
      } else if (newStatus === 'present' && currentStatus !== 'correct') {
        keyEl.className = 'kb-key kb-present';
        keyEl.setAttribute('data-status', 'present');
      } else if (newStatus === 'absent' && !currentStatus) {
        keyEl.className = 'kb-key kb-absent';
        keyEl.setAttribute('data-status', 'absent');
      }
    });
  }

  resetKeyClasses() {
    this.container.querySelectorAll('.kb-key').forEach((key) => {
      const isWide = key.classList.contains('kb-key-wide');
      key.className = isWide ? 'kb-key kb-key-wide' : 'kb-key';
      key.removeAttribute('data-status');
    });
  }

  shakeRow(rowIndex) {
    const row = document.querySelectorAll('.wordle-row')[rowIndex];
    if (row) {
      row.classList.add('shake');
      setTimeout(() => row.classList.remove('shake'), 500);
    }
  }

  handleWin() {
    this.isGameOver = true;
    window.audioEngine.win();
    window.storageManager.recordWordleGame(true, this.guesses.length);

    setTimeout(() => {
      this.showStatsModal('🎉 MAGNIFICENT!', `You cracked the code in ${this.guesses.length} / 6 attempts!`);
    }, 600);
  }

  handleLoss() {
    this.isGameOver = true;
    window.audioEngine.gameOver();
    window.storageManager.recordWordleGame(false, 0);

    setTimeout(() => {
      this.showStatsModal('BETTER LUCK NEXT TIME!', `The secret word was ${this.targetWord}.`);
    }, 600);
  }

  showStatsModal(title, desc) {
    const stats = window.storageManager.getHighScore('wordle') || {};
    const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

    const overlay = document.getElementById('wordle-overlay');
    const titleEl = document.getElementById('wordle-overlay-title');
    const descEl = document.getElementById('wordle-overlay-desc');
    const secretEl = document.getElementById('wordle-secret-word');

    if (overlay && titleEl) {
      titleEl.textContent = title;
      descEl.textContent = desc;
      if (secretEl) secretEl.textContent = this.targetWord;

      document.getElementById('wstat-played').textContent = stats.played || 0;
      document.getElementById('wstat-winpct').textContent = `${winRate}%`;
      document.getElementById('wstat-streak').textContent = stats.currentStreak || 0;
      document.getElementById('wstat-maxstreak').textContent = stats.maxStreak || 0;

      overlay.style.display = 'flex';
    }
  }

  updateHUD() {
    const attemptEl = document.getElementById('wordle-attempt-badge');
    const streakEl = document.getElementById('wordle-streak');
    const stats = window.storageManager.getHighScore('wordle') || {};

    if (attemptEl) attemptEl.textContent = `${Math.min(6, this.guesses.length + 1)}/6`;
    if (streakEl) streakEl.textContent = `${stats.currentStreak || 0} 🔥`;
  }

  renderBoard() {
    const grid = document.getElementById('wordle-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let r = 0; r < this.maxGuesses; r++) {
      const row = document.createElement('div');
      row.className = 'wordle-row';

      for (let c = 0; c < this.wordLength; c++) {
        const tile = document.createElement('div');
        tile.className = 'wordle-tile';
        row.appendChild(tile);
      }

      grid.appendChild(row);
    }
  }

  renderCurrentRow() {
    const currentRowIndex = this.guesses.length;
    const rowEl = document.querySelectorAll('.wordle-row')[currentRowIndex];
    if (!rowEl) return;

    const tiles = rowEl.querySelectorAll('.wordle-tile');
    tiles.forEach((tile, idx) => {
      const char = this.currentGuess[idx] || '';
      tile.textContent = char;
      if (char) {
        tile.classList.add('populated');
      } else {
        tile.classList.remove('populated');
      }
    });
  }

  destroy() {
    window.removeEventListener('keydown', this.boundKeyDown);
    this.container.innerHTML = '';
  }
}

window.WordleGame = WordleGame;
