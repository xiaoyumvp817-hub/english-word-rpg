// === Screen Renderer ===
// Dispatches to individual screen rendering functions and handles DOM updates.

import { gameState } from './state.js';
import { createMonsterFromWord, createBossFromUnit, scaleMonsterToPlayer, getNextBossWord } from './monster.js';
import { BattleController, BATTLE_STATE } from './battle.js';
import { getUnits, getWords, getTextbookMeta, getAllTextbooks, isValidTextbookId } from '../data/textbooks.js';
import { EQUIPMENT_CATALOG } from '../data/equipment.js';
import {
  createElement, createButton, createPanel, createScreenTitle,
  createProgressBar, createStatRow, createGoldDisplay,
  clearElement, getScreenContainer, showToast
} from './ui.js';
import { renderAvatar, renderAvatarLarge } from './avatar.js';
import { audio } from './audio.js';
import { shuffle } from './utils.js';
import { speech } from './speech.js';
import { exportSave, importSave, getSaveSummary, CURRENT_SAVE_VERSION } from './saveManager.js';
import { Player } from './player.js';

// Helper: resolve the active textbook's data from the player's current textbookId
function getTextbook() {
  const id = gameState.player?.textbookId || 'wy-7a';
  return {
    id,
    units: getUnits(id),
    words: getWords(id),
    meta: getTextbookMeta(id) || { id, name: '未知教材', shortName: '未知', unitCount: 0, totalWords: 0 }
  };
}

// Screen renderer registry — one map replaces both the switch and the transition-skip list
const SCREEN_RENDERERS = {
  title:            (c) => renderTitleScreen(c),
  mainMenu:         (c) => renderMainMenu(c),
  dungeon:          (c) => renderDungeonMap(c),
  unitOverview:     (c, ctx) => renderUnitOverview(c, ctx),
  battle:           (c, ctx) => renderBattleScreen(c, ctx),
  bossBattle:       (c, ctx) => renderBossBattleScreen(c, ctx),
  victory:          (c, ctx) => renderVictoryScreen(c, ctx),
  defeat:           (c, ctx) => renderDefeatScreen(c, ctx),
  character:        (c) => renderCharacterScreen(c),
  shop:             (c) => renderShopScreen(c),
  inventory:        (c) => renderInventoryScreen(c),
  textbookSwitch:   (c, ctx) => renderTextbookSwitchScreen(c, ctx),
  preview:          (c, ctx) => renderPreviewScreen(c, ctx),
  previewEnd:       (c, ctx) => renderPreviewEndScreen(c, ctx),
};

// Screens that should NOT play the transition sound
const NO_TRANSITION_SCREENS = new Set(['title', 'mainMenu']);

// Track current battle controller for rendering updates
let currentBattle = null;
let battleUpdateInterval = null;

/**
 * Main render dispatch.
 * Wraps DOM update in View Transitions API when available for smooth crossfades.
 */
export function renderScreen(screenName, context = {}) {
  const container = getScreenContainer();
  if (!container) return;

  // Clean up any existing battle
  if (currentBattle) {
    currentBattle.destroy();
    currentBattle = null;
  }
  if (battleUpdateInterval) {
    clearInterval(battleUpdateInterval);
    battleUpdateInterval = null;
  }

  // Track current screen
  gameState.currentScreen = screenName;

  // Use View Transitions API for smooth crossfade (progressive enhancement)
  const doRender = () => {
    clearElement(container);
    container.className = `screen-${screenName}`;
    container.style.viewTransitionName = 'screen-transition';

    // Screen transition sound
    if (!NO_TRANSITION_SCREENS.has(screenName)) {
      audio.transition();
    }

    const renderer = SCREEN_RENDERERS[screenName] || SCREEN_RENDERERS.title;
    try {
      renderer(container, context);
    } catch (e) {
      console.error('Render error for', screenName, ':', e);
      container.innerHTML = `<div style="padding:40px;text-align:center;"><h2>渲染错误</h2><p>${e.message}</p><pre style="font-size:0.7rem;text-align:left;">${e.stack}</pre></div>`;
    }
  };

  // Progressive enhancement: use View Transitions if supported
  if (document.startViewTransition) {
    document.startViewTransition(() => doRender());
  } else {
    doRender();
  }
}

// ==================== TITLE SCREEN ====================

function renderTitleScreen(container) {
  const hasSave = gameState.hasSave();

  const html = `
    <div class="title-screen">
      <div class="title-logo">
        <div class="title-icon-wrapper">
          <div class="title-icon">
            <img src="assets/icon-sword.svg" alt="Sword" class="title-icon-svg" />
          </div>
          <div class="title-sparkle"></div>
          <div class="title-sparkle"></div>
          <div class="title-sparkle"></div>
          <div class="title-sparkle"></div>
        </div>
        <h1 class="title-main">英语单词大冒险</h1>
        <p class="title-sub">ENGLISH WORD QUEST RPG</p>
      </div>

      <div class="title-actions">
        <button id="btn-new-game" class="btn btn-primary btn-lg btn-block">
          🆕 开始新的冒险
        </button>
        <button id="btn-continue" class="btn btn-lg btn-block" ${hasSave ? '' : 'disabled'}>
          ▶️ 继续游戏
        </button>
      </div>

      <div class="title-name-input" id="name-input-area" style="display:none;">
        <p>请输入你的冒险者名字：</p>
        <input type="text" id="input-player-name" class="input-rpg" maxlength="10" placeholder="输入名字..."
          autocomplete="off">
        <div style="margin-top: 12px;">
          <button id="btn-confirm-name" class="btn btn-primary">下一步：选择教材</button>
          <button id="btn-cancel-name" class="btn">取消</button>
        </div>
      </div>

      <div class="title-textbook-select" id="textbook-select-area" style="display:none;">
        <p style="margin-bottom: 12px;">请选择你的教材：</p>
        <div id="textbook-options" class="textbook-options"></div>
        <div style="margin-top: 16px;">
          <button id="btn-confirm-textbook" class="btn btn-primary" disabled>确认开始</button>
          <button id="btn-back-textbook" class="btn">返回</button>
        </div>
      </div>

      <div class="title-footer">
        <p>v2.0 | ${getTextbook().meta.name} | ${getTextbook().words.length} 词</p>
        <p class="title-hint">按 Enter 确认 · 支持键盘操作</p>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Event bindings
  const btnNew = document.getElementById('btn-new-game');
  const btnContinue = document.getElementById('btn-continue');
  const nameArea = document.getElementById('name-input-area');
  const inputName = document.getElementById('input-player-name');
  const btnConfirm = document.getElementById('btn-confirm-name');
  const btnCancel = document.getElementById('btn-cancel-name');

  btnNew.addEventListener('click', () => {
    nameArea.style.display = 'block';
    inputName.focus();
    btnNew.style.display = 'none';
    btnContinue.style.display = 'none';
  });

  btnContinue.addEventListener('click', () => {
    audio.init(); // Initialize audio on first user gesture
    speech.init(); // Initialize speech synthesis
    if (gameState.loadGame()) {
      renderScreen('mainMenu');
      showToast('欢迎回来，' + gameState.player.name + '！', 'success');
    } else {
      showToast('没有找到存档，请开始新游戏', 'error');
    }
  });

  btnConfirm.addEventListener('click', () => {
    const name = inputName.value.trim() || '小冒险家';
    nameArea.style.display = 'none';
    // Store name temporarily and show textbook picker
    container._pendingName = name;
    tbSelectArea.style.display = 'block';
  });

  // Textbook confirm handler
  const btnConfirmTb = document.getElementById('btn-confirm-textbook');
  const btnBackTb = document.getElementById('btn-back-textbook');
  const tbOptions = document.getElementById('textbook-options');
  const tbSelectArea = document.getElementById('textbook-select-area');

  if (btnConfirmTb && tbOptions) {
    let selectedTbId = 'wy-7a';
    const textbooks = getAllTextbooks();

    // Populate textbook options
    textbooks.forEach(tb => {
      const card = document.createElement('div');
      card.className = 'textbook-option-card';
      card.dataset.tbId = tb.id;
      card.innerHTML = `
        <div class="tb-card-name">${tb.name}</div>
        <div class="tb-card-info">${tb.unitCount} 个单元 · ${tb.totalWords} 个单词</div>
        ${tb.id === 'wy-7a' ? '<div class="tb-card-badge">默认</div>' : ''}
        ${tb.totalWords === 0 ? '<div class="tb-card-badge tb-card-empty">暂无数据</div>' : ''}
      `;
      card.addEventListener('click', () => {
        tbOptions.querySelectorAll('.textbook-option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedTbId = tb.id;
        if (btnConfirmTb) btnConfirmTb.disabled = (tb.totalWords === 0);
      });
      tbOptions.appendChild(card);
    });

    // Pre-select first textbook
    const firstCard = tbOptions.querySelector('.textbook-option-card');
    if (firstCard) {
      firstCard.classList.add('selected');
      btnConfirmTb.disabled = (textbooks[0]?.totalWords === 0);
    }

    btnConfirmTb.addEventListener('click', () => {
      const name = container._pendingName || '小冒险家';
      audio.init();
      speech.init();
      gameState.newGame(name, selectedTbId);
      audio.newGame();
      renderScreen('mainMenu');
      showToast(`欢迎，${name}！你的冒险开始了！`, 'success');
    });

    btnBackTb.addEventListener('click', () => {
      tbSelectArea.style.display = 'none';
      nameArea.style.display = 'block';
      inputName.focus();
    });
  }

  btnCancel.addEventListener('click', () => {
    nameArea.style.display = 'none';
    tbSelectArea.style.display = 'none';
    btnNew.style.display = '';
    btnContinue.style.display = '';
  });

  inputName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnConfirm.click();
    if (e.key === 'Escape') btnCancel.click();
  });
}

// ==================== MAIN MENU ====================

function renderMainMenu(container) {
  const p = gameState.player;
  if (!p) {
    renderScreen('title');
    return;
  }

  const hpPercent = Math.round((p.hp / p.maxHp) * 100);

  const html = `
    <div class="menu-screen">
      ${createScreenTitle('冒险者大厅', '选择一个行动').outerHTML}

      <div class="panel player-summary with-avatar">
        <div class="player-summary-left">
          ${renderAvatar(p)}
        </div>
        <div class="player-summary-right">
          <div class="player-header">
            <span class="player-level">Lv.${p.level}</span>
            <span class="player-name-display">${p.name}</span>
            <span class="player-gold">💰 ${p.gold}</span>
          </div>
          <div class="player-hp-row">
            <span>❤️</span>
            <div class="progress-bar" style="flex:1;">
              <div class="progress-bar-fill hp" style="width:${hpPercent}%;"></div>
              <div class="progress-bar-label">${p.hp}/${p.maxHp}</div>
            </div>
          </div>
          <div class="player-quick-stats">
            <span>⚔️ATK:${p.attack}</span>
            <span>🛡️DEF:${p.defense}</span>
            <span>⚡SPD:${p.speed}</span>
            <span>💥CRIT:${Math.round(p.criticalChance * 100)}%</span>
          </div>
          <div class="player-progress-text">
            掌握单词: ${p.wordsMastered.length}/${getTextbook().words.length} | Boss击败: ${p.bossDefeated.length}
          </div>
        </div>
      </div>

      <div class="menu-grid">
        <button id="btn-dungeon" class="menu-btn card-shine">
          <span class="menu-btn-icon">🏰</span>
          <span class="menu-btn-label">地牢探险</span>
          <span class="menu-btn-desc">挑战单词怪物</span>
        </button>
        <button id="btn-shop" class="menu-btn card-shine">
          <span class="menu-btn-icon">🛒</span>
          <span class="menu-btn-label">装备商店</span>
          <span class="menu-btn-desc">购买武器防具</span>
        </button>
        <button id="btn-character" class="menu-btn card-shine">
          <span class="menu-btn-icon">👤</span>
          <span class="menu-btn-label">角色属性</span>
          <span class="menu-btn-desc">查看详细信息</span>
        </button>
        <button id="btn-inventory" class="menu-btn card-shine">
          <span class="menu-btn-icon">🎒</span>
          <span class="menu-btn-label">背包道具</span>
          <span class="menu-btn-desc">管理装备</span>
        </button>
      </div>

      <div class="menu-bottom">
        <div class="textbook-switch-area" style="margin-bottom: 12px;">
          <button id="btn-switch-textbook" class="btn btn-block" style="background: var(--bg-card);">
            📚 当前教材：${getTextbook().meta.shortName} — 点击切换
          </button>
        </div>
        <button id="btn-rest" class="btn btn-success btn-block">
          💤 休息回血（恢复 50% HP，10分钟冷却）
        </button>
        <div class="sound-control">
          <button id="btn-mute" class="btn btn-sm ${audio.muted ? 'btn-danger' : ''}">
            ${audio.muted ? '🔇 静音中' : '🔊 音效'}
          </button>
          <label class="volume-label">
            音量
            <input type="range" id="volume-slider" min="0" max="100" value="${Math.round(audio.volume * 100)}"
              style="width: 100px; vertical-align: middle;" />
          </label>
        </div>

        <div class="save-control">
          <button id="btn-export-save" class="btn btn-sm">
            📥 导出存档
          </button>
          <button id="btn-import-save" class="btn btn-sm">
            📤 导入存档
          </button>
          <button id="btn-delete-save" class="btn btn-sm btn-danger">
            🗑️ 删除存档
          </button>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  document.getElementById('btn-dungeon').addEventListener('click', () => renderScreen('dungeon'));
  document.getElementById('btn-shop').addEventListener('click', () => renderScreen('shop'));
  document.getElementById('btn-character').addEventListener('click', () => renderScreen('character'));
  document.getElementById('btn-inventory').addEventListener('click', () => renderScreen('inventory'));
  document.getElementById('btn-switch-textbook').addEventListener('click', () => renderTextbookSwitch(container));
  document.getElementById('btn-rest').addEventListener('click', () => {
    const healed = p.restHp(0.5);
    gameState.saveGame();
    showToast(`休息完毕！恢复了 ${healed} 点 HP`, 'success');
    renderScreen('mainMenu');
  });

  // Sound controls
  const btnMute = document.getElementById('btn-mute');
  const volumeSlider = document.getElementById('volume-slider');

  if (btnMute) {
    btnMute.addEventListener('click', () => {
      const muted = audio.toggleMute();
      btnMute.textContent = muted ? '🔇 静音中' : '🔊 音效';
      btnMute.className = 'btn btn-sm ' + (muted ? 'btn-danger' : '');
      audio.click();
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      audio.setVolume(parseInt(volumeSlider.value) / 100);
    });
  }

  // Save management buttons
  const btnExport = document.getElementById('btn-export-save');
  const btnImport = document.getElementById('btn-import-save');
  const btnDelete = document.getElementById('btn-delete-save');

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      try {
        const result = exportSave(gameState);
        audio.buy();
        showToast(`存档已导出：${result.filename}`, 'success');
      } catch (e) {
        showToast(`导出失败：${e.message}`, 'error');
      }
    });
  }

  if (btnImport) {
    btnImport.addEventListener('click', async () => {
      try {
        const data = await importSave();
        if (!data) {
          // User cancelled file selection
          return;
        }

        // Show preview and confirm
        const summary = getSaveSummary(data);
        const confirmed = confirm(
          `📤 确认导入存档\n\n` +
          `角色：${summary.name}\n` +
          `等级：Lv.${summary.level}\n` +
          `金币：💰 ${summary.gold}\n` +
          `掌握单词：${summary.wordsMastered} 个\n` +
          `存档时间：${summary.savedAt}\n\n` +
          `⚠️ 当前游戏进度将被覆盖！\n\n` +
          `点击「确定」继续导入，点击「取消」放弃。`
        );

        if (!confirmed) {
          showToast('已取消导入。', 'info');
          return;
        }

        // Create new player from imported data
        const player = new Player(data.player.name);
        player.deserialize(data.player);

        // If imported data is from an older version, migrate it
        if (data.saveVersion < CURRENT_SAVE_VERSION) {
          // Migration happens through state's loadGame mechanism
          // For direct import, we save the data first, then load via state
        }

        gameState.player = player;
        gameState.settings = { ...gameState.settings, ...data.settings };
        gameState.saveGame();
        audio.buy();
        showToast(
          `存档导入成功！欢迎回来，${summary.name} Lv.${summary.level}`,
          'success'
        );
        renderScreen('mainMenu');
      } catch (e) {
        audio.error();
        showToast(`导入失败：${e.message}`, 'error');
      }
    });
  }

  if (btnDelete) {
    btnDelete.addEventListener('click', () => {
      const confirmed = confirm(
        '🗑️ 确定要删除存档吗？\n\n' +
        '⚠️ 此操作不可撤销！\n' +
        '⚠️ 所有游戏进度将永久丢失！\n\n' +
        '建议先「导出存档」备份后再删除。\n\n' +
        '点击「确定」继续删除，点击「取消」放弃。'
      );

      if (!confirmed) {
        showToast('已取消删除。', 'info');
        return;
      }

      // Double confirm
      const doubleConfirm = confirm(
        '⚠️ 最后确认\n\n' +
        `角色：${p.name} Lv.${p.level}\n` +
        `掌握单词：${p.wordsMastered.length} 个\n` +
        `游戏时间：${p.stats.totalBattles} 场战斗\n\n` +
        '真的要删除吗？'
      );

      if (!doubleConfirm) {
        showToast('已取消删除。', 'info');
        return;
      }

      gameState.deleteSave();
      audio.defeat();
      showToast('存档已删除。', 'info');
      renderScreen('title');
    });
  }
}

// ==================== DUNGEON MAP ====================

function renderDungeonMap(container) {
  const p = gameState.player;

  const html = `
    <div class="dungeon-screen">
      <h2 class="screen-title">🗺️ 地牢地图 — ${getTextbook().meta.name}</h2>
      <div class="dungeon-units" id="dungeon-units"></div>
      <div style="margin-top: 16px; text-align: center; color: var(--text-secondary); font-size: 0.85rem;">
        单词掌握: ${p.wordsMastered.length}/${getTextbook().words.length} | 已完成: ${p.completedUnits.length}/${getTextbook().units.length} 个单元
      </div>
      <div style="margin-top: 24px; text-align: center;">
        <button id="btn-back-menu" class="btn">返回主菜单</button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  const unitsContainer = document.getElementById('dungeon-units');

  getTextbook().units.forEach((unit, index) => {
    const isCompleted = p.completedUnits.includes(unit.id);
    const isCurrent = p.currentUnit === unit.id;

    let statusIcon = '<span class="status-dot status-open"></span>';
    let statusClass = 'unlocked';
    if (isCompleted) {
      statusIcon = '<span class="status-dot status-done"></span>';
      statusClass = 'completed';
    } else if (isCurrent) {
      statusIcon = '<span class="status-dot status-current"></span>';
      statusClass = 'current';
    }

    const unitWords = getTextbook().words.filter(w => w.unitId === unit.id);
    const completedWords = unitWords.filter(w => p.wordsMastered.includes(w.id)).length;
    const battleDefeated = p.getUnitDefeatedCount(unit.id);

    const card = createElement('div', {
      className: `dungeon-unit-card ${statusClass} card-shine`,
      dataset: { unitId: unit.id }
    });

    card.innerHTML = `
      <div class="unit-status-icon">${statusIcon}</div>
      <div class="unit-info">
        <div class="unit-name">${unit.name}</div>
        <div class="unit-desc">${unit.description || ''}</div>
        <div class="unit-progress">
          单词: ${completedWords}/${unitWords.length}
          ${battleDefeated > 0 ? ` | <span style="color: #ffa500;">⚡ 本次: ${battleDefeated}/${unitWords.length}</span>` : ''}
          ${unit.bossName ? ` | 👑 Boss: ${unit.bossName}` : ''}
        </div>
      </div>
    `;

    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      gameState.dungeonContext = { unit, unitWords };
      renderScreen('unitOverview', { unit, unitWords });
    });

    unitsContainer.appendChild(card);
  });

  document.getElementById('btn-back-menu').addEventListener('click', () => renderScreen('mainMenu'));
}

// ==================== UNIT OVERVIEW ====================

function renderUnitOverview(container, { unit, unitWords }) {
  const p = gameState.player;
  const bossName = unit.bossName || '单元Boss';
  const battleDefeated = p.getUnitDefeatedCount(unit.id);
  const hasProgress = battleDefeated > 0;

  // Build set for fast lookup
  const defeatedSet = new Set(
    (p.unitBattleProgress[unit.id]?.defeatedWordIds) || []
  );

  const html = `
    <div class="overview-screen">
      <h2 class="screen-title">${unit.name}</h2>
      <p class="screen-subtitle">
        怪物总数: ${unitWords.length} | Boss: ${bossName}
        ${hasProgress ? ` | <span style="color: #ffa500;">⚡ 本次已击败: ${battleDefeated}/${unitWords.length}</span>` : ''}
      </p>

      <div class="word-monster-list" style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
        ${unitWords.map(w => {
          const monsterCSS = ['monster-mini-goblin', 'monster-mini-slime', 'monster-mini-skeleton', 'monster-mini-ghost', 'monster-mini-dragon'][Math.min(4, w.difficulty - 1)] || 'monster-mini-goblin';
          const stars = '⭐'.repeat(w.difficulty);
          const isMastered = p.wordsMastered.includes(w.id);
          const isDefeated = defeatedSet.has(w.id);
          return `
            <div class="word-monster-item ${isMastered ? 'mastered' : ''} ${isDefeated ? 'defeated' : ''}">
              <span class="monster-emoji"><span class="${monsterCSS}"></span></span>
              <span class="word-english">${w.english}</span>
              <span class="word-chinese">${w.chinese}</span>
              <span class="word-difficulty">${stars}</span>
              ${isMastered ? '<span class="word-mastered-tag">✅ 已掌握</span>' : ''}
              ${isDefeated && !isMastered ? '<span class="word-mastered-tag" style="color: #ffa500;">⚔️ 已击败</span>' : ''}
            </div>
          `;
        }).join('')}
        <div class="word-monster-item boss-item">
          <span class="monster-emoji"><span class="monster-mini-boss"></span></span>
          <span class="word-english">BOSS</span>
          <span class="word-chinese">${bossName}</span>
          <span class="word-difficulty">💀</span>
        </div>
      </div>

      <div style="text-align: center; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <button id="btn-preview" class="btn btn-lg" style="background: linear-gradient(180deg, #64b5f6, #42a5f5); border-color: #1e88e5; color: #fff;">📖 预习本单元</button>
        <button id="btn-start-battle" class="btn btn-primary btn-lg">
          ${hasProgress ? '⚔️ 继续战斗' : '⚔️ 开始战斗'}
        </button>
        ${hasProgress ? '<button id="btn-reset-battle" class="btn btn-lg" style="background: #5a3a2a;">🔄 重新开始</button>' : ''}
        <button id="btn-back-dungeon" class="btn btn-lg">🗺️ 返回地图</button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  document.getElementById('btn-back-dungeon').addEventListener('click', () => renderScreen('dungeon'));
  document.getElementById('btn-preview').addEventListener('click', () => {
    renderScreen('preview', { unit, unitWords });
  });
  document.getElementById('btn-start-battle').addEventListener('click', () => {
    startUnitBattle(unit, unitWords);
  });

  const btnReset = document.getElementById('btn-reset-battle');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      p.clearUnitProgress(unit.id);
      gameState.saveGame();
      showToast('已重置单元进度，将从头开始战斗。', 'info');
      renderScreen('unitOverview', { unit, unitWords });
    });
  }
}

// ==================== PREVIEW MODULE ====================

/** Generate random extra letters for the scramble pool. */
function generateExtraLetters(word, count) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const wordLetters = new Set(word.toLowerCase().replace(/[^a-z]/g, ''));
  const candidates = alphabet.split('').filter(l => !wordLetters.has(l));
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(candidates[Math.floor(Math.random() * candidates.length)]);
  }
  return result;
}

/** Shuffle an array (Fisher-Yates). */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Preview screen — letter scramble game.
 * User sees Chinese + phonetic, clicks scrambled letters to spell the word.
 */
function renderPreviewScreen(container, { unit, unitWords, retryWords }) {
  const p = gameState.player;
  const words = retryWords || unitWords;
  let currentIndex = 0;
  // Track results: { wordId, status: 'correct'|'skipped'|'shown' }
  const results = [];

  function renderWord() {
    if (currentIndex >= words.length) {
      // All done — save and go to end screen
      results.forEach(r => {
        if (r.status === 'correct') p.previewWord(unit.id, r.wordId);
      });
      gameState.saveGame();
      renderScreen('previewEnd', { unit, unitWords, results });
      return;
    }

    const word = words[currentIndex];
    const letters = word.english.toLowerCase().replace(/[^a-z]/g, '').split('');
    const extras = generateExtraLetters(word.english, 3);
    const pool = shuffleArray([...letters, ...extras]);

    // Track which pool letters have been used and which answer slots are filled
    const usedIndices = new Set();
    const slotValues = new Array(letters.length).fill(null);
    const slotPoolMap = new Array(letters.length).fill(null);  // which pool index each slot uses

    // Build slot HTML — letters get clickable slots; everything else auto-placed
    function buildSlotsHTML() {
      const english = word.english;
      let html = '';
      let letterIdx = 0;
      for (const ch of english) {
        if (ch === ' ') {
          html += '<div class="preview-spacer"></div>';
        } else if (ch === '-') {
          html += '<div class="preview-hyphen">-</div>';
        } else if (/[a-zA-Z]/.test(ch)) {
          const val = slotValues[letterIdx] || '';
          const filledCls = val ? ' filled' : '';
          html += `<div class="preview-slot${filledCls}" data-slot="${letterIdx}">${val}</div>`;
          letterIdx++;
        } else {
          // Punctuation, apostrophes, etc. — display as static separators
          html += `<div class="preview-hyphen">${ch}</div>`;
        }
      }
      return html;
    }

    function render() {
      const progress = `第 ${currentIndex + 1}/${words.length} 词`;
      container.innerHTML = `
        <div class="preview-screen">
          <div class="preview-progress">${progress}</div>
          <div class="preview-word-display">
            <div class="preview-word-chinese">${word.chinese}</div>
            <div class="preview-word-phonetic">${word.phonetic || ''}</div>
          </div>
          <div class="preview-answer-row" id="answer-row">
            ${buildSlotsHTML()}
          </div>
          <div class="preview-letter-pool" id="letter-pool">
            ${pool.map((l, i) =>
              `<div class="preview-letter${usedIndices.has(i) ? ' used' : ''}" data-pool="${i}">${l}</div>`
            ).join('')}
          </div>
          <div class="preview-actions">
            <button id="btn-show-answer" class="btn btn-sm">💡 显示答案</button>
            <button id="btn-skip" class="btn btn-sm">⏭️ 跳过</button>
          </div>
        </div>
      `;
      bindEvents();
    }

    function bindEvents() {
      // Click letter in pool → fill first empty slot
      document.querySelectorAll('.preview-letter:not(.used)').forEach(el => {
        el.addEventListener('click', () => {
          try {
            const poolIdx = parseInt(el.dataset.pool);
            const emptySlotIdx = slotValues.findIndex(v => v === null);
            if (emptySlotIdx === -1) return;

            usedIndices.add(poolIdx);
            slotValues[emptySlotIdx] = pool[poolIdx];
            slotPoolMap[emptySlotIdx] = poolIdx;

            // Check if word is complete
            if (slotValues.every(v => v !== null)) {
              const spelled = slotValues.join('');
              const expected = word.english.toLowerCase().replace(/[^a-z]/g, '');
              if (spelled === expected) {
                // Correct!
                results.push({ wordId: word.id, status: 'correct' });
                highlightCorrect(() => {
                  currentIndex++;
                  renderWord();
                });
                return;
              } else {
                // Wrong answer — flash red briefly, then let user adjust
                highlightWrong();
                return;
              }
            }

            render();
          } catch (e) {
            console.error('Preview letter click error:', e);
            render();
          }
        });
      });

      // Click filled slot → return letter to pool
      document.querySelectorAll('.preview-slot.filled').forEach(el => {
        el.addEventListener('click', () => {
          try {
            const slotIdx = parseInt(el.dataset.slot);
            const letter = slotValues[slotIdx];
            if (!letter) return;

            // Return the exact pool index that was used for this slot
            const poolIdx = slotPoolMap[slotIdx];
            if (poolIdx !== null) {
              usedIndices.delete(poolIdx);
            }
            slotValues[slotIdx] = null;
            slotPoolMap[slotIdx] = null;
            render();
          } catch (e) {
            console.error('Preview slot click error:', e);
            render();
          }
        });
      });

      // Show answer
      const btnShow = document.getElementById('btn-show-answer');
      if (btnShow) {
        btnShow.addEventListener('click', () => {
          try {
            const expected = word.english.toLowerCase().replace(/[^a-z]/g, '');
            slotValues.splice(0, slotValues.length, ...expected.split(''));
            slotPoolMap.fill(null);
            usedIndices.clear();
            results.push({ wordId: word.id, status: 'shown' });
            showAnswerRender();
          } catch (e) {
            console.error('Preview show answer error:', e);
            render();
          }
        });
      }

      // Skip
      const btnSkip = document.getElementById('btn-skip');
      if (btnSkip) {
        btnSkip.addEventListener('click', () => {
          try {
            results.push({ wordId: word.id, status: 'skipped' });
            currentIndex++;
            renderWord();
          } catch (e) {
            console.error('Preview skip error:', e);
            currentIndex++;
            renderWord();
          }
        });
      }
    }

    function highlightCorrect(callback) {
      // Flash all slots green
      const slots = document.querySelectorAll('.preview-slot');
      slots.forEach(s => s.classList.add('correct'));
      audio.correct();
      setTimeout(callback, 800);
    }

    function highlightWrong() {
      // Flash all slots red briefly, then re-render so user can adjust
      const slots = document.querySelectorAll('.preview-slot');
      slots.forEach(s => s.classList.add('wrong'));
      audio.error();
      setTimeout(() => render(), 400);
    }

    function showAnswerRender() {
      const letters = word.english.toLowerCase().replace(/[^a-z]/g, '').split('');
      // Re-render with shown-answer class
      container.innerHTML = `
        <div class="preview-screen">
          <div class="preview-progress">第 ${currentIndex + 1}/${words.length} 词</div>
          <div class="preview-word-display">
            <div class="preview-word-chinese">${word.chinese}</div>
            <div class="preview-word-phonetic">${word.phonetic || ''}</div>
          </div>
          <div class="preview-answer-row">
            ${(() => {
              let html = '';
              let letterIdx = 0;
              for (const ch of word.english) {
                if (ch === ' ') {
                  html += '<div class="preview-spacer"></div>';
                } else if (ch === '-') {
                  html += '<div class="preview-hyphen">-</div>';
                } else if (/[a-zA-Z]/.test(ch)) {
                  html += `<div class="preview-slot filled shown-answer">${letters[letterIdx++]}</div>`;
                } else {
                  // Punctuation, apostrophes, etc. — display static
                  html += `<div class="preview-hyphen">${ch}</div>`;
                }
              }
              return html;
            })()}
          </div>
          <div class="preview-letter-pool"></div>
          <div class="preview-actions">
            <button id="btn-next-word" class="btn btn-primary btn-sm">▶ 下一词</button>
          </div>
        </div>
      `;
      document.getElementById('btn-next-word').addEventListener('click', () => {
        currentIndex++;
        renderWord();
      });
    }

    render();
  }

  renderWord();
}

/**
 * Preview end screen — summary + retry.
 */
function renderPreviewEndScreen(container, { unit, unitWords, results }) {
  const correct = results.filter(r => r.status === 'correct').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const shown = results.filter(r => r.status === 'shown').length;
  const total = results.length;

  const wordMap = {};
  unitWords.forEach(w => { wordMap[w.id] = w; });

  const statusIcon = { correct: '✅', skipped: '⏭️', shown: '👁️' };
  const statusLabel = { correct: '拼对', skipped: '跳过', shown: '查看' };

  const missedWords = results.filter(r => r.status !== 'correct').map(r => wordMap[r.wordId]).filter(Boolean);

  container.innerHTML = `
    <div class="preview-end-screen">
      <h2 class="screen-title">预习完成！</h2>
      <div class="preview-end-stats">
        <div class="preview-stat correct">
          <div class="preview-stat-value">${correct}</div>
          <div class="preview-stat-label">✅ 拼对</div>
        </div>
        <div class="preview-stat skipped">
          <div class="preview-stat-value">${skipped}</div>
          <div class="preview-stat-label">⏭️ 跳过</div>
        </div>
        <div class="preview-stat shown">
          <div class="preview-stat-value">${shown}</div>
          <div class="preview-stat-label">👁️ 查看</div>
        </div>
      </div>
      <p class="preview-end-summary">正确 ${correct}/${total} 个单词</p>

      <div class="preview-result-list">
        ${results.map(r => {
          const w = wordMap[r.wordId];
          if (!w) return '';
          return `
            <div class="preview-result-item">
              <span class="preview-result-status">${statusIcon[r.status]}</span>
              <span class="preview-result-english">${w.english}</span>
              <span class="preview-result-chinese">${w.chinese}</span>
            </div>
          `;
        }).join('')}
      </div>

      <div class="preview-actions">
        ${missedWords.length > 0 ? `<button id="btn-retry-missed" class="btn btn-primary btn-lg">🔄 重试未拼对的单词 (${missedWords.length})</button>` : ''}
        <button id="btn-back-overview" class="btn btn-lg">🗺️ 返回单词列表</button>
      </div>
    </div>
  `;

  if (missedWords.length > 0) {
    document.getElementById('btn-retry-missed').addEventListener('click', () => {
      renderScreen('preview', { unit, unitWords, retryWords: missedWords });
    });
  }
  document.getElementById('btn-back-overview').addEventListener('click', () => {
    renderScreen('unitOverview', { unit, unitWords });
  });
}

// ==================== START BATTLE ====================

function startUnitBattle(unit, unitWords) {
  const p = gameState.player;

  // Collect already-defeated word IDs from the current run
  const progress = p.unitBattleProgress[unit.id];
  const defeatedIds = progress?.defeatedWordIds || [];

  // Filter: exclude mastered words AND words already defeated this run
  let remainingWords = unitWords.filter(w =>
    !p.wordsMastered.includes(w.id) && !defeatedIds.includes(w.id)
  );

  // If ALL non-boss words are already defeated, go straight to boss
  if (remainingWords.length === 0 && defeatedIds.length > 0) {
    startBossBattle(unit, unitWords);
    return;
  }

  // Fallback: if everything is mastered, still give something to fight
  if (remainingWords.length === 0) {
    remainingWords = unitWords;
  }

  const battleWords = shuffle(remainingWords);

  // Create monster queue from words
  const monsterQueue = battleWords.map(w => {
    const monster = createMonsterFromWord(w);
    return scaleMonsterToPlayer(monster, p.level);
  });

  // Save battle context
  gameState.battleContext = {
    unitId: unit.id,
    unit: unit,
    monsterQueue: monsterQueue,
    currentIndex: 0,
    totalMonsters: monsterQueue.length,
    bossDefeated: false,
    perfectSoFar: true
  };

  // Start first battle
  const firstMonster = monsterQueue[0];
  renderScreen('battle', { monster: firstMonster, unit: unit });
}

/**
 * Start a boss battle for a unit (shared by startUnitBattle and victory screen).
 */
function startBossBattle(unit, unitWords) {
  const p = gameState.player;
  const boss = createBossFromUnit(unitWords, unit);
  boss.hp = Math.max(50, boss.maxHp);

  // Save battle context (boss-only, no normal monster queue)
  gameState.battleContext = {
    unitId: unit.id,
    unit: unit,
    monsterQueue: [],
    currentIndex: unitWords.length, // All normal monsters counted as done
    totalMonsters: unitWords.length,
    bossDefeated: false,
    perfectSoFar: true
  };

  renderScreen('battle', { monster: boss, unit: unit });
}

/**
 * Generate CSS pixel art HTML for a monster sprite.
 * @param {string} spriteType - 'goblin' | 'slime' | 'skeleton' | 'ghost' | 'dragon' | 'boss'
 * @returns {string} HTML string
 */
function getMonsterSpriteHTML(spriteType) {
  switch (spriteType) {
    case 'goblin':
      return `<div class="sprite-inner">
        <div class="goblin-head"><div class="goblin-eyes"></div><div class="goblin-mouth"></div></div>
        <div class="goblin-body"></div>
        <div class="goblin-arm-left"></div><div class="goblin-arm-right"></div>
        <div class="goblin-leg-left"></div><div class="goblin-leg-right"></div>
      </div>`;
    case 'slime':
      return `<div class="sprite-inner">
        <div class="slime-body"><div class="slime-eyes"></div><div class="slime-mouth"></div></div>
        <div class="slime-shadow"></div>
      </div>`;
    case 'skeleton':
      return `<div class="sprite-inner">
        <div class="skeleton-head"><div class="skeleton-eyes"></div><div class="skeleton-nose"></div></div>
        <div class="skeleton-neck"></div>
        <div class="skeleton-ribcage"></div>
        <div class="skeleton-arm-left"></div><div class="skeleton-arm-right"></div>
        <div class="skeleton-pelvis"></div>
        <div class="skeleton-leg-left"></div><div class="skeleton-leg-right"></div>
      </div>`;
    case 'ghost':
      return `<div class="sprite-inner">
        <div class="ghost-body"><div class="ghost-eyes"></div><div class="ghost-mouth"></div></div>
      </div>`;
    case 'dragon':
      return `<div class="sprite-inner">
        <div class="dragon-head"><div class="dragon-eyes"></div></div>
        <div class="dragon-snout"></div>
        <div class="dragon-body"></div>
        <div class="dragon-wing-left"></div><div class="dragon-wing-right"></div>
        <div class="dragon-tail"></div>
        <div class="dragon-leg-left"></div><div class="dragon-leg-right"></div>
        <div class="dragon-fire"></div>
      </div>`;
    case 'boss':
      return `<div class="sprite-inner">
        <div class="boss-aura-outer"></div>
        <div class="boss-aura-inner"></div>
        <div class="boss-body">
          <div class="boss-horns"></div>
          <div class="boss-crown-spike"></div>
          <div class="boss-eyes"></div>
          <div class="boss-mouth"></div>
        </div>
      </div>`;
    default:
      // Fallback: show emoji
      return `<span style="font-size:5rem;">👾</span>`;
  }
}

// ==================== BATTLE SCREEN (THE CORE) ====================

function renderBattleScreen(container, { monster, unit }) {
  const p = gameState.player;
  const ctx = gameState.battleContext;
  const timerSeconds = gameState.getTimerSeconds();

  // Use AbortController to clean up event listeners when battle ends
  const abortController = new AbortController();
  const signal = abortController.signal;

  // Create battle controller
  const battle = new BattleController(p, monster, { timerSeconds });
  currentBattle = battle;

  const bossWord = monster.word;
  const word = bossWord || (monster.wordPool ? monster.wordPool[0] : null);

  if (!word) {
    abortController.abort();
    renderScreen('dungeon');
    showToast('错误：没有找到单词数据', 'error');
    return;
  }

  // If it's a boss, get first word from pool
  if (monster.type === 'boss' && !monster.word) {
    getNextBossWord(monster);
  }

  let displayWord = monster.word || word;
  const currentIndex = (ctx?.currentIndex || 0) + 1;
  const totalMonsters = ctx?.totalMonsters || 1;

  const html = `
    <div class="battle-screen">
      <div class="battle-header">
        <span>${unit ? unit.name : ''} — ${monster.type === 'boss' ? '👑 Boss 战' : `第 ${currentIndex}/${totalMonsters} 战`}</span>
      </div>

      <div class="battle-monster-area monster-scene-${monster.sprite || 'goblin'}" id="monster-area">
        <div class="monster-sprite ${monster.sprite || ''}" id="monster-sprite">${getMonsterSpriteHTML(monster.sprite)}</div>
        <div class="monster-name">${monster.displayName}</div>
        <div class="monster-english-name">${monster.englishName}</div>
        <div class="monster-hp-bar" id="monster-hp-bar">
          ${createProgressBar(monster.hp, monster.maxHp, 'hp').outerHTML}
        </div>
      </div>

      <div class="battle-input-area">
        <div class="battle-prompt">
          请翻译以下中文:
          <div class="battle-word-chinese" id="battle-word-display">
            「 ${displayWord.chinese} 」
            <button id="btn-speak" class="btn-speak" title="听发音 (-5 XP)">
              🔊
            </button>
          </div>
        </div>
        <div class="battle-input-wrapper">
          <input type="text" id="battle-input" class="input-rpg battle-input"
            autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
            maxlength="40" placeholder="输入英文单词...">
        </div>
        <div class="battle-hint">
          按 Enter 攻击 | ⏱️ <span id="battle-timer">${timerSeconds}</span>s
          <span class="hint-speak">| 💡 点🔊听发音</span>
        </div>
      </div>

      <div class="battle-actions">
        <button id="btn-attack" class="btn btn-primary">⚔️ 攻击 (Enter)</button>
        <button id="btn-defend" class="btn">🛡️ 防御</button>
        <button id="btn-flee" class="btn">🏃 逃跑</button>
      </div>

      <div class="battle-player-area">
        <div class="player-hp-section">
          <span>你的 HP:</span>
          <div class="progress-bar" style="flex:1;">
            <div class="progress-bar-fill hp"
              style="width:${Math.round((p.hp / p.maxHp) * 100)}%;"></div>
            <div class="progress-bar-label">${p.hp}/${p.maxHp}</div>
          </div>
        </div>
        <div class="battle-streak">
          连击: <span id="streak-count">x${battle.streakCount}</span>
        </div>
      </div>

      <div class="battle-message" id="battle-message"></div>
      <div class="floating-text-layer" id="floating-layer"></div>
    </div>
  `;

  container.innerHTML = html;

  const input = document.getElementById('battle-input');
  const timerEl = document.getElementById('battle-timer');

  // Auto focus input
  setTimeout(() => input.focus(), 100);

  // Start the battle
  battle.start();

  // Monster appear sound
  if (monster.type === 'boss') {
    audio.bossAppear();
  } else {
    audio.monsterAppear();
  }

  // --- Event Handlers ---

  function handleSubmit() {
    const answer = input.value.trim();
    if (!answer) {
      // Empty = wrong answer
      const result = battle.submitAnswer('');
      handleResolve(result);
      return;
    }
    input.value = '';
    input.disabled = true;
    const result = battle.submitAnswer(answer);
    handleResolve(result);
  }

  function handleResolve(result) {
    if (!result) return;

    const msgEl = document.getElementById('battle-message');
    const floatingLayer = document.getElementById('floating-layer');
    const streakEl = document.getElementById('streak-count');
    const monsterSprite = document.getElementById('monster-sprite');

    // Show message
    if (msgEl) {
      msgEl.textContent = result.message || '';
      msgEl.className = `battle-message ${result.isCorrect ? 'correct' : 'wrong'}`;
    }

    // Sound effects
    if (result.isCorrect) {
      audio.correct();
      if (result.isCritical) {
        audio.critical();
      } else {
        audio.attackHit();
      }
      // Streak sounds
      if (battle.streakCount >= 10) audio.streakGodlike();
      else if (battle.streakCount >= 5) audio.streakFire();
      else if (battle.streakCount >= 3) audio.streakHot();
    } else if (result.isTimeout) {
      audio.timeout();
    } else {
      audio.monsterAttack();
    }

    // Update monster HP bar
    updateMonsterHpBar();

    // Update player info
    updatePlayerInfo();

    // Update streak display
    if (streakEl) {
      streakEl.textContent = `x${battle.streakCount}`;
      if (battle.streakCount >= 10) streakEl.className = 'streak-godlike';
      else if (battle.streakCount >= 5) streakEl.className = 'streak-fire';
      else if (battle.streakCount >= 3) streakEl.className = 'streak-hot';
      else streakEl.className = '';
    }

    // Monster shake animation on hit
    if (monsterSprite && result.isPlayer) {
      monsterSprite.classList.add('shake');
      setTimeout(() => monsterSprite.classList.remove('shake'), 400);
    }

    // Flash screen
    const battleScreen = document.querySelector('.battle-screen');
    if (battleScreen) {
      if (result.isPlayer && result.isCritical && result.speedTier === 'godlike') {
        battleScreen.classList.add('flash-godlike');
        setTimeout(() => battleScreen.classList.remove('flash-godlike'), 500);
      } else if (result.isPlayer && result.isCritical) {
        battleScreen.classList.add('flash-critical');
        setTimeout(() => battleScreen.classList.remove('flash-critical'), 500);
      } else if (result.isPlayer && result.speedTier === 'fast') {
        battleScreen.classList.add('flash-fast');
        setTimeout(() => battleScreen.classList.remove('flash-fast'), 300);
      } else if (result.isPlayer) {
        battleScreen.classList.add('flash-correct');
        setTimeout(() => battleScreen.classList.remove('flash-correct'), 300);
      } else {
        battleScreen.classList.add('flash-wrong');
        setTimeout(() => battleScreen.classList.remove('flash-wrong'), 300);
      }
    }

    // Floating damage number
    if (floatingLayer) {
      const dmgText = result.isPlayer
        ? (result.isCritical ? `💥 ${result.damage}!` : `-${result.damage}`)
        : `-${result.damage}`;
      const dmgClass = result.isPlayer
        ? (result.isCritical ? 'dmg-critical' : 'dmg-player')
        : 'dmg-monster';
      const floatEl = createElement('div', {
        className: `floating-text ${dmgClass}`
      }, dmgText);
      floatingLayer.appendChild(floatEl);
      setTimeout(() => {
        if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
      }, 1000);

      // Speed tier floating text
      if (result.speedTier === 'godlike') {
        const speedEl = createElement('div', {
          className: 'floating-text speed-godlike'
        }, '⚡ 神速!');
        floatingLayer.appendChild(speedEl);
        setTimeout(() => {
          if (speedEl.parentNode) speedEl.parentNode.removeChild(speedEl);
        }, 1200);
      } else if (result.speedTier === 'fast') {
        const speedEl = createElement('div', {
          className: 'floating-text speed-fast'
        }, '⚡ 快速!');
        floatingLayer.appendChild(speedEl);
        setTimeout(() => {
          if (speedEl.parentNode) speedEl.parentNode.removeChild(speedEl);
        }, 1000);
      }
    }

    // Check end state
    if (battle.state === BATTLE_STATE.VICTORY) {
      audio.monsterDeath();
      setTimeout(() => handleVictory(), 600);
    } else if (battle.state === BATTLE_STATE.DEFEAT) {
      audio.defeat();
      setTimeout(() => handleDefeat(), 600);
    } else if (battle.state === BATTLE_STATE.FLED) {
      setTimeout(() => {
        renderScreen('dungeon');
        showToast('你逃跑了！损失了一些金币。', 'warning');
      }, 300);
    } else {
      // Next turn - re-enable input
      // For boss battles, get the next word from the pool
      if (monster.type === 'boss') {
        const nextWord = getNextBossWord(monster);
        if (nextWord) {
          displayWord = nextWord;
          const wordDisplay = document.getElementById('battle-word-display');
          if (wordDisplay) {
            wordDisplay.textContent = `「 ${nextWord.chinese} 」`;
          }
        }
      }

      setTimeout(() => {
        input.disabled = false;
        input.focus();
      }, 500);
    }

    // Update timer
    updateTimerDisplay();
  }

  function handleVictory() {
    const rewards = battle.calculateRewards();
    const wordId = displayWord.id;

    // Record word attempt
    p.recordWordAttempt(wordId, true);

    // Award XP and gold
    const levelUp = p.addXp(rewards.xp);
    p.addGold(rewards.gold);
    p.recordBattle(true);

    // Check if perfect so far
    if (ctx) {
      ctx.currentIndex++;

      // Record defeated word for resume support (non-boss only)
      if (monster.type !== 'boss') {
        p.recordDefeatedWord(unit.id, wordId);
      }

      // If boss was just defeated
      if (monster.type === 'boss') {
        ctx.bossDefeated = true;
        p.defeatBoss(unit.id);
        p.completeUnit(unit.id);
        p.clearUnitProgress(unit.id); // Clean up battle progress
      }
    }

    gameState.saveGame();

    // Victory sound (delayed slightly for dramatic effect)
    if (levelUp) {
      setTimeout(() => audio.levelUp(), 400);
    } else if (monster.type === 'boss') {
      setTimeout(() => audio.bossVictory(), 300);
    } else {
      setTimeout(() => audio.victory(), 300);
    }

    abortController.abort();
    renderScreen('victory', {
      rewards,
      levelUp,
      word: displayWord,
      monster: monster,
      unit: unit,
      isBoss: monster.type === 'boss'
    });
  }

  function handleDefeat() {
    const wordId = displayWord.id;
    p.recordWordAttempt(wordId, false);

    const penalty = battle.calculatePenalty();
    p.recordBattle(false);

    gameState.saveGame();

    abortController.abort();
    renderScreen('defeat', {
      penalty,
      word: displayWord,
      unit: unit
    });
  }

  function updateMonsterHpBar() {
    const barContainer = document.getElementById('monster-hp-bar');
    if (!barContainer) return;
    barContainer.innerHTML = createProgressBar(battle.monster.hp, battle.monster.maxHp, 'hp').outerHTML;
  }

  function updatePlayerInfo() {
    const hpSection = document.querySelector('.player-hp-section');
    if (!hpSection) return;
    const hpPercent = Math.round((p.hp / p.maxHp) * 100);
    hpSection.innerHTML = `
      <span>你的 HP:</span>
      <div class="progress-bar" style="flex:1;">
        <div class="progress-bar-fill hp" style="width:${hpPercent}%;"></div>
        <div class="progress-bar-label">${p.hp}/${p.maxHp}</div>
      </div>
    `;
  }

  function updateTimerDisplay() {
    if (timerEl) {
      timerEl.textContent = battle.timeLeft;
      const fraction = battle.timerSeconds > 0
        ? battle.timeLeft / battle.timerSeconds
        : 0;

      // Color gradient: green (>60%) → yellow (>30%) → red (≤30%)
      if (fraction > 0.6) {
        timerEl.style.color = '#4cff4c';         // Green — plenty of time
        timerEl.style.animation = '';
      } else if (fraction > 0.3) {
        timerEl.style.color = '#ffcc00';         // Yellow — getting close
        timerEl.style.animation = '';
      } else if (battle.timeLeft > 0) {
        timerEl.style.color = 'var(--text-accent)';  // Red — hurry!
        timerEl.style.animation = 'pulse 0.5s infinite';
      } else {
        timerEl.style.color = 'var(--text-accent)';
        timerEl.style.animation = 'pulse 0.5s infinite';
      }
    }
  }

  // Input handler
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (battle.state === BATTLE_STATE.PLAYER_TURN) {
        handleSubmit();
      }
    }
  });

  // Button handlers
  document.getElementById('btn-attack').addEventListener('click', () => {
    if (battle.state === BATTLE_STATE.PLAYER_TURN) {
      input.focus();
      handleSubmit();
    }
  });

  document.getElementById('btn-speak').addEventListener('click', () => {
    if (battle.state !== BATTLE_STATE.PLAYER_TURN) return;

    const english = displayWord.english;
    const xpCost = monster.type === 'boss' ? 10 : 5;

    // Check if player has enough XP
    if (p.xp < xpCost) {
      showToast('XP 不足，无法使用语音提示', 'error');
      audio.error();
      return;
    }

    // Deduct XP
    p.xp -= xpCost;
    gameState.saveGame();

    // Speak the word
    speech.init();
    speech.speak(english);

    // Visual feedback on button
    const btnSpeak = document.getElementById('btn-speak');
    if (btnSpeak) {
      btnSpeak.classList.add('speaking');
      btnSpeak.textContent = '🔉';
      setTimeout(() => {
        btnSpeak.classList.remove('speaking');
        btnSpeak.textContent = '🔊';
      }, 1500);
    }

    audio.click();
    showToast(`🔈 "${english}" | -${xpCost} XP`, 'info', 1500);
  });

  document.getElementById('btn-defend').addEventListener('click', () => {
    if (battle.state === BATTLE_STATE.PLAYER_TURN) {
      battle.defend();
      audio.defend();
      showToast('🛡️ 防御姿态！受到的伤害减半。', 'info', 1000);
    }
  });

  document.getElementById('btn-flee').addEventListener('click', () => {
    if (battle.state === BATTLE_STATE.PLAYER_TURN && monster.type !== 'boss') {
      audio.flee();
      const result = battle.tryFlee();
      if (result.success) {
        currentBattle = null;
        abortController.abort();
        renderScreen('dungeon');
        showToast(`逃跑成功！损失了 ${result.penalty} 金币。`, 'warning');
      } else {
        showToast('逃跑失败！怪物趁机攻击了你！', 'error');
        updateMonsterHpBar();
        updatePlayerInfo();
      }
    } else if (monster.type === 'boss') {
      showToast('Boss 战无法逃跑！勇敢面对吧！', 'warning');
    }
  });

  // Listen for battle resolved from timer timeout (using signal from AbortController above)
  document.addEventListener('battle:resolved', (e) => {
    handleResolve(e.detail);
  }, { signal });

  // Listen for timer ticks
  document.addEventListener('battle:timer', (e) => {
    if (timerEl) {
      timerEl.textContent = e.detail.timeLeft;
      if (e.detail.timeLeft <= 3) {
        timerEl.style.color = 'var(--text-accent)';
        timerEl.style.animation = 'pulse 0.5s infinite';
        audio.timerTick();
      }
    }
  }, { signal });

  // Keep focus on input when clicking anywhere in battle area
  container.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON' && battle.state === BATTLE_STATE.PLAYER_TURN) {
      input.focus();
    }
  });
}

// ==================== VICTORY SCREEN ====================

function renderVictoryScreen(container, { rewards, levelUp, word, monster, unit, isBoss }) {
  const p = gameState.player;
  const ctx = gameState.battleContext;

  const html = `
    <div class="victory-screen">
      <div class="victory-icon">🎉</div>
      <h2 class="screen-title">${isBoss ? 'Boss 战胜利！' : '战斗胜利！'}</h2>

      <div class="victory-rewards">
        <div class="reward-item">
          <span class="reward-label">⭐ XP 获得:</span>
          <span class="reward-value">+${rewards.xp}</span>
          ${rewards.streakBonus > 0 ? `<span class="reward-bonus">(连击加成 +${Math.round(rewards.streakBonus * 100)}%)</span>` : ''}
        </div>
        <div class="reward-item">
          <span class="reward-label">💰 金币获得:</span>
          <span class="reward-value">+${rewards.gold}</span>
          ${rewards.streakGoldBonus > 0 ? `<span class="reward-bonus">(连击加成 +${rewards.streakGoldBonus})</span>` : ''}
        </div>
        ${levelUp ? `<div class="reward-item level-up-alert">🎊 升级了！现在是 Lv.${levelUp.newLevel}！</div>` : ''}
      </div>

      <div class="victory-word">
        <span class="check-mark">✅</span>
        <span class="word-text">"${word.english}"</span>
        <span class="word-meaning">= ${word.chinese}</span>
      </div>

      <div class="victory-actions">
        ${ctx && ctx.currentIndex < ctx.totalMonsters ? `
          <button id="btn-next-battle" class="btn btn-primary btn-lg">⚔️ 继续战斗</button>
        ` : (ctx && !ctx.bossDefeated && unit ? `
          <button id="btn-boss-battle" class="btn btn-primary btn-lg">👑 挑战 Boss！</button>
        ` : '')}
        <button id="btn-back-dungeon" class="btn btn-lg">🗺️ 返回地图</button>
      </div>

      <div class="victory-progress">
        单元进度: ${ctx ? `${ctx.currentIndex}/${ctx.totalMonsters}` : '已完成'}
        ${rewards.maxStreak > 0 ? ` | 最大连击: ${rewards.maxStreak}` : ''}
      </div>
    </div>
  `;

  container.innerHTML = html;

  document.getElementById('btn-back-dungeon').addEventListener('click', () => renderScreen('dungeon'));

  const btnNext = document.getElementById('btn-next-battle');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      const nextMonster = ctx.monsterQueue[ctx.currentIndex];
      renderScreen('battle', { monster: nextMonster, unit: unit });
    });
  }

  const btnBoss = document.getElementById('btn-boss-battle');
  if (btnBoss) {
    btnBoss.addEventListener('click', () => {
      const unitWords = getTextbook().words.filter(w => w.unitId === unit.id);
      startBossBattle(unit, unitWords);
    });
  }
}

// ==================== DEFEAT SCREEN ====================

function renderDefeatScreen(container, { penalty, word, unit }) {
  const html = `
    <div class="defeat-screen">
      <div class="defeat-icon">💀</div>
      <h2 class="screen-title">战斗失败...</h2>

      <p class="defeat-message">你被击败了，损失了 <span class="gold-lost">${penalty} 金币</span></p>

      <div class="defeat-word">
        <span class="cross-mark">❌</span>
        <span class="word-text">"${word.english}"</span>
        <span class="word-meaning">= ${word.chinese}</span>
      </div>
      <p class="correct-answer-hint">正确答案: <strong>${word.english}</strong></p>

      <div class="defeat-actions">
        <button id="btn-rest" class="btn btn-success btn-lg">💤 休息回血</button>
        <button id="btn-back-dungeon" class="btn btn-lg">🗺️ 返回地图</button>
      </div>

      <p class="defeat-gold-remaining">剩余金币: 💰 ${gameState.player.gold}</p>
    </div>
  `;

  container.innerHTML = html;

  document.getElementById('btn-rest').addEventListener('click', () => {
    const p = gameState.player;
    const healed = p.restHp(0.5);
    gameState.saveGame();
    showToast(`休息完毕！恢复了 ${healed} 点 HP`, 'success');
    renderScreen('mainMenu');
  });

  document.getElementById('btn-back-dungeon').addEventListener('click', () => renderScreen('dungeon'));
}

// ==================== CHARACTER SCREEN ====================

function renderCharacterScreen(container) {
  const p = gameState.player;

  const getEquipName = (slot) => {
    const eqId = p.equipment[slot];
    if (!eqId) return '无';
    const eq = EQUIPMENT_CATALOG.find(e => e.id === eqId);
    return eq ? `${eq.icon} ${eq.name} (${eq.rarity === 'common' ? '普通' : eq.rarity === 'rare' ? '稀有' : eq.rarity === 'epic' ? '史诗' : '传说'})` : '无';
  };

  const html = `
    <div class="character-screen">
      <h2 class="screen-title">👤 角色属性 — ${p.name}</h2>

      <div class="character-avatar-area">
        ${renderAvatarLarge(p)}
      </div>

      <div class="panel">
        <div class="char-level-row">
          <span>等级: ${p.level}</span>
          <span>XP: ${p.xp}/${p.xpToNext}</span>
        </div>
        ${createProgressBar(p.xp, p.xpToNext, 'xp').outerHTML}

        <div style="margin-top: 16px;">
          <div style="margin-bottom: 8px;">❤️ HP: ${p.hp}/${p.maxHp}</div>
          ${createProgressBar(p.hp, p.maxHp, 'hp').outerHTML}
        </div>

        <div style="margin-top: 16px;">
          ${createStatRow('⚔️', '攻击力', p.attack, getEquipBonus('weapon', 'attack')).outerHTML}
          ${createStatRow('🛡️', '防御力', p.defense, getEquipBonus('armor', 'defense')).outerHTML}
          ${createStatRow('⚡', '速度', p.speed, getEquipBonus('accessory', 'speed')).outerHTML}
          ${createStatRow('💥', '暴击率', Math.round(p.criticalChance * 100) + '%').outerHTML}
          ${createStatRow('💰', '金币', p.gold).outerHTML}
        </div>

        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color);">
          <div><strong>装备：</strong></div>
          <div>🗡️ 武器: ${getEquipName('weapon')}</div>
          <div>🛡️ 防具: ${getEquipName('armor')}</div>
          <div>💍 饰品: ${getEquipName('accessory')}</div>
        </div>
      </div>

      <div class="panel" style="margin-top: 16px;">
        <h3>📊 战斗统计</h3>
        <div>总战斗: ${p.stats.totalBattles}</div>
        <div>胜利: ${p.stats.battlesWon} | 失败: ${p.stats.battlesLost}</div>
        <div>胜率: ${p.getWinRate()}%</div>
        <div>暴击次数: ${p.stats.totalCriticalHits}</div>
        <div>掌握单词: ${p.wordsMastered.length}/${getTextbook().words.length}</div>
        <div>Boss击败: ${p.bossDefeated.length}</div>
      </div>

      <div style="margin-top: 16px; text-align: center;">
        <button id="btn-back-menu" class="btn">返回主菜单</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
  document.getElementById('btn-back-menu').addEventListener('click', () => renderScreen('mainMenu'));

  function getEquipBonus(slot, stat) {
    const eqId = p.equipment[slot];
    if (!eqId) return null;
    const eq = EQUIPMENT_CATALOG.find(e => e.id === eqId);
    if (!eq || !eq.stats[stat]) return null;
    return `+${eq.stats[stat]}`;
  }
}

// ==================== SHOP SCREEN ====================

// Shop tab definitions
const SHOP_TABS = [
  { id: 'all', label: '🌟 全部', filter: () => true },
  { id: 'weapon', label: '🗡️ 攻击', filter: item => item.type === 'weapon' },
  { id: 'armor', label: '🛡️ 防御', filter: item => item.type === 'armor' },
  { id: 'accessory', label: '💍 辅助', filter: item => item.type === 'accessory' },
];

function renderShopScreen(container) {
  const p = gameState.player;
  // Use closure to track active tab for this shop session
  if (!renderShopScreen._activeTab) renderShopScreen._activeTab = 'all';
  const activeTab = renderShopScreen._activeTab;

  // Count items per tab
  const tabCounts = {};
  SHOP_TABS.forEach(tab => {
    tabCounts[tab.id] = EQUIPMENT_CATALOG.filter(tab.filter).length;
  });

  const html = `
    <div class="shop-screen">
      <h2 class="screen-title">🛒 装备商店</h2>
      <div style="text-align: center; margin-bottom: 8px;">
        ${createGoldDisplay(p.gold).outerHTML}
      </div>

      <div class="shop-tabs" id="shop-tabs">
        ${SHOP_TABS.map(tab => `
          <button class="shop-tab ${activeTab === tab.id ? 'shop-tab-active' : ''}"
            data-tab="${tab.id}">
            ${tab.label} <span class="shop-tab-count">(${tabCounts[tab.id]})</span>
          </button>
        `).join('')}
      </div>

      <div class="shop-items" id="shop-items"></div>

      <div style="margin-top: 16px; text-align: center;">
        <button id="btn-back-menu" class="btn">返回主菜单</button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Render shop items filtered by active tab
  renderShopItems(p, activeTab);

  // Tab click handlers
  document.getElementById('shop-tabs').addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.shop-tab');
    if (!tabBtn) return;
    const tabId = tabBtn.dataset.tab;
    if (tabId === activeTab) return;

    renderShopScreen._activeTab = tabId;
    audio.click();
    renderScreen('shop');
  });

  document.getElementById('btn-back-menu').addEventListener('click', () => {
    // Reset tab when leaving shop
    renderShopScreen._activeTab = 'all';
    renderScreen('mainMenu');
  });
}

/**
 * Render shop item cards filtered by tab.
 */
function renderShopItems(player, activeTab) {
  const shopContainer = document.getElementById('shop-items');
  if (!shopContainer) return;

  const activeTabDef = SHOP_TABS.find(t => t.id === activeTab);
  const filter = activeTabDef ? activeTabDef.filter : () => true;
  const items = EQUIPMENT_CATALOG.filter(filter);

  shopContainer.innerHTML = '';

  if (items.length === 0) {
    shopContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 24px;">该分类暂无装备。</p>';
    return;
  }

  const rarityLabels = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' };
  const rarityColors = {
    common: 'var(--rarity-common)',
    rare: 'var(--rarity-rare)',
    epic: 'var(--rarity-epic)',
    legendary: 'var(--rarity-legendary)'
  };

  items.forEach(item => {
    const isEquipped = Object.values(player.equipment).includes(item.id);
    const isOwned = player.inventory.includes(item.id);
    const canAfford = player.gold >= item.price;
    const levelMet = player.level >= item.requiredLevel;
    const isLegendary = item.rarity === 'legendary';
    // Legendary items with price 0 are boss-only drops
    const isBossOnly = isLegendary && item.price === 0;

    const card = createElement('div', {
      className: `shop-item-card${isLegendary ? ' shop-item-legendary' : ''}`
    });
    card.innerHTML = `
      <div class="shop-item-header">
        <span class="shop-item-icon">${item.icon}</span>
        <span class="shop-item-name" style="color: ${rarityColors[item.rarity]}">${item.name}</span>
        <span class="badge badge-${item.rarity}">${rarityLabels[item.rarity]}</span>
      </div>
      <div class="shop-item-desc">${item.description}</div>
      <div class="shop-item-stats">
        ${Object.entries(item.stats).filter(([_,v]) => v > 0).map(([k,v]) => {
          const statNames = { attack: '攻击', defense: '防御', speed: '速度', maxHp: 'HP', maxMp: 'MP', criticalChance: '暴击率' };
          const value = k === 'criticalChance' ? `+${Math.round(v * 100)}%` : `+${v}`;
          return `<span class="shop-stat">${statNames[k] || k}: ${value}</span>`;
        }).join(' ')}
        ${Object.entries(item.stats).filter(([_,v]) => v < 0).map(([k,v]) => {
          const statNames = { speed: '速度' };
          return `<span class="shop-stat shop-stat-negative">${statNames[k] || k}: ${v}</span>`;
        }).join(' ')}
      </div>
      <div class="shop-item-footer">
        ${isBossOnly
          ? '<span class="shop-boss-only">👑 Boss 专属掉落</span>'
          : `<span class="shop-item-price">💰 ${item.price}</span>`
        }
        ${!levelMet ? `<span class="shop-lock">🔒 需要等级 ${item.requiredLevel}</span>` : ''}
        ${isEquipped ? '<span class="shop-equipped">✅ 已装备</span>' : ''}
        ${isOwned && !isEquipped ? '<span class="shop-owned">🎒 在背包中</span>' : ''}
        ${!isEquipped && !isOwned && levelMet && !isBossOnly ? `
          <button class="btn btn-sm btn-gold buy-btn" data-item-id="${item.id}"
            ${!canAfford ? 'disabled' : ''}>
            ${canAfford ? '购买' : '金币不足'}
          </button>
        ` : ''}
      </div>
    `;
    shopContainer.appendChild(card);
  });

  // Buy button handlers
  shopContainer.addEventListener('click', (e) => {
    const buyBtn = e.target.closest('.buy-btn');
    if (!buyBtn) return;
    const itemId = buyBtn.dataset.itemId;
    const item = EQUIPMENT_CATALOG.find(e => e.id === itemId);
    if (!item) return;

    if (player.spendGold(item.price)) {
      player.addToInventory(item.id);
      gameState.saveGame();
      audio.buy();
      showToast(`购买了 ${item.name}！`, 'success');
      renderScreen('shop');
    } else {
      audio.error();
      showToast('金币不足！', 'error');
    }
  });
}

// ==================== INVENTORY SCREEN ====================

function renderInventoryScreen(container) {
  const p = gameState.player;

  const html = `
    <div class="inventory-screen">
      <h2 class="screen-title">🎒 背包道具</h2>

      <div class="equipment-slots panel" style="margin-bottom: 16px;">
        <h3 style="margin-bottom: 12px;">当前装备</h3>
        <div id="equipped-items"></div>
      </div>

      <div class="inventory-items panel">
        <h3 style="margin-bottom: 12px;">背包 (${p.inventory.length} 件)</h3>
        <div id="inv-items"></div>
        ${p.inventory.length === 0 ? '<p style="color: var(--text-muted); text-align: center;">背包是空的。去商店买些装备吧！</p>' : ''}
      </div>

      <div style="margin-top: 16px; text-align: center;">
        <button id="btn-back-menu" class="btn">返回主菜单</button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Render equipped items
  const equippedContainer = document.getElementById('equipped-items');
  const slots = [
    { key: 'weapon', icon: '🗡️', name: '武器' },
    { key: 'armor', icon: '🛡️', name: '防具' },
    { key: 'accessory', icon: '💍', name: '饰品' }
  ];

  slots.forEach(slot => {
    const eqId = p.equipment[slot.key];
    const eq = eqId ? EQUIPMENT_CATALOG.find(e => e.id === eqId) : null;

    const row = createElement('div', { className: 'equip-slot-row' });
    row.innerHTML = `
      <span>${slot.icon} ${slot.name}:</span>
      <span style="flex:1; margin: 0 12px;">
        ${eq ? `${eq.icon} ${eq.name} <span class="badge badge-${eq.rarity}">${eq.rarity}</span>` : '<span style="color: var(--text-muted);">空</span>'}
      </span>
      ${eq ? `<button class="btn btn-sm unequip-btn" data-slot="${slot.key}">卸下</button>` : ''}
    `;
    equippedContainer.appendChild(row);
  });

  // Render inventory items
  const invContainer = document.getElementById('inv-items');
  p.inventory.forEach(itemId => {
    const item = EQUIPMENT_CATALOG.find(e => e.id === itemId);
    if (!item) return;

    const row = createElement('div', { className: 'inv-item-row' });
    row.innerHTML = `
      <span>${item.icon} ${item.name}</span>
      <span class="badge badge-${item.rarity}" style="margin: 0 8px;">${item.rarity}</span>
      <span style="color: var(--text-secondary); font-size: 0.85rem;">${item.description}</span>
    `;

    if (item.requiredLevel <= p.level) {
      const equipBtn = createElement('button', {
        className: 'btn btn-sm btn-gold equip-btn',
        dataset: { itemId: item.id }
      }, '装备');
      row.appendChild(equipBtn);
    } else {
      const lockSpan = createElement('span', {
        style: 'color: var(--text-muted); font-size: 0.8rem;'
      }, `🔒 需要 Lv.${item.requiredLevel}`);
      row.appendChild(lockSpan);
    }

    invContainer.appendChild(row);
  });

  // Event handlers
  container.addEventListener('click', (e) => {
    const equipBtn = e.target.closest('.equip-btn');
    const unequipBtn = e.target.closest('.unequip-btn');

    if (equipBtn) {
      const itemId = equipBtn.dataset.itemId;
      const success = p.equipItem(itemId);
      if (success !== false) {
        gameState.saveGame();
        // Play equip sound based on item type
        const item = EQUIPMENT_CATALOG.find(e => e.id === itemId);
        if (item) {
          if (item.rarity === 'legendary') audio.equipLegendary();
          else if (item.slot === 'weapon') audio.equipWeapon();
          else if (item.slot === 'armor') audio.equipArmor();
          else if (item.slot === 'accessory') audio.equipAccessory();
        }
        showToast('装备成功！', 'success');
        renderScreen('inventory');
      } else {
        audio.error();
        showToast('装备失败！', 'error');
      }
    }

    if (unequipBtn) {
      const slot = unequipBtn.dataset.slot;
      if (p.unequipItem(slot)) {
        gameState.saveGame();
        audio.click();
        showToast('已卸下装备。', 'info');
        renderScreen('inventory');
      }
    }
  });

  document.getElementById('btn-back-menu').addEventListener('click', () => renderScreen('mainMenu'));
}

// ==================== TEXTBOOK SWITCH SCREEN ====================

function renderTextbookSwitch(container) {
  const p = gameState.player;
  if (!p) {
    renderScreen('title');
    return;
  }

  const textbooks = getAllTextbooks();
  const currentId = p.textbookId || 'wy-7a';

  const html = `
    <div class="textbook-switch-screen">
      <h2 class="screen-title">📚 切换教材</h2>
      <p class="screen-subtitle">选择你正在学习的教材。角色等级、金币和装备保留，但地牢进度按教材独立计算。</p>

      <div class="textbook-list" id="textbook-list">
        ${textbooks.map(tb => `
          <div class="textbook-option-card ${tb.id === currentId ? 'selected current' : ''}"
            data-tb-id="${tb.id}">
            <div class="tb-card-header">
              <span class="tb-card-name">${tb.name}</span>
              ${tb.id === currentId ? '<span class="badge badge-legendary">当前</span>' : ''}
            </div>
            <div class="tb-card-info">
              ${tb.unitCount} 个单元 · ${tb.totalWords} 个单词
            </div>
            ${tb.totalWords === 0 ? '<div class="tb-card-warning">⚠️ 此教材暂无单词数据，切换后地牢为空。</div>' : ''}
            ${tb.id !== currentId ? '<button class="btn btn-primary btn-sm switch-tb-btn" data-tb-id="' + tb.id + '">切换到此教材</button>' : ''}
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 24px; text-align: center;">
        <button id="btn-back-menu" class="btn">返回主菜单</button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Switch button handlers
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.switch-tb-btn');
    if (!btn) return;

    const newTbId = btn.dataset.tbId;
    if (!isValidTextbookId(newTbId)) {
      showToast('无效的教材 ID。', 'error');
      return;
    }

    const units = getUnits(newTbId);
    const result = p.switchTextbook(newTbId, units);
    if (result) {
      gameState.saveGame();
      const meta = getTextbookMeta(newTbId);
      showToast(`已切换到「${meta.name}」！`, 'success');
      renderScreen('mainMenu');
      audio.click();
    } else {
      showToast('切换教材失败。', 'error');
      audio.error();
    }
  });

  document.getElementById('btn-back-menu').addEventListener('click', () => renderScreen('mainMenu'));
}

// ==================== BOSS BATTLE (uses same battle screen) ====================

function renderBossBattleScreen(container, context) {
  // Boss battles use the same battle screen but with boss-specific options
  renderBattleScreen(container, context);
}
