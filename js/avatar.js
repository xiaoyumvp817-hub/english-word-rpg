// === Avatar Renderer ===
// Generates CSS pixel-art character HTML based on player level and equipment.

import { EQUIPMENT_CATALOG } from '../data/equipment.js';

/**
 * Get the equipment item currently in a slot.
 */
function getEquippedItem(player, slot) {
  const eqId = player.equipment[slot];
  if (!eqId) return null;
  return EQUIPMENT_CATALOG.find(e => e.id === eqId) || null;
}

/**
 * Determine level class for the aura.
 */
function getLevelClass(level) {
  if (level >= 10) return 'level-epic';
  if (level >= 7) return 'level-high';
  if (level >= 4) return 'level-mid';
  return '';
}

/**
 * Get armor visual class based on equipped armor.
 */
function getArmorClass(player) {
  const armor = getEquippedItem(player, 'armor');
  if (!armor) return '';
  const map = {
    common: 'armor-common',
    rare: 'armor-rare',
    epic: 'armor-epic',
    legendary: 'armor-epic' // legendary also gets epic visuals + extra glow
  };
  return map[armor.rarity] || '';
}

/**
 * Get weapon emoji and glow class.
 */
function getWeaponVisual(player) {
  const weapon = getEquippedItem(player, 'weapon');
  if (!weapon) return { emoji: '✊', glowClass: 'empty' };

  // Map item to visual
  const visualMap = {
    'sword-wooden': { emoji: '🪓', glowClass: '' },
    'sword-short': { emoji: '🗡️', glowClass: '' },
    'sword-iron': { emoji: '🗡️', glowClass: '' },
    'spear-iron': { emoji: '🔱', glowClass: '' },
    'sword-steel': { emoji: '⚔️', glowClass: 'glow-rare' },
    'sword-frost': { emoji: '❄️', glowClass: 'glow-rare' },
    'sword-flame': { emoji: '🔥', glowClass: 'glow-epic' },
    'sword-shadow': { emoji: '🌑', glowClass: 'glow-epic' }
  };

  return visualMap[weapon.id] || { emoji: weapon.icon, glowClass: '' };
}

/**
 * Get accessory visual effect.
 */
function getAccessoryVisual(player) {
  const acc = getEquippedItem(player, 'accessory');
  if (!acc) return null;

  const visualMap = {
    'ring-iron': { emoji: '💍', cssClass: 'acc-ring' },
    'charm-lucky': { emoji: '🍀', cssClass: 'acc-ring' },
    'ring-silver': { emoji: '💍', cssClass: 'acc-ring-rare' },
    'amulet-power': { emoji: '💪', cssClass: 'acc-ring' },
    'book-wisdom': { emoji: '📖', cssClass: 'acc-stone' },
    'stone-focus': { emoji: '🔮', cssClass: 'acc-stone' },
    'necklace-dragonfang': { emoji: '🦷', cssClass: 'acc-ring-rare' },
    'boots-swift': { emoji: '⚡', cssClass: 'acc-boots' }
  };

  return visualMap[acc.id] || null;
}

/**
 * Get face emoji based on level.
 */
function getFaceEmoji(level) {
  if (level >= 10) return '🤩';
  if (level >= 7) return '😎';
  if (level >= 4) return '🙂';
  return '😊';
}

/**
 * Generate the complete avatar HTML.
 * @param {Object} player - The player instance
 * @param {string} size - 'normal' | 'compact' | 'large'
 * @returns {string} HTML string
 */
export function renderAvatar(player, size = 'normal') {
  const level = player.level;
  const levelClass = getLevelClass(level);
  const armorClass = getArmorClass(player);
  const weapon = getWeaponVisual(player);
  const accessory = getAccessoryVisual(player);

  // Build avatar HTML
  const parts = [];

  // Container
  parts.push('<div class="avatar-container">');

  // Aura glow
  if (levelClass) {
    parts.push(`<div class="avatar-aura ${levelClass}"></div>`);
  }

  // Figure
  parts.push(`<div class="avatar-figure level-${Math.min(level, 10)}">`);

  // Hair
  parts.push('<div class="avatar-hair"></div>');

  // Head
  parts.push('<div class="avatar-head"></div>');

  // Body (armor color)
  parts.push(`<div class="avatar-body ${armorClass}"></div>`);

  // Arms
  parts.push('<div class="avatar-arm avatar-arm-left"></div>');
  parts.push('<div class="avatar-arm avatar-arm-right"></div>');

  // Legs
  parts.push('<div class="avatar-leg avatar-leg-left"></div>');
  parts.push('<div class="avatar-leg avatar-leg-right"></div>');

  // Boots
  parts.push('<div class="avatar-boot avatar-boot-left"></div>');
  parts.push('<div class="avatar-boot avatar-boot-right"></div>');

  // Weapon
  parts.push(`<div class="avatar-weapon ${weapon.glowClass}">${weapon.emoji}</div>`);

  // Accessory effect
  if (accessory) {
    parts.push(`<div class="avatar-accessory ${accessory.cssClass}">${accessory.emoji}</div>`);
  }

  // Close figure
  parts.push('</div>');

  // Close container
  parts.push('</div>');

  return parts.join('\n');
}

/**
 * Generate compact avatar for battle screen or small previews.
 */
export function renderAvatarCompact(player) {
  return renderAvatar(player, 'compact');
}

/**
 * Generate large avatar for character screen.
 */
export function renderAvatarLarge(player) {
  return renderAvatar(player, 'large');
}
