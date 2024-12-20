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

    // Story functionality
    const storyBackground = document.querySelector(".story-background");
    const buttons = document.querySelector(".buttons");

    console.log("Story background:", storyBackground);
    console.log("Buttons:", buttons);
    console.log("Button children:", buttons.childNodes);

    let storyButton = buttons.querySelector('button:first-of-type');
    if (!storyButton) {
        storyButton = document.createElement("button");
        storyButton.textContent = "STORY";
        buttons.insertBefore(storyButton, buttons.firstChild);
    }

    storyButton.addEventListener("click", function(e) {
        console.log("Story button clicked");
        e.preventDefault();
        if (storyBackground.style.display === "block") {
            storyBackground.style.display = "none";
        } else {
            storyBackground.style.display = "block";
        }
    });

    const storyText = buttons.childNodes[0];
    if (storyText && storyText.nodeType === 3 && storyText.textContent.trim() === "STORY") {
        const storyButton = document.createElement("button");
        storyButton.textContent = "STORY";
        buttons.replaceChild(storyButton, storyText);

        storyButton.addEventListener("click", function() {
            console.log("Story button clicked"); // Debug line
            storyBackground.style.display = storyBackground.style.display === "block" ? "none" : "block";
        });
    }

    // Close story when clicking outside
    document.addEventListener("click", function(e) {
        if (storyBackground &&
            storyBackground.style.display === "block" &&
            !storyBackground.contains(e.target) &&
            !e.target.matches('.buttons *')) {
            storyBackground.style.display = "none";
        }
    });

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

    const yearButtons = document.querySelectorAll(".year-bar button");

    yearButtons.forEach((button) => {
        button.addEventListener("click", function () {
            if (!currentHeatMapType) {  // Only handle year changes when heat map is off
                yearButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                selectedYear = button.getAttribute("data-year");
                if (selectedProvince) {
                    updateMortalityChart(selectedProvince, selectedYear);
                    updateVaccinationChart(selectedProvince, selectedYear);
                }
            }
        });
    });

    document.querySelector('[data-year="2021"]').classList.add('active');

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
            return value > 1500000 ? '#940808' :
                value > 1000000 ? '#b52121' :
                    value > 500000 ? '#c64242' :
                        value > 100000 ? '#d66b6b' :
                            value > 50000 ? '#e19e9e' :
                                '#f7dede';
        } else {
            return value > 30000000 ? '#0d9408' :
                value > 15000000 ? '#3cb521' :
                    value > 5000000 ? '#4fc642' :
                        value > 1000000 ? '#79d66b' :
                            value > 100000 ? '#ade19e' :
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
                    <i style="background:#940808"></i> > 1.5M<br>
                    <i style="background:#b52121"></i> 1M - 1.5M<br>
                    <i style="background:#c64242"></i> 500K - 1M<br>
                    <i style="background:#d66b6b"></i> 100K - 500K<br>
                    <i style="background:#e19e9e"></i> 50K - 100K<br>
                    <i style="background:#f7dede"></i> < 50K
                `;
            } else {
                div.innerHTML += `
                    <i style="background:#0d9408"></i> > 30M<br>
                    <i style="background:#3cb521"></i> 15M - 30M<br>
                    <i style="background:#4fc642"></i> 5M - 15M<br>
                    <i style="background:#79d66b"></i> 1M - 5M<br>
                    <i style="background:#ade19e"></i> 100K - 1M<br>
                    <i style="background:#e3f7de"></i> < 100K
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