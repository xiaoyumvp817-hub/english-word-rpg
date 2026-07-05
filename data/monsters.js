// === Monster Templates ===
// Maps difficulty levels to monster types with emoji, names, and base stats

export const MONSTER_TEMPLATES = {
  1: {
    type: 'goblin',
    sprite: 'goblin',
    emoji: '👾',
    nameZh: '哥布林',
    nameEn: 'Goblin',
    baseStats: { hp: 20, attack: 4, defense: 1, xp: 15, gold: 8 }
  },
  2: {
    type: 'slime',
    sprite: 'slime',
    emoji: '🟢',
    nameZh: '史莱姆',
    nameEn: 'Slime',
    baseStats: { hp: 30, attack: 6, defense: 2, xp: 25, gold: 12 }
  },
  3: {
    type: 'skeleton',
    sprite: 'skeleton',
    emoji: '💀',
    nameZh: '骷髅兵',
    nameEn: 'Skeleton',
    baseStats: { hp: 45, attack: 8, defense: 3, xp: 35, gold: 18 }
  },
  4: {
    type: 'ghost',
    sprite: 'ghost',
    emoji: '👻',
    nameZh: '幽灵',
    nameEn: 'Ghost',
    baseStats: { hp: 60, attack: 10, defense: 4, xp: 50, gold: 25 }
  },
  5: {
    type: 'dragon_whelp',
    sprite: 'dragon',
    emoji: '🐉',
    nameZh: '幼龙',
    nameEn: 'Dragon Whelp',
    baseStats: { hp: 80, attack: 12, defense: 5, xp: 70, gold: 35 }
  }
};

// Boss templates per theme category
export const BOSS_TEMPLATES = {
  school:   { sprite: 'boss', emoji: '👹', nameZh: '学府巨魔',   nameEn: 'Academy Troll' },
  family:   { sprite: 'boss', emoji: '👹', nameZh: '家族石像鬼', nameEn: 'Family Gargoyle' },
  food:     { sprite: 'boss', emoji: '👹', nameZh: '贪食魔龙',   nameEn: 'Glutton Dragon' },
  animals:  { sprite: 'boss', emoji: '👹', nameZh: '兽王',       nameEn: 'Beast King' },
  weather:  { sprite: 'boss', emoji: '👹', nameZh: '风暴元素',   nameEn: 'Storm Elemental' },
  body:     { sprite: 'boss', emoji: '👹', nameZh: '暗影魔',     nameEn: 'Shadow Fiend' },
  clothes:  { sprite: 'boss', emoji: '👹', nameZh: '铁甲巨兽',   nameEn: 'Iron Behemoth' },
  sports:   { sprite: 'boss', emoji: '👹', nameZh: '竞技场冠军', nameEn: 'Arena Champion' },
  numbers:  { sprite: 'boss', emoji: '👹', nameZh: '数字恶魔',   nameEn: 'Number Demon' },
  colors:   { sprite: 'boss', emoji: '👹', nameZh: '彩虹巨龙',   nameEn: 'Rainbow Dragon' },
  actions:  { sprite: 'boss', emoji: '👹', nameZh: '行动巨人',   nameEn: 'Action Giant' },
  places:   { sprite: 'boss', emoji: '👹', nameZh: '迷宫守卫',   nameEn: 'Maze Guardian' },
  default:  { sprite: 'boss', emoji: '👹', nameZh: '暗影领主',   nameEn: 'Shadow Lord' }
};
