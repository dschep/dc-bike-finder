(function() {
    if (!navigator.mozApps) return;

    var manifest_url = location.href + 'manifest.webapp';

    var installCheck = navigator.mozApps.checkInstalled(manifest_url);

    installCheck.onsuccess = function() {
      if(!installCheck.result)
        window.navigator.mozApps.install(manifest_url);
    };
})()
