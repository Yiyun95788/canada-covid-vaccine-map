document.addEventListener("DOMContentLoaded", function () {
    const statisticsButton = document.getElementById("statistics");
    const dropdown = document.getElementById("statisticsDropdown");

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

    const map = L.map("map").setView([70.0, -96.8], 2.5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    let selectedProvince = null;
    let selectedYear = "2021";

    fetch("./data/georef-canada-province@public.geojson")
        .then((response) => response.json())
        .then((geojsonData) => {
            const canadaLayer = L.geoJSON(geojsonData, {
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
                        canadaLayer.resetStyle(layer);
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
        });

    const yearButtons = document.querySelectorAll(".year-bar button");
    yearButtons.forEach((button) => {
        button.addEventListener("click", function () {
            selectedYear = button.getAttribute("data-year");
            if (selectedProvince) {
                updateMortalityChart(selectedProvince, selectedYear);
                updateVaccinationChart(selectedProvince, selectedYear);
            }
        });
    });

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
});
