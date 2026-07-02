// === Application Entry Point ===
// Initializes the game, sets up screen routing, and handles global events.

import { gameState } from './state.js';
import { renderScreen } from './renderer.js';

/**
 * Initialize the application.
 */
function init() {
  // Check for existing save
  const hasSave = gameState.hasSave();

  if (hasSave) {
    // Auto-load: if there's a save, go to "continue" state
    // but still show title screen first
    gameState.currentScreen = 'title';
  } else {
    gameState.currentScreen = 'title';
  }

  // Render initial screen
  renderScreen(gameState.currentScreen);

  // Listen for navigation events
  document.addEventListener('state:navigate', (e) => {
    renderScreen(e.detail.screen, e.detail.context);
  });

  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape key: go back or flee
    if (e.key === 'Escape') {
      if (gameState.currentScreen === 'battle') {
        // Battle flee is handled in the battle renderer
        const fleeBtn = document.getElementById('btn-flee');
        if (fleeBtn) fleeBtn.click();
      } else if (gameState.currentScreen === 'unitOverview') {
        renderScreen('dungeon');
      } else if (gameState.currentScreen === 'dungeon' ||
                 gameState.currentScreen === 'character' ||
                 gameState.currentScreen === 'shop' ||
                 gameState.currentScreen === 'inventory') {
        renderScreen('mainMenu');
      }
    }
  });

  // Handle page unload - save game
  window.addEventListener('beforeunload', () => {
    if (gameState.player) {
      gameState.saveGame();
    }
    // Clean up any active battle
    const battleScreen = document.querySelector('.battle-screen');
    if (battleScreen) {
      // Game state will save player on next load
    }
  });

  console.log('⚔️ 英语单词大冒险 RPG 初始化完成！');
  console.log(`📁 存档状态: ${hasSave ? '已找到存档' : '新冒险者'}`);
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
