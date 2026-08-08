/* =========================================================
   厂牌官网 · 内容数据
   改文字/加作品只动这个文件。
   品牌：idlework Records（中文名 夜航唱片，可改）
   ========================================================= */

const LABEL = {
  name: "idlework Records",
  nameZh: "夜航唱片",
  founded: 2019,
  email: "hello@idlework.fm",
  social: [
    { name: "Bandcamp", url: "#" },
    { name: "微信公众号", url: "#" },
    { name: "Instagram", url: "#" },
  ],
};

/* ---------- 发行目录 / 音乐 / 商店 共用 ---------- */
const RELEASES = [
  { title: "潮汐之间", artist: "林晚", year: 2024, format: "黑胶 LP", cover: ["#1f3b57", "#3f7cac"], listen: "#", desc: "海风、失真吉他与半夜的私密独白。" },
  { title: "夜行电车", artist: "陈屿", year: 2023, format: "磁带 Cassette", cover: ["#2b2b2b", "#c2562f"], listen: "#", desc: "城市深夜采样拼贴成的流动声景。" },
  { title: "未命名房间", artist: "苏野", year: 2023, format: "CD", cover: ["#4a3b2a", "#a9853f"], listen: "#", desc: "一把吉它、一支口琴与一整年的沉默。" },
  { title: "南方来信", artist: "群星合辑", year: 2022, format: "黑胶 + 数字", cover: ["#3a2b4a", "#7d5ba6"], listen: "#", desc: "七位朋友，七封寄自南方的声音信。" },
];

/* ---------- 摄影集（创造力页的「摄影集」部分，点开可逐张浏览） ---------- */
const PHOTOBOOKS = [
  { title: "示例摄影集", artist: "某某", year: "2024", format: "纸质书", cover: "", photos: [], desc: "在后台「摄影集」栏目填写艺术家、格式与简介，上传多张照片后即可在创造力页面展示。" },
];

const ARTISTS = [
  { name: "林晚", role: "主唱 / 吉他", bio: "在阳台上写歌的人，相信旋律是记忆的另一种写法。", avatar: ["#1f3b57", "#3f7cac"] },
  { name: "陈屿", role: "电子 / 采样", bio: "收集城市噪音，再把它变成可以跳舞的东西。", avatar: ["#2b2b2b", "#c2562f"] },
  { name: "苏野", role: "民谣 / 口琴", bio: "一年只说几句真话，其余都写进了歌里。", avatar: ["#4a3b2a", "#a9853f"] },
  { name: "周牧", role: "贝斯 / 制作", bio: "把所有人的毛边都缝起来的那双手。", avatar: ["#3a2b4a", "#7d5ba6"] },
];

const SHOP = [
  { title: "潮汐之间", format: "黑胶 LP", price: 188, status: "现货", buy: "#" },
  { title: "夜行电车", format: "磁带 Cassette", price: 88, status: "预订", buy: "#" },
  { title: "未命名房间", format: "CD", price: 68, status: "现货", buy: "#" },
  { title: "南方来信", format: "黑胶 + 数字", price: 168, status: "售罄", buy: "#" },
];

/* ---------- 占位内容（NEWS / REVIEWS / BLOG） ---------- */
const NEWS = [
  { date: "2026.07.20", title: "《潮汐之间》黑胶第二批压片完成", summary: "首批 200 张已售罄，第二批预计八月发货。", body: "首批 200 张已售罄，第二批预计八月发货。" },
  { date: "2026.06.02", title: "陈屿「夜行电车」磁带限定版补货", summary: "新增 50 卷透明磁带，附手绘内页。", body: "新增 50 卷透明磁带，附手绘内页。" },
  { date: "2026.04.18", title: "厂牌成立七周年小型现场", summary: "七月将在城郊旧仓库举办一场不公开售票的聚会。", body: "七月将在城郊旧仓库举办一场不公开售票的聚会。" },
];

const REVIEWS = [
  { date: "2026.05.15", from: "地下声景", title: "《夜行电车》：把城市的噪音听成了歌", summary: "采样拼贴克制而真诚，是今年最值得静下来听的一卷磁带。", body: "采样拼贴克制而真诚，是今年最值得静下来听的一卷磁带。" },
  { date: "2026.02.20", from: "独立唱片观察", title: "《南方来信》：七封信，七种南方", summary: "合辑的编排像一封长信，温柔处有锋利。", body: "合辑的编排像一封长信，温柔处有锋利。" },
];

const BLOG = [
  { date: "2026.05.10", title: "我们为什么坚持手工装配唱片", summary: "关于一台老式刻片机、丝网印刷，和「数量有限」这件事。", body: "关于一台老式刻片机、丝网印刷，和「数量有限」这件事。" },
  { date: "2026.03.22", title: "卧室录音的一年", summary: "设备清单、踩过的坑，以及那些意外好听的错误。", body: "设备清单、踩过的坑，以及那些意外好听的错误。" },
];

/* ---------- 关于厂牌（ABOUT） ---------- */
const ABOUT = [
  {
    img: "",
    body: [
      { type: "text", value: "idlework Records 是一间手工制作、独立发行朋友间音乐的小厂牌。我们相信唱片不只是声音，更是一段可以被握在手里的时间。" },
      { type: "text", value: "从刻片、丝网印刷到手工装配，我们尽量把每一道工序留在这间小小的工作室里完成。数量有限，是因为我们更在乎每一次相遇的质量，而非数量。" },
      { type: "text", value: "这里收录的，是林晚、陈屿、苏野、周牧，以及更多朋友的声音。如果你也愿意把歌写进黑胶，欢迎写信给我们。" },
    ],
    bodyEn: [
      { type: "text", value: "idlework Records is a small label that makes and independently releases music by friends. To us, a record is not just sound — it is a piece of time you can hold in your hands." },
      { type: "text", value: "From cutting and screen-printing to hand-assembly, we keep as much of the process as possible inside this little studio. Editions are limited, because we care more about the quality of each encounter than about scale." },
      { type: "text", value: "Here you will find the voices of Lin Wan, Chen Yu, Su Ye, Zhou Mu, and more friends. If you too would like to press your songs onto vinyl, write to us." },
    ],
  },
];

/* ---------- 各子页面文案（中英） ---------- */
const SECTIONS = {
  about:   { kind: "about",  items: ABOUT,
    title: { zh: "关于", en: "About" },
    intro: { zh: "关于 idlework 唱片。", en: "About idlework Records." } },
  news:    { kind: "list",   items: NEWS,
    title: { zh: "动态", en: "News" },
    intro: { zh: "厂牌近况、发行与现场。", en: "Label updates, releases and shows." } },
  music:   { kind: "release", items: RELEASES, photobooks: PHOTOBOOKS,
    title: { zh: "创造力", en: "Arts" },
    intro: { zh: "我们手工发行的声音，可试听与购买。", en: "Sounds we release by hand — listen and buy." } },
  artists: { kind: "artist", items: ARTISTS,
    title: { zh: "音乐人", en: "Artists" },
    intro: { zh: "厂牌背后的朋友与他们的角色。", en: "The friends behind the label and what they do." } },
  reviews: { kind: "list",   items: REVIEWS,
    title: { zh: "乐评", en: "Reviews" },
    intro: { zh: "媒体与乐迷写下的字。", en: "Words from press and listeners." } },
  blog:    { kind: "list",   items: BLOG,
    title: { zh: "博客", en: "Blog" },
    intro: { zh: "关于制作、设备与厂牌的一些碎想。", en: "Notes on making, gear and the label." } },
  merch:   { kind: "shop",   items: SHOP,
    title: { zh: "周边", en: "Merch" },
    intro: { zh: "实体唱片与限量周边，售完即止。", en: "Physical records and limited goods. While stocks last." } },
};

/* ---------- 界面文案（中英切换用） ---------- */
const I18N = {
  zh: {
    tagline: "手工制作 · 独立发行 · 朋友的音乐",
    navHint: "导航",
    theme: "日间 / 夜间",
    lang: "EN",
    footer: "手工制作 · 独立发行 · 数量有限 售完即止",
    back: "返回主页",
    photoBooks: "摄影集",
    listen: "试听",
    viewAll: "查看全部",
    noPhotos: "暂无照片",
    buy: "购买",
    status: { "现货": "现货", "预订": "预订", "售罄": "售罄" },
  },
  en: {
    tagline: "Handmade · Independently released · Music by friends",
    navHint: "Menu",
    theme: "Light / Dark",
    lang: "中",
    footer: "Handmade · Independently released · Limited, while stocks last",
    back: "Back home",
    photoBooks: "Photo Books",
    listen: "Listen",
    viewAll: "View all",
    noPhotos: "No photos yet",
    buy: "Buy",
    status: { "现货": "In stock", "预订": "Pre-order", "售罄": "Sold out" },
  },
};

/* =========================================================
   富文本白名单净化（后台保存与前台渲染共用）
   - 允许 b/strong/i/em/u/br/p/span(保留 color 与 font-size)/font(color/size) 这类标签
   - 剥离 script/style/iframe 等危险标签与主元素的 on* 事件、javascript: 链接
   - 纯文本（不含标签）会安全转义，并把 \n 转为 <br>
   - 依赖浏览器 DOM（DOMParser / document），仅在页面运行，不在 Node 下使用
   ========================================================= */

/* execCommand("fontSize") 的 size 属性 → px 映射（供字号工具 fallback 使用）
   与后台 RT_FONT_SIZES 的 cmd 索引一一对应：1=6px 特小 / 2=10px 小 / 3=14px 默认 / 4=16px 大 / 5=24px 特大 */
const RT_FONT_SIZE_MAP = { "1": "6px", "2": "10px", "3": "14px", "4": "16px", "5": "24px", "6": "28px", "7": "32px" };

function sanitizeRich(html) {
  if (typeof html !== "string") return "";
  const s = html.trim();
  if (!s) return "";
  // 纯文本：按 \n\n 分段为 <p>，保留空行；单换行转 <br>
  if (!/<[a-z][\s\S]*>/i.test(s)) {
    const d = document.createElement("div");
    const parts = s.split(/\n\n/);
    return parts.map((part) => {
      d.textContent = part;
      const inner = d.innerHTML.replace(/\n/g, "<br>");
      return `<p>${inner}</p>`;
    }).join("");
  }
  // 富文本：DOMParser 解析后白名单清洗
  const doc = new DOMParser().parseFromString("<div>" + s + "</div>", "text/html");
  const ALLOW = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, BR: 1, P: 1, DIV: 1, SPAN: 1, FONT: 1, IMG: 1 };
  const safeStyle = (n, el, tag) => {
    const st = n.style;
    if (!st) return;
    const c = st.color || "";
    const bg = st.backgroundColor || "";
    const fs = st.fontSize || "";
    const ta = st.textAlign || "";
    if (c) el.style.color = c;
    if (bg) el.style.backgroundColor = bg;
    if (fs) el.style.fontSize = fs;
    if ((tag === "P" || tag === "DIV") && ta) el.style.textAlign = ta;
  };
  const walk = (node, parent) => {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) { parent.appendChild(document.createTextNode(n.nodeValue)); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName;
      if (!ALLOW[tag]) { walk(n, parent); return; }   // 不允许的标签：降级保留其子节点
      const el = document.createElement(tag);
      safeStyle(n, el, tag);
      if (tag === "FONT") {
        const c = n.getAttribute("color");
        const size = n.getAttribute("size");
        if (c) el.setAttribute("color", c);
        if (size && RT_FONT_SIZE_MAP[size]) el.style.fontSize = RT_FONT_SIZE_MAP[size];
      } else if (tag === "IMG") {
        const src = n.getAttribute("src");
        const alt = n.getAttribute("alt") || "";
        if (src) el.setAttribute("src", src);
        if (alt) el.setAttribute("alt", alt);
        el.style.maxWidth = "100%";
      } else if (tag === "P" || tag === "DIV") {
        const align = n.getAttribute("align");
        if (align && /^(left|center|right|justify)$/.test(align)) el.setAttribute("align", align);
      }
      walk(n, el);
      parent.appendChild(el);
    });
  };
  const out = document.createElement("div");
  walk(doc.body.firstChild || doc.body, out);
  return out.innerHTML;
}
