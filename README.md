# idlework Records · 静态官网

手工制作、独立发行朋友间音乐的小厂牌「idlework Records（夜航唱片）」的静态官网。
纯 HTML / CSS / JS，无后端、无构建步骤，可直接托管在 GitHub Pages，并绑定自定义域名 **idlework.asia**。

## 目录结构

```
.
├── index.html          主页（hero 动画 + 可变字重）
├── news.html           动态
├── music.html          创造力 / Arts（发行 + 摄影集，按时间排序）
├── artists.html        艺术家
├── reviews.html        回顾
├── blog.html           博客
├── merch.html          商品
├── about.html          关于
├── article.html        文章详情（?cat&idx）
├── photobook.html      摄影集画廊（?idx）
├── data.js             内容默认值（兜底；真实内容见 content.json）
├── app.js              渲染 / 交互 / 后台内容合并逻辑
├── content.json        部署用的真实内容（后台导出的覆盖数据）
├── styles.css          样式
├── images/             内容图片（由后台外置，非 base64）
├── videos/             内容视频
├── logo.png            站点图标源
├── CNAME               GitHub Pages 自定义域名（idlework.asia）
├── .nojekyll           禁用 Jekyll 处理
└── robots.txt
```

> 仓库**不包含** `admin.html` / `admin.js` / `extract_images.js` / `start-local.bat` / `stop-local.bat`：
> 它们是本机编辑与部署辅助工具，按 `.gitignore` 排除，仅保留在你的本地磁盘上。
> 若你希望把后台编辑器也一道部署到线上，删除 `.gitignore` 中对应的几行后重新提交即可。

## 本地预览

```bash
# 在项目根目录起一个静态服务器（任选其一）
python3 -m http.server 8123
# 然后浏览器打开 http://localhost:8123/
```

> 必须通过 http（而非 `file://`）打开，否则 `fetch('content.json')` 会被浏览器拦截。

## 内容更新流程

1. 本机打开 `admin.html`（通过上面的本地服务器地址）。
2. 在后台编辑动态 / 创造力 / 艺术家 / 回顾 / 博客 / 商品等栏目，保存会写入浏览器本地库（IndexedDB，约数百 MB 配额）。
3. 导出 `content.json`（后台导出功能），它会覆盖仓库根目录的同名文件；图片/视频由 `extract_images.js` 外置到 `images/` / `videos/`。
4. 提交并推送：

```bash
git add content.json images videos
git commit -m "更新内容"
git push origin main
```

## 部署到 GitHub Pages

1. 在 GitHub 新建一个**独立仓库**（与你的个人作品集 `chongchanhowl.github.io` 隔离），例如 `idlework-site`。
2. 将本仓库推送到该新仓库：

```bash
git remote add origin git@github.com:你的用户名/idlework-site.git
git branch -M main
git push -u origin main
```

3. 仓库 **Settings → Pages**：Source 选 `Deploy from a branch`，Branch 选 `main`、目录 `/ (root)`，保存。
4. 约 1–2 分钟后访问 `https://你的用户名.github.io/idlework-site/` 验证。

### 绑定自定义域名 idlework.asia

- 本仓库根目录已放置 `CNAME`，内容为 `idlework.asia`，GitHub 会自动据此配置。
- DNS（在你的域名服务商处）：
  - 根域名 `@` → 4 条 A 记录：`185.199.108.153` / `185.199.109.153` / `185.199.110.153` / `185.199.111.153`
  - 如需 `www` → CNAME 指向 `你的用户名.github.io`
- 回到仓库 **Settings → Pages**，勾选 **Enforce HTTPS**（证书签发后约需等待，最多 24 小时可开启）。
- 启用后访问 `https://idlework.asia` 即跳转到本站点。

## 注意事项

- `content.json` 中的图片/视频均为**路径引用**（如 `images/xxx.jpg`），不是 base64；大文件请保持外置，避免 JSON 膨胀。
- 后台纯前端、无鉴权：部署出去的 `admin.html`（若你选择部署）仅作用于访客本地浏览器，不会回写到仓库。
- 修改代码后如需让访客立即看到，清除 CDN/浏览器缓存或强刷（Ctrl/Cmd + Shift + R）。
