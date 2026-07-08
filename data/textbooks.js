// === Textbook Registry ===
// Central lookup for all textbook data. Each textbook is a separate data file.
// To add a new textbook:
//   1. Create data/words-{publisher}-{grade}.js following the same format
//   2. Add its import and entry below
//   3. Done — the new textbook auto-appears in the selection UI

// 小学 (Primary School) — 外研版三年级起点
import { TEXTBOOK_META as meta3a, UNITS as units3a, WORDS as words3a } from './words-wy-3a.js';
import { TEXTBOOK_META as meta3b, UNITS as units3b, WORDS as words3b } from './words-wy-3b.js';
import { TEXTBOOK_META as meta4a, UNITS as units4a, WORDS as words4a } from './words-wy-4a.js';
import { TEXTBOOK_META as meta4b, UNITS as units4b, WORDS as words4b } from './words-wy-4b.js';
import { TEXTBOOK_META as meta5a, UNITS as units5a, WORDS as words5a } from './words-wy-5a.js';
import { TEXTBOOK_META as meta5b, UNITS as units5b, WORDS as words5b } from './words-wy-5b.js';
import { TEXTBOOK_META as meta6a, UNITS as units6a, WORDS as words6a } from './words-wy-6a.js';
import { TEXTBOOK_META as meta6b, UNITS as units6b, WORDS as words6b } from './words-wy-6b.js';
// 初中 (Junior High) — 外研版
import { TEXTBOOK_META as meta7a, UNITS as units7a, WORDS as words7a } from './words-wy-7a.js';
import { TEXTBOOK_META as meta7b, UNITS as units7b, WORDS as words7b } from './words-wy-7b.js';
import { TEXTBOOK_META as meta8a, UNITS as units8a, WORDS as words8a } from './words-wy-8a.js';
import { TEXTBOOK_META as meta8b, UNITS as units8b, WORDS as words8b } from './words-wy-8b.js';
import { TEXTBOOK_META as meta9a, UNITS as units9a, WORDS as words9a } from './words-wy-9a.js';
import { TEXTBOOK_META as meta9b, UNITS as units9b, WORDS as words9b } from './words-wy-9b.js';

const REGISTRY = [
  // 小学 3-6年级 (按年级顺序排列)
  { meta: meta3a, units: units3a, words: words3a },
  { meta: meta3b, units: units3b, words: words3b },
  { meta: meta4a, units: units4a, words: words4a },
  { meta: meta4b, units: units4b, words: words4b },
  { meta: meta5a, units: units5a, words: words5a },
  { meta: meta5b, units: units5b, words: words5b },
  { meta: meta6a, units: units6a, words: words6a },
  { meta: meta6b, units: units6b, words: words6b },
  // 初中 7-9年级
  { meta: meta7a, units: units7a, words: words7a },
  { meta: meta7b, units: units7b, words: words7b },
  { meta: meta8a, units: units8a, words: words8a },
  { meta: meta8b, units: units8b, words: words8b },
  { meta: meta9a, units: units9a, words: words9a },
  { meta: meta9b, units: units9b, words: words9b },
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
