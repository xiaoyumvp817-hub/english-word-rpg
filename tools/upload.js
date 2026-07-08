/**
 * Upload word data files to GitHub using Contents API.
 * Handles large files by streaming JSON payloads.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN_HERE';
const REPO = 'xiaoyumvp817-hub/english-word-rpg';
const BASE = 'D:/vscode_projects/English_Games';

// Known SHAs for existing files
const EXISTING_SHAS = {
  'data/textbooks.js': 'fdddc717d82a7546c053ce08d26c542624103ffb',
  'data/words-wy-7b.js': '9c29b1a2709e65d79f675dc8b2dbebc87b67c4da',
};

const FILES = [
  'data/textbooks.js',
  'data/words-wy-7b.js',
  'data/words-wy-8a.js',
  'data/words-wy-8b.js',
  'data/words-wy-9a.js',
  'data/words-wy-9b.js',
];

function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(BASE, filePath);
    const content = fs.readFileSync(fullPath);
    const base64Content = content.toString('base64');
    const sha = EXISTING_SHAS[filePath] || null;

    const payload = JSON.stringify({
      message: `Update ${filePath} — word data for multi-textbook support`,
      content: base64Content,
      ...(sha ? { sha } : {})
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO}/contents/${filePath}`,
      method: 'PUT',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'Node.js'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.sha) {
            console.log(`  OK: ${filePath} (${content.length} bytes)`);
            resolve(json);
          } else {
            console.log(`  ERROR: ${filePath} — ${json.message || data}`);
            reject(new Error(json.message));
          }
        } catch (e) {
          console.log(`  ERROR: ${filePath} — ${data.substring(0, 200)}`);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`  ERROR: ${filePath} — ${e.message}`);
      reject(e);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(`Uploading ${FILES.length} files to ${REPO}...\n`);

  for (const file of FILES) {
    try {
      await uploadFile(file);
    } catch (e) {
      console.error(`Failed to upload ${file}: ${e.message}`);
    }
  }

  console.log('\nDone!');
}

main();
