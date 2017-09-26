(function() {
  const icon = iconName => L.icon({
    iconUrl: `/img/${iconName}.png`,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
  var map, cabi_markers, mobike_markers, jump_markers;

  var update_markers = function() {
    document.querySelector('.reload-control .icon').classList.add('spin');

    fetch('/stations/stations.json')
      .then(resp => resp.json())
      .then(({stationBeanList}) => {
        if(cabi_markers && map) map.removeLayer(cabi_markers);
        document.querySelector('.reload-control .icon').classList.remove('spin');

        cabi_markers = L.markerClusterGroup();

        stationBeanList.map(({latitude, longitude, stationName, availableDocks, availableBikes}) => {
          var marker = L.marker([latitude, longitude], {icon: icon('cabi')});
          marker.bindPopup(
            `<div>
            <h3>${stationName}</h3>
            <p>Bikes: ${availableBikes} - Slots: ${availableDocks}</p>
            </div>`);
            cabi_markers.addLayer(marker);
        });

        map.addLayer(cabi_markers);
      });
  };


  var ReloadControl = L.Control.extend({
    options: {
      position: 'topright'
    },

    onAdd: function (map) {
      var container = L.DomUtil.create('div', 'reload-control leaflet-bar');
      var inner_container = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
      L.DomUtil.create('div', 'icon', inner_container);

      L.DomEvent
      .addListener(container, 'click', L.DomEvent.stop)
      .addListener(container, 'click', update_markers, this);
      L.DomEvent.disableClickPropagation(container);

      return container;
    }
  });


  map = L.map('map').setView([38.91, -77.04], 11);

  L.tileLayer('https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apikey}', {
    attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    apikey: '43a3528946814e018e2667b156d87992',
    maxZoom: 22
  }).addTo(map)

  // hacking this in JS bc of Leaflet/Leaflet#466
  document.querySelector('.leaflet-control-attribution a').target = '_blank';

  var lc = L.control.locate({locateOptions: {
    maxZoom: 15,
    enableHighAccuracy: true,
  }}).addTo(map).start();
  map.on('locationfound', function({latlng}) {
    //map.on('locationerror', function({latlng}) {
    //var latlng = {lat: 38.910991, lng: -77.0108011};
    fetch(`/mobike?longitude=${latlng.lng}&latitude=${latlng.lat}`)
      .then(resp => resp.json())
      .then(({object}) => {
        if(mobike_markers && map) map.removeLayer(mobike_markers);
        mobike_markers = L.markerClusterGroup();
        object.map(({distX, distY}) => {
          var marker = L.marker([distY, distX], {icon: icon('mobike')});
          marker.bindPopup('<div>MOBIKE</div>');
          mobike_markers.addLayer(marker);
        });
        map.addLayer(mobike_markers);
      });
  });
  fetch('https://app.socialbicycles.com/api/networks/136/bikes.json', {cors: true})
    .then(resp => resp.json())
    .then(({items}) => {
      if(jump_markers && map) map.removeLayer(jump_markers);
      jump_markers = L.markerClusterGroup();
      items.map(({name, address, current_position}) => {
        var marker = L.marker(current_position.coordinates.reverse(),
                              {icon: icon('jump')});
        marker.bindPopup(`<div>${name}<p>${address}</p></div>`);
        jump_markers.addLayer(marker);
      });
      map.addLayer(jump_markers);
    });

        map.addControl(new ReloadControl());

        update_markers();
        window.setTimeout(update_markers, 60000);
})()
