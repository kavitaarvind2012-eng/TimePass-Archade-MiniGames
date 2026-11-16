/**
 * 2048 Sliding Puzzle Game
 * Features: Undo history, swipe/arrow controls, smooth tile animations, high score.
 */
class Puzzle2048Game {
  constructor(container) {
    this.container = container;
    this.size = 4;
    this.board = [];
    this.score = 0;
    this.bestScore = window.storageManager.getHighScore('puzzle2048') || 0;
    this.history = []; // [{ board, score }]
    this.won = false;
    this.keepPlaying = false;
    this.isGameOver = false;

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.boundKeyDown = this.handleKeyDown.bind(this);

    this.renderDOM();
    this.initGame();
    this.bindEvents();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper puzzle-wrapper">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">SCORE</span>
            <span class="hud-val" id="p2048-score">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">BEST</span>
            <span class="hud-val" id="p2048-best">${this.bestScore}</span>
          </div>
          <div class="hud-actions">
            <button class="btn btn-sm btn-secondary" id="p2048-undo-btn" title="Undo Last Move" disabled>
              ⏪ Undo
            </button>
            <button class="btn btn-sm btn-icon" id="p2048-restart-btn" title="New Game">
              🔄
            </button>
          </div>
        </div>

        <div class="p2048-board-container">
          <div class="p2048-grid" id="p2048-grid">
            <!-- 16 cells -->
          </div>

          <div class="game-overlay" id="p2048-overlay" style="display: none;">
            <div class="overlay-card">
              <h2 id="p2048-overlay-title">GAME OVER</h2>
              <p id="p2048-overlay-desc">No more valid moves!</p>
              <div class="overlay-buttons">
                <button class="btn btn-secondary" id="p2048-overlay-undo-btn">Undo Move</button>
                <button class="btn btn-primary" id="p2048-play-again-btn">Try Again</button>
                <button class="btn btn-accent" id="p2048-keep-going-btn" style="display: none;">Keep Playing</button>
              </div>
            </div>
          </div>
        </div>

        <div class="game-controls-hint">
          <span>Use <b>Arrow Keys</b> or <b>Swipe</b> on mobile. Combine numbers to reach <b>2048</b>!</span>
        </div>
      </div>
    `;
  }

  initGame() {
    this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.score = 0;
    this.history = [];
    this.won = false;
    this.keepPlaying = false;
    this.isGameOver = false;

    this.spawnRandomTile();
    this.spawnRandomTile();
    this.renderBoard();
    this.updateHUD();
    document.getElementById('p2048-overlay').style.display = 'none';
    this.updateUndoButton();
  }

  bindEvents() {
    window.addEventListener('keydown', this.boundKeyDown);

    document.getElementById('p2048-restart-btn').addEventListener('click', () => this.initGame());
    document.getElementById('p2048-play-again-btn').addEventListener('click', () => this.initGame());
    document.getElementById('p2048-undo-btn').addEventListener('click', () => this.undo());
    document.getElementById('p2048-overlay-undo-btn').addEventListener('click', () => {
      document.getElementById('p2048-overlay').style.display = 'none';
      this.undo();
    });

    const keepGoingBtn = document.getElementById('p2048-keep-going-btn');
    keepGoingBtn.addEventListener('click', () => {
      this.keepPlaying = true;
      document.getElementById('p2048-overlay').style.display = 'none';
    });

    // Touch events for mobile swipe
    const gridEl = document.getElementById('p2048-grid');
    gridEl.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    gridEl.addEventListener('touchend', (e) => {
      if (e.changedTouches.length > 0) {
        const dx = e.changedTouches[0].clientX - this.touchStartX;
        const dy = e.changedTouches[0].clientY - this.touchStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (Math.max(absX, absY) > 30) {
          if (absX > absY) {
            this.move(dx > 0 ? 'right' : 'left');
          } else {
            this.move(dy > 0 ? 'down' : 'up');
          }
        }
      }
    }, { passive: true });
  }

  handleKeyDown(e) {
    if (this.isGameOver && !this.keepPlaying) return;

    let moved = false;
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        moved = this.move('left');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        moved = this.move('right');
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        moved = this.move('up');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        moved = this.move('down');
        break;
      case 'z':
      case 'Z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.undo();
        }
        break;
    }
  }

  saveHistory() {
    const cloneBoard = this.board.map((row) => [...row]);
    this.history.push({
      board: cloneBoard,
      score: this.score
    });
    // Keep last 15 moves
    if (this.history.length > 15) {
      this.history.shift();
    }
    this.updateUndoButton();
  }

  undo() {
    if (this.history.length === 0) return;
    const prev = this.history.pop();
    this.board = prev.board.map((row) => [...row]);
    this.score = prev.score;
    this.isGameOver = false;

    window.audioEngine.flip();
    window.storageManager.unlock('puzzle_undo');

    this.renderBoard();
    this.updateHUD();
    this.updateUndoButton();
  }

  updateUndoButton() {
    const undoBtn = document.getElementById('p2048-undo-btn');
    if (undoBtn) {
      undoBtn.disabled = this.history.length === 0;
    }
  }

  spawnRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length === 0) return false;

    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    this.board[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
    return cell;
  }

  move(dir) {
    if (this.isGameOver && !this.keepPlaying) return false;

    let previousBoard = this.board.map((row) => [...row]);
    let mergedAny = false;
    let highestMerged = 0;

    const rotate = (matrix) => {
      return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
    };

    // Transform board so all moves act as slideLeft
    let current = this.board.map((row) => [...row]);
    let rotations = 0;
    if (dir === 'up') rotations = 3;
    if (dir === 'right') rotations = 2;
    if (dir === 'down') rotations = 1;

    for (let i = 0; i < rotations; i++) {
      current = rotate(current);
    }

    // Slide and merge rows to left
    let addedScore = 0;
    for (let r = 0; r < this.size; r++) {
      let row = current[r].filter((val) => val !== 0);
      let mergedRow = [];
      for (let i = 0; i < row.length; i++) {
        if (i < row.length - 1 && row[i] === row[i + 1]) {
          const newVal = row[i] * 2;
          mergedRow.push(newVal);
          addedScore += newVal;
          if (newVal > highestMerged) highestMerged = newVal;
          mergedAny = true;
          i++;
        } else {
          mergedRow.push(row[i]);
        }
      }
      while (mergedRow.length < this.size) {
        mergedRow.push(0);
      }
      current[r] = mergedRow;
    }

    // Rotate back
    const reverseRotations = (4 - rotations) % 4;
    for (let i = 0; i < reverseRotations; i++) {
      current = rotate(current);
    }

    // Check if board changed
    let hasChanged = false;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (current[r][c] !== previousBoard[r][c]) {
          hasChanged = true;
          break;
        }
      }
    }

    if (!hasChanged) return false;

    // Save previous state to history
    this.saveHistory();

    this.board = current;
    this.score += addedScore;

    if (mergedAny) {
      window.audioEngine.merge(highestMerged);
    } else {
      window.audioEngine.key();
    }

    // Spawn new tile
    this.spawnRandomTile();
    this.renderBoard();
    this.updateHUD();

    // Check Win
    let maxTile = this.getMaxTile();
    if (!this.won && !this.keepPlaying && maxTile >= 2048) {
      this.won = true;
      window.audioEngine.win();
      this.showWinBanner();
    }

    // Check Game Over
    if (!this.canMove()) {
      this.isGameOver = true;
      window.audioEngine.gameOver();
      this.showGameOverBanner();
    }

    window.storageManager.set2048Score(this.score, maxTile);
    return true;
  }

  getMaxTile() {
    let max = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] > max) max = this.board[r][c];
      }
    }
    return max;
  }

  canMove() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === 0) return true;
        if (c < this.size - 1 && this.board[r][c] === this.board[r][c + 1]) return true;
        if (r < this.size - 1 && this.board[r][c] === this.board[r + 1][c]) return true;
      }
    }
    return false;
  }

  showWinBanner() {
    const overlay = document.getElementById('p2048-overlay');
    const title = document.getElementById('p2048-overlay-title');
    const desc = document.getElementById('p2048-overlay-desc');
    const keepGoing = document.getElementById('p2048-keep-going-btn');

    if (overlay && title) {
      title.textContent = '🎉 2048 REACHED!';
      desc.textContent = `Magnificent! Score: ${this.score}`;
      if (keepGoing) keepGoing.style.display = 'inline-block';
      overlay.style.display = 'flex';
    }
  }

  showGameOverBanner() {
    const overlay = document.getElementById('p2048-overlay');
    const title = document.getElementById('p2048-overlay-title');
    const desc = document.getElementById('p2048-overlay-desc');
    const keepGoing = document.getElementById('p2048-keep-going-btn');

    if (overlay && title) {
      title.textContent = 'GAME OVER';
      desc.textContent = `No moves left! Final Score: ${this.score}`;
      if (keepGoing) keepGoing.style.display = 'none';
      overlay.style.display = 'flex';
    }
  }

  updateHUD() {
    const scoreEl = document.getElementById('p2048-score');
    const bestEl = document.getElementById('p2048-best');
    if (scoreEl) scoreEl.textContent = this.score;
    if (bestEl) bestEl.textContent = Math.max(this.score, this.bestScore);
  }

  renderBoard() {
    const grid = document.getElementById('p2048-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.board[r][c];
        const cell = document.createElement('div');
        cell.className = 'p2048-cell';

        if (val > 0) {
          const tile = document.createElement('div');
          tile.className = `p2048-tile tile-${val}`;
          tile.textContent = val;
          if (val > 2048) tile.classList.add('tile-super');
          cell.appendChild(tile);
        }

        grid.appendChild(cell);
      }
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.boundKeyDown);
    this.container.innerHTML = '';
  }
}

window.Puzzle2048Game = Puzzle2048Game;

