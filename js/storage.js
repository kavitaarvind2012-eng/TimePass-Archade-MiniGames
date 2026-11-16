/**
 * TimePass Arcade - Storage & Stats Manager
 * Handles persistent stats, live time tracker, and 38 achievements across 36 games.
 */
class StorageManager {
  constructor() {
    this.storageKey = 'timepass_data_v2';
    this.data = this.loadData();
    this.listeners = [];
    this.startTimeTracker();
  }

  getDefaultData() {
    return {
      totalSecondsWasted: 0,
      arcadeCoins: 120, // Starting bonus currency for the Arcade Shop
      favorites: ['snake', 'fidget'], // Default favorite games
      themePalette: 'cyan', // 'cyan', 'purple', 'emerald', 'sunset'
      unlockedSkins: ['default'],
      activeSkin: 'default',
      unlockedTrails: ['none'],
      activeTrail: 'none',
      dailyQuestsDate: '',
      dailyQuests: [],
      gamePlays: {}, // { [gameId]: count }
      highScores: {
        snake: 0,
        snakeLength: 0,
        puzzle2048: 0,
        puzzle2048MaxTile: 0,
        memory: {
          easy: { bestTime: null, minMoves: null },
          medium: { bestTime: null, minMoves: null },
          hard: { bestTime: null, minMoves: null }
        },
        aim: {
          highScore: 0,
          bestAccuracy: 0,
          fastestReactionMs: null
        },
        fidget: {
          bubblesPopped: 0,
          keysClicked: 0
        },
        wordle: {
          played: 0,
          won: 0,
          currentStreak: 0,
          maxStreak: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
        }
      },
      achievements: {}
    };
  }

  loadData() {
    try {
      // Migrate from v1 if present
      let raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        raw = localStorage.getItem('timepass_data_v1');
      }
      if (!raw) return this.getDefaultData();
      const parsed = JSON.parse(raw);
      const defaults = this.getDefaultData();
      return {
        ...defaults,
        ...parsed,
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : defaults.favorites,
        unlockedSkins: Array.isArray(parsed.unlockedSkins) ? parsed.unlockedSkins : defaults.unlockedSkins,
        unlockedTrails: Array.isArray(parsed.unlockedTrails) ? parsed.unlockedTrails : defaults.unlockedTrails,
        dailyQuests: Array.isArray(parsed.dailyQuests) ? parsed.dailyQuests : defaults.dailyQuests,
        arcadeCoins: typeof parsed.arcadeCoins === 'number' ? parsed.arcadeCoins : defaults.arcadeCoins,
        themePalette: parsed.themePalette || defaults.themePalette,
        activeSkin: parsed.activeSkin || defaults.activeSkin,
        activeTrail: parsed.activeTrail || defaults.activeTrail,
        gamePlays: { ...defaults.gamePlays, ...(parsed.gamePlays || {}) },
        highScores: { ...defaults.highScores, ...(parsed.highScores || {}) },
        achievements: { ...defaults.achievements, ...(parsed.achievements || {}) }
      };
    } catch (e) {
      console.error('Failed to load storage:', e);
      return this.getDefaultData();
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  startTimeTracker() {
    setInterval(() => {
      this.data.totalSecondsWasted++;
      // Time achievements: 1 hour, 2 hours, 5 hours, 10 hours
      if (this.data.totalSecondsWasted >= 3600 && !this.isUnlocked('time_1h')) {
        this.unlock('time_1h');
      }
      if (this.data.totalSecondsWasted >= 7200 && !this.isUnlocked('time_2h')) {
        this.unlock('time_2h');
      }
      if (this.data.totalSecondsWasted >= 18000 && !this.isUnlocked('time_5h')) {
        this.unlock('time_5h');
      }
      if (this.data.totalSecondsWasted >= 36000 && !this.isUnlocked('time_10h')) {
        this.unlock('time_10h');
      }
      if (this.data.totalSecondsWasted % 5 === 0) {
        this.save();
      }
      this.notifyTimeChange(this.data.totalSecondsWasted);
    }, 1000);
  }

  onTimeTick(cb) {
    this.listeners.push(cb);
  }

  notifyTimeChange(sec) {
    this.listeners.forEach((cb) => cb(sec));
  }

  formatTime(totalSec) {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
    }
    return `${pad(mins)}m ${pad(secs)}s`;
  }

  // --- Tracking Game Launches & Cross-Game Feats ---
  recordGameLaunch(gameId, category = null) {
    this.data.gamePlays[gameId] = (this.data.gamePlays[gameId] || 0) + 1;
    this.save();

    // Reward active playtime with coins (e.g. 2 coins per new launch)
    this.addCoins(2);

    // Record quest progress
    this.recordQuestProgress('play', 1, { gameId, category });

    const uniqueGames = Object.keys(this.data.gamePlays).length;
    if (uniqueGames >= 10) {
      this.unlock('play_10');
    }
    if (uniqueGames >= 36) {
      this.unlock('play_all');
    }
  }

  getTotalGamesPlayed() {
    return Object.values(this.data.gamePlays).reduce((a, b) => a + b, 0);
  }

  getMostPlayedGame(catalog = []) {
    let bestId = null;
    let max = 0;
    for (const [id, count] of Object.entries(this.data.gamePlays)) {
      if (count > max) {
        max = count;
        bestId = id;
      }
    }
    if (!bestId) return 'None yet';
    const found = catalog.find((g) => g.id === bestId);
    return found ? `${found.title} (${max} plays)` : `${bestId} (${max} plays)`;
  }

  // Generic High Score Getter & Setter for all 36 games
  getHighScore(gameId, defaultValue = 0) {
    const val = this.data.highScores[gameId];
    return val !== undefined ? val : defaultValue;
  }

  setGameScore(gameId, score) {
    let current = this.getHighScore(gameId, 0);
    if (typeof current !== 'number') current = 0;
    this.recordQuestProgress('score', score, { gameId });
    if (score > current) {
      this.data.highScores[gameId] = score;
      this.save();
      return true;
    }
    return false;
  }

  // Specific high score setters for existing games
  setSnakeScore(score, length) {
    let updated = false;
    if (score > (this.data.highScores.snake || 0)) {
      this.data.highScores.snake = score;
      updated = true;
    }
    if (length > (this.data.highScores.snakeLength || 0)) {
      this.data.highScores.snakeLength = length;
    }
    if (score >= 100) this.unlock('snake_charmer');
    this.save();
    return updated;
  }

  set2048Score(score, maxTile) {
    let updated = false;
    if (score > (this.data.highScores.puzzle2048 || 0)) {
      this.data.highScores.puzzle2048 = score;
      updated = true;
    }
    if (maxTile > (this.data.highScores.puzzle2048MaxTile || 0)) {
      this.data.highScores.puzzle2048MaxTile = maxTile;
    }
    if (maxTile >= 1024) this.unlock('puzzle_1024');
    this.save();
    return updated;
  }

  setMemoryScore(diff, timeSec, moves) {
    if (!this.data.highScores.memory) this.data.highScores.memory = {};
    const curr = this.data.highScores.memory[diff] || { bestTime: null, minMoves: null };
    let updated = false;
    if (curr.bestTime === null || timeSec < curr.bestTime) {
      curr.bestTime = timeSec;
      updated = true;
    }
    if (curr.minMoves === null || moves < curr.minMoves) {
      curr.minMoves = moves;
      updated = true;
    }
    this.data.highScores.memory[diff] = curr;

    if (timeSec <= 40) this.unlock('memory_quick');
    if (diff === 'hard') this.unlock('memory_master');
    this.save();
    return updated;
  }

  setAimScore(score, accuracy, avgReactionMs) {
    if (!this.data.highScores.aim) {
      this.data.highScores.aim = { highScore: 0, bestAccuracy: 0, fastestReactionMs: null };
    }
    let updated = false;
    if (score > this.data.highScores.aim.highScore) {
      this.data.highScores.aim.highScore = score;
      updated = true;
    }
    if (accuracy > this.data.highScores.aim.bestAccuracy) {
      this.data.highScores.aim.bestAccuracy = accuracy;
    }
    if (avgReactionMs && (!this.data.highScores.aim.fastestReactionMs || avgReactionMs < this.data.highScores.aim.fastestReactionMs)) {
      this.data.highScores.aim.fastestReactionMs = Math.round(avgReactionMs);
    }
    if (accuracy >= 90) this.unlock('aim_reflex');
    if (score >= 1200) this.unlock('aim_deadeye');
    this.save();
    return updated;
  }

  incrementBubbles(count = 1) {
    if (!this.data.highScores.fidget) this.data.highScores.fidget = { bubblesPopped: 0, keysClicked: 0 };
    this.data.highScores.fidget.bubblesPopped += count;
    if (this.data.highScores.fidget.bubblesPopped >= 100) {
      this.unlock('bubble_maniac');
    }
    this.save();
  }

  incrementKeys(count = 1) {
    if (!this.data.highScores.fidget) this.data.highScores.fidget = { bubblesPopped: 0, keysClicked: 0 };
    this.data.highScores.fidget.keysClicked += count;
    if (this.data.highScores.fidget.keysClicked >= 50) {
      this.unlock('switch_clicker');
    }
    this.save();
  }

  recordWordleGame(won, guesses) {
    if (!this.data.highScores.wordle) {
      this.data.highScores.wordle = { played: 0, won: 0, currentStreak: 0, maxStreak: 0, distribution: {} };
    }
    const w = this.data.highScores.wordle;
    w.played++;
    if (won) {
      w.won++;
      w.currentStreak++;
      if (w.currentStreak > w.maxStreak) w.maxStreak = w.currentStreak;
      if (guesses >= 1 && guesses <= 6) {
        w.distribution[guesses] = (w.distribution[guesses] || 0) + 1;
      }
      if (guesses <= 3) {
        this.unlock('word_wizard');
      }
    } else {
      w.currentStreak = 0;
    }
    this.save();
  }

  // --- Expanded Achievements System (40 Achievements including God of Time Wastage) ---
  static get ACHIEVEMENT_DEFS() {
    return {
      // Dedicated Time Achievements (1h, 2h, 5h, 10h)
      time_1h: { id: 'time_1h', title: '1-Hour Veteran', desc: 'Waste a full 1 hour playing in TimePass Arcade.', icon: '⏳' },
      time_2h: { id: 'time_2h', title: '2-Hour Devotion', desc: 'Waste 2 hours avoiding real work in TimePass Arcade.', icon: '🛋️' },
      time_5h: { id: 'time_5h', title: '5-Hour Marathon', desc: 'Dedicate 5 cumulative hours to mini-game mastery.', icon: '⌛' },
      time_10h: { id: 'time_10h', title: '10-Hour Immortal', desc: 'Waste an astonishing 10 hours in TimePass Arcade!', icon: '🌌' },

      snake_charmer: { id: 'snake_charmer', title: 'Snake Charmer', desc: 'Reach 100+ points in Neon Snake.', icon: '🐍' },
      snake_power: { id: 'snake_power', title: 'Power Overwhelming', desc: 'Consume any special glowing power-up fruit in Snake.', icon: '⚡' },
      puzzle_1024: { id: 'puzzle_1024', title: 'Tile Wizard', desc: 'Reach tile 1024 or higher in 2048.', icon: '🧱' },
      puzzle_undo: { id: 'puzzle_undo', title: 'Second Chance', desc: 'Use the Undo button to reverse a mistake in 2048.', icon: '⏪' },
      memory_quick: { id: 'memory_quick', title: 'Photographic Reflex', desc: 'Complete any Memory Match puzzle in under 40 seconds.', icon: '🧠' },
      memory_master: { id: 'memory_master', title: 'Mind Paladin', desc: 'Conquer the 8x8 Master difficulty in Memory Match.', icon: '👑' },
      aim_reflex: { id: 'aim_reflex', title: 'Cyber Reflexes', desc: 'Score 90% or higher accuracy in Reaction & Aim Trainer.', icon: '🎯' },
      aim_deadeye: { id: 'aim_deadeye', title: 'Deadeye Sniper', desc: 'Score 1,200+ points in a single 30s Aim session.', icon: '🔥' },
      bubble_maniac: { id: 'bubble_maniac', title: 'Popaholic', desc: 'Pop over 100 bubbles in the Infinite Bubble Wrap.', icon: '🫧' },
      switch_clicker: { id: 'switch_clicker', title: 'Keeb Enthusiast', desc: 'Click tactile mechanical switches 50 times.', icon: '⌨️' },
      word_wizard: { id: 'word_wizard', title: 'Word Genius', desc: 'Crack a 5-letter Wordle mystery in 3 attempts or fewer.', icon: '💡' },

      // Exploration & Game Feats
      play_10: { id: 'play_10', title: 'Arcade Explorer', desc: 'Launch and try at least 10 different mini-games.', icon: '🗺️' },
      play_all: { id: 'play_all', title: 'Grand Completionist', desc: 'Launch and play all 36 arcade activities!', icon: '🌟' },
      tetris_clear: { id: 'tetris_clear', title: 'Tetromino Master', desc: 'Clear 4 or more lines in Tetris Block Drop.', icon: '🟦' },
      pong_rally: { id: 'pong_rally', title: 'Pong Champion', desc: 'Achieve a rally streak of 10+ paddle bounces in Neon Pong.', icon: '🏓' },
      ttt_master: { id: 'ttt_master', title: 'Unbeatable Challenger', desc: 'Draw or defeat the unbeatable Minimax AI in Tic-Tac-Toe.', icon: '⚔️' },
      rps_spock: { id: 'rps_spock', title: 'Logic & Vulcan', desc: 'Achieve a 3-win streak in RPS Lizard Spock.', icon: '🖖' },
      flappy_10: { id: 'flappy_10', title: 'Cyber Aviator', desc: 'Fly past 10 glowing neon pipes in Cyber Flappy.', icon: '🚀' },
      star_catcher: { id: 'star_catcher', title: 'Celestial Harvester', desc: 'Catch 25+ stars in Star Catcher without detonating a bomb.', icon: '⭐' },
      mole_whacker: { id: 'mole_whacker', title: 'Hammer Time', desc: 'Whack 20+ cyber targets in a 30s Neon Whack-A-Mole blitz.', icon: '🔨' },
      simon_seq: { id: 'simon_seq', title: 'Harmonic Savant', desc: 'Memorize a Simon Tone Sequence of length 7 or higher.', icon: '🎵' },
      minesweeper_win: { id: 'minesweeper_win', title: 'Bomb Squad', desc: 'Safely sweep and uncover the 9x9 Minesweeper minefield.', icon: '💣' },
      math_streak: { id: 'math_streak', title: 'Quick Calculator', desc: 'Solve 12+ mental arithmetic problems in 30s Math Blitz.', icon: '➗' },
      gate_pass: { id: 'gate_pass', title: 'Color Sync', desc: 'Pass safely through 8 rotating rings in Color Gate Reflex.', icon: '🎪' },
      tower_stack: { id: 'tower_stack', title: 'Skyscraper', desc: 'Stack a precision tower 12 blocks high in Tower Stacker.', icon: '🏙️' },
      typer_speed: { id: 'typer_speed', title: 'Laser Typist', desc: 'Laser-zap 15 descending words in Falling Word Typer.', icon: '💻' },
      dice_d20: { id: 'dice_d20', title: 'Natural 20', desc: 'Roll a critical 20 on the 20-sided die in Dice & Coin Fidget.', icon: '🎲' },
      maze_solved: { id: 'maze_solved', title: 'Pathfinder', desc: 'Navigate and conquer a procedural labyrinth in Maze Runner.', icon: '🌀' },
      hangman_saved: { id: 'hangman_saved', title: 'Gallows Escape', desc: 'Guess the mystery word with 0 errors in Neon Hangman.', icon: '🪢' },
      blackjack_21: { id: 'blackjack_21', title: 'Natural 21', desc: 'Win a hand with exactly 21 points in Blackjack.', icon: '🃏' },
      slot_jackpot: { id: 'slot_jackpot', title: 'Neon Jackpot', desc: 'Hit 3 matching symbols on the Lucky Slot Spinner.', icon: '🎰' },
      corner_hit: { id: 'corner_hit', title: 'Corner Witness', desc: 'Witness the bouncing logo hit the exact screen corner!', icon: '📺' },
      plinko_jackpot: { id: 'plinko_jackpot', title: 'Plinko Wizard', desc: 'Land a glowing ball in the 10x jackpot bucket in Pegboard Plinko.', icon: '🔮' },
      lights_out: { id: 'lights_out', title: 'Darkness Prevails', desc: 'Turn off every single light on the 5x5 Lights Out grid.', icon: '💡' },
      bullet_survivor: { id: 'bullet_survivor', title: 'Matrix Dodger', desc: 'Survive over 20 seconds in Bullet Hell Dodge.', icon: '🛡️' },

      // Supreme Ultimate Achievement (Unlocked when all other tasks/achievements are completed)
      god_of_time: {
        id: 'god_of_time',
        title: 'God of Time Wastage',
        desc: 'The ultimate legend of procrastination. Conquered and completed every single achievement in TimePass Arcade.',
        icon: '👑',
        isGod: true
      }
    };
  }

  isUnlocked(id) {
    return this.data.achievements[id] && this.data.achievements[id].unlocked;
  }

  unlock(id) {
    if (!this.data.achievements[id]) {
      this.data.achievements[id] = { unlocked: false, time: null };
    }
    if (this.data.achievements[id].unlocked) return;

    this.data.achievements[id].unlocked = true;
    this.data.achievements[id].time = new Date().toISOString();
    this.save();

    // Trigger celebration sound
    if (window.audioEngine) {
      if (id === 'god_of_time') {
        window.audioEngine.win();
        setTimeout(() => window.audioEngine.win(), 350);
      } else {
        window.audioEngine.win();
      }
    }

    // Trigger Toast Notification
    const def = StorageManager.ACHIEVEMENT_DEFS[id];
    if (def) {
      this.showToast(def);
    }

    // Check if all other achievements are unlocked to crown God of Time Wastage!
    if (id !== 'god_of_time') {
      this.checkGodOfTime();
    }
  }

  checkGodOfTime() {
    if (this.isUnlocked('god_of_time')) return;
    const defs = StorageManager.ACHIEVEMENT_DEFS;
    for (const key of Object.keys(defs)) {
      if (key !== 'god_of_time' && !this.isUnlocked(key)) {
        return;
      }
    }
    setTimeout(() => {
      this.unlock('god_of_time');
    }, 600);
  }

  getUnlockedAchievementsCount() {
    let count = 0;
    const defs = StorageManager.ACHIEVEMENT_DEFS;
    for (const id of Object.keys(defs)) {
      if (this.isUnlocked(id)) count++;
    }
    return count;
  }

  getTotalAchievementsCount() {
    return Object.keys(StorageManager.ACHIEVEMENT_DEFS).length;
  }

  // ========================================================================
  // PHASE 1: FAVORITES & BOOKMARKS SYSTEM
  // ========================================================================
  toggleFavorite(gameId) {
    if (!this.data.favorites) this.data.favorites = [];
    const idx = this.data.favorites.indexOf(gameId);
    let isFav = false;
    if (idx >= 0) {
      this.data.favorites.splice(idx, 1);
      isFav = false;
    } else {
      this.data.favorites.push(gameId);
      isFav = true;
    }
    this.save();
    return isFav;
  }

  isFavorite(gameId) {
    return (this.data.favorites || []).includes(gameId);
  }

  getFavorites() {
    return this.data.favorites || [];
  }

  // ========================================================================
  // PHASE 3: THEME PALETTE PREFERENCE
  // ========================================================================
  getThemePalette() {
    return this.data.themePalette || 'cyan';
  }

  setThemePalette(palette) {
    this.data.themePalette = palette;
    this.save();
  }

  // ========================================================================
  // PHASE 4: ARCADE COINS, PROGRESSION & SHOP
  // ========================================================================
  getCoins() {
    return this.data.arcadeCoins || 0;
  }

  addCoins(amount) {
    this.data.arcadeCoins = (this.data.arcadeCoins || 0) + amount;
    this.save();
    return this.data.arcadeCoins;
  }

  spendCoins(amount) {
    if ((this.data.arcadeCoins || 0) >= amount) {
      this.data.arcadeCoins -= amount;
      this.save();
      return true;
    }
    return false;
  }

  isSkinUnlocked(skinId) {
    return (this.data.unlockedSkins || ['default']).includes(skinId);
  }

  getActiveSkin() {
    return this.data.activeSkin || 'default';
  }

  setActiveSkin(skinId) {
    this.data.activeSkin = skinId;
    this.save();
  }

  isTrailUnlocked(trailId) {
    return (this.data.unlockedTrails || ['none']).includes(trailId);
  }

  getActiveTrail() {
    return this.data.activeTrail || 'none';
  }

  setActiveTrail(trailId) {
    this.data.activeTrail = trailId;
    this.save();
  }

  buyShopItem(type, itemId, cost) {
    if (!this.spendCoins(cost)) return { success: false, reason: 'insufficient_coins' };
    if (type === 'skin') {
      if (!this.data.unlockedSkins.includes(itemId)) {
        this.data.unlockedSkins.push(itemId);
      }
      this.data.activeSkin = itemId;
    } else if (type === 'trail') {
      if (!this.data.unlockedTrails.includes(itemId)) {
        this.data.unlockedTrails.push(itemId);
      }
      this.data.activeTrail = itemId;
    }
    this.save();
    return { success: true };
  }

  // ========================================================================
  // PHASE 4: DAILY CHALLENGES / QUESTS (24h Reset)
  // ========================================================================
  getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  getDailyQuests() {
    const today = this.getTodayString();
    if (this.data.dailyQuestsDate !== today || !this.data.dailyQuests || this.data.dailyQuests.length === 0) {
      this.data.dailyQuestsDate = today;
      this.data.dailyQuests = this.generateDailyQuests(today);
      this.save();
    }
    return this.data.dailyQuests;
  }

  generateDailyQuests(dateStr) {
    const questPool = [
      { id: 'q_arcade', title: 'Arcade Rush', desc: 'Launch and play 3 different Arcade games', target: 3, current: 0, reward: 60, icon: '⚡', category: 'arcade' },
      { id: 'q_puzzle', title: 'Brain Teaser', desc: 'Tackle 2 Brain & Puzzle challenges', target: 2, current: 0, reward: 50, icon: '🧩', category: 'brain' },
      { id: 'q_chill', title: 'Fidget & Relax', desc: 'Unwind with 2 Chill / Fidget activities', target: 2, current: 0, reward: 40, icon: '🫧', category: 'chill' },
      { id: 'q_snake', title: 'Serpent Sprint', desc: 'Score 40+ points in Neon Snake', target: 40, current: 0, reward: 50, icon: '🐍', gameId: 'snake' },
      { id: 'q_tetris', title: 'Tetris Architect', desc: 'Score 300+ points in Tetris Block Drop', target: 300, current: 0, reward: 75, icon: '🟦', gameId: 'tetris' },
      { id: 'q_aim', title: 'Reflex Shooter', desc: 'Score 500+ points in Reaction & Aim Trainer', target: 500, current: 0, reward: 60, icon: '🎯', gameId: 'aim' },
      { id: 'q_bubble', title: 'Bubble Master', desc: 'Pop 50 bubbles in Bubble Wrap', target: 50, current: 0, reward: 45, icon: '🫧', gameId: 'fidget' },
      { id: 'q_flappy', title: 'Neon Pilot', desc: 'Fly past 6 pipes in Cyber Flappy', target: 6, current: 0, reward: 70, icon: '🚀', gameId: 'flappy' }
    ];

    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash << 5) - hash + dateStr.charCodeAt(i);
      hash |= 0;
    }
    hash = Math.abs(hash);

    const shuffled = [...questPool].sort((a, b) => {
      const ha = (hash + a.id.charCodeAt(2) * 17) % 100;
      const hb = (hash + b.id.charCodeAt(2) * 17) % 100;
      return ha - hb;
    });

    return shuffled.slice(0, 3).map((q) => ({
      ...q,
      current: 0,
      completed: false,
      claimed: false
    }));
  }

  recordQuestProgress(type, count = 1, metadata = {}) {
    const quests = this.getDailyQuests();
    let updated = false;

    quests.forEach((q) => {
      if (q.completed) return;

      if (q.category && metadata.category === q.category) {
        q.current = Math.min(q.target, q.current + count);
        if (q.current >= q.target) q.completed = true;
        updated = true;
      } else if (q.gameId && metadata.gameId === q.gameId) {
        if (type === 'score') {
          q.current = Math.max(q.current, count);
        } else {
          q.current = Math.min(q.target, q.current + count);
        }
        if (q.current >= q.target) q.completed = true;
        updated = true;
      }
    });

    if (updated) {
      this.save();
    }
  }

  claimQuest(questId) {
    const quests = this.getDailyQuests();
    const q = quests.find((item) => item.id === questId);
    if (q && q.completed && !q.claimed) {
      q.claimed = true;
      this.addCoins(q.reward);
      this.save();
      return { success: true, reward: q.reward };
    }
    return { success: false };
  }

  // ========================================================================
  // PHASE 2: LEADERBOARD SYSTEM (Local & Global Backend Template)
  // ========================================================================
  getLocalLeaderboard() {
    const items = [
      { game: 'Neon Snake', score: this.data.highScores.snake || 0, unit: 'pts', icon: '🐍' },
      { game: '2048 Puzzle', score: this.data.highScores.puzzle2048 || 0, unit: 'pts', icon: '🧱' },
      { game: 'Tetris Block Drop', score: this.getHighScore('tetris', 0), unit: 'pts', icon: '🟦' },
      { game: 'Cyber Flappy', score: this.getHighScore('flappy', 0), unit: 'pipes', icon: '🚀' },
      { game: 'Neon Whack-A-Mole', score: this.getHighScore('mole', 0), unit: 'whacks', icon: '🔨' },
      { game: 'Reaction Aim Trainer', score: this.data.highScores.aim?.highScore || 0, unit: 'pts', icon: '🎯' },
      { game: 'Falling Word Typer', score: this.getHighScore('word_typer', 0), unit: 'pts', icon: '💻' },
      { game: 'Color Gate Reflex', score: this.getHighScore('color_gate', 0), unit: 'rings', icon: '🎪' },
      { game: 'Neon Pong', score: this.getHighScore('pong_rally', 0), unit: 'rally', icon: '🏓' },
      { game: 'Star Catcher', score: this.getHighScore('star_catcher', 0), unit: 'stars', icon: '⭐' }
    ];
    return items.sort((a, b) => b.score - a.score);
  }

  getGlobalLeaderboard() {
    // Configurable endpoint support: window.TIMEPASS_API_URL or mock daily leaderboard
    return [
      { rank: 1, player: 'NeonViper_99', country: '🇯🇵 JP', score: 3840, game: 'Tetris Block Drop', time: '12m ago', badge: 'Apex Legend' },
      { rank: 2, player: 'CyberGhost_X', country: '🇩🇪 DE', score: 2950, game: 'Neon Snake', time: '34m ago', badge: 'Grandmaster' },
      { rank: 3, player: 'PixelSamurai', country: '🇺🇸 US', score: 2710, game: 'Cyber Flappy', time: '1h ago', badge: 'Ace' },
      { rank: 4, player: 'QuantumLeap', country: '🇨🇦 CA', score: 2480, game: 'Falling Word Typer', time: '2h ago', badge: 'Pro' },
      { rank: 5, player: 'SynthQueen', country: '🇬🇧 UK', score: 2210, game: 'Reaction & Aim', time: '3h ago', badge: 'Pro' },
      { rank: 6, player: 'AstroChaser', country: '🇫🇷 FR', score: 1980, game: 'Color Gate Reflex', time: '4h ago', badge: 'Veteran' },
      { rank: 7, player: 'ZeroCool', country: '🇦🇺 AU', score: 1850, game: 'Star Catcher', time: '5h ago', badge: 'Veteran' },
      { rank: 8, player: 'BoredomSlayer', country: '🇧🇷 BR', score: 1690, game: 'Tower Stacker', time: '6h ago', badge: 'Rising' }
    ];
  }

  showToast(def) {
    let container = document.getElementById('achievement-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'achievement-toast-container';
      container.className = 'achievement-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="toast-icon">${def.icon}</div>
      <div class="toast-content">
        <span class="toast-label">ACHIEVEMENT UNLOCKED!</span>
        <h4 class="toast-title">${def.title}</h4>
        <p class="toast-desc">${def.desc}</p>
      </div>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }
}

// Global storage manager instance
window.storageManager = new StorageManager();
