class OttawaMap {
    constructor(map) {
        this.map = map;
        this.currentGeoJson = null;
        this.covidData = null;
    }

    async initialize() {
        try {
            const geojsonResponse = await fetch('data/Ottawa.geojson');
            const geojsonText = await geojsonResponse.text();
            const geojson = JSON.parse(geojsonText);

            const covidResponse = await fetch('data/ottawa_covid.csv');
            this.covidData = Papa.parse(await covidResponse.text(), {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            }).data;

            this.currentGeoJson = L.geoJSON(geojson, {
                style: (feature) => this.getStyle(feature),
                onEachFeature: (feature, layer) => {
                    const neighborhoodName = feature.properties.namese2016;
                    const matchingRow = this.covidData.find(row => row['ONS Neighbourhood Name'] === neighborhoodName);
                    const rate = matchingRow ? matchingRow['Cumulative Rate Excluding Cases Linked to Outbreaks in LTCH & RH'] : 'No data';

                    layer.bindPopup(`
                        <strong>${neighborhoodName}</strong><br>
                        Cumulative Rate: ${rate}
                    `);
                }
            }).addTo(this.map);

            this.addLegend();
            this.map.fitBounds(this.currentGeoJson.getBounds());

        } catch (error) {
            console.error('Error initializing Ottawa map:', error);
        }
    }

    getStyle(feature) {
        const neighborhoodName = feature.properties.namese2016;
        const matchingRow = this.covidData.find(row => row['ONS Neighbourhood Name'] === neighborhoodName);
        const rate = matchingRow ? matchingRow['Cumulative Rate Excluding Cases Linked to Outbreaks in LTCH & RH'] : null;
        return {
            fillColor: this.getColor(rate),
            weight: 2,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7
        };
    }

    getColor(rate) {
        return rate > 7000 ? '#08306b' :
            rate > 6000 ? '#08519c' :
                rate > 5000 ? '#2171b5' :
                    rate > 4000 ? '#4292c6' :
                        rate > 3000 ? '#6baed6' :
                            rate > 2000 ? '#9ecae1' :
                                rate > 1000 ? '#c6dbef' :
                                    '#f7fbff';
    }

    addLegend() {
        const legend = L.control({ position: 'bottomright' });

        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'info legend');
            const grades = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000];

            div.style.backgroundColor = 'white';
            div.style.padding = '6px 8px';
            div.style.border = '1px solid #ccc';
            div.style.borderRadius = '5px';

            let html = '<h4>COVID-19 Rate</h4>';

            for (let i = 0; i < grades.length; i++) {
                html +=
                    '<i style="background:' + this.getColor(grades[i] + 1) + '; display: inline-block; width: 18px; height: 18px; margin-right: 8px;"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            }

            div.innerHTML = html;
            return div;
        };

        this.map.legend = legend;
        legend.addTo(this.map);
    }
}