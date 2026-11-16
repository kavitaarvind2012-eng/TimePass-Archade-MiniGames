/**
 * TimePass Arcade - Hub Controller & Application Manager
 * Complete Catalog of 36 Mini-Games, Category Filters, Achievements, and Stats
 */
class ArcadeApp {
  constructor() {
    this.currentGame = null;
    this.currentGameId = null;
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.cursorTrailParticles = [];
    this.trailAnimId = null;
    this.lastMousePos = { x: -100, y: -100 };

    this.gamesCatalog = [
      // --- 6 ORIGINAL GAMES ---
      {
        id: 'snake',
        title: 'Neon Snake',
        category: 'arcade',
        badge: 'Arcade Classic',
        desc: 'Glide through a vibrant neon grid with fruit power-ups & speed boosts.',
        classRef: window.SnakeGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 14-5-5-3 3-5-5"/><path d="m14 19 5-5"/><circle cx="19" cy="5" r="2"/></svg>`,
        accentColor: '#00ffcc',
        featured: true,
        getHighScoreText: () => `High Score: <b>${window.storageManager.getHighScore('snake', 0)}</b> pts`
      },
      {
        id: 'puzzle2048',
        title: '2048 Sliding Puzzle',
        category: 'brain',
        badge: 'Brain & Puzzle',
        desc: 'Slide and combine matching numbers to reach 2048 with an Undo button.',
        classRef: window.Puzzle2048Game,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 8h8v8H8z"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>`,
        accentColor: '#f59e0b',
        featured: false,
        getHighScoreText: () => `Best Score: <b>${window.storageManager.getHighScore('puzzle2048', 0)}</b>`
      },
      {
        id: 'memory',
        title: 'Memory Match',
        category: 'brain',
        badge: 'Memory Trial',
        desc: 'Flip cards and find pairs across 4x4, 6x6, and 8x8 difficulty grids.',
        classRef: window.MemoryGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="9" x="14" y="3" rx="1"/><rect width="7" height="9" x="3" y="14" rx="1"/><rect width="7" height="9" x="14" y="14" rx="1"/></svg>`,
        accentColor: '#ec4899',
        featured: false,
        getHighScoreText: () => {
          const mem = window.storageManager.getHighScore('memory') || {};
          const easy = mem.easy?.bestTime !== null ? `${mem.easy.bestTime}s` : '--';
          return `Fastest 4x4: <b>${easy}</b>`;
        }
      },
      {
        id: 'aim',
        title: 'Reaction & Aim Trainer',
        category: 'arcade',
        badge: 'Speed Drill',
        desc: 'Click shrinking and moving targets in 30s to test speed & accuracy.',
        classRef: window.AimTrainerGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="12" x2="12" y1="2" y2="4"/><line x1="12" x2="12" y1="20" y2="22"/><line x1="2" x2="4" y1="12" y2="12"/><line x1="20" x2="22" y1="12" y2="12"/></svg>`,
        accentColor: '#3b82f6',
        featured: true,
        getHighScoreText: () => {
          const aim = window.storageManager.getHighScore('aim') || {};
          return `High: <b>${aim.highScore || 0}</b> (${aim.bestAccuracy || 0}%)`;
        }
      },
      {
        id: 'fidget',
        title: 'Bubble Wrap & Fidget Board',
        category: 'chill',
        badge: 'Tactile Relief',
        desc: 'Endless bubble popping, clicky mechanical switches & Zen sand particles.',
        classRef: window.FidgetGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="4"/><circle cx="16" cy="16" r="4"/><circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/></svg>`,
        accentColor: '#10b981',
        featured: true,
        getHighScoreText: () => {
          const f = window.storageManager.getHighScore('fidget') || {};
          return `Popped: <b>${f.bubblesPopped || 0}</b> bubbles`;
        }
      },
      {
        id: 'wordle',
        title: 'Wordle 5-Letter Guess',
        category: 'brain',
        badge: 'Word Puzzle',
        desc: 'Deduce the secret 5-letter word in 6 attempts with color-coded clues.',
        classRef: window.WordleGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>`,
        accentColor: '#8b5cf6',
        featured: false,
        getHighScoreText: () => {
          const w = window.storageManager.getHighScore('wordle') || {};
          return `Win Streak: <b>${w.currentStreak || 0}</b> (Best: ${w.maxStreak || 0})`;
        }
      },

      // --- 30 NEW GAMES ---
      {
        id: 'tetris',
        title: 'Tetris Block Drop',
        category: 'arcade',
        badge: 'Block Drop',
        desc: 'Classic falling tetrominoes with ghost drop preview, rotation, and line clears.',
        classRef: window.TetrisGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
        accentColor: '#00ffcc',
        featured: false,
        getHighScoreText: () => `High Score: <b>${window.storageManager.getHighScore('tetris', 0)}</b>`
      },
      {
        id: 'pong',
        title: 'Neon Pong',
        category: 'arcade',
        badge: 'Retro Rally',
        desc: 'Retro paddle ball against a smart AI opponent with accelerating ball velocity.',
        classRef: window.PongGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="3" y2="18"/><line x1="21" y1="8" x2="21" y2="16"/><circle cx="12" cy="12" r="3"/></svg>`,
        accentColor: '#ffd700',
        featured: false,
        getHighScoreText: () => `Best Rally: <b>${window.storageManager.getHighScore('pong_rally', 0)}</b>`
      },
      {
        id: 'ttt',
        title: 'Tic-Tac-Toe Unbeatable',
        category: 'brain',
        badge: 'Strategy Dual',
        desc: '3x3 grid featuring 2-player local mode and an unbeatable Minimax AI.',
        classRef: window.TicTacToeGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l16 16M20 4L4 20"/></svg>`,
        accentColor: '#f43f5e',
        featured: false,
        getHighScoreText: () => `AI Mode: <b>Minimax Ready</b>`
      },
      {
        id: 'rpsls',
        title: 'RPS Lizard Spock',
        category: 'chill',
        badge: 'Hand Duel',
        desc: 'Expanded Rock-Paper-Scissors with animated choice buttons and streak tracking.',
        classRef: window.RPSLSGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>`,
        accentColor: '#10b981',
        featured: false,
        getHighScoreText: () => `Best Streak: <b>${window.storageManager.getHighScore('rpsls', 0)}</b> 🔥`
      },
      {
        id: 'flappy',
        title: 'Cyber Flappy',
        category: 'arcade',
        badge: 'Gravity Flight',
        desc: 'Tap/spacebar gravity flight through glowing neon pipes with high-score tracking.',
        classRef: window.FlappyGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l4 7-4 3-4-3 4-7z"/><path d="M8 12l-5 4 4 1 1-5z"/><path d="M16 12l5 4-4 1-1-5z"/></svg>`,
        accentColor: '#38bdf8',
        featured: false,
        getHighScoreText: () => `Pipes Passed: <b>${window.storageManager.getHighScore('flappy', 0)}</b>`
      },
      {
        id: 'starcatcher',
        title: 'Star Catcher',
        category: 'arcade',
        badge: 'Reflex Catch',
        desc: 'Move your collector paddle to catch falling celestial stars while dodging red bombs.',
        classRef: window.StarCatcherGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
        accentColor: '#ffd700',
        featured: false,
        getHighScoreText: () => `High Score: <b>${window.storageManager.getHighScore('star_catcher', 0)}</b>`
      },
      {
        id: 'mole',
        title: 'Neon Whack-A-Mole',
        category: 'arcade',
        badge: 'Rapid Blitz',
        desc: '3x3 grid of cyber targets popping up at accelerating speeds for a 30s blitz.',
        classRef: window.WhackAMoleGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
        accentColor: '#f59e0b',
        featured: false,
        getHighScoreText: () => `Blitz Score: <b>${window.storageManager.getHighScore('whack_mole', 0)}</b>`
      },
      {
        id: 'simon',
        title: 'Simon Tone Sequence',
        category: 'brain',
        badge: 'Pattern Memory',
        desc: '4-quadrant audio-visual pattern memory game with synthesized Web Audio tones.',
        classRef: window.SimonGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12l7 7"/></svg>`,
        accentColor: '#a855f7',
        featured: false,
        getHighScoreText: () => `Max Sequence: <b>${window.storageManager.getHighScore('simon', 0)}</b>`
      },
      {
        id: 'minesweeper',
        title: 'Minesweeper Mini',
        category: 'brain',
        badge: 'Logic Grid',
        desc: '9x9 grid logic puzzle with right-click/long-press flag toggling & best-time tracking.',
        classRef: window.MinesweeperGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>`,
        accentColor: '#ef4444',
        featured: false,
        getHighScoreText: () => `Best Time: <b>${window.storageManager.getHighScore('minesweeper', '--')}s</b>`
      },
      {
        id: 'mathblitz',
        title: 'Math Blitz 30s',
        category: 'brain',
        badge: 'Mental Math',
        desc: 'Rapid-fire arithmetic (+, -, ×) with combo multipliers before the 30s clock expires.',
        classRef: window.MathBlitzGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><line x1="12" y1="5" x2="12" y2="19"/></svg>`,
        accentColor: '#00ffcc',
        featured: false,
        getHighScoreText: () => `Top Score: <b>${window.storageManager.getHighScore('math_blitz', 0)}</b>`
      },
      {
        id: 'colorgate',
        title: 'Color Gate Reflex',
        category: 'arcade',
        badge: 'Precision Reflex',
        desc: 'Tap to bounce a colored ball through matching segments of rotating neon rings.',
        classRef: window.ColorGateGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>`,
        accentColor: '#ec4899',
        featured: false,
        getHighScoreText: () => `Gates Cleared: <b>${window.storageManager.getHighScore('color_gate', 0)}</b>`
      },
      {
        id: 'towerstacker',
        title: 'Tower Stacker',
        category: 'arcade',
        badge: 'Precision Timing',
        desc: 'Drop sliding horizontal blocks precisely on top of each other, slicing off overhang.',
        classRef: window.TowerStackerGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="16" width="16" height="4"/><rect x="6" y="10" width="12" height="4"/><rect x="8" y="4" width="8" height="4"/></svg>`,
        accentColor: '#f59e0b',
        featured: false,
        getHighScoreText: () => `Max Height: <b>${window.storageManager.getHighScore('tower_stack', 0)}</b>`
      },
      {
        id: 'wordtyper',
        title: 'Falling Word Typer',
        category: 'brain',
        badge: 'Speed Typing',
        desc: 'Type descending cyber words on your keyboard to laser-zap them before the deadline.',
        classRef: window.WordTyperGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>`,
        accentColor: '#3b82f6',
        featured: false,
        getHighScoreText: () => `Top Score: <b>${window.storageManager.getHighScore('word_typer', 0)}</b>`
      },
      {
        id: 'dicecoin',
        title: 'Dice & Coin Fidget',
        category: 'chill',
        badge: 'Tactile Roller',
        desc: 'Tactile 3D-styled dice roller (D6, D20) and coin flipper with roll history.',
        classRef: window.DiceCoinGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><circle cx="16" cy="16" r="1.5"/><circle cx="12" cy="12" r="1.5"/></svg>`,
        accentColor: '#a855f7',
        featured: false,
        getHighScoreText: () => `Dice: <b>D6, D20, Coin</b>`
      },
      {
        id: 'mazerunner',
        title: 'Procedural Maze Runner',
        category: 'brain',
        badge: 'Labyrinth',
        desc: 'Navigate a glowing dot through randomly generated DFS mazes with a live timer.',
        classRef: window.MazeRunnerGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3zM9 3v6h6V3M3 15h6v6M15 15h6v6"/></svg>`,
        accentColor: '#10b981',
        featured: false,
        getHighScoreText: () => `Labyrinth: <b>Procedural</b>`
      },
      {
        id: 'hangman',
        title: 'Neon Hangman',
        category: 'brain',
        badge: 'Word Guesser',
        desc: 'Built-in word bank with an on-screen A–Z keyboard and glowing SVG stickman stages.',
        classRef: window.HangmanGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="21" x2="18" y2="21"/><line x1="12" y1="3" x2="12" y2="21"/></svg>`,
        accentColor: '#ffd700',
        featured: false,
        getHighScoreText: () => `Max Errors: <b>6 Allowed</b>`
      },
      {
        id: 'blackjack',
        title: 'Blackjack 21',
        category: 'brain',
        badge: 'Card Strategy',
        desc: 'Classic casino card game against a dealer AI with Hit, Stand, and chip balance.',
        classRef: window.BlackjackGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="12" r="3"/></svg>`,
        accentColor: '#00ffcc',
        featured: false,
        getHighScoreText: () => `Starting Chips: <b>$1,000</b>`
      },
      {
        id: 'slotspinner',
        title: 'Lucky Slot Spinner',
        category: 'chill',
        badge: 'Casino Fidget',
        desc: '3-reel neon symbol slot machine with lever pull animation and virtual coin bank.',
        classRef: window.SlotSpinnerGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="14" rx="2"/><line x1="8" y1="6" x2="8" y2="20"/><line x1="16" y1="6" x2="16" y2="20"/></svg>`,
        accentColor: '#f43f5e',
        featured: false,
        getHighScoreText: () => `Top Jackpot: <b>1,500 Coins</b>`
      },
      {
        id: 'bouncinglogo',
        title: 'Bouncing Logo Corner Watch',
        category: 'chill',
        badge: 'Screensaver',
        desc: 'Classic screensaver logo bouncing inside a box with speed controls & corner counter.',
        classRef: window.BouncingLogoGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 9 6 6m0-6-6 6"/></svg>`,
        accentColor: '#3b82f6',
        featured: false,
        getHighScoreText: () => `Exact Corners: <b>Tracked Live</b>`
      },
      {
        id: 'plinko',
        title: 'Pegboard Plinko',
        category: 'chill',
        badge: 'Pachinko Drop',
        desc: 'Drop glowing balls from the top of a triangular pegboard into multiplier buckets.',
        classRef: window.PlinkoGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 22 22 22 12 2"/></svg>`,
        accentColor: '#ffd700',
        featured: false,
        getHighScoreText: () => `Jackpot Bucket: <b>10x Multiplier</b>`
      },
      {
        id: 'lightsout',
        title: 'Lights Out Grid',
        category: 'brain',
        badge: 'Toggle Logic',
        desc: '5x5 toggle puzzle where clicking a tile flips orthogonal neighbors; clear all lights.',
        classRef: window.LightsOutGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/></svg>`,
        accentColor: '#10b981',
        featured: false,
        getHighScoreText: () => `Grid Size: <b>5x5 Matrix</b>`
      },
      {
        id: 'coreclicker',
        title: 'Energy Core Clicker',
        category: 'chill',
        badge: 'Idle Incremental',
        desc: 'Incremental idle clicker: tap a reactor core and buy automated power generators.',
        classRef: window.CoreClickerGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>`,
        accentColor: '#00ffcc',
        featured: false,
        getHighScoreText: () => `Output: <b>Automated W/s</b>`
      },
      {
        id: 'vaultcracker',
        title: '4-Digit Vault Cracker',
        category: 'brain',
        badge: 'Codebreaker',
        desc: 'Mastermind Bulls & Cows codebreaker with exact and shifted position clues.',
        classRef: window.VaultCrackerGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
        accentColor: '#f59e0b',
        featured: false,
        getHighScoreText: () => `Attempts Allowed: <b>8 Tries</b>`
      },
      {
        id: 'tileslide',
        title: '15-Tile Number Slide',
        category: 'brain',
        badge: 'Sliding Puzzle',
        desc: 'Classic 4x4 sliding tile puzzle: arrange numbers 1–15 in order with a move counter.',
        classRef: window.TileSlideGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
        accentColor: '#38bdf8',
        featured: false,
        getHighScoreText: () => `Tile Order: <b>1 to 15</b>`
      },
      {
        id: 'bullethell',
        title: 'Bullet Hell Dodge',
        category: 'arcade',
        badge: 'Survival Hell',
        desc: 'Move a tiny ship with mouse/touch inside an arena surviving bouncing projectiles.',
        classRef: window.BulletHellGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="5" cy="19" r="2"/></svg>`,
        accentColor: '#ef4444',
        featured: false,
        getHighScoreText: () => `Survival: <b>${window.storageManager.getHighScore('bullet_hell', 0)}s</b>`
      },
      {
        id: 'connectfour',
        title: 'Connect Four',
        category: 'brain',
        badge: 'Drop Disc',
        desc: '7x6 drop-disc strategy grid against a tactical AI opponent. Connect 4 to win!',
        classRef: window.ConnectFourGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/></svg>`,
        accentColor: '#ffd700',
        featured: false,
        getHighScoreText: () => `Format: <b>7x6 Strategy</b>`
      },
      {
        id: 'hilo',
        title: 'Hi-Lo Card Streak',
        category: 'brain',
        badge: 'Odds & Cards',
        desc: 'Predict whether the next drawn card is higher or lower to build an unbroken streak.',
        classRef: window.HiLoGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>`,
        accentColor: '#a855f7',
        featured: false,
        getHighScoreText: () => `Top Streak: <b>${window.storageManager.getHighScore('hilo', 0)}</b> 🔥`
      },
      {
        id: 'rhythmtap',
        title: 'Synth Rhythm Tap',
        category: 'arcade',
        badge: 'Rhythm Highway',
        desc: '4-lane falling note highway synced to a procedural Web Audio beat (D, F, J, K).',
        classRef: window.RhythmTapGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
        accentColor: '#00ffcc',
        featured: false,
        getHighScoreText: () => `High Score: <b>${window.storageManager.getHighScore('rhythm_tap', 0)}</b>`
      },
      {
        id: 'asteroidblaster',
        title: 'Vector Asteroid Blaster',
        category: 'arcade',
        badge: 'Space Vector',
        desc: 'Rotate, thrust, and shoot splitting neon asteroids in wrap-around vector space.',
        classRef: window.AsteroidBlasterGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>`,
        accentColor: '#f43f5e',
        featured: false,
        getHighScoreText: () => `High Score: <b>${window.storageManager.getHighScore('asteroids', 0)}</b>`
      },
      {
        id: 'stonebalancer',
        title: 'Zen Stone Balancer',
        category: 'chill',
        badge: 'Zen Physics',
        desc: 'Drop flat river stones gently onto a swaying stack without tipping the balance.',
        classRef: window.StoneBalancerGame,
        iconSvg: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="18" rx="8" ry="3"/><ellipse cx="12" cy="12" rx="6" ry="2.5"/><ellipse cx="12" cy="7" rx="4" ry="2"/></svg>`,
        accentColor: '#94a3b8',
        featured: false,
        getHighScoreText: () => `Stack Height: <b>Zen Balance</b>`
      }
    ];

    this.init();
  }

  init() {
    this.initTheme();
    this.initPalette();
    this.initLoFi();
    this.initCoinsDisplay();
    this.initAudioButton();
    this.initTimeTracker();
    this.initSearch();
    this.initRandomButton();
    this.initCursorTrails();
    this.applyActiveSkin();
    this.initCRTMode();
    this.initArcadeMaker();
    this.initMultiplayer();
    this.renderBentoGrid();
    this.bindGlobalEvents();
    this.checkDailyQuestsBadge();
    this.checkCustomLevelURL();
  }

  initCRTMode() {
    const button = document.getElementById('crt-toggle-btn');
    const overlay = document.getElementById('crt-overlay');
    if (!button || !overlay) return;

    const apply = (enabled) => {
      document.documentElement.classList.toggle('crt-mode', enabled);
      overlay.setAttribute('aria-hidden', String(!enabled));
      button.setAttribute('aria-pressed', String(enabled));
      button.classList.toggle('active', enabled);
      localStorage.setItem('timepass_crt_mode', enabled ? 'true' : 'false');
    };

    apply(localStorage.getItem('timepass_crt_mode') === 'true');
    button.addEventListener('click', () => {
      apply(!document.documentElement.classList.contains('crt-mode'));
      window.audioEngine.click('blue');
    });
  }

  initArcadeMaker() {
    this.arcadeMaker = new window.ArcadeMaker();
    const button = document.getElementById('arcademaker-btn');
    if (button) button.addEventListener('click', () => this.arcadeMaker.openModal());
  }

  initMultiplayer() {
    const modal = document.getElementById('multiplayer-modal');
    const createBtn = document.getElementById('mp-create-room-btn');
    const joinBtn = document.getElementById('mp-join-room-btn');
    const network = new window.NetworkManager();
    this.networkManager = network;
    window.networkManager = network;
    this.multiplayerGameId = null;
    this.mpLaunchPending = false;

    network.onConnect(() => {
      const status = document.getElementById('mp-room-status');
      const joinStatus = document.getElementById('mp-join-status');
      if (status) status.textContent = '✅ Opponent connected! Starting game...';
      if (joinStatus) joinStatus.textContent = '✅ Connected! Starting game...';
      if (network.isHost) network.upgradeToWebRTC();
      this.launchMultiplayerGame();
    });
    network.onReceiveMove((payload) => {
      if (this.currentGame && typeof this.currentGame.handleNetworkMessage === 'function') {
        this.currentGame.handleNetworkMessage(payload);
      }
    });
    network.onDisconnect(() => {
      const status = document.getElementById('mp-room-status');
      if (status) status.textContent = '⚠️ Opponent disconnected.';
    });

    const openButton = document.getElementById('multiplayer-btn');
    if (openButton) openButton.addEventListener('click', () => this.openMultiplayerModal());

    modal?.querySelectorAll('[data-mp-game]').forEach((button) => {
      button.addEventListener('click', () => {
        this.multiplayerGameId = button.getAttribute('data-mp-game');
        const labels = { pong: 'Neon Pong', ttt: 'Tic-Tac-Toe', connect4: 'Connect Four' };
        document.getElementById('mp-selected-game-label').textContent = labels[this.multiplayerGameId];
        modal.querySelector('.mp-game-select').style.display = 'none';
        document.getElementById('mp-room-setup').style.display = 'block';
      });
    });

    document.getElementById('mp-tab-create')?.addEventListener('click', () => this.setMultiplayerMode('create'));
    document.getElementById('mp-tab-join')?.addEventListener('click', () => this.setMultiplayerMode('join'));

    createBtn?.addEventListener('click', () => {
      if (!this.multiplayerGameId) return;
      try {
        network.disconnect();
        const code = network.createRoom(this.multiplayerGameId);
        this.mpLaunchPending = true;
        document.getElementById('mp-room-code-big').textContent = code;
        document.getElementById('mp-room-code-display').style.display = 'grid';
        document.getElementById('mp-room-status').textContent = '⏳ Waiting for opponent to join this room...';
      } catch (error) {
        console.error('Unable to create multiplayer room:', error);
        this.showToastNotification('Could not create room', 'This browser does not support local multiplayer rooms.');
      }
    });

    joinBtn?.addEventListener('click', () => {
      const input = document.getElementById('mp-join-code-input');
      const status = document.getElementById('mp-join-status');
      const code = input.value.trim().toUpperCase();
      if (!/^[A-HJ-NP-Z2-9]{4}$/.test(code)) {
        status.textContent = 'Enter a valid 4-character room code.';
        return;
      }
      if (!this.multiplayerGameId) return;
      try {
        network.disconnect();
        this.mpLaunchPending = true;
        status.textContent = 'Connecting to room...';
        if (!network.joinRoom(code, this.multiplayerGameId)) {
          this.mpLaunchPending = false;
          status.textContent = 'That room is for a different game.';
        }
      } catch (error) {
        console.error('Unable to join multiplayer room:', error);
        status.textContent = 'Could not join this room in the current browser.';
      }
    });

    document.getElementById('mp-copy-code-btn')?.addEventListener('click', () => {
      const code = document.getElementById('mp-room-code-big').textContent;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(code).then(
          () => this.showToastNotification('Room code copied', `Share ${code} with your opponent.`),
          () => this.fallbackCopy(code, 'Room code copied', `Share ${code} with your opponent.`)
        );
      } else {
        this.fallbackCopy(code, 'Room code copied', `Share ${code} with your opponent.`);
      }
    });
  }

  openMultiplayerModal(gameId = null) {
    const modal = document.getElementById('multiplayer-modal');
    if (!modal) return;
    modal.querySelector('.mp-game-select').style.display = gameId ? 'none' : '';
    document.getElementById('mp-room-setup').style.display = gameId ? 'block' : 'none';
    document.getElementById('mp-room-code-display').style.display = 'none';
    document.getElementById('mp-join-code-input').value = '';
    document.getElementById('mp-join-status').textContent = '';
    this.multiplayerGameId = gameId;
    if (gameId) {
      const labels = { pong: 'Neon Pong', ttt: 'Tic-Tac-Toe', connect4: 'Connect Four' };
      document.getElementById('mp-selected-game-label').textContent = labels[gameId];
    }
    this.setMultiplayerMode('create');
    modal.classList.add('open');
  }

  setMultiplayerMode(mode) {
    const creating = mode === 'create';
    document.getElementById('mp-tab-create')?.classList.toggle('active', creating);
    document.getElementById('mp-tab-join')?.classList.toggle('active', !creating);
    document.getElementById('mp-create-panel').style.display = creating ? 'block' : 'none';
    document.getElementById('mp-join-panel').style.display = creating ? 'none' : 'block';
  }

  launchMultiplayerGame() {
    if (!this.mpLaunchPending || !this.multiplayerGameId || !this.networkManager.connected) return;
    this.mpLaunchPending = false;
    document.getElementById('multiplayer-modal').classList.remove('open');
    const gameIds = { pong: 'pong', ttt: 'ttt', connect4: 'connectfour' };
    this.launchGame(gameIds[this.multiplayerGameId], {
      online: true,
      isHost: this.networkManager.isHost,
      network: this.networkManager
    });
  }

  launchCustomGame(config) {
    const gameIds = { maze: 'mazerunner', wordle: 'wordle', tetris: 'tetris' };
    const gameId = config && gameIds[config.type];
    if (!gameId) {
      this.showToastNotification('Invalid custom level', 'This share link does not contain a supported game.');
      return;
    }
    this.launchGame(gameId, { customConfig: config, customTitle: `Custom ${config.type.toUpperCase()}` });
  }

  checkCustomLevelURL() {
    const config = window.ArcadeMaker.checkURLForCustomLevel();
    if (!config) {
      if (new URLSearchParams(window.location.search).has('custom')) {
        this.showToastNotification('Invalid custom level', 'The shared level link is invalid or unsupported.');
      }
      return;
    }
    this.launchCustomGame(config);
  }

  // --- Theme Management (Light / Dark) ---
  initTheme() {
    const savedTheme = localStorage.getItem('timepass_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButtonIcon(savedTheme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('timepass_theme', next);
        this.updateThemeButtonIcon(next);
        window.audioEngine.click('red');
      });
    }
  }

  updateThemeButtonIcon(theme) {
    const iconEl = document.getElementById('theme-icon-slot');
    if (iconEl) {
      iconEl.innerHTML = theme === 'dark'
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
  }

  // --- Theme Palettes (Phase 3) ---
  initPalette() {
    const savedPalette = window.storageManager.getThemePalette();
    document.documentElement.setAttribute('data-palette', savedPalette);

    const selector = document.getElementById('palette-selector');
    if (selector) {
      selector.value = savedPalette;
      selector.addEventListener('change', (e) => {
        const val = e.target.value;
        document.documentElement.setAttribute('data-palette', val);
        window.storageManager.setThemePalette(val);
        window.audioEngine.click('blue');
      });
    }
  }

  // --- Ambient Lo-Fi Generator (Phase 3) ---
  initLoFi() {
    const lofiBtn = document.getElementById('lofi-toggle-btn');
    if (!lofiBtn) return;

    const updateLoFiBtn = () => {
      const active = window.audioEngine.isLoFiActive();
      lofiBtn.classList.toggle('active', active);
      lofiBtn.title = active ? 'Lo-Fi Ambient: ON (Click to Stop)' : 'Lo-Fi Ambient: OFF (Click to Play Chill Chords)';
    };

    updateLoFiBtn();

    lofiBtn.addEventListener('click', () => {
      window.audioEngine.toggleAmbientLoFi();
      updateLoFiBtn();
    });
  }

  // --- Arcade Coins & Economy Display (Phase 4) ---
  initCoinsDisplay() {
    this.updateCoinsDisplay();
  }

  updateCoinsDisplay() {
    const coinsVal = document.getElementById('header-coins-val');
    if (coinsVal) {
      coinsVal.textContent = window.storageManager.getCoins();
    }
  }

  // --- Global Search & Quick Filter Bar (Phase 1) ---
  initSearch() {
    const searchInput = document.getElementById('game-search-input');
    const clearBtn = document.getElementById('clear-search-btn');
    const resetBtn = document.getElementById('reset-search-btn');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      if (clearBtn) {
        clearBtn.style.display = this.searchQuery ? 'block' : 'none';
      }
      this.renderBentoGrid();
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        this.searchQuery = '';
        clearBtn.style.display = 'none';
        searchInput.focus();
        this.renderBentoGrid();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        this.searchQuery = '';
        if (clearBtn) clearBtn.style.display = 'none';
        this.activeCategory = 'all';
        document.querySelectorAll('.category-tab').forEach((t) => {
          t.classList.toggle('active', t.getAttribute('data-cat') === 'all');
        });
        this.renderBentoGrid();
      });
    }
  }

  // --- Random Game Launcher (🎲 I'm Bored) (Phase 1) ---
  initRandomButton() {
    const randomBtn = document.getElementById('random-game-btn');
    if (!randomBtn) return;

    randomBtn.addEventListener('click', () => {
      const randomIdx = Math.floor(Math.random() * this.gamesCatalog.length);
      const chosen = this.gamesCatalog[randomIdx];
      window.audioEngine.dice();
      this.launchGame(chosen.id);
    });
  }

  // --- Custom Dashboard Border Skins (Phase 4) ---
  applyActiveSkin() {
    const skin = window.storageManager.getActiveSkin();
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;
    appContainer.classList.remove('skin-default', 'skin-neon_purple', 'skin-matrix_green', 'skin-prismatic_gold');
    appContainer.classList.add(`skin-${skin}`);
  }

  // --- Cursor Particle Trails Engine (Phase 4) ---
  initCursorTrails() {
    const canvas = document.getElementById('cursor-trail-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const spawn = (x, y) => {
      const trail = window.storageManager.getActiveTrail();
      if (trail === 'none') return;

      const count = trail === 'matrix_rain' ? 1 : 2;
      for (let i = 0; i < count; i++) {
        const p = {
          x: x + (Math.random() * 10 - 5),
          y: y + (Math.random() * 10 - 5),
          vx: (Math.random() - 0.5) * 1.5,
          vy: trail === 'bubbles' ? -(Math.random() * 2.0 + 0.8) : (Math.random() - 0.5) * 1.5,
          life: 1.0,
          decay: Math.random() * 0.025 + 0.015,
          size: trail === 'bubbles' ? Math.random() * 12 + 6 : Math.random() * 4 + 2,
          char: trail === 'matrix_rain' ? (Math.random() > 0.5 ? '1' : '0') : null,
          color: trail === 'stardust' ? (Math.random() > 0.5 ? '#ffd700' : '#00ffcc')
               : trail === 'neon_laser' ? (Math.random() > 0.5 ? '#00ffcc' : '#f43f5e')
               : '#00ff66'
        };
        this.cursorTrailParticles.push(p);
      }
      if (this.cursorTrailParticles.length > 120) {
        this.cursorTrailParticles.splice(0, this.cursorTrailParticles.length - 120);
      }
    };

    window.addEventListener('mousemove', (e) => {
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      spawn(e.clientX, e.clientY);
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        spawn(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    const animateTrails = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const trail = window.storageManager.getActiveTrail();

      if (trail !== 'none' && this.cursorTrailParticles.length > 0) {
        for (let i = this.cursorTrailParticles.length - 1; i >= 0; i--) {
          const p = this.cursorTrailParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;

          if (p.life <= 0) {
            this.cursorTrailParticles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life);

          if (trail === 'matrix_rain') {
            ctx.fillStyle = '#00ff66';
            ctx.font = '13px monospace';
            ctx.fillText(p.char, p.x, p.y);
          } else if (trail === 'bubbles') {
            ctx.strokeStyle = `rgba(160, 220, 255, ${p.life * 0.8})`;
            ctx.fillStyle = `rgba(0, 255, 204, ${p.life * 0.15})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      this.trailAnimId = requestAnimationFrame(animateTrails);
    };

    animateTrails();
  }

  // --- Sound Toggle ---
  initAudioButton() {
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (!soundBtn) return;

    const updateSoundIcon = () => {
      const isMuted = window.audioEngine.isMuted();
      const iconSlot = document.getElementById('sound-icon-slot');
      if (iconSlot) {
        iconSlot.innerHTML = isMuted
          ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
      }
    };

    updateSoundIcon();

    soundBtn.addEventListener('click', () => {
      window.audioEngine.toggleMute();
      updateSoundIcon();
      if (!window.audioEngine.isMuted()) {
        window.audioEngine.pop();
      }
    });

    // Unlock Web Audio on first user interaction
    const unlockAudio = () => {
      window.audioEngine.init();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
  }

  // --- Live Time Wasted Tracker & Coin Accumulation ---
  initTimeTracker() {
    const timeEl = document.getElementById('header-time-wasted');
    if (!timeEl) return;

    timeEl.textContent = window.storageManager.formatTime(window.storageManager.data.totalSecondsWasted);

    window.storageManager.onTimeTick((seconds) => {
      if (timeEl) {
        timeEl.textContent = window.storageManager.formatTime(seconds);
      }
      // Award 1 coin every minute of active time wasted
      if (seconds > 0 && seconds % 60 === 0) {
        window.storageManager.addCoins(1);
        this.updateCoinsDisplay();
      }
    });
  }

  // --- Bento Grid Rendering (Search & Favorites Pinned to Top) ---
  renderBentoGrid() {
    const grid = document.getElementById('bento-grid');
    const noResultsEl = document.getElementById('no-search-results');
    const statusTag = document.getElementById('search-status-tag');
    if (!grid) return;

    grid.innerHTML = '';

    // Filter games by category and search query
    let filtered = this.gamesCatalog.filter((g) => {
      // Category match
      let catMatch = true;
      if (this.activeCategory === 'favorites') {
        catMatch = window.storageManager.isFavorite(g.id);
      } else if (this.activeCategory !== 'all') {
        catMatch = g.category === this.activeCategory;
      }
      if (!catMatch) return false;

      // Search query match
      if (this.searchQuery) {
        const inTitle = g.title.toLowerCase().includes(this.searchQuery);
        const inDesc = g.desc.toLowerCase().includes(this.searchQuery);
        const inBadge = g.badge.toLowerCase().includes(this.searchQuery);
        return inTitle || inDesc || inBadge;
      }

      return true;
    });

    // Pinned Favorites: Sort favorited games to the very top!
    filtered.sort((a, b) => {
      const aFav = window.storageManager.isFavorite(a.id);
      const bFav = window.storageManager.isFavorite(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });

    // Handle search status display
    if (statusTag) {
      if (this.searchQuery) {
        statusTag.style.display = 'inline-flex';
        statusTag.textContent = `${filtered.length} of 36 games`;
      } else {
        statusTag.style.display = 'none';
      }
    }

    if (noResultsEl) {
      noResultsEl.style.display = filtered.length === 0 ? 'block' : 'none';
    }

    filtered.forEach((game) => {
      const isFav = window.storageManager.isFavorite(game.id);
      const card = document.createElement('div');
      card.className = `bento-card ${game.featured ? 'bento-featured' : ''} bento-${game.id} ${isFav ? 'is-favorited' : ''}`;
      card.style.setProperty('--card-accent', game.accentColor);

      card.innerHTML = `
        <div class="card-glow"></div>
        <button class="bento-fav-btn ${isFav ? 'active' : ''}" data-fav-game="${game.id}" title="${isFav ? 'Remove from Favorites' : 'Add to Favorites'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <div class="bento-card-top">
          <div class="bento-icon-wrapper" style="color: ${game.accentColor}">
            ${game.iconSvg}
          </div>
          <span class="category-badge badge-${game.category}">${game.badge}</span>
        </div>
        <div class="bento-card-body">
          <h3 class="bento-title">${game.title}</h3>
          <p class="bento-desc">${game.desc}</p>
        </div>
        <div class="bento-card-bottom">
          <div class="bento-highscore">${game.getHighScoreText()}</div>
          <button class="btn btn-primary btn-play" data-game="${game.id}">
            Play Now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
        </div>
      `;

      // Favorite button click
      const favBtn = card.querySelector('.bento-fav-btn');
      if (favBtn) {
        favBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.storageManager.toggleFavorite(game.id);
          window.audioEngine.click('yellow');
          this.renderBentoGrid();
        });
      }

      card.querySelector('.btn-play').addEventListener('click', (e) => {
        e.stopPropagation();
        this.launchGame(game.id);
      });

      card.addEventListener('click', () => {
        this.launchGame(game.id);
      });

      grid.appendChild(card);
    });
  }

  // --- Category Filtering & Global Events ---
  bindGlobalEvents() {
    const filterTabs = document.querySelectorAll('.category-tab');
    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        filterTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeCategory = tab.getAttribute('data-cat');
        window.audioEngine.click('red');
        this.renderBentoGrid();
      });
    });

    const backBtn = document.getElementById('back-to-hub-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.returnToHub();
      });
    }

    const shareBtn = document.getElementById('header-share-score-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        this.shareScore();
      });
    }

    const brandBtn = document.getElementById('brand-home-btn');
    if (brandBtn) {
      brandBtn.addEventListener('click', () => {
        this.returnToHub();
      });
    }

    const questsBtn = document.getElementById('quests-btn');
    if (questsBtn) {
      questsBtn.addEventListener('click', () => this.openQuestsModal());
    }

    const shopBtn = document.getElementById('shop-btn');
    if (shopBtn) {
      shopBtn.addEventListener('click', () => this.openShopModal());
    }

    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) {
      leaderboardBtn.addEventListener('click', () => this.openLeaderboardModal());
    }

    const achievementsBtn = document.getElementById('achievements-btn');
    if (achievementsBtn) {
      achievementsBtn.addEventListener('click', () => this.openAchievementsModal());
    }

    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) {
      statsBtn.addEventListener('click', () => this.openStatsModal());
    }

    document.querySelectorAll('.modal-close-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach((m) => m.classList.remove('open'));
        window.audioEngine.click('red');
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('open');
        }
      });
    });
  }

  // --- Game Lifecycle Management ---
  launchGame(gameId, options = {}) {
    const gameDef = this.gamesCatalog.find((g) => g.id === gameId);
    if (!gameDef) return;

    if (this.currentGame) {
      this.currentGame.destroy();
      this.currentGame = null;
    }

    this.currentGameId = gameId;

    // Track launch in storage with category for daily quest tracking
    window.storageManager.recordGameLaunch(gameId, gameDef.category);
    this.updateCoinsDisplay();

    // Switch view
    document.getElementById('hub-view').style.display = 'none';
    const gameView = document.getElementById('game-view');
    gameView.style.display = 'block';

    document.getElementById('active-game-title').textContent = options.customTitle || gameDef.title;
    window.audioEngine.click('blue');

    const mountContainer = document.getElementById('active-game-mount');
    mountContainer.innerHTML = '';
    this.currentGame = new gameDef.classRef(mountContainer, options);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  returnToHub() {
    if (this.currentGame) {
      this.currentGame.destroy();
      this.currentGame = null;
    }
    this.currentGameId = null;
    if (this.networkManager && this.networkManager.roomCode) {
      this.networkManager.disconnect();
      this.mpLaunchPending = false;
    }

    document.getElementById('game-view').style.display = 'none';
    document.getElementById('hub-view').style.display = 'block';

    window.audioEngine.click('red');
    this.updateCoinsDisplay();
    this.checkDailyQuestsBadge();
    this.renderBentoGrid();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Shareable Score Cards (Phase 2) ---
  shareScore(gameTitle = null, score = null) {
    let title = gameTitle;
    let scoreText = score;

    if (!title && this.currentGameId) {
      const g = this.gamesCatalog.find((x) => x.id === this.currentGameId);
      if (g) title = g.title;
    }
    if (!title) title = 'TimePass Arcade';

    if (scoreText === null || scoreText === undefined) {
      if (this.currentGameId) {
        const val = window.storageManager.getHighScore(this.currentGameId);
        scoreText = typeof val === 'object' ? 'Champion Rank' : `${val} points`;
      } else {
        scoreText = 'Epic High Score';
      }
    }

    const shareText = `🎮 I just scored ${scoreText} on ${title} in TimePass Arcade! 🕹️✨ Can you beat my score? Play at http://localhost:8000`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        this.showToastNotification('📋 Copied score to clipboard!', 'Share with friends & challenge them!');
        window.audioEngine.click('blue');
      }).catch(() => {
        this.fallbackCopy(shareText);
      });
    } else {
      this.fallbackCopy(shareText);
    }
  }

  fallbackCopy(text, toastTitle = '📋 Copied score to clipboard!', toastDesc = 'Share with friends & challenge them!') {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      const copied = document.execCommand('copy');
      if (copied) {
        this.showToastNotification(toastTitle, toastDesc);
        window.audioEngine.click('blue');
      } else {
        alert(text);
      }
    } catch (e) {
      alert(text);
    }
    ta.remove();
  }

  showToastNotification(title, desc) {
    let container = document.getElementById('achievement-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'achievement-toast-container';
      container.className = 'achievement-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'achievement-toast share-toast';
    toast.innerHTML = `
      <div class="toast-icon">✨</div>
      <div class="toast-content">
        <span class="toast-label">SHARE SCORE</span>
        <h4 class="toast-title">${title}</h4>
        <p class="toast-desc">${desc}</p>
      </div>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3800);
  }

  // --- Leaderboard Modal (Phase 2) ---
  openLeaderboardModal() {
    window.audioEngine.click('blue');
    const modal = document.getElementById('leaderboard-modal');
    if (!modal) return;

    // Leaderboard Tabs setup
    const tabs = modal.querySelectorAll('.leaderboard-tab');
    tabs.forEach((tab) => {
      tab.onclick = () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.getAttribute('data-tab');
        const localPanel = document.getElementById('leaderboard-panel-local');
        const globalPanel = document.getElementById('leaderboard-panel-global');
        if (localPanel && globalPanel) {
          localPanel.classList.toggle('active', target === 'local');
          globalPanel.classList.toggle('active', target === 'global');
        }
        window.audioEngine.click('red');
      };
    });

    // Populate Local High Scores
    const localList = document.getElementById('local-leaderboard-list');
    if (localList) {
      localList.innerHTML = '';
      const localRecords = window.storageManager.getLocalLeaderboard();
      localRecords.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        row.innerHTML = `
          <div class="rank-badge rank-${idx + 1}">${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</div>
          <div class="leader-info">
            <span class="leader-icon">${item.icon}</span>
            <span class="leader-name">${item.game}</span>
          </div>
          <div class="leader-score">
            <b>${typeof item.score === 'number' ? item.score.toLocaleString() : item.score}</b> <span class="score-unit">${item.unit}</span>
          </div>
        `;
        localList.appendChild(row);
      });
    }

    // Populate Global Daily Records
    const globalList = document.getElementById('global-leaderboard-list');
    if (globalList) {
      globalList.innerHTML = '';
      const globalRecords = window.storageManager.getGlobalLeaderboard();
      globalRecords.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        row.innerHTML = `
          <div class="rank-badge rank-${item.rank}">${item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}</div>
          <div class="leader-info">
            <span class="player-country">${item.country}</span>
            <div class="player-meta">
              <span class="leader-name">${item.player}</span>
              <span class="global-game-tag">${item.game} &bull; ${item.time}</span>
            </div>
          </div>
          <div class="leader-score">
            <span class="player-tier-badge">${item.badge}</span>
            <b>${item.score.toLocaleString()}</b>
          </div>
        `;
        globalList.appendChild(row);
      });
    }

    modal.classList.add('open');
  }

  // --- Daily Challenges / Quests Modal (Phase 4) ---
  checkDailyQuestsBadge() {
    const badge = document.getElementById('quests-badge');
    if (!badge) return;
    const quests = window.storageManager.getDailyQuests();
    const hasUnclaimed = quests.some((q) => q.completed && !q.claimed);
    badge.style.display = hasUnclaimed ? 'inline-block' : 'none';
  }

  openQuestsModal() {
    window.audioEngine.click('blue');
    const modal = document.getElementById('quests-modal');
    const listEl = document.getElementById('daily-quests-list');
    const dateLabel = document.getElementById('quests-date-label');
    if (!modal || !listEl) return;

    if (dateLabel) {
      const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      dateLabel.textContent = `Today's Missions (${today})`;
    }

    const renderQuests = () => {
      listEl.innerHTML = '';
      const quests = window.storageManager.getDailyQuests();

      quests.forEach((q) => {
        const pct = Math.min(100, Math.round((q.current / q.target) * 100));
        const item = document.createElement('div');
        item.className = `quest-card ${q.completed ? 'quest-completed' : ''} ${q.claimed ? 'quest-claimed' : ''}`;

        item.innerHTML = `
          <div class="quest-top">
            <div class="quest-title-wrap">
              <span class="quest-icon">${q.icon}</span>
              <div>
                <h4 class="quest-title">${q.title}</h4>
                <p class="quest-desc">${q.desc}</p>
              </div>
            </div>
            <div class="quest-reward-pill">🪙 +${q.reward}</div>
          </div>
          <div class="quest-progress-wrap">
            <div class="quest-progress-labels">
              <span>Progress</span>
              <span><b>${q.current}</b> / ${q.target}</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
          <div class="quest-action-row">
            ${
              q.claimed
                ? `<span class="quest-claimed-badge">✓ Claimed</span>`
                : q.completed
                ? `<button class="btn btn-primary btn-sm btn-claim" data-quest-id="${q.id}">Claim +${q.reward} Coins</button>`
                : `<span class="quest-status-pending">In Progress (${pct}%)</span>`
            }
          </div>
        `;

        const claimBtn = item.querySelector('.btn-claim');
        if (claimBtn) {
          claimBtn.addEventListener('click', () => {
            const res = window.storageManager.claimQuest(q.id);
            if (res.success) {
              window.audioEngine.win();
              this.updateCoinsDisplay();
              this.checkDailyQuestsBadge();
              this.showToastNotification(`🪙 Claimed ${res.reward} Coins!`, 'Arcade balance updated. Spend in Shop!');
              renderQuests();
            }
          });
        }

        listEl.appendChild(item);
      });
    };

    renderQuests();
    modal.classList.add('open');
  }

  // --- Arcade Shop Modal (Phase 4) ---
  openShopModal() {
    window.audioEngine.click('blue');
    const modal = document.getElementById('shop-modal');
    if (!modal) return;

    const skinsGrid = document.getElementById('shop-skins-grid');
    const trailsGrid = document.getElementById('shop-trails-grid');
    const walletEl = document.getElementById('shop-wallet-amount');

    const updateWallet = () => {
      const coins = window.storageManager.getCoins();
      if (walletEl) walletEl.textContent = `${coins} Coins`;
      this.updateCoinsDisplay();
    };

    updateWallet();

    // Skins Catalog
    const skins = [
      { id: 'default', name: 'Cyber Cyan Glow', cost: 0, desc: 'Classic vibrant cyan glowing borders and sleek dark theme.', previewClass: 'preview-cyan' },
      { id: 'neon_purple', name: 'Synthwave Violet', cost: 60, desc: 'Electric magenta & purple synth borders with neon glow.', previewClass: 'preview-purple' },
      { id: 'matrix_green', name: 'Terminal Matrix', cost: 90, desc: 'CRT phosphor green cyber hacker theme and crisp scanlines.', previewClass: 'preview-matrix' },
      { id: 'prismatic_gold', name: 'Royal Prismatic Gold', cost: 150, desc: 'Ultra-rare animated prismatic gold border for arcade masters.', previewClass: 'preview-gold' }
    ];

    // Trails Catalog
    const trails = [
      { id: 'none', name: 'No Particle Trail', cost: 0, desc: 'Standard clean mouse pointer with zero particles.', icon: '🚫' },
      { id: 'stardust', name: 'Cosmic Stardust', cost: 50, desc: 'Golden and cyan twinkling stars trailing your mouse.', icon: '✨' },
      { id: 'neon_laser', name: 'Cyber Laser Trail', cost: 80, desc: 'Energetic neon cyan and crimson laser ribbons.', icon: '⚡' },
      { id: 'matrix_rain', name: 'Matrix Binary Rain', cost: 110, desc: 'Cascading digital code digits stream behind your cursor.', icon: '💻' },
      { id: 'bubbles', name: 'Zen Floating Bubbles', cost: 75, desc: 'Translucent iridescent bubbles float and softly pop.', icon: '🫧' }
    ];

    const renderShop = () => {
      updateWallet();
      const currentCoins = window.storageManager.getCoins();
      const activeSkin = window.storageManager.getActiveSkin();
      const activeTrail = window.storageManager.getActiveTrail();

      // Render Skins
      if (skinsGrid) {
        skinsGrid.innerHTML = '';
        skins.forEach((s) => {
          const isUnlocked = window.storageManager.isSkinUnlocked(s.id);
          const isEquipped = activeSkin === s.id;
          const card = document.createElement('div');
          card.className = `shop-item-card ${isEquipped ? 'equipped' : ''}`;

          card.innerHTML = `
            <div class="shop-preview ${s.previewClass}">
              <div class="preview-mini-card"></div>
            </div>
            <div class="shop-item-info">
              <h4 class="shop-item-name">${s.name}</h4>
              <p class="shop-item-desc">${s.desc}</p>
            </div>
            <div class="shop-item-action">
              ${
                isEquipped
                  ? `<button class="btn btn-secondary btn-sm btn-shop-equipped" disabled>Equipped</button>`
                  : isUnlocked
                  ? `<button class="btn btn-primary btn-sm btn-shop-equip" data-skin-id="${s.id}">Equip</button>`
                  : `<button class="btn btn-primary btn-sm btn-shop-buy" data-skin-id="${s.id}" data-cost="${s.cost}" ${currentCoins < s.cost ? 'disabled' : ''}>
                      🪙 ${s.cost} Coins
                    </button>`
              }
            </div>
          `;

          const equipBtn = card.querySelector('.btn-shop-equip');
          if (equipBtn) {
            equipBtn.addEventListener('click', () => {
              window.storageManager.setActiveSkin(s.id);
              this.applyActiveSkin();
              window.audioEngine.click('blue');
              renderShop();
            });
          }

          const buyBtn = card.querySelector('.btn-shop-buy');
          if (buyBtn) {
            buyBtn.addEventListener('click', () => {
              const res = window.storageManager.buyShopItem('skin', s.id, s.cost);
              if (res.success) {
                window.audioEngine.win();
                this.applyActiveSkin();
                this.showToastNotification(`✨ Unlocked ${s.name}!`, 'Dashboard theme skin equipped.');
                renderShop();
              }
            });
          }

          skinsGrid.appendChild(card);
        });
      }

      // Render Trails
      if (trailsGrid) {
        trailsGrid.innerHTML = '';
        trails.forEach((t) => {
          const isUnlocked = window.storageManager.isTrailUnlocked(t.id);
          const isEquipped = activeTrail === t.id;
          const card = document.createElement('div');
          card.className = `shop-item-card ${isEquipped ? 'equipped' : ''}`;

          card.innerHTML = `
            <div class="shop-preview-icon">${t.icon}</div>
            <div class="shop-item-info">
              <h4 class="shop-item-name">${t.name}</h4>
              <p class="shop-item-desc">${t.desc}</p>
            </div>
            <div class="shop-item-action">
              ${
                isEquipped
                  ? `<button class="btn btn-secondary btn-sm btn-shop-equipped" disabled>Active</button>`
                  : isUnlocked
                  ? `<button class="btn btn-primary btn-sm btn-shop-equip" data-trail-id="${t.id}">Enable</button>`
                  : `<button class="btn btn-primary btn-sm btn-shop-buy" data-trail-id="${t.id}" data-cost="${t.cost}" ${currentCoins < t.cost ? 'disabled' : ''}>
                      🪙 ${t.cost} Coins
                    </button>`
              }
            </div>
          `;

          const equipBtn = card.querySelector('.btn-shop-equip');
          if (equipBtn) {
            equipBtn.addEventListener('click', () => {
              window.storageManager.setActiveTrail(t.id);
              window.audioEngine.click('blue');
              renderShop();
            });
          }

          const buyBtn = card.querySelector('.btn-shop-buy');
          if (buyBtn) {
            buyBtn.addEventListener('click', () => {
              const res = window.storageManager.buyShopItem('trail', t.id, t.cost);
              if (res.success) {
                window.audioEngine.win();
                this.showToastNotification(`💫 Unlocked ${t.name}!`, 'Cursor particle trail enabled.');
                renderShop();
              }
            });
          }

          trailsGrid.appendChild(card);
        });
      }
    };

    renderShop();
    modal.classList.add('open');
  }

  // --- Achievements Modal ---
  openAchievementsModal() {
    window.audioEngine.click('blue');
    const modal = document.getElementById('achievements-modal');
    const listEl = document.getElementById('achievements-list');
    if (!modal || !listEl) return;

    listEl.innerHTML = '';
    const defs = StorageManager.ACHIEVEMENT_DEFS;
    const achievementsState = window.storageManager.data.achievements;
    let unlockedCount = 0;
    const totalCount = Object.keys(defs).length;

    Object.values(defs).forEach((ach) => {
      const state = achievementsState[ach.id];
      const isUnlocked = state && state.unlocked;
      if (isUnlocked) unlockedCount++;

      const item = document.createElement('div');
      item.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'} ${ach.isGod ? 'achievement-god' : ''}`;

      const statusLabel = ach.isGod
        ? (isUnlocked ? '👑 SUPREME GOD' : 'COMPLETE ALL TASKS')
        : (isUnlocked ? 'UNLOCKED' : 'LOCKED');

      item.innerHTML = `
        <div class="ach-icon ${ach.isGod ? 'ach-god-icon' : ''}">${isUnlocked ? ach.icon : (ach.isGod ? '👑' : '🔒')}</div>
        <div class="ach-info">
          <div class="ach-title-row">
            <h4 class="ach-title ${ach.isGod ? 'ach-god-title' : ''}">${ach.title}</h4>
            <span class="ach-status ${ach.isGod ? 'ach-god-status' : ''}">${statusLabel}</span>
          </div>
          <p class="ach-desc">${ach.desc}</p>
          ${isUnlocked && state.time ? `<span class="ach-date">Unlocked: ${new Date(state.time).toLocaleDateString()}</span>` : ''}
        </div>
      `;

      listEl.appendChild(item);
    });

    const progressText = document.getElementById('achievements-progress-text');
    const progressBar = document.getElementById('achievements-progress-bar');
    if (progressText) progressText.textContent = `${unlockedCount} / ${totalCount} Unlocked`;
    if (progressBar) progressBar.style.width = `${(unlockedCount / totalCount) * 100}%`;

    modal.classList.add('open');
  }

  // --- Stats Modal ---
  openStatsModal() {
    window.audioEngine.click('blue');
    const modal = document.getElementById('stats-modal');
    const contentEl = document.getElementById('stats-modal-body');
    if (!modal || !contentEl) return;

    const data = window.storageManager.data;
    const timeFormatted = window.storageManager.formatTime(data.totalSecondsWasted);
    const totalPlays = window.storageManager.getTotalGamesPlayed();
    const mostPlayed = window.storageManager.getMostPlayedGame(this.gamesCatalog);
    const unlockedCount = window.storageManager.getUnlockedAchievementsCount();
    const totalAchievements = window.storageManager.getTotalAchievementsCount();

    contentEl.innerHTML = `
      <div class="stats-overview-grid">
        <div class="stat-card">
          <span class="stat-num">${timeFormatted}</span>
          <span class="stat-title">Total Time Wasted</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${totalPlays}</span>
          <span class="stat-title">Total Mini-Games Launched</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${unlockedCount} / ${totalAchievements}</span>
          <span class="stat-title">Achievements Unlocked</span>
        </div>
        <div class="stat-card">
          <span class="stat-num" style="font-size: 1.05rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${mostPlayed}</span>
          <span class="stat-title">Favorite / Most Played</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${data.highScores.snake || 0}</span>
          <span class="stat-title">Snake Record</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${data.highScores.puzzle2048 || 0}</span>
          <span class="stat-title">2048 Record</span>
        </div>
      </div>

      <div class="stats-details-section">
        <h4>Arcade Hall Highlights</h4>
        <ul class="stats-detail-list">
          <li><b>Activities in Hub:</b> 36 Active Games</li>
          <li><b>Tetris Best Score:</b> ${window.storageManager.getHighScore('tetris', 0)}</li>
          <li><b>Neon Pong Best Rally:</b> ${window.storageManager.getHighScore('pong_rally', 0)} hits</li>
          <li><b>Aim Drill Accuracy:</b> ${data.highScores.aim?.bestAccuracy || 0}%</li>
          <li><b>Bubbles Popped:</b> ${data.highScores.fidget?.bubblesPopped || 0}</li>
          <li><b>Wordle Streak:</b> ${data.highScores.wordle?.currentStreak || 0} (Best: ${data.highScores.wordle?.maxStreak || 0})</li>
        </ul>
      </div>
    `;

    modal.classList.add('open');
  }
}

// Instantiate App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.arcadeApp = new ArcadeApp();
});
