import fs from "node:fs/promises";
import path from "node:path";

const SITE = "https://h6rd.github.io/Dota2PornFxWeb/";
const BRAND = "Dota2PornFx";
const ALIAS = "D2PFX";
const DATA_DIR = path.join("assets", "data");
const OUT_DIR = ".";
const SITEMAP_PATH = "sitemap.xml";
const INDEX_PATH = "index.html";
const MARKER = "<!--SEO_CATEGORY_LINKS-->";
const MAX_LIST_ITEMS = 1000;
const MAX_JSONLD_ITEMS = 100;
const MAX_IMAGES = 120;

const today = new Date().toISOString().slice(0, 10);

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const stripTags = (s) => String(s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const titleCase = (id) =>
  id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const PLAIN_CATEGORIES = new Set(["tools", "guides", "sites", "packs", "ti-bp-effects"]);

const categoryLabel = (cat) => `Dota 2 ${cat.title}${PLAIN_CATEGORIES.has(cat.id) ? "" : " mods"}`;

const sentence = (text) => {
  const t = String(text ?? "").trim();
  return t && !/[.!?…]$/.test(t) ? `${t}.` : t;
};

const encodePath = (p) => p.split("/").map(encodeURIComponent).join("/");

const isoDate = (unixSeconds) => new Date(unixSeconds * 1000).toISOString().slice(0, 10);

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, file), "utf8"));
  } catch (e) {
    console.warn(`[seo] cannot read ${file}: ${e.message}`);
    return fallback;
  }
}

function resolveTranslations(constants) {
  const t = constants?.translations;
  if (!t || typeof t !== "object") return {};
  if (t.en && typeof t.en === "object") return t.en;
  return t;
}

function collectMods(categoryData) {
  if (!categoryData) return [];
  if (Array.isArray(categoryData)) return categoryData.filter((m) => m && typeof m === "object");
  if (Array.isArray(categoryData.groups)) {
    return categoryData.groups.flatMap((g) => (Array.isArray(g.mods) ? g.mods : []));
  }
  return [];
}

function safeId(id) {
  return /^[a-z0-9][a-z0-9-]*$/i.test(id) ? id : null;
}

function pageFileName(id) {
  return `category-${id}.html`;
}

function modLink(id, name) {
  return `./?category=${encodeURIComponent(id)}&amp;mod=${encodeURIComponent(name)}`;
}

function renderCategoryPage(cat, mods, allCats) {
  const url = SITE + pageFileName(cat.id);
  const visibleMods = mods.filter((m) => !m.tags?.adult && m.name);
  const catName = cat.title;
  const label = categoryLabel(cat);
  const plain = PLAIN_CATEGORIES.has(cat.id);
  const pageTitle = plain
    ? `${label} | ${BRAND} (${ALIAS})`
    : `Dota 2 ${catName} Mods – Free Download | ${BRAND} (${ALIAS})`;

  const baseDesc = cat.description
    ? `${sentence(cat.description)} `
    : `Free community-made Dota 2 ${catName.toLowerCase()}. `;
  const description = `${baseDesc}Browse ${visibleMods.length || mods.length} items on ${BRAND} (${ALIAS}).`
    .replace(/\s+/g, " ")
    .slice(0, 300);

  const listed = visibleMods.slice(0, MAX_LIST_ITEMS);

  const items = listed
    .map((m, i) => {
      const preview = typeof m.preview === "string" ? m.preview : "";
      const isImage = preview && !/\.(mp4|webm)$/i.test(preview) && !/^https?:/i.test(preview);
      const previewPath = preview.startsWith("assets/previews/")
        ? preview
        : `assets/previews/${cat.id}/${preview}`;
      const img =
        isImage && i < MAX_IMAGES
          ? `<img src="${esc(encodePath(previewPath))}" alt="${esc(m.name)} – Dota 2 ${esc(catName)} mod" loading="lazy" decoding="async" width="320" height="180">`
          : "";
      return `<li><a href="${modLink(cat.id, m.name)}">${img}<span>${esc(m.name)}</span></a></li>`;
    })
    .join("\n      ");

  const otherLinks = allCats
    .filter((c) => c.id !== cat.id)
    .map((c) => `<a href="${pageFileName(c.id)}">${esc(c.title)}</a>`)
    .join(" ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: BRAND, item: SITE },
          { "@type": "ListItem", position: 2, name: label, item: url },
        ],
      },
      {
        "@type": "CollectionPage",
        name: label,
        url,
        description: stripTags(description),
        isPartOf: { "@type": "WebSite", name: BRAND, alternateName: ALIAS, url: SITE },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: listed.length,
          itemListElement: listed.slice(0, MAX_JSONLD_ITEMS).map((m, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: m.name,
            url: `${SITE}?category=${encodeURIComponent(cat.id)}&mod=${encodeURIComponent(m.name)}`,
          })),
        },
      },
    ],
  };

  const empty = listed.length === 0 ? `<p>No mods available in this category yet.</p>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${url}">
  <link rel="icon" href="assets/favicon.ico" type="image/x-icon">
  <meta name="theme-color" content="#7b00ff">
  <meta property="og:site_name" content="${BRAND}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(pageTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}assets/banner.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(pageTitle)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE}assets/banner.png">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
  <style>
    :root{--bg:#fff;--fg:#1d1b20;--muted:#625b71;--card:#f3edf7;--accent:#7b00ff}
    @media (prefers-color-scheme:dark){:root{--bg:#141218;--fg:#e6e0e9;--muted:#cac4d0;--card:#211f26;--accent:#c0ace7}}
    *{box-sizing:border-box}
    body{margin:0;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--fg);line-height:1.5}
    a{color:var(--accent)}
    .wrap{max-width:1200px;margin:0 auto;padding:24px 16px}
    header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}
    .brand{font-weight:700;font-size:1.25rem;text-decoration:none}
    .cta{display:inline-block;padding:10px 18px;border-radius:999px;background:var(--accent);color:var(--bg);text-decoration:none;font-weight:600}
    h1{margin:24px 0 4px;font-size:1.8rem}
    .lead{margin:0 0 20px;color:var(--muted)}
    ul.grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
    ul.grid a{display:block;background:var(--card);border-radius:16px;overflow:hidden;color:inherit;text-decoration:none;height:100%}
    ul.grid img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover}
    ul.grid span{display:block;padding:10px 12px;font-weight:600}
    nav.cats{margin-top:32px;color:var(--muted);display:flex;flex-wrap:wrap;gap:8px 14px}
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <a class="brand" href="./">${BRAND} <small>(${ALIAS})</small></a>
      <a class="cta" href="./?category=${encodeURIComponent(cat.id)}">Open in ${BRAND}</a>
    </header>
    <main>
      <h1>${esc(label)}</h1>
      <p class="lead">${esc(sentence(stripTags(cat.description)) || `Free community-made Dota 2 ${catName.toLowerCase()}.`)}</p>
      ${empty}
      <ul class="grid">
      ${items}
      </ul>
    </main>
    <nav class="cats" aria-label="Other categories">
      <strong>More Dota 2 mods:</strong> ${otherLinks}
    </nav>
  </div>
</body>
</html>
`;
}

function renderSitemap(entries) {
  const body = entries
    .map(
      (e) => `  <url>
    <loc>${esc(e.loc)}</loc>
    <lastmod>${e.lastmod}</lastmod>
  </url>`
    )
    .join("\n\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${body}

</urlset>
`;
}

async function injectNoscriptLinks(cats) {
  let html;
  try {
    html = await fs.readFile(INDEX_PATH, "utf8");
  } catch {
    console.warn(`[seo] ${INDEX_PATH} not found, skipping noscript links`);
    return;
  }
  if (!html.includes(MARKER)) {
    console.warn(`[seo] marker ${MARKER} not found in ${INDEX_PATH}, skipping noscript links`);
    return;
  }
  const links = cats
    .map((c) => `<li><a href="${pageFileName(c.id)}">${esc(categoryLabel(c))}</a></li>`)
    .join("");
  html = html.replace(MARKER, `<nav aria-label="Mod categories"><ul>${links}</ul></nav>`);
  await fs.writeFile(INDEX_PATH, html);
  console.log(`[seo] injected ${cats.length} category links into ${INDEX_PATH}`);
}

async function main() {
  const constants = await readJson("constants.json", {});
  const modsJson = await readJson("mods.json", {});
  const translations = resolveTranslations(constants);
  const modsData = modsJson.modsData || {};
  const rawCategories = Array.isArray(constants.categories) ? constants.categories : [];

  const cats = [];
  for (const c of rawCategories) {
    if (!c || c.hidden) continue;
    const id = safeId(String(c.id ?? ""));
    if (!id) continue;
    const mods = collectMods(modsData[id]);
    if (mods.length === 0) continue;
    const key = c.key || id;
    const title = stripTags(translations[key]) || titleCase(id);
    const description = stripTags(translations[`${key}-desc`]);
    const newest = Math.max(0, ...mods.map((m) => Number(m.meta?.date) || 0));
    cats.push({ id, title, description, mods, lastmod: newest ? isoDate(newest) : today });
  }

  if (cats.length === 0) {
    console.warn("[seo] no categories resolved from constants.json/mods.json - writing base sitemap only");
  }

  for (const cat of cats) {
    const html = renderCategoryPage(cat, cat.mods, cats);
    await fs.writeFile(path.join(OUT_DIR, pageFileName(cat.id)), html);
  }
  console.log(`[seo] wrote ${cats.length} category page(s)`);

  const entries = [
    { loc: SITE, lastmod: today },
    { loc: `${SITE}stats.html`, lastmod: today },
    ...cats.map((c) => ({ loc: SITE + pageFileName(c.id), lastmod: c.lastmod })),
  ];
  await fs.writeFile(SITEMAP_PATH, renderSitemap(entries));
  console.log(`[seo] wrote ${SITEMAP_PATH} with ${entries.length} url(s)`);

  await injectNoscriptLinks(cats);
}

main().catch((e) => {
  console.error(`::warning::generate-seo failed: ${e.stack || e}`);
});
