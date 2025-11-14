// Nama cache
const CACHE_NAME = 'jif-pizza-pos-cache-v1'; 

// Daftar aset yang akan di-cache
const urlsToCache = [
  '/', 
  'index.html',
  'manifest.json',
  'pizza.jpg', 
  // Jika Anda punya logo.png, masukkan juga
  'logo.png' 
];

// Instalasi Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache assets:', err);
      })
  );
});

// Aktivasi Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Hapus cache lama
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Strategi Cache-First (Fetches)
self.addEventListener('fetch', event => {
  // Hanya ambil permintaan GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika ada di cache, kembalikan dari cache
        if (response) {
          return response;
        }
        
        // Jika tidak ada di cache, ambil dari jaringan
        return fetch(event.request).then(
          response => {
            // Pastikan respons valid
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Kloning respons karena stream hanya bisa dikonsumsi sekali
            const responseToCache = response.clone();

            // Simpan ke cache untuk penggunaan selanjutnya
            caches.open(CACHE_NAME)
              .then(cache => {
                // Jangan cache permintaan yang tidak termasuk dalam daftar aset utama
                // Ini untuk menghemat ruang dan menghindari caching data dinamis
                if (urlsToCache.includes(event.request.url.replace(self.location.origin, ''))) {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});