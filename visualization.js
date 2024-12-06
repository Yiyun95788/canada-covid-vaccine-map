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
            // Properly cleanup existing map
            if (cityMap) {
                if (cityMap.currentGeoJson) {
                    cityMap.currentGeoJson.remove();
                }
                if (currentMap.legend) {
                    currentMap.removeControl(currentMap.legend);
                }
            }
            currentMap.remove();
            currentMap = null;
            cityMap = null;
        }

        const mapContainer = document.getElementById('city-map');
        if (!mapContainer) return;

        currentMap = L.map('city-map').setView(cities[city].coords, cities[city].zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(currentMap);

        if (city === 'Toronto') {
            cityMap = new TorontoMap(currentMap);
            try {
                await cityMap.initialize();
            } catch (error) {
                console.error('Failed to initialize Toronto map:', error);
            }
        }
    }

    // Only initialize if map container exists
    const mapContainer = document.getElementById('city-map');
    if (mapContainer) {
        initMap('Toronto');

        const citySelect = document.getElementById('citySelect');
        if (citySelect) {
            citySelect.addEventListener('change', (e) => {
                initMap(e.target.value);
            });
        }
    }
});