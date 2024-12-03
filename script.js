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
                                currentlyDisplayedProvince = null;
                            } else {
                                console.log("Raw province name:", clickedProvince);
                                selectedProvince = clickedProvince;
                                currentlyDisplayedProvince = clickedProvince;
                                console.log("Selected province:", selectedProvince);
                                updateMortalityChart(selectedProvince, selectedYear);
                                showBackground1();
                            }
                        } else {
                            console.error("Province name not found in properties:", feature.properties);
                        }
                    });

                    function hideBackground1() {
                        const background1 = document.querySelector(".story-background1");
                        background1.style.display = "none";
                    }

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
            }
        });
    });

    function updateMortalityChart(province, year) {
        const background1 = document.querySelector(".story-background1");

        console.log("Province value:", province, "Type:", typeof province); // Debug log

        const provinceStr = String(province || '');
        const formattedProvince = provinceStr.replace(/\s+/g, '_');

        console.log("Formatted province:", formattedProvince); // Debug log

        const imagePath = `./data/mortality/${formattedProvince}_${year}.png`;

        background1.innerHTML = '';

        const img = document.createElement('img');
        img.src = imagePath;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        img.onerror = function() {
            background1.innerHTML = '<p class="story-text">Data not available for this period</p>';
        };

        background1.appendChild(img);
    }

    function showBackground1() {
        const background1 = document.querySelector(".story-background1");
        background1.style.display = "block";
    }

});
