document.addEventListener("DOMContentLoaded", function () {
    const statisticsButton = document.getElementById("statistics");
    const dropdown = document.getElementById("statisticsDropdown");
    let currentHeatMapType = null;
    let selectedProvince = null;
    let selectedYear = "2021";
    let canadaLayer = null;
    let currentLegend = null;
    let returnButton = null;
    const yearBar = document.querySelector(".year-bar");

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

    function createReturnButton() {
        returnButton = L.control({ position: 'topright' });

        returnButton.onAdd = function () {
            const div = L.DomUtil.create('div', 'return-button');
            div.innerHTML = '<button class="return-btn">RETURN</button>';

            div.querySelector('.return-btn').addEventListener('click', function() {
                currentHeatMapType = null;

                returnButton.remove();
                returnButton = null;

                if (currentLegend) {
                    currentLegend.remove();
                    currentLegend = null;
                }

                yearBar.style.display = 'flex';

                canadaLayer.eachLayer(layer => {
                    canadaLayer.resetStyle(layer);
                });
            });

            return div;
        };

        return returnButton;
    }

    const mortalityButton = dropdown.querySelector("button:nth-child(1)");
    const vaccinationsButton = dropdown.querySelector("button:nth-child(2)");

    mortalityButton.addEventListener("click", function() {
        currentHeatMapType = "MORTALITY";
        updateHeatMap(currentHeatMapType);

        if (currentLegend) {
            currentLegend.remove();
        }
        currentLegend = addLegend().addTo(map);

        yearBar.style.display = 'none';
        if (!returnButton) {
            returnButton = createReturnButton();
            returnButton.addTo(map);
        }

        dropdown.classList.remove("show");
    });

    vaccinationsButton.addEventListener("click", function() {
        currentHeatMapType = "VACCINATIONS";
        updateHeatMap(currentHeatMapType);

        if (currentLegend) {
            currentLegend.remove();
        }
        currentLegend = addLegend().addTo(map);

        yearBar.style.display = 'none';
        if (!returnButton) {
            returnButton = createReturnButton();
            returnButton.addTo(map);
        }

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
                        if (!currentHeatMapType) {
                            layer.setStyle({
                                color: "white",
                                fillColor: "#fff43b",
                                weight: 3,
                                fillOpacity: 0.7,
                            });
                        } else {
                            layer.setStyle({
                                color: "white",
                                weight: 3,
                            });
                        }
                    });

                    layer.on("mouseout", function () {
                        if (!currentHeatMapType) {
                            canadaLayer.resetStyle(layer);
                        } else {
                            layer.setStyle({
                                color: 'white',
                                weight: 1
                            });
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
        const fileName = type.toLowerCase() + '_heatmap.csv';

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
            } else {
                provinceData[row.prename] = Number(row.numtotal_totaldoses_admin);
            }
        });

        return provinceData;
    }

    function updateMapColors(data) {
        canadaLayer.eachLayer(layer => {
            const geoJsonName = layer.feature.properties.prov_name_en;
            const value = data[geoJsonName] || 0;

            layer.setStyle({
                fillColor: getColor(value, currentHeatMapType),
                fillOpacity: 0.7,
                color: 'white',
                weight: 1
            });

            layer.bindPopup(`
                <b>${geoJsonName}</b><br>
                ${currentHeatMapType === 'MORTALITY' ? 'Total Cases: ' : 'Total Vaccinations: '}
                ${value.toLocaleString()}
            `);
        });
    }

    function getColor(value, type) {
        if (type === 'MORTALITY') {
            return value > 200000000 ? '#940808' :
                value > 100000000 ? '#b52121' :
                    value > 50000000 ? '#c64242' :
                        value > 10000000 ? '#d66b6b' :
                            value > 1000000 ? '#e19e9e' :
                                '#f7dede';
        } else {
            return value > 3000000000 ? '#0d9408' :
                value > 1000000000 ? '#3cb521' :
                    value > 500000000 ? '#4fc642' :
                        value > 100000000 ? '#79d66b' :
                            value > 10000000 ? '#ade19e' :
                                '#e3f7de';
        }
    }

    function addLegend() {
        const legend = L.control({ position: 'bottomright' });

        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'info legend');
            const title = currentHeatMapType === 'MORTALITY' ? 'Total Cases' : 'Total Vaccinations';

            div.innerHTML = `<h4 style="margin: 0 0 5px 0">${title}</h4>`;

            if (currentHeatMapType === 'MORTALITY') {
                div.innerHTML += `
                    <i style="background:#940808"></i> > 200M<br>
                    <i style="background:#b52121"></i> 100M - 200M<br>
                    <i style="background:#c64242"></i> 50M - 100M<br>
                    <i style="background:#d66b6b"></i> 10M - 50M<br>
                    <i style="background:#e19e9e"></i> 1M - 10M<br>
                    <i style="background:#f7dede"></i> < 1M
                `;
            } else {
                div.innerHTML += `
                    <i style="background:#0d9408"></i> > 3B<br>
                    <i style="background:#3cb521"></i> 1B - 3B<br>
                    <i style="background:#4fc642"></i> 500M - 1B<br>
                    <i style="background:#79d66b"></i> 100M - 500M<br>
                    <i style="background:#ade19e"></i> 10M - 100M<br>
                    <i style="background:#e3f7de"></i> < 10M
                `;
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
