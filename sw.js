self.addEventListener('fetch', function(event) {
  // 即使不缓存任何东西，也必须有这个监听器才能触发安装提示
  event.respondWith(fetch(event.request));
});
