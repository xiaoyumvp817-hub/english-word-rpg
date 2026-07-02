// === Textbook Registry ===
// Central lookup for all textbook data. Each textbook is a separate data file.
// To add a new textbook:
//   1. Create data/words-{publisher}-{grade}.js following the same format
//   2. Add its import and entry below
//   3. Done — the new textbook auto-appears in the selection UI

import { TEXTBOOK_META as meta7a, UNITS as units7a, WORDS as words7a } from './words-wy-7a.js';
import { TEXTBOOK_META as meta7b, UNITS as units7b, WORDS as words7b } from './words-wy-7b.js';
// ADD NEW TEXTBOOKS HERE:
// import { TEXTBOOK_META as meta8a, UNITS as units8a, WORDS as words8a } from './words-wy-8a.js';

const REGISTRY = [
  { meta: meta7a, units: units7a, words: words7a },
  { meta: meta7b, units: units7b, words: words7b },
  // ADD NEW TEXTBOOKS HERE:
  // { meta: meta8a, units: units8a, words: words8a },
];

// Build lookup map
const _byId = new Map();
REGISTRY.forEach(t => {
  // Ensure totalWords is accurate
  t.meta.totalWords = t.words.length;
  _byId.set(t.meta.id, t);
});

/** Default textbook ID — used as fallback */
export const DEFAULT_TEXTBOOK_ID = 'wy-7a';

/**
 * Get metadata for all available textbooks.
 * @returns {Array<{id, name, shortName, unitCount, totalWords}>}
 */
export function getAllTextbooks() {
  return REGISTRY.map(t => ({ ...t.meta }));
}

/**
 * Get metadata for a specific textbook.
 * @param {string} textbookId
 * @returns {object|null}
 */
export function getTextbookMeta(textbookId) {
  const t = _byId.get(textbookId);
  return t ? { ...t.meta } : null;
}

/**
 * Get unit definitions for a specific textbook.
 * @param {string} textbookId
 * @returns {Array}
 */
export function getUnits(textbookId) {
  const t = _byId.get(textbookId);
  return t ? t.units : [];
}

/**
 * Get word entries for a specific textbook.
 * @param {string} textbookId
 * @returns {Array}
 */
export function getWords(textbookId) {
  const t = _byId.get(textbookId);
  return t ? t.words : [];
}

/**
 * Get full textbook data (meta + units + words) in one call.
 * Falls back to default textbook if the requested one doesn't exist.
 * @param {string} textbookId
 * @returns {{meta, units, words}}
 */
export function getTextbookData(textbookId) {
  const t = _byId.get(textbookId) || _byId.get(DEFAULT_TEXTBOOK_ID);
  return {
    meta: { ...t.meta },
    units: t.units,
    words: t.words
  };
}

/**
 * Check if a textbook ID is valid.
 * @param {string} id
 * @returns {boolean}
 */
export function isValidTextbookId(id) {
  return _byId.has(id);
}
