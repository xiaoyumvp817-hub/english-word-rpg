// === BattleController ===
// Turn-based battle state machine. The heart of the game.

import { randomInt } from './utils.js';

// Battle states
export const BATTLE_STATE = {
  INIT: 'INIT',
  PLAYER_TURN: 'PLAYER_TURN',
  RESOLVING: 'RESOLVING',
  CHECK_END: 'CHECK_END',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT',
  FLED: 'FLED'
};

export class BattleController {
  /**
   * @param {Object} player - The Player instance
   * @param {Object} monster - The monster instance
   * @param {Object} options - Battle options
   */
  constructor(player, monster, options = {}) {
    this.player = player;
    this.monster = monster;
    this.state = BATTLE_STATE.INIT;
    this.turnCount = 0;
    this.streakCount = 0;
    this.maxStreak = 0;
    this.isDefending = false;
    this.timerId = null;
    this.timerSeconds = options.timerSeconds || 15;
    this.timeLeft = this.timerSeconds;
    this.isBoss = monster.type === 'boss';
    this.bossTurnCounter = 0; // Boss attacks every 2 turns

    // Battle log for rendering
    this.lastAction = null; // { type: 'attack'|'defend'|'crit', damage, isPlayer, message }
  }

  /**
   * Start the battle. Transition from INIT to PLAYER_TURN.
   */
  start() {
    this.state = BATTLE_STATE.PLAYER_TURN;
    this.startTimer();
  }

  /**
   * Submit the player's answer. Main battle interaction.
   * @param {string} userInput - What the player typed
   * @returns {Object} Result of the submission
   */
  submitAnswer(userInput) {
    if (this.state !== BATTLE_STATE.PLAYER_TURN) return null;

    // Capture speed fraction BEFORE stopping the timer
    const timeFraction = this.timerSeconds > 0
      ? Math.max(0, this.timeLeft / this.timerSeconds)
      : 0;

    this.stopTimer();

    const word = this.monster.word || (this.monster.wordPool ? null : null);
    if (!word) {
      // This shouldn't happen in normal flow
      return { error: 'No word data' };
    }

    const isCorrect = this.validateAnswer(userInput, word.english);
    this.state = BATTLE_STATE.RESOLVING;

    let result;

    if (isCorrect) {
      this.streakCount++;
      if (this.streakCount > this.maxStreak) {
        this.maxStreak = this.streakCount;
      }
      result = this.resolvePlayerAttack(timeFraction);
      result.isCorrect = true;
      result.correctAnswer = word.english;
    } else {
      result = this.resolveMonsterAttack();
      result.isCorrect = false;
      result.correctAnswer = word.english;
      result.userInput = userInput;
    }

    this.turnCount++;
    this.lastAction = result;

    this.checkEndCondition();

    return result;
  }

  /**
   * Player chooses to defend. Still requires answering.
   */
  defend() {
    this.isDefending = true;
  }

  /**
   * Attempt to flee from battle.
   * @returns {boolean} Whether flee was successful
   */
  tryFlee() {
    this.stopTimer();

    const fleeChance = 0.3 + (this.player.speed * 0.04);
    const success = Math.random() < Math.min(0.9, fleeChance);

    if (success) {
      this.state = BATTLE_STATE.FLED;
      // Fleeing costs gold
      const penalty = Math.min(10, this.player.gold);
      if (penalty > 0) {
        this.player.gold -= penalty;
      }
      return { success: true, penalty };
    } else {
      // Flee failed - monster attacks
      this.isDefending = false;
      const result = this.resolveMonsterAttack();
      this.lastAction = result;
      this.state = BATTLE_STATE.PLAYER_TURN;
      this.startTimer();
      return { success: false, ...result };
    }
  }

  /**
   * Timeout - treat as wrong answer.
   */
  handleTimeout() {
    if (this.state !== BATTLE_STATE.PLAYER_TURN) return null;

    this.streakCount = 0;
    this.isDefending = false;
    this.state = BATTLE_STATE.RESOLVING;

    const result = this.resolveMonsterAttack();
    result.isTimeout = true;
    if (this.monster.word) {
      result.correctAnswer = this.monster.word.english;
    }

    this.turnCount++;
    this.lastAction = result;
    this.checkEndCondition();

    return result;
  }

  // ========== Answer Validation ==========

  /**
   * Validate the user's answer against the expected word.
   */
  validateAnswer(input, expected) {
    const normalized = input.trim().toLowerCase();
    const expectedLower = expected.trim().toLowerCase();

    // Exact match
    if (normalized === expectedLower) return true;

    // For multi-word phrases, check all words
    if (expectedLower.includes(' ')) {
      const inputWords = normalized.split(/\s+/);
      const expectedWords = expectedLower.split(/\s+/);
      if (inputWords.length === expectedWords.length) {
        return inputWords.every((w, i) => w === expectedWords[i]);
      }
    }

    // Hyphenated words - accept both with and without hyphen
    if (expectedLower.includes('-')) {
      if (normalized === expectedLower.replace(/-/g, '')) return true;
      if (normalized === expectedLower.replace(/-/g, ' ')) return true;
    }

    // Common minor spelling variants (accept without apostrophe)
    if (expectedLower.includes("'")) {
      if (normalized === expectedLower.replace(/'/g, '')) return true;
    }

    // "o'clock" type words
    if (expectedLower === "o'clock" && (normalized === "oclock" || normalized === "o clock")) {
      return true;
    }

    return false;
  }

  // ========== Damage Resolution ==========

  /**
   * Player attacks the monster.
   * @param {number} timeFraction - 0.0 (timeout edge) to 1.0 (instant answer)
   *        Faster answers get higher crit chance and bigger crits.
   */
  resolvePlayerAttack(timeFraction = 0) {
    const baseDamage = this.player.attack - this.monster.defense;
    const randomJitter = randomInt(-2, 2);

    // Speed-based crit: faster = more likely + harder hit
    //   critChance  = base 5% + up to 25% from speed → max ~30%
    //   critMult    = 2.0x  + up to 1.0x from speed → max 3.0x
    const speedCritBonus = Math.max(0, Math.min(1, timeFraction)) * 0.25;
    const effectiveCritChance = Math.min(0.50, this.player.criticalChance + speedCritBonus);
    const isCritical = Math.random() < effectiveCritChance;
    const critMultiplier = isCritical ? (2.0 + timeFraction * 1.0) : 1.0;

    const rawDamage = (baseDamage + randomJitter) * critMultiplier;
    const damage = Math.max(1, Math.floor(rawDamage));

    this.monster.hp = Math.max(0, this.monster.hp - damage);

    if (isCritical) {
      this.player.recordCriticalHit();
    }

    // Determine speed tier for UI feedback
    let speedTier = '';
    if (timeFraction >= 0.8) speedTier = 'godlike';
    else if (timeFraction >= 0.5) speedTier = 'fast';

    return {
      type: isCritical ? 'crit' : 'attack',
      damage,
      isPlayer: true,
      isCritical,
      critMultiplier: isCritical ? critMultiplier : 1.0,
      speedTier,
      timeFraction,
      streak: this.streakCount,
      message: isCritical
        ? `💥 暴击! 造成 ${damage} 点伤害!`
        : `⚔️ 攻击命中! 造成 ${damage} 点伤害!`
    };
  }

  /**
   * Monster attacks the player.
   */
  resolveMonsterAttack() {
    const damageMultiplier = this.isDefending ? 0.5 : 1.0;
    const baseDamage = this.monster.attack - this.player.defense;
    const randomJitter = randomInt(-1, 3);
    const damage = Math.max(1, Math.floor((baseDamage + randomJitter) * damageMultiplier));

    this.player.hp = Math.max(0, this.player.hp - damage);

    // Reset streak on wrong answer
    this.streakCount = 0;
    this.isDefending = false;

    return {
      type: 'monster_attack',
      damage,
      isPlayer: false,
      isCritical: false,
      wasDefending: this.isDefending || damageMultiplier < 1,
      message: damageMultiplier < 1
        ? `🛡️ 防御! 只受到 ${damage} 点伤害!`
        : `💢 怪物攻击! 受到 ${damage} 点伤害!`
    };
  }

  // ========== Boss Special Logic ==========

  /**
   * Check if boss should attack this turn.
   * Boss attacks every 2 turns regardless of player answer.
   */
  shouldBossAttack() {
    if (!this.isBoss) return false;
    this.bossTurnCounter++;
    return this.bossTurnCounter % 2 === 0;
  }

  /**
   * Get a new word from the boss's word pool.
   */
  getNextBossWord() {
    if (!this.isBoss) return null;
    // This will be handled by the monster module
    return this.monster.wordPool;
  }

  // ========== End Conditions ==========

  /**
   * Check if battle should end.
   */
  checkEndCondition() {
    if (this.monster.hp <= 0) {
      this.state = BATTLE_STATE.VICTORY;
    } else if (this.player.hp <= 0) {
      this.state = BATTLE_STATE.DEFEAT;
    } else {
      this.state = BATTLE_STATE.PLAYER_TURN;
      this.startTimer();
    }
  }

  /**
   * Calculate rewards for victory.
   */
  calculateRewards() {
    const baseXp = this.monster.xpReward;
    const baseGold = this.monster.goldReward;

    // Streak bonus: +10% per 3 consecutive correct
    const streakBonus = Math.floor(this.streakCount / 3) * 0.1;
    const streakGoldBonus = Math.floor(this.streakCount / 3);

    const totalXp = Math.floor(baseXp * (1 + streakBonus));
    const totalGold = baseGold + streakGoldBonus;

    return {
      xp: totalXp,
      gold: totalGold,
      baseXp,
      baseGold,
      streakBonus,
      streakGoldBonus,
      maxStreak: this.maxStreak
    };
  }

  /**
   * Calculate defeat penalty.
   */
  calculatePenalty() {
    return this.player.loseGoldPenalty();
  }

  // ========== Timer ==========

  startTimer() {
    this.timeLeft = this.timerSeconds; // Reset timer each turn
    this.stopTimer();

    this.timerId = setInterval(() => {
      this.timeLeft--;
      // Dispatch timer tick event for UI update
      document.dispatchEvent(new CustomEvent('battle:timer', {
        detail: { timeLeft: this.timeLeft }
      }));

      if (this.timeLeft <= 0) {
        this.handleTimeout();
        document.dispatchEvent(new CustomEvent('battle:resolved', {
          detail: this.lastAction
        }));
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Reset timer for next turn.
   */
  resetTimer(seconds = 15) {
    this.timeLeft = seconds;
  }

  /**
   * Clean up the battle controller.
   */
  destroy() {
    this.stopTimer();
  }
}
