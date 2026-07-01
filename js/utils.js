// === Utility Functions ===

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max
 */
export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Deep clone an object (JSON-safe)
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Format a number with commas
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Calculate XP needed for the next level
 * Formula: level * 100 + level^2 * 25
 */
export function xpForLevel(level) {
  return level * 100 + level * level * 25;
}

/**
 * Calculate base stats for a given level
 */
export function baseStatsForLevel(level) {
  return {
    maxHp: 100 + (level - 1) * 15,
    maxMp: 50 + (level - 1) * 5,
    attack: 10 + (level - 1) * 2,
    defense: 5 + (level - 1) * 1,
    speed: 5 + (level - 1) * 1,
  };
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get ISO timestamp string
 */
export function nowISO() {
  return new Date().toISOString();
}

/**
 * Calculate time difference in days between two date strings
 */
export function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.abs((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Shuffle an array (Fisher-Yates)
 */
export function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Calculate difficulty for a word based on length and complexity
 */
export function calculateWordDifficulty(english) {
  const len = english.length;
  // Check for spaces (phrases) or hyphens
  const hasSpace = english.includes(' ');
  const hasHyphen = english.includes('-');
  const hasApostrophe = english.includes("'");

  let score = 0;

  if (len <= 3) score = 1;
  else if (len <= 4) score = 1;
  else if (len <= 6) score = 2;
  else if (len <= 8) score = 3;
  else if (len <= 10) score = 4;
  else score = 5;

  // Boost difficulty for phrases and special characters
  if (hasSpace) score = Math.min(5, score + 1);
  if (hasHyphen) score = Math.min(5, score + 1);
  if (hasApostrophe) score = Math.min(5, score + 1);

  return score;
}

/**
 * Safe localStorage set with quota error handling
 */
export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.error('localStorage is full!');
      return false;
    }
    throw e;
  }
}

/**
 * Safe localStorage get with JSON parse error handling
 */
export function safeGetItem(key) {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse localStorage data:', e);
    return null;
  }
}
