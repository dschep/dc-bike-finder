(function() {
    var map, markers;

    var update_markers = function() {
        document.querySelector('.reload-control .icon').classList.add('spin');

        var xhr = new XMLHttpRequest();
        xhr.onload = function(e) {
            if (xhr.status === 200 || xhr.status === 0) {
                if(markers && map) map.removeLayer(markers);
                document.querySelector('.reload-control .icon').classList.remove('spin');

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


    var ReloadControl = L.Control.extend({
        options: {
            position: 'topright'
        },

        onAdd: function (map) {
            var container = L.DomUtil.create('div', 'reload-control');
            L.DomUtil.create('span', 'icon', container);

            L.DomEvent
                .addListener(container, 'click', L.DomEvent.stop)
                .addListener(container, 'click', update_markers, this);
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });


    map = L.map('map').setView([38.91, -77.04], 11);

    L.tileLayer('http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="http://openstreetmap.org">OpenCycleMap</a>, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
                }).addTo(map)

    L.control.locate().addTo(map);

    map.addControl(new ReloadControl());

    update_markers();
    window.setTimeout(update_markers, 60000);
})()
