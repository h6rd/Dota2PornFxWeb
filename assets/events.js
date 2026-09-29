const SEASONAL_SETTINGS_KEY = 'd2pfx_settings';
const seasonalHooks = [];

function eventThemesEnabled() {
    try {
        return JSON.parse(localStorage.getItem(SEASONAL_SETTINGS_KEY) || '{}').seasonalThemes !== false;
    } catch (e) { return true; }
}

window.setSeasonalThemes = function (on) {
    seasonalHooks.forEach(fn => fn(!!on));
};

(function () {
    try {
        const d = new Date();
        const m = d.getMonth();
        const y = d.getFullYear();
        const seasonId = m === 11 ? (y + '-' + (y + 1))
            : (m === 0 || m === 1) ? ((y - 1) + '-' + y)
                : null;

        if (!eventThemesEnabled()) {
            if (!seasonId) localStorage.removeItem('winterWasActive');
            return;
        }
        const root = document.documentElement;
        if (seasonId) {
            root.classList.add('winter-active');
            if (localStorage.getItem('winterAvalancheSeason') === seasonId) {
                root.classList.add('winter-revealed');
            }
        } else if (localStorage.getItem('winterWasActive') === '1') {
            root.classList.add('winter-outro');
        }
    } catch (e) { }
})();

// winter
function getWinterSeasonId(date) {
    date = date || new Date();
    const m = date.getMonth();
    const y = date.getFullYear();
    if (m === 11) return `${y}-${y + 1}`;
    if (m === 0 || m === 1) return `${y - 1}-${y}`;
    return null;
}

function isWinterActive(date) {
    return getWinterSeasonId(date) !== null;
}

function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function computeGarlandLightCount() {
    const pitch = 36;
    return Math.max(20, Math.ceil(window.innerWidth / pitch) + 4);
}

function buildWinterGarland() {
    const garland = document.getElementById('winterGarland');
    if (!garland) return;
    const needed = computeGarlandLightCount();
    if (garland.childElementCount === needed) return;
    garland.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let i = 0; i < needed; i++) {
        frag.appendChild(document.createElement('li'));
    }
    garland.appendChild(frag);
}

let winterGarlandResizeTimer = null;
function handleWinterGarlandResize() {
    clearTimeout(winterGarlandResizeTimer);
    winterGarlandResizeTimer = setTimeout(buildWinterGarland, 150);
}

const WINTER_SNOW_CONFIG = {
    count: 70,
    minRadius: 1.8,
    maxRadius: 3.8,
    minSpeedY: 0.5,
    maxSpeedY: 1.5,
    minOpacity: 0.4,
    maxOpacity: 0.8,
    reducedMotionCount: 15,
};

const winterSnow = (() => {
    let canvas = null;
    let ctx = null;
    let flakes = [];
    let rafId = null;
    let running = false;
    let color = '255,255,255';

    function currentColor() {
        const theme = document.documentElement.getAttribute('data-theme');
        return theme === 'light' ? '0,0,0' : '255,255,255';
    }

    function resize() {
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeFlake() {
        const c = WINTER_SNOW_CONFIG;
        return {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: c.minRadius + Math.random() * (c.maxRadius - c.minRadius),
            speedY: c.minSpeedY + Math.random() * (c.maxSpeedY - c.minSpeedY),
            drift: Math.random() * Math.PI * 2,
            opacity: c.minOpacity + Math.random() * (c.maxOpacity - c.minOpacity),
        };
    }

    function tick() {
        if (!running || !ctx) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);
        flakes.forEach((f) => {
            f.drift += 0.01;
            f.y += f.speedY;
            f.x += Math.sin(f.drift) * 0.3;
            if (f.y > h + 10) {
                f.y = -10;
                f.x = Math.random() * w;
            }
            if (f.x > w + 10) f.x = -10;
            if (f.x < -10) f.x = w + 10;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color}, ${f.opacity})`;
            ctx.fill();
        });
        rafId = requestAnimationFrame(tick);
    }

    function handleVisibility() {
        if (document.hidden) {
            running = false;
            if (rafId) cancelAnimationFrame(rafId);
        } else if (canvas && !running) {
            running = true;
            tick();
        }
    }

    function start(count) {
        canvas = document.getElementById('winterSnowCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        color = currentColor();
        resize();
        const requested = count || WINTER_SNOW_CONFIG.count;
        const flakeCount = prefersReducedMotion()
            ? Math.min(WINTER_SNOW_CONFIG.reducedMotionCount, requested)
            : requested;
        flakes = Array.from({ length: flakeCount }, makeFlake);
        running = true;
        if (rafId) cancelAnimationFrame(rafId);
        tick();
        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', handleVisibility);
    }

    function stop() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', handleVisibility);
    }

    function refreshColor() {
        color = currentColor();
    }

    return { start, stop, refreshColor };
})();

function playWinterAvalanche(durationMs, onDone) {
    const overlay = document.getElementById('winterIntroOverlay');
    const canvas = document.getElementById('winterIntroCanvas');
    if (!overlay || !canvas) { onDone(); return; }

    overlay.classList.add('winter-intro-active');
    const simple = prefersReducedMotion();
    if (simple) overlay.classList.add('winter-intro-simple');

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let rafId = null;
    let running = true;

    function resize() {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const flakeColor = isLight ? '0,0,0' : '255,255,255';

    const flakeCount = simple ? 70 : 260;
    const speedBase = simple ? 1.5 : 4;
    const speedRange = simple ? 1.5 : 6;
    const washAmplitude = simple ? 0.12 : 0.62;

    const flakes = Array.from({ length: flakeCount }, () => ({
        x: Math.random() * window.innerWidth,
        y: -Math.random() * window.innerHeight,
        r: 2 + Math.random() * 4,
        speedY: speedBase + Math.random() * speedRange,
        speedX: simple ? 0 : (Math.random() - 0.5) * 2,
        opacity: 0.5 + Math.random() * 0.5,
    }));

    const start = performance.now();

    function tick(now) {
        if (!running) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const elapsed = now - start;

        ctx.clearRect(0, 0, w, h);

        if (washAmplitude > 0) {
            const progress = Math.min(elapsed / durationMs, 1);
            const wash = Math.sin(progress * Math.PI) * washAmplitude;
            ctx.fillStyle = `rgba(255,255,255,${wash})`;
            ctx.fillRect(0, 0, w, h);
        }

        flakes.forEach((f) => {
            f.y += f.speedY;
            f.x += f.speedX;
            if (f.y > h + 10) {
                f.y = -10;
                f.x = Math.random() * w;
            }
            if (f.x > w + 10) f.x = -10;
            if (f.x < -10) f.x = w + 10;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${flakeColor}, ${f.opacity})`;
            ctx.fill();
        });

        if (elapsed < durationMs) {
            rafId = requestAnimationFrame(tick);
        } else {
            running = false;
            window.removeEventListener('resize', resize);
            overlay.classList.add('winter-intro-fade');
            overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
            setTimeout(() => overlay.remove(), 1200);
            onDone();
        }
    }

    rafId = requestAnimationFrame(tick);
}

let winterDecorOn = false;

function startWinterDecor() {
    if (winterDecorOn) return;
    winterDecorOn = true;
    buildWinterGarland();
    winterSnow.start();
    window.addEventListener('resize', handleWinterGarlandResize);
}

function stopWinterDecor() {
    if (!winterDecorOn) return;
    winterDecorOn = false;
    winterSnow.stop();
    window.removeEventListener('resize', handleWinterGarlandResize);
    clearTimeout(winterGarlandResizeTimer);
    const garland = document.getElementById('winterGarland');
    if (garland) garland.innerHTML = '';
}

function playWinterOutro() {
    const html = document.documentElement;
    startWinterDecor();
    const delay = prefersReducedMotion() ? 2000 : 3500;
    setTimeout(() => {
        html.classList.remove('winter-outro');
        try { localStorage.removeItem('winterWasActive'); } catch (e) { }
        stopWinterDecor();
    }, delay);
}

function setupWinterEvent() {
    const html = document.documentElement;
    const removeOverlay = () => {
        const overlay = document.getElementById('winterIntroOverlay');
        if (overlay) overlay.remove();
    };

    new MutationObserver(() => winterSnow.refreshColor())
        .observe(html, { attributes: true, attributeFilter: ['data-theme'] });

    if (!eventThemesEnabled()) { removeOverlay(); return; }

    if (html.classList.contains('winter-outro')) {
        removeOverlay();
        playWinterOutro();
        return;
    }

    if (!isWinterActive()) { removeOverlay(); return; }

    const seasonId = getWinterSeasonId();
    try { localStorage.setItem('winterWasActive', '1'); } catch (e) { }

    if (html.classList.contains('winter-revealed')) {
        startWinterDecor();
        removeOverlay();
        return;
    }

    playWinterAvalanche(2500, () => {
        if (!eventThemesEnabled()) return;
        html.classList.add('winter-revealed', 'winter-revealing');
        startWinterDecor();
        try { localStorage.setItem('winterAvalancheSeason', seasonId); } catch (e) { }
        setTimeout(() => html.classList.remove('winter-revealing'), 2800);
    });
}

function setWinterEnabled(on) {
    const html = document.documentElement;
    if (!on) {
        html.classList.remove('winter-active', 'winter-revealed', 'winter-revealing', 'winter-outro');
        stopWinterDecor();
        const overlay = document.getElementById('winterIntroOverlay');
        if (overlay) overlay.remove();
        return;
    }
    const seasonId = getWinterSeasonId();
    if (!seasonId) return;
    html.classList.add('winter-active', 'winter-revealed');
    try {
        localStorage.setItem('winterAvalancheSeason', seasonId);
        localStorage.setItem('winterWasActive', '1');
    } catch (e) { }
    startWinterDecor();
}
seasonalHooks.push(setWinterEnabled);

/* halloween */
(function () {
    'use strict';

    const START = 1031;
    const END = 1101;

    const html = document.documentElement;
    const qs = new URLSearchParams(location.search).get('halloween');
    const forced = qs !== null;

    const ls = {
        get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } },
        del(k) { try { localStorage.removeItem(k); } catch (e) { } },
    };
    const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const isLight = () => html.getAttribute('data-theme') === 'light';
    const rand = (a, b) => a + Math.random() * (b - a);

    function seasonId(d) {
        const k = (d.getMonth() + 1) * 100 + d.getDate();
        return k >= START && k <= END ? String(d.getFullYear()) : null;
    }

    const season = seasonId(new Date());
    const enabled = () => forced || eventThemesEnabled();
    let mode = 'off';
    if (!enabled()) {
        if (!season) ls.del('hwWasActive');
    } else if (forced) {
        mode = { '0': 'off', '1': 'intro', intro: 'intro', on: 'on', outro: 'outro' }[qs] || 'off';
    } else if (season) {
        mode = ls.get('hwIntroSeason') === season ? 'on' : 'intro';
    } else if (ls.get('hwWasActive') === '1') {
        mode = 'outro';
    }
    if (mode === 'on') html.classList.add('hw-on');

    const BAT = '<svg viewBox="0 0 60 28" aria-hidden="true"><path fill="currentColor" d="M30 9L33 3L35 8C42 6 50 3 58 4Q54 9 55 15Q50 11 47 16Q43 11 40 17Q36 13 33 19L30 25L27 19Q24 13 20 17Q17 11 13 16Q10 11 5 15Q6 9 2 4C10 3 18 6 25 8L27 3Z"/><circle cx="28.4" cy="9.5" r=".9" fill="#ff4d4d"/><circle cx="31.6" cy="9.5" r=".9" fill="#ff4d4d"/></svg>';
    const SPIDER = '<svg viewBox="0 0 40 40" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M16 21Q8 15 4 21M15 24Q6 22 3 29M16 27Q8 30 6 37M17 29Q13 35 12 39M24 21Q32 15 36 21M25 24Q34 22 37 29M24 27Q32 30 34 37M23 29Q27 35 28 39"/></g><circle cx="20" cy="25" r="7" fill="currentColor"/><circle cx="20" cy="15.5" r="4.6" fill="currentColor"/><circle cx="18.4" cy="14.6" r="1.1" fill="#ff3b3b"/><circle cx="21.6" cy="14.6" r="1.1" fill="#ff3b3b"/></svg>';
    const HAT = '<svg class="hw-hat-svg" viewBox="0 0 60 56" aria-hidden="true"><ellipse cx="31" cy="48.5" rx="27" ry="6" fill="#33196b"/><path d="M17 47L28 14Q30 6 38 4Q34 10 35 16L45 47Z" fill="#4a2585"/><path d="M18.4 42h25.2l1.4 5H17z" fill="#ff8a1f"/><rect x="28" y="41" width="7" height="7" rx="1" fill="none" stroke="#ffd166" stroke-width="1.6"/></svg>';

    function webSvg() {
        const rays = [0, 18, 36, 54, 72, 90].map(a => a * Math.PI / 180);
        const f = n => n.toFixed(1);
        let d = '';
        rays.forEach(a => { d += `M0 0L${f(190 * Math.cos(a))} ${f(190 * Math.sin(a))}`; });
        [38, 70, 104, 140, 176].forEach(r => {
            for (let i = 0; i < rays.length - 1; i++) {
                const a1 = rays[i], a2 = rays[i + 1], am = (a1 + a2) / 2, rc = r * 0.86;
                d += `M${f(r * Math.cos(a1))} ${f(r * Math.sin(a1))}Q${f(rc * Math.cos(am))} ${f(rc * Math.sin(am))} ${f(r * Math.cos(a2))} ${f(r * Math.sin(a2))}`;
            }
        });
        return `<svg viewBox="0 0 190 190" fill="none" stroke="currentColor" stroke-width=".9" stroke-linecap="round" aria-hidden="true"><path d="${d}"/></svg>`;
    }

    //embers
    const embers = (() => {
        let cv, ctx, ps = [], raf = 0, on = false, W = 0, H = 0, pal = [];
        const colors = () => isLight()
            ? ['214,92,0', '176,50,20', '120,56,190']
            : ['255,146,48', '255,200,110', '186,128,255'];
        const mk = init => ({
            x: Math.random() * W, y: init ? Math.random() * H : H + 12,
            r: rand(.9, 3), vy: rand(.25, 1), ph: Math.random() * 6.28,
            sw: rand(.25, .8), a: rand(.4, .9), c: (Math.random() * 3) | 0,
        });
        function size() {
            const d = Math.min(window.devicePixelRatio || 1, 2);
            W = innerWidth; H = innerHeight;
            cv.width = W * d; cv.height = H * d;
            ctx.setTransform(d, 0, 0, d, 0, 0);
        }
        function tick() {
            if (!on) return;
            ctx.clearRect(0, 0, W, H);
            for (const p of ps) {
                p.ph += .03; p.y -= p.vy; p.x += Math.sin(p.ph) * p.sw;
                if (p.y < -12) Object.assign(p, mk(false));
                const a = Math.max(0, p.a * (.65 + .35 * Math.sin(p.ph * 2.6)) * Math.min(1, p.y / (H * .2)));
                const c = pal[p.c];
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2, 0, 6.283); ctx.fillStyle = `rgba(${c},${a * .16})`; ctx.fill();
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = `rgba(${c},${a})`; ctx.fill();
            }
            raf = requestAnimationFrame(tick);
        }
        function vis() {
            if (document.hidden) { on = false; cancelAnimationFrame(raf); }
            else if (cv && !on) { on = true; tick(); }
        }
        return {
            start(canvas) {
                cv = canvas; ctx = cv.getContext('2d'); pal = colors(); size();
                ps = Array.from({ length: reduced() ? 14 : 55 }, () => mk(true));
                on = true; tick();
                addEventListener('resize', size);
                document.addEventListener('visibilitychange', vis);
            },
            stop() {
                on = false; cancelAnimationFrame(raf);
                removeEventListener('resize', size);
                document.removeEventListener('visibilitychange', vis);
                cv = null;
            },
            refresh() { pal = colors(); },
        };
    })();

    //bats
    let layer = null, batTimer = 0, resizeTimer = 0, logoEl = null;
    let hatEl = null, santaEl = null, hatRO = null, hatRaf = 0;

    function makeBat(cls, style) {
        const b = document.createElement('div');
        b.className = 'hw-bat ' + cls;
        b.style.cssText = style;
        b.innerHTML = BAT;
        return b;
    }

    function burst(host, n, ox, oy, big) {
        for (let i = 0; i < n; i++) {
            const s = big ? rand(26, 72) : rand(18, 40);
            const b = makeBat('hw-bat--burst', [
                `left:${ox}px`, `top:${oy}px`, `--s:${s.toFixed(0)}px`,
                `--dx:${rand(-1, 1) * (big ? 75 : 35)}vw`,
                `--dy:${-rand(big ? 15 : 10, big ? 115 : 55)}vh`,
                `--k:${rand(.7, 1.5).toFixed(2)}`,
                `--dur:${rand(big ? 1.7 : 1.3, big ? 2.8 : 2.2).toFixed(2)}s`,
                `--delay:${rand(0, big ? .9 : .3).toFixed(2)}s`,
                `--f:${rand(.2, .34).toFixed(2)}s`,
            ].join(';'));
            b.addEventListener('animationend', e => { if (e.target === b) b.remove(); });
            host.appendChild(b);
        }
    }

    function spawnBat() {
        if (!layer) return;
        if (!document.hidden && layer.querySelectorAll('.hw-bat--fly').length < 3) {
            const b = makeBat('hw-bat--fly ' + (Math.random() < .5 ? 'hw-bat--r' : 'hw-bat--l'), [
                `--s:${rand(22, 52).toFixed(0)}px`, `--y:${rand(6, 64).toFixed(0)}vh`,
                `--dy:${rand(6, 20).toFixed(0)}vh`, `--dur:${rand(9, 17).toFixed(1)}s`,
                `--f:${rand(.22, .42).toFixed(2)}s`,
            ].join(';'));
            b.addEventListener('animationend', e => { if (e.target === b) b.remove(); });
            layer.appendChild(b);
        }
        batTimer = setTimeout(spawnBat, rand(5000, 14000));
    }

    //garland
    function buildGarland() {
        const ul = layer && layer.querySelector('.hw-garland');
        if (!ul) return;
        const pitch = innerWidth <= 768 ? 39 : 54;
        const n = Math.max(12, Math.ceil(innerWidth / pitch) + 3);
        if (ul.childElementCount !== n) ul.innerHTML = '<li></li>'.repeat(n);
    }
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(buildGarland, 150); };

    const themeObs = new MutationObserver(() => embers.refresh());
    const onLogoClick = () => {
        if (!layer || reduced() || !logoEl) return;
        const r = logoEl.getBoundingClientRect();
        burst(layer, 12, r.left + r.width / 2, r.top + r.height / 2, false);
    };

    function placeHat() {
        hatRaf = 0;
        if (!hatEl || !santaEl) return;
        const r = santaEl.getBoundingClientRect();
        hatEl.style.visibility = r.width ? 'visible' : 'hidden';
        hatEl.style.left = r.left + 'px';
        hatEl.style.top = r.top + 'px';
    }
    const schedulePlaceHat = () => { if (!hatRaf) hatRaf = requestAnimationFrame(placeHat); };

    function start() {
        if (layer) return;
        layer = document.createElement('div');
        layer.className = 'hw-layer';
        layer.id = 'hwLayer';
        layer.setAttribute('aria-hidden', 'true');
        layer.innerHTML =
            '<div class="hw-glow"></div><div class="hw-moon"></div><canvas class="hw-embers"></canvas>' +
            '<div class="hw-fog"><i></i><i></i></div>' +
            `<div class="hw-web hw-web--l">${webSvg()}</div><div class="hw-web hw-web--r">${webSvg()}</div>` +
            `<div class="hw-spider hw-spider--a">${SPIDER}</div><div class="hw-spider hw-spider--b">${SPIDER}</div>` +
            '<ul class="hw-garland"></ul>' + HAT;
        document.body.prepend(layer);
        html.classList.add('hw-on');

        hatEl = layer.querySelector('.hw-hat-svg');
        santaEl = document.querySelector('.santa-container');
        placeHat();
        addEventListener('resize', schedulePlaceHat);
        addEventListener('scroll', schedulePlaceHat, { passive: true });
        if (window.ResizeObserver && santaEl) { hatRO = new ResizeObserver(schedulePlaceHat); hatRO.observe(santaEl); }
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedulePlaceHat);

        buildGarland();
        embers.start(layer.querySelector('.hw-embers'));
        addEventListener('resize', onResize);
        themeObs.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
        logoEl = document.querySelector('.logo a');
        if (logoEl) logoEl.addEventListener('click', onLogoClick);
        if (!reduced()) batTimer = setTimeout(spawnBat, 2500);
    }

    function stop() {
        clearTimeout(batTimer); clearTimeout(resizeTimer);
        embers.stop();
        removeEventListener('resize', onResize);
        themeObs.disconnect();
        if (logoEl) logoEl.removeEventListener('click', onLogoClick);
        removeEventListener('resize', schedulePlaceHat);
        removeEventListener('scroll', schedulePlaceHat);
        if (hatRO) { hatRO.disconnect(); hatRO = null; }
        cancelAnimationFrame(hatRaf); hatRaf = 0; hatEl = null; santaEl = null;
        if (layer) layer.remove();
        layer = null;
        html.classList.remove('hw-on', 'hw-fading');
    }

    function playIntro(onReveal) {
        const simple = reduced();
        const o = document.createElement('div');
        o.className = 'hw-intro' + (simple ? ' hw-intro--simple' : '');
        o.setAttribute('aria-hidden', 'true');
        o.innerHTML = '<div class="hw-flash"></div>';
        document.body.appendChild(o);
        if (!simple) burst(o, 54, innerWidth / 2, innerHeight + 30, true);
        setTimeout(onReveal, simple ? 1000 : 2300);
        setTimeout(() => o.remove(), simple ? 2300 : 3400);
    }

    function playOutro() {
        start();
        if (!reduced()) burst(layer, 22, innerWidth / 2, innerHeight * .6, true);
        requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('hw-fading')));
        setTimeout(() => { stop(); if (!forced) ls.del('hwWasActive'); }, 3200);
    }

    function init() {
        if (mode === 'on') {
            start();
            if (!forced) ls.set('hwWasActive', '1');
        } else if (mode === 'intro') {
            playIntro(() => {
                if (!enabled()) return;
                start();
                if (!forced) { ls.set('hwIntroSeason', season); ls.set('hwWasActive', '1'); }
            });
        } else if (mode === 'outro') {
            playOutro();
        }
    }

    function setEnabled(on) {
        if (!on) {
            document.querySelectorAll('.hw-intro').forEach(e => e.remove());
            stop();
            return;
        }
        if (layer || (!season && !forced)) return;
        start();
        if (!forced) { ls.set('hwIntroSeason', season); ls.set('hwWasActive', '1'); }
    }
    seasonalHooks.push(setEnabled);

    if (mode !== 'off') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
        else init();
    }
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupWinterEvent);
} else {
    setupWinterEvent();
}