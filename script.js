(function() {
    var map, markers;

    var update_markers = function() {
        var xhr = new XMLHttpRequest();
        xhr.onload = function(e) {
            if (xhr.status === 200 || xhr.status === 0) {
                if(markers && map) map.removeLayer(markers);

                markers = L.markerClusterGroup();

                $.each(xhr.responseXML.querySelectorAll('station'), function(i, node) {
                    var marker = L.marker([
                        node.querySelector('lat').textContent,
                        node.querySelector('long').textContent
                        ]);
                    marker.bindPopup('<div>' +
                            '<h3>' + node.querySelector('name').textContent + '</h3>' +
                            '<p>Bikes: ' + node.querySelector('nbBikes').textContent + ' - ' +
                            'Slots: ' + node.querySelector('nbEmptyDocks').textContent + '</p>' +
                            '</div>');
                    markers.addLayer(marker);
                });

                map.addLayer(markers);
            } else {
                alert('Failed to retrieve data from Capital Bikeshare')
            }
        }
        xhr.open('GET', '/data/stations/bikeStations.xml', true);
        xhr.responseType = 'document';
        xhr.send();
    };

    map = L.map('map').setView([38.91, -77.04], 11);

    L.tileLayer('http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="http://openstreetmap.org">OpenCycleMap</a>, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
                }).addTo(map)

    L.control.locate().addTo(map);

    update_markers();
})()
