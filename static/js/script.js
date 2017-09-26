(function() {
  const icon = iconName => L.icon({
    iconUrl: `/img/${iconName}.png`,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
  let cabiMarkers, mobikeMarkers, jumpMarkers, location;

  const map = L.map('map').setView([38.91, -77.04], 11);

  const updateMarkers = (locationOnly = false) => {
    document.querySelector('.reload-control .icon').classList.add('spin');

    if (!locationOnly) {
      fetch('/stations/stations.json')
        .then(resp => resp.json())
        .then(({stationBeanList}) => {
          if(cabiMarkers && map) map.removeLayer(cabiMarkers);
          document.querySelector('.reload-control .icon').classList.remove('spin');

          cabiMarkers = L.layerGroup();

          stationBeanList.map(({latitude, longitude, stationName, availableDocks, availableBikes}) => {
            const marker = L.marker([latitude, longitude], {icon: icon('cabi')});
            marker.bindPopup(
              `<div>
              <h3>${stationName}</h3>
              <p>Bikes: ${availableBikes} - Slots: ${availableDocks}</p>
              </div>`);
              cabiMarkers.addLayer(marker);
          });

          map.addLayer(cabiMarkers);
        });
      fetch('https://app.socialbicycles.com/api/networks/136/bikes.json', {cors: true})
        .then(resp => resp.json())
        .then(({items}) => {
          if(jumpMarkers && map) map.removeLayer(jumpMarkers);
          jumpMarkers = L.layerGroup();
          items.map(({name, address, current_position}) => {
            const marker = L.marker(current_position.coordinates.reverse(),
                                  {icon: icon('jump')});
            marker.bindPopup(`<div>${name}<p>${address}</p></div>`);
            jumpMarkers.addLayer(marker);
          });
          map.addLayer(jumpMarkers);
        });
    }
    if (location)
      fetch(`/mobike?longitude=${location.lng}&latitude=${location.lat}`)
        .then(resp => resp.json())
        .then(({object}) => {
          if(mobikeMarkers && map) map.removeLayer(mobikeMarkers);
          mobikeMarkers = L.layerGroup();
          object.map(({distX, distY}) => {
            const marker = L.marker([distY, distX], {icon: icon('mobike')});
            marker.bindPopup('<div>MOBIKE</div>');
            mobikeMarkers.addLayer(marker);
          });
          map.addLayer(mobikeMarkers);
        });
  };


  const ReloadControl = L.Control.extend({
    options: {
      position: 'topright'
    },

    onAdd: function (map) {
      const container = L.DomUtil.create('div', 'reload-control leaflet-bar');
      const innerContainer = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
      L.DomUtil.create('div', 'icon', innerContainer);

      L.DomEvent
      .addListener(container, 'click', L.DomEvent.stop)
      .addListener(container, 'click', updateMarkers, this);
      L.DomEvent.disableClickPropagation(container);

      return container;
    }
  });


  L.tileLayer('https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apikey}', {
    attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    apikey: '43a3528946814e018e2667b156d87992',
    maxZoom: 22
  }).addTo(map)

  // hacking this in JS bc of Leaflet/Leaflet#466
  document.querySelector('.leaflet-control-attribution a').target = '_blank';

  L.control.locate({locateOptions: {
    maxZoom: 15,
    enableHighAccuracy: true,
  }}).addTo(map).start();
  map.on('locationfound', function({latlng}) {
    location = latlng;
    updateMarkers(true);
  });

  map.addControl(new ReloadControl());

  updateMarkers();
  window.setTimeout(updateMarkers, 60000);
})()
