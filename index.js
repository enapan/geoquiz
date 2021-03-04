
var popup;

var myStyle = {
  color: "cornflowerblue",
  weight: 1,
  opacity: 1,
  fillOpacity: 0,
  dashArray: '2, 5'
};
L.geoJSON(pacific).setStyle(myStyle).addTo(map);
L.geoJSON(pacific2).setStyle(myStyle).addTo(map);

const shuffledCountries = shuffle(countries);
const state = {
  target: null,
  correct: 0,
  wrong: 0,
  skipped: 0
}

function nextTarget() {
  if (shuffledCountries.length > 0) {
    state.target = shuffledCountries.pop();
  } else {
    alert(`Game over! Congratulations! \n You found all ${state.correct} countries, with ${state.wrong} incorrect guesses, and you skipped ${state.skipped} countries.`);
  }
  document.getElementById('target').textContent = normalizeCountryName(state.target.address.country);
  updateUiState();
}
nextTarget();

function updateUiState() {
  document.getElementById('correct').textContent = state.correct;
  document.getElementById('wrong').textContent = state.wrong;
  document.getElementById('skipped').textContent = state.skipped;
}

document.getElementById('skip').onclick = function() {
  state.skipped++;
  nextTarget();
}

map.on('click', function(ev) {
  const latlng = ev.latlng;
  const queryParams = { 'accept-language': 'en', format: 'json', lat: latlng.wrap().lat, lon: latlng.wrap().lng, zoom: 3 };
  getJson('https://nominatim.openstreetmap.org/reverse', queryParams).then(function(place) {
    if (place.error === "Unable to geocode") {
      popup = L.popup().setLatLng(latlng).setContent("Nothing here").openOn(map);
    } else if (place.error) {
      console.error('reverse geocoding error: ' + place.error);
    } else {
      const countryName = normalizeCountryName(place.address.country || place.display_name);
      const targetCountry = normalizeCountryName(state.target.address.country);
      if (countryName === targetCountry) {
        const popupText = `You correctly located <span class="correct">${targetCountry}</span>. Good job!`;
        popup = L.popup().setLatLng(latlng).setContent(popupText).openOn(map);
        displayCountryShape(countryName, 'darkviolet').then(function() {
          state.correct++;
          nextTarget();
        });
      } else {
        const incorrectLocation = normalizeCountryName(countryName);
        const distance = Math.round(L.latLng(state.target.lat, state.target.lon).distanceTo(latlng) / 1000)
        const popupText = `You clicked on <span class="incorrect">${incorrectLocation}</span>, not ${targetCountry}. Try again!<br><span class="hint">Hint: ${targetCountry} is approximately ${distance} km away.</span>`;
        popup = L.popup().setLatLng(latlng).setContent(popupText).openOn(map);
        displayCountryShape(countryName, 'orangered').then(function() {
          state.wrong++;
          updateUiState();
        });
      }
    }
  })
});

var wrongShape;

function displayCountryShape(countryName, color) {
  const queryParams = { 'accept-language': 'en', country: countryName, format: 'json', lang: 'en', polygon_geojson: 1, polygon_threshold: 0.01 };
  return getJson('https://nominatim.openstreetmap.org/search', queryParams).then(function(places) {
    const shapes = places.filter(function(place) {
      return place.geojson.type.endsWith("Polygon") && place.display_name === countryName;
    });
    if (shapes[0]) {
      var geojson = {
        type: 'Feature',
        geometry: shapes[0].geojson
      };
      if (wrongShape) wrongShape.removeFrom(map);
      if (color === 'darkviolet') {
        L.geoJSON(geojson).setStyle({ color: color, fillColor: color, weight: 1 }).addTo(map);
      } else if (color === 'orangered') {
        wrongShape = L.geoJSON(geojson).setStyle({ color: color, fillColor: color, weight: 1 });
        wrongShape.addTo(map);  
      }
    } else {
      console.error(`cannot display shape of country: ${countryName}`, places);
    }
  });
}

function normalizeCountryName(countryName) {
  switch (countryName) {
    //case "Czechia": return "Czech Republic";
    //case "Democratic Republic of the Congo": return "Congo";
    //case "Guam": return "United States of America";
    case "RDPA": return "Algeria";
    case "RSA": return "South Africa";
    //case "Russian Federation": return "Russia";
    //case "Sahrawi Arab Democratic Republic": return "Morocco";
    case "SBA": return "Akrotiri and Dhekelia";
    case "Sint Maarten": return "The Netherlands";
    case "South Ossetia": return "Georgia";
    //case "Territorial waters of Faroe Islands": return "Faroe Islands";
    case "Turkish Republic Of Northern Cyprus": return "Cyprus";
    //case "North Macedonia": return "Macedonia";
    case "Mindanao": return "Philippines";
    case "Luzon": return "Philippines";
    case "Visayas": return "Philippines";
    default: return countryName;
  }
}

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
