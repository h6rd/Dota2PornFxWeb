document.fonts.ready.then(() => {
  document.documentElement.classList.add('fonts-loaded');
});

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
});

const FILES_BASE_URL = (() => {
  const host = window.location.hostname;
  const localHosts = [
    'd2pfx.onrender.com',
    'd2pfx.netlify.app',
    'hrdq.codeberg.page',
    'd2pfx.vercel.app',
    '127.0.0.1',
  ];
  if (localHosts.some(h => host === h || host.endsWith('.' + h))) return '';
  return 'https://raw.githubusercontent.com/h6rd/Dota2PornFxWeb/main';
})();

const GITHUB_TOOLS = [
  { repo: 'h6rd/VPKTool', name: 'VPKTool', icon: 'bi-tools', hasLinux: true },
  { repo: 'h6rd/VPKMerge', name: 'VPKMerge', icon: 'bi-union', hasLinux: true },
  { repo: 'h6rd/Compiler', name: 'Compiler', icon: 'bi-cpu', hasLinux: true },
  { repo: 'h6rd/Patcher', name: 'Patcher', icon: 'bi-bandaid', hasLinux: true },
  { repo: 'h6rd/VPCF-Editor', name: 'VPCF Editor', icon: 'bi-palette', hasLinux: true },
];

const numberFormat = (n) => new Intl.NumberFormat('en-US').format(n);

function pct(part, total) {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function collectMods(node, out) {
  if (Array.isArray(node)) {
    node.forEach((item) => collectMods(item, out));
  } else if (node && typeof node === 'object') {
    if (Array.isArray(node.groups)) {
      node.groups.forEach((g) => collectMods(g, out));
    } else if (Array.isArray(node.mods)) {
      node.mods.forEach((m) => collectMods(m, out));
    } else if ('name' in node && 'file' in node) {
      out.push(node);
    }
  }
}

function getLinks(mod) {
  if (Array.isArray(mod.links)) return mod.links;
  if (mod.linkType && mod.linkUrl) return [{ type: mod.linkType, url: mod.linkUrl }];
  return [];
}

function getLinkNickname(link) {
  return link.name || link.url || '';
}


/* stats */
function buildStats(modsData, constants) {
  const translations = constants.translations || {};
  const categories = constants.categories || [];
  const MOD_AUTHOR = constants.MOD_AUTHOR || {};
  const MOD_SENDER = constants.MOD_SENDER || {};

  const categoryCounts = [];
  let totalMods = 0;
  let withAuthor = 0;
  let withSender = 0;
  let withSource = 0;
  let withNothing = 0;

  const authorCounts = new Map();
  const senderCounts = new Map();

  categories.forEach((cat) => {
    const raw = modsData[cat.id];
    if (!raw) return;
    const mods = [];
    collectMods(raw, mods);

    categoryCounts.push({
      id: cat.id,
      emoji: cat.emoji || '',
      label: translations[cat.key] || cat.id,
      count: mods.length,
    });

    mods.forEach((mod) => {
      totalMods += 1;
      const links = getLinks(mod);
      const types = new Set(links.map((l) => l.type));

      if (types.has('author')) {
        withAuthor += 1;
        links.filter((l) => l.type === 'author').forEach((l) => {
          const nick = getLinkNickname(l);
          if (nick) authorCounts.set(nick, (authorCounts.get(nick) || 0) + 1);
        });
      }
      if (types.has('sender')) {
        withSender += 1;
        links.filter((l) => l.type === 'sender').forEach((l) => {
          const nick = getLinkNickname(l);
          if (nick) senderCounts.set(nick, (senderCounts.get(nick) || 0) + 1);
        });
      }
      if (types.has('source')) withSource += 1;
      if (!types.has('author') && !types.has('sender') && !types.has('source')) {
        withNothing += 1;
      }
    });
  });

  const toSortedArray = (map, urlMap) =>
    [...map.entries()]
      .map(([name, count]) => ({ name, count, url: urlMap[name] || '' }))
      .sort((a, b) => b.count - a.count);

  categoryCounts.sort((a, b) => b.count - a.count);

  return {
    totalMods,
    withAuthor,
    withSender,
    withSource,
    withNothing,
    categoryCounts,
    categoriesCount: categoryCounts.length,
    authors: toSortedArray(authorCounts, MOD_AUTHOR),
    senders: toSortedArray(senderCounts, MOD_SENDER),
  };
}


/* github */
async function fetchRepoDownloads(repo) {
  let page = 1;
  let totalDownloads = 0;
  let winDownloads = 0;
  let linuxDownloads = 0;
  let releaseCount = 0;
  let assetCount = 0;

  try {
    while (page <= 5) {
      const res = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100&page=${page}`);
      if (!res.ok) {
        if (page === 1) throw new Error(`HTTP ${res.status}`);
        break;
      }
      const releases = await res.json();
      if (!Array.isArray(releases) || releases.length === 0) break;

      releaseCount += releases.length;
      releases.forEach((rel) => {
        (rel.assets || []).forEach((asset) => {
          const dl = asset.download_count || 0;
          totalDownloads += dl;
          assetCount += 1;

          const nameLower = (asset.name || '').toLowerCase();
          if (nameLower.includes('-win')) {
            winDownloads += dl;
          } else if (nameLower.includes('-linux')) {
            linuxDownloads += dl;
          } else {
            winDownloads += dl;
          }
        });
      });

      if (releases.length < 100) break;
      page += 1;
    }
    return { ok: true, totalDownloads, winDownloads, linuxDownloads, releaseCount, assetCount };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}


/* anims */
function animateNumber(el, target, duration = 900) {
  const start = 0;
  const startTime = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const value = Math.round(start + (target - start) * eased);
    el.textContent = numberFormat(value);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = numberFormat(target);
  }
  requestAnimationFrame(tick);
}

function observeAndAnimate(el, target) {
  el.dataset.target = target;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateNumber(el, Number(el.dataset.target));
        io.unobserve(el);
      }
    });
  }, { threshold: 0.2 });
  io.observe(el);
}


/* ui */
function renderHero(stats) {
  document.getElementById('heroTotalLabel').textContent = 'Total mods on the site';
  const numEl = document.getElementById('heroTotalNumber');
  observeAndAnimate(numEl, stats.totalMods);

  document.getElementById('heroCategoriesChip').innerHTML = `
    <span class="material-symbols-rounded">category</span>
    <span>
      <span class="stats-hero-chip-value">${stats.categoriesCount}</span><br>
      <span class="stats-hero-chip-label">categories</span>
    </span>`;

  document.getElementById('heroAuthorsChip').innerHTML = `
    <span class="material-symbols-rounded">person</span>
    <span>
      <span class="stats-hero-chip-value">${stats.authors.length}</span><br>
      <span class="stats-hero-chip-label">authors</span>
    </span>`;

  document.getElementById('heroSendersChip').innerHTML = `
    <span class="material-symbols-rounded">send</span>
    <span>
      <span class="stats-hero-chip-value">${stats.senders.length}</span><br>
      <span class="stats-hero-chip-label">submitters</span>
    </span>`;
}

function renderOverviewCards(stats) {
  const grid = document.getElementById('overviewGrid');
  const cards = [
    {
      icon: 'person',
      value: stats.withAuthor,
      label: 'Mods with credited author',
    },
    {
      icon: 'captive_portal',
      value: stats.withSource,
      label: 'Mods with original source link',
    },
    {
      icon: 'send',
      value: stats.withSender,
      label: 'Mods with sender submitter',
    },
    {
      icon: 'star',
      value: stats.withNothing,
      label: 'Self-made mods',
    },
  ];

  grid.innerHTML = cards.map((c) => `
    <div class="stat-card">
      <div class="stat-card-top">
        <div class="stat-card-icon">
          <span class="material-symbols-rounded">${c.icon}</span>
        </div>
        <div class="stat-card-percent">${pct(c.value, stats.totalMods)}</div>
      </div>
      <div class="stat-card-number" data-target="${c.value}">0</div>
      <div class="stat-card-label">${c.label}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.stat-card-number').forEach((el) => {
    observeAndAnimate(el, Number(el.dataset.target));
  });
}

function renderCategoryBars(stats) {
  const wrap = document.getElementById('categoryBars');
  const maxCount = stats.categoryCounts[0]?.count || 1;
  const VISIBLE_LIMIT = 10;

  wrap.innerHTML = stats.categoryCounts.map((cat, i) => `
    <div class="category-bar-row ${i >= VISIBLE_LIMIT ? 'category-bar-hidden' : ''}" data-idx="${i}">
      <div class="category-bar-label">
        <span class="category-bar-emoji">${cat.emoji}</span>
        <span>${escapeHtml(cat.label)}</span>
      </div>
      <div class="category-bar-track">
        <div class="category-bar-fill" data-width="${(cat.count / maxCount) * 100}"></div>
      </div>
      <div class="category-bar-count">${numberFormat(cat.count)}</div>
    </div>
  `).join('');

  requestAnimationFrame(() => {
    wrap.querySelectorAll('.category-bar-fill').forEach((el) => {
      el.style.width = `${el.dataset.width}%`;
    });
  });

  const toggleWrap = document.getElementById('categoryBarsToggleWrap');
  if (stats.categoryCounts.length > VISIBLE_LIMIT) {
    toggleWrap.innerHTML = `
      <button class="category-bars-toggle" id="categoryBarsToggle">
        <span>Show all categories (${stats.categoryCounts.length})</span>
        <span class="material-symbols-rounded">expand_more</span>
      </button>`;
    const btn = document.getElementById('categoryBarsToggle');
    btn.addEventListener('click', () => {
      const expanded = btn.classList.toggle('expanded');
      wrap.querySelectorAll('.category-bar-row').forEach((row) => {
        const idx = Number(row.dataset.idx);
        if (idx >= VISIBLE_LIMIT) row.classList.toggle('category-bar-hidden', !expanded);
      });
      btn.querySelector('span').textContent = expanded
        ? 'Hide'
        : `Show all categories (${stats.categoryCounts.length})`;
    });
  } else {
    toggleWrap.innerHTML = '';
  }
}

function renderLeaderboard(containerId, countId, toggleWrapId, entries, emptyText, typeLabel) {
  const list = document.getElementById(containerId);
  document.getElementById(countId).textContent = `${entries.length}`;

  if (entries.length === 0) {
    list.innerHTML = `<div class="leaderboard-empty">${emptyText}</div>`;
    document.getElementById(toggleWrapId).innerHTML = '';
    return;
  }

  const VISIBLE_LIMIT = 8;
  const maxCount = entries[0].count || 1;

  list.innerHTML = entries.map((entry, i) => {
    const rank = i + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : '';
    const isHidden = i >= VISIBLE_LIMIT;
    let rankDisplay = rank;
    if (rank === 1) {
      rankDisplay = `<m3e-shape name="sunny">${rank}</m3e-shape>`;
    } else if (rank === 2) {
      rankDisplay = `<m3e-shape name="4-sided-cookie">${rank}</m3e-shape>`;
    } else if (rank === 3) {
      rankDisplay = `<m3e-shape name="pentagon">${rank}</m3e-shape>`;
    } else {
      rankDisplay = `<m3e-shape name="square">${rank}</m3e-shape>`;
    }
    return `
      <div class="leaderboard-item ${isHidden ? 'leaderboard-item-hidden' : ''}" data-idx="${i}" data-url="${escapeHtml(entry.url || '')}">
        <div class="leaderboard-rank ${rankClass}">${rankDisplay}</div>
        <div class="leaderboard-body">
          <div class="leaderboard-name">
            ${escapeHtml(entry.name)}
            ${entry.url ? '<span class="material-symbols-rounded">open_in_new</span>' : ''}
          </div>
          <div class="leaderboard-bar-track">
            <div class="leaderboard-bar-fill" data-width="${(entry.count / maxCount) * 100}"></div>
          </div>
        </div>
        <div class="leaderboard-count">${numberFormat(entry.count)}</div>
      </div>`;
  }).join('');

  requestAnimationFrame(() => {
    list.querySelectorAll('.leaderboard-bar-fill').forEach((el) => {
      el.style.width = `${el.dataset.width}%`;
    });
  });

  list.querySelectorAll('.leaderboard-item').forEach((item) => {
    const url = item.dataset.url;
    if (url) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => window.open(url, '_blank', 'noopener'));
    }
  });

  const toggleWrap = document.getElementById(toggleWrapId);
  if (entries.length > VISIBLE_LIMIT) {
    toggleWrap.innerHTML = `
      <button class="leaderboard-toggle-btn" id="${containerId}Toggle">
        <span>Show all ${typeLabel} (${entries.length})</span>
        <span class="material-symbols-rounded">expand_more</span>
      </button>`;

    const btn = document.getElementById(`${containerId}Toggle`);
    btn.addEventListener('click', () => {
      const expanded = btn.classList.toggle('expanded');
      list.querySelectorAll('.leaderboard-item').forEach((row) => {
        const idx = Number(row.dataset.idx);
        if (idx >= VISIBLE_LIMIT) {
          row.classList.toggle('leaderboard-item-hidden', !expanded);
        }
      });
      btn.querySelector('span').textContent = expanded
        ? 'Hide'
        : `Show all ${typeLabel} (${entries.length})`;
    });
  } else {
    toggleWrap.innerHTML = '';
  }
}

async function renderToolDownloads() {
  const grid = document.getElementById('toolsGrid');
  grid.innerHTML = GITHUB_TOOLS.map((tool) => `
    <a class="tool-card" href="https://github.com/${tool.repo}" target="_blank" rel="noopener" id="tool-${tool.name}">
      <div class="tool-card-head">
        <div class="tool-card-icon"><i class="bi ${tool.icon}"></i></div>
        <span class="material-symbols-rounded tool-card-open">open_in_new</span>
      </div>
      <div class="tool-card-name">${tool.name}</div>
      <div class="tool-card-number stat-skeleton">0</div>
      <div class="tool-card-sub stat-skeleton">Loading…</div>
      <div class="tool-card-platforms">
        <div class="tool-platform-row">
          <span class="tool-platform-label"><i class="bi bi-windows"></i> Windows</span>
          <span class="tool-platform-val" id="tool-${tool.name}-win">0</span>
        </div>
        ${tool.hasLinux ? `
        <div class="tool-platform-row">
          <span class="tool-platform-label"><i class="bi bi-tux"></i> Linux</span>
          <span class="tool-platform-val" id="tool-${tool.name}-linux">0</span>
        </div>` : `
        <div class="tool-platform-row" style="opacity: 0; pointer-events: none;" aria-hidden="true">
          <span class="tool-platform-label"><i class="bi bi-tux"></i> Linux</span>
          <span class="tool-platform-val">0</span>
        </div>`}
      </div>
    </a>
  `).join('');

  const combinedEl = document.getElementById('toolsCombinedValue');

  const results = await Promise.all(GITHUB_TOOLS.map((t) => fetchRepoDownloads(t.repo)));

  let combinedTotal = 0;
  let anyOk = false;

  results.forEach((result, i) => {
    const tool = GITHUB_TOOLS[i];
    const card = document.getElementById(`tool-${tool.name}`);
    const numberEl = card.querySelector('.tool-card-number');
    const subEl = card.querySelector('.tool-card-sub');
    const platformsDiv = card.querySelector('.tool-card-platforms');

    numberEl.classList.remove('stat-skeleton');
    subEl.classList.remove('stat-skeleton');

    if (result.ok) {
      anyOk = true;
      combinedTotal += result.totalDownloads;
      numberEl.textContent = '0';
      observeAndAnimate(numberEl, result.totalDownloads);
      subEl.textContent = `${numberFormat(result.releaseCount)} releases`;

      platformsDiv.style.display = 'flex';

      const winEl = document.getElementById(`tool-${tool.name}-win`);
      if (winEl) observeAndAnimate(winEl, result.winDownloads);

      if (tool.hasLinux) {
        const linuxEl = document.getElementById(`tool-${tool.name}-linux`);
        if (linuxEl) observeAndAnimate(linuxEl, result.linuxDownloads);
      }
    } else {
      numberEl.textContent = '—';
      subEl.textContent = 'Unavailable (API Rate Limit)';
    }
  });

  if (anyOk) {
    observeAndAnimate(combinedEl, combinedTotal);
  } else {
    combinedEl.textContent = '—';
  }
}


/* morphing */
function initHeroShapeMorph() {
  const shapeEl = document.getElementById('heroBgShape');
  if (!shapeEl) return;

  const shapes = ['4-sided-cookie', '7-sided-cookie', 'pentagon', 'flower', 'square'];
  let currentIdx = 0;

  setInterval(() => {
    currentIdx = (currentIdx + 1) % shapes.length;
    shapeEl.setAttribute('name', shapes[currentIdx]);
  }, 4000);
}

document.addEventListener('DOMContentLoaded', initHeroShapeMorph);


/* popular mods (data: download counters from stats.js) */
function whenCountsReady(timeout = 8000) {
  return new Promise((resolve) => {
    if (window.downloadCounts) return resolve(true);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      window.removeEventListener('d2pfx:counts-loaded', finish);
      resolve(!!window.downloadCounts);
    };
    const t = setTimeout(finish, timeout);
    window.addEventListener('d2pfx:counts-loaded', finish);
  });
}

function getModDownloads(categoryId, groupId, mod) {
  if (typeof window.getDownloadCount !== 'function' || typeof window.modStatKey !== 'function') return 0;
  if (mod.styles && mod.styles.length > 1) {
    let total = 0;
    for (let i = 0; i < mod.styles.length; i++) {
      total += window.getDownloadCount(window.modStatKey(categoryId, groupId, mod, i));
    }
    return total;
  }
  return window.getDownloadCount(window.modStatKey(categoryId, groupId, mod, 0));
}

function buildPopularMods(modsData, constants) {
  const translations = constants.translations || {};
  const items = [];
  let total = 0;

  (constants.categories || []).forEach((cat) => {
    const data = modsData[cat.id];
    if (!data) return;
    const label = translations[cat.key] || cat.id;

    const add = (groupId, mod) => {
      if (!mod || mod.type === 'guide' || mod.type === 'pack') return;
      const count = getModDownloads(cat.id, groupId, mod);
      total += count;
      if (count > 0) {
        items.push({
          name: mod.name,
          categoryLabel: label,
          emoji: cat.emoji || '',
          styles: mod.styles && mod.styles.length > 1 ? mod.styles.length : 0,
          count,
        });
      }
    };

    if (Array.isArray(data.groups)) {
      data.groups.forEach((g) => (g.mods || []).forEach((m) => add(g.id, m)));
    } else if (Array.isArray(data)) {
      data.forEach((m) => add(null, m));
    }
  });

  items.sort((a, b) => b.count - a.count);
  return { items, total };
}

async function renderPopularMods(modsData, constants) {
  const list = document.getElementById('popularList');
  const sub = document.getElementById('popularSub');
  const toggleWrap = document.getElementById('popularToggleWrap');
  if (!list) return;

  list.innerHTML = Array.from({ length: 5 }, () => '<div class="popular-skeleton stat-skeleton"></div>').join('');
  const ok = await whenCountsReady();
  if (!ok) {
    list.innerHTML = '<div class="leaderboard-empty">Download counts are unavailable right now</div>';
    return;
  }

  const { items: all, total } = buildPopularMods(modsData, constants);

  const totalNumEl = document.getElementById('totalDownloadsNumber');
  if (totalNumEl) {
    observeAndAnimate(totalNumEl, total);
  }

  const items = all.slice(0, 25);
  if (!items.length) {
    list.innerHTML = '<div class="leaderboard-empty">No download data yet</div>';
    return;
  }

  sub.textContent = `${numberFormat(total)} downloads across all mods`;
  const VISIBLE_LIMIT = 10;
  const maxCount = items[0].count || 1;
  const shapes = ['sunny', '4-sided-cookie', 'pentagon'];

  list.innerHTML = items.map((m, i) => {
    const rank = i + 1;
    const shape = shapes[i] || 'square';
    const meta = `${escapeHtml(m.categoryLabel)}${m.styles ? ` · ${m.styles} styles` : ''}`;

    return `<div class="leaderboard-item ${i >= VISIBLE_LIMIT ? 'leaderboard-item-hidden' : ''}" data-idx="${i}"> 
      <div class="leaderboard-rank ${rank <= 3 ? `rank-${rank}` : ''}"> 
        <m3e-shape name="${shape}">${rank}</m3e-shape> 
      </div> 
      <div class="leaderboard-body"> 
        <div class="leaderboard-name">${escapeHtml(m.name)}</div> 
        <div class="popular-meta">${meta}</div> 
        <div class="leaderboard-bar-track"> 
          <div class="leaderboard-bar-fill" data-width="${(m.count / maxCount) * 100}"></div> 
        </div> 
      </div> 
      <div class="leaderboard-count popular-count"> 
        <span class="material-symbols-rounded">download</span>${numberFormat(m.count)} 
      </div> 
    </div>`;
  }).join('');

  requestAnimationFrame(() => {
    list.querySelectorAll('.leaderboard-bar-fill').forEach((el) => {
      el.style.width = `${el.dataset.width}%`;
    });
  });

  if (items.length > VISIBLE_LIMIT) {
    toggleWrap.innerHTML = `<button class="leaderboard-toggle-btn" id="popularToggle"> <span>Show top ${items.length}</span> <span class="material-symbols-rounded">expand_more</span> </button>`;
    const btn = document.getElementById('popularToggle');
    btn.addEventListener('click', () => {
      const expanded = btn.classList.toggle('expanded');
      list.querySelectorAll('.leaderboard-item').forEach((row) => {
        if (Number(row.dataset.idx) >= VISIBLE_LIMIT) row.classList.toggle('leaderboard-item-hidden', !expanded);
      });
      btn.querySelector('span').textContent = expanded ? 'Hide' : `Show top ${items.length}`;
    });
  } else {
    toggleWrap.innerHTML = '';
  }
}


/* globe: downloads by country */
const GEO_URL = 'https://d2pfx-counter.hrdqfck.workers.dev/geo.json';
const CITIES_URL = 'https://d2pfx-counter.hrdqfck.workers.dev/cities.json'; // [[cc, city, lat, lon, n], ...]
const TOPOJSON_URL = 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js';
const LAND_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json';

// ISO code, latitude, longitude (approximate geographic centers)
const COUNTRY_CENTROIDS = (() => {
  const raw = 'RU,61,99;UA,49,32;BY,53.7,27.9;PL,52,19.4;DE,51.2,10.4;FR,46.6,2.5;GB,54,-2.5;IE,53.2,-8;ES,40,-3.7;PT,39.6,-8;IT,42.8,12.5;NL,52.2,5.5;BE,50.6,4.7;LU,49.8,6.1;CH,46.8,8.2;AT,47.6,14.1;CZ,49.8,15.5;SK,48.7,19.5;HU,47.2,19.5;RO,45.9,25;BG,42.7,25.5;GR,39,22;RS,44,21;HR,45.1,15.2;SI,46.1,14.8;BA,44,17.7;ME,42.7,19.3;MK,41.6,21.7;AL,41.1,20;XK,42.6,20.9;MD,47.2,28.4;LT,55.3,23.9;LV,56.9,24.9;EE,58.7,25.5;FI,64,26;SE,62,15;NO,61,9;DK,56,10;IS,64.9,-18.6;MT,35.9,14.4;CY,35,33;' +
    'TR,39,35;GE,42.2,43.5;AM,40.2,45;AZ,40.3,47.7;KZ,48,67;UZ,41.4,64.5;KG,41.5,74.6;TJ,38.9,71;TM,39,59;MN,46.9,103.8;CN,35,103;JP,36.2,138.3;KR,36.5,127.9;KP,40,127;TW,23.7,121;HK,22.3,114.2;IN,22,79;PK,30,70;BD,23.7,90.3;LK,7.9,80.7;NP,28.4,84;MM,21.9,96;TH,15.5,101;VN,16,107.8;LA,18.2,103.9;KH,12.6,104.9;MY,4.2,102;SG,1.35,103.8;ID,-2.5,118;PH,12.9,122.8;BN,4.5,114.7;IL,31.4,35;PS,31.9,35.2;LB,33.9,35.9;JO,31,36.5;SY,35,38.5;IQ,33,43.7;IR,32.4,53.7;SA,24,45;AE,24,54;QA,25.3,51.2;KW,29.3,47.5;BH,26,50.5;OM,21.5,55.9;YE,15.6,48;AF,33.9,67.7;' +
    'EG,26.8,30.8;LY,27,17;TN,34,9;DZ,28,2.6;MA,31.8,-7;SD,15,30;ET,9,40;KE,0.2,37.9;TZ,-6.4,34.9;UG,1.4,32.3;NG,9.1,8.7;GH,7.9,-1;CI,7.5,-5.5;SN,14.5,-14.5;CM,5.7,12.7;AO,-11.2,17.9;ZA,-29,24;ZW,-19,29.9;ZM,-13.1,27.8;MZ,-18.7,35.5;MG,-19,46.9;NA,-22,17;BW,-22.3,24.7;CD,-2.9,23.6;ML,17.6,-4;NE,17.6,8;TD,15.5,18.7;MR,20,-10.9;SO,5,46;RW,-1.9,29.9;MU,-20.3,57.6;' +
    'US,39.8,-98.6;CA,56,-96;MX,23.6,-102.5;GT,15.7,-90.2;HN,14.8,-86.6;SV,13.8,-88.9;NI,12.9,-85;CR,9.9,-84;PA,8.5,-80;CU,21.5,-79.5;DO,18.9,-70.5;HT,19,-72.7;JM,18.1,-77.3;PR,18.2,-66.5;TT,10.5,-61.3;CO,4.6,-74.3;VE,7,-66;EC,-1.4,-78.4;PE,-9.2,-75;BO,-16.7,-64.7;BR,-10,-52;PY,-23.4,-58.4;UY,-32.8,-56;AR,-34,-64;CL,-30,-71;' +
    'AU,-25.7,134;NZ,-41,172;PG,-6.3,143.9;FJ,-17.7,178';
  const map = {};
  raw.split(';').forEach((s) => {
    const [cc, la, lo] = s.split(',');
    if (cc) map[cc.trim()] = [Number(la), Number(lo)];
  });
  return map;
})();

let regionNames = null;
try { regionNames = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (_) { }
function countryName(code) {
  try { return (regionNames && regionNames.of(code)) || code; } catch (_) { return code; }
}

function loadScriptOnce(url, globalName) {
  return new Promise((resolve, reject) => {
    if (globalName && window[globalName]) return resolve();
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(s);
  });
}

async function fetchGeoData() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(GEO_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let data = await res.json();
    if (data && data.countries && typeof data.countries === 'object') data = data.countries;
    const countries = [];
    let total = 0;
    Object.entries(data || {}).forEach(([code, n]) => {
      const count = Number(n) || 0;
      if (count <= 0) return;
      total += count;
      const c = COUNTRY_CENTROIDS[code.toUpperCase()];
      if (c) countries.push({ code: code.toUpperCase(), name: countryName(code.toUpperCase()), count, lat: c[0], lon: c[1] });
    });
    countries.sort((a, b) => b.count - a.count);
    return { ok: true, countries, total };
  } catch (e) {
    console.warn('Geo data unavailable:', e);
    return { ok: false, countries: [], total: 0 };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCitiesData() {
  try {
    const res = await fetch(CITIES_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arr = await res.json();
    if (!Array.isArray(arr)) return [];
    return arr
      .map(([code, city, lat, lon, n]) => ({ code: String(code).toUpperCase(), city: String(city), lat: Number(lat), lon: Number(lon), count: Number(n) || 0 }))
      .filter((c) => c.count > 0 && Number.isFinite(c.lat) && Number.isFinite(c.lon));
  } catch (e) {
    console.warn('Cities data unavailable:', e);
    return [];
  }
}

// cities + the part of each country's total that has no city (VPN mismatch, app, unknown) at the country centroid
function buildPlaces(countries, cities) {
  const places = [];
  const used = {};
  cities.forEach((c) => {
    used[c.code] = (used[c.code] || 0) + c.count;
    places.push({ id: `${c.code}|${c.city}`, code: c.code, name: `${c.city}, ${countryName(c.code)}`, count: c.count, lat: c.lat, lon: c.lon });
  });
  countries.forEach((c) => {
    const rest = c.count - (used[c.code] || 0);
    if (rest > 0) {
      places.push({ id: c.code, code: c.code, name: used[c.code] ? `${c.name} (other)` : c.name, count: rest, lat: c.lat, lon: c.lon });
    }
  });
  places.sort((a, b) => b.count - a.count);
  return places;
}

async function loadLandGeometry() {
  await loadScriptOnce(TOPOJSON_URL, 'topojson');
  const res = await fetch(LAND_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const topo = await res.json();
  return window.topojson.feature(topo, topo.objects.land);
}

// Rasterize land to an equirectangular mask, then keep Fibonacci-sphere points that fall on land.
function buildLandDots(landGeo, total = 9000) {
  const W = 720, H = 360;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff';
  g.beginPath();

  const geoms = [];
  const collect = (o) => {
    if (!o) return;
    if (o.type === 'FeatureCollection') o.features.forEach(collect);
    else if (o.type === 'Feature') collect(o.geometry);
    else if (o.type === 'GeometryCollection') o.geometries.forEach(collect);
    else geoms.push(o);
  };
  collect(landGeo);

  geoms.forEach((gm) => {
    const polys = gm.type === 'Polygon' ? [gm.coordinates] : gm.type === 'MultiPolygon' ? gm.coordinates : [];
    polys.forEach((rings) => rings.forEach((ring) => {
      ring.forEach(([lon, lat], i) => {
        const x = ((lon + 180) / 360) * W;
        const y = ((90 - lat) / 180) * H;
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      });
      g.closePath();
    }));
  });
  g.fill('evenodd');
  const px = g.getImageData(0, 0, W, H).data;

  const out = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < total; i++) {
    const sinLat = 1 - 2 * ((i + 0.5) / total);
    const lat = Math.asin(sinLat) * 180 / Math.PI;
    let lon = ((i * golden * 180 / Math.PI) % 360);
    if (lon > 180) lon -= 360;
    const x = Math.min(W - 1, Math.floor(((lon + 180) / 360) * W));
    const y = Math.min(H - 1, Math.floor(((90 - lat) / 180) * H));
    if (px[(y * W + x) * 4] > 128) out.push(lat, lon);
  }
  return out;
}

function createGlobe({ canvas, stage, tooltip, landLatLon, countries }) {
  const ctx = canvas.getContext('2d');
  const DEG = Math.PI / 180;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // precompute trig: [sinLon, cosLon, cosLat, sinLat]
  const pre = (lat, lon) => [Math.sin(lon * DEG), Math.cos(lon * DEG), Math.cos(lat * DEG), Math.sin(lat * DEG)];
  const dots = new Float32Array((landLatLon.length / 2) * 4);
  for (let i = 0, j = 0; i < landLatLon.length; i += 2, j += 4) dots.set(pre(landLatLon[i], landLatLon[i + 1]), j);
  const hot = countries.map((c) => ({ ...c, p: pre(c.lat, c.lon), sx: 0, sy: 0, r: 0, z: -1 }));
  const maxCount = countries[0]?.count || 1;

  let w = 0, h = 0, cx = 0, cy = 0, R = 0, baseR = 0, dpr = 1;
  let rotLon = 40, tilt = 22;
  let zoom = 1; // 1..2.8
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 2.8;
  let dragging = false, lastX = 0, lastY = 0;
  let lastInteract = -1e9, focus = null, hoverIdx = -1;
  let visible = true, raf = 0, lastT = 0, colorStamp = -1e9;
  let colors = {};

  function readColors() {
    const cs = getComputedStyle(document.body);
    const g = (n, f) => cs.getPropertyValue(n).trim() || f;
    colors = {
      primary: g('--md-sys-color-primary', '#b99cff'),
      dot: g('--md-sys-color-on-surface-variant', '#aaaaaa'),
      sphere: g('--md-sys-color-surface-container-high', '#2a2a2a'),
      outline: g('--md-sys-color-outline-variant', '#555555'),
    };
  }

  function resize() {
    const r = stage.getBoundingClientRect();
    w = r.width; h = r.height;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    cx = w / 2; cy = h / 2;
    baseR = Math.max(40, Math.min(w, h) / 2 - 14);
    R = baseR * zoom;
  }

  const wrap = (d) => ((d + 540) % 360) - 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function update(dt, now) {
    if (focus) {
      const k = Math.min(1, dt * 0.006);
      const dc = wrap(focus.lon - rotLon);
      rotLon += dc * k;
      tilt += (focus.tilt - tilt) * k;
      if (Math.abs(dc) < 0.3) { focus = null; lastInteract = now + 2500; }
    } else if (!dragging && !reduceMotion && hoverIdx < 0 && now - lastInteract > 2500) {
      rotLon += dt * 0.008;
    }
    rotLon = wrap(rotLon);
  }

  function draw(now) {
    if (now - colorStamp > 1000) { readColors(); colorStamp = now; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    ctx.globalAlpha = 0.85;
    ctx.fillStyle = colors.sphere;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = colors.outline; ctx.lineWidth = 1;
    ctx.stroke();

    const sc = Math.sin(rotLon * DEG), cc = Math.cos(rotLon * DEG);
    const st = Math.sin(tilt * DEG), ct = Math.cos(tilt * DEG);

    // land dots
    const s = Math.max(1.3, R / 140);
    ctx.fillStyle = colors.dot;
    for (let i = 0; i < dots.length; i += 4) {
      const sl = dots[i], cl = dots[i + 1], cp = dots[i + 2], sp = dots[i + 3];
      const z0 = cp * (cl * cc + sl * sc);
      const z = sp * st + z0 * ct;
      if (z <= 0) continue;
      const x = cp * (sl * cc - cl * sc);
      const y = sp * ct - z0 * st;
      ctx.globalAlpha = 0.12 + 0.55 * z;
      ctx.fillRect(cx + R * x - s / 2, cy - R * y - s / 2, s, s);
    }

    // hotspots: dots shrink as their number grows so dense maps stay readable
    const sizeScale = Math.max(0.55, 1 - Math.max(0, hot.length - 15) / 130);
    for (const o of hot) {
      const [sl, cl, cp, sp] = o.p;
      const z0 = cp * (cl * cc + sl * sc);
      o.z = sp * st + z0 * ct;
      o.sx = cx + R * cp * (sl * cc - cl * sc);
      o.sy = cy - R * (sp * ct - z0 * st);
      o.r = (1.8 + 6.5 * Math.sqrt(o.count / maxCount)) * sizeScale * (R / 190);
    }
    ctx.fillStyle = colors.primary;
    ctx.strokeStyle = colors.primary;
    // biggest first, so small dots are drawn on top and never hidden
    for (let i = 0; i < hot.length; i++) {
      const o = hot[i];
      if (o.z <= 0.02) continue;
      const a = 0.35 + 0.65 * o.z;
      ctx.globalAlpha = 0.09 * a;
      ctx.beginPath(); ctx.arc(o.sx, o.sy, o.r * 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = (i === hoverIdx ? 1 : 0.85) * a;
      ctx.beginPath(); ctx.arc(o.sx, o.sy, o.r * (i === hoverIdx ? 1.25 : 1), 0, Math.PI * 2); ctx.fill();
      if (i < 3 && !reduceMotion) {
        const ph = ((now / 1800) + i * 0.33) % 1;
        ctx.globalAlpha = (1 - ph) * 0.4 * a;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(o.sx, o.sy, o.r + ph * o.r * 1.6, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  const running = () => visible && !document.hidden;
  function loop(now) {
    raf = 0;
    if (!running()) return;
    const dt = Math.min(50, now - (lastT || now));
    lastT = now;
    update(dt, now);
    draw(now);
    raf = requestAnimationFrame(loop);
  }
  function kick() {
    if (!raf && running()) { lastT = 0; raf = requestAnimationFrame(loop); }
  }

  // interaction
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    focus = null; lastInteract = performance.now();
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (dragging) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      // slightly slower rotation when zoomed in
      const sens = 0.4 / Math.sqrt(zoom);
      rotLon = wrap(rotLon - dx * sens);
      if (e.pointerType !== 'touch') tilt = clamp(tilt + dy * sens * 0.75, -60, 70);
      lastInteract = performance.now();
      tooltip.classList.remove('visible');
      hoverIdx = -1;
      return;
    }
    updateHover(e);
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('dragging');
    lastInteract = performance.now();
    if (e.pointerType === 'touch') updateHover(e);
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => { hoverIdx = -1; tooltip.classList.remove('visible'); });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.08 : 1 / 1.08;
    zoom = clamp(zoom * factor, ZOOM_MIN, ZOOM_MAX);
    R = baseR * zoom;
    lastInteract = performance.now();
    tooltip.classList.remove('visible');
    hoverIdx = -1;
    kick();
  }, { passive: false });

  function updateHover(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let best = -1, bestD = Infinity;
    hot.forEach((o, i) => {
      if (o.z <= 0.1) return;
      const d = Math.hypot(o.sx - mx, o.sy - my);
      if (d <= Math.max(o.r, 10) + 4 && d < bestD) { best = i; bestD = d; }
    });
    hoverIdx = best;
    if (best < 0) { tooltip.classList.remove('visible'); return; }
    const o = hot[best];
    const share = hot.reduce((s, x) => s + x.count, 0);
    tooltip.textContent = `${o.name} — ${numberFormat(o.count)} (${pct(o.count, share)})`;
    tooltip.style.left = `${clamp(o.sx, 70, w - 70)}px`;
    tooltip.style.top = `${o.sy - o.r - 12}px`;
    tooltip.classList.add('visible');
  }

  new ResizeObserver(() => { resize(); kick(); }).observe(stage);
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; kick(); }, { threshold: 0 }).observe(stage);
  document.addEventListener('visibilitychange', kick);

  resize();
  readColors();
  kick();

  return {
    focusCountry(code) {
      // Prefer pure country residual (id === code), else any place with that code
      const o = hot.find((x) => x.id === code) || hot.find((x) => x.code === code);
      if (!o) return;
      focus = { lon: o.lon, tilt: clamp(o.lat * 0.6, -30, 50) };
      stage.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      kick();
    },
  };
}

function renderGeoList(geo, globe) {
  const list = document.getElementById('globeCountries');
  document.getElementById('globeCountriesCount').textContent = String(geo.countries.length);
  const totalEl = document.getElementById('globeTotal');
  totalEl.textContent = numberFormat(geo.total);

  if (!geo.countries.length) {
    list.innerHTML = `<div class="leaderboard-empty">${geo.ok ? 'No location data yet' : 'Location data is unavailable'}</div>`;
    return;
  }
  const LIMIT = 10;
  const top = geo.countries.slice(0, LIMIT);
  const max = top[0].count || 1;
  list.innerHTML = top.map((c) => `
    <div class="leaderboard-item" data-id="${escapeHtml(c.code)}">
      <div class="globe-cc">${escapeHtml(c.code)}</div>
      <div class="leaderboard-body">
        <div class="leaderboard-name">${escapeHtml(c.name)}</div>
        <div class="leaderboard-bar-track">
          <div class="leaderboard-bar-fill" data-width="${(c.count / max) * 100}"></div>
        </div>
      </div>
      <div class="leaderboard-count">${pct(c.count, geo.total)}</div>
    </div>`).join('');
  requestAnimationFrame(() => {
    list.querySelectorAll('.leaderboard-bar-fill').forEach((el) => { el.style.width = `${el.dataset.width}%`; });
  });
  list.querySelectorAll('.leaderboard-item').forEach((row) => {
    row.addEventListener('click', () => globe && globe.focusCountry(row.dataset.id));
  });
}

async function setupGlobe() {
  const stage = document.getElementById('globeStage');
  const canvas = document.getElementById('globeCanvas');
  const tooltip = document.getElementById('globeTooltip');
  const note = document.getElementById('globeNote');
  if (!stage || !canvas) return;

  const [landRes, geo, cities] = await Promise.all([
    loadLandGeometry().then((v) => ({ ok: true, v }), (e) => ({ ok: false, e })),
    fetchGeoData(),
    fetchCitiesData(),
  ]);

  // Globe dots: cities + country residuals (more precise). Side list: countries only.
  const places = buildPlaces(geo.countries, cities);
  const listView = { ...geo, countries: geo.countries };

  if (!landRes.ok) {
    console.error('Globe failed:', landRes.e);
    note.hidden = false;
    note.textContent = 'Could not load the globe map. Please refresh later.';
    renderGeoList(listView, null);
    return;
  }

  const globe = createGlobe({
    canvas, stage, tooltip,
    landLatLon: buildLandDots(landRes.v),
    countries: places,
  });
  renderGeoList(listView, globe);

  if (!geo.countries.length) {
    note.hidden = false;
    note.textContent = geo.ok
      ? 'Location data is being collected — it will appear here after the first downloads are recorded.'
      : 'Location data is unavailable right now.';
  }
}

function initGlobeSection() {
  const section = document.getElementById('globeSection');
  if (!section) return;
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      setupGlobe();
    }
  }, { rootMargin: '300px' });
  io.observe(section);
}


/* tools data */
async function loadStatsData() {
  const dataBase = FILES_BASE_URL ? `${FILES_BASE_URL}/assets/data` : 'assets/data';
  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), 20000);

  try {
    const [modsRes, constantsRes] = await Promise.all([
      fetch(`${dataBase}/mods.json`, { signal: controller.signal }),
      fetch(`${dataBase}/constants.json`, { signal: controller.signal }),
    ]);
    clearTimeout(timeoutTimer);

    if (!modsRes.ok) throw new Error(`HTTP ${modsRes.status}`);
    if (!constantsRes.ok) throw new Error(`HTTP ${constantsRes.status}`);

    const modsFile = await modsRes.json();
    const constants = await constantsRes.json();
    const modsData = modsFile.modsData;

    const stats = buildStats(modsData, constants);

    renderHero(stats);
    renderOverviewCards(stats);
    renderCategoryBars(stats);

    renderLeaderboard(
      'authorsLeaderboard',
      'authorsCount',
      'authorsToggleWrap',
      stats.authors,
      'No author data available yet',
      'authors'
    );
    renderLeaderboard(
      'sendersLeaderboard',
      'sendersCount',
      'sendersToggleWrap',
      stats.senders,
      'No submitter data available yet',
      'submitters'
    );

    document.getElementById('statsContent').classList.remove('stats-hidden');
    document.getElementById('statsLoading').remove();

    renderPopularMods(modsData, constants);
    initGlobeSection();
    renderToolDownloads();
  } catch (e) {
    clearTimeout(timeoutTimer);
    console.error('Failed to load stats data:', e);
    const loading = document.getElementById('statsLoading');
    const isTimeout = e.name === 'AbortError';
    loading.innerHTML = `
      <div class="stats-error">
        <span class="material-symbols-rounded">cloud_off</span>
        <div style="font-size:17px;font-weight:600;color:var(--md-sys-color-on-surface);margin-bottom:6px;">
          ${isTimeout ? 'Request timed out' : 'Failed to load data'}
        </div>
        <div>Please try refreshing the page later.</div>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadStatsData);