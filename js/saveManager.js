// === Save Manager ===
// Save version migration, export/import, and integrity validation.
// Protects player progress across game code updates.

import { EQUIPMENT_CATALOG } from '../data/equipment.js';
import UNIT_SPLIT_MAP from '../data/unit_split_map.js';

/** Current save format version. Increment when Player data structure changes. */
export const CURRENT_SAVE_VERSION = 3;

/**
 * Migration chain. Each function upgrades data from version (N-1) to N.
 */
const MIGRATIONS = {
  // v1 → v2: Add textbookId for multi-textbook support
  2: (data) => {
    if (!data.player.textbookId) {
      data.player.textbookId = 'wy-7a';
    }
    data.saveVersion = 2;
    return data;
  },

  // v2 → v3: Unit splitting — remap old unit IDs to new sub-unit IDs
  3: (data) => {
    const p = data.player;
    if (!p) return data;

    // Iterate through each textbook's split map
    for (const [tbId, tbMap] of Object.entries(UNIT_SPLIT_MAP)) {
      for (const [oldUnitId, newUnitIds] of Object.entries(tbMap)) {
        if (!newUnitIds || newUnitIds.length === 0) continue;
        const firstNewId = newUnitIds[0];

        // 1. unitBattleProgress: copy defeatedWordIds to ALL new sub-units
        //    This ensures words defeated in the old big unit are recognized in
        //    whichever new sub-unit they now belong to (by alphabetical split).
        if (p.unitBattleProgress && p.unitBattleProgress[oldUnitId]) {
          const defeatedWordIds = p.unitBattleProgress[oldUnitId]?.defeatedWordIds || [];
          for (const newId of newUnitIds) {
            if (!p.unitBattleProgress[newId]) {
              p.unitBattleProgress[newId] = { defeatedWordIds: [...defeatedWordIds] };
            } else {
              // Merge: keep existing + add old defeated IDs
              const existing = new Set(p.unitBattleProgress[newId].defeatedWordIds || []);
              defeatedWordIds.forEach(id => existing.add(id));
              p.unitBattleProgress[newId].defeatedWordIds = Array.from(existing);
            }
          }
          delete p.unitBattleProgress[oldUnitId];
        }

        // 2. unlockedUnits: replace old ID → first new sub-unit ID
        if (Array.isArray(p.unlockedUnits)) {
          const idx = p.unlockedUnits.indexOf(oldUnitId);
          if (idx !== -1) {
            p.unlockedUnits[idx] = firstNewId;
          }
        }

        // 3. completedUnits: replace old ID → first new sub-unit ID
        if (Array.isArray(p.completedUnits)) {
          const idx = p.completedUnits.indexOf(oldUnitId);
          if (idx !== -1) {
            p.completedUnits[idx] = firstNewId;
          }
        }

        // 4. currentUnit: replace old ID → first new sub-unit ID
        if (p.currentUnit === oldUnitId) {
          p.currentUnit = firstNewId;
        }

        // 5. bossDefeated: replace boss-{oldId} → boss-{firstNewId}
        if (Array.isArray(p.bossDefeated)) {
          const bossOldId = `boss-${oldUnitId}`;
          const bossIdx = p.bossDefeated.indexOf(bossOldId);
          if (bossIdx !== -1) {
            p.bossDefeated[bossIdx] = `boss-${firstNewId}`;
          }
        }
      }
    }

    data.saveVersion = 3;
    return data;
  },
};

/**
 * Migrate save data from its current version to the latest version.
 * Runs the migration chain step by step (v1→v2→v3→...).
 *
 * @param {Object} data - Raw save data from localStorage or imported file
 * @returns {Object} Migrated save data at CURRENT_SAVE_VERSION
 */
export function migrateSave(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Save data is empty or corrupted.');
  }

  let version = data.saveVersion || 0;

  // Step through each migration in order
  while (version < CURRENT_SAVE_VERSION) {
    const nextVersion = version + 1;
    const migrationFn = MIGRATIONS[nextVersion];

    if (!migrationFn) {
      // No migration defined for this step — this is a bug in the game code
      console.error(
        `Save migration error: no migration defined for v${version} → v${nextVersion}. ` +
        `Current version: v${CURRENT_SAVE_VERSION}. This is a developer error.`
      );
      throw new Error(
        `存档迁移失败：缺少 v${version} → v${nextVersion} 的迁移函数。\n` +
        `请导出存档文件并联系开发者。`
      );
    }

    try {
      data = migrationFn(data);
      version = data.saveVersion;
    } catch (e) {
      console.error(`Save migration v${version} → v${nextVersion} failed:`, e);
      throw new Error(
        `存档迁移 v${version} → v${nextVersion} 失败：${e.message}\n` +
        `原始存档数据已保留在浏览器中，请导出备份后联系开发者。`
      );
    }
  }

  // Verify the migration chain completed correctly
  if (data.saveVersion !== CURRENT_SAVE_VERSION) {
    throw new Error(
      `存档迁移后版本号不匹配：期望 v${CURRENT_SAVE_VERSION}，实际 v${data.saveVersion}。`
    );
  }

  return data;
}

/**
 * Validate save data structure integrity.
 * Checks required fields exist and have correct types.
 *
 * @param {Object} data - Save data to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSave(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['存档数据为空或格式错误。'] };
  }

  if (typeof data.saveVersion !== 'number') {
    errors.push('缺少 saveVersion 字段。');
  }

  if (!data.player || typeof data.player !== 'object') {
    errors.push('缺少 player 数据。');
    return { valid: false, errors };
  }

  const p = data.player;

  // Essential player fields — must exist
  if (typeof p.name !== 'string') errors.push('player.name 缺失或格式错误。');
  if (typeof p.level !== 'number') errors.push('player.level 缺失或格式错误。');
  if (typeof p.xp !== 'number') errors.push('player.xp 缺失或格式错误。');
  if (typeof p.hp !== 'number') errors.push('player.hp 缺失或格式错误。');
  if (typeof p.gold !== 'number') errors.push('player.gold 缺失或格式错误。');
  if (!p.stats || typeof p.stats !== 'object') errors.push('player.stats 缺失。');

  // Non-critical: warn but don't block
  if (!p.wordsAttempted || typeof p.wordsAttempted !== 'object') {
    errors.push('player.wordsAttempted 缺失（单词学习记录将重置）。');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate and repair equipment references.
 * If an equipped item or inventory item no longer exists in the catalog,
 * remove it to prevent crashes.
 *
 * @param {Object} playerData - player data object from save
 * @returns {{ cleaned: boolean, removedItems: string[] }}
 */
export function repairEquipment(playerData) {
  const removedItems = [];
  const catalogIds = new Set(EQUIPMENT_CATALOG.map(e => e.id));

  // Check equipped items
  const slots = ['weapon', 'armor', 'accessory'];
  for (const slot of slots) {
    const eqId = playerData.equipment && playerData.equipment[slot];
    if (eqId && !catalogIds.has(eqId)) {
      removedItems.push(eqId);
      playerData.equipment[slot] = null;
    }
  }

  // Check inventory
  if (Array.isArray(playerData.inventory)) {
    const before = playerData.inventory.length;
    playerData.inventory = playerData.inventory.filter(eqId => {
      if (!catalogIds.has(eqId)) {
        removedItems.push(eqId);
        return false;
      }
      return true;
    });
  }

  return {
    cleaned: removedItems.length > 0,
    removedItems
  };
}

/**
 * Export current game state as a downloadable JSON file.
 * Triggers a browser download dialog.
 *
 * @param {Object} gameState — the GameState singleton instance
 */
export function exportSave(gameState) {
  if (!gameState || !gameState.player) {
    throw new Error('没有可导出的存档。');
  }

  const p = gameState.player;
  const data = {
    saveVersion: CURRENT_SAVE_VERSION,
    player: p.serialize(),
    settings: gameState.settings,
    exportedAt: new Date().toISOString()
  };

  const json = JSON.stringify(data, null, 2);

  // Build filename: 英语大冒险_存档_Lv{level}_{name}_{date}.json
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const safeName = p.name.replace(/[\\/:*?"<>|]/g, '_').substring(0, 20);
  const filename = `英语大冒险_存档_Lv${p.level}_${safeName}_${dateStr}.json`;

  // Create download link
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { filename, size: json.length };
}

/**
 * Import save file from user's computer.
 * Opens a file picker dialog.
 *
 * @returns {Promise<Object|null>} Parsed save data, or null if cancelled/error
 */
export function importSave() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', () => {
      const file = input.files[0];
      document.body.removeChild(input);

      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);

          // Basic structure check
          if (!data || !data.player) {
            throw new Error('存档文件格式不正确：缺少 player 数据。');
          }

          // Version check — warn if from a newer game version
          if (data.saveVersion > CURRENT_SAVE_VERSION) {
            throw new Error(
              `此存档来自游戏 v${data.saveVersion}，当前游戏版本为 v${CURRENT_SAVE_VERSION}。\n` +
              `请更新游戏到最新版本后再导入。`
            );
          }

          // Validate structure
          const { valid, errors } = validateSave(data);
          if (!valid) {
            throw new Error(`存档文件存在问题：\n${errors.join('\n')}`);
          }

          resolve(data);
        } catch (e) {
          // Re-throw as a user-friendly error
          if (e.message.includes('存档')) {
            throw e; // Already formatted
          }
          throw new Error(`无法解析存档文件：${e.message}`);
        }
      };

      reader.onerror = () => {
        document.body.removeChild(input);
        resolve(null);
      };

      reader.readAsText(file);
    });

    // Handle cancel (user clicked away)
    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      resolve(null);
    });

    input.click();
  }).catch(e => {
    console.error('Import failed:', e);
    throw e;
  });
}

/**
 * Get a human-readable summary of a save file for preview.
 *
 * @param {Object} data - Parsed save data
 * @returns {{ name: string, level: number, gold: number, wordsMastered: number, savedAt: string }}
 */
export function getSaveSummary(data) {
  const p = data.player;
  return {
    name: p.name || '未知',
    level: p.level || 1,
    gold: p.gold || 0,
    wordsMastered: (p.wordsMastered && p.wordsMastered.length) || 0,
    savedAt: data.exportedAt || p.lastSaved || '未知时间'
  };
}
