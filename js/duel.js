/**
 * Score-race layer for arcade games that do not have a dedicated online ruleset.
 * Games with native online moves continue to handle those through their own class.
 */
class OnlineDuelController {
  constructor({ gameId, game, network, isHost }) {
    this.gameId = gameId;
    this.game = game;
    this.network = network;
    this.isHost = isHost;
    this.manualFinish = false;
    this.activityCount = 0;
    this.lastSent = '';
    this.lastSentAt = 0;
    this.remoteSnapshot = null;
    this.panel = document.getElementById('online-duel-hud');
    this.localScore = document.getElementById('online-duel-local-score');
    this.opponentScore = document.getElementById('online-duel-opponent-score');
    this.status = document.getElementById('online-duel-status');
    this.roomLabel = document.getElementById('online-duel-room-label');
    this.finishButton = document.getElementById('online-duel-finish-btn');
    this.gameView = document.getElementById('game-view');
    this.interval = null;

    if (!this.panel || !this.localScore || !this.opponentScore || !this.status ||
        !this.roomLabel || !this.finishButton || !this.gameView) {
      throw new Error('Online duel status panel is missing from the game view.');
    }

    this.panel.hidden = false;
    this.finishButton.disabled = false;
    this.roomLabel.textContent = `Room ${network.roomCode || ''} · ${isHost ? 'Host' : 'Guest'}`;
    this.boundFinish = () => {
      this.manualFinish = true;
      this.finishButton.disabled = true;
      this.publish(true);
      this.updateDisplay();
    };
    this.finishButton.addEventListener('click', this.boundFinish);
    this.boundActivity = (event) => {
      if (event.target && typeof event.target.closest === 'function' &&
          event.target.closest('#active-game-mount')) this.activityCount++;
    };
    this.gameView.addEventListener('pointerdown', this.boundActivity, true);
    this.gameView.addEventListener('keydown', this.boundActivity, true);
    this.sample();
    this.interval = setInterval(() => this.sample(), 400);
  }

  metric() {
    const game = this.game;
    const metrics = {
      snake: () => ['Food', game.score, false],
      puzzle2048: () => ['Points', game.score, false],
      memory: () => ['Pairs', game.matchedPairs, false],
      aim: () => ['Hits', game.hits, false],
      fidget: () => ['Fidgets', (game.bubblesPoppedSession || 0) + (game.keysClickedSession || 0), false],
      wordle: () => ['Solved', game.isGameOver && game.guesses?.length ? 1 : 0, false],
      tetris: () => ['Points', game.score, false],
      pong: () => ['Points', this.isHost ? game.playerScore : game.aiScore, false],
      ttt: () => ['Wins', this.isHost ? game.stats?.x : game.stats?.o, false],
      rpsls: () => ['Win streak', game.streak, false],
      flappy: () => ['Pipes', game.score, false],
      starcatcher: () => ['Stars', game.score, false],
      mole: () => ['Moles', game.score, false],
      simon: () => ['Rounds', game.score, false],
      minesweeper: () => ['Time', game.timer || 0, true],
      mathblitz: () => ['Points', game.score, false],
      colorgate: () => ['Gates', game.score, false],
      towerstacker: () => ['Blocks', game.score, false],
      wordtyper: () => ['Words', game.score, false],
      dicecoin: () => ['Rolls', game.rollHistory?.length || 0, false],
      mazerunner: () => ['Time', game.timer || 0, true],
      hangman: () => ['Guesses left', Math.max(0, (game.maxErrors || 6) - (game.errors || 0)), false],
      blackjack: () => ['Wins', game.wins || game.roundsWon || 0, false],
      slotspinner: () => ['Wins', game.wins || game.score || 0, false],
      bouncinglogo: () => ['Bounces', game.bounces || game.hits || 0, false],
      plinko: () => ['Points', game.score || game.totalScore || 0, false],
      lightsout: () => ['Moves', game.moves || 0, true],
      coreclicker: () => ['Points', game.score || game.clicks || 0, false],
      vaultcracker: () => ['Attempts', game.attempts || 0, true],
      tileslide: () => ['Moves', game.moves || 0, true],
      bullethell: () => ['Seconds', Number(game.survivalSeconds) || 0, false],
      connectfour: () => ['Round wins', game.isOver && game.checkWin?.(game.playerId) ? 1 : 0, false],
      hilo: () => ['Streak', game.streak, false],
      rhythmtap: () => ['Notes', game.score, false],
      asteroidblaster: () => ['Asteroids', game.score, false],
      stonebalancer: () => ['Stack', game.score, false]
    };
    const [label, rawValue, lowerIsBetter] =
      (metrics[this.gameId] || (() => ['Actions', 0, false]))();
    const value = Number(rawValue);
    return {
      label: Number.isFinite(value) ? label : 'Actions',
      value: Number.isFinite(value) ? value : this.activityCount,
      lowerIsBetter: Number.isFinite(value) ? lowerIsBetter : false
    };
  }

  isGameFinished() {
    return Boolean(
      this.manualFinish ||
      this.game.isGameOver === true ||
      this.game.isOver === true ||
      this.game.isComplete === true ||
      this.game.solved === true
    );
  }

  sample() {
    const metric = this.metric();
    this.localScore.textContent = `${metric.value} ${metric.label.toLowerCase()}`;
    this.publish(this.isGameFinished(), metric);
    this.updateDisplay(metric);
  }

  publish(finished, metric = this.metric()) {
    const snapshot = {
      game: this.gameId,
      action: 'duel_snapshot',
      value: metric.value,
      label: metric.label,
      lowerIsBetter: metric.lowerIsBetter,
      finished,
      timestamp: Date.now()
    };
    const signature = JSON.stringify({ ...snapshot, timestamp: 0 });
    const now = Date.now();
    if (signature === this.lastSent && now - this.lastSentAt < 3000) return;
    this.lastSent = signature;
    this.lastSentAt = now;
    this.network.sendMove(snapshot);
  }

  handleNetworkMessage(payload) {
    const data = payload?.data;
    if (data?.action !== 'duel_snapshot' || data.game !== this.gameId ||
        !Number.isFinite(data.value) || typeof data.finished !== 'boolean') return;
    this.remoteSnapshot = {
      value: data.value,
      label: typeof data.label === 'string' ? data.label : 'Score',
      lowerIsBetter: Boolean(data.lowerIsBetter),
      finished: data.finished
    };
    this.updateDisplay();
  }

  updateDisplay(metric = this.metric()) {
    if (!this.remoteSnapshot) {
      this.opponentScore.textContent = 'Waiting…';
      this.status.textContent = 'Opponent connected. Play your run; scores update live.';
      return;
    }
    this.opponentScore.textContent =
      `${this.remoteSnapshot.value} ${this.remoteSnapshot.label.toLowerCase()}`;

    if (!this.manualFinish && !this.isGameFinished()) this.finishButton.disabled = false;
    if (this.manualFinish && !this.remoteSnapshot.finished) {
      this.status.textContent = 'Your run is finished. Waiting for your opponent…';
      return;
    }
    if (this.remoteSnapshot.finished && !this.isGameFinished()) {
      this.status.textContent = 'Your opponent finished. Finish your run to compare.';
      return;
    }

    const lowerIsBetter = metric.lowerIsBetter;
    if (this.isGameFinished() && this.remoteSnapshot.finished) {
      const localWins = lowerIsBetter
        ? metric.value < this.remoteSnapshot.value
        : metric.value > this.remoteSnapshot.value;
      const tied = metric.value === this.remoteSnapshot.value;
      this.status.textContent = tied ? '🤝 Duel tied!' : localWins ? '🏆 You won the duel!' : 'Your opponent won this duel.';
      this.finishButton.disabled = true;
      return;
    }

    const ahead = lowerIsBetter
      ? metric.value < this.remoteSnapshot.value
      : metric.value > this.remoteSnapshot.value;
    this.status.textContent = metric.value === this.remoteSnapshot.value
      ? 'Scores are tied.'
      : ahead ? 'You are ahead — keep it up!' : 'Your opponent is ahead — catch up!';
  }

  destroy() {
    if (this.interval) clearInterval(this.interval);
    if (this.finishButton && this.boundFinish) {
      this.finishButton.removeEventListener('click', this.boundFinish);
    }
    if (this.gameView && this.boundActivity) {
      this.gameView.removeEventListener('pointerdown', this.boundActivity, true);
      this.gameView.removeEventListener('keydown', this.boundActivity, true);
    }
    if (this.panel) this.panel.hidden = true;
  }
}

window.OnlineDuelController = OnlineDuelController;
