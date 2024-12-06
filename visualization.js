document.addEventListener("DOMContentLoaded", function () {
    let map = null;
    let cityMap = null;

    const cities = {
        Toronto: { coords: [43.7232, -79.3832], zoom: 11 },
        Vancouver: { coords: [49.2827, -123.1207], zoom: 11 },
        Montreal: { coords: [45.5017, -73.5673], zoom: 11 },
        Ottawa: { coords: [45.4215, -75.6972], zoom: 12 }
    };

    async function initMap(city) {
        const container = document.getElementById('city-map');

        if (!container) return;

        if (map) {
            if (cityMap?.currentGeoJson) {
                cityMap.currentGeoJson.remove();
            }
            if (map.legend) {
                map.removeControl(map.legend);
            }
            map.remove();
            map = null;
            cityMap = null;
        }

        map = L.map('city-map', {
            preferCanvas: true
        }).setView(cities[city].coords, cities[city].zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        if (city === 'Toronto') {
            cityMap = new TorontoMap(map);
            await cityMap.initialize();
        } else if (city === 'Ottawa') {
            cityMap = new OttawaMap(map);
            await cityMap.initialize();
        }
    }

    function initializeOnce() {
        const select = document.getElementById('citySelect');
        if (select) {
            select.addEventListener('change', (e) => initMap(e.target.value));
        }
        initMap('Toronto');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeOnce);
    } else {
        initializeOnce();
    }
});