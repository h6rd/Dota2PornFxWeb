(() => {
    const STATS_API = 'https://d2pfx-counter.hrdqfck.workers.dev';
    const COUNTS_URLS = [`${STATS_API}/downloads.json`];
    const FLUSH_DELAY = 2000;

    let counts = {};
    const session = {};
    let pending = {};
    let timer = 0;

    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function statKey(categoryId, groupId, modName, styleName) {
        return [categoryId, groupId, modName, styleName].filter(Boolean).join('/');
    }

    function styleStatName(style) {
        return String(style?.label ?? '').replace('Style ', '').trim() || 'Default';
    }

    function modStatKey(categoryId, groupId, mod, styleIndex = 0) {
        if (mod.styles && mod.styles.length > 1) {
            return statKey(categoryId, groupId, mod.name, styleStatName(mod.styles[styleIndex]));
        }
        return statKey(categoryId, groupId, mod.name);
    }

    function getDownloadCount(key) {
        return (counts[key] || 0) + (session[key] || 0);
    }

    function formatCount(n) {
        if (n < 1e3) return String(n);
        if (n < 1e4) return (Math.floor(n / 100) / 10) + 'k';
        if (n < 1e6) return Math.floor(n / 1e3) + 'k';
        if (n < 1e7) return (Math.floor(n / 1e5) / 10) + 'M';
        return Math.floor(n / 1e6) + 'M';
    }

    function statBadgeHtml(key) {
        const n = getDownloadCount(key);
        return `<span class="dl-count${n ? '' : ' is-empty'}" data-stat="${esc(key)}" title="Downloads">` +
            `<span class="material-symbols-rounded" translate="no">download</span>` +
            `<span class="dl-count-num">${formatCount(n)}</span></span>`;
    }

    function refreshDownloadBadges() {
        document.querySelectorAll('.dl-count[data-stat]').forEach(el => {
            const n = getDownloadCount(el.dataset.stat);
            el.classList.toggle('is-empty', !n);
            const num = el.querySelector('.dl-count-num');
            const text = formatCount(n);
            if (num && num.textContent !== text) num.textContent = text;
        });
    }

    function flushDownloads() {
        clearTimeout(timer);
        timer = 0;
        const hits = pending;
        pending = {};
        if (!Object.keys(hits).length) return;
        try {
            fetch(`${STATS_API}/hit`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                body: JSON.stringify({ hits }),
                keepalive: true
            }).catch(() => { });
        } catch (_) { }
    }

    function trackDownloads(keys) {
        for (const k of keys) {
            if (!k) continue;
            pending[k] = Math.min((pending[k] || 0) + 1, 5);
            session[k] = (session[k] || 0) + 1;
        }
        refreshDownloadBadges();
        clearTimeout(timer);
        timer = setTimeout(flushDownloads, FLUSH_DELAY);
    }

    async function loadDownloadCounts() {
        for (const url of COUNTS_URLS) {
            try {
                const r = await fetch(url);
                if (!r.ok) continue;
                const data = await r.json();
                if (data && typeof data === 'object') {
                    counts = data;
                    window.downloadCounts = counts;
                    refreshDownloadBadges();
                    window.dispatchEvent(new CustomEvent('d2pfx:counts-loaded'));
                    return;
                }
            } catch (_) { }
        }
        window.dispatchEvent(new CustomEvent('d2pfx:counts-loaded'));
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushDownloads();
    });
    window.addEventListener('pagehide', flushDownloads);

    function setDownloadCounts(obj) {
        counts = obj && typeof obj === 'object' ? obj : {};
        refreshDownloadBadges();
        window.dispatchEvent(new CustomEvent('d2pfx:counts-loaded'));
    }

    Object.assign(window, {
        setDownloadCounts,
        statKey, styleStatName, modStatKey, getDownloadCount, statBadgeHtml,
        refreshDownloadBadges, trackDownloads, flushDownloads, formatCount
    });

    loadDownloadCounts();
})();