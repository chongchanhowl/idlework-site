/* =========================================================
   idleworkRecords · 交互逻辑
   - 注入共享头/尾
   - 主页可变字重 hero 动画
   - 日间/夜间、中/英 切换（记忆偏好）
   - 各子页面渲染
   ========================================================= */

const NAV = [
  { en: "NEWS",    zh: "动态",   href: "news.html" },
  { en: "ARTS",    zh: "创造力",   href: "music.html" },
  { en: "ARTISTS", zh: "艺术家", href: "artists.html" },
  { en: "REVIEWS", zh: "回顾",   href: "reviews.html" },
  { en: "BLOG",    zh: "博客",   href: "blog.html" },
  { en: "MERCH",   zh: "商品",   href: "merch.html" },
  { en: "ABOUT",   zh: "关于",   href: "about.html" },
];

/* 偏好（带容错） */
const store = {
  get(k, d) { try { return localStorage.getItem(k) || d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

/* ---------- 日期解析辅助（多格式兼容） ---------- */
function parseDateVal(s) {
  if (s == null) return null;
  s = String(s).trim();
  if (!s) return null;
  const d = s.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!d) return null;
  const y = +d[1], m = +d[2], day = +d[3];
  const t = s.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  const hh = t ? +t[1] : 0, mm = t ? +t[2] : 0, ss = t ? +(t[3] || 0) : 0;
  const ts = new Date(y, m - 1, day, hh, mm, ss).getTime();
  return Number.isNaN(ts) ? null : ts;
}

/* release / photobook 按日期降序（新的在前）：优先 date，无 date 用 year，都没有的排最后。 */
function sortByReleaseDate(arr) {
  if (!Array.isArray(arr)) return;
  function ts(x) {
    if (!x) return null;
    const d = parseDateVal(x.date);
    if (d != null) return d;
    const y = String(x.year || "").match(/(\d{4})/);
    return y ? new Date(+y[1], 0, 1).getTime() : null;
  }
  arr.sort((a, b) => {
    const ta = ts(a), tb = ts(b);
    if (ta == null && tb == null) return 0;
    if (ta == null) return 1;
    if (tb == null) return -1;
    return tb - ta;
  });
}

/* 大容量持久化：优先 IndexedDB（配额数百 MB，几乎无限），不支持时回退 localStorage。
   后台保存已改为 IndexedDB（localStorage 仅约 5MB，含 base64 图片常超限），
   站点读取也走这里，保证「后台保存 → 刷新前台」的本地预览一致。 */
const iwStore = (() => {
  const DB = "iw-store", OS = "kv";
  function open() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(OS)) req.result.createObjectStore(OS); };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }
  async function set(key, val) {
    try {
      const db = await open();
      await new Promise((res, rej) => {
        const tx = db.transaction(OS, "readwrite");
        tx.objectStore(OS).put(val, key);
        tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      });
      db.close();
      return true;
    } catch { /* IndexedDB 不可用 → 回退 localStorage */ }
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
  }
  async function get(key) {
    try {
      const db = await open();
      const v = await new Promise((res, rej) => {
        const tx = db.transaction(OS, "readonly");
        const r = tx.objectStore(OS).get(key);
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      });
      db.close();
      if (v !== undefined) return v;
    } catch {}
    try {
      const s = localStorage.getItem(key);
      return s == null ? null : (() => { try { return JSON.parse(s); } catch { return s; } })();
    } catch { return null; }
  }
  return { set, get };
})();
let theme = store.get("iw-theme", "light");   // light | dark
let lang = store.get("iw-lang", "zh");          // zh | en

const grad = (c) => `linear-gradient(135deg, ${c[0]}, ${c[1]})`;
const abbr = (s) => s.replace(/[^A-Za-z一-龥]/g, "").slice(0, 2).toUpperCase();
const fileName = () => location.pathname.split("/").pop() || "index.html";
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- 注入共享头部 ---------- */
function injectHeader() {
  const cur = fileName();
  const links = NAV.map((it) => {
    const label = lang === "zh" ? it.zh : it.en;
    return `<a href="${it.href}" class="${it.href === cur ? "active" : ""}" data-nav="${it.en}">${label}</a>`;
  }).join("");
  // 品牌 LOGO：独立固定元素，不进入导航栏的反色混合层 → 保留图片原色
  const brand = document.createElement("a");
  brand.className = "brand";
  brand.href = "index.html";
  brand.innerHTML = `<img src="logo.png" alt="idlework records" class="brand-logo">`;
  // 导航栏：承载反色混合；桌面端显示内联导航，移动端显示汉堡按钮
  const header = document.createElement("header");
  header.className = "topnav";
  header.innerHTML = `
    <button class="nav-toggle" id="navToggle" aria-label="menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <nav class="nav-btns nav-btns-inline">
      ${links}
      <span class="sep"></span>
      <button id="themeToggle" data-i18n="theme" title="theme">☀</button>
      <button id="langToggle" data-i18n="lang">EN</button>
    </nav>`;
  // 移动端下拉面板：独立固定元素，不进反色混合层，带实心背景保证可读
  const panel = document.createElement("div");
  panel.className = "nav-panel";
  panel.id = "navPanel";
  panel.innerHTML = `
    <a href="index.html" class="nav-panel-home">首页 / Home</a>
    ${links}
    <div class="nav-panel-foot">
      <button class="panel-theme" data-i18n="theme" title="theme">☀</button>
      <button class="panel-lang" data-i18n="lang">EN</button>
    </div>`;
  document.body.prepend(panel);
  document.body.prepend(header);
  document.body.prepend(brand);
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  document.getElementById("langToggle").addEventListener("click", toggleLang);
  document.getElementById("navToggle").addEventListener("click", toggleNav);
  panel.querySelector(".panel-theme").addEventListener("click", toggleTheme);
  panel.querySelector(".panel-lang").addEventListener("click", toggleLang);
  panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
  // 点击面板 / 汉堡按钮之外区域时收起菜单
  document.addEventListener("click", (e) => {
    const p = document.getElementById("navPanel");
    if (!p || !p.classList.contains("open")) return;
    const t = document.getElementById("navToggle");
    if (p.contains(e.target) || (t && t.contains(e.target))) return;
    closeNav();
  });
}

/* 移动端菜单开合 */
function toggleNav() {
  const p = document.getElementById("navPanel");
  const t = document.getElementById("navToggle");
  const open = p.classList.toggle("open");
  if (t) { t.classList.toggle("active", open); t.setAttribute("aria-expanded", open ? "true" : "false"); }
  document.body.classList.toggle("nav-open", open);
}
function closeNav() {
  const p = document.getElementById("navPanel");
  const t = document.getElementById("navToggle");
  if (p) p.classList.remove("open");
  if (t) { t.classList.remove("active"); t.setAttribute("aria-expanded", "false"); }
  document.body.classList.remove("nav-open");
}

/* ---------- 注入共享页脚 ---------- */
function injectFooter() {
  const footer = document.createElement("footer");
  footer.className = "footer";
  const links = LABEL.social
    .map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`)
    .join("");
  footer.innerHTML = `
    <div class="f-links">${links}</div>`;
  document.body.append(footer);
}

/* ---------- 注入字体（6 款可变展示字体 + Space Mono 等宽 UI 字体），覆盖所有页面 ---------- */
function injectFonts() {
  if (document.getElementById("iw-fonts")) return;
  const link = document.createElement("link");
  link.id = "iw-fonts";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Newsreader:opsz,wght@6..72,200..800&family=Playfair+Display:wght@400..900&family=Roboto+Flex:opsz,wght,wdth@8..144,100..1000,25..151&family=Source+Serif+4:opsz,wght@8..60,200..900&family=Space+Mono:wght@400;700&family=Work+Sans:wght@100..900&display=swap";
  document.head.appendChild(link);
}

/* ---------- 主题 ---------- */
function applyTheme() {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.querySelectorAll('[data-i18n="theme"]').forEach((el) => {
    el.textContent = theme === "dark" ? "🌙" : "☀";
  });
}
function toggleTheme() {
  theme = theme === "dark" ? "light" : "dark";
  store.set("iw-theme", theme);
  applyTheme();
}

/* ---------- 语言 ---------- */
function applyLang() {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  // 静态文案
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key === "lang") { el.textContent = I18N[lang].lang; return; }
    if (key === "theme") return;   // 主题按钮图标由 applyTheme 管理
    if (I18N[lang][key] != null) el.textContent = I18N[lang][key];
  });
  const btn = document.getElementById("langToggle");
  if (btn) btn.textContent = I18N[lang].lang;
  // 导航按钮随语言切换中/英文（含移动端面板里的链接）
  document.querySelectorAll("a[data-nav]").forEach((a) => {
    const it = NAV.find((n) => n.en === a.getAttribute("data-nav"));
    if (it) a.textContent = lang === "zh" ? it.zh : it.en;
  });
  renderPage();   // 动态内容随语言刷新
}
function toggleLang() {
  lang = lang === "zh" ? "en" : "zh";
  store.set("iw-lang", lang);
  applyLang();
}

/* ---------- 主页 hero 动画：逐字母独立随机 + 随机切换可变字体（交叉淡入） ---------- */
/* 6 款开源可变字体：衬线 Playfair Display / Newsreader / Source Serif 4，非衬线 Inter / Work Sans / Roboto Flex
   每款都带 wght 轴；Roboto Flex 额外带 opsz / wdth 轴，切换时一并展示。 */
const FONTS = [
  { name: '"Inter", sans-serif', extra: "" },
  { name: '"Work Sans", sans-serif', extra: "" },
  { name: '"Roboto Flex", sans-serif', extra: '"opsz" 144, "wdth" 100' },
  { name: '"Playfair Display", serif', extra: "" },
  { name: '"Newsreader", serif', extra: '"opsz" 40' },
  { name: '"Source Serif 4", serif', extra: '"opsz" 40' },
];
function animateHero() {
  const word = document.querySelector(".hero .word");
  if (!word) return;

  // 文本拆成两层（交叉淡入）；每层再拆成单字母 span，便于逐字母独立变形
  const TEXT = "idlework<br>Records";
  const buildHTML = () => TEXT.split(/(<br>)/).map((p) =>
    p === "<br>" ? "<br>" : [...p].map((c) => `<span class="ch">${c}</span>`).join("")
  ).join("");
  const layers = [...word.querySelectorAll(".layer")];
  layers.forEach((L) => { L.innerHTML = buildHTML(); });
  const chs = layers.map((L) => [...L.querySelectorAll(".ch")]);   // 两层字母一一对应
  const N = chs[0].length;

  // 字母"碰撞体积"：测量每个字母在自然布局下的中心 X / 中心 Y / 半宽，并据此
  // 把同一行的相邻字母配对（跨 <br> 的两行不算邻居），用于每帧做最小间距分离。
  let box = [];
  let pairs = [];
  const measure = () => {
    chs.forEach((row) => row.forEach((el) => { el.style.transform = "none"; }));
    const base = word.getBoundingClientRect();
    box = chs[0].map((el) => {
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2 - base.left, cy: r.top + r.height / 2 - base.top, hw: r.width / 2 };
    });
    pairs = [];
    for (let i = 0; i < N - 1; i++) {
      if (Math.abs(box[i].cy - box[i + 1].cy) < 8) pairs.push([i, i + 1]);  // 仅同一行的相邻字母
    }
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener("resize", measure);
  requestAnimationFrame(measure);   // 兜底：字体未就绪时也先量一次

  const rnd = (a, b) => a + Math.random() * (b - a);
  const smoother = (x) => x * x * x * (x * (x * 6 - 15) + 10);   // 非线性缓动
  const tri = (p) => (p < 0.5 ? p * 2 : (1 - p) * 2);            // 0→1→0 三角波

  // 每个字母一份独立状态：字重 / 横拉 / 竖拉 / 旋转 / 位移，各自随机游走
  const letters = Array.from({ length: N }, () => ({
    w: 300, tw: 300, nw: 0,
    sx: 1, tsx: 1, nsx: 0,
    sy: 1, tsy: 1, nsy: 0,
    rot: 0, trot: 0, nrot: 0,
    dx: 0, tdx: 0, ndx: 0,
    dy: 0, tdy: 0, ndy: 0,
    spd: rnd(0.045, 0.11),   // 各自游走速度不同 → 永远不同步
    // 颜色：各自独立的色相/饱和度/亮度，开场为黑(亮底)/白(暗底)单色，之后随机换色并平滑过渡
    hue: rnd(0, 360), thue: rnd(0, 360), nhue: 0,
    sat: 0, tsat: 0, nsat: 0,
    lig: 0, tlig: 0,
    cspd: rnd(0.04, 0.09),   // 颜色逼近速度
  }));
  const now0 = performance.now();
  letters.forEach((L) => {        // 各字母首轮随机目标的时间也错开
    L.nw = now0 + rnd(700, 2300); L.nsx = now0 + rnd(700, 2300); L.nsy = now0 + rnd(700, 2300);
    L.nrot = now0 + rnd(900, 2800); L.ndx = now0 + rnd(1200, 3200); L.ndy = now0 + rnd(1200, 3200);
    L.nhue = now0 + rnd(1600, 5200); L.nsat = now0 + rnd(1600, 5200);
    const initDark = document.documentElement.classList.contains("dark");
    L.lig = initDark ? 92 : 14; L.tlig = L.lig;   // 开场黑/白单色
  });

  // 预加载全部字体，消除切换瞬间的 FOUT 闪烁
  FONTS.forEach((f) => {
    const n = f.name.replace(/["']/g, "").replace(/,.*/, "");
    document.fonts.load(`900 64px "${n}"`).catch(() => {});
    document.fonts.load(`100 64px "${n}"`).catch(() => {});
  });

  let front = 0, curIdx = 0;       // 当前显示层 / 当前字体索引
  const applyFont = (idx) => {
    curIdx = idx;
    const back = 1 - front;
    const f = FONTS[idx];
    layers[back].style.setProperty("font-family", f.name);
    layers[back].dataset.extra = f.extra || "";
    layers[back].style.opacity = "1";
    layers[front].style.opacity = "0";
    front = back;
  };
  applyFont(0);                     // 首层登场（自带 0.7s 柔入）
  let nextSwitch = now0 + 2600;     // 首屏停留 2.6s 后再开始随机切换
  const start = now0, INTRO = 2600, PERIOD = 4000;
  const COLOR_START = 5000;         // 开场保持黑/白单色 5s，之后开始随机换色
  let primed = false;               // 首屏结束后，把字母状态从同步值平滑接管，避免跳变

  const frame = (now) => {
    if (now >= nextSwitch) {
      let n; do { n = Math.floor(Math.random() * FONTS.length); } while (n === curIdx);
      applyFont(n);
      nextSwitch = now + 4200 + Math.random() * 4200;   // 随机 4.2–8.4s 切换一次
    }
    // 共享的"首屏横排呼吸"值（开场用，之后作为字母随机游走的起点）
    const t = ((now - start) / PERIOD) % 1;
    const e = smoother(tri(t)), e2 = smoother(tri((t + 0.15) % 1)), e3 = smoother(tri((t + 0.30) % 1));
    const sw = 100 + 800 * e, ssx = 0.8 + 0.4 * e2, ssy = 0.88 + 0.24 * e3;
    const intro = now - start < INTRO;
    const isDark = document.documentElement.classList.contains("dark");

    // 第一轮：更新每个字母的状态（字重 / 横竖拉 / 旋转 / 位移）
    for (let i = 0; i < N; i++) {
      const L = letters[i];
      if (intro) {
        // 首屏：所有字母同步呼吸、零偏移 → 干净横排
        L.w = sw; L.sx = ssx; L.sy = ssy; L.rot = 0; L.dx = 0; L.dy = 0;
      } else {
        if (!primed) {              // 从同步值平滑接管，无跳变
          letters.forEach((l) => { l.w = sw; l.sx = ssx; l.sy = ssy; l.rot = 0; l.dx = 0; l.dy = 0; });
          primed = true;
        }
        // 每个字母各自刷新随机目标（互不同步、互不相同）
        if (now >= L.nw)  { L.tw  = rnd(120, 900);  L.nw  = now + rnd(700, 2300); }
        if (now >= L.nsx) { L.tsx = rnd(0.74, 1.30); L.nsx = now + rnd(700, 2300); }
        if (now >= L.nsy) { L.tsy = rnd(0.82, 1.20); L.nsy = now + rnd(700, 2300); }
        if (now >= L.nrot){ L.trot= rnd(-10, 10);    L.nrot= now + rnd(900, 2800); }
        if (now >= L.ndx) { L.tdx = rnd(-26, 26);    L.ndx = now + rnd(1200, 3200); }
        if (now >= L.ndy) { L.tdy = rnd(-14, 14);    L.ndy = now + rnd(1200, 3200); }
        L.w  += (L.tw  - L.w)  * L.spd;
        L.sx += (L.tsx - L.sx) * L.spd;
        L.sy += (L.tsy - L.sy) * L.spd;
        L.rot+= (L.trot- L.rot)* L.spd;
        L.dx += (L.tdx - L.dx) * L.spd;
        L.dy += (L.tdy - L.dy) * L.spd;
      }
      // 颜色：开场 5s 保持黑/白单色，之后各自随机换色（撞色概率拉高到 85%）
      const justColor = now - start < COLOR_START;
      const monoLig = isDark ? 92 : 14;
      const normLig = isDark ? 68 : 40;
      if (justColor) {
        L.tlig = monoLig; L.tsat = 0;                 // 黑/白单色（sat=0）
      } else if (now >= L.nhue) {
        const punk = Math.random() < 0.85;            // 85% 概率高饱和撞色
        L.thue = rnd(0, 360);
        L.tsat = punk ? rnd(85, 100) : rnd(35, 55);
        L.tlig = normLig;
        L.nhue = now + rnd(1600, 5200);
      }
      L.hue += (L.thue - L.hue) * L.cspd;
      L.sat += (L.tsat - L.sat) * L.cspd;
      L.lig += (L.tlig - L.lig) * L.cspd;
    }

    // 碰撞分离：非首屏时，把同一行里重叠超过阈值的相邻字母互相推开（保留少量重叠余量）
    if (!intro && box.length) {
      const MIN_GAP = -3;          // 允许最多 3px 重叠，超过则推开 → 不可过分重叠
      for (let it = 0; it < 4; it++) {
        for (const [a, b] of pairs) {
          const aL = box[a].cx + letters[a].dx - box[a].hw * letters[a].sx;
          const aR = box[a].cx + letters[a].dx + box[a].hw * letters[a].sx;
          const bL = box[b].cx + letters[b].dx - box[b].hw * letters[b].sx;
          const gap = bL - aR;     // >0 分离，<0 重叠
          if (gap < MIN_GAP) {
            const push = (MIN_GAP - gap) / 2;
            letters[a].dx -= push;
            letters[b].dx += push;
          }
        }
      }
    }

    // 第二轮：把状态写入两层对应字母（字体交叉淡入时两层同步，仅字体不同）
    const fExtra = FONTS[curIdx].extra || "";
    const bExtra = layers[1 - front].dataset.extra || "";
    for (let i = 0; i < N; i++) {
      const L = letters[i];
      const fvs = `"wght" ${L.w.toFixed(1)}, "opsz" 144`;
      const tf = `translate(${L.dx.toFixed(1)}px, ${L.dy.toFixed(1)}px) rotate(${L.rot.toFixed(1)}deg) scale(${L.sx.toFixed(3)}, ${L.sy.toFixed(3)})`;
      const fEl = chs[front][i], bEl = chs[1 - front][i];
      const col = `hsl(${L.hue.toFixed(0)}, ${L.sat.toFixed(0)}%, ${L.lig.toFixed(0)}%)`;
      if (fEl) { fEl.style.fontVariationSettings = fvs + (fExtra ? `, ${fExtra}` : ""); fEl.style.transform = tf; fEl.style.color = col; }
      if (bEl) { bEl.style.fontVariationSettings = fvs + (bExtra ? `, ${bExtra}` : ""); bEl.style.transform = tf; bEl.style.color = col; }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* ---------- 内容转义 ---------- */
const escHtml = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* 把 list 条目的正文渲染为 HTML：兼容旧版字符串，并支持区块数组
   [{type:'text', value}, {type:'img', value, caption}] —— 文字段与图片段按序混排。 */
function renderBody(body) {
  if (typeof body === "string") return `<p>${escHtml(body).replace(/\n/g, "<br>")}</p>`;
  if (Array.isArray(body)) {
    return body.map((b) => {
      if (!b) return "";
      if (b.type === "img" && b.value) {
        const cap = b.caption ? `<figcaption>${escHtml(b.caption)}</figcaption>` : "";
        return `<figure class="body-fig"><img class="body-img" src="${escAttr(b.value)}" alt="${escAttr(b.caption || "")}">${cap}</figure>`;
      }
      if (b.type === "video" && b.value) {
        const cap = b.caption ? `<figcaption>${escHtml(b.caption)}</figcaption>` : "";
        return `<figure class="body-fig body-video"><video class="body-video-el" controls preload="metadata" src="${escAttr(b.value)}"></video>${cap}</figure>`;
      }
      const v = b.value || "";
      // 富文本（已净化的 HTML）直接渲染；纯文本走转义 + 换行转 br
      return /<[a-z][\s\S]*>/i.test(v) ? sanitizeRich(v) : `<p>${sanitizeRich(v)}</p>`;
    }).join("");
  }
  return "";
}

/* 把多个元信息用「·」连接，并自动过滤空值 */
const metaLine = (...parts) => parts.filter((x) => String(x ?? "").trim() !== "").join(" · ");

/* 性能：为首屏以外的内容图片加上 lazy + async 解码，减少首屏阻塞与流量。
   品牌 logo 与 hero 不延迟（始终在视口内），其余统一懒加载。 */
function perfImgs(root) {
  (root || document).querySelectorAll("img").forEach((img) => {
    if (img.classList.contains("brand-logo")) return;
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
  });
}

/* 富文本 → 纯文本（用于摘要截取），剥离所有标签与换行空白 */
function richToText(html) {
  if (typeof html !== "string" || !html) return "";
  if (!/<[a-z][\s\S]*>/i.test(html)) return html;
  const d = document.createElement("div");
  d.innerHTML = sanitizeRich(html);
  return d.textContent || "";
}

/* 文章摘要：优先用后台填写的 summary 字段；未填写时从正文自动截取前 N 个汉字（默认 50）。
   正文兼容字符串与区块数组 [{type:'text',value}|{type:'img'}]，图片段不计入字数。 */
function extractSummary(item, maxLen = 50) {
  if (item && item.summary && String(item.summary).trim()) {
    const s = String(item.summary).trim();
    return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
  }
  let text = "";
  const body = item && item.body;
  if (typeof body === "string") text = body;
  else if (Array.isArray(body)) text = body.filter((b) => b && b.type !== "img").map((b) => richToText(b.value)).join("");
  text = text.replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

/* ---------- 子页面渲染 ---------- */
function cardFrame(c, label, img) {
  if (img) return `<div class="frame"><img class="cover-img" src="${img}" alt="${label}"></div>`;
  return `<div class="frame" style="background:${grad(c)}"><span class="glyph">${label}</span></div>`;
}
/* 艺术家头像：有真实照片时按照片横/竖自动设 4:3 / 3:4；无照片用渐变占位（竖版 3:4） */
function artistFrame(a) {
  if (a.img) {
    return `<div class="frame"><img class="avatar-img" src="${a.img}" alt="${a.name}" `
      + `onload="this.closest('.frame').style.aspectRatio = (this.naturalWidth >= this.naturalHeight ? '4 / 3' : '3 / 4')"></div>`;
  }
  return cardFrame(a.avatar, abbr(a.name));
}
function renderPage() {
  const page = document.body.dataset.page;
  if (!page || page === "home") return;
  const view = document.getElementById("view");
  if (!view) return;

  // 文章详情页（article.html?cat=xxx&idx=N）：独立于各栏目，单独渲染
  if (page === "article") { renderArticle(view); return; }

  const sec = SECTIONS[page];
  if (!sec) return;
  const L = I18N[lang];
  const st = (s) => (L.status[s] != null ? L.status[s] : s);

  document.getElementById("pageTitle").textContent = sec.title[lang];
  document.getElementById("pageIntro").textContent = sec.intro[lang];
  document.getElementById("pageEyebrow").textContent = sec.title.en.toUpperCase();

  const body = document.getElementById("pageBody");
  let html = "";

  if (sec.kind === "list") {
    const perPage = 5;
    const urlParams = new URLSearchParams(location.search);
    let pageNum = parseInt(urlParams.get("p") || "1", 10);
    if (!Number.isFinite(pageNum) || pageNum < 1) pageNum = 1;

    // 按日期倒序排列（YYYY.MM.DD 字符串可直接比较），无日期排最后
    const sorted = sec.items.map((it, i) => ({ ...it, _idx: i }))
      .sort((a, b) => {
        const da = String(a.date || "").trim();
        const db = String(b.date || "").trim();
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db.localeCompare(da); // 新的在前
      });

    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (pageNum > totalPages) pageNum = totalPages;
    const start = (pageNum - 1) * perPage;
    const pageItems = sorted.slice(start, start + perPage);

    html = `<div class="list">` + pageItems.map((it) => `
      <div class="item reveal">
        ${it.from ? `<div class="src">${it.from}</div>` : `<div class="meta">${it.date || ""}</div>`}
        <h3><a class="item-link" href="article.html?cat=${page}&idx=${it._idx}">${it.title}</a></h3>
        ${it.img ? `<a class="item-link" href="article.html?cat=${page}&idx=${it._idx}"><img class="list-img" src="${it.img}" alt=""></a>` : ""}
        <p class="summary">${escHtml(extractSummary(it))}</p>
      </div>`).join("") + `</div>`;

    if (totalPages > 1) {
      html += `<nav class="pagination" aria-label="分页">
        ${pageNum > 1 ? `<a class="page-arrow" href="?p=${pageNum - 1}">&lt;</a>` : `<span class="page-arrow disabled">&lt;</span>`}
        <input type="number" class="page-current" value="${pageNum}" min="1" max="${totalPages}" aria-label="当前页">
        <span class="page-slash">/</span>
        <span class="page-total">${totalPages}</span>
        ${pageNum < totalPages ? `<a class="page-arrow" href="?p=${pageNum + 1}">&gt;</a>` : `<span class="page-arrow disabled">&gt;</span>`}
      </nav>`;
    }
  } else if (sec.kind === "release") {
    // 创造力页面：专辑 + 摄影集 共用同一个网格自然续排（无中间分隔标题），
    // 摄影集卡靠左上角 PHOTOBOOK 徽章与专辑区分；点开逐张浏览整本影集
    // 统一按时间排序：release 与 photobook 混排，新的在前
    const pbs = (sec.photobooks && sec.photobooks.length) ? sec.photobooks : [];
    const mixed = [
      ...sec.items.map((r, i) => ({ ...r, __type: "release", __idx: i })),
      ...pbs.map((p, i) => ({ ...p, __type: "photobook", __idx: i })),
    ];
    sortByReleaseDate(mixed);
    const cards = mixed.map((it) => {
      if (it.__type === "release") {
        const r = it;
        return `<div class="card reveal" data-release="${r.__idx}" role="button" tabindex="0" aria-label="${escAttr(r.title)} 详情">
        ${cardFrame(r.cover, abbr(r.title), r.img)}
        <div class="title">${r.title}</div>
        <div class="tags">${r.artist} · ${r.year} · ${r.format}</div>
      </div>`;
      }
      const p = it;
      const cover = p.cover || (p.photos && p.photos[0]) || "";
      const clickable = ` data-photobook="${p.__idx}" role="button" tabindex="0" aria-label="${escAttr(p.title)} 摄影集"`;
      return `<div class="card reveal photobook-card"${clickable}>
        <div class="pb-badge">PHOTOBOOK</div>
        ${cardFrame(["#3a3a3a", "#8a8a8a"], abbr(p.title), cover)}
        <div class="title">${p.title}</div>
        <div class="tags">${metaLine(p.artist, p.year, p.format)}</div>
      </div>`;
    }).join("");
    html = `<div class="grid grid-mixed">${cards}</div>`;
  } else if (sec.kind === "artist") {
    html = `<div class="grid">` + sec.items.map((a) => `
      <div class="card reveal">
        ${artistFrame(a)}
        <div class="title">${a.name}</div>
        <p class="bio">${escHtml(a.bio)}</p>
      </div>`).join("") + `</div>`;
  } else if (sec.kind === "shop") {
    html = `<div class="grid">` + sec.items.map((s) => {
      const rel = RELEASES.find((r) => r.title === s.title);
      const cover = rel ? rel.cover : ["#222", "#555"];
      const sold = s.status === "售罄";
      const buy = (s.buy && s.buy !== "#")
        ? ` · <a href="${s.buy}" style="color:var(--ink);text-decoration:none">${L.buy}</a>` : "";
      return `<div class="card reveal">
        ${cardFrame(cover, abbr(s.title), s.img || (rel && rel.img))}
        <div class="title">${s.title}</div>
        <div class="tags">${s.format}<span class="status ${sold ? "sold" : ""}">${st(s.status)}</span></div>
        <div class="price">¥${s.price}${buy}</div>
      </div>`;
    }).join("") + `</div>`;
  } else if (sec.kind === "about") {
    const a = sec.items[0] || {};
    const bf = lang === "en" ? (a.bodyEn || a.body) : a.body;   // 按语言取对应正文
    html = `<div class="about-wrap">
      ${a.img ? `<img class="about-cover" src="${a.img}" alt="">` : ""}
      <div class="about-body">${renderBody(bf)}</div>
    </div>`;
  }
  body.innerHTML = html;
  perfImgs(body);   // 为内容图片加 lazy / async 解码

  // 子页面内的滚动浮现
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  body.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // 标记"全局文字活动"元素：#view 内的标题/正文/卡片标题与简介（导航/页脚天然排除）
  view.querySelectorAll('#pageBody :is(h3,p,.title,.bio), #pageTitle, #pageIntro')
    .forEach((el) => el.classList.add("live"));
  refreshLive();   // 重新收集活动元素（语言切换会重建 #pageBody）
}

/* ---------- 文章详情页（article.html?cat=xxx&idx=N） ----------
   列表页只显示标题 + 摘要（最多 50 字）；完整正文仅在文章详情页呈现。
   cat 为栏目 key（news / reviews / blog），idx 为该栏目条目序号。 */
function renderArticle(view) {
  const L = I18N[lang];
  const params = new URLSearchParams(location.search);
  const cat = params.get("cat") || "news";
  const idx = parseInt(params.get("idx") || "0", 10);
  const sec = SECTIONS[cat];

  // 数据兜底：栏目不存在或索引越界，给出友好提示并链接回首页
  if (!sec || sec.kind !== "list" || !Array.isArray(sec.items) || !sec.items[idx]) {
    view.innerHTML = `<div class="article-missing">
      <h1>${L && L.back ? "内容不存在" : "Not found"}</h1>
      <p><a class="back-home" href="index.html">${L && L.back ? "返回主页" : "Back home"}</a></p>
    </div>`;
    return;
  }

  const it = sec.items[idx];
  const back = document.getElementById("artBack");
  if (back) back.href = cat + ".html";
  const eyebrow = document.getElementById("pageEyebrow");
  if (eyebrow) eyebrow.textContent = (sec.title.en || "").toUpperCase();
  const titleEl = document.getElementById("pageTitle");
  if (titleEl) titleEl.textContent = it.title;
  const metaEl = document.getElementById("pageMeta");
  if (metaEl) metaEl.textContent = it.from || it.date || "";

  const body = document.getElementById("pageBody");
  if (body) {
    body.innerHTML = (it.img ? `<img class="list-img" src="${escAttr(it.img)}" alt="">` : "")
      + renderBody(it.body);
  }

  // 文章正文也参与全局文字活动
  view.querySelectorAll('#pageBody :is(h3,p,.title,.bio), #pageTitle, #pageMeta')
    .forEach((el) => el.classList.add("live"));
  perfImgs(view);   // 为文章页图片加 lazy / async 解码
  refreshLive();
}

/* ---------- 全局弹层：滚动锁 工具 ----------
   弹层打开时挂 no-scroll；关闭时若无其它弹层仍打开，就释放滚动。 */
const MODAL_IDS = ["detailModal", "pbModal", "galleryModal"];
const isOpen = (id) => {
  const m = document.getElementById(id);
  return !!(m && m.classList.contains("open"));
};
const lockScroll = () => document.body.classList.add("no-scroll");
const unlockScrollUnlessAnyOpen = () => {
  if (MODAL_IDS.some(isOpen)) return;
  document.body.classList.remove("no-scroll");
};

/* ---------- ARTS 发行详情浮层：点击网格单元弹出 ---------- */
function releaseCoverHTML(r) {
  if (r.img) return `<img class="detail-cover-img" src="${escAttr(r.img)}" alt="${escAttr(r.title)}">`;
  const g = (Array.isArray(r.cover) && r.cover.length) ? r.cover : ["#222", "#555"];
  return `<div class="detail-cover-grad" style="background:${grad(g)}"></div>`;
}
function openDetail(idx) {
  const r = (SECTIONS.music && SECTIONS.music.items[idx]) || null;
  if (!r) return;
  const L = I18N[lang];
  const detail = (r.detail && String(r.detail).trim()) || r.desc || "";
  const listen = (r.listen && r.listen !== "#")
    ? `<a class="detail-listen" href="${escAttr(r.listen)}" target="_blank" rel="noopener">${L.listen} ↗</a>` : "";
  let m = document.getElementById("detailModal");
  if (!m) {
    m = document.createElement("div");
    m.id = "detailModal"; m.className = "detail-modal"; m.setAttribute("aria-hidden", "true");
    m.innerHTML = `
      <div class="detail-backdrop" id="detailBackdrop"></div>
      <div class="detail-panel" role="dialog" aria-modal="true" aria-label="release detail">
        <button class="detail-close" id="detailClose" aria-label="关闭">✕</button>
        <div class="detail-cover" id="detailCover"></div>
        <div class="detail-info">
          <div class="detail-info-header">
            <div class="detail-tags" id="detailTags"></div>
            <h2 class="detail-title" id="detailTitle"></h2>
          </div>
          <div class="detail-info-scroll">
            <div class="detail-desc" id="detailDesc"></div>
            <div class="detail-actions" id="detailActions"></div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(m);
    m.querySelector("#detailBackdrop").addEventListener("click", closeDetail);
    m.querySelector("#detailClose").addEventListener("click", closeDetail);
  }
  document.getElementById("detailCover").innerHTML = releaseCoverHTML(r);
  document.getElementById("detailTags").innerHTML = `${escHtml(r.artist)} · ${escHtml(r.year)} · ${escHtml(r.format)}`;
  document.getElementById("detailTitle").textContent = r.title;
  document.getElementById("detailDesc").innerHTML = escHtml(detail).replace(/\n/g, "<br>");
  document.getElementById("detailActions").innerHTML = listen;
  perfImgs(m);   // 详情封面/图片懒加载
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
  lockScroll();
  m.querySelector("#detailClose").focus();
}
function closeDetail() {
  const m = document.getElementById("detailModal");
  if (m) { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); }
  unlockScrollUnlessAnyOpen();
}

/* ---------- 摄影集详情浮层：尺寸/排版与专辑详情一致 ----------
   左封面、右信息（年份 + 标题 + 描述），下方 6 张内容缩略图，
   右下角「查看全部」按钮跳转到该摄影集的独立网页 photobook.html?pb=N。 */
function photobookCoverHTML(p) {
  if (p.cover) return `<img class="detail-cover-img" src="${escAttr(p.cover)}" alt="${escAttr(p.title)}">`;
  const first = (p.photos && p.photos[0]) || "";
  if (first) return `<img class="detail-cover-img" src="${escAttr(first)}" alt="${escAttr(p.title)}">`;
  return `<div class="detail-cover-grad" style="background:${grad(["#3a3a3a", "#8a8a8a"])}"></div>`;
}
function openPhotobook(idx) {
  const pbs = (SECTIONS.music && SECTIONS.music.photobooks) || [];
  const p = pbs[idx];
  if (!p) return;
  const L = I18N[lang];
  const desc = (p.desc && String(p.desc).trim()) || "";
  const photos = (p.photos || []).slice(0, 6);
  let m = document.getElementById("pbModal");
  if (!m) {
    m = document.createElement("div");
    m.id = "pbModal"; m.className = "detail-modal"; m.setAttribute("aria-hidden", "true");
    m.innerHTML = `
      <div class="detail-backdrop" id="pbBackdrop"></div>
      <div class="detail-panel" role="dialog" aria-modal="true" aria-label="photobook detail">
        <button class="detail-close" id="pbClose" aria-label="关闭">✕</button>
        <div class="detail-cover" id="pbCover"></div>
        <div class="detail-info">
          <div class="detail-info-header">
            <div class="detail-tags" id="pbTags"></div>
            <h2 class="detail-title" id="pbTitle"></h2>
          </div>
          <div class="detail-info-scroll">
            <div class="detail-desc" id="pbDesc"></div>
            <div class="pb-thumbs" id="pbThumbs"></div>
            <div class="detail-actions pb-actions">
              <a class="pb-viewall" id="pbViewAll" href="#">${L.viewAll} ↗</a>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(m);
    m.querySelector("#pbBackdrop").addEventListener("click", closePhotobook);
    m.querySelector("#pbClose").addEventListener("click", closePhotobook);
    m.querySelector("#pbThumbs").addEventListener("click", (e) => {
      const t = e.target.closest(".pb-thumb");
      if (t) openGallery(idx, +t.dataset.pi);   // 点缩略图直接进画廊看大图
    });
  }
  document.getElementById("pbCover").innerHTML = photobookCoverHTML(p);
  document.getElementById("pbTags").textContent = metaLine(p.artist, p.year, p.format);
  document.getElementById("pbTitle").textContent = p.title;
  document.getElementById("pbDesc").innerHTML = escHtml(desc).replace(/\n/g, "<br>");
  document.getElementById("pbThumbs").innerHTML = photos.length
    ? photos.map((src, i) => `<button class="pb-thumb" data-pi="${i}"><img src="${escAttr(src)}" alt=""></button>`).join("")
    : `<div class="pb-empty">${L.noPhotos}</div>`;
  perfImgs(m);   // 摄影集封面与缩略图懒加载
  document.getElementById("pbViewAll").href = `photobook.html?pb=${idx}`;
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
  lockScroll();
  m.querySelector("#pbClose").focus();
}
function closePhotobook() {
  const m = document.getElementById("pbModal");
  if (m) { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); }
  unlockScrollUnlessAnyOpen();
}

/* ---------- 摄影集画廊浮层：点击创造力页的摄影集卡片，逐张浏览整本影集 ----------
   支持大图、上一张/下一张、缩略图条、计数、键盘 ←/→ 翻页、Esc 关闭。 */
let galleryState = null;   // { photos:[dataURL...], idx }
function buildGalleryModal() {
  let m = document.getElementById("galleryModal");
  if (m) return m;
  m = document.createElement("div");
  m.id = "galleryModal"; m.className = "gallery-modal"; m.setAttribute("aria-hidden", "true");
  m.innerHTML = `
    <div class="gallery-backdrop" id="galleryBackdrop"></div>
    <div class="gallery-panel" role="dialog" aria-modal="true" aria-label="photo book">
      <button class="gallery-close" id="galleryClose" aria-label="关闭">✕</button>
      <div class="gallery-bar">
        <span class="gallery-title" id="galleryTitle"></span>
        <span class="gallery-counter" id="galleryCounter"></span>
      </div>
      <div class="gallery-stage">
        <button class="gallery-nav gallery-prev" id="galleryPrev" aria-label="上一张">‹</button>
        <img class="gallery-img" id="galleryImg" alt="">
        <button class="gallery-nav gallery-next" id="galleryNext" aria-label="下一张">›</button>
      </div>
      <div class="gallery-thumbs" id="galleryThumbs"></div>
    </div>`;
  document.body.appendChild(m);
  m.querySelector("#galleryBackdrop").addEventListener("click", closeGallery);
  m.querySelector("#galleryClose").addEventListener("click", closeGallery);
  m.querySelector("#galleryPrev").addEventListener("click", () => stepGallery(-1));
  m.querySelector("#galleryNext").addEventListener("click", () => stepGallery(1));
  m.querySelector("#galleryThumbs").addEventListener("click", (e) => {
    const t = e.target.closest(".gallery-thumb");
    if (t) showGalleryPhoto(+t.dataset.pi);
  });
  return m;
}
function openGallery(idx, start) {
  const pbs = (SECTIONS.music && SECTIONS.music.photobooks) || [];
  const pb = pbs[idx];
  if (!pb || !pb.photos || !pb.photos.length) return;
  const m = buildGalleryModal();
  document.getElementById("galleryTitle").textContent = `${pb.title} · ${pb.year || ""}`;
  document.getElementById("galleryThumbs").innerHTML = pb.photos.map((src, i) =>
    `<button class="gallery-thumb" data-pi="${i}"><img src="${escAttr(src)}" alt=""></button>`).join("");
  perfImgs(m);   // 画廊大图与缩略图懒加载
  galleryState = { photos: pb.photos, idx: start || 0 };
  showGalleryPhoto(start || 0);
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
  lockScroll();
  m.querySelector("#galleryClose").focus();
}
function showGalleryPhoto(i) {
  if (!galleryState) return;
  const n = galleryState.photos.length;
  galleryState.idx = (i + n) % n;
  document.getElementById("galleryImg").src = galleryState.photos[galleryState.idx];
  document.getElementById("galleryCounter").textContent = `${galleryState.idx + 1} / ${n}`;
  document.querySelectorAll("#galleryThumbs .gallery-thumb").forEach((t, i2) =>
    t.classList.toggle("active", i2 === galleryState.idx));
}
function stepGallery(d) { if (galleryState) showGalleryPhoto(galleryState.idx + d); }
function closeGallery() {
  const m = document.getElementById("galleryModal");
  if (m) { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); }
  galleryState = null;
  unlockScrollUnlessAnyOpen();
}

/* ---------- 全局文字活动：除导航/页脚外的可见内容，逐元素独立随机呼吸 ----------
   每个元素各自随机相位/速度，做四通道（字重 / 整体字号缩放 / 横拉 / 竖拉）的多频率
   正弦游走 → 整页文字像各自呼吸，活动空间大、幅度夸张，并把"字号放大"作为核心动效。 */
let liveEls = [];                    // 当前参与活动的元素及其独立状态
function refreshLive() {
  const view = document.getElementById("view");
  if (!view) { liveEls = []; return; }
  liveEls = [...view.querySelectorAll(".live")].map((el) => ({
    el,
    // 七通道各自独立相位（字重 / 字号 / 横拉 / 竖拉 / 旋转 / 位移 / 斜切）
    pw: Math.random(), pz: Math.random(), px: Math.random(), py: Math.random(),
    pr: Math.random(), pd: Math.random(), pk: Math.random(),
    // 七通道各自独立速度倍率 → 彻底错开、永不同步
    fw: rnd(0.7, 2.0), fz: rnd(0.6, 1.8), fx: rnd(0.8, 2.1), fy: rnd(0.8, 2.1),
    fr: rnd(0.7, 1.9), fd: rnd(0.7, 1.9), fk: rnd(0.7, 2.0),
    dir: Math.random() < 0.5 ? -1 : 1,   // 旋转/位移方向随机
    kdir: Math.random() < 0.5 ? -1 : 1,  // 斜切方向随机
    ax: rnd(10, 44), ay: rnd(8, 34),     // 位移振幅（px）更大、各不相同
  }));
}
function animateLive() {
  const view = document.getElementById("view");
  if (!view) return;                 // 主页无 #view，仅 hero 活动
  refreshLive();
  const start = performance.now();
  const TAU = Math.PI * 2;
  const wave = (tSec, period, phase) => 0.5 + 0.5 * Math.sin((tSec / period + phase) * TAU);
  const swing = (tSec, period, phase) => Math.sin((tSec / period + phase) * TAU);  // -1 → 1
  // 周期更短 → 更快更躁（七通道）
  const Pw = 3.0, Pz = 3.8, Px = 2.6, Py = 4.2, Pr = 3.4, Pd = 2.2, Pk = 3.6;
  let fi = -1, nextSwitch = start + 6000;   // 首次切换更晚，先让画面沉下来
  const applyFont = (idx) => {
    fi = idx;
    document.body.style.setProperty("--live-font", FONTS[idx].name);
    view.style.opacity = "0.72";             // 更轻的淡出 → 溶解更柔和
    requestAnimationFrame(() => { view.style.opacity = "1"; });
  };
  applyFont(0);
  const frame = (now) => {
    if (now >= nextSwitch) {
      let n; do { n = Math.floor(Math.random() * FONTS.length); } while (n === fi);
      applyFont(n);
      nextSwitch = now + 9000 + Math.random() * 7000;   // 切换更从容：9–16s
    }
    const tSec = (now - start) / 1000;
    const extra = FONTS[fi].extra ? `, ${FONTS[fi].extra}` : "";
    for (const s of liveEls) {
      const w  = 100 + 800 * wave(tSec * s.fw, Pw, s.pw);            // 字重 100 → 900（全幅）
      const z  = 0.55 + 1.65 * wave(tSec * s.fz, Pz, s.pz);         // 整体字号缩放 0.55 → 2.20（极端）
      const sx = z * (0.70 + 0.70 * wave(tSec * s.fx, Px, s.px));   // 叠加横向拉伸
      const sy = z * (0.70 + 0.70 * wave(tSec * s.fy, Py, s.py));   // 叠加纵向拉伸
      const rot = s.dir * 26 * swing(tSec * s.fr, Pr, s.pr);        // 旋转 ±26°
      const skw = s.kdir * 20 * swing(tSec * s.fk, Pk, s.pk);       // 斜切 ±20°
      const dx  = s.ax * swing(tSec * s.fd, Pd, s.pd);              // 横向漂移
      const dy  = s.ay * swing(tSec * s.fd, Pd + 0.37, s.pd);      // 纵向漂移（相位错开）
      s.el.style.fontVariationSettings = `"wght" ${w.toFixed(1)}${extra}`;
      s.el.style.transform =
        `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) skewX(${skw.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* ---------- 主页背景：可变几何图形丝滑变形（参考 pidan 风格） ----------
   用 Canvas 绘制一个持续变形的多边形/椭圆图形，在 hero 背景中缓慢呼吸、旋转、漂移，
   并在不同基础形状（椭圆 / 圆形 / 四边形 / 梯形 / 平行四边形 / 五边形 / 六边形 / 鹅卵石形 / 花瓣形 / 圆角矩形）
   之间丝滑过渡。颜色随形状变化而切换（柔和低饱和色系）。 */
const MORPH_VERTICES = 120;   // 所有形状统一采样点数 → 变形时逐点插值、绝对平滑
const SHAPES = [
  /* 0: 椭圆 */ (n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = 1 - 0.06 * Math.sin(a * 3);   // 微微不规则
    return { x: 0.5 + 0.38 * r * Math.cos(a), y: 0.5 + 0.28 * r * Math.sin(a) };
  }),
  /* 1: 圆形 */ (n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { x: 0.5 + 0.34 * Math.cos(a), y: 0.5 + 0.34 * Math.sin(a) };
  }),
  /* 2: 四边形（正方形）*/ (n) => {
    const c = [{ x: 0.18, y: 0.18 }, { x: 0.82, y: 0.18 }, { x: 0.82, y: 0.82 }, { x: 0.18, y: 0.82 }];
    return Array.from({ length: n }, (_, i) => {
      const t = i / n, e = t * 4, s = Math.floor(e), f = e - s;
      const a = c[s], b = c[(s + 1) % 4];
      const ease = f * f * (3 - 2 * f);
      return { x: a.x + (b.x - a.x) * ease, y: a.y + (b.y - a.y) * ease };
    });
  },
  /* 3: 梯形（上窄下宽）*/ (n) => {
    const c = [{ x: 0.35, y: 0.14 }, { x: 0.65, y: 0.14 }, { x: 0.90, y: 0.84 }, { x: 0.10, y: 0.84 }];
    return Array.from({ length: n }, (_, i) => {
      const t = i / n, e = t * 4, s = Math.floor(e), f = e - s;
      const a = c[s], b = c[(s + 1) % 4];
      const ease = f * f * (3 - 2 * f);
      return { x: a.x + (b.x - a.x) * ease, y: a.y + (b.y - a.y) * ease };
    });
  },
  /* 4: 平行四边形（倾斜）*/ (n) => {
    const c = [{ x: 0.30, y: 0.16 }, { x: 0.70, y: 0.16 }, { x: 0.85, y: 0.84 }, { x: 0.45, y: 0.84 }];
    return Array.from({ length: n }, (_, i) => {
      const t = i / n, e = t * 4, s = Math.floor(e), f = e - s;
      const a = c[s], b = c[(s + 1) % 4];
      const ease = f * f * (3 - 2 * f);
      return { x: a.x + (b.x - a.x) * ease, y: a.y + (b.y - a.y) * ease };
    });
  },
  /* 5: 五边形 */ (n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = 0.36 + 0.03 * Math.sin(a * 5);
    return { x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) };
  }),
  /* 6: 六边形 */ (n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = 0.36 + 0.02 * Math.sin(a * 6);
    return { x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) };
  }),
  /* 7: 鹅卵石形（柔和有机 blob）*/ (n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = 0.30 + 0.08 * Math.sin(a * 2 + 0.4) + 0.05 * Math.sin(a * 3.7) + 0.03 * Math.cos(a * 5.1);
    return { x: 0.5 + r * Math.cos(a), y: 0.5 + r * 0.88 * Math.sin(a) };
  }),
  /* 8: 有机 blob（不规则）*/ (n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = 0.30 + 0.10 * Math.sin(a * 2.3) + 0.06 * Math.sin(a * 5.7) + 0.04 * Math.cos(a * 3.1);
    return { x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) * 0.85 };
  }),
  /* 9: 花瓣形（五瓣花）*/ (n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = 0.26 + 0.13 * Math.cos(a * 5);   // cos(5a) → 五瓣
    return { x: 0.5 + r * Math.cos(a), y: 0.5 + r * 0.92 * Math.sin(a) };
  }),
  /* 10: 圆角矩形（胖椭圆）*/ (n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rx = 0.38 * (1 + 0.08 * Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.5));
    const ry = 0.28 * (1 + 0.08 * Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.5));
    return { x: 0.5 + rx * Math.cos(a), y: 0.5 + ry * Math.sin(a) };
  }),
];
// 配色：柔和低饱和色系 + 复古色系混合（颜色与形状解耦，每次变形随机取色，过渡丝滑）
const PALETTE = [
  // —— 柔和色（延续之前的 low-saturation 基调）——
  [232, 196, 168],   // 暖杏
  [244, 208, 152],   // 柠黄
  [220, 182, 202],   // 淡紫
  [178, 212, 198],   // 青绿
  [166, 200, 230],   // 天蓝
  [204, 172, 188],   // 玫粉
  [186, 206, 184],   // 鼠尾草绿
  [240, 196, 178],   // 桃粉
  [150, 202, 206],   // 雾青
  // —— 复古色（新加入：低饱和、带年代感的暖/冷灰调）——
  [196, 119, 96],    // 赤陶 terracotta
  [201, 165, 86],    // 芥末黄 mustard
  [142, 170, 184],   // 雾蓝 dusty blue
  [120, 168, 162],   // 复古青 faded teal
  [178, 96, 70],     // 锈红 rust
  [160, 158, 110],   // 橄榄 olive
  [183, 105, 92],    // 砖红 brick
  [236, 224, 196],   // 奶油 cream
  [206, 148, 150],   // 复古玫瑰 muted rose
  [120, 150, 128],   // 复古墨绿 vintage green
  [206, 122, 76],    // 焦橙 burnt orange
  [156, 130, 158],   // 复古紫 dusty plum
  [220, 150, 130],   // 复古珊瑚 faded coral
  // —— 高饱和撞色（朋克 / 叛逆感：偶尔炸出，与柔和复古基调强烈对冲）——
  [255, 46, 136],    // 荧光粉 hot pink
  [32, 64, 255],     // 电光蓝 electric blue
  [160, 230, 0],     // 酸性绿 acid green
  [255, 232, 0],     // 荧光黄 neon yellow
  [224, 24, 40],     // 血红 blood red
  [150, 28, 230],    // 电光紫 electric purple
  [255, 92, 0],      // 烈焰橙 blaze orange
  [0, 226, 214],     // 霓虹青 neon cyan
  [232, 0, 162],     // 品红 magenta
];
const pickColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

function morphShape() {
  const canvas = document.getElementById("morphCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // ---- 尺寸自适应 ----
  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  // ---- 预计算所有形状的顶点数组 ----
  const shapePts = SHAPES.map((fn) => fn(MORPH_VERTICES));

  // 变形池：以圆形(1) / 椭圆(0) 为主，blob(8) 出现频率低（约 1/9）
  const POOL = [0, 0, 0, 0, 1, 1, 1, 1, 8];

  // ---- 状态 ----
  let fromIdx = POOL[0], toIdx = POOL[1];
  let morphT = 0;                    // 0→1 当前变形进度
  const morphDur = 8000;             // 单次变形耗时 ms（优雅丝滑）
  const holdDur = 5000;              // 到达后停留 ms
  let phase = "morph";               // "morph" | "hold"
  let phaseStart = performance.now();
  // 图形自身的缓慢运动（旋转 / 缩放 / 位移）
  let rot = 0, rotSpd = (Math.random() - 0.5) * 0.0004;   // 旋转更慢
  let baseScale = 0.42 + Math.random() * 0.16;   // 占屏幕比例（整体缩小）
  let scalePhase = Math.random() * Math.PI * 2;
  let ox = 0.50 + (Math.random() - 0.5) * 0.16;  // 中心 X 偏移
  let oy = 0.50 + (Math.random() - 0.5) * 0.12;  // 中心 Y 偏移
  // 颜色状态（与形状解耦，每次变形随机取色）
  let fromCol = pickColor();
  let toCol = pickColor(); while (toCol === fromCol) toCol = pickColor();

  const smoother = (x) => x * x * x * (x * (x * 6 - 15) + 10);

  // ---- 插值两个顶点数组 ----
  function lerpPts(a, b, t) {
    const st = smoother(t);         // 非线性缓动 → 两端慢中间快
    const out = new Array(a.length);
    for (let i = 0; i < a.length; i++)
      out[i] = { x: a[i].x + (b[i].x - a[i].x) * st, y: a[i].y + (b[i].y - a[i].y) * st };
    return out;
  }

  // ---- 插值两色（RGB） ----
  function lerpColor(c1, c2, t) {
    const s = smoother(t);
    return [c1[0] + (c2[0] - c1[0]) * s, c1[1] + (c2[1] - c1[1]) * s, c1[2] + (c2[2] - c1[2]) * s];
  }

  // ---- 绘制单帧 ----
  function draw(pts, col, rotVal, sc, cx, cy) {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(cx * W, cy * H);
    ctx.rotate(rotVal);
    ctx.scale(sc * Math.min(W, H), sc * Math.min(W, H));
    ctx.beginPath();
    ctx.moveTo((pts[0].x - 0.5) * 1.9, (pts[0].y - 0.5) * 1.9);
    for (let i = 1; i < pts.length; i++)
      ctx.lineTo((pts[i].x - 0.5) * 1.9, (pts[i].y - 0.5) * 1.9);
    ctx.closePath();
    // 暗色模式下降低亮度
    const isDark = document.documentElement.classList.contains("dark");
    const mul = isDark ? 0.55 : 1;
    ctx.fillStyle = `rgb(${(col[0]*mul)|0}, ${(col[1]*mul)|0}, ${(col[2]*mul)|0})`;
    ctx.fill();
    ctx.restore();
  }

  // ---- 动画循环 ----
  const frame = (now) => {
    const elapsed = now - phaseStart;

    if (phase === "morph") {
      morphT = Math.min(elapsed / morphDur, 1);
      if (morphT >= 1) {
        phase = "hold";
        phaseStart = now;
        fromIdx = toIdx;
      }
    } else {
      // hold 结束 → 从变形池中选下一个目标形状（椭圆/圆为主，blob 低频）
      if (elapsed >= holdDur) {
        do { toIdx = POOL[Math.floor(Math.random() * POOL.length)]; } while (toIdx === fromIdx);
        phase = "morph";
        phaseStart = now;
        morphT = 0;
        // 换形状时同步挑新颜色（与形状解耦，过渡丝滑）
        fromCol = toCol;
        do { toCol = pickColor(); } while (toCol === fromCol);
        // 换形状时随机调整运动参数（更小、更慢）
        rotSpd = (Math.random() - 0.5) * 0.0005;
        baseScale = 0.40 + Math.random() * 0.16;
        ox = 0.50 + (Math.random() - 0.5) * 0.14;
        oy = 0.50 + (Math.random() - 0.5) * 0.12;
      }
    }

    // 图形自身缓慢运动
    rot += rotSpd * 16.67;           // ~60fps 等价
    scalePhase += 0.0004;            // 呼吸更缓
    const breathSc = baseScale * (0.94 + 0.10 * Math.sin(scalePhase));

    // 计算当前帧的顶点与颜色（颜色与形状解耦，跟随变形过渡）
    const curPts = lerpPts(shapePts[fromIdx], shapePts[toIdx], morphT);
    const curCol = lerpColor(fromCol, toCol, morphT);

    draw(curPts, curCol, rot, breathSc, ox, oy);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* ---------- 内容覆盖：后台管理可编辑 ----------
   站点内容默认来自 data.js 的全局数组；后台（admin.html）把编辑结果写入
   localStorage('iw-content')，这里在渲染前合并：先读部署用的 content.json（如有），
   再叠加本地后台的 localStorage 覆盖（最新本地编辑优先）。 */
function mergeContent(ov) {
  if (!ov) return;
  if (ov.pages) {                         // 栏目级信息（标题/说明 中英文）覆盖
    for (const k in ov.pages) {
      if (!SECTIONS[k]) continue;
      const pg = ov.pages[k];
      if (pg.title) {
        SECTIONS[k].title.zh = pg.title.zh ?? SECTIONS[k].title.zh;
        SECTIONS[k].title.en = pg.title.en ?? SECTIONS[k].title.en;
      }
      if (pg.intro) {
        SECTIONS[k].intro.zh = pg.intro.zh ?? SECTIONS[k].intro.zh;
        SECTIONS[k].intro.en = pg.intro.en ?? SECTIONS[k].intro.en;
      }
    }
  }
  // 仅当后台覆盖数组非空时才替换默认值（空数组 [] 在 JS 里为 truthy，
  // 若 localStorage 中某栏目被存成空数组会误清空真实内容，故用 .length 守卫）
  const REPLACE = [
    ["news",      NEWS],
    ["music",     RELEASES],
    ["artists",   ARTISTS],
    ["reviews",   REVIEWS],
    ["blog",      BLOG],
    ["merch",     SHOP],
    ["about",     ABOUT],
    ["photobooks",PHOTOBOOKS],
  ];
  for (const [key, target] of REPLACE) {
    if (Array.isArray(ov[key]) && ov[key].length) {
      target.length = 0;
      target.push(...ov[key]);
    }
  }
}
async function loadContent() {
  // 1) 部署用 content.json（若仓库根存在）
  try {
    const r = await fetch("content.json", { cache: "no-store" });
    if (r.ok) mergeContent(await r.json());
  } catch { /* 本地无 content.json 时忽略 */ }
  // 2) 本地后台实时覆盖（优先，走 IndexedDB，回退 localStorage）
  try {
    const ov = await iwStore.get("iw-content");
    if (ov) mergeContent(ov);
  } catch { /* 解析失败忽略 */ }
}

/* ---------- 启动 ---------- */
async function init() {
  injectFonts();        // 确保所有页面（含子页面）加载 10 款字体
  injectHeader();
  injectFooter();
  applyTheme();
  await loadContent();  // 渲染前合并后台/部署内容
  applyLang();          // 含 renderPage() → 标记 .live 元素
  animateHero();
  // 注意：animateLive()（子页面全局文字动效）已按需求关闭，动画仅保留在主页（hero 逐字母 + 背景图形）
  morphShape();         // 主页背景可变几何图形

  // ARTS 网格单元点击 → 弹出详情浮层 / 摄影集卡片 → 弹出画廊（事件委托，语言切换重建 DOM 后依然有效）
  document.addEventListener("click", (e) => {
    const card = e.target.closest('.card[data-release]');
    if (card) { openDetail(+card.dataset.release); return; }
    const pc = e.target.closest('.card[data-photobook]');
    if (pc) { openPhotobook(+pc.dataset.photobook); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeDetail(); closePhotobook(); closeGallery(); return; }
    // 画廊开启时，←/→ 翻页（不拦截输入框内的方向键，但这里子页无输入框，且画廊无焦点输入）
    if (document.getElementById("galleryModal") && document.getElementById("galleryModal").classList.contains("open")) {
      if (e.key === "ArrowLeft")  { e.preventDefault(); stepGallery(-1); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); stepGallery(1); return; }
    }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches('.card[data-release]')) {
      e.preventDefault(); openDetail(+e.target.dataset.release); return;
    }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches('.card[data-photobook]')) {
      e.preventDefault(); openPhotobook(+e.target.dataset.photobook);
    }
    // 分页输入框：回车跳转，并限制在 1..totalPages 范围
    if (e.key === "Enter" && e.target.classList.contains("page-current")) {
      e.preventDefault();
      const input = e.target;
      const p = parseInt(input.value, 10);
      const max = parseInt(input.max, 10) || 1;
      const min = parseInt(input.min, 10) || 1;
      if (!Number.isFinite(p)) return;
      const clamped = Math.max(min, Math.min(max, p));
      location.href = `?p=${clamped}`;
    }
  });
  // 分页输入框：失焦/手动 change 也跳转
  document.addEventListener("change", (e) => {
    if (!e.target.classList.contains("page-current")) return;
    const input = e.target;
    const p = parseInt(input.value, 10);
    const max = parseInt(input.max, 10) || 1;
    const min = parseInt(input.min, 10) || 1;
    if (!Number.isFinite(p)) return;
    const clamped = Math.max(min, Math.min(max, p));
    location.href = `?p=${clamped}`;
  });
}
document.addEventListener("DOMContentLoaded", init);
