// sw.js: 本地文件走缓存，CDN 请求失败时静默处理
const SW_VERSION = 'v13_20260806_stable';

// 需要预缓存的本地核心文件
const LOCAL_CACHE = 'psoulos-local-v13';

// 1. 安装时，立刻接管
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 2. 激活时，清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== LOCAL_CACHE).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. 抓取策略：
//   - 本地文件（同源）：网络优先，失败则用缓存兜底
//   - 外部 CDN（跨域）：网络请求，失败时静默返回 504，不抛错
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // 本地文件：网络优先 + 缓存兜底
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 成功时更新缓存
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(LOCAL_CACHE).then(cache => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => {
          // 网络失败时从缓存里拿
          return caches.match(event.request);
        })
    );
  } else {
    // 外部 CDN：尝试网络，失败时静默返回空响应，不让报错冒泡
    event.respondWith(
      fetch(event.request).catch(() => {
        // 对于 CSS/JS/字体等，返回空的 200，不让控制台满屏报错
        return new Response('', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
  }
});