/**
 * TimePass Arcade - New Brain & Puzzle Games Pack (13 Games)
 * 1. Tic-Tac-Toe Unbeatable (Minimax AI + 2P)
 * 2. Simon Tone Sequence
 * 3. Minesweeper Mini (9x9)
 * 4. Math Blitz 30s
 * 5. Falling Word Typer
 * 6. Procedural Maze Runner
 * 7. Neon Hangman
 * 8. Blackjack 21
 * 9. 4-Digit Vault Cracker
 * 10. 15-Tile Number Slide
 * 11. Lights Out Grid (5x5)
 * 12. Connect Four (7x6)
 * 13. Hi-Lo Card Streak
 */

// ============================================================================
// 1. TIC-TAC-TOE UNBEATABLE (Brain & Puzzle)
// ============================================================================
class TicTacToeGame {
  constructor(container, options = {}) {
    this.container = container;
    this.board = Array(9).fill(null);
    this.online = Boolean(options.online && options.network);
    this.network = options.network || null;
    this.isHost = Boolean(options.isHost);
    this.playerMark = this.isHost ? 'X' : 'O';
    this.mode = this.online ? 'online' : 'ai';
    this.turn = 'X';
    this.isOver = false;
    this.stats = { x: 0, o: 0, ties: 0 };

    this.renderDOM();
    this.bindEvents();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper ttt-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">TURN</span><span class="hud-val" id="ttt-turn">X</span></div>
          <div class="hud-item"><span class="hud-label">X WINS</span><span class="hud-val" id="ttt-x-wins">0</span></div>
          <div class="hud-item"><span class="hud-label">O WINS</span><span class="hud-val" id="ttt-o-wins">0</span></div>
          <div class="hud-item"><span class="hud-label">TIES</span><span class="hud-val" id="ttt-ties">0</span></div>
          <div class="hud-actions">
            <button class="btn btn-sm btn-secondary active" id="ttt-mode-ai">vs AI</button>
            <button class="btn btn-sm btn-secondary" id="ttt-mode-2p">2-Player</button>
            <button class="btn btn-sm btn-secondary" id="ttt-online-btn">🌐 Play Online vs Friend</button>
            <button class="btn btn-sm btn-icon" id="ttt-reset">🔄</button>
          </div>
        </div>
        <div class="ttt-grid" id="ttt-grid">
          ${Array(9).fill(0).map((_, i) => `<button class="ttt-cell" data-idx="${i}"></button>`).join('')}
        </div>
        <div class="game-controls-hint"><span id="ttt-status">Play against the unbeatable Minimax AI!</span></div>
      </div>
    `;
  }

  bindEvents() {
    this.container.querySelectorAll('.ttt-cell').forEach((cell) => {
      cell.addEventListener('click', () => {
        const idx = parseInt(cell.getAttribute('data-idx'));
        this.makeMove(idx);
      });
    });

    document.getElementById('ttt-online-btn').addEventListener('click', () => window.arcadeApp.openMultiplayerModal('ttt'));
    document.getElementById('ttt-mode-ai').addEventListener('click', (e) => {
      this.mode = 'ai';
      e.target.classList.add('active');
      document.getElementById('ttt-mode-2p').classList.remove('active');
      this.reset();
    });

    document.getElementById('ttt-mode-2p').addEventListener('click', (e) => {
      this.mode = '2p';
      e.target.classList.add('active');
      document.getElementById('ttt-mode-ai').classList.remove('active');
      this.reset();
    });

    document.getElementById('ttt-reset').addEventListener('click', () => this.reset());
    if (this.online) {
      document.getElementById('ttt-mode-ai').style.display = 'none';
      document.getElementById('ttt-mode-2p').style.display = 'none';
      document.getElementById('ttt-status').textContent = `Online duel: you are ${this.playerMark}.`;
    }
  }

  reset(isRemote = false) {
    this.board = Array(9).fill(null);
    this.turn = 'X';
    this.isOver = false;
    document.querySelectorAll('.ttt-cell').forEach((c) => {
      c.textContent = '';
      c.className = 'ttt-cell';
    });
    document.getElementById('ttt-turn').textContent = 'X';
    document.getElementById('ttt-status').textContent = this.online
      ? `Online duel: you are ${this.playerMark}.`
      : this.mode === 'ai' ? 'Play against the unbeatable Minimax AI!' : 'Player 1 (X) vs Player 2 (O)';
    if (this.online && !isRemote) this.network.sendMove({ game: 'ttt', action: 'reset' });
  }

  handleNetworkMessage(payload) {
    const data = payload?.data;
    if (!this.online || payload.type !== 'move' || data?.game !== 'ttt') return;
    if (data.action === 'move' && Number.isInteger(data.idx) && data.idx >= 0 && data.idx < 9) {
      this.makeMove(data.idx, true);
    } else if (data.action === 'reset') {
      this.reset(true);
    }
  }

  makeMove(idx, isRemote = false) {
    if (this.board[idx] || this.isOver) return;
    if (this.online && (isRemote ? this.turn === this.playerMark : this.turn !== this.playerMark)) return;
    this.board[idx] = this.turn;
    if (this.online && !isRemote) this.network.sendMove({ game: 'ttt', action: 'move', idx });
    const cell = this.container.querySelector(`.ttt-cell[data-idx="${idx}"]`);
    cell.textContent = this.turn;
    cell.classList.add(this.turn === 'X' ? 'cell-x' : 'cell-o');
    window.audioEngine.click('blue');

    const winner = this.checkWinner(this.board);
    if (winner) {
      this.endGame(winner);
      return;
    }

    if (this.board.every(Boolean)) {
      this.endGame('tie');
      return;
    }

    this.turn = this.turn === 'X' ? 'O' : 'X';
    document.getElementById('ttt-turn').textContent = this.turn;
    if (this.online) {
      document.getElementById('ttt-status').textContent =
        this.turn === this.playerMark ? 'Your turn.' : 'Opponent is thinking...';
      return;
    }

    if (this.mode === 'ai' && this.turn === 'O') {
      setTimeout(() => this.aiMove(), 250);
    }
  }

  aiMove() {
    if (this.isOver) return;
    const bestIndex = this.minimax(this.board, 'O').index;
    this.makeMove(bestIndex);
  }

  minimax(newBoard, player) {
    const avail = [];
    newBoard.forEach((v, i) => { if (!v) avail.push(i); });

    const win = this.checkWinner(newBoard);
    if (win === 'X') return { score: -10 };
    if (win === 'O') return { score: 10 };
    if (avail.length === 0) return { score: 0 };

    const moves = [];
    for (let i = 0; i < avail.length; i++) {
      const idx = avail[i];
      const move = { index: idx };
      newBoard[idx] = player;
      if (player === 'O') {
        const result = this.minimax(newBoard, 'X');
        move.score = result.score;
      } else {
        const result = this.minimax(newBoard, 'O');
        move.score = result.score;
      }
      newBoard[idx] = null;
      moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
      let bestScore = -10000;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score > bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    } else {
      let bestScore = 10000;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score < bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    }
    return moves[bestMove];
  }

  checkWinner(b) {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (const [x,y,z] of lines) {
      if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x];
    }
    return null;
  }

  endGame(winner) {
    this.isOver = true;
    const statusEl = document.getElementById('ttt-status');
    if (winner === 'tie') {
      this.stats.ties++;
      document.getElementById('ttt-ties').textContent = this.stats.ties;
      statusEl.textContent = 'GAME TIED! Stalemate.';
      window.audioEngine.paddle();
      if (this.mode === 'ai') window.storageManager.unlock('ttt_master');
    } else {
      if (winner === 'X') {
        this.stats.x++;
        document.getElementById('ttt-x-wins').textContent = this.stats.x;
        statusEl.textContent = this.online
          ? (this.playerMark === 'X' ? 'YOU WIN!' : 'OPPONENT WINS!')
          : 'PLAYER X WINS!';
        window.audioEngine.win();
        if (this.mode === 'ai') window.storageManager.unlock('ttt_master');
      } else {
        this.stats.o++;
        document.getElementById('ttt-o-wins').textContent = this.stats.o;
        statusEl.textContent = this.online
          ? (this.playerMark === 'O' ? 'YOU WIN!' : 'OPPONENT WINS!')
          : 'AI (O) WINS!';
        if (this.online && this.playerMark === 'O') window.audioEngine.win();
        else window.audioEngine.gameOver();
      }
    }
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
window.TicTacToeGame = TicTacToeGame;

// ============================================================================
// 2. SIMON TONE SEQUENCE (Brain & Puzzle)
// ============================================================================
class SimonGame {
  constructor(container) {
    this.container = container;
    this.sequence = [];
    this.playerStep = 0;
    this.freqs = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
    this.score = 0;
    this.best = window.storageManager.getHighScore('simon', 0);
    this.isPlayingSequence = false;

    this.renderDOM();
    this.bindEvents();
    this.startRound();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper simon-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">LENGTH</span><span class="hud-val" id="simon-len">0</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.best}</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="simon-reset">🔄</button></div>
        </div>
        <div class="simon-circle">
          <button class="simon-pad pad-0" data-idx="0"></button>
          <button class="simon-pad pad-1" data-idx="1"></button>
          <button class="simon-pad pad-2" data-idx="2"></button>
          <button class="simon-pad pad-3" data-idx="3"></button>
          <div class="simon-center"><span id="simon-center-text">LISTEN</span></div>
        </div>
        <div class="game-controls-hint"><span>Watch and memorize the harmonic sequence, then repeat it!</span></div>
      </div>
    `;
  }

  bindEvents() {
    this.container.querySelectorAll('.simon-pad').forEach((pad) => {
      pad.addEventListener('click', () => {
        if (this.isPlayingSequence) return;
        const idx = parseInt(pad.getAttribute('data-idx'));
        this.handlePlayerInput(idx);
      });
    });
    document.getElementById('simon-reset').addEventListener('click', () => {
      this.sequence = [];
      this.startRound();
    });
  }

  startRound() {
    this.playerStep = 0;
    this.sequence.push(Math.floor(Math.random() * 4));
    document.getElementById('simon-len').textContent = this.sequence.length;
    this.playSequence();
  }

  playSequence() {
    this.isPlayingSequence = true;
    document.getElementById('simon-center-text').textContent = 'LISTEN';
    let i = 0;
    const interval = setInterval(() => {
      if (i >= this.sequence.length) {
        clearInterval(interval);
        this.isPlayingSequence = false;
        document.getElementById('simon-center-text').textContent = 'YOUR TURN';
        return;
      }
      this.flashPad(this.sequence[i]);
      i++;
    }, 600);
  }

  flashPad(idx) {
    const pad = this.container.querySelector(`.simon-pad[data-idx="${idx}"]`);
    if (pad) {
      pad.classList.add('lit');
      window.audioEngine.tone(this.freqs[idx], 0.35, 'triangle');
      setTimeout(() => pad.classList.remove('lit'), 350);
    }
  }

  handlePlayerInput(idx) {
    this.flashPad(idx);
    if (idx === this.sequence[this.playerStep]) {
      this.playerStep++;
      if (this.playerStep === this.sequence.length) {
        this.score = this.sequence.length;
        if (this.score >= 7) window.storageManager.unlock('simon_seq');
        window.storageManager.setGameScore('simon', this.score);
        setTimeout(() => this.startRound(), 800);
      }
    } else {
      // Wrong!
      window.audioEngine.buzzer();
      document.getElementById('simon-center-text').textContent = 'WRONG!';
      this.sequence = [];
      setTimeout(() => this.startRound(), 1200);
    }
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
window.SimonGame = SimonGame;

// ============================================================================
// 3. MINESWEEPER MINI 9x9 (Brain & Puzzle)
// ============================================================================
class MinesweeperGame {
  constructor(container) {
    this.container = container;
    this.size = 9;
    this.mineCount = 10;
    this.grid = [];
    this.flagsLeft = 10;
    this.firstClick = true;
    this.isOver = false;
    this.timer = 0;
    this.timerInterval = null;
    this.best = window.storageManager.getHighScore('minesweeper', '--');

    this.renderDOM();
    this.bindEvents();
    this.initGrid();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper mine-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">MINES</span><span class="hud-val" id="mine-flags">10</span></div>
          <div class="hud-item"><span class="hud-label">TIME</span><span class="hud-val" id="mine-timer">00:00</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.best}s</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="mine-reset">🔄</button></div>
        </div>
        <div class="mine-grid" id="mine-grid"></div>
        <div class="game-controls-hint"><span>Left-click to reveal. Right-click or hold to plant a flag 🚩.</span></div>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('mine-reset').addEventListener('click', () => {
      this.initGrid();
    });
  }

  initGrid() {
    clearInterval(this.timerInterval);
    this.timer = 0;
    this.timerInterval = null;
    this.flagsLeft = this.mineCount;
    this.firstClick = true;
    this.isOver = false;
    document.getElementById('mine-flags').textContent = this.flagsLeft;
    document.getElementById('mine-timer').textContent = '00:00';

    this.grid = [];
    const gridEl = document.getElementById('mine-grid');
    gridEl.innerHTML = '';

    for (let r = 0; r < this.size; r++) {
      const row = [];
      for (let c = 0; c < this.size; c++) {
        const cell = { r, c, isMine: false, isRevealed: false, isFlagged: false, count: 0 };
        const btn = document.createElement('button');
        btn.className = 'mine-cell';
        btn.addEventListener('click', () => this.revealCell(r, c));
        btn.addEventListener('contextmenu', (e) => { e.preventDefault(); this.toggleFlag(r, c); });
        gridEl.appendChild(btn);
        cell.el = btn;
        row.push(cell);
      }
      this.grid.push(row);
    }
  }

  plantMines(safeR, safeC) {
    let placed = 0;
    while (placed < this.mineCount) {
      const r = Math.floor(Math.random() * this.size);
      const c = Math.floor(Math.random() * this.size);
      if (!this.grid[r][c].isMine && (Math.abs(r - safeR) > 1 || Math.abs(c - safeC) > 1)) {
        this.grid[r][c].isMine = true;
        placed++;
      }
    }
    // Calculate numbers
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.grid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size && this.grid[nr][nc].isMine) {
                count++;
              }
            }
          }
          this.grid[r][c].count = count;
        }
      }
    }
  }

  revealCell(r, c) {
    if (this.isOver) return;
    const cell = this.grid[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    if (this.firstClick) {
      this.firstClick = false;
      this.plantMines(r, c);
      this.startTimer();
    }

    if (cell.isMine) {
      // Game Over
      this.isOver = true;
      clearInterval(this.timerInterval);
      window.audioEngine.explosion();
      this.revealAll();
      return;
    }

    cell.isRevealed = true;
    cell.el.classList.add('revealed');
    window.audioEngine.click('red');

    if (cell.count > 0) {
      cell.el.textContent = cell.count;
      cell.el.classList.add(`m-${cell.count}`);
    } else {
      // Flood fill zeros
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
            this.revealCell(nr, nc);
          }
        }
      }
    }
    this.checkWin();
  }

  toggleFlag(r, c) {
    if (this.isOver) return;
    const cell = this.grid[r][c];
    if (cell.isRevealed) return;
    cell.isFlagged = !cell.isFlagged;
    cell.el.textContent = cell.isFlagged ? '🚩' : '';
    this.flagsLeft += cell.isFlagged ? -1 : 1;
    document.getElementById('mine-flags').textContent = this.flagsLeft;
    window.audioEngine.paddle();
  }

  checkWin() {
    let unrevealedSafe = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.grid[r][c].isMine && !this.grid[r][c].isRevealed) unrevealedSafe++;
      }
    }
    if (unrevealedSafe === 0) {
      this.isOver = true;
      clearInterval(this.timerInterval);
      window.audioEngine.win();
      window.storageManager.unlock('minesweeper_win');
      window.storageManager.setGameScore('minesweeper', this.timer);
    }
  }

  revealAll() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = this.grid[r][c];
        if (cell.isMine) {
          cell.el.textContent = '💣';
          cell.el.classList.add('mine');
        }
      }
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timer++;
      const m = String(Math.floor(this.timer / 60)).padStart(2, '0');
      const s = String(this.timer % 60).padStart(2, '0');
      document.getElementById('mine-timer').textContent = `${m}:${s}`;
    }, 1000);
  }

  destroy() {
    clearInterval(this.timerInterval);
    this.container.innerHTML = '';
  }
}
window.MinesweeperGame = MinesweeperGame;

// ============================================================================
// 4. MATH BLITZ 30S (Brain & Puzzle)
// ============================================================================
class MathBlitzGame {
  constructor(container) {
    this.container = container;
    this.score = 0;
    this.streak = 0;
    this.timeLeft = 30;
    this.timer = null;
    this.currentAnswer = 0;
    this.best = window.storageManager.getHighScore('math_blitz', 0);

    this.renderDOM();
    this.bindEvents();
    this.startGame();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper math-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">TIME</span><span class="hud-val" id="math-time">30s</span></div>
          <div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-val" id="math-score">0</span></div>
          <div class="hud-item"><span class="hud-label">STREAK</span><span class="hud-val" id="math-streak">0 🔥</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.best}</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="math-reset">🔄</button></div>
        </div>
        <div class="math-card">
          <h2 class="math-problem" id="math-equation">12 + 8 = ?</h2>
          <div class="math-options" id="math-options"></div>
        </div>
        <div class="game-controls-hint"><span>Solve quick mental math arithmetic before the 30s timer runs out!</span></div>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('math-reset').addEventListener('click', () => this.startGame());
  }

  startGame() {
    if (this.timer) clearInterval(this.timer);
    this.score = 0;
    this.streak = 0;
    this.timeLeft = 30;
    document.getElementById('math-score').textContent = '0';
    document.getElementById('math-streak').textContent = '0 🔥';
    document.getElementById('math-time').textContent = '30s';

    this.nextProblem();

    this.timer = setInterval(() => {
      this.timeLeft--;
      document.getElementById('math-time').textContent = `${this.timeLeft}s`;
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        window.audioEngine.gameOver();
        document.getElementById('math-equation').textContent = 'TIME EXPIRED!';
        document.getElementById('math-options').innerHTML = '';
      }
    }, 1000);
  }

  nextProblem() {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 20) + 1;
    let b = Math.floor(Math.random() * 15) + 1;

    if (op === '+') this.currentAnswer = a + b;
    else if (op === '-') { if (a < b) [a, b] = [b, a]; this.currentAnswer = a - b; }
    else { a = Math.floor(Math.random() * 10) + 2; b = Math.floor(Math.random() * 9) + 2; this.currentAnswer = a * b; }

    document.getElementById('math-equation').textContent = `${a} ${op} ${b} = ?`;

    const answers = [this.currentAnswer];
    while (answers.length < 4) {
      const wrong = this.currentAnswer + (Math.floor(Math.random() * 10) - 5);
      if (wrong >= 0 && !answers.includes(wrong)) answers.push(wrong);
    }
    answers.sort(() => Math.random() - 0.5);

    const optEl = document.getElementById('math-options');
    optEl.innerHTML = '';
    answers.forEach((ans) => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary btn-lg math-opt-btn';
      btn.textContent = ans;
      btn.addEventListener('click', () => this.checkAnswer(ans));
      optEl.appendChild(btn);
    });
  }

  checkAnswer(chosen) {
    if (this.timeLeft <= 0) return;
    if (chosen === this.currentAnswer) {
      this.streak++;
      const mult = Math.min(4, 1 + Math.floor(this.streak / 4));
      this.score += 100 * mult;
      window.audioEngine.coin();
      if (this.streak >= 12) window.storageManager.unlock('math_streak');
      window.storageManager.setGameScore('math_blitz', this.score);
    } else {
      this.streak = 0;
      this.timeLeft = Math.max(0, this.timeLeft - 2);
      window.audioEngine.buzzer();
    }
    document.getElementById('math-score').textContent = this.score;
    document.getElementById('math-streak').textContent = `${this.streak} 🔥`;
    this.nextProblem();
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    this.container.innerHTML = '';
  }
}
window.MathBlitzGame = MathBlitzGame;

// ============================================================================
// 5. FALLING WORD TYPER (Brain & Puzzle)
// ============================================================================
class WordTyperGame {
  constructor(container) {
    this.container = container;
    this.words = ['NEON', 'CYBER', 'LASER', 'PIXEL', 'ROBOT', 'SPARK', 'SPEED', 'QUANTUM', 'ARCADE', 'ROCKET', 'ENERGY', 'VIRTUAL'];
    this.activeWords = [];
    this.score = 0;
    this.zapped = 0;
    this.currentInput = '';
    this.best = window.storageManager.getHighScore('word_typer', 0);
    this.animId = null;

    this.renderDOM();
    this.bindEvents();
    this.startLoop();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper typer-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-val" id="typer-score">0</span></div>
          <div class="hud-item"><span class="hud-label">TYPING</span><span class="hud-val hud-accent" id="typer-curr">_</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.best}</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="typer-reset">🔄</button></div>
        </div>
        <div class="typer-canvas-wrap">
          <canvas id="typer-canvas" width="540" height="420"></canvas>
        </div>
        <div class="game-controls-hint"><span>Type the falling words on your keyboard to vaporize them before they cross the line!</span></div>
      </div>
    `;
    this.canvas = document.getElementById('typer-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    this.boundKey = (e) => {
      if (/^[a-zA-Z]$/.test(e.key)) {
        this.currentInput += e.key.toUpperCase();
        document.getElementById('typer-curr').textContent = this.currentInput;
        this.checkWordMatch();
      } else if (e.key === 'Backspace') {
        this.currentInput = this.currentInput.slice(0, -1);
        document.getElementById('typer-curr').textContent = this.currentInput || '_';
      }
    };
    window.addEventListener('keydown', this.boundKey);
    document.getElementById('typer-reset').addEventListener('click', () => {
      this.activeWords = [];
      this.score = 0;
      this.zapped = 0;
      this.currentInput = '';
      document.getElementById('typer-score').textContent = '0';
    });
  }

  checkWordMatch() {
    const matchIdx = this.activeWords.findIndex((w) => w.text === this.currentInput);
    if (matchIdx !== -1) {
      window.audioEngine.laser();
      this.activeWords.splice(matchIdx, 1);
      this.score += 150;
      this.zapped++;
      this.currentInput = '';
      document.getElementById('typer-curr').textContent = '_';
      document.getElementById('typer-score').textContent = this.score;
      if (this.zapped >= 15) window.storageManager.unlock('typer_speed');
      window.storageManager.setGameScore('word_typer', this.score);
    }
  }

  startLoop() {
    let spawnTimer = 0;
    const loop = () => {
      spawnTimer++;
      if (spawnTimer > 75) {
        spawnTimer = 0;
        const text = this.words[Math.floor(Math.random() * this.words.length)];
        this.activeWords.push({
          text: text,
          x: 40 + Math.random() * (this.canvas.width - 120),
          y: -10,
          speed: 1.2 + Math.random() * 0.8
        });
      }

      for (let i = this.activeWords.length - 1; i >= 0; i--) {
        this.activeWords[i].y += this.activeWords[i].speed;
        if (this.activeWords[i].y > this.canvas.height - 30) {
          window.audioEngine.miss();
          this.activeWords.splice(i, 1);
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
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Defense line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.canvas.height - 30);
    ctx.lineTo(this.canvas.width, this.canvas.height - 30);
    ctx.stroke();

    // Words
    ctx.font = 'bold 18px monospace';
    this.activeWords.forEach((w) => {
      ctx.fillStyle = '#00ffcc';
      ctx.fillText(w.text, w.x, w.y);
    });
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this.boundKey);
    this.container.innerHTML = '';
  }
}
window.WordTyperGame = WordTyperGame;

// ============================================================================
// 6. PROCEDURAL MAZE RUNNER (Brain & Puzzle)
// ============================================================================
class MazeRunnerGame {
  constructor(container, options = {}) {
    this.container = container;
    this.customConfig = options.customConfig?.type === 'maze' ? options.customConfig : null;
    this.size = 15;
    this.cellSize = 24;
    this.player = { x: 1, y: 1 };
    this.exit = { x: 13, y: 13 };
    this.maze = [];
    this.timer = 0;
    this.timerInterval = null;

    this.renderDOM();
    this.bindEvents();
    this.generateMaze();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper maze-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">TIME</span><span class="hud-val" id="maze-timer">00:00</span></div>
          <div class="hud-item"><span class="hud-label">STATUS</span><span class="hud-val" id="maze-status">RUNNING</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="maze-reset">🔄</button></div>
        </div>
        <canvas id="maze-canvas" width="360" height="360"></canvas>
        <div class="mobile-dpad">
          <button class="dpad-btn" id="m-up">▲</button>
          <div class="dpad-middle"><button class="dpad-btn" id="m-left">◀</button><button class="dpad-btn" id="m-right">▶</button></div>
          <button class="dpad-btn" id="m-down">▼</button>
        </div>
        <div class="game-controls-hint"><span>Navigate using <b>Arrow Keys or WASD</b> to reach the glowing green portal.</span></div>
      </div>
    `;
    this.canvas = document.getElementById('maze-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    this.boundKey = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') this.move(0, -1);
      else if (e.key === 'ArrowDown' || e.key === 's') this.move(0, 1);
      else if (e.key === 'ArrowLeft' || e.key === 'a') this.move(-1, 0);
      else if (e.key === 'ArrowRight' || e.key === 'd') this.move(1, 0);
    };
    window.addEventListener('keydown', this.boundKey);
    document.getElementById('maze-reset').addEventListener('click', () => this.generateMaze());
    document.getElementById('m-up')?.addEventListener('click', () => this.move(0, -1));
    document.getElementById('m-down')?.addEventListener('click', () => this.move(0, 1));
    document.getElementById('m-left')?.addEventListener('click', () => this.move(-1, 0));
    document.getElementById('m-right')?.addEventListener('click', () => this.move(1, 0));
  }

  generateMaze() {
    clearInterval(this.timerInterval);
    this.timer = 0;
    document.getElementById('maze-status').textContent = 'RUNNING';

    if (this.customConfig) {
      this.maze = this.customConfig.mazeGrid.map((row) => row.map((cell) => cell === 1 ? 1 : 0));
      this.player = { x: this.customConfig.start[1], y: this.customConfig.start[0] };
      this.exit = { x: this.customConfig.exit[1], y: this.customConfig.exit[0] };
    } else {
      this.maze = Array(this.size).fill(null).map(() => Array(this.size).fill(1));
      const stack = [{ x: 1, y: 1 }];
      this.maze[1][1] = 0;

      while (stack.length > 0) {
        const cur = stack[stack.length - 1];
        const neighbors = [];
        const dirs = [[0,-2],[0,2],[-2,0],[2,0]];
        dirs.forEach(([dx, dy]) => {
          const nx = cur.x + dx;
          const ny = cur.y + dy;
          if (nx > 0 && nx < this.size - 1 && ny > 0 && ny < this.size - 1 && this.maze[ny][nx] === 1) {
            neighbors.push({ x: nx, y: ny, wallX: cur.x + dx / 2, wallY: cur.y + dy / 2 });
          }
        });

        if (neighbors.length > 0) {
          const next = neighbors[Math.floor(Math.random() * neighbors.length)];
          this.maze[next.wallY][next.wallX] = 0;
          this.maze[next.y][next.x] = 0;
          stack.push(next);
        } else {
          stack.pop();
        }
      }

      this.player = { x: 1, y: 1 };
      this.exit = { x: this.size - 2, y: this.size - 2 };
      this.maze[this.exit.y][this.exit.x] = 0;
    }

    this.timerInterval = setInterval(() => {
      this.timer++;
      const m = String(Math.floor(this.timer / 60)).padStart(2, '0');
      const s = String(this.timer % 60).padStart(2, '0');
      document.getElementById('maze-timer').textContent = `${m}:${s}`;
    }, 1000);

    this.draw();
  }

  move(dx, dy) {
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    if (this.maze[ny] && this.maze[ny][nx] === 0) {
      this.player.x = nx;
      this.player.y = ny;
      window.audioEngine.key();
      if (this.player.x === this.exit.x && this.player.y === this.exit.y) {
        clearInterval(this.timerInterval);
        window.audioEngine.win();
        window.storageManager.unlock('maze_solved');
        document.getElementById('maze-status').textContent = 'SOLVED! 🎉';
      }
      this.draw();
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.maze[r][c] === 1) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(c * this.cellSize, r * this.cellSize, this.cellSize, this.cellSize);
        }
      }
    }

    // Exit portal
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.fillRect(this.exit.x * this.cellSize + 3, this.exit.y * this.cellSize + 3, this.cellSize - 6, this.cellSize - 6);

    // Player
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.beginPath();
    ctx.arc(this.player.x * this.cellSize + this.cellSize / 2, this.player.y * this.cellSize + this.cellSize / 2, this.cellSize / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  destroy() {
    clearInterval(this.timerInterval);
    window.removeEventListener('keydown', this.boundKey);
    this.container.innerHTML = '';
  }
}
window.MazeRunnerGame = MazeRunnerGame;

// ============================================================================
// 7. NEON HANGMAN (Brain & Puzzle)
// ============================================================================
class HangmanGame {
  constructor(container) {
    this.container = container;
    this.words = ['GALAXY', 'CIRCUIT', 'TERMINAL', 'SYNAPSE', 'SPECTRUM', 'ALGORITHM', 'HORIZON', 'CYBERSPACE', 'AVATAR'];
    this.secret = '';
    this.guessed = new Set();
    this.errors = 0;
    this.maxErrors = 6;

    this.renderDOM();
    this.bindEvents();
    this.reset();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper hangman-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">ERRORS</span><span class="hud-val" id="hang-errors">0/6</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="hang-reset">🔄</button></div>
        </div>
        <div class="hangman-display">
          <svg width="180" height="180" viewBox="0 0 100 100" class="hang-svg" id="hang-svg">
            <line x1="10" y1="95" x2="90" y2="95" stroke="#334155" stroke-width="4"/>
            <line x1="30" y1="95" x2="30" y2="10" stroke="#334155" stroke-width="4"/>
            <line x1="30" y1="10" x2="70" y2="10" stroke="#334155" stroke-width="4"/>
            <line x1="70" y1="10" x2="70" y2="25" stroke="#ffd700" stroke-width="2"/>
            <circle id="h-head" cx="70" cy="35" r="9" stroke="#00ffcc" stroke-width="2.5" fill="none" style="display:none;"/>
            <line id="h-body" x1="70" y1="44" x2="70" y2="65" stroke="#00ffcc" stroke-width="2.5" style="display:none;"/>
            <line id="h-larm" x1="70" y1="50" x2="55" y2="58" stroke="#00ffcc" stroke-width="2.5" style="display:none;"/>
            <line id="h-rarm" x1="70" y1="50" x2="85" y2="58" stroke="#00ffcc" stroke-width="2.5" style="display:none;"/>
            <line id="h-lleg" x1="70" y1="65" x2="56" y2="82" stroke="#00ffcc" stroke-width="2.5" style="display:none;"/>
            <line id="h-rleg" x1="70" y1="65" x2="84" y2="82" stroke="#00ffcc" stroke-width="2.5" style="display:none;"/>
          </svg>
          <div class="hang-word" id="hang-word"></div>
        </div>
        <div class="hang-keyboard" id="hang-kb"></div>
      </div>
    `;
  }

  bindEvents() {
    this.boundKey = (e) => {
      const char = e.key.toUpperCase();
      if (/^[A-Z]$/.test(char)) this.guessLetter(char);
    };
    window.addEventListener('keydown', this.boundKey);
    document.getElementById('hang-reset').addEventListener('click', () => this.reset());
  }

  reset() {
    this.secret = this.words[Math.floor(Math.random() * this.words.length)];
    this.guessed.clear();
    this.errors = 0;
    ['head','body','larm','rarm','lleg','rleg'].forEach((p) => {
      document.getElementById(`h-${p}`).style.display = 'none';
    });
    this.renderWord();
    this.renderKeyboard();
    document.getElementById('hang-errors').textContent = '0/6';
  }

  renderWord() {
    const el = document.getElementById('hang-word');
    el.innerHTML = this.secret.split('').map((ch) => `<span class="hang-slot">${this.guessed.has(ch) ? ch : '_'}</span>`).join('');
  }

  renderKeyboard() {
    const kb = document.getElementById('hang-kb');
    kb.innerHTML = '';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((letter) => {
      const btn = document.createElement('button');
      btn.className = 'hang-key';
      btn.textContent = letter;
      btn.disabled = this.guessed.has(letter);
      btn.addEventListener('click', () => this.guessLetter(letter));
      kb.appendChild(btn);
    });
  }

  guessLetter(letter) {
    if (this.guessed.has(letter) || this.errors >= this.maxErrors) return;
    this.guessed.add(letter);
    if (this.secret.includes(letter)) {
      window.audioEngine.coin();
    } else {
      this.errors++;
      window.audioEngine.miss();
      const parts = ['head','body','larm','rarm','lleg','rleg'];
      if (parts[this.errors - 1]) document.getElementById(`h-${parts[this.errors - 1]}`).style.display = 'block';
    }
    document.getElementById('hang-errors').textContent = `${this.errors}/6`;
    this.renderWord();
    this.renderKeyboard();

    // Check win
    if (this.secret.split('').every((ch) => this.guessed.has(ch))) {
      window.audioEngine.win();
      if (this.errors === 0) window.storageManager.unlock('hangman_saved');
    } else if (this.errors >= this.maxErrors) {
      window.audioEngine.gameOver();
      document.getElementById('hang-word').innerHTML = this.secret.split('').map((ch) => `<span class="hang-slot text-danger">${ch}</span>`).join('');
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.boundKey);
    this.container.innerHTML = '';
  }
}
window.HangmanGame = HangmanGame;

// ============================================================================
// 8. BLACKJACK 21 (Brain & Puzzle)
// ============================================================================
class BlackjackGame {
  constructor(container) {
    this.container = container;
    this.playerHand = [];
    this.dealerHand = [];
    this.balance = 1000;
    this.bet = 50;
    this.isDone = false;

    this.renderDOM();
    this.bindEvents();
    this.newHand();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper bj-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">CHIPS</span><span class="hud-val" id="bj-balance">$1000</span></div>
          <div class="hud-item"><span class="hud-label">BET</span><span class="hud-val" id="bj-bet">$50</span></div>
          <div class="hud-actions">
            <button class="btn btn-sm btn-primary" id="bj-hit">Hit</button>
            <button class="btn btn-sm btn-secondary" id="bj-stand">Stand</button>
            <button class="btn btn-sm btn-icon" id="bj-deal">🔄</button>
          </div>
        </div>
        <div class="bj-table">
          <div class="bj-hand-section">
            <span class="bj-label">DEALER (<span id="bj-dealer-score">0</span>)</span>
            <div class="bj-cards" id="bj-dealer-cards"></div>
          </div>
          <div class="bj-hand-section">
            <span class="bj-label">PLAYER (<span id="bj-player-score">0</span>)</span>
            <div class="bj-cards" id="bj-player-cards"></div>
          </div>
        </div>
        <div class="game-controls-hint"><span id="bj-status">Aim for 21 without busting!</span></div>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('bj-hit').addEventListener('click', () => this.hit());
    document.getElementById('bj-stand').addEventListener('click', () => this.stand());
    document.getElementById('bj-deal').addEventListener('click', () => this.newHand());
  }

  randomCard() {
    const suits = ['♠', '♥', '♦', '♣'];
    const vals = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    return { suit: suits[Math.floor(Math.random() * 4)], val: vals[Math.floor(Math.random() * vals.length)] };
  }

  getScore(hand) {
    let score = 0;
    let aces = 0;
    hand.forEach((c) => {
      if (c.val === 'A') { score += 11; aces++; }
      else if (['K','Q','J'].includes(c.val)) score += 10;
      else score += parseInt(c.val);
    });
    while (score > 21 && aces > 0) { score -= 10; aces--; }
    return score;
  }

  newHand() {
    this.isDone = false;
    this.playerHand = [this.randomCard(), this.randomCard()];
    this.dealerHand = [this.randomCard(), this.randomCard()];
    window.audioEngine.flip();
    this.updateTable();

    if (this.getScore(this.playerHand) === 21) {
      this.balance += this.bet * 1.5;
      window.audioEngine.win();
      window.storageManager.unlock('blackjack_21');
      document.getElementById('bj-status').textContent = 'BLACKJACK! Natural 21.';
      this.isDone = true;
      this.updateTable();
    }
  }

  hit() {
    if (this.isDone) return;
    this.playerHand.push(this.randomCard());
    window.audioEngine.flip();
    const score = this.getScore(this.playerHand);
    if (score > 21) {
      this.isDone = true;
      this.balance -= this.bet;
      window.audioEngine.gameOver();
      document.getElementById('bj-status').textContent = 'BUST! Over 21.';
    }
    this.updateTable();
  }

  stand() {
    if (this.isDone) return;
    this.isDone = true;
    while (this.getScore(this.dealerHand) < 17) {
      this.dealerHand.push(this.randomCard());
    }
    const pScore = this.getScore(this.playerHand);
    const dScore = this.getScore(this.dealerHand);

    if (dScore > 21 || pScore > dScore) {
      this.balance += this.bet;
      window.audioEngine.win();
      document.getElementById('bj-status').textContent = 'YOU WIN!';
    } else if (pScore === dScore) {
      document.getElementById('bj-status').textContent = 'PUSH! Tie game.';
    } else {
      this.balance -= this.bet;
      window.audioEngine.gameOver();
      document.getElementById('bj-status').textContent = 'DEALER WINS!';
    }
    this.updateTable();
  }

  updateTable() {
    document.getElementById('bj-balance').textContent = `$${this.balance}`;
    document.getElementById('bj-player-score').textContent = this.getScore(this.playerHand);
    document.getElementById('bj-dealer-score').textContent = this.isDone ? this.getScore(this.dealerHand) : '?';

    const pEl = document.getElementById('bj-player-cards');
    pEl.innerHTML = this.playerHand.map((c) => `<div class="bj-card ${['♥','♦'].includes(c.suit)?'red':''}">${c.val}${c.suit}</div>`).join('');

    const dEl = document.getElementById('bj-dealer-cards');
    if (this.isDone) {
      dEl.innerHTML = this.dealerHand.map((c) => `<div class="bj-card ${['♥','♦'].includes(c.suit)?'red':''}">${c.val}${c.suit}</div>`).join('');
    } else {
      dEl.innerHTML = `<div class="bj-card ${['♥','♦'].includes(this.dealerHand[0].suit)?'red':''}">${this.dealerHand[0].val}${this.dealerHand[0].suit}</div><div class="bj-card bj-card-back">🂠</div>`;
    }
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
window.BlackjackGame = BlackjackGame;

// ============================================================================
// 9. 4-DIGIT VAULT CRACKER (Brain & Puzzle)
// ============================================================================
class VaultCrackerGame {
  constructor(container) {
    this.container = container;
    this.code = [];
    this.guesses = [];
    this.renderDOM();
    this.bindEvents();
    this.reset();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper vault-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">ATTEMPTS</span><span class="hud-val" id="vault-attempts">0/8</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="vault-reset">🔄</button></div>
        </div>
        <div class="vault-panel">
          <div class="vault-dial-row">
            <input type="number" min="0" max="9" class="vault-digit" id="vd-0" value="1"/>
            <input type="number" min="0" max="9" class="vault-digit" id="vd-1" value="2"/>
            <input type="number" min="0" max="9" class="vault-digit" id="vd-2" value="3"/>
            <input type="number" min="0" max="9" class="vault-digit" id="vd-3" value="4"/>
            <button class="btn btn-primary" id="vault-submit">TEST CODE</button>
          </div>
          <div class="vault-history" id="vault-history"></div>
        </div>
        <div class="game-controls-hint"><span>🟢 Exact Digit & Spot (Bull). 🟡 Correct Digit, Wrong Spot (Cow).</span></div>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('vault-submit').addEventListener('click', () => this.submitGuess());
    document.getElementById('vault-reset').addEventListener('click', () => this.reset());
  }

  reset() {
    this.code = [];
    while (this.code.length < 4) {
      const d = Math.floor(Math.random() * 10);
      if (!this.code.includes(d)) this.code.push(d);
    }
    this.guesses = [];
    document.getElementById('vault-history').innerHTML = '';
    document.getElementById('vault-attempts').textContent = '0/8';
  }

  submitGuess() {
    if (this.guesses.length >= 8) return;
    const guess = [
      parseInt(document.getElementById('vd-0').value) || 0,
      parseInt(document.getElementById('vd-1').value) || 0,
      parseInt(document.getElementById('vd-2').value) || 0,
      parseInt(document.getElementById('vd-3').value) || 0
    ];

    let bulls = 0;
    let cows = 0;
    for (let i = 0; i < 4; i++) {
      if (guess[i] === this.code[i]) bulls++;
      else if (this.code.includes(guess[i])) cows++;
    }

    this.guesses.push({ guess, bulls, cows });
    window.audioEngine.click('blue');

    const hist = document.getElementById('vault-history');
    const row = document.createElement('div');
    row.className = 'vault-row';
    row.innerHTML = `<span class="vr-code">${guess.join('')}</span> <span class="vr-badge vr-green">${bulls} Exact 🟢</span> <span class="vr-badge vr-yellow">${cows} Shifted 🟡</span>`;
    hist.appendChild(row);
    document.getElementById('vault-attempts').textContent = `${this.guesses.length}/8`;

    if (bulls === 4) {
      window.audioEngine.win();
      hist.innerHTML += `<div class="vault-success">VAULT UNLOCKED! Code: ${this.code.join('')}</div>`;
    } else if (this.guesses.length >= 8) {
      window.audioEngine.gameOver();
      hist.innerHTML += `<div class="vault-fail">VAULT LOCKED! Code was: ${this.code.join('')}</div>`;
    }
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
window.VaultCrackerGame = VaultCrackerGame;

// ============================================================================
// 10. 15-TILE NUMBER SLIDE (Brain & Puzzle)
// ============================================================================
class TileSlideGame {
  constructor(container) {
    this.container = container;
    this.board = [];
    this.moves = 0;
    this.renderDOM();
    this.bindEvents();
    this.shuffle();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper slide-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">MOVES</span><span class="hud-val" id="slide-moves">0</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="slide-reset">🔄</button></div>
        </div>
        <div class="slide-grid" id="slide-grid"></div>
        <div class="game-controls-hint"><span>Arrange tiles 1 through 15 in numerical order.</span></div>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('slide-reset').addEventListener('click', () => this.shuffle());
  }

  shuffle() {
    this.moves = 0;
    document.getElementById('slide-moves').textContent = '0';
    this.board = Array.from({ length: 15 }, (_, i) => i + 1);
    this.board.push(0); // 0 is empty

    // Solvable random swaps
    for (let i = 0; i < 120; i++) {
      const emptyIdx = this.board.indexOf(0);
      const adj = this.getAdjacent(emptyIdx);
      const swapIdx = adj[Math.floor(Math.random() * adj.length)];
      [this.board[emptyIdx], this.board[swapIdx]] = [this.board[swapIdx], this.board[emptyIdx]];
    }
    this.renderGrid();
  }

  getAdjacent(idx) {
    const adj = [];
    const r = Math.floor(idx / 4);
    const c = idx % 4;
    if (r > 0) adj.push(idx - 4);
    if (r < 3) adj.push(idx + 4);
    if (c > 0) adj.push(idx - 1);
    if (c < 3) adj.push(idx + 1);
    return adj;
  }

  renderGrid() {
    const gridEl = document.getElementById('slide-grid');
    gridEl.innerHTML = '';
    this.board.forEach((val, idx) => {
      const tile = document.createElement('button');
      tile.className = `slide-tile ${val === 0 ? 'empty' : ''}`;
      tile.textContent = val !== 0 ? val : '';
      tile.addEventListener('click', () => this.clickTile(idx));
      gridEl.appendChild(tile);
    });
  }

  clickTile(idx) {
    const emptyIdx = this.board.indexOf(0);
    const adj = this.getAdjacent(emptyIdx);
    if (adj.includes(idx)) {
      [this.board[emptyIdx], this.board[idx]] = [this.board[idx], this.board[emptyIdx]];
      this.moves++;
      document.getElementById('slide-moves').textContent = this.moves;
      window.audioEngine.paddle();
      this.renderGrid();
      this.checkSolved();
    }
  }

  checkSolved() {
    for (let i = 0; i < 15; i++) {
      if (this.board[i] !== i + 1) return;
    }
    window.audioEngine.win();
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
window.TileSlideGame = TileSlideGame;

// ============================================================================
// 11. LIGHTS OUT GRID (Brain & Puzzle)
// ============================================================================
class LightsOutGame {
  constructor(container) {
    this.container = container;
    this.size = 5;
    this.grid = Array(25).fill(false);
    this.moves = 0;
    this.renderDOM();
    this.bindEvents();
    this.newPuzzle();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper lights-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">MOVES</span><span class="hud-val" id="lights-moves">0</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="lights-reset">🔄</button></div>
        </div>
        <div class="lights-grid" id="lights-grid"></div>
        <div class="game-controls-hint"><span>Clicking a tile toggles itself and its 4 neighbors. Turn all lights OFF!</span></div>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('lights-reset').addEventListener('click', () => this.newPuzzle());
  }

  newPuzzle() {
    this.grid = Array(25).fill(false);
    this.moves = 0;
    document.getElementById('lights-moves').textContent = '0';
    // Random toggles to guarantee solvable
    for (let i = 0; i < 12; i++) {
      const idx = Math.floor(Math.random() * 25);
      this.toggle(idx, false);
    }
    this.renderGrid();
  }

  toggle(idx, countMove = true) {
    const r = Math.floor(idx / 5);
    const c = idx % 5;
    const flips = [[r,c],[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
    flips.forEach(([fr, fc]) => {
      if (fr >= 0 && fr < 5 && fc >= 0 && fc < 5) {
        const i = fr * 5 + fc;
        this.grid[i] = !this.grid[i];
      }
    });
    if (countMove) {
      this.moves++;
      document.getElementById('lights-moves').textContent = this.moves;
      window.audioEngine.click('red');
      this.renderGrid();
      if (this.grid.every((v) => !v)) {
        window.audioEngine.win();
        window.storageManager.unlock('lights_out');
      }
    }
  }

  renderGrid() {
    const gridEl = document.getElementById('lights-grid');
    gridEl.innerHTML = '';
    this.grid.forEach((isOn, idx) => {
      const btn = document.createElement('button');
      btn.className = `light-btn ${isOn ? 'on' : 'off'}`;
      btn.addEventListener('click', () => this.toggle(idx, true));
      gridEl.appendChild(btn);
    });
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
window.LightsOutGame = LightsOutGame;

// ============================================================================
// 12. CONNECT FOUR (Brain & Puzzle)
// ============================================================================
class ConnectFourGame {
  constructor(container, options = {}) {
    this.container = container;
    this.cols = 7;
    this.rows = 6;
    this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.turn = 1; // 1: Red, 2: Yellow (AI)
    this.isOver = false;
    this.online = Boolean(options.online && options.network);
    this.network = options.network || null;
    this.isHost = Boolean(options.isHost);
    this.playerId = this.isHost ? 1 : 2;

    this.renderDOM();
    this.bindEvents();
    this.renderGrid();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper c4-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">TURN</span><span class="hud-val" id="c4-turn">Player (Red)</span></div>
          <div class="hud-actions">
            <button class="btn btn-sm btn-secondary" id="c4-online-btn">🌐 Play Online vs Friend</button>
            <button class="btn btn-sm btn-icon" id="c4-reset">🔄</button>
          </div>
        </div>
        <div class="c4-grid" id="c4-grid"></div>
        <div class="game-controls-hint"><span id="c4-status">Drop tokens into columns to connect 4 in a row!</span></div>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('c4-reset').addEventListener('click', () => this.reset());
    document.getElementById('c4-online-btn').addEventListener('click', () => window.arcadeApp.openMultiplayerModal('connect4'));
    if (this.online) {
      document.getElementById('c4-turn').textContent = this.isHost ? 'Your turn (Red)' : 'Opponent (Red)';
      document.getElementById('c4-status').textContent = this.isHost ? 'Online duel: you are Red.' : 'Online duel: you are Yellow.';
    }
  }

  reset(isRemote = false) {
    this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.turn = 1;
    this.isOver = false;
    document.getElementById('c4-status').textContent = this.online
      ? `Online duel: you are ${this.playerId === 1 ? 'Red' : 'Yellow'}.`
      : 'Drop tokens into columns to connect 4 in a row!';
    document.getElementById('c4-turn').textContent = this.online
      ? (this.playerId === 1 ? 'Your turn (Red)' : 'Opponent (Red)')
      : 'Player (Red)';
    this.renderGrid();
    if (this.online && !isRemote) this.network.sendMove({ game: 'connect4', action: 'reset' });
  }

  handleNetworkMessage(payload) {
    const data = payload?.data;
    if (!this.online || payload.type !== 'move' || data?.game !== 'connect4') return;
    if (data.action === 'move' && Number.isInteger(data.col) && data.col >= 0 && data.col < this.cols) {
      this.dropDisc(data.col, true);
    } else if (data.action === 'reset') {
      this.reset(true);
    }
  }

  renderGrid() {
    const gridEl = document.getElementById('c4-grid');
    gridEl.innerHTML = '';
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'c4-cell';
        const val = this.board[r][c];
        if (val === 1) cell.classList.add('c4-red');
        else if (val === 2) cell.classList.add('c4-yellow');
        cell.addEventListener('click', () => this.dropDisc(c));
        gridEl.appendChild(cell);
      }
    }
  }

  dropDisc(col, isRemote = false) {
    if (this.isOver || (this.online ? (isRemote ? this.turn === this.playerId : this.turn !== this.playerId) : this.turn !== 1)) return;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.board[r][col] === 0) {
        const disc = this.online ? (isRemote ? 3 - this.playerId : this.playerId) : 1;
        this.board[r][col] = disc;
        if (this.online && !isRemote) this.network.sendMove({ game: 'connect4', action: 'move', col });
        window.audioEngine.paddle();
        this.renderGrid();
        if (this.checkWin(disc)) {
          this.isOver = true;
          if (disc === this.playerId || !this.online) window.audioEngine.win();
          else window.audioEngine.gameOver();
          document.getElementById('c4-status').textContent = `${this.online ? (disc === this.playerId ? 'YOU WIN!' : 'OPPONENT WINS!') : 'PLAYER WINS!'} 🎉`;
          return;
        }
        this.turn = 3 - disc;
        if (this.online) {
          document.getElementById('c4-turn').textContent = this.turn === this.playerId ? 'Your turn' : 'Opponent thinking...';
          return;
        }
        document.getElementById('c4-turn').textContent = 'AI Thinking...';
        setTimeout(() => this.aiTurn(), 400);
        return;
      }
    }
  }

  aiTurn() {
    if (this.isOver) return;
    let chosenCol = Math.floor(Math.random() * this.cols);
    for (let c = 0; c < this.cols; c++) {
      if (this.board[0][c] === 0) { chosenCol = c; break; }
    }
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.board[r][chosenCol] === 0) {
        this.board[r][chosenCol] = 2;
        window.audioEngine.paddle();
        this.renderGrid();
        if (this.checkWin(2)) {
          this.isOver = true;
          window.audioEngine.gameOver();
          document.getElementById('c4-status').textContent = 'AI WINS!';
          return;
        }
        this.turn = 1;
        document.getElementById('c4-turn').textContent = 'Player (Red)';
        return;
      }
    }
  }

  checkWin(p) {
    // Horizontal, Vertical, Diagonals
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (c + 3 < this.cols && this.board[r][c] === p && this.board[r][c+1] === p && this.board[r][c+2] === p && this.board[r][c+3] === p) return true;
        if (r + 3 < this.rows && this.board[r][c] === p && this.board[r+1][c] === p && this.board[r+2][c] === p && this.board[r+3][c] === p) return true;
        if (r + 3 < this.rows && c + 3 < this.cols && this.board[r][c] === p && this.board[r+1][c+1] === p && this.board[r+2][c+2] === p && this.board[r+3][c+3] === p) return true;
        if (r + 3 < this.rows && c - 3 >= 0 && this.board[r][c] === p && this.board[r+1][c-1] === p && this.board[r+2][c-2] === p && this.board[r+3][c-3] === p) return true;
      }
    }
    return false;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
window.ConnectFourGame = ConnectFourGame;

// ============================================================================
// 13. HI-LO CARD STREAK (Brain & Puzzle)
// ============================================================================
class HiLoGame {
  constructor(container) {
    this.container = container;
    this.currentCard = 7;
    this.streak = 0;
    this.best = window.storageManager.getHighScore('hilo', 0);

    this.renderDOM();
    this.bindEvents();
    this.nextCard();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="game-wrapper hilo-wrapper">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">STREAK</span><span class="hud-val" id="hilo-streak">0 🔥</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val">${this.best}</span></div>
          <div class="hud-actions"><button class="btn btn-sm btn-icon" id="hilo-reset">🔄</button></div>
        </div>
        <div class="hilo-card-stage">
          <div class="hilo-card" id="hilo-card">7</div>
        </div>
        <div class="hilo-controls">
          <button class="btn btn-primary btn-lg" id="hilo-higher">▲ HIGHER</button>
          <button class="btn btn-secondary btn-lg" id="hilo-lower">▼ LOWER</button>
        </div>
        <div class="game-controls-hint"><span>Predict whether the next drawn card (1–13) is higher or lower!</span></div>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('hilo-higher').addEventListener('click', () => this.guess(true));
    document.getElementById('hilo-lower').addEventListener('click', () => this.guess(false));
    document.getElementById('hilo-reset').addEventListener('click', () => {
      this.streak = 0;
      this.nextCard();
      document.getElementById('hilo-streak').textContent = '0 🔥';
    });
  }

  nextCard() {
    this.currentCard = Math.floor(Math.random() * 13) + 1;
    document.getElementById('hilo-card').textContent = this.currentCard;
  }

  guess(isHigher) {
    const next = Math.floor(Math.random() * 13) + 1;
    window.audioEngine.flip();
    if ((isHigher && next >= this.currentCard) || (!isHigher && next <= this.currentCard)) {
      this.streak++;
      window.audioEngine.coin();
      window.storageManager.setGameScore('hilo', this.streak);
    } else {
      this.streak = 0;
      window.audioEngine.gameOver();
    }
    this.currentCard = next;
    document.getElementById('hilo-card').textContent = next;
    document.getElementById('hilo-streak').textContent = `${this.streak} 🔥`;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
window.HiLoGame = HiLoGame;
