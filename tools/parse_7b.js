/**
 * Precise word list parser for the new edition (2024+) textbooks.
 * Handles: "word /phonetic/ POS. chinese_meaning [page_number]"
 */
const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'words_7b_clean.txt');
const OUTPUT = path.join(__dirname, '..', 'data', 'words-wy-7b.js');

const content = fs.readFileSync(INPUT, 'utf-8');
const lines = content.split('\n');

// Find the word list section: from "Words and expressions" to "Proper nouns"
let startLine = 0;
let endLine = lines.length;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'Words and expressions' && startLine === 0) {
    startLine = i;
  }
  if (lines[i].trim().startsWith('Proper nouns') && i > startLine && endLine === lines.length) {
    endLine = i;
    break;
  }
}

console.log(`Word list section: lines ${startLine}-${endLine}`);

// Parse units and words
const units = [];
const allWords = [];
let currentUnit = null;
let wordCounter = 0;

// Known word entries have: word /phonetic/ POS. chinese_meaning [page]
// Continuation lines don't have /phonetic/

for (let i = startLine; i < endLine; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Detect unit boundaries
  const unitMatch = line.match(/^Unit (\d+)$/);
  if (unitMatch) {
    // Only process the second occurrence (word list, not grammar)
    // The first occurrence is in the grammar section
    const unitNum = parseInt(unitMatch[1]);
    currentUnit = {
      id: `wy-7b-u${unitNum}`,
      name: `Unit ${unitNum}`,
      order: unitNum,
      theme: '',
      bossName: '',
      bossEnglishName: '',
      description: ''
    };
    wordCounter = 0;
    continue;
  }

  // Skip page headers and non-word content
  if (line === 'Words and expressions') continue;
  if (/^[\d]+$/.test(line)) continue;
  if (/^注：/.test(line)) continue;

  // Check if this is a word entry (has phonetic)
  const phoneticMatch = line.match(/^(\*?\s*[a-zA-Z][a-zA-Z\s'-]*?)\s+(\/[^\/]+\/)\s+(.*)/);
  if (phoneticMatch && currentUnit) {
    let english = phoneticMatch[1].trim().replace(/^\*\s*/, '');
    const phonetic = phoneticMatch[2].trim();
    const rest = phoneticMatch[3].trim();

    // Handle multi-word entries (phrases like "look up")
    // These don't have phonetic - they appear as "phrase"
    // Actually, check if english looks like a real word or continuation

    // Parse POS and Chinese
    // POS is usually at the beginning: n., v., adj., adv., etc.
    let posMatch = rest.match(/^(n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|det\.|int\.|num\.|art\.|aux\.|modal\s*v\.)/);
    let pos = '';
    let chinese = rest;

    if (posMatch) {
      pos = posMatch[1];
      chinese = rest.slice(posMatch[0].length).trim();
    }

    // Clean up: remove page numbers at end
    chinese = chinese.replace(/\s+\d+(-\d+)?$/, '').trim();
    // Remove trailing parentheses with numbers: (2)
    chinese = chinese.replace(/\s*\(\d+\)\s*$/, '').trim();
    // Remove leading punctuation
    chinese = chinese.replace(/^[,，、。；：]?\s*/, '');

    if (!chinese || !english) continue;

    wordCounter++;
    const wordObj = {
      id: `${currentUnit.id}-${String(wordCounter).padStart(3, '0')}`,
      english: english,
      chinese: chinese,
      phonetic: phonetic,
      partOfSpeech: pos || 'n.',
      unitId: currentUnit.id,
      unitName: currentUnit.name,
      difficulty: english.length <= 4 ? 1 : english.length <= 7 ? 2 : english.length <= 10 ? 3 : 4,
      isKey: true,
      category: pos.startsWith('n') ? 'noun' : pos.startsWith('v') || pos === 'modal v.' ? 'verb' : pos.startsWith('adj') ? 'adjective' : pos.startsWith('adv') ? 'adverb' : 'other',
      exampleSentence: ''
    };
    allWords.push(wordObj);
  }
}

// Organize words by unit
const unitMap = new Map();
for (const w of allWords) {
  if (!unitMap.has(w.unitId)) {
    unitMap.set(w.unitId, []);
  }
  unitMap.get(w.unitId).push(w);
}

// Build unit array
const unitThemes = {
  'wy-7b-u1': { theme: '幸福与积极心态', bossName: '悲观之王', bossEnglishName: 'King of Pessimism', description: '学习关于幸福、情感和积极心态的词汇' },
  'wy-7b-u2': { theme: '运动与坚持', bossName: '放弃之影', bossEnglishName: 'Shadow of Giving Up', description: '学习关于运动、坚持和体育精神的词汇' },
  'wy-7b-u3': { theme: '食物与健康', bossName: '垃圾食品怪', bossEnglishName: 'Junk Food Monster', description: '学习关于食物、健康和饮食文化的词汇' },
  'wy-7b-u4': { theme: '娱乐与生活', bossName: '无聊之魔', bossEnglishName: 'Demon of Boredom', description: '学习关于娱乐、休闲和生活方式的词汇' },
  'wy-7b-u5': { theme: '自然与环境', bossName: '污染巨兽', bossEnglishName: 'Pollution Beast', description: '学习关于自然、环境和地理的词汇' },
  'wy-7b-u6': { theme: '旅行与探索', bossName: '迷路之魂', bossEnglishName: 'Lost Soul', description: '学习关于旅行、探索和交通的词汇' },
};

const unitList = [];
for (const [unitId, words] of unitMap) {
  const theme = unitThemes[unitId] || {};
  const order = parseInt(unitId.split('-u')[1]);
  unitList.push({
    id: unitId,
    name: `Unit ${order}`,
    order: order,
    theme: theme.theme || `Unit ${order}`,
    bossName: theme.bossName || 'Boss',
    bossEnglishName: theme.bossEnglishName || 'Boss',
    description: theme.description || ''
  });
}
unitList.sort((a, b) => a.order - b.order);

console.log(`Parsed ${unitList.length} units, ${allWords.length} total words`);
for (const u of unitList) {
  const unitWords = unitMap.get(u.id) || [];
  console.log(`  ${u.name}: ${unitWords.length} words`);
}

// Generate JS file
const lines_out = [];
lines_out.push(`// === 外研版七年级下册 (2025新课标) Word Data ===`);
lines_out.push(`// Extracted from PDF textbook. ${allWords.length} words across ${unitList.length} units.`);
lines_out.push('');
lines_out.push(`export const TEXTBOOK_META = {`);
lines_out.push(`  id: "wy-7b",`);
lines_out.push(`  name: "外研版七年级下册 (2025新课标)",`);
lines_out.push(`  shortName: "外研 7B",`);
lines_out.push(`  unitCount: ${unitList.length},`);
lines_out.push(`  totalWords: ${allWords.length}`);
lines_out.push(`};`);
lines_out.push('');
lines_out.push(`export const UNITS = [`);

for (const u of unitList) {
  lines_out.push(`  {`);
  lines_out.push(`    id: "${u.id}",`);
  lines_out.push(`    name: "${u.name}",`);
  lines_out.push(`    order: ${u.order},`);
  lines_out.push(`    theme: "${u.theme}",`);
  lines_out.push(`    bossName: "${u.bossName}",`);
  lines_out.push(`    bossEnglishName: "${u.bossEnglishName}",`);
  lines_out.push(`    description: "${u.description}"`);
  lines_out.push(`  },`);
}

lines_out.push(`];`);
lines_out.push('');
lines_out.push(`export const WORDS = [`);

for (const w of allWords) {
  lines_out.push(`  {`);
  lines_out.push(`    id: "${w.id}",`);
  lines_out.push(`    english: "${w.english.replace(/"/g, '\\"')}",`);
  lines_out.push(`    chinese: "${w.chinese.replace(/"/g, '\\"')}",`);
  lines_out.push(`    phonetic: "${w.phonetic.replace(/"/g, '\\"')}",`);
  lines_out.push(`    partOfSpeech: "${w.partOfSpeech}",`);
  lines_out.push(`    unitId: "${w.unitId}",`);
  lines_out.push(`    unitName: "${w.unitName}",`);
  lines_out.push(`    difficulty: ${w.difficulty},`);
  lines_out.push(`    isKey: ${w.isKey},`);
  lines_out.push(`    category: "${w.category}",`);
  lines_out.push(`    exampleSentence: ""`);
  lines_out.push(`  },`);
}

lines_out.push(`];`);
lines_out.push('');

fs.writeFileSync(OUTPUT, lines_out.join('\n'), 'utf-8');
console.log(`\nWritten to: ${OUTPUT}`);
console.log(`File size: ${fs.statSync(OUTPUT).size} bytes`);
