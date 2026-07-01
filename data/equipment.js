// === Equipment Catalog ===

export const EQUIPMENT_CATALOG = [
  // === Weapons ===
  {
    id: "sword-wooden",
    name: "木剑",
    type: "weapon",
    slot: "weapon",
    rarity: "common",
    stats: { attack: 3, defense: 0, speed: 0, maxHp: 0, maxMp: 0, criticalChance: 0 },
    price: 30,
    sellPrice: 10,
    description: "新手冒险者的标配武器，+3 攻击力",
    icon: "🪓",
    requiredLevel: 1
  },
  {
    id: "sword-iron",
    name: "铁剑",
    type: "weapon",
    slot: "weapon",
    rarity: "common",
    stats: { attack: 5, defense: 0, speed: 0, maxHp: 0, maxMp: 0, criticalChance: 0 },
    price: 80,
    sellPrice: 25,
    description: "一把普通的铁剑，+5 攻击力",
    icon: "🗡️",
    requiredLevel: 3
  },
  {
    id: "sword-steel",
    name: "钢剑",
    type: "weapon",
    slot: "weapon",
    rarity: "rare",
    stats: { attack: 8, defense: 0, speed: 1, maxHp: 0, maxMp: 0, criticalChance: 0.02 },
    price: 200,
    sellPrice: 70,
    description: "精钢锻造的利剑，+8 攻击力 +1 速度",
    icon: "⚔️",
    requiredLevel: 5
  },
  {
    id: "sword-flame",
    name: "烈焰之剑",
    type: "weapon",
    slot: "weapon",
    rarity: "epic",
    stats: { attack: 12, defense: 0, speed: 2, maxHp: 0, maxMp: 0, criticalChance: 0.04 },
    price: 500,
    sellPrice: 180,
    description: "蕴含火焰力量的魔剑，+12 攻击力 +2 速度",
    icon: "🔥",
    requiredLevel: 8
  },
  {
    id: "sword-short",
    name: "短剑",
    type: "weapon",
    slot: "weapon",
    rarity: "common",
    stats: { attack: 4, defense: 0, speed: 1, maxHp: 0, maxMp: 0, criticalChance: 0 },
    price: 55,
    sellPrice: 18,
    description: "轻巧灵活的短剑，+4 攻击力 +1 速度",
    icon: "🗡️",
    requiredLevel: 2
  },
  {
    id: "spear-iron",
    name: "长矛",
    type: "weapon",
    slot: "weapon",
    rarity: "common",
    stats: { attack: 7, defense: 0, speed: -1, maxHp: 0, maxMp: 0, criticalChance: 0 },
    price: 120,
    sellPrice: 40,
    description: "攻击距离远但稍显笨重，+7 攻击力 -1 速度",
    icon: "🔱",
    requiredLevel: 4
  },
  {
    id: "sword-frost",
    name: "冰霜之刃",
    type: "weapon",
    slot: "weapon",
    rarity: "rare",
    stats: { attack: 10, defense: 0, speed: 2, maxHp: 0, maxMp: 0, criticalChance: 0.02 },
    price: 350,
    sellPrice: 120,
    description: "寒气逼人的魔法剑刃，+10 攻击力 +2 速度",
    icon: "❄️",
    requiredLevel: 7
  },
  {
    id: "sword-shadow",
    name: "暗影之刃",
    type: "weapon",
    slot: "weapon",
    rarity: "legendary",
    stats: { attack: 16, defense: 0, speed: 3, maxHp: 0, maxMp: 0, criticalChance: 0.06 },
    price: 0,
    sellPrice: 350,
    description: "传说中的暗影神器，仅能从 Boss 处获得。+16 攻击力 +3 速度 +6% 暴击",
    icon: "🌑",
    requiredLevel: 10
  },

  // === Armor ===
  {
    id: "armor-cloth",
    name: "布甲",
    type: "armor",
    slot: "armor",
    rarity: "common",
    stats: { attack: 0, defense: 2, speed: 0, maxHp: 10, maxMp: 0, criticalChance: 0 },
    price: 40,
    sellPrice: 15,
    description: "简单的布制护甲，+2 防御 +10 HP",
    icon: "🛡️",
    requiredLevel: 1
  },
  {
    id: "armor-leather",
    name: "皮甲",
    type: "armor",
    slot: "armor",
    rarity: "common",
    stats: { attack: 0, defense: 4, speed: 0, maxHp: 20, maxMp: 0, criticalChance: 0 },
    price: 100,
    sellPrice: 35,
    description: "轻便的皮制护甲，+4 防御 +20 HP",
    icon: "🛡️",
    requiredLevel: 3
  },
  {
    id: "armor-chain",
    name: "链甲",
    type: "armor",
    slot: "armor",
    rarity: "rare",
    stats: { attack: 0, defense: 6, speed: -1, maxHp: 35, maxMp: 0, criticalChance: 0 },
    price: 250,
    sellPrice: 85,
    description: "坚固的铁环链甲，+6 防御 +35 HP",
    icon: "🛡️",
    requiredLevel: 5
  },
  {
    id: "armor-dragon",
    name: "龙鳞铠",
    type: "armor",
    slot: "armor",
    rarity: "epic",
    stats: { attack: 0, defense: 9, speed: 0, maxHp: 50, maxMp: 0, criticalChance: 0 },
    price: 600,
    sellPrice: 200,
    description: "传说龙鳞打造的铠甲，+9 防御 +50 HP",
    icon: "🛡️",
    requiredLevel: 8
  },
  {
    id: "shield-wood",
    name: "木盾",
    type: "armor",
    slot: "armor",
    rarity: "common",
    stats: { attack: 0, defense: 3, speed: 0, maxHp: 5, maxMp: 0, criticalChance: 0 },
    price: 60,
    sellPrice: 20,
    description: "轻便的木制小盾，+3 防御 +5 HP",
    icon: "🪵",
    requiredLevel: 2
  },
  {
    id: "shield-iron",
    name: "铁盾",
    type: "armor",
    slot: "armor",
    rarity: "common",
    stats: { attack: 0, defense: 5, speed: 0, maxHp: 15, maxMp: 0, criticalChance: 0 },
    price: 150,
    sellPrice: 50,
    description: "坚固的铁制盾牌，+5 防御 +15 HP",
    icon: "🔩",
    requiredLevel: 4
  },
  {
    id: "armor-mithril",
    name: "秘银铠",
    type: "armor",
    slot: "armor",
    rarity: "rare",
    stats: { attack: 0, defense: 7, speed: 0, maxHp: 40, maxMp: 0, criticalChance: 0 },
    price: 400,
    sellPrice: 140,
    description: "银光闪耀的秘银铠甲，+7 防御 +40 HP",
    icon: "✨",
    requiredLevel: 7
  },
  {
    id: "cloak-night",
    name: "暗夜斗篷",
    type: "armor",
    slot: "armor",
    rarity: "legendary",
    stats: { attack: 0, defense: 11, speed: 2, maxHp: 60, maxMp: 0, criticalChance: 0 },
    price: 0,
    sellPrice: 380,
    description: "暗夜女神编织的神器斗篷，仅能从 Boss 处获得。+11 防御 +60 HP +2 速度",
    icon: "🌌",
    requiredLevel: 10
  },

  // === Accessories ===
  {
    id: "ring-iron",
    name: "铁戒",
    type: "accessory",
    slot: "accessory",
    rarity: "common",
    stats: { attack: 0, defense: 0, speed: 2, maxHp: 0, maxMp: 0, criticalChance: 0 },
    price: 50,
    sellPrice: 15,
    description: "一枚普通的铁戒指，+2 速度",
    icon: "💍",
    requiredLevel: 1
  },
  {
    id: "ring-silver",
    name: "银戒",
    type: "accessory",
    slot: "accessory",
    rarity: "rare",
    stats: { attack: 0, defense: 0, speed: 3, maxHp: 0, maxMp: 0, criticalChance: 0.03 },
    price: 150,
    sellPrice: 50,
    description: "银光闪闪的戒指，+3 速度 +3% 暴击率",
    icon: "💍",
    requiredLevel: 4
  },
  {
    id: "stone-focus",
    name: "专注之石",
    type: "accessory",
    slot: "accessory",
    rarity: "epic",
    stats: { attack: 0, defense: 0, speed: 4, maxHp: 0, maxMp: 0, criticalChance: 0.05 },
    price: 400,
    sellPrice: 140,
    description: "散发神秘光芒的宝石，+4 速度 +5% 暴击率",
    icon: "🔮",
    requiredLevel: 7
  },
  {
    id: "boots-swift",
    name: "迅捷之靴",
    type: "accessory",
    slot: "accessory",
    rarity: "legendary",
    stats: { attack: 0, defense: 1, speed: 6, maxHp: 0, maxMp: 0, criticalChance: 0.08 },
    price: 800,
    sellPrice: 300,
    description: "传说中的神速之靴，+6 速度 +8% 暴击率",
    icon: "⚡",
    requiredLevel: 10
  },
  {
    id: "charm-lucky",
    name: "幸运符",
    type: "accessory",
    slot: "accessory",
    rarity: "common",
    stats: { attack: 0, defense: 0, speed: 0, maxHp: 0, maxMp: 0, criticalChance: 0.03 },
    price: 70,
    sellPrice: 25,
    description: "带来好运的护身符，+3% 暴击率",
    icon: "🍀",
    requiredLevel: 2
  },
  {
    id: "amulet-power",
    name: "力量护符",
    type: "accessory",
    slot: "accessory",
    rarity: "common",
    stats: { attack: 3, defense: 0, speed: 0, maxHp: 10, maxMp: 0, criticalChance: 0 },
    price: 130,
    sellPrice: 45,
    description: "增强力量的魔法护符，+3 攻击力 +10 HP",
    icon: "💪",
    requiredLevel: 5
  },
  {
    id: "book-wisdom",
    name: "智慧之书",
    type: "accessory",
    slot: "accessory",
    rarity: "rare",
    stats: { attack: 0, defense: 0, speed: 1, maxHp: 0, maxMp: 20, criticalChance: 0.04 },
    price: 280,
    sellPrice: 95,
    description: "记载古老智慧的魔法书，+20 MP +4% 暴击率",
    icon: "📖",
    requiredLevel: 6
  },
  {
    id: "necklace-dragonfang",
    name: "龙牙项链",
    type: "accessory",
    slot: "accessory",
    rarity: "epic",
    stats: { attack: 4, defense: 0, speed: 3, maxHp: 0, maxMp: 0, criticalChance: 0.03 },
    price: 650,
    sellPrice: 220,
    description: "龙牙制成的强力项链，+4 攻击力 +3 速度 +3% 暴击",
    icon: "🦷",
    requiredLevel: 9
  }
];

// Boss drop tables: which items can drop from bosses
export const BOSS_DROP_TABLE = {
  rare: ["sword-steel", "sword-frost", "armor-chain", "armor-mithril", "ring-silver", "book-wisdom"],
  epic: ["sword-flame", "armor-dragon", "stone-focus", "necklace-dragonfang"],
  legendary: ["sword-shadow", "cloak-night", "boots-swift"]
};

// Get a random boss drop based on player level
export function getBossDrop(playerLevel) {
  const rand = Math.random();
  if (rand < 0.01 && playerLevel >= 10) {
    // 1% legendary drop (if level requirement met)
    return BOSS_DROP_TABLE.legendary[0];
  } else if (rand < 0.06 && playerLevel >= 7) {
    // 5% epic drop
    const epics = EQUIPMENT_CATALOG.filter(e => e.rarity === 'epic' && e.requiredLevel <= playerLevel);
    if (epics.length > 0) {
      return epics[Math.floor(Math.random() * epics.length)].id;
    }
  } else if (rand < 0.16) {
    // 10% rare drop
    const rares = EQUIPMENT_CATALOG.filter(e => e.rarity === 'rare' && e.requiredLevel <= playerLevel);
    if (rares.length > 0) {
      return rares[Math.floor(Math.random() * rares.length)].id;
    }
  }
  return null; // No drop
}
