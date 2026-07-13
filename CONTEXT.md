# English Word RPG — Domain Glossary

## Core Entities

| Term | Definition |
|------|-----------|
| **Player** | The user's avatar. Has stats (HP, MP, attack, defense, speed), level, XP, gold, equipment, and vocabulary-learning progress. |
| **Monster** | Enemy spawned from a vocabulary Word. Has HP, attack, defense, rewards, and a type (`normal` or `boss`). |
| **Boss** | Special monster (`type: 'boss'`) guarding the end of a Unit. Uses a `wordPool` (all unit words). Attacks every 2 turns regardless of answer correctness. |
| **Word** | A vocabulary entry: `english`, `chinese`, `phonetic`, `difficulty` (1-5). Assigned to one Unit via `unitId`. |
| **Unit** | A subdivision of a Textbook, grouping related Words by theme. Has `order`, `theme`, optional boss config. |
| **Textbook** | A complete vocabulary curriculum (e.g., 三年级上册). Contains Units and Words. 14 textbooks total (3A–9B). |
| **Equipment** | Items with `slot` (weapon/armor/accessory), `rarity` (common/rare/epic/legendary), stat bonuses, price. |
| **GameState** | Singleton: Player, current screen, battle/dungeon context, settings, notifications. |
| **BattleController** | Turn-based state machine: answer validation, damage, timer, streak, boss logic. |

## Battle States

| State | Description |
|-------|-------------|
| **INIT** | Battle constructed, not started |
| **PLAYER_TURN** | Waiting for answer input, timer running |
| **RESOLVING** | Answer submitted, damage calculating |
| **CHECK_END** | Checking victory/defeat conditions |
| **VICTORY** | Monster defeated, rewards calculated |
| **DEFEAT** | Player HP reached 0, gold penalty |
| **FLED** | Player escaped, gold penalty |

## Word Mastery States

| State | Description |
|-------|-------------|
| **UNSEEN** | Never encountered |
| **SEEN** | Attempted but never correct |
| **LEARNING** | Correct 1-2 times, or not yet spaced |
| **MASTERED** | Correct ≥3 times, spaced ≥1 day |

## Key Actions

- **submitAnswer** — Player types English word → validated against monster's word
- **critical hit (crit)** — Speed-based bonus damage, faster answer = higher chance
- **streak** — Consecutive correct answers, +10% XP per 3 streak
- **speedTier** — UI feedback: `godlike` (≥80% time), `fast` (≥50%)

## Game Screens

| Screen | Purpose |
|--------|---------|
| **title** | Landing page, new/continue game, textbook select |
| **mainMenu** | Central hub: Dungeon, Shop, Character, Inventory |
| **dungeon** | Unit list with completion status |
| **unitOverview** | Single unit detail, word-monster list, start battle |
| **battle** | Main gameplay: monster, word prompt, input, timer |
| **victory** | Rewards display, level-up, continue/return |
| **defeat** | Penalty display, retry/return |
| **character** | Stats, equipment, textbook management |
| **shop** | Buy equipment by category |
| **inventory** | Manage owned items, equip/unequip/sell |
