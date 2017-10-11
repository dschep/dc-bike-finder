(function() {
  ORIGIN = 'https://0v0e2r58h8.execute-api.us-east-1.amazonaws.com/dev';
  const icon = iconName => L.icon({
    iconUrl: `img/${iconName}.png`,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
  let cabiMarkers, mobikeMarkers, jumpMarkers, limebikeMarkers, ofoMarkers, location;
  const updating = {
    mobike: false,
    cabi: false,
    jump: false,
    limebike: false,
    ofo: false,
  }

  const map = L.map('map').setView([38.91, -77.04], 11);
  const removeSpinner = (finishedService) => {
    updating[finishedService] = false;
    if (Object.values(updating).every(i => !i))
      document.querySelector('.reload-control .icon').classList.remove('spin');
  };

  const updateMarkers = (locationOnly = false) => {
    document.querySelector('.reload-control .icon').classList.add('spin');

    if (locationOnly !== true) {
      updating.cabi = true;
      fetch(`${ORIGIN}/cabi`)
        .then(resp => resp.json())
        .then(({stationBeanList}) => {
          if(cabiMarkers && map) map.removeLayer(cabiMarkers);
          removeSpinner('cabi');
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
      updating.jump = true;
      fetch('https://app.socialbicycles.com/api/networks/136/bikes.json', {cors: true})
        .then(resp => resp.json())
        .then(({items}) => {
          if(jumpMarkers && map) map.removeLayer(jumpMarkers);
          removeSpinner('jump');
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
    if (location) {
      updating.mobike = true;
      fetch(`${ORIGIN}/mobike?longitude=${location.lng}&latitude=${location.lat}`)
        .then(resp => resp.json())
        .then(({object}) => {
          if(mobikeMarkers && map) map.removeLayer(mobikeMarkers);
          removeSpinner('mobike');
          mobikeMarkers = L.layerGroup();
          object.map(({distX, distY}) => {
            const marker = L.marker([distY, distX], {icon: icon('mobike')});
            marker.bindPopup('<div>MOBIKE</div>');
            mobikeMarkers.addLayer(marker);
          });
          map.addLayer(mobikeMarkers);
        });
      updating.limebike = true;
      fetch(`${ORIGIN}/limebike?longitude=${location.lng}&latitude=${location.lat}`)
        .then(resp => resp.json())
        .then(({data}) => {
          if(limebikeMarkers && map) map.removeLayer(limebikeMarkers);
          removeSpinner('limebike');
          limebikeMarkers = L.layerGroup();
          data.attributes.nearby_locked_bikes.map(({attributes}) => {
            const marker = L.marker([attributes.latitude, attributes.longitude], {icon: icon('limebike')});
            marker.bindPopup('<div>LIMEBIKE</div>');
            limebikeMarkers.addLayer(marker);
          });
          map.addLayer(limebikeMarkers);
        });
      updating.ofo = true;
      fetch(`${ORIGIN}/ofo?longitude=${location.lng}&latitude=${location.lat}`)
        .then(resp => resp.json())
        .then(({values}) => {
          if(ofoMarkers && map) map.removeLayer(ofoMarkers);
          removeSpinner('ofo');
          ofoMarkers = L.layerGroup();
          values.cars.map(({lat, lng}) => {
            const marker = L.marker([lat, lng], {icon: icon('ofo')});
            marker.bindPopup('<div>OFO</div>');
            ofoMarkers.addLayer(marker);
          });
          map.addLayer(ofoMarkers);
        });
    }
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
