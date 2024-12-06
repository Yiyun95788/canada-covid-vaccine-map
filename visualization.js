document.addEventListener("DOMContentLoaded", function () {
    const cities = {
        Toronto: { coords: [43.7232, -79.3832], zoom: 11 },
        Vancouver: { coords: [49.2827, -123.1207], zoom: 11 },
        Montreal: { coords: [45.5017, -73.5673], zoom: 11 },
        Ottawa: { coords: [45.4215, -75.6972], zoom: 11 }
    };

    let currentMap = null;
    let cityMap = null;

    async function initMap(city) {
        if (currentMap) {
            currentMap.remove();
        }

        currentMap = L.map('city-map').setView(cities[city].coords, cities[city].zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(currentMap);

        if (city === 'Toronto') {
            cityMap = new TorontoMap(currentMap);
            await cityMap.initialize();
        }
    }

    initMap('Toronto');

    document.getElementById('citySelect').addEventListener('change', (e) => {
        initMap(e.target.value);
    });
});