class MontrealMap {
    constructor(map) {
        this.map = map;
        this.currentGeoJson = null;
    }

    async initialize() {
        try {
            const response = await fetch('./data/Montreal.geojson');
            const data = await response.json();

            // Style function for the choropleth
            const style = (feature) => {
                const value = feature.properties.cases || 0;
                return {
                    fillColor: this.getColor(value),
                    weight: 1,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.7
                };
            };

            this.currentGeoJson = L.geoJSON(data, {
                style: style,
                onEachFeature: (feature, layer) => {
                    const areaName = feature.properties.name || 'Unknown Area';
                    const cases = feature.properties.cases || 'No data';

                    layer.bindPopup(`
                        <strong>${areaName}</strong><br>
                        Cases: ${cases}
                    `);

                    layer.on('mouseover', (e) => {
                        layer.setStyle({
                            weight: 3,
                            color: '#666'
                        });
                        layer.bringToFront();
                    });

                    layer.on('mouseout', (e) => {
                        this.currentGeoJson.resetStyle(layer);
                    });
                }
            }).addTo(this.map);

            // Fit bounds to the layer
            this.map.fitBounds(this.currentGeoJson.getBounds());

        } catch (error) {
            console.error('Error loading Montreal GeoJSON:', error);
        }
    }

    getColor(cases) {
        return cases > 10000 ? '#800026' :
            cases > 7500  ? '#BD0026' :
                cases > 5000  ? '#E31A1C' :
                    cases > 2500  ? '#FC4E2A' :
                        cases > 1000  ? '#FD8D3C' :
                            cases > 500   ? '#FEB24C' :
                                cases > 250   ? '#FED976' :
                                    '#FFEDA0';
    }
}