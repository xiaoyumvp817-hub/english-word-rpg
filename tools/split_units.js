/**
 * Split oversized units (>25 words) into sub-units of ~20 words each.
 * Words are sorted alphabetically before chunking.
 *
 * Usage: node tools/split_units.js
 *
 * Outputs:
 *   1. Updated data/words-wy-*.js files
 *   2. tools/unit_split_map.json — mapping from old unit IDs to new sub-unit IDs
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MAP_OUTPUT = path.join(__dirname, 'unit_split_map.json');

const MAX_WORDS_PER_UNIT = 25;
const TARGET_CHUNK_SIZE = 20;

// Files to process (skip primary school files — they're already within limits)
const FILES_TO_PROCESS = [
  'words-wy-5a.js',
  'words-wy-7a.js',
  'words-wy-7b.js',
  'words-wy-8a.js',
  'words-wy-8b.js',
  'words-wy-9a.js',
  'words-wy-9b.js',
];

// ========== Helpers ==========

/**
 * Read and parse an ES module data file using dynamic import.
 */
async function readDataFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  // Use file:// URL for Windows compatibility
  const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
  const mod = await import(fileUrl);
  return {
    meta: mod.TEXTBOOK_META,
    units: mod.UNITS,
    words: mod.WORDS
  };
}

/**
 * Generate letter suffix: 1->a, 2->b, ..., 26->z, 27->aa, etc.
 */
function letterSuffix(n) {
  let result = '';
  while (n > 0) {
    n--;
    result = String.fromCharCode(97 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

/**
 * Sort words alphabetically by english field (case-insensitive).
 */
function sortWordsAlpha(words) {
  return [...words].sort((a, b) => {
    const ea = (a.english || '').toLowerCase().replace(/^[^a-z]+/, '');
    const eb = (b.english || '').toLowerCase().replace(/^[^a-z]+/, '');
    if (ea < eb) return -1;
    if (ea > eb) return 1;
    return 0;
  });
}

/**
 * Split an array into N roughly equal chunks.
 */
function chunkArray(arr, numChunks) {
  const chunks = [];
  const chunkSize = Math.ceil(arr.length / numChunks);
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, Math.min(i + chunkSize, arr.length)));
  }
  return chunks;
}

/**
 * Determine optimal number of chunks to keep each chunk near TARGET_CHUNK_SIZE.
 */
function optimalChunks(total) {
  const exact = Math.round(total / TARGET_CHUNK_SIZE);
  return Math.max(2, exact); // minimum 2 chunks
}

/**
 * Process a single textbook data file.
 * Returns: { textbookId, newUnits, newWords, splitMap }
 *   splitMap: { [oldUnitId]: [newSubUnitId1, newSubUnitId2, ...] }
 */
function processTextbook(data) {
  const { meta, units, words } = data;
  const textbookId = meta.id;
  const splitMap = {};  // oldUnitId -> [newSubUnitId, ...]
  const newUnits = [];
  let newWords = [...words]; // shallow copy — we'll modify unitId/unitName
  let orderCounter = 1;

  for (const unit of units) {
    const unitWords = newWords.filter(w => w.unitId === unit.id);

    if (unitWords.length <= MAX_WORDS_PER_UNIT) {
      // Keep as-is
      const newUnit = { ...unit, order: orderCounter++ };
      newUnits.push(newUnit);
      continue;
    }

    // Need to split
    const sorted = sortWordsAlpha(unitWords);
    const numChunks = optimalChunks(sorted.length);
    const chunks = chunkArray(sorted, numChunks);
    const subUnitIds = [];

    console.log(`  Splitting ${unit.id} (${unitWords.length} words) -> ${numChunks} chunks`);

    // Update theme if it's a last-module dump (huge word count)
    const isDumpModule = unitWords.length > 100;
    const baseTheme = unit.theme || '词汇学习';

    for (let ci = 0; ci < chunks.length; ci++) {
      const suffix = letterSuffix(ci + 1);
      const subId = `${unit.id}${suffix}`;
      subUnitIds.push(subId);

      // Determine chunk letter range for naming
      const firstWord = chunks[ci][0].english;
      const lastWord = chunks[ci][chunks[ci].length - 1].english;
      const rangeHint = chunks.length > 3
        ? ` (${firstWord[0].toUpperCase()}-${lastWord[0].toUpperCase()})`
        : '';

      const partLabel = chunks.length > 1 ? ` Part ${ci + 1}` : '';
      const newUnitName = isDumpModule && chunks.length > 5
        ? `${unit.name} ${firstWord[0].toUpperCase()}-${lastWord[0].toUpperCase()}`
        : `${unit.name}${partLabel}`;

      const newUnit = {
        id: subId,
        name: newUnitName,
        shortName: unit.shortName ? `${unit.shortName}${suffix.toUpperCase()}` : `P${ci + 1}`,
        order: orderCounter++,
        theme: isDumpModule ? `${baseTheme}${rangeHint}` : baseTheme,
        bossName: unit.bossName || '关主',
        bossEnglishName: unit.bossEnglishName || 'Boss',
        description: unit.description || `${unit.name} 词汇${partLabel}`
      };

      newUnits.push(newUnit);

      // Update word entries
      for (const w of chunks[ci]) {
        // Find and update the word in newWords
        const idx = newWords.findIndex(nw => nw.id === w.id);
        if (idx !== -1) {
          newWords[idx] = {
            ...newWords[idx],
            unitId: subId,
            unitName: newUnitName
          };
        }
      }
    }

    splitMap[unit.id] = subUnitIds;
  }

  // Verify no words lost
  const totalInUnits = newUnits.reduce((sum, u) => {
    return sum + newWords.filter(w => w.unitId === u.id).length;
  }, 0);
  if (totalInUnits !== words.length) {
    console.error(`  WARNING: word count mismatch! Original: ${words.length}, New: ${totalInUnits}`);
  }

  return { textbookId, newUnits, newWords, splitMap };
}

/**
 * Generate JS file content from units and words.
 */
function generateJSFile(meta, units, words) {
  const lines = [];
  lines.push(`// === ${meta.name} Word Data ===`);
  lines.push(`// Auto-generated with unit splitting. ${words.length} words across ${units.length} units.`);
  lines.push('');
  lines.push(`export const TEXTBOOK_META = {`);
  lines.push(`  id: "${meta.id}",`);
  lines.push(`  name: "${meta.name}",`);
  lines.push(`  shortName: "${meta.shortName}",`);
  lines.push(`  unitCount: ${units.length},`);
  lines.push(`  totalWords: ${words.length}`);
  lines.push(`};`);
  lines.push('');
  lines.push(`export const UNITS = ${JSON.stringify(units, null, 2)};`);
  lines.push('');
  lines.push(`export const WORDS = [`);

  for (const w of words) {
    lines.push(`  {`);
    lines.push(`    id: "${w.id}",`);
    lines.push(`    english: ${JSON.stringify(w.english)},`);
    lines.push(`    chinese: ${JSON.stringify(w.chinese)},`);
    lines.push(`    phonetic: ${JSON.stringify(w.phonetic || '')},`);
    lines.push(`    partOfSpeech: ${JSON.stringify(w.partOfSpeech || '')},`);
    lines.push(`    unitId: "${w.unitId}",`);
    lines.push(`    unitName: ${JSON.stringify(w.unitName)},`);
    lines.push(`    difficulty: ${w.difficulty || 1},`);
    lines.push(`    isKey: ${w.isKey !== undefined ? w.isKey : true},`);
    lines.push(`    category: ${JSON.stringify(w.category || 'other')},`);
    lines.push(`    exampleSentence: ${JSON.stringify(w.exampleSentence || '')}`);
    lines.push(`  },`);
  }

  lines.push(`];`);
  lines.push('');

  return lines.join('\n');
}

// ========== Main ==========

async function main() {
  console.log('=== Unit Splitter ===\n');
  console.log(`Max words per unit: ${MAX_WORDS_PER_UNIT}, Target chunk: ${TARGET_CHUNK_SIZE}\n`);

  const allSplitMaps = {};
  let totalOldUnits = 0;
  let totalNewUnits = 0;

  for (const filename of FILES_TO_PROCESS) {
    console.log(`Processing ${filename}...`);
    const data = await readDataFile(filename);
    const result = processTextbook(data);

    allSplitMaps[result.textbookId] = result.splitMap;

    const oldCount = data.units.length;
    const newCount = result.newUnits.length;
    totalOldUnits += oldCount;
    totalNewUnits += newCount;

    console.log(`  Units: ${oldCount} -> ${newCount} (${newCount - oldCount > 0 ? '+' + (newCount - oldCount) : 'no change'})`);
    console.log(`  Words: ${data.words.length} (unchanged)`);

    // Generate and write new JS file
    const jsContent = generateJSFile(data.meta, result.newUnits, result.newWords);
    const outputPath = path.join(DATA_DIR, filename);
    fs.writeFileSync(outputPath, jsContent, 'utf-8');
    console.log(`  Written: ${outputPath}\n`);
  }

  // Write split mapping JSON for save migration
  fs.writeFileSync(MAP_OUTPUT, JSON.stringify(allSplitMaps, null, 2), 'utf-8');
  console.log(`Split map written: ${MAP_OUTPUT}`);

  console.log(`\n=== Summary ===`);
  console.log(`Total units: ${totalOldUnits} -> ${totalNewUnits} (+${totalNewUnits - totalOldUnits})`);
  console.log(`Textbooks processed: ${FILES_TO_PROCESS.length}`);

  // Print the map in a compact format
  console.log(`\n=== Unit Split Map ===`);
  for (const [tbId, map] of Object.entries(allSplitMaps)) {
    const entries = Object.entries(map);
    if (entries.length === 0) {
      console.log(`  ${tbId}: no splits`);
    } else {
      console.log(`  ${tbId}:`);
      for (const [oldId, newIds] of entries) {
        console.log(`    ${oldId} -> [${newIds.join(', ')}]`);
      }
    }
  }

  console.log('\n=== Done ===');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
