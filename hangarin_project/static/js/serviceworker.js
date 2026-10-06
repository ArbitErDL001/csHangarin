const CACHE_NAME = 'hangarin-static-v13';
const APP_SHELL = [
    '/offline/',
    '/static/css/dashboard-clean.css',
    '/static/css/login.css',
    '/static/js/dashboard.js',
    '/static/js/login.js',
    '/static/img/icon-192.png',
    '/static/img/icon-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName.startsWith('hangarin-static-'))
                    .filter((cacheName) => cacheName !== CACHE_NAME)
                    .map((cacheName) => caches.delete(cacheName))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    if (event.request.headers.get('X-Hangarin-Download') === 'true') {
        event.respondWith(fetch(event.request));
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('/offline/'))
        );
        return;
    }

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith('/static/')) {
        event.respondWith(
            caches.match(event.request, { ignoreSearch: true })
                .then((cachedResponse) => cachedResponse || fetch(event.request))
        );
    }
});