class TorontoMap {
    constructor(map) {
        this.map = map;
        this.currentGeoJson = null;
        this.covidData = null;
        this.torontoGeoJson = null;
        this.colorSchemes = {
            'Ever Hospitalized': ['#edf8fb', '#b3cde3', '#8c96c6', '#8856a7', '#810f7c'],
            'Ever in ICU': ['#f1eef6', '#bdc9e1', '#74a9cf', '#2b8cbe', '#045a8d'],
            'Ever Intubated': ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494']
        };
        this.metricRanges = {
            'Ever Hospitalized': [0, 0.025, 0.05, 0.075, 0.10],
            'Ever in ICU': [0, 0.00375, 0.0075, 0.01125, 0.015],
            'Ever Intubated': [0, 0.00375, 0.0075, 0.01125, 0.015]
        };
    }

    async initialize() {
        try {
            await this.loadData();
            this.addControls();
            this.updateHeatmap('Ever Hospitalized');
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    }

    async loadData() {
        try {
            const basePath = window.location.hostname.includes('github.io')
                ? '/canada-covid-vaccine-map'
                : '';

            const [geoJsonResponse, csvResponse] = await Promise.all([
                fetch(`${basePath}/data/Toronto.geojson`),
                fetch(`${basePath}/data/toronto_covid.csv`)
            ]);

            if (!geoJsonResponse.ok || !csvResponse.ok) {
                throw new Error(`Failed to load data: GeoJSON ${geoJsonResponse.status}, CSV ${csvResponse.status}`);
            }

            // Handle responses
            this.torontoGeoJson = await geoJsonResponse.json();
            const csvText = await csvResponse.text();

            const parsedCsv = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                delimitersToGuess: [',', '\t', '|', ';']
            });

            this.covidData = parsedCsv.data;
        } catch (error) {
            console.error('Error loading Toronto data:', error);
            throw error;
        }
    }

    processNeighborhoodData(metric) {
        if (!this.covidData) return {};

        const neighborhoodStats = {};
        this.covidData.forEach(row => {
            if (!row['Neighbourhood Name']) return;
            if (!neighborhoodStats[row['Neighbourhood Name']]) {
                neighborhoodStats[row['Neighbourhood Name']] = { count: 0, total: 0 };
            }
            neighborhoodStats[row['Neighbourhood Name']].total++;
            if (row[metric] === 'Yes') {
                neighborhoodStats[row['Neighbourhood Name']].count++;
            }
        });
        return neighborhoodStats;
    }

    getColor(value, metric) {
        const colors = this.colorSchemes[metric];
        const ranges = this.metricRanges[metric];
        if (value > ranges[4]) return colors[4];
        if (value > ranges[3]) return colors[3];
        if (value > ranges[2]) return colors[2];
        if (value > ranges[1]) return colors[1];
        return colors[0];
    }


    style(feature, metric, stats) {
        const neighborhoodName = feature.properties.AREA_NAME;
        const neighborhoodStat = stats[neighborhoodName];
        const value = neighborhoodStat ? neighborhoodStat.count / neighborhoodStat.total : 0;
        return {
            fillColor: this.getColor(value, metric),
            weight: 1,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7
        };
    }

    updateHeatmap(metric) {
        const stats = this.processNeighborhoodData(metric);
        if (this.currentGeoJson) {
            this.map.removeLayer(this.currentGeoJson);
        }

        this.currentGeoJson = L.geoJson(this.torontoGeoJson, {
            style: (feature) => this.style(feature, metric, stats),
            onEachFeature: (feature, layer) => {
                const neighborhoodName = feature.properties.AREA_NAME;
                const neighborhoodStat = stats[neighborhoodName];
                const value = neighborhoodStat
                    ? ((neighborhoodStat.count / neighborhoodStat.total) * 100).toFixed(1)
                    : 0;
                layer.bindPopup(`
                    <b>${neighborhoodName}</b><br>
                    ${metric}: ${value}%
                `);
            }
        }).addTo(this.map);

        this.updateLegend(metric);
    }

    updateLegend(metric) {
        if (this.map.legend) {
            this.map.removeControl(this.map.legend);
        }

        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'info legend');
            const grades = this.metricRanges[metric];

            div.innerHTML = '<h4>' + metric + '</h4>';
            for (let i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + this.getColor(grades[i] + 0.0001, metric) + '"></i> ' +
                    (grades[i] * 100).toFixed(1) + (grades[i + 1] ? '&ndash;' + (grades[i + 1] * 100).toFixed(1) + '%<br>' : '%+');
            }
            return div;
        };
        this.map.legend = legend;
        legend.addTo(this.map);
    }

    addControls() {
        const metricControl = L.control({ position: 'topright' });
        metricControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'metric-control');
            div.innerHTML = `
                <select id="metricSelect" class="form-select">
                    <option value="Ever Hospitalized">Ever Hospitalized</option>
                    <option value="Ever in ICU">Ever in ICU</option>
                    <option value="Ever Intubated">Ever Intubated</option>
                </select>
            `;
            return div;
        };
        metricControl.addTo(this.map);

        document.getElementById('metricSelect').addEventListener('change', (e) => {
            this.updateHeatmap(e.target.value);
        });
    }
}