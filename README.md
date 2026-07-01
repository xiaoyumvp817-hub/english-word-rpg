# ⚔️ 英语单词大冒险 — English Word Quest RPG

把背英语单词变成打怪升级的 RPG 游戏！适合初一学生学习外研版英语教材。

## 🚀 如何运行

### 方法一：直接打开（最简单）
双击 `index.html` 文件，用浏览器打开即可。

> **注意：** 如果浏览器因为安全策略禁止加载 ES6 模块（Chrome/Edge 有时会这样），请使用方法二。

### 方法二：本地服务器（推荐）
在项目目录打开命令行，运行：

```bash
# Windows（PowerShell / CMD）
python -m http.server 8080

# 然后在浏览器打开：
# http://localhost:8080
```

> Windows 10/11 自带 Python。如果没有，可以从 Microsoft Store 免费安装。

## 🎮 怎么玩

1. **开始游戏** — 输入你的冒险者名字，开始冒险！
2. **地牢探险** — 选择一个单元，挑战单词怪物
3. **战斗** — 看到中文词义，输入对应的英文单词，按 Enter 攻击！
4. **打 Boss** — 完成一个单元所有单词后，挑战 Boss 获得稀有装备
5. **升级变强** — 获得 XP 升级，金币买装备，提高属性
6. **坚持下去** — 掌握全部 240+ 单词！

### 战斗操作

| 操作 | 按键/按钮 |
|------|-----------|
| 攻击（提交答案） | Enter 或点击"攻击"按钮 |
| 防御（减伤 50%） | 点击"防御"按钮 |
| 逃跑（非 Boss 战） | Esc 或点击"逃跑"按钮 |

### 连击 & 暴击

- 连续答对获得连击加成（XP 和金币越来越多）
- 速度属性越高，暴击概率越大（伤害 x2！）

## 📚 词汇内容

外研版（FLTRP）七年级上册，8 个单元约 240 个单词：

- Starter: Welcome to junior high! / Let's start!
- Module 1: A New Start
- Module 2: Family
- Module 3: School Life
- Module 4: Food
- Module 5: Animals
- Module 6: The Weather

## 💾 存档

游戏数据自动保存在浏览器 localStorage 中。关闭浏览器不会丢失进度。
如需备份，可在浏览器开发者工具中导出 `englishRpgSave` 键的值。

## 🛠️ 技术说明

- 纯 HTML/CSS/JavaScript（ES6 模块）
- 零依赖，无需 Node.js、npm 或任何构建工具
- 所有数据存于浏览器 localStorage
- 支持 Chrome、Edge、Firefox 等现代浏览器

## 📝 自定义单词

如需添加自定义单词，编辑 `data/words-wy-7a.js` 文件，按照以下格式添加：

```javascript
{
  id: "custom-001",
  english: "apple",
  chinese: "苹果",
  phonetic: "/ˈæpl/",
  partOfSpeech: "n.",
  unitId: "wy-7a-m4",
  unitName: "Module 4 - Food",
  difficulty: 2,
  isKey: true,
  category: "food",
  exampleSentence: "I like apples."
}
```

## 📄 许可

本项目为家庭教育用途创建，可自由修改和使用。
