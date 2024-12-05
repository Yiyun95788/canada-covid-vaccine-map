document.addEventListener("DOMContentLoaded", function () {
    const cities = {
        Toronto: { coords: [43.6532, -79.3832], zoom: 11 },
        Vancouver: { coords: [49.2827, -123.1207], zoom: 11 },
        Montreal: { coords: [45.5017, -73.5673], zoom: 11 },
        Ottawa: { coords: [45.4215, -75.6972], zoom: 11 }
    };

    let currentMap = null;

    function initMap(city) {
        if (currentMap) {
            currentMap.remove();
        }

        currentMap = L.map('city-map').setView(cities[city].coords, cities[city].zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(currentMap);

        L.circleMarker(cities[city].coords, {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: 10
        }).addTo(currentMap)
            .bindPopup(`<b>${city}</b><br>Click for more details`)
            .on('click', () => loadCityData(city));
    }

    function loadCityData(city) {
        console.log(`Loading data for ${city}`);
    }

    initMap('Toronto');

    document.getElementById('citySelect').addEventListener('change', (e) => {
        initMap(e.target.value);
    });
});
