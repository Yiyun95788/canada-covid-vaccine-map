document.addEventListener("DOMContentLoaded", function () {
    const statisticsButton = document.getElementById("statistics");
    const dropdown = document.getElementById("statisticsDropdown");
    let currentHeatMapType = null;
    let selectedProvince = null;
    let selectedYear = "2021";
    let canadaLayer = null;
    let currentLegend = null;

    const map = L.map("map").setView([70.0, -96.8], 2.5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    statisticsButton.addEventListener("click", function () {
        dropdown.classList.toggle("show");
    });

    dropdown.addEventListener("mouseleave", function () {
        dropdown.classList.remove("show");
    });

    const storyButton = document.getElementById("story");
    const storyBackground = document.querySelector(".story-background");

    storyButton.addEventListener("click", function () {
        storyBackground.style.display =
            storyBackground.style.display === "block" ? "none" : "block";
    });

    const mortalityButton = dropdown.querySelector("button:nth-child(1)");
    const vaccinationsButton = dropdown.querySelector("button:nth-child(2)");

    mortalityButton.addEventListener("click", function() {
        currentHeatMapType = "MORTALITY";
        updateHeatMap(currentHeatMapType);
        if (currentLegend) {
            currentLegend.remove();
        }
        currentLegend = addLegend().addTo(map);
        dropdown.classList.remove("show");
    });

    vaccinationsButton.addEventListener("click", function() {
        currentHeatMapType = "VACCINATIONS";
        updateHeatMap(currentHeatMapType);
        if (currentLegend) {
            currentLegend.remove();
        }
        currentLegend = addLegend().addTo(map);
        dropdown.classList.remove("show");
    });

    fetch("./data/georef-canada-province@public.geojson")
        .then((response) => response.json())
        .then((geojsonData) => {
            canadaLayer = L.geoJSON(geojsonData, {
                style: {
                    color: "black",
                    fillColor: "#8eb0d5",
                    fillOpacity: 0.5,
                    weight: 1,
                },
                onEachFeature: function (feature, layer) {
                    layer.on("mouseover", function () {
                        layer.setStyle({
                            color: "white",
                            fillColor: "#fff43b",
                            weight: 3,
                            fillOpacity: 0.7,
                        });
                    });

                    layer.on("mouseout", function () {
                        if (!currentHeatMapType) {
                            canadaLayer.resetStyle(layer);
                        }
                    });

                    let currentlyDisplayedProvince = null;

                    layer.on("click", function () {
                        if (feature.properties && feature.properties.prov_name_en) {
                            const clickedProvince = feature.properties.prov_name_en;

                            if (clickedProvince === currentlyDisplayedProvince) {
                                hideBackground1();
                                hideBackground2();
                                currentlyDisplayedProvince = null;
                            } else {
                                selectedProvince = clickedProvince;
                                currentlyDisplayedProvince = clickedProvince;
                                updateMortalityChart(selectedProvince, selectedYear);
                                updateVaccinationChart(selectedProvince, selectedYear);
                                showBackground1();
                                showBackground2();
                            }
                        }
                    });
                },
            }).addTo(map);
        })
        .catch((error) => {
            console.error("Error loading GeoJSON file:", error);
            showNotification("Error loading map data");
        });

    function updateHeatMap(type) {
        const fileName = type.toLowerCase() + '_heatmap.csv'; // Updated filename

        fetch(`./data/${fileName}`)
            .then(response => response.text())
            .then(csvData => {
                const parsedData = Papa.parse(csvData, {
                    header: true,
                    dynamicTyping: true
                }).data;

                const filteredData = parsedData.filter(row =>
                    row.prename !== "Canada" && row.prename !== "Repatriated travellers"
                );

                const processedData = processDataForHeatMap(filteredData, type);
                updateMapColors(processedData);
            })
            .catch(error => {
                console.error('Error loading data:', error);
                showNotification(`No ${type.toLowerCase()} data available`);
            });
    }

    function processDataForHeatMap(data, type) {
        const provinceData = {};

        data.forEach(row => {
            if (type === 'MORTALITY') {
                provinceData[row.prename] = Number(row.totalcases);
            } else { // VACCINATIONS
                provinceData[row.prename] = Number(row.numtotal_totaldoses_admin);
            }
        });

        return provinceData;
    }

    function updateMapColors(data) {
        const values = Object.values(data);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);

        canadaLayer.eachLayer(layer => {
            const geoJsonName = layer.feature.properties.prov_name_en;
            const value = data[geoJsonName] || 0;

            // Calculate percentage relative to the range
            const normalizedValue = ((value - minValue) / (maxValue - minValue)) * 100;

            layer.setStyle({
                fillColor: getColor(normalizedValue),
                fillOpacity: 0.7,
                color: 'white',
                weight: 1
            });

            layer.bindPopup(`
            <b>${geoJsonName}</b><br>
            Value: ${value.toLocaleString()}<br>
            Percentage of max: ${normalizedValue.toFixed(1)}%
        `);
        });
    }

    function getColor(value) {
        return value > 80 ? '#084594' :
            value > 60 ? '#2171b5' :
                value > 40 ? '#4292c6' :
                    value > 20 ? '#6baed6' :
                        value > 0  ? '#9ecae1' :
                            '#deebf7';
    }

    function addLegend() {
        const legend = L.control({ position: 'bottomright' });

        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'info legend');
            const grades = [0, 20, 40, 60, 80];
            const colors = ['#deebf7', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594'];

            const title = currentHeatMapType === 'MORTALITY' ? 'Total Cases' : 'Total Vaccinations';
            div.innerHTML = `<h4 style="margin: 0 0 5px 0">${title}</h4>`;

            for (let i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + colors[i] + '; width: 18px; height: 18px; float: left; margin-right: 8px; opacity: 0.7"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '%<br>' : '%+');
            }

            return div;
        };

        return legend;
    }

    function showNotification(message) {
        let notification = document.createElement('div');
        notification.className = 'alert-notification';
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    function formatProvinceNameMortality(province) {
        return String(province || '')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('_');
    }

    function formatProvinceNameVaccination(province) {
        return String(province || '')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    function updateMortalityChart(province, year) {
        const background1 = document.querySelector(".story-background1");
        const formattedProvince = formatProvinceNameMortality(province);
        const imagePath = `./data/mortality/${formattedProvince}_${year}.png`;
        background1.innerHTML = '';
        const img = document.createElement('img');
        img.src = imagePath;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        img.onerror = function() {
            background1.innerHTML = '<p class="story-text">Mortality data not available for this period</p>';
        };
        background1.appendChild(img);
    }

    function updateVaccinationChart(province, year) {
        const background2 = document.querySelector(".story-background2");
        const formattedProvince = formatProvinceNameVaccination(province);
        const filePath = `./data/vaccinations/${formattedProvince}_${year}.html`;

        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                background2.innerHTML = '';
                const iframe = document.createElement('iframe');
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                background2.appendChild(iframe);
                iframe.contentWindow.document.open();
                iframe.contentWindow.document.write(html);
                iframe.contentWindow.document.close();
            })
            .catch(error => {
                background2.innerHTML = '<p class="story-text">Vaccination data not available for this period</p>';
            });
    }

    function showBackground1() {
        const background1 = document.querySelector(".story-background1");
        background1.style.display = "block";
    }

    function hideBackground1() {
        const background1 = document.querySelector(".story-background1");
        background1.style.display = "none";
    }

    function showBackground2() {
        const background2 = document.querySelector(".story-background2");
        background2.style.display = "block";
    }

    function hideBackground2() {
        const background2 = document.querySelector(".story-background2");
        background2.style.display = "none";
    }

    addLegend();
});
