document.addEventListener("DOMContentLoaded", function () {
    let map = null;
    let cityMap = null;
    let visContainers = null;

    const cities = {
        Toronto: { coords: [43.7232, -79.3832], zoom: 11 },
        Vancouver: { coords: [49.2827, -123.1207], zoom: 11 },
        Montreal: { coords: [45.5017, -73.5673], zoom: 11 },
        Ottawa: { coords: [45.4215, -75.6972], zoom: 12 }
    };

    async function initMap(city) {
        const container = document.getElementById('city-map');
        if (!container) return;

        // Clean up existing elements
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
        if (visContainers) {
            visContainers.remove();
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
        } else if (city === 'Montreal') {
            const visualizationBtn = L.control({position: 'topright'});
            visualizationBtn.onAdd = function() {
                const button = L.DomUtil.create('button', 'visualization-link');
                button.innerHTML = 'Show Visualization';
                button.onclick = function() {
                    if (visContainers) {
                        visContainers.style.display = visContainers.style.display === 'none' ? 'flex' : 'none';
                        button.innerHTML = visContainers.style.display === 'none' ? 'Show Visualization' : 'Hide Visualization';
                    } else {
                        // Create containers for visualizations
                        visContainers = L.DomUtil.create('div', 'visualization-container');
                        visContainers.style.cssText = `
                            position: absolute;
                            top: 60px;
                            left: 10px;
                            right: 10px;
                            display: flex;
                            gap: 20px;
                            z-index: 1000;
                        `;

                        const mortalityContainer = L.DomUtil.create('div', 'vis-section', visContainers);
                        mortalityContainer.style.cssText = `
                            flex: 1;
                            background: white;
                            padding: 15px;
                            border-radius: 8px;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        `;
                        const mortalityImg = L.DomUtil.create('img', '', mortalityContainer);
                        mortalityImg.src = './data/montreal_mortality.png';
                        mortalityImg.style.width = '100%';
                        mortalityImg.style.height = 'auto';

                        const vaccinationContainer = L.DomUtil.create('div', 'vis-section', visContainers);
                        vaccinationContainer.style.cssText = `
                            flex: 1;
                            background: white;
                            padding: 15px;
                            border-radius: 8px;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        `;
                        const vaccinationFrame = L.DomUtil.create('iframe', '', vaccinationContainer);
                        vaccinationFrame.src = './data/montreal_vaccinations.html';
                        vaccinationFrame.style.cssText = `
                            width: 100%;
                            height: 500px;
                            border: none;
                        `;

                        document.getElementById('city-map').appendChild(visContainers);
                        button.innerHTML = 'Hide Visualization';
                    }
                };
                return button;
            };
            visualizationBtn.addTo(map);
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