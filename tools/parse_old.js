/**
 * Parse old edition (2011 curriculum) word lists.
 * Phonetic symbols are garbled due to font encoding, so we skip them.
 * English words and Chinese meanings are correctly extracted.
 */
const fs = require('fs');
const path = require('path');

const TEXTBOOKS = [
  { id: 'wy-8a', name: '外研版八年级上册', shortName: '外研 8A', file: 'words_8a_clean.txt', startMarker: 'Module 1', endMarker: 'Names and addresses', unitPattern: /^Module (\d+)$/ },
  { id: 'wy-8b', name: '外研版八年级下册', shortName: '外研 8B', file: 'words_8b_clean.txt', startMarker: 'Module 1', endMarker: 'Names and addresses', unitPattern: /^Module (\d+)$/ },
  { id: 'wy-9a', name: '外研版九年级上册', shortName: '外研 9A', file: 'words_9a_clean.txt', startMarker: 'Module 1', endMarker: 'Names and addresses', unitPattern: /^Module (\d+)$/ },
  { id: 'wy-9b', name: '外研版九年级下册', shortName: '外研 9B', file: 'words_9b_clean.txt', startMarker: 'Module 1', endMarker: 'Names and addresses', unitPattern: /^Module (\d+)$/ },
];

for (const config of TEXTBOOKS) {
  console.log(`\n=== Parsing ${config.id}: ${config.name} ===`);
  const inputPath = path.join(__dirname, config.file);

  if (!fs.existsSync(inputPath)) {
    console.log(`  SKIP: File not found: ${inputPath}`);
    continue;
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n');

  // Find the word list section (second occurrence of unit pattern)
  // In old editions, grammar modules come first, then word list modules
  let inWordList = false;
  let modulesSeen = new Set();
  const units = [];
  const allWords = [];
  let currentUnit = null;
  let wordCounter = 0;
  let prevLineWasWord = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { prevLineWasWord = false; continue; }

    // Check for start of word list
    if (line === 'Words and expressions' || line === 'W ords and expressions') {
      inWordList = true;
      continue;
    }

    // Check for end of word list
    if (config.endMarker && line.includes(config.endMarker)) {
      if (inWordList) break;
    }

    // Check for module boundary
    const unitMatch = line.match(config.unitPattern);
    if (unitMatch) {
      const moduleNum = parseInt(unitMatch[1]);

      // If we've seen this module number before, OR if it's Module 1
      // (grammar sections start from Module 7+, word lists start from Module 1)
      if (modulesSeen.has(moduleNum) || moduleNum === 1) {
        inWordList = true;
      }

      if (inWordList) {
        currentUnit = {
          id: `${config.id}-m${moduleNum}`,
          name: `Module ${moduleNum}`,
          order: moduleNum
        };
        if (!units.some(u => u.id === currentUnit.id)) {
          units.push(currentUnit);
        }
        wordCounter = 0;
      }

      modulesSeen.add(moduleNum);
      prevLineWasWord = false;
      continue;
    }

    if (!inWordList || !currentUnit) continue;

    // Parse word entry: word /garbled_phonetic/ POS. chinese_meaning (page)
    const wordMatch = line.match(/^(\*?\s*[a-zA-Z][\w\s'-]*?)\s+\/[^\/]*\/\s+(.*)/);
    if (wordMatch) {
      let english = wordMatch[1].trim().replace(/^\*\s*/, '');

      // Skip if it looks like a phonetic guide or non-word
      if (english.length < 2) continue;
      if (/^(smelt|smelled)$/i.test(english)) continue; // verb form, not a vocab word

      const rest = wordMatch[2].trim();

      // Parse POS
      let pos = '';
      let chinese = rest;
      const posMatch = rest.match(/^(n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|det\.|int\.|num\.|art\.|aux\.|modal\s*v\.)/);
      if (posMatch) {
        pos = posMatch[1];
        chinese = rest.slice(posMatch[0].length).trim();
      }

      // Clean up: remove page numbers in parentheses
      chinese = chinese.replace(/\s*\(\d+(-\d+)?\)\s*$/, '').trim();
      chinese = chinese.replace(/\s+\d+\s*$/, '').trim();
      chinese = chinese.replace(/^[,，、。；：]?\s*/, '');
      chinese = chinese.replace(/[,，、。；：]?\s*$/, '');

      if (!chinese || chinese.length === 0) continue;

      // Handle multi-POS (adj./n. etc.)
      // Just take the first POS
      if (pos && pos.includes('adj')) pos = 'adj.';

      wordCounter++;
      const wordObj = {
        id: `${currentUnit.id}-${String(wordCounter).padStart(3, '0')}`,
        english: english,
        chinese: chinese,
        phonetic: '',  // Old edition phonetics are garbled
        partOfSpeech: pos || 'n.',
        unitId: currentUnit.id,
        unitName: currentUnit.name,
        difficulty: english.length <= 4 ? 1 : english.length <= 7 ? 2 : english.length <= 10 ? 3 : 4,
        isKey: true,
        category: pos.startsWith('n') ? 'noun' : pos.startsWith('v') || pos === 'modal v.' ? 'verb' : pos.startsWith('adj') ? 'adjective' : pos.startsWith('adv') ? 'adverb' : 'other',
        exampleSentence: ''
      };

      // Avoid duplicates
      const isDuplicate = allWords.some(w => w.english === wordObj.english && w.unitId === wordObj.unitId);
      if (!isDuplicate) {
        allWords.push(wordObj);
      }
      prevLineWasWord = true;
    } else if (prevLineWasWord && line.length > 0 && !/^\d+$/.test(line)) {
      // Continuation of previous word's Chinese meaning
      const lastWord = allWords[allWords.length - 1];
      if (lastWord && !line.includes('/')) {
        lastWord.chinese += line.replace(/\s*\(\d+\)\s*$/, '').replace(/[,，、。；：]?\s*$/, '');
      }
      prevLineWasWord = false;
    } else {
      prevLineWasWord = false;
    }
  }

  console.log(`  Units: ${units.length}, Words: ${allWords.length}`);
  if (allWords.length > 0) {
    console.log(`  Sample: ${allWords.slice(0, 5).map(w => w.english).join(', ')}`);
  }

  // Generate JS file
  const lines_out = [];
  lines_out.push(`// === ${config.name} Word Data ===`);
  lines_out.push(`// Extracted from old edition PDF. Phonetic symbols are not available (font encoding issues).`);
  lines_out.push(`// Word count: ${allWords.length} across ${units.length} modules.`);
  lines_out.push(`// TODO: Update with new edition (2025+) data when available.`);
  lines_out.push('');
  lines_out.push(`export const TEXTBOOK_META = {`);
  lines_out.push(`  id: "${config.id}",`);
  lines_out.push(`  name: "${config.name}",`);
  lines_out.push(`  shortName: "${config.shortName}",`);
  lines_out.push(`  unitCount: ${units.length},`);
  lines_out.push(`  totalWords: ${allWords.length}`);
  lines_out.push(`};`);
  lines_out.push('');

  const unitThemes = {};
  const themes = ['探索与学习', '运动与健康', '科技与未来', '文化与交流', '自然与环境', '旅行与冒险', '故事与传说', '艺术与创造', '社会与生活', '历史与人物', '友谊与情感', '梦想与追求'];
  for (let j = 0; j < units.length; j++) {
    unitThemes[units[j].id] = themes[j % themes.length];
  }

  lines_out.push(`export const UNITS = [`);
  for (const u of units.sort((a, b) => a.order - b.order)) {
    lines_out.push(`  {`);
    lines_out.push(`    id: "${u.id}",`);
    lines_out.push(`    name: "${u.name}",`);
    lines_out.push(`    order: ${u.order},`);
    lines_out.push(`    theme: "${unitThemes[u.id] || '学习与成长'}",`);
    lines_out.push(`    bossName: "关主",`);
    lines_out.push(`    bossEnglishName: "Boss",`);
    lines_out.push(`    description: "${config.shortName} ${u.name} 词汇"`);
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
    lines_out.push(`    phonetic: "",`);
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

  const outputPath = path.join(__dirname, '..', 'data', `words-${config.id}.js`);
  fs.writeFileSync(outputPath, lines_out.join('\n'), 'utf-8');
  console.log(`  -> Written: ${outputPath}`);
}

console.log('\n=== All old editions parsed ===');
