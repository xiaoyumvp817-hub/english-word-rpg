/**
 * Parse word lists extracted from PDF textbooks.
 * Generates JS data files in the format expected by the game.
 *
 * Usage: node tools/parse_words.js
 */

const fs = require('fs');
const path = require('path');

// ========== Configuration for each textbook ==========

const TEXTBOOKS = [
  {
    id: 'wy-7b',
    name: '外研版七年级下册 (2025新课标)',
    shortName: '外研 7B',
    sourceFile: path.join(__dirname, 'words_7b_clean.txt'),
    edition: 'new',  // 'new' = 2024+ curriculum (Unit-based), 'old' = 2011 curriculum (Module-based)
    unitPattern: /^Unit (\d+)$/m,
    // New edition: word /phonetic/ POS. chinese (page_number on next line or same line)
    // Skip lines that are purely page numbers or grammar notes
    skipPatterns: [
      /^[\d]+$/,                    // Standalone page number
      /^Words and expressions/,    // Section header
      /^注：/,                     // Notes
      /^Phonetics/,                // Not word list
      /^Communication bank/,
      /^Language notes/,
      /^Guide to/,
      /^Proper nouns/,
      /^Vocabulary/,
      /^Irregular verbs/,
      /^Names,/,
    ]
  },
  {
    id: 'wy-8a',
    name: '外研版八年级上册',
    shortName: '外研 8A',
    sourceFile: path.join(__dirname, 'words_8a_clean.txt'),
    edition: 'old',
    unitPattern: /^Module (\d+)$/m,
    skipPatterns: [
      /^[\d]+$/,
      /^Words and expressions/,
      /^注：/,
    ]
  },
  {
    id: 'wy-8b',
    name: '外研版八年级下册',
    shortName: '外研 8B',
    sourceFile: path.join(__dirname, 'words_8b_clean.txt'),
    edition: 'old',
    unitPattern: /^Module (\d+)$/m,
    skipPatterns: [
      /^[\d]+$/,
      /^Words and expressions/,
      /^注：/,
    ]
  },
  {
    id: 'wy-9a',
    name: '外研版九年级上册',
    shortName: '外研 9A',
    sourceFile: path.join(__dirname, 'words_9a_clean.txt'),
    edition: 'old',
    unitPattern: /^Module (\d+)$/m,
    skipPatterns: [
      /^[\d]+$/,
      /^Words and expressions/,
      /^注：/,
    ]
  },
  {
    id: 'wy-9b',
    name: '外研版九年级下册',
    shortName: '外研 9B',
    sourceFile: path.join(__dirname, 'words_9b_clean.txt'),
    edition: 'old',
    unitPattern: /^Module (\d+)$/m,
    skipPatterns: [
      /^[\d]+$/,
      /^Words and expressions/,
      /^注：/,
    ]
  },
];

// ========== Parser ==========

/**
 * Recognize whether a line starts a new word entry.
 * New edition: "word /phonetic/ POS. meaning"
 * Old edition: "word /phonetic/ POS. meaning" or "* word /phonetic/..."
 */
function isWordStart(line) {
  // Must contain a phonetic transcription (text between slashes)
  // and look like a dictionary entry
  const cleaned = line.trim();
  if (!cleaned) return false;

  // Skip known non-word lines
  if (/^(Module|Unit)\s+\d+$/i.test(cleaned)) return false;
  if (/^[\d]+$/.test(cleaned)) return false;
  if (/^Words and expressions/.test(cleaned)) return false;
  if (/^(注|Names|Places|Others|Proper|Vocabulary|Irregular|Phonetics|Communication|Language|Guide)/.test(cleaned)) return false;

  // A word entry should have phonetic transcription: /.../
  if (!/\/.*\//.test(cleaned)) return false;

  // Should start with a letter or * (old edition marks some words)
  if (!/^[\*\s]*[a-zA-Z]/.test(cleaned)) return false;

  return true;
}

/**
 * Parse a single word entry block (may span multiple lines).
 * Returns { english, phonetic, partOfSpeech, chinese } or null.
 */
function parseWordEntry(lines, edition) {
  const fullText = lines.join(' ').replace(/\s+/g, ' ').trim();

  // Extract phonetic: /.../
  const phoneticMatch = fullText.match(/\/([^\/]+)\//);
  if (!phoneticMatch) return null;
  const phonetic = '/' + phoneticMatch[1] + '/';

  // Split into parts: before phonetic, after phonetic
  const parts = fullText.split(/\/([^\/]+)\//);
  if (parts.length < 3) return null;

  const beforePhonetic = parts[0].trim();
  const afterPhonetic = parts.slice(2).join('').trim();

  // English word is before the phonetic
  // Remove leading * (old edition marker)
  let english = beforePhonetic.replace(/^\*\s*/, '').trim();

  // Parse POS and Chinese meaning from afterPhonetic
  // Common POS patterns: n., v., adj., adv., prep., conj., pron., det., int., num., art., aux.
  const posPattern = /^(n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|det\.|int\.|num\.|art\.|aux\.|modal v\.|abbr\.)/;

  let partOfSpeech = '';
  let chinese = afterPhonetic;

  // Try to extract POS
  const posMatch = afterPhonetic.match(posPattern);
  if (posMatch) {
    partOfSpeech = posMatch[1];
    chinese = afterPhonetic.slice(posMatch[0].length).trim();
  }

  // Remove trailing page numbers in various formats:
  // Old edition: (2), (3), etc.
  // New edition: just numbers at the end or on next line
  chinese = chinese.replace(/\s*[\(（]?\d+[\)）]?\s*$/, '').trim();

  // Remove trailing numbers that are page references
  // Also handle multi-page references like "2-3"
  chinese = chinese.replace(/\s+\d+(-\d+)?\s*$/, '').trim();

  // Clean up edge cases
  if (!chinese || chinese.length === 0) return null;
  if (!english || english.length === 0) return null;

  // Remove leading/trailing punctuation artifacts
  chinese = chinese.replace(/^[,，、。；：]?\s*/, '').replace(/[,，、。；：]?\s*$/, '');

  // Handle multi-POS: "n. 词；单词；字" - the POS might be in the middle
  // Actually this is already handled by the POS extraction at the start

  return {
    english,
    phonetic,
    partOfSpeech: partOfSpeech || 'n.',
    chinese
  };
}

/**
 * Parse a textbook's word list into structured data.
 */
function parseTextbook(config) {
  console.log(`\n=== Parsing ${config.id}: ${config.name} ===`);

  const content = fs.readFileSync(config.sourceFile, 'utf-8');
  const lines = content.split('\n');

  const units = [];
  const words = [];
  let currentUnit = null;
  let wordBuffer = [];
  let inWordList = false;
  let wordIdCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      // Flush word buffer if we have one
      if (wordBuffer.length > 0) {
        const word = parseWordEntry(wordBuffer, config.edition);
        if (word && currentUnit) {
          wordIdCounter++;
          word.id = `${config.id}-${currentUnit.id}-${String(wordIdCounter).padStart(3, '0')}`;
          word.unitId = currentUnit.id;
          word.unitName = currentUnit.name;
          word.difficulty = determineDifficulty(word.english);
          word.isKey = !word.english.startsWith('*');
          word.category = guessCategory(word.partOfSpeech);
          word.exampleSentence = '';
          words.push(word);
        }
        wordBuffer = [];
      }
      continue;
    }

    // Check for skip patterns
    const shouldSkip = config.skipPatterns.some(p => p.test(trimmed));
    if (shouldSkip && !isWordStart(trimmed)) {
      // Flush buffer
      if (wordBuffer.length > 0) {
        const word = parseWordEntry(wordBuffer, config.edition);
        if (word && currentUnit) {
          wordIdCounter++;
          word.id = `${config.id}-${currentUnit.id}-${String(wordIdCounter).padStart(3, '0')}`;
          word.unitId = currentUnit.id;
          word.unitName = currentUnit.name;
          word.difficulty = determineDifficulty(word.english);
          word.isKey = !wordBuffer.some(l => l.trim().startsWith('*'));
          word.category = guessCategory(word.partOfSpeech);
          word.exampleSentence = '';
          words.push(word);
        }
        wordBuffer = [];
      }
      continue;
    }

    // Check for unit/module boundary
    let unitMatch;
    if (config.edition === 'new') {
      unitMatch = trimmed.match(/^Unit (\d+)$/);
      if (unitMatch) {
        // Flush previous word buffer
        if (wordBuffer.length > 0) {
          const word = parseWordEntry(wordBuffer, config.edition);
          if (word && currentUnit) {
            wordIdCounter++;
            word.id = `${config.id}-${currentUnit.id}-${String(wordIdCounter).padStart(3, '0')}`;
            word.unitId = currentUnit.id;
            word.unitName = currentUnit.name;
            word.difficulty = determineDifficulty(word.english);
            word.isKey = true;
            word.category = guessCategory(word.partOfSpeech);
            word.exampleSentence = '';
            words.push(word);
          }
          wordBuffer = [];
        }

        const unitNum = parseInt(unitMatch[1]);
        currentUnit = {
          id: `${config.id}-u${unitNum}`,
          name: `Unit ${unitNum}`,
          order: unitNum,
          theme: '',
          bossName: '',
          bossEnglishName: '',
          description: ''
        };
        units.push(currentUnit);
        wordIdCounter = 0;
        inWordList = true;
        continue;
      }
    } else {
      // Old edition: Module N
      unitMatch = trimmed.match(/^Module (\d+)$/);
      if (unitMatch) {
        // Check if this is actually a word list section (not grammar section)
        // In old editions, Modules 1-12 appear twice: first in grammar, then in word list
        // We want the second occurrence

        // Flush previous word buffer
        if (wordBuffer.length > 0) {
          const word = parseWordEntry(wordBuffer, config.edition);
          if (word && currentUnit) {
            wordIdCounter++;
            word.id = `${config.id}-${currentUnit.id}-${String(wordIdCounter).padStart(3, '0')}`;
            word.unitId = currentUnit.id;
            word.unitName = currentUnit.name;
            word.difficulty = determineDifficulty(word.english);
            word.isKey = true;
            word.category = guessCategory(word.partOfSpeech);
            word.exampleSentence = '';
            words.push(word);
          }
          wordBuffer = [];
        }

        const moduleNum = parseInt(unitMatch[1]);
        currentUnit = {
          id: `${config.id}-m${moduleNum}`,
          name: `Module ${moduleNum}`,
          order: moduleNum,
          theme: '',
          bossName: '',
          bossEnglishName: '',
          description: ''
        };

        // Only add if this is the word list section (not grammar)
        // Check if previous non-empty line was a word entry
        const prevContent = lines.slice(Math.max(0, i - 5), i).join(' ');
        const isWordSection = /\/.*\//.test(prevContent) ||
                              prevContent.includes('Words and expressions') ||
                              units.some(u => u.order === moduleNum - 1); // Already in word list

        // For old editions, the first "Module 1" might be grammar, second is word list
        // We'll dedupe later
        if (!units.some(u => u.id === currentUnit.id)) {
          units.push(currentUnit);
        }
        wordIdCounter = 0;
        inWordList = true;
        continue;
      }
    }

    // Check if this line starts a word entry
    if (inWordList && isWordStart(trimmed)) {
      // Flush previous word buffer
      if (wordBuffer.length > 0) {
        const word = parseWordEntry(wordBuffer, config.edition);
        if (word && currentUnit) {
          wordIdCounter++;
          word.id = `${config.id}-${currentUnit.id}-${String(wordIdCounter).padStart(3, '0')}`;
          word.unitId = currentUnit.id;
          word.unitName = currentUnit.name;
          word.difficulty = determineDifficulty(word.english);
          word.isKey = true;
          word.category = guessCategory(word.partOfSpeech);
          word.exampleSentence = '';
          words.push(word);
        }
        wordBuffer = [];
      }
      wordBuffer.push(trimmed);
    } else if (wordBuffer.length > 0 && inWordList) {
      // Continue previous word entry (multi-line)
      // Don't add standalone numbers
      if (!/^[\d]+$/.test(trimmed) && trimmed.length > 0) {
        wordBuffer.push(trimmed);
      }
    }
  }

  // Flush final word buffer
  if (wordBuffer.length > 0) {
    const word = parseWordEntry(wordBuffer, config.edition);
    if (word && currentUnit) {
      wordIdCounter++;
      word.id = `${config.id}-${currentUnit.id}-${String(wordIdCounter).padStart(3, '0')}`;
      word.unitId = currentUnit.id;
      word.unitName = currentUnit.name;
      word.difficulty = determineDifficulty(word.english);
      word.isKey = true;
      word.category = guessCategory(word.partOfSpeech);
      word.exampleSentence = '';
      words.push(word);
    }
  }

  console.log(`  Units: ${units.length}, Words: ${words.length}`);

  return { meta: { id: config.id, name: config.name, shortName: config.shortName, unitCount: units.length, totalWords: words.length }, units, words };
}

function determineDifficulty(word) {
  const len = word.length;
  if (len <= 4) return 1;
  if (len <= 7) return 2;
  if (len <= 10) return 3;
  return 4;
}

function guessCategory(pos) {
  if (!pos) return 'other';
  if (pos.startsWith('n')) return 'noun';
  if (pos.startsWith('v') || pos === 'modal v.') return 'verb';
  if (pos.startsWith('adj')) return 'adjective';
  if (pos.startsWith('adv')) return 'adverb';
  if (pos.startsWith('prep')) return 'preposition';
  if (pos.startsWith('conj')) return 'conjunction';
  if (pos.startsWith('pron')) return 'pronoun';
  if (pos.startsWith('det')) return 'determiner';
  return 'other';
}

// ========== Generate JS files ==========

function generateWordFile(parsed) {
  const { meta, units, words } = parsed;

  // Generate unit data with themes and boss info
  const unitThemes = {
    'wy-7b-u1': { theme: '幸福与积极心态', bossName: '悲观之王', bossEnglishName: 'King of Pessimism', description: '学习关于幸福、情感和积极心态的词汇' },
    'wy-7b-u2': { theme: '运动与坚持', bossName: '放弃之影', bossEnglishName: 'Shadow of Giving Up', description: '学习关于运动、坚持和体育精神的词汇' },
    'wy-7b-u3': { theme: '食物与健康', bossName: '垃圾食品怪', bossEnglishName: 'Junk Food Monster', description: '学习关于食物、健康和饮食文化的词汇' },
    'wy-7b-u4': { theme: '娱乐与生活', bossName: '无聊之魔', bossEnglishName: 'Demon of Boredom', description: '学习关于娱乐、休闲和生活方式的词汇' },
    'wy-7b-u5': { theme: '自然与环境', bossName: '污染巨兽', bossEnglishName: 'Pollution Beast', description: '学习关于自然、环境和地理的词汇' },
    'wy-7b-u6': { theme: '旅行与探索', bossName: '迷路之魂', bossEnglishName: 'Lost Soul', description: '学习关于旅行、探索和交通的词汇' },
  };

  const unitsOut = units.map(u => ({
    id: u.id,
    name: u.name,
    order: u.order,
    theme: (unitThemes[u.id] || {}).theme || `Unit ${u.order}`,
    bossName: (unitThemes[u.id] || {}).bossName || 'Boss',
    bossEnglishName: (unitThemes[u.id] || {}).bossEnglishName || 'Boss',
    description: (unitThemes[u.id] || {}).description || ''
  }));

  const lines = [];
  lines.push(`// === ${meta.name} Word Data ===`);
  lines.push(`// Auto-generated from PDF. ${words.length} words across ${units.length} units.`);
  lines.push('');
  lines.push(`export const TEXTBOOK_META = {`);
  lines.push(`  id: "${meta.id}",`);
  lines.push(`  name: "${meta.name}",`);
  lines.push(`  shortName: "${meta.shortName}",`);
  lines.push(`  unitCount: ${units.length},`);
  lines.push(`  totalWords: ${words.length}`);
  lines.push(`};`);
  lines.push('');
  lines.push(`export const UNITS = ${JSON.stringify(unitsOut, null, 2)};`);
  lines.push('');
  lines.push(`export const WORDS = [`);

  for (const w of words) {
    lines.push(`  {`);
    lines.push(`    id: "${w.id}",`);
    lines.push(`    english: "${w.english.replace(/"/g, '\\"')}",`);
    lines.push(`    chinese: "${w.chinese.replace(/"/g, '\\"')}",`);
    lines.push(`    phonetic: "${w.phonetic.replace(/"/g, '\\"')}",`);
    lines.push(`    partOfSpeech: "${w.partOfSpeech}",`);
    lines.push(`    unitId: "${w.unitId}",`);
    lines.push(`    unitName: "${w.unitName}",`);
    lines.push(`    difficulty: ${w.difficulty},`);
    lines.push(`    isKey: ${w.isKey},`);
    lines.push(`    category: "${w.category}",`);
    lines.push(`    exampleSentence: ""`);
    lines.push(`  },`);
  }

  lines.push(`];`);
  lines.push('');

  return lines.join('\n');
}

// ========== Main ==========

function main() {
  console.log('=== Word List Parser ===\n');

  const dataDir = path.join(__dirname, '..', 'data');

  for (const config of TEXTBOOKS) {
    if (!fs.existsSync(config.sourceFile)) {
      console.log(`Skipping ${config.id}: source file not found (${config.sourceFile})`);
      continue;
    }

    const parsed = parseTextbook(config);

    if (parsed.words.length === 0) {
      console.log(`  WARNING: No words parsed for ${config.id}!`);
      continue;
    }

    // Show some samples
    console.log(`  Sample words:`);
    for (const w of parsed.words.slice(0, 5)) {
      console.log(`    ${w.english} ${w.phonetic} ${w.partOfSpeech} ${w.chinese}`);
    }

    // Generate JS file
    const jsContent = generateWordFile(parsed);
    const outputPath = path.join(dataDir, `words-${config.id}.js`);
    fs.writeFileSync(outputPath, jsContent, 'utf-8');
    console.log(`  -> Written: ${outputPath} (${jsContent.length} bytes)`);
  }

  console.log('\n=== Done ===');
}

main();
