// === Monster Factory ===
// Creates monster instances from word data.

import { MONSTER_TEMPLATES, BOSS_TEMPLATES } from '../data/monsters.js';
import { randomInt } from './utils.js';

/**
 * Create a normal monster from a word.
 */
export function createMonsterFromWord(word) {
  const diff = Math.min(5, Math.max(1, word.difficulty || 1));
  const template = MONSTER_TEMPLATES[diff];
  const s = template.baseStats;

  return {
    id: `monster-${word.id}`,
    wordId: word.id,
    displayName: `${word.chinese.split('；')[0]}${template.nameZh}`,
    englishName: template.nameEn,
    emoji: template.emoji,
    hp: s.hp + randomInt(-3, 3),
    maxHp: s.hp + randomInt(-3, 3),
    attack: s.attack + randomInt(-1, 1),
    defense: s.defense + randomInt(-1, 1),
    xpReward: s.xp + randomInt(-5, 5),
    goldReward: s.gold + randomInt(-3, 3),
    type: 'normal',
    sprite: template.type,
    word: { ...word }  // Full word object reference
  };
}

/**
 * Create a boss monster for a unit.
 * @param {Array} words - Array of word objects from the unit
 * @param {Object} unit - The unit definition
 */
export function createBossFromUnit(words, unit) {
  const theme = unit.theme || 'default';
  const bossTemplate = BOSS_TEMPLATES[theme] || BOSS_TEMPLATES.default;

  // Calculate boss stats
  const avgHp = words.reduce((sum, w) => {
    const diff = Math.min(5, Math.max(1, w.difficulty || 1));
    return sum + MONSTER_TEMPLATES[diff].baseStats.hp;
  }, 0) / words.length;

  const bossHp = Math.floor(avgHp * words.length * 0.35);
  const avgAttack = words.reduce((sum, w) => {
    const diff = Math.min(5, Math.max(1, w.difficulty || 1));
    return sum + MONSTER_TEMPLATES[diff].baseStats.attack;
  }, 0) / words.length;

  return {
    id: `boss-${unit.id}`,
    wordId: null, // Boss uses a pool of words
    displayName: bossTemplate.nameZh,
    englishName: bossTemplate.englishName,
    emoji: bossTemplate.emoji,
    hp: Math.max(50, bossHp),
    maxHp: Math.max(50, bossHp),
    attack: Math.floor(avgAttack * 1.5),
    defense: 3,
    xpReward: words.length * 20,
    goldReward: words.length * 12,
    type: 'boss',
    sprite: 'boss',
    wordPool: [...words], // All words from the unit
    usedWords: []         // Words already presented (to avoid repeats)
  };
}

/**
 * Adjust monster to player level for balance.
 * Scales monster stats slightly if player is over/under leveled.
 */
export function scaleMonsterToPlayer(monster, playerLevel) {
  const expectedLevel = Math.max(1, Math.floor(monster.word?.difficulty || 1) * 2);
  const diff = playerLevel - expectedLevel;

  if (diff > 2) {
    // Player is overleveled, slightly buff monster
    const scale = 1 + (diff * 0.08);
    monster.hp = Math.floor(monster.hp * scale);
    monster.maxHp = monster.hp;
    monster.attack = Math.floor(monster.attack * scale);
    monster.xpReward = Math.floor(monster.xpReward * scale);
    monster.goldReward = Math.floor(monster.goldReward * scale);
  }

  return monster;
}

/**
 * Get the next word for a boss fight from its word pool.
 * Returns null if all words have been used.
 */
export function getNextBossWord(boss) {
  if (!boss.wordPool || boss.wordPool.length === 0) {
    // Refill from used words if pool is empty
    if (boss.usedWords && boss.usedWords.length > 0) {
      boss.wordPool = [...boss.usedWords];
      boss.usedWords = [];
    } else {
      return null;
    }
  }

  // Pick a random word from the pool
  const idx = Math.floor(Math.random() * boss.wordPool.length);
  const word = boss.wordPool.splice(idx, 1)[0];

  if (!boss.usedWords) boss.usedWords = [];
  boss.usedWords.push(word);

  // Update boss to use this word
  boss.wordId = word.id;
  boss.word = { ...word };

  return word;
}
