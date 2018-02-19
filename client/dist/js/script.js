(function() {
  const ORIGIN = window.location.host == 'share.bikehero.io'
    ? 'https://2xzl9z8rqc.execute-api.us-east-1.amazonaws.com/prod'
    : 'https://wahzhpvf98.execute-api.us-east-1.amazonaws.com/dev';
  let userHasDragged = false;
  let location;
  const markers = {
    mobike: L.layerGroup(),
    cabi: L.layerGroup(),
    jump: L.layerGroup(),
    limebike: L.layerGroup(),
    spin: L.layerGroup(),
    ofo: L.layerGroup(),
    zagster: L.layerGroup(),
  };
  const updating = {
    mobike: false,
    cabi: false,
    jump: false,
    limebike: false,
    spin: false,
    ofo: false,
    zagster: false,
  }

  const map = L.map('map').setView([38.91, -77.04], 11);
  for (const layerGroup of Object.values(markers)) {
    map.addLayer(layerGroup);
  }
  const removeSpinner = (finishedService) => {
    updating[finishedService] = false;
  };

  // Turn a GBFS result in to GeoJSON
  const bikesGBFS2GeoJSON = bikes => jmespath.search(bikes,
          '{type: `FeatureCollection`, features: data.bikes[*].{type: `Feature`, id: bike_id, geometry: {type: `Point`, coordinates: [lon, lat]}, properties: @}}');

  // Turn an array of 'flat' objects. latitude, longitude keys turned into the point coordinate
  // and remainder put into properties
  const arrayFlatObjects2GeoJSON = array => ({
    type: 'FeatureCollection',
    features: array.map(object => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [object.longitude, object.latitude],
      },
      properties: object,
    }))
  });

  const updateMarkers = (locationOnly = false) => {
    const fetcher = {
      cabi: () => Promise.all([
        fetch('https://gbfs.capitalbikeshare.com/gbfs/en/station_information.json', {cors: true}),
        fetch('https://gbfs.capitalbikeshare.com/gbfs/en/station_status.json', {cors: true})])
  .then(resps => Promise.all(resps.map(resp => resp.json())))
  .then(([info, stat]) => [
    jmespath.search(info, '{type: `FeatureCollection`, features: data.stations[*].{type: `Feature`, id: station_id, geometry: {type: `Point`, coordinates: [lon, lat]}, properties: @}}'),
    jmespath.search(stat, '{type: `FeatureCollection`, features: data.stations[*].{type: `Feature`, id: station_id, properties: @}}')])
  .then(([infoGeoJSON, statGeoJSON]) => {
    const statMap = new Map(statGeoJSON.features.map(({id, properties}) => [id, properties]));
    infoGeoJSON.features = infoGeoJSON.features.map(({id, geometry, properties, type}) => ({
      id,
      type,
      geometry,
      properties: Object.assign({}, properties, statMap.get(id)),
    }));
    return infoGeoJSON;
  }),
      jump: () => fetch('https://dc.jumpmobility.com/opendata/free_bike_status.json', {cors: true})
        .then(resp => resp.json())
        .then(bikesGBFS2GeoJSON),
      ofo: (location) => !location?Promise.resolve([]):fetch(`${ORIGIN}/ofo?longitude=${location.lng}&latitude=${location.lat}`)
        .then(resp => resp.json())
        .then(({values}) => values.cars.map(({lat, lng}) => ({
          longitude: lng,
          latitude: lat,
        })))
        .then(arrayFlatObjects2GeoJSON),
      mobike: (location) => !location?Promise.resolve([]):fetch(`${ORIGIN}/mobike?longitude=${location.lng}&latitude=${location.lat}`)
        .then(resp => resp.json())
        .then(({object}) => object.map(({distX, distY}) => ({
          longitude: distX,
          latitude: distY,
        })))
        .then(arrayFlatObjects2GeoJSON),
      limebike: () => fetch(`${ORIGIN}/limebike`)
        .then(resp => resp.json())
        .then(({data}) => data.map(({attributes: {latitude, longitude}}) => ({
          longitude,
          latitude,
        })))
        .then(arrayFlatObjects2GeoJSON),
      spin: () => fetch('https://web.spin.pm/api/gbfs/v1/free_bike_status', {cors: true})
        .then(resp => resp.json())
        .then(bikesGBFS2GeoJSON),
      zagster: (location) => fetch(`${ORIGIN}/mbike`)
        .then(resp => resp.json())
        .then(({data}) => data.map(({geo, availableDockingSpaces, bikes, name}) => ({
          longitude: geo.coordinates[0],
          latitude: geo.coordinates[1],
          name,
          num_bikes_available: bikes,
          num_docks_available: availableDockingSpaces,
          capacity: bikes + availableDockingSpaces,
        })))
        .then(arrayFlatObjects2GeoJSON),
    };

    ['cabi', 'jump', 'ofo', 'mobike', 'limebike', 'spin', 'zagster'].map((system) => {
      updating[system] = true;
      return fetcher[system](location)
        .then((bikes) => {
          markers[system].clearLayers();
          removeSpinner(system);
          const layer = L.geoJson(bikes, {
            pointToLayer: ({properties, geometry: {coordinates}}, latlng) => {
              const percentBikes = properties.num_bikes_available && Math.round(
                properties.num_bikes_available/properties.capacity*10) * 10;
              return L.marker(latlng, {
                icon: L.divIcon({
                  className: `${system}${percentBikes!==undefined?percentBikes:''}`,
                  popupAnchor: [0, -16],
                }),
              }).bindPopup(`
                <div>
                  <h3>${properties.name||system}</h3>
                  ${properties.num_bikes_available===undefined?'':`
                  <p>
                  Bikes: ${properties.num_bikes_available}
                  -
                  Slots: ${properties.num_docks_available}
                  </p>
                  `}
                </div>`);
            },
          });
          markers[system].addLayer(layer);
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

  map.on('zoomend', (e) => {
    if (map.getZoom() < 14) {
      document.getElementById('map').classList.add('zoomed-out');
    } else {
      document.getElementById('map').classList.remove('zoomed-out');
    }
    
  })

  L.control.layers({}, markers).addTo(map);

  updateMarkers();
  window.setTimeout(updateMarkers, 60000);
})()
