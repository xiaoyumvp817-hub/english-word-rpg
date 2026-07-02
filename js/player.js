// === Player Class ===
// Handles player stats, leveling, equipment, and word tracking.

import { xpForLevel, baseStatsForLevel, nowISO, todayStr, daysBetween } from './utils.js';
import { EQUIPMENT_CATALOG } from '../data/equipment.js';

export class Player {
  constructor(name = '小冒险家') {
    this.name = name;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = xpForLevel(1);
    this.hp = 100;
    this.maxHp = 100;
    this.mp = 50;
    this.maxMp = 50;
    this.attack = 10;
    this.defense = 5;
    this.speed = 5;
    this.criticalChance = 0.05;

    this.baseStats = { maxHp: 100, maxMp: 50, attack: 10, defense: 5, speed: 5 };

    this.gold = 0;

    this.textbookId = 'wy-7a';  // Active textbook ID

    this.equipment = { weapon: null, armor: null, accessory: null };
    this.inventory = [];

    this.wordsMastered = [];
    this.wordsAttempted = {};

    this.currentUnit = 'wy-7a-starter1';
    this.unlockedUnits = ['wy-7a-starter1'];
    this.completedUnits = [];
    this.bossDefeated = [];

    this.stats = {
      totalBattles: 0, battlesWon: 0, battlesLost: 0,
      totalCorrect: 0, totalWrong: 0,
      totalCriticalHits: 0,
      totalGoldEarned: 0, totalGoldSpent: 0,
      bossBattlesWon: 0,
      playTime: 0
    };

    this.saveVersion = 1;
    this.lastSaved = null;
    this.createdAt = null;
  }

  // ========== Stat Calculation ==========

  /**
   * Recalculate all derived stats from base stats + equipment.
   */
  recalculateStats() {
    const base = baseStatsForLevel(this.level);
    this.baseStats = { ...base };
    this.maxHp = base.maxHp;
    this.maxMp = base.maxMp;
    this.attack = base.attack;
    this.defense = base.defense;
    this.speed = base.speed;
    this.criticalChance = 0.05;

    // Apply equipment bonuses
    const slots = ['weapon', 'armor', 'accessory'];
    for (const slot of slots) {
      const eqId = this.equipment[slot];
      if (!eqId) continue;
      const eq = EQUIPMENT_CATALOG.find(e => e.id === eqId);
      if (!eq) continue;
      this.maxHp += eq.stats.maxHp || 0;
      this.maxMp += eq.stats.maxMp || 0;
      this.attack += eq.stats.attack || 0;
      this.defense += eq.stats.defense || 0;
      this.speed += eq.stats.speed || 0;
      this.criticalChance += eq.stats.criticalChance || 0;
    }

    // Clamp hp/mp to max
    this.hp = Math.min(this.hp, this.maxHp);
    this.mp = Math.min(this.mp, this.maxMp);

    // Update XP threshold
    this.xpToNext = xpForLevel(this.level);
  }

  // ========== XP & Leveling ==========

  /**
   * Add XP and check for level up. Returns level-up info or null.
   */
  addXp(amount) {
    this.xp += amount;
    let leveledUp = false;
    let levelsGained = 0;

    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      levelsGained++;
      leveledUp = true;
    }

    if (leveledUp) {
      // Restore HP/MP on level up
      this.recalculateStats();
      this.hp = this.maxHp;
      this.mp = this.maxMp;
    }

    return leveledUp ? { levelsGained, newLevel: this.level } : null;
  }

  /**
   * Get XP progress as a fraction (0-1).
   */
  getXpProgress() {
    return this.xp / this.xpToNext;
  }

  // ========== HP / MP ==========

  /**
   * Take damage. Returns actual damage dealt.
   */
  takeDamage(amount) {
    const actual = Math.max(1, amount);
    this.hp = Math.max(0, this.hp - actual);
    return actual;
  }

  /**
   * Heal HP. Returns actual amount healed.
   */
  healHp(amount) {
    const actual = Math.min(amount, this.maxHp - this.hp);
    this.hp += actual;
    return actual;
  }

  /**
   * Rest HP by percentage of max HP.
   */
  restHp(percent = 0.5) {
    const amount = Math.floor(this.maxHp * percent);
    return this.healHp(amount);
  }

  /**
   * Check if player is alive.
   */
  isAlive() {
    return this.hp > 0;
  }

  // ========== Gold ==========

  addGold(amount) {
    this.gold += amount;
    this.stats.totalGoldEarned += amount;
  }

  spendGold(amount) {
    if (this.gold < amount) return false;
    this.gold -= amount;
    this.stats.totalGoldSpent += amount;
    return true;
  }

  /**
   * Lose gold on defeat (20% of current).
   */
  loseGoldPenalty() {
    const lost = Math.floor(this.gold * 0.2);
    this.gold = Math.max(0, this.gold - lost);
    return lost;
  }

  // ========== Equipment ==========

  /**
   * Equip an item from inventory. Returns the unequipped item ID or null.
   */
  equipItem(itemId) {
    const item = EQUIPMENT_CATALOG.find(e => e.id === itemId);
    if (!item) return false;
    if (item.requiredLevel > this.level) return false;

    // Find item in inventory
    const idx = this.inventory.indexOf(itemId);
    if (idx === -1) return false;

    // Unequip current item in slot
    const oldItemId = this.equipment[item.slot];

    // Remove from inventory
    this.inventory.splice(idx, 1);

    // Equip new item
    this.equipment[item.slot] = itemId;

    // Put old item back in inventory
    if (oldItemId) {
      this.inventory.push(oldItemId);
    }

    this.recalculateStats();
    return oldItemId;
  }

  /**
   * Unequip an item and put it back in inventory.
   */
  unequipItem(slot) {
    const itemId = this.equipment[slot];
    if (!itemId) return false;

    this.equipment[slot] = null;
    this.inventory.push(itemId);
    this.recalculateStats();
    return true;
  }

  /**
   * Add an item to inventory.
   */
  addToInventory(itemId) {
    if (!this.inventory.includes(itemId)) {
      this.inventory.push(itemId);
    }
  }

  /**
   * Check if player owns an item.
   */
  hasItem(itemId) {
    return this.inventory.includes(itemId) ||
           Object.values(this.equipment).includes(itemId);
  }

  // ========== Word Tracking ==========

  /**
   * Record a word attempt. Returns new mastery state.
   */
  recordWordAttempt(wordId, isCorrect) {
    if (!this.wordsAttempted[wordId]) {
      this.wordsAttempted[wordId] = {
        attempts: 0,
        correct: 0,
        firstSeen: nowISO(),
        lastSeen: null,
        state: 'UNSEEN'
      };
    }

    const record = this.wordsAttempted[wordId];
    record.attempts++;
    record.lastSeen = nowISO();

    if (isCorrect) {
      record.correct++;
      this.stats.totalCorrect++;
    } else {
      this.stats.totalWrong++;
    }

    // Update mastery state
    const totalCorrect = record.correct;
    const lastCorrectDays = record.lastCorrectDate
      ? daysBetween(record.lastCorrectDate, todayStr())
      : 999;

    if (isCorrect) {
      record.lastCorrectDate = todayStr();
    }

    if (totalCorrect === 0) {
      record.state = 'SEEN';
    } else if (totalCorrect === 1) {
      record.state = 'LEARNING';
    } else if (totalCorrect >= 3 && lastCorrectDays >= 1) {
      record.state = 'MASTERED';
      if (!this.wordsMastered.includes(wordId)) {
        this.wordsMastered.push(wordId);
      }
    } else if (totalCorrect >= 2) {
      record.state = 'LEARNING';
    }

    return record.state;
  }

  /**
   * Get words with high error rate for review dungeons.
   */
  getWeakWords(threshold = 0.3) {
    const weak = [];
    for (const [wordId, record] of Object.entries(this.wordsAttempted)) {
      if (record.attempts >= 3) {
        const errorRate = 1 - (record.correct / record.attempts);
        if (errorRate > threshold) {
          weak.push(wordId);
        }
      }
    }
    return weak;
  }

  // ========== Unit Progression ==========

  /**
   * Mark a unit as completed.
   */
  completeUnit(unitId) {
    if (!this.completedUnits.includes(unitId)) {
      this.completedUnits.push(unitId);
    }
  }

  /**
   * Unlock the next unit.
   */
  unlockUnit(unitId) {
    if (!this.unlockedUnits.includes(unitId)) {
      this.unlockedUnits.push(unitId);
    }
  }

  /**
   * Record a boss defeat.
   */
  defeatBoss(bossId) {
    if (!this.bossDefeated.includes(bossId)) {
      this.bossDefeated.push(bossId);
      this.stats.bossBattlesWon++;
    }
  }

  // ========== Battle Stats ==========

  recordBattle(won) {
    this.stats.totalBattles++;
    if (won) {
      this.stats.battlesWon++;
    } else {
      this.stats.battlesLost++;
    }
  }

  recordCriticalHit() {
    this.stats.totalCriticalHits++;
  }

  /**
   * Get win rate as a percentage.
   */
  getWinRate() {
    if (this.stats.totalBattles === 0) return 0;
    return Math.round((this.stats.battlesWon / this.stats.totalBattles) * 100);
  }

  // ========== Textbook Management ==========

  /**
   * Switch to a different textbook. Auto-unlocks first unit if needed.
   * Character stats (level, gold, equipment) are shared across textbooks —
   * only unit/word progress is per-textbook.
   * @param {string} textbookId
   * @param {Array} textbookUnits — unit definitions for the target textbook
   * @returns {string|null} the new textbookId, or null if invalid
   */
  switchTextbook(textbookId, textbookUnits) {
    if (!textbookUnits || textbookUnits.length === 0) return null;

    // Auto-unlock the first unit if this textbook has never been visited
    const firstUnit = textbookUnits.reduce((min, u) =>
      u.order < min.order ? u : min
    );
    if (firstUnit && !this.unlockedUnits.includes(firstUnit.id)) {
      this.unlockedUnits.push(firstUnit.id);
    }

    // Determine currentUnit: the highest-order unlocked-but-not-completed unit,
    // or the first unit as fallback
    const textbookUnitIds = new Set(textbookUnits.map(u => u.id));
    const relevantUnits = this.unlockedUnits
      .filter(id => textbookUnitIds.has(id))
      .map(id => textbookUnits.find(u => u.id === id))
      .filter(Boolean);

    const nextUnit = relevantUnits
      .filter(u => !this.completedUnits.includes(u.id))
      .sort((a, b) => a.order - b.order)[0];

    this.currentUnit = nextUnit ? nextUnit.id : firstUnit.id;
    this.textbookId = textbookId;

    return textbookId;
  }

  // ========== Serialization ==========

  serialize() {
    return {
      name: this.name,
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext,
      hp: this.hp,
      maxHp: this.maxHp,
      mp: this.mp,
      maxMp: this.maxMp,
      attack: this.attack,
      defense: this.defense,
      speed: this.speed,
      criticalChance: this.criticalChance,
      baseStats: { ...this.baseStats },
      gold: this.gold,
      equipment: { ...this.equipment },
      inventory: [...this.inventory],
      wordsMastered: [...this.wordsMastered],
      wordsAttempted: { ...this.wordsAttempted },
      currentUnit: this.currentUnit,
      unlockedUnits: [...this.unlockedUnits],
      completedUnits: [...this.completedUnits],
      bossDefeated: [...this.bossDefeated],
      textbookId: this.textbookId,
      stats: { ...this.stats },
      saveVersion: this.saveVersion,
      lastSaved: this.lastSaved,
      createdAt: this.createdAt
    };
  }

  deserialize(data) {
    // Core identity — these must exist
    this.name = data.name || '小冒险家';
    this.level = data.level ?? 1;
    this.xp = data.xp ?? 0;
    this.xpToNext = data.xpToNext ?? xpForLevel(this.level);
    this.hp = data.hp ?? this.maxHp;
    this.maxHp = data.maxHp ?? 100;
    this.mp = data.mp ?? this.maxMp;
    this.maxMp = data.maxMp ?? 50;
    this.attack = data.attack ?? 10;
    this.defense = data.defense ?? 5;
    this.speed = data.speed ?? 5;
    this.criticalChance = data.criticalChance ?? 0.05;

    // Base stats (recalculated on recalculateStats anyway, but preserve if valid)
    this.baseStats = (data.baseStats && typeof data.baseStats === 'object')
      ? { ...data.baseStats }
      : { maxHp: 100, maxMp: 50, attack: 10, defense: 5, speed: 5 };

    // Economy
    this.gold = data.gold ?? 0;

    // Equipment — ensure slot structure even if data is partial
    this.equipment = {
      weapon: null,
      armor: null,
      accessory: null,
      ...(data.equipment && typeof data.equipment === 'object' ? data.equipment : {})
    };

    // Inventory — filter out any null/undefined entries
    this.inventory = Array.isArray(data.inventory)
      ? data.inventory.filter(id => id != null)
      : [];

    // Word tracking — tolerate missing data (most important for progress preservation)
    this.wordsMastered = Array.isArray(data.wordsMastered)
      ? [...data.wordsMastered]
      : [];
    this.wordsAttempted = (data.wordsAttempted && typeof data.wordsAttempted === 'object')
      ? { ...data.wordsAttempted }
      : {};

    // Unit progression
    this.currentUnit = data.currentUnit || 'wy-7a-starter1';
    this.unlockedUnits = Array.isArray(data.unlockedUnits)
      ? [...data.unlockedUnits]
      : ['wy-7a-starter1'];
    this.completedUnits = Array.isArray(data.completedUnits)
      ? [...data.completedUnits]
      : [];
    this.bossDefeated = Array.isArray(data.bossDefeated)
      ? [...data.bossDefeated]
      : [];

    // Stats — merge with defaults for forward compatibility (new stat fields get defaults)
    this.stats = {
      totalBattles: 0, battlesWon: 0, battlesLost: 0,
      totalCorrect: 0, totalWrong: 0,
      totalCriticalHits: 0,
      totalGoldEarned: 0, totalGoldSpent: 0,
      bossBattlesWon: 0,
      playTime: 0,
      ...(data.stats && typeof data.stats === 'object' ? data.stats : {})
    };

    // Metadata
    this.textbookId = data.textbookId || 'wy-7a';
    this.saveVersion = data.saveVersion ?? 1;
    this.lastSaved = data.lastSaved || null;
    this.createdAt = data.createdAt || null;

    this.recalculateStats();
    return this;
  }
}
