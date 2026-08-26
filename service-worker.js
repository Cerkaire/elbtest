self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('epic-list-cache').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/icon-192.png',
                '/icon-512.png',
                // Ajoute ici tous les fichiers nécessaires
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});