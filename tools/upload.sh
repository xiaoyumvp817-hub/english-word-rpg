#!/bin/bash
# Upload word data files to GitHub Pages
REPO="xiaoyumvp817-hub/english-word-rpg"
TOKEN="${GITHUB_TOKEN:-YOUR_GITHUB_TOKEN_HERE}"
BASE="D:/vscode_projects/English_Games"

upload_file() {
  local path="$1"
  local sha="$2"
  local file_path="$BASE/$path"

  local content=$(base64 -w 0 "$file_path")
  local size=$(wc -c < "$file_path")

  echo "Uploading $path ($size bytes)..."

  if [ -n "$sha" ]; then
    # Update existing file
    local response=$(curl -s -X PUT \
      -H "Authorization: token $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"message\":\"Add $path with word data for multi-textbook support\",\"content\":\"$content\",\"sha\":\"$sha\"}" \
      "https://api.github.com/repos/$REPO/contents/$path")
  else
    # Create new file
    local response=$(curl -s -X PUT \
      -H "Authorization: token $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"message\":\"Add $path with word data for multi-textbook support\",\"content\":\"$content\"}" \
      "https://api.github.com/repos/$REPO/contents/$path")
  fi

  if echo "$response" | grep -q '"sha"'; then
    echo "  OK: $path"
  else
    echo "  ERROR: $path"
    echo "$response" | head -5
  fi
}

# Upload updated files (with SHA)
upload_file "data/textbooks.js" "fdddc717d82a7546c053ce08d26c542624103ffb"
upload_file "data/words-wy-7b.js" "9c29b1a2709e65d79f675dc8b2dbebc87b67c4da"

# Upload new files (no SHA)
upload_file "data/words-wy-8a.js" ""
upload_file "data/words-wy-8b.js" ""
upload_file "data/words-wy-9a.js" ""
upload_file "data/words-wy-9b.js" ""

echo "Done!"
