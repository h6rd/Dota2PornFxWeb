(function () {
    'use strict';

    const API_BASE = (window.D2PFX_API_BASE || 'd2pfx-api.hrdq.workers.dev').replace(/\/+$/, '');
    const SCHEMA_VERSION = 1;
    const SAVE_DEBOUNCE_MS = 2500;
    const PULL_MIN_INTERVAL_MS = 60 * 1000;
    const REQUEST_TIMEOUT_MS = 12000;
    const MAX_BACKOFF_MS = 5 * 60 * 1000;
    const MAX_PAYLOAD_BYTES = 900 * 1024;

    const META_KEY = 'd2pfx_cloud_meta';
    const USER_KEY = 'd2pfx_cloud_user';
    const BACKUP_KEY = 'd2pfx_pre_cloud_backup';

    const SECTION_KEYS = {
        settings: ['theme', 'gifTheme', 'gifIndex', 'variant', 'contrast', 'gameLang', 'hideAnimeMods',
            'hideAdultMods', 'seasonalThemes', 'compactCategoryView', 'wallpaper'],
        cart: ['cart'],
        assemblies: ['assemblies'],
        styles: ['styles'],
        localization: ['localization'],
    };
    const SECTION_NAMES = Object.keys(SECTION_KEYS);

    const WATCHED_KEYS = new Set(['d2pfx_settings', 'theme', 'gifIndex', 'modCart', 'savedAssemblies', 'styleIndexMap']);

    const ERROR_TEXT = {
        denied: 'Discord sign-in was cancelled',
        state: 'Sign-in session expired, please try again',
        token: 'Discord rejected the sign-in, please try again',
        discord: 'Discord is unavailable right now',
        roles: 'Could not read your roles on the server',
        not_member: 'Only members of the Discord server can sign in',
    };

    const st = {
        status: 'init',
        user: null,
        sync: 'idle',
        lastSyncedAt: null,
        revision: 0,
        readOnly: false,
        suppress: 0,
        timer: null,
        retryTimer: null,
        backoff: 0,
        running: false,
        again: false,
        lastPull: 0,
        started: false,
    };

    const $ = (id) => document.getElementById(id);
    const toast = (msg) => { try { if (typeof showToast === 'function') showToast(msg); } catch (_) { } };
    const safeFrame = (f) => (typeof f === 'string' && /^[a-z0-9_-]{1,32}$/.test(f) ? f : null);

    function readMeta() {
        try { return JSON.parse(localStorage.getItem(META_KEY) || 'null'); } catch (_) { return null; }
    }
    function writeMeta(meta) {
        withoutWatching(() => {
            try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (_) { }
        });
    }

    function hashStr(str) {
        let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
        for (let i = 0; i < str.length; i++) {
            const ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    }

    function sectionOf(data, name) {
        const part = {};
        SECTION_KEYS[name].forEach((k) => { if (data[k] !== undefined) part[k] = data[k]; });
        return part;
    }
    function sectionHashes(data) {
        const out = {};
        SECTION_NAMES.forEach((n) => { out[n] = hashStr(JSON.stringify(sectionOf(data, n))); });
        return out;
    }
    function dirtySections(data, savedHashes) {
        const now = sectionHashes(data);
        return SECTION_NAMES.filter((n) => !savedHashes || savedHashes[n] !== now[n]);
    }
    function mergeSections(cloudData, localData, sections) {
        const merged = { ...cloudData, version: localData.version };
        sections.forEach((n) => {
            SECTION_KEYS[n].forEach((k) => { delete merged[k]; });
            Object.assign(merged, sectionOf(localData, n));
        });
        return merged;
    }

    async function buildCloudPayload() {
        const obj = await window.D2PFXSettings.build();
        delete obj.dotaPath;
        delete obj.os;
        delete obj.exported;
        return obj;
    }

    let watchPaused = 0;
    function withoutWatching(fn) {
        watchPaused++;
        try { return fn(); } finally { watchPaused--; }
    }

    function installStorageWatcher() {
        const origSet = Storage.prototype.setItem;
        const origRemove = Storage.prototype.removeItem;
        Storage.prototype.setItem = function (key, value) {
            const r = origSet.apply(this, arguments);
            if (this === window.localStorage && WATCHED_KEYS.has(key)) onLocalChange();
            return r;
        };
        Storage.prototype.removeItem = function (key) {
            const r = origRemove.apply(this, arguments);
            if (this === window.localStorage && WATCHED_KEYS.has(key)) onLocalChange();
            return r;
        };
    }

    function onLocalChange() {
        if (watchPaused || st.suppress || st.status !== 'signed-in' || st.readOnly) return;
        scheduleSave();
    }

    class ApiError extends Error {
        constructor(status, code, body) { super(code || ('http_' + status)); this.status = status; this.code = code; this.body = body; }
    }

    async function api(path, { method = 'GET', body, keepalive = false } = {}) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
        let res;
        try {
            res = await fetch(API_BASE + path, {
                method,
                credentials: 'include',
                cache: 'no-store',
                keepalive,
                signal: ctrl.signal,
                headers: {
                    'X-D2PFX-Client': '1',
                    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                },
                body: body !== undefined ? JSON.stringify(body) : undefined,
            });
        } catch (e) {
            const err = new ApiError(0, 'network');
            err.cause = e;
            throw err;
        } finally {
            clearTimeout(timer);
        }
        let json = null;
        try { json = await res.json(); } catch (_) { }
        if (!res.ok) throw new ApiError(res.status, json && json.error, json);
        return json;
    }

    function returnUrl() {
        const u = new URL(window.location.href);
        u.hash = '';
        ['d2pfx_auth', 'd2pfx_err'].forEach((k) => u.searchParams.delete(k));
        return u.toString();
    }

    function login() {
        window.location.href = `${API_BASE}/auth/login?return=${encodeURIComponent(returnUrl())}`;
    }

    async function logout() {
        cancelTimers();
        try { await api('/auth/logout', { method: 'POST' }); } catch (_) { }
        try { localStorage.removeItem(USER_KEY); } catch (_) { }
        st.user = null;
        st.readOnly = false;
        st.sync = 'idle';
        setStatus('guest');
        toast('Signed out');
    }

    function consumeAuthResult() {
        const u = new URL(window.location.href);
        const result = u.searchParams.get('d2pfx_auth');
        if (!result) return null;
        const err = u.searchParams.get('d2pfx_err');
        ['d2pfx_auth', 'd2pfx_err'].forEach((k) => u.searchParams.delete(k));
        try { history.replaceState(null, '', u.toString()); } catch (_) { }
        return { ok: result === 'ok', err };
    }

    async function init() {
        if (st.started) return;
        st.started = true;

        if (!window.D2PFXSettings) {
            console.error('[cloud] D2PFXSettings is missing; cloud sync disabled');
            setStatus('guest');
            return;
        }

        installStorageWatcher();
        bindUi();
        render();

        const auth = consumeAuthResult();
        if (auth && !auth.ok) toast(ERROR_TEXT[auth.err] || 'Sign-in failed');

        await refreshSession({ justLoggedIn: !!(auth && auth.ok) });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') flushOnHide();
            else if (st.status === 'signed-in' && Date.now() - st.lastPull > PULL_MIN_INTERVAL_MS) reconcile({ quiet: true });
        });
        window.addEventListener('pagehide', flushOnHide);
        window.addEventListener('online', () => {
            if (st.status === 'offline') refreshSession({});
            else if (st.status === 'signed-in') scheduleSave(0);
        });
    }

    async function refreshSession({ justLoggedIn = false } = {}) {
        let me;
        try {
            me = await api('/api/me');
        } catch (e) {
            if (e.status === 401) {
                clearCachedUser();
                st.user = null;
                setStatus('guest');
                if (justLoggedIn) {
                    toast('Signed in, but your browser blocked the login cookie. See the Account tab for a fix.');
                    st.sync = 'error';
                    render();
                }
                return;
            }
            const cached = readCachedUser();
            st.user = cached;
            if (cached) { st.sync = 'offline'; setStatus('offline'); } else { setStatus('guest'); }
            return;
        }

        st.user = pickUser(me);
        cacheUser(st.user);
        if (me.schemaVersion && me.schemaVersion < SCHEMA_VERSION) console.warn('[cloud] server is older than client');
        setStatus('signed-in');
        await reconcile({ justLoggedIn });
    }

    function pickUser(me) {
        return {
            id: String(me.id),
            name: String(me.name || 'Discord user'),
            avatar: typeof me.avatar === 'string' && /^https:\/\/cdn\.discordapp\.com\//.test(me.avatar) ? me.avatar : '',
            frame: safeFrame(me.frame),
            label: typeof me.label === 'string' ? me.label : null,
            inGuild: !!me.inGuild,
            rolesCheckedAt: me.rolesCheckedAt || null,
        };
    }
    function cacheUser(u) { try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch (_) { } }
    function clearCachedUser() { try { localStorage.removeItem(USER_KEY); } catch (_) { } }
    function readCachedUser() {
        try {
            const u = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
            return u && u.id ? pickUser(u) : null;
        } catch (_) { return null; }
    }

    async function applyCloudData(data) {
        st.suppress++;
        try {
            await window.D2PFXSettings.apply(data, { cloud: true });
        } finally {
            setTimeout(() => { st.suppress = Math.max(0, st.suppress - 1); }, 50);
        }
    }

    function backupLocalOnce(snapshot) {
        try {
            const str = JSON.stringify(snapshot);
            if (str.length < 1_500_000) localStorage.setItem(BACKUP_KEY, str);
        } catch (_) { }
    }

    async function reconcile({ justLoggedIn = false, quiet = false } = {}) {
        if (st.status !== 'signed-in') return;
        setSync('syncing');
        st.lastPull = Date.now();
        try {
            let cloud = null;
            try {
                cloud = await api('/api/profile');
            } catch (e) {
                if (e.status !== 404) throw e;
            }

            const local = await buildCloudPayload();
            const meta = readMeta();
            const sameUser = !!(meta && meta.userId === st.user.id);

            if (!cloud) {
                await pushSnapshot(local, 0);
                if (justLoggedIn) toast('Cloud profile created from your local settings');
                return;
            }

            if ((cloud.schemaVersion || 1) > SCHEMA_VERSION || (cloud.data && cloud.data.version > window.D2PFXSettings.FORMAT_VERSION)) {
                st.readOnly = true;
                st.revision = cloud.revision;
                setSync('readonly');
                toast('Your cloud profile was saved by a newer version of the site. Reload to update; sync is paused.');
                return;
            }
            st.readOnly = false;
            st.revision = cloud.revision;

            const dirty = sameUser ? dirtySections(local, meta.hashes) : [];

            if (!sameUser) {
                backupLocalOnce(local);
                await applyCloudData(cloud.data);
                await commitMeta(cloud.revision);
                if (justLoggedIn) toast('Settings loaded from your cloud profile');
            } else if (dirty.length === 0) {
                if (cloud.revision !== meta.revision) {
                    await applyCloudData(cloud.data);
                    await commitMeta(cloud.revision);
                    if (!quiet) toast('Settings updated from the cloud');
                } else {
                    setSync('synced');
                }
            } else {
                const merged = cloud.revision === meta.revision ? local : mergeSections(cloud.data, local, dirty);
                await pushSnapshot(merged, cloud.revision, { applyAfter: cloud.revision !== meta.revision });
            }
            setSync('synced');
        } catch (e) {
            handleSyncError(e);
        } finally {
            render();
        }
    }

    async function commitMeta(revision) {
        const snap = await buildCloudPayload();
        st.revision = revision;
        st.lastSyncedAt = Date.now();
        writeMeta({ userId: st.user.id, revision, hashes: sectionHashes(snap) });
    }

    async function pushSnapshot(data, baseRevision, { applyAfter = false } = {}) {
        const body = { schemaVersion: SCHEMA_VERSION, baseRevision, data };
        if (JSON.stringify(body).length > MAX_PAYLOAD_BYTES) {
            if (data.localization) {
                const { localization, ...rest } = data;
                body.data = rest;
                toast('Localization edits are too large for cloud sync and stay on this device');
            }
            if (JSON.stringify(body).length > MAX_PAYLOAD_BYTES) throw new ApiError(413, 'too_large');
        }

        let res;
        try {
            res = await api('/api/profile', { method: 'PUT', body });
        } catch (e) {
            if (e.status !== 409 || baseRevision === 0) throw e;
            return resolveConflict(data);
        }

        st.revision = res.revision;
        st.lastSyncedAt = Date.now();
        writeMeta({ userId: st.user.id, revision: res.revision, hashes: sectionHashes(data) });
        if (applyAfter) {
            await applyCloudData(body.data);
            await commitMeta(res.revision);
        }
        setSync('synced');
        return res;
    }

    async function resolveConflict(localData) {
        const meta = readMeta();
        const cloud = await api('/api/profile');
        const dirty = meta && meta.userId === st.user.id ? dirtySections(localData, meta.hashes) : SECTION_NAMES;
        const merged = mergeSections(cloud.data, localData, dirty);
        const res = await api('/api/profile', {
            method: 'PUT',
            body: { schemaVersion: SCHEMA_VERSION, baseRevision: cloud.revision, data: merged },
        });
        st.revision = res.revision;
        st.lastSyncedAt = Date.now();
        await applyCloudData(merged);
        await commitMeta(res.revision);
        return res;
    }

    function scheduleSave(delay = SAVE_DEBOUNCE_MS) {
        if (st.status !== 'signed-in' || st.readOnly) return;
        clearTimeout(st.timer);
        setSync('pending');
        st.timer = setTimeout(save, delay);
    }

    async function save() {
        if (st.status !== 'signed-in' || st.readOnly) return;
        if (st.running) { st.again = true; return; }
        st.running = true;
        try {
            const local = await buildCloudPayload();
            const meta = readMeta();
            const sameUser = !!(meta && meta.userId === st.user.id);
            const dirty = sameUser ? dirtySections(local, meta.hashes) : SECTION_NAMES;
            if (sameUser && dirty.length === 0) { setSync('synced'); return; }
            if (!sameUser) {
                st.running = false;
                await reconcile({ quiet: true });
                return;
            }
            setSync('syncing');
            await pushSnapshot(local, st.revision || meta.revision || 0);
            st.backoff = 0;
            setSync('synced');
        } catch (e) {
            handleSyncError(e);
        } finally {
            st.running = false;
            render();
            if (st.again) { st.again = false; scheduleSave(); }
        }
    }

    function flushOnHide() {
        if (st.status !== 'signed-in' || st.readOnly || !st.timer) return;
        clearTimeout(st.timer);
        st.timer = null;
        save();
    }

    function handleSyncError(e) {
        console.warn('[cloud] sync failed:', e && e.code ? e.code : e);
        if (e.status === 401) {
            st.user = null;
            clearCachedUser();
            setStatus('guest');
            toast('Session expired, please sign in again');
            return;
        }
        if (e.status === 413) { st.sync = 'error'; toast('Settings are too large for cloud sync'); return; }
        if (e.status === 404 || e.status === 409) { st.backoff = 0; scheduleRetry(1500); return; }
        st.sync = e.status === 0 ? 'offline' : 'error';
        st.backoff = Math.min(MAX_BACKOFF_MS, (st.backoff || 5000) * 2);
        scheduleRetry(st.backoff);
    }

    function scheduleRetry(ms) {
        clearTimeout(st.retryTimer);
        st.retryTimer = setTimeout(() => { if (st.status === 'signed-in') save(); }, ms);
    }

    function cancelTimers() {
        clearTimeout(st.timer); clearTimeout(st.retryTimer);
        st.timer = st.retryTimer = null; st.backoff = 0;
    }

    async function deleteCloudProfile() {
        if (st.status !== 'signed-in') return;
        if (!window.confirm('Delete your cloud profile? Settings on this device stay as they are.')) return;
        try {
            await api('/api/profile', { method: 'DELETE' });
            try { localStorage.removeItem(META_KEY); } catch (_) { }
            st.revision = 0;
            st.lastSyncedAt = null;
            setSync('idle');
            toast('Cloud profile deleted');
        } catch (e) {
            toast('Could not delete the cloud profile');
        }
        render();
    }

    function setStatus(s) { st.status = s; render(); }
    function setSync(s) { st.sync = s; render(); }

    function avatarEl(user, size) {
        const wrap = document.createElement('span');
        wrap.className = 'd2-avatar' + (user && user.frame ? ` d2-frame--${user.frame}` : '');
        wrap.style.setProperty('--d2-av-size', size + 'px');
        const img = document.createElement('img');
        img.alt = '';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.draggable = false;
        if (user && user.avatar) img.src = user.avatar;
        wrap.appendChild(img);
        return wrap;
    }

    const SYNC_TEXT = {
        idle: 'Not synced yet',
        syncing: 'Syncing…',
        synced: 'Saved to the cloud',
        pending: 'Changes will be saved in a moment',
        offline: 'Cloud unavailable — working locally',
        readonly: 'Sync paused: profile saved by a newer version',
        error: 'Cloud error — will retry',
    };

    function syncLabel() {
        if (st.sync === 'synced' && st.lastSyncedAt) {
            return 'Saved to the cloud at ' + new Date(st.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return SYNC_TEXT[st.sync] || '';
    }

    function render() {
        const signedIn = st.status === 'signed-in' || st.status === 'offline';
        const user = signedIn ? st.user : null;

        ['accountButton', 'mobileAccountButton'].forEach((id) => {
            const btn = $(id);
            if (!btn) return;
            const iconHost = btn.querySelector('[data-account-icon]');
            const label = btn.querySelector('[data-account-label]');
            if (iconHost) {
                iconHost.textContent = '';
                if (user) iconHost.appendChild(avatarEl(user, id === 'accountButton' ? 32 : 28));
                else {
                    const i = document.createElement('span');
                    i.className = 'material-symbols-rounded';
                    i.textContent = 'account_circle';
                    iconHost.appendChild(i);
                }
            }
            if (label) label.textContent = user ? user.name : 'Sign in';

            if (id === 'accountButton') {
                let nameEl = btn.querySelector('.account-name');
                if (user) {
                    if (!nameEl) {
                        nameEl = document.createElement('span');
                        nameEl.className = 'account-name';
                        btn.appendChild(nameEl);
                    }
                    nameEl.textContent = user.name;
                } else if (nameEl) {
                    nameEl.remove();
                }
            }

            if (id === 'accountButton') {
                let nameEl = btn.querySelector('.account-name');
                if (user) {
                    if (!nameEl) {
                        nameEl = document.createElement('span');
                        nameEl.className = 'account-name';
                        btn.appendChild(nameEl);
                    }
                    nameEl.textContent = user.name;
                } else if (nameEl) {
                    nameEl.remove();
                }
            }

            btn.setAttribute('aria-label', user ? `Account: ${user.name}` : 'Sign in with Discord');
            btn.classList.toggle('is-signed-in', !!user);
        });

        const panel = $('accountPanelBody');
        if (!panel) return;
        panel.textContent = '';

        if (!user) {
            const card = document.createElement('div');
            card.className = 'd2-account-card';
            const text = document.createElement('p');
            text.className = 'd2-account-hint';
            text.textContent = 'Sign in with Discord to keep your settings, cart and packs in the cloud and use them on every device. ' +
                'Without signing in, everything stays in this browser.';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'd2-btn d2-btn--primary';
            btn.id = 'discordLoginBtn';
            btn.innerHTML = '<i class="bi bi-discord" aria-hidden="true"></i><span>Sign in with Discord</span>';
            btn.addEventListener('click', login);
            card.append(text, btn);

            const note = document.createElement('p');
            note.className = 'd2-account-note';
            note.textContent = 'We only read your Discord name, avatar and your roles on our server. Nothing is posted on your behalf.';
            panel.append(card, note);

            if (st.sync === 'error') {
                const warn = document.createElement('p');
                warn.className = 'd2-account-warn';
                warn.textContent = 'Your browser seems to block third-party cookies, so the login could not be completed. ' +
                    'Allow cookies for the sync service or use a browser without strict cross-site tracking protection.';
                panel.appendChild(warn);
            }
            return;
        }

        const head = document.createElement('div');
        head.className = 'd2-account-card d2-account-card--user';
        head.appendChild(avatarEl(user, 72));
        const info = document.createElement('div');
        info.className = 'd2-account-info';
        const name = document.createElement('div');
        name.className = 'd2-account-name';
        name.textContent = user.name;
        info.appendChild(name);
        if (user.label) {
            const chip = document.createElement('span');
            chip.className = `d2-role-chip d2-role-chip--${user.frame || 'none'}`;
            chip.textContent = user.label;
            info.appendChild(chip);
        } else if (!user.inGuild) {
            const hint = document.createElement('div');
            hint.className = 'd2-account-sub';
            hint.textContent = 'Not a member of our Discord server';
            info.appendChild(hint);
        }
        const syncLine = document.createElement('div');
        syncLine.className = `d2-account-sync d2-account-sync--${st.sync}`;
        syncLine.setAttribute('role', 'status');
        syncLine.textContent = syncLabel();
        info.appendChild(syncLine);
        head.appendChild(info);
        panel.appendChild(head);

        const group = document.createElement('div');
        group.className = 'st-group';
        group.appendChild(actionRow('sync', 'Sync now', 'Pull the latest version from the cloud', () => reconcile({})));
        group.appendChild(actionRow('badge', 'Refresh roles', 'Re-check your roles on the Discord server', login));
        group.appendChild(actionRow('cloud_off', 'Delete cloud profile', 'Remove the stored copy; this device keeps its settings', deleteCloudProfile));
        group.appendChild(actionRow('logout', 'Sign out', 'This device keeps working with local settings', logout));
        panel.appendChild(group);
    }

    function actionRow(icon, title, desc, onClick) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'st-row st-row--action';
        b.innerHTML =
            '<span class="st-row-icon"><span class="material-symbols-rounded"></span></span>' +
            '<span class="st-row-text"><span class="st-row-title"></span><span class="st-row-desc"></span></span>' +
            '<span class="material-symbols-rounded st-row-chevron">chevron_right</span>';
        b.querySelector('.st-row-icon .material-symbols-rounded').textContent = icon;
        b.querySelector('.st-row-title').textContent = title;
        b.querySelector('.st-row-desc').textContent = desc;
        b.addEventListener('click', onClick);
        return b;
    }

    function openAccountPanel() {
        const tab = $('stTab-account');
        const settings = $('settingsButton');
        if (settings) settings.click();
        if (tab) setTimeout(() => tab.click(), 0);
    }

    function bindUi() {
        $('accountButton')?.addEventListener('click', openAccountPanel);
        $('mobileAccountButton')?.addEventListener('click', () => {
            $('mobileMenu')?.classList.remove('active');
            setTimeout(openAccountPanel, 150);
        });
    }

    window.D2PFXCloud = {
        notifyChange: onLocalChange,
        syncNow: () => reconcile({}),
        login,
        logout,
        get status() { return st.status; },
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
