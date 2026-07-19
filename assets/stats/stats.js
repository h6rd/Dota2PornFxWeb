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
  { repo: 'h6rd/Compiler', name: 'Compiler', icon: 'bi-cpu', hasLinux: false },
  { repo: 'h6rd/Patcher', name: 'Patcher', icon: 'bi-bandaid', hasLinux: true },
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