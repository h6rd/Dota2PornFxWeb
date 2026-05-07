const CACHE_VERSION = 2;
const CACHE_NAME = `d2pfx-previews-v${CACHE_VERSION}`;
const BASE_PATH = (
    location.hostname.includes('netlify.app') ||
    location.hostname.includes('onrender.com') ||
    location.hostname.includes('codeberg.page')
) ? '' : '/Dota2PornFxWeb';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.pathname.includes(`${BASE_PATH}/assets/previews/`) &&
        (url.pathname.endsWith('.webp') ||
            url.pathname.endsWith('.mp4') ||
            url.pathname.endsWith('.gif') ||
            url.pathname.endsWith('.webm') ||
            url.pathname.endsWith('.png'))) {

        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
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