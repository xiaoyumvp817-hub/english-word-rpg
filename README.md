# ⚔️ 英语单词大冒险 — English Word Quest RPG

把背英语单词变成打怪升级的 RPG 游戏！适合初一学生学习外研版英语教材。

## 🌐 在线游玩

👉 **[点击这里开始游戏](https://xiaoyumvp817-hub.github.io/english-word-rpg/)**

## 🚀 本地运行

### 方法一：一键启动（推荐）
双击 `启动服务器.bat`，浏览器会自动打开游戏。

### 方法二：命令行启动
在项目目录打开命令行，运行：

```bash
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

> Windows 10/11 自带 Python。如果没有，从 [python.org](https://www.python.org/downloads/) 免费安装（安装时勾选「Add Python to PATH」）。

### 方法三：部署到网页（让别人也能玩）
详见 [DEPLOY.md](DEPLOY.md) — 免费部署到 GitHub Pages，只需 10 分钟。

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

游戏数据自动保存在浏览器中，关闭浏览器不会丢失进度。

**主菜单提供三个存档按钮：**
- 📥 **导出存档** — 下载 `.json` 文件备份
- 📤 **导入存档** — 从备份文件恢复进度
- 🗑️ **删除存档** — 清空数据重新开始

> 存档支持版本自动迁移，游戏更新后旧存档仍然可用。

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
