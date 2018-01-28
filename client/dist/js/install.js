(function() {
  if (navigator.serviceWorker) navigator.serviceWorker.register('/sw.js')
    .then(function() { console.log('Service Worker Registered'); });
})()
