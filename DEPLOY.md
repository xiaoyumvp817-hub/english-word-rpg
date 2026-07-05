# 🚀 部署到 GitHub Pages — 详细指南

按照本指南操作，约 **10 分钟**即可将游戏免费部署到网上，朋友用浏览器打开链接就能玩。

---

## 第一步：注册 GitHub 账号

1. 打开 https://github.com
2. 点击右上角「Sign up」
3. 用邮箱注册（推荐使用常用邮箱）
4. 验证邮箱后登录

---

## 第二步：创建仓库

1. 登录后，打开 https://github.com/new
2. 填写信息：

   | 字段 | 填写内容 |
   |------|----------|
   | Repository name | `english-word-rpg` |
   | Description | 英语单词打怪升级 RPG 游戏 |
   | 类型 | **Public**（公开，免费使用 Pages） |
   | 初始化 | ❌ 不勾选任何选项 |

3. 点击「Create repository」

---

## 第三步：推送代码到 GitHub

创建仓库后会看到一个页面，显示「…or push an existing repository from the command line」。已经准备好发布包（或已有本地代码）后：

```bash
# 1. 进入项目目录
cd d:\vscode_projects\English_Games

# 2. 初始化 git（如果还没初始化）
git init

# 3. 添加所有文件
git add -A

# 4. 提交
git commit -m "🎮 英语单词大冒险 v1.0 — 首次发布"

# 5. 添加 GitHub 远程仓库（把用户名换成你自己的）
git remote add origin https://github.com/你的用户名/english-word-rpg.git

# 6. 推送代码
git push -u origin master
```

> 💡 推送时可能会弹出 GitHub 登录窗口。如果使用密码，需要在 GitHub 设置中创建 Personal Access Token 代替密码。

---

## 第四步：开启 GitHub Pages

1. 进入你的仓库页面
2. 点击顶部「Settings」→ 左侧「Pages」
3. 在「Build and deployment」区域配置：

   | 选项 | 值 |
   |------|-----|
   | Source | Deploy from a branch |
   | Branch | `master` |
   | Folder | `/ (root)` |

4. 点击「Save」
5. 等待 1-2 分钟，页面刷新后会显示网址：

   ```
   https://你的用户名.github.io/english-word-rpg/
   ```

6. ✅ 点击这个网址，确认游戏能正常打开！

---

## 第五步：分享链接

把这个链接发给朋友：

```
https://你的用户名.github.io/english-word-rpg/
```

他们用手机或电脑浏览器打开就能玩！每个人的进度存在自己的浏览器里，互不影响。

---

## 📝 后续更新

当你修改了游戏代码，重新部署只需三步：

```bash
# 1. 添加改动
git add -A

# 2. 提交
git commit -m "描述你改了什么"

# 3. 推送到 GitHub
git push
```

GitHub Pages 会在 1-2 分钟内自动更新，无需手动操作！

---

## ⚠️ 常见问题

### Q: 打开链接显示 404？
A: 检查：
- GitHub Pages 是否已在 Settings → Pages 中启用
- 仓库是否设置为「Public」（Settings → General → Danger Zone → Change visibility）
- 分支名称是否正确（`master`，不是 `main`）

### Q: 页面能打开但是白屏？
A: 按 F12 打开开发者工具 → Console 面板，查看红色错误信息。常见原因：
- 文件没推送完整（检查仓库文件列表）
- 浏览器太旧（需支持 ES6 模块的 Chrome/Edge/Firefox）

### Q: 国内访问速度怎么样？
A: GitHub Pages 在国内可以访问，速度中等。首次加载约 2-5 秒。

### Q: 可以绑定自己的域名吗？
A: 可以。在 Settings → Pages → Custom domain 中配置，并设置 DNS 记录。

### Q: 存档会丢吗？
A: 存档存在用户自己的浏览器里（localStorage），与服务器无关。换浏览器/清除浏览器数据会导致存档丢失。建议定期使用「导出存档」功能备份。
