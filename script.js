document.addEventListener("DOMContentLoaded", function () {
    // Dropdown menu functionality
    const statisticsButton = document.getElementById("statistics");
    const dropdown = document.getElementById("statisticsDropdown");

    statisticsButton.addEventListener("click", function () {
        dropdown.classList.toggle("show");
    });

    dropdown.addEventListener("mouseleave", function () {
        dropdown.classList.remove("show");
    });

    // Story background toggle
    const storyButton = document.getElementById("story");
    const storyBackground = document.querySelector(".story-background");

    storyButton.addEventListener("click", function () {
        storyBackground.style.display =
            storyBackground.style.display === "block" ? "none" : "block";
    });

    // Initialize Leaflet map
    const map = L.map("map").setView([70.0, -96.8], 2.5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Load GeoJSON and add to map
    fetch("./data/georef-canada-province@public.geojson")
        .then((response) => response.json())
        .then((geojsonData) => {
            const canadaLayer = L.geoJSON(geojsonData, {
                style: {
                    color: "black",
                    fillColor: "blue",
                    fillOpacity: 0.5,
                    weight: 1,
                },
                onEachFeature: function (feature, layer) {
                    // Add hover effects
                    layer.on("mouseover", function () {
                        layer.setStyle({
                            color: "white",
                            weight: 3,
                            fillOpacity: 0.7,
                        });
                    });

                    layer.on("mouseout", function () {
                        canadaLayer.resetStyle(layer);
                    });

                    // Add click behavior
                    layer.on("click", function () {
                        toggleBackground();
                    });
                },
            }).addTo(map);
        })
        .catch((error) => {
            console.error("Error loading GeoJSON file:", error);
        });

    // Year bar buttons
    const yearButtons = document.querySelectorAll(".year-bar button");
    yearButtons.forEach((button) => {
        button.addEventListener("click", function () {
            console.log(`Year selected: ${button.getAttribute("data-year")}`);
            // Add logic to update the map based on the selected year
        });
    });

    // Toggle story backgrounds on map clicks
    function toggleBackground() {
        const storyBackground1 = document.querySelector(".story-background1");
        const storyBackground2 = document.querySelector(".story-background2");

        storyBackground1.style.display =
            storyBackground1.style.display === "block" ? "none" : "block";
        storyBackground2.style.display =
            storyBackground2.style.display === "block" ? "none" : "block";
    }
});
