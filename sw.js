const CACHE_VERSION = 4;
const CACHE_NAME = `d2pfx-previews-v${CACHE_VERSION}`;
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');

const PREVIEW_EXT = /\.(webp|mp4|gif|webm|png)$/;
const PREVIEW_CDN_HOST = 'cdn.jsdelivr.net';
const PREVIEW_CDN_PREFIX = '/gh/h6rd/Dota2PornFxWeb@mirror/assets/previews/';
const PREVIEW_FALLBACK_HOST = 'raw.githubusercontent.com';
const PREVIEW_FALLBACK_PREFIX = '/h6rd/Dota2PornFxWeb/mirror/assets/previews/';

function isPreviewRequest(url) {
    if (!PREVIEW_EXT.test(url.pathname)) return false;
    if (url.origin === self.location.origin) {
        return url.pathname.includes(`${BASE_PATH}/assets/previews/`);
    }
    return (url.hostname === PREVIEW_CDN_HOST && url.pathname.startsWith(PREVIEW_CDN_PREFIX)) ||
        (url.hostname === PREVIEW_FALLBACK_HOST && url.pathname.startsWith(PREVIEW_FALLBACK_PREFIX));
}

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (isPreviewRequest(url)) {

        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => cachedResponse);

                    return cachedResponse || fetchPromise;
                });
            })
        );
    }
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter(name => name.startsWith('d2pfx-previews-') && name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});