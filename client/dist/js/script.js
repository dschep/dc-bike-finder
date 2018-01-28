(function() {
  const ORIGIN = 'https://2xzl9z8rqc.execute-api.us-east-1.amazonaws.com/prod';
  let userHasDragged = false;
  const icon = iconName => L.icon({
    iconUrl: `img/${iconName}.png`,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
  let location;
  const markers = {};
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
  };

  const updateMarkers = (locationOnly = false) => {
    const fetcher = {
      cabi: () => fetch(`${ORIGIN}/cabi`)
        .then(resp => resp.json())
        .then(({stationBeanList}) => stationBeanList.map(
          ({latitude, longitude, stationName, availableDocks, availableBikes}) => ({
            percentBikes: Math.round(availableBikes/(availableBikes+availableDocks)*10) * 10,
            latitude,
            longitude,
            label: `<div>
                      <h3>${stationName}</h3>
                      <p>Bikes: ${availableBikes} - Slots: ${availableDocks}</p>
                    </div>`,
          }))),
      jump: () => fetch('https://dc.jumpmobility.com/opendata/free_bike_status.json', {cors: true})
        .then(resp => resp.json())
        .then(({data: {bikes}}) => bikes.map(({name, lon, lat}) => ({
          longitude: lon,
          latitude: lat,
          label: `<div>${name}</div>`,
        }))),
      ofo: (location) => !location?Promise.resolve([]):fetch(`${ORIGIN}/ofo?longitude=${location.lng}&latitude=${location.lat}`)
        .then(resp => resp.json())
        .then(({values}) => values.cars.map(({lat, lng}) => ({
          longitude: lng,
          latitude: lat,
          label: 'ofo',
        }))),
      mobike: (location) => !location?Promise.resolve([]):fetch(`${ORIGIN}/mobike?longitude=${location.lng}&latitude=${location.lat}`)
        .then(resp => resp.json())
        .then(({object}) => object.map(({distX, distY}) => ({
          longitude: distX,
          latitude: distY,
          label: 'mobike',
        }))),
      limebike: (location) => !location?Promise.resolve([]):fetch(`${ORIGIN}/limebike?longitude=${location.lng}&latitude=${location.lat}`)
        .then(resp => resp.json())
        .then(({data}) => data.attributes.nearby_locked_bikes.map(({attributes}) => ({
          longitude: attributes.longitude,
          latitude: attributes.latitude,
          label: 'limebike',
        }))),
      zagster: (location) => fetch(`${ORIGIN}/mbike`)
        .then(resp => resp.json())
        .then(({data}) => data.map(({geo, availableDockingSpaces, bikes, name}) => ({
          longitude: geo.coordinates[0],
          latitude: geo.coordinates[1],
          percentBikes: Math.round(bikes/(bikes+availableDockingSpaces)*10) * 10,
          label: `<div>
                    <h3>${name}</h3>
                    <p>Bikes: ${bikes} - Slots: ${availableDockingSpaces}</p>
                  </div>`,
        }))),
    };

    ['cabi', 'jump', 'ofo', 'mobike',/* 'limebike',*/ 'zagster'].map((system) => {
      updating[system] = true;
      return fetcher[system](location)
        .then((bikes) => {
          if(markers[system] && map) map.removeLayer(markers[system]);
          removeSpinner(system);
          markers[system] = L.layerGroup();
          bikes.map(({latitude, longitude, label, percentBikes}) => {
            const marker = L.marker([latitude, longitude], {
              icon: icon(`${system}${percentBikes===undefined?'':percentBikes}`),
            });
            marker.bindPopup(label);
            markers[system].addLayer(marker);
          });
          map.addLayer(markers[system]);
        });
    });
  };

  L.tileLayer('https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apikey}', {
    attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    apikey: '43a3528946814e018e2667b156d87992',
    maxZoom: 22
  }).addTo(map)

  // hacking this in JS bc of Leaflet/Leaflet#466
  document.querySelector('.leaflet-control-attribution a').target = '_blank';

  L.control.locate({
    setView: false,
    locateOptions: {
      maxZoom: 15,
      enableHighAccuracy: true,
      watch: true,
    },
  }).addTo(map).start();
  map.on('locationfound', function({latlng}) {
    if (!userHasDragged)
      map.setView(latlng, 15);
    location = latlng;
    updateMarkers(true);
  });
  map.on('dragend', () => {userHasDragged = true;});

  updateMarkers();
  window.setTimeout(updateMarkers, 60000);
})()
