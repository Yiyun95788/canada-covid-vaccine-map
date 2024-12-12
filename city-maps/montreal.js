class MontrealMap {
    constructor(map) {
        this.map = map;
        this.currentGeoJson = null;
    }

    async initialize() {
        try {
            const response = await fetch('./data/Montreal.geojson');
            const data = await response.json();

            this.addLegend();

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

    addLegend() {
        if (this.map.legend) {
            this.map.removeControl(this.map.legend);
        }

        this.map.legend = L.control({position: 'bottomright'});
        this.map.legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'info legend');
            const grades = [0, 250, 500, 1000, 2500, 5000, 7500, 10000];

            div.innerHTML += '<h4>COVID-19 Cases</h4>';

            for (let i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + this.getColor(grades[i] + 1) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            }

            return div;
        };

        this.map.legend.addTo(this.map);
    }
}
