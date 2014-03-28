(function() {
    if (!navigator.mozApps) return;

    var manifest_url = location.protocol + '//' + location.host + '/manifest.webapp';

    var installCheck = navigator.mozApps.checkInstalled(manifest_url);

    installCheck.onsuccess = function() {
        if(!installCheck.result) {
            var install_button = document.querySelector('#install');
            install_button.style.display = 'block';
            install_button.addEventListener('click', function() {
                window.navigator.mozApps.install(manifest_url);
            });
        }
    };
})()
