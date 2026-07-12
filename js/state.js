// === GameState Singleton ===
// Central state management, save/load, and screen navigation.

import { Player } from './player.js';
import { deepClone, nowISO, safeSetItem, safeGetItem } from './utils.js';
import { CURRENT_SAVE_VERSION, migrateSave, repairEquipment, validateSave } from './saveManager.js';
import { getUnits, isValidTextbookId } from '../data/textbooks.js';

const SAVE_KEY = 'englishRpgSave';

class GameState {
  constructor() {
    this.player = null;
    this.currentScreen = 'title';
    this.previousScreen = null;
    this.battleContext = null;     // { unitId, monsterQueue, currentIndex, bossDefeated }
    this.dungeonContext = null;    // Current dungeon metadata
    this.settings = {
      soundEnabled: true,
      difficulty: 'normal',       // 'easy' | 'normal' | 'hard'
      timerSeconds: 15
    };
    this.notification = null;     // { message, type, duration }
    this._loadError = null;       // Last load error message
    this._repairNotice = null;    // Notice about auto-repaired data on load
  }

  /**
   * Create a new game with the given player name and textbook.
   * @param {string} name - Player name
   * @param {string} [textbookId='wy-7a'] - Textbook ID to use
   */
  newGame(name, textbookId = 'wy-7a') {
    this.player = new Player(name);
    this.player.createdAt = nowISO();

    // Apply textbook selection
    if (isValidTextbookId(textbookId)) {
      this.player.textbookId = textbookId;
      const units = getUnits(textbookId);
      if (units.length > 0) {
        const firstUnit = units.reduce((min, u) => u.order < min.order ? u : min);
        this.player.unlockedUnits = units.map(u => u.id);
        this.player.currentUnit = firstUnit.id;
      } else {
        // Empty textbook (no words yet) — reset progress
        this.player.unlockedUnits = [];
        this.player.currentUnit = '';
      }
    }

    this.currentScreen = 'mainMenu';
    this.saveGame();
    return this.player;
  }

  /**
   * Load game from localStorage. Returns true if successful.
   *
   * Automatically migrates old save formats to the current version.
   * Save data survives game code updates — player progress is never lost.
   */
  loadGame() {
    const data = safeGetItem(SAVE_KEY);
    if (!data) return false;

    try {
      // === Step 1: Version check & migration ===
      if (data.saveVersion > CURRENT_SAVE_VERSION) {
        // Save from a NEWER game version — can't load without updating the game
        console.error(
          `Save is v${data.saveVersion}, but game only supports up to v${CURRENT_SAVE_VERSION}. ` +
          `Player needs to update the game.`
        );
        this._loadError = `存档版本过新（v${data.saveVersion}），请更新游戏到最新版本后再试。`;
        return false;
      }

      let migratedData = data;
      if (data.saveVersion < CURRENT_SAVE_VERSION) {
        // Save from an OLDER game version — migrate it forward
        console.log(
          `Migrating save from v${data.saveVersion} to v${CURRENT_SAVE_VERSION}...`
        );
        migratedData = migrateSave(data);
        console.log('Save migration complete. Player progress preserved!');
      }

      // === Step 2: Validate structure ===
      const { valid, errors } = validateSave(migratedData);
      if (!valid) {
        console.error('Save validation failed:', errors);
        // For non-critical errors (e.g. missing wordsAttempted), still try to load
        const criticalErrors = errors.filter(e =>
          !e.includes('wordsAttempted') && !e.includes('wordsMastered')
        );
        if (criticalErrors.length > 0) {
          this._loadError = `存档数据异常：\n${criticalErrors.join('\n')}\n\n请导入备份存档或开始新游戏。`;
          return false;
        }
        console.warn('Non-critical save errors (continuing):', errors);
      }

      // === Step 3: Repair equipment references ===
      const repair = repairEquipment(migratedData.player);
      if (repair.cleaned) {
        console.warn(
          `Removed ${repair.removedItems.length} missing equipment items from save:`,
          repair.removedItems
        );
        this._repairNotice = `您的存档中有 ${repair.removedItems.length} 件装备已不存在（已自动移除）。`;
      }

      // === Step 4: Restore player ===
      const player = new Player(migratedData.player.name);
      player.deserialize(migratedData.player);
      this.player = player;
      this.settings = { ...this.settings, ...migratedData.settings };
      this.currentScreen = 'mainMenu';
      this._loadError = null;

      // Save immediately to persist any migration changes
      if (data.saveVersion < CURRENT_SAVE_VERSION || repair.cleaned) {
        this.saveGame();
      }

      return true;
    } catch (e) {
      console.error('Failed to load save:', e);
      this._loadError = e.message || '存档加载失败，请检查存档是否损坏。';
      return false;
    }
  }

  /**
   * Get the last load error message, if any.
   */
  getLoadError() {
    return this._loadError || null;
  }

  /**
   * Get and clear repair notice from last load.
   */
  getRepairNotice() {
    const notice = this._repairNotice || null;
    this._repairNotice = null;
    return notice;
  }

  /**
   * Check if a save file exists.
   */
  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Save game to localStorage. Returns true if successful.
   */
  saveGame() {
    if (!this.player) return false;

    this.player.lastSaved = nowISO();

    const data = {
      saveVersion: CURRENT_SAVE_VERSION,
      player: this.player.serialize(),
      settings: this.settings
    };

    return safeSetItem(SAVE_KEY, JSON.stringify(data));
  }

  /**
   * Delete the save file.
   */
  deleteSave() {
    localStorage.removeItem(SAVE_KEY);
    this.player = null;
    this.currentScreen = 'title';
  }

  /**
   * Navigate to a screen and re-render.
   */
  navigateTo(screen, context = {}) {
    this.previousScreen = this.currentScreen;
    this.currentScreen = screen;

    // Merge any context data
    if (context.battleContext) this.battleContext = context.battleContext;
    if (context.dungeonContext) this.dungeonContext = context.dungeonContext;

    // Trigger re-render via custom event
    document.dispatchEvent(new CustomEvent('state:navigate', {
      detail: { screen, context }
    }));
  }

  /**
   * Go back to the previous screen.
   */
  goBack() {
    if (this.previousScreen) {
      this.navigateTo(this.previousScreen);
    }
  }

  /**
   * Show a notification toast.
   */
  showNotification(message, type = 'info', duration = 2000) {
    this.notification = { message, type, duration };
    document.dispatchEvent(new CustomEvent('state:notification', {
      detail: this.notification
    }));
  }

  /**
   * Get the current timer setting based on difficulty.
   */
  getTimerSeconds() {
    switch (this.settings.difficulty) {
      case 'easy': return 20;
      case 'hard': return 10;
      default: return 15;
    }
  }
}

// Export singleton instance
export const gameState = new GameState();
