const southWest = L.latLng(-62, -180),
    northEast = L.latLng(84, 180),
    bounds = L.latLngBounds(southWest, northEast);
const map = L.map('map', {
  maxBounds: bounds
}).fitWorld();
var popup;

L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
  minZoom: 2,
  maxZoom: 18,
  bounds: bounds,
  attribution: '&copy;<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy;<a href="https://cartodb.com/attributions">CartoDB</a>'
}).addTo(map);

const shuffledCountries = shuffle(countries);
const state = {
  target: shuffledCountries.pop(),
  tries: 0
}

function render() {
  document.getElementById('target').textContent = showCountryName(state.target.address.country);
}

map.on('click', function(ev) {
  const latlng = ev.latlng;
  const queryParams = { format: 'json', lang: 'en', lat: latlng.lat, lon: latlng.lng, zoom: 3 };
  getJson('https://nominatim.openstreetmap.org/reverse', queryParams).then(function(place) {
    if (place.error) {
      console.log('reverse geocoding error: ' + place.error);
    } else {
      const countryName = place.address.country;
      if (countryName === state.target.address.country) {
        const correctLocation = showCountryName(countryName);
        const popupText = `You correctly located <span class="correct">${correctLocation}</span>. Good job!`;
        popup = L.popup().setLatLng(latlng).setContent(popupText).openOn(map);
        displayCountryShape(countryName, 'green');
        randomize();
      } else {
        const incorrectLocation = showCountryName(countryName || 'the sea');
        const targetLocation = showCountryName(state.target.address.country);
        const popupText = `You clicked on <span class="incorrect">${incorrectLocation}</span>, not ${targetLocation}. Try again!`;
        popup = L.popup().setLatLng(latlng).setContent(popupText).openOn(map);
        displayCountryShape(countryName, 'red');
      }
    }
  })
});

function displayCountryShape(countryName, color) {
  const queryParams = { country: countryName, format: 'json', polygon_geojson: '1' };
  getJson('https://nominatim.openstreetmap.org/search', queryParams).then(function(place) {
    if (place[0]) {
      var geojson = {
        "type": "Feature",
        "geometry": place[0].geojson
      };
      L.geoJSON(geojson).setStyle({ color: color, fillColor: color, opacity: 0.7, weight: 1 }).addTo(map);
    } else {
      console.log('cannot display shape of country: ' + countryName);
    }
  });
}

function showCountryName(countryName) {
  switch (countryName) {
    case "Democratic Republic of the Congo": return "Congo";
    case "RDPA": return "Algeria";
    case "RSA": return "South Africa";
    case "Russian Federation": return "Russia";
    default: return countryName;
  }
}

function randomize() {
  if (shuffledCountries.length > 0) {
    state.target = shuffledCountries.pop();
  } else {
    alert('Game over!');
  }
  render();
}
randomize();

function shuffle(array) {
    let counter = array.length;

    while (counter > 0) {
        let index = Math.floor(Math.random() * counter);
        counter--;
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

function buildUrl(baseUrl, queryParams) {
  return baseUrl + '?' + Object.keys(queryParams).map(key => key + '=' + queryParams[key]).join('&');
}

function getJson(baseUrl, queryParams, callback) {
  return fetch(buildUrl(baseUrl, queryParams)).then(response => response.json());
}

function popupSnackbar(message) {
  document.querySelector('#snackbar').MaterialSnackbar.showSnackbar({
    message: message,
    timeout: 3000
  });
}
