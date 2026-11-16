/**
 * Memory Match Game
 * Features: 3 difficulties (4x4, 6x6, 8x8), 3D flip animations, timer, move counter, best records.
 */
class MemoryGame {
  constructor(container) {
    this.container = container;
    this.difficulty = 'easy'; // 'easy' (4x4), 'medium' (6x6), 'hard' (8x8)
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.totalPairs = 8;
    this.moves = 0;
    this.timerSeconds = 0;
    this.timerInterval = null;
    this.isLocked = false;
    this.isComplete = false;

    // Rich emoji icon bank (32 unique items for up to 8x8 = 32 pairs)
    this.icons = [
      '🚀', '🎮', '💎', '🔥', '⭐', '🌈', '👾', '⚡',
      '🍕', '🍩', '🥑', '🍉', '🍣', '🍦', '🥨', '🌮',
      '🦊', '🐼', '🐙', '🦄', '🦁', '🦉', '🐬', '🦋',
      '🔮', '🎲', '🧩', '🎧', '🎸', '🕹️', '🛡️', '⚔️'
    ];

    this.renderDOM();
    this.initGame();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper memory-wrapper">
        <div class="game-hud memory-hud">
          <div class="hud-item">
            <span class="hud-label">TIME</span>
            <span class="hud-val" id="memory-time">00:00</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">MOVES</span>
            <span class="hud-val" id="memory-moves">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">PAIRS</span>
            <span class="hud-val" id="memory-pairs">0/8</span>
          </div>
          <div class="memory-diff-selector">
            <button class="diff-btn active" data-diff="easy">4x4</button>
            <button class="diff-btn" data-diff="medium">6x6</button>
            <button class="diff-btn" data-diff="hard">8x8</button>
          </div>
          <div class="hud-actions">
            <button class="btn btn-sm btn-icon" id="memory-restart-btn" title="Restart">🔄</button>
          </div>
        </div>

        <div class="memory-board-container">
          <div class="memory-grid grid-easy" id="memory-grid">
            <!-- Cards rendered here -->
          </div>

          <div class="game-overlay" id="memory-overlay" style="display: none;">
            <div class="overlay-card">
              <h2>🎉 CONGRATULATIONS!</h2>
              <p>You matched all pairs in <b id="memory-final-time">00:45</b> with <b id="memory-final-moves">14</b> moves!</p>
              <div class="memory-records-box" id="memory-records-box"></div>
              <div class="overlay-buttons">
                <button class="btn btn-primary" id="memory-play-again-btn">Play Again</button>
              </div>
            </div>
          </div>
        </div>

        <div class="game-controls-hint">
          <span>Flip cards to find matching pairs. Complete as fast as you can with minimal moves!</span>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('memory-restart-btn').addEventListener('click', () => this.initGame());
    document.getElementById('memory-play-again-btn').addEventListener('click', () => this.initGame());

    this.container.querySelectorAll('.diff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.diff-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.difficulty = btn.getAttribute('data-diff');
        this.initGame();
      });
    });
  }

  initGame() {
    this.stopTimer();
    this.timerSeconds = 0;
    this.moves = 0;
    this.matchedPairs = 0;
    this.flippedCards = [];
    this.isLocked = false;
    this.isComplete = false;

    document.getElementById('memory-overlay').style.display = 'none';

    let size = 4;
    if (this.difficulty === 'medium') size = 6;
    if (this.difficulty === 'hard') size = 8;
    this.totalPairs = (size * size) / 2;

    // Pick icons and duplicate
    const chosenIcons = this.icons.slice(0, this.totalPairs);
    const deck = [...chosenIcons, ...chosenIcons];
    this.shuffle(deck);

    this.cards = deck.map((icon, index) => ({
      id: index,
      icon: icon,
      isFlipped: false,
      isMatched: false
    }));

    this.updateHUD();
    this.renderCards(size);
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  renderCards(size) {
    const grid = document.getElementById('memory-grid');
    if (!grid) return;

    grid.className = `memory-grid grid-${this.difficulty}`;
    grid.innerHTML = '';

    this.cards.forEach((card) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'memory-card';
      cardEl.setAttribute('data-id', card.id);

      cardEl.innerHTML = `
        <div class="card-inner">
          <div class="card-front">
            <span class="card-pattern">?</span>
          </div>
          <div class="card-back">
            <span class="card-icon">${card.icon}</span>
          </div>
        </div>
      `;

      cardEl.addEventListener('click', () => this.handleCardClick(card, cardEl));
      grid.appendChild(cardEl);
    });
  }

  startTimer() {
    if (this.timerInterval) return;
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.updateHUDTime();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateHUDTime() {
    const timeEl = document.getElementById('memory-time');
    if (!timeEl) return;
    const m = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
    const s = String(this.timerSeconds % 60).padStart(2, '0');
    timeEl.textContent = `${m}:${s}`;
  }

  updateHUD() {
    this.updateHUDTime();
    const movesEl = document.getElementById('memory-moves');
    const pairsEl = document.getElementById('memory-pairs');
    if (movesEl) movesEl.textContent = this.moves;
    if (pairsEl) pairsEl.textContent = `${this.matchedPairs}/${this.totalPairs}`;
  }

  handleCardClick(card, cardEl) {
    if (this.isLocked || card.isFlipped || card.isMatched) return;

    this.startTimer();

    // Flip card
    card.isFlipped = true;
    cardEl.classList.add('flipped');
    window.audioEngine.flip();

    this.flippedCards.push({ card, el: cardEl });

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.updateHUD();
      this.checkForMatch();
    }
  }

  checkForMatch() {
    this.isLocked = true;
    const [card1, card2] = this.flippedCards;

    if (card1.card.icon === card2.card.icon) {
      // MATCH
      setTimeout(() => {
        card1.card.isMatched = true;
        card2.card.isMatched = true;
        card1.el.classList.add('matched');
        card2.el.classList.add('matched');

        window.audioEngine.match();

        this.matchedPairs++;
        this.updateHUD();
        this.flippedCards = [];
        this.isLocked = false;

        if (this.matchedPairs === this.totalPairs) {
          this.handleGameComplete();
        }
      }, 350);
    } else {
      // MISMATCH
      setTimeout(() => {
        window.audioEngine.mismatch();
        card1.el.classList.add('mismatch');
        card2.el.classList.add('mismatch');

        setTimeout(() => {
          card1.card.isFlipped = false;
          card2.card.isFlipped = false;
          card1.el.classList.remove('flipped', 'mismatch');
          card2.el.classList.remove('flipped', 'mismatch');
          this.flippedCards = [];
          this.isLocked = false;
        }, 600);
      }, 500);
    }
  }

  handleGameComplete() {
    this.stopTimer();
    this.isComplete = true;

    window.audioEngine.win();
    window.storageManager.setMemoryScore(this.difficulty, this.timerSeconds, this.moves);

    const m = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
    const s = String(this.timerSeconds % 60).padStart(2, '0');

    const overlay = document.getElementById('memory-overlay');
    const finalTime = document.getElementById('memory-final-time');
    const finalMoves = document.getElementById('memory-final-moves');
    const recordsBox = document.getElementById('memory-records-box');

    if (overlay && finalTime && finalMoves) {
      finalTime.textContent = `${m}:${s}`;
      finalMoves.textContent = this.moves;

      const record = window.storageManager.getHighScore('memory')[this.difficulty] || {};
      const bestTimeStr = record.bestTime !== null
        ? `${Math.floor(record.bestTime / 60)}m ${record.bestTime % 60}s`
        : '--';

      if (recordsBox) {
        recordsBox.innerHTML = `
          <div class="record-badge">Best Time: <b>${bestTimeStr}</b></div>
          <div class="record-badge">Best Moves: <b>${record.minMoves || '--'}</b></div>
        `;
      }

      overlay.style.display = 'flex';
    }
  }

  destroy() {
    this.stopTimer();
    this.container.innerHTML = '';
  }
}

window.MemoryGame = MemoryGame;

