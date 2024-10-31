import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const CanadaMap = () => {
    const mapContainer = useRef(null);

    useEffect(() => {
        if (window.Datamap) {
            const map = new window.Datamap({
                element: mapContainer.current,
                scope: 'canada',
                geographyConfig: {
                    dataUrl: '/can.topo.json',
                    highlightOnHover: true,
                    highlightFillColor: '#ffcc00',
                    popupTemplate: function(geo, data) {
                        return `<div class="hoverinfo">${geo.properties.name}</div>`;
                    }
                },
                fills: {
                    defaultFill: '#d3d3d3',
                    highlighted: '#1f77b4'
                },
                setProjection: function(element) {
                    const width = element.offsetWidth;
                    const height = element.offsetHeight;
                    const projection = d3.geoMercator()
                        .center([-106.3468, 56.1304])
                        .scale(300)
                        .translate([width / 2, height / 2 + 165]); // Centering the map
                    const path = d3.geoPath().projection(projection);
                    return { path: path, projection: projection };
                }
            });

            // Resize listener for Datamap
            const handleResize = () => map.resize();
            window.addEventListener('resize', handleResize);

            // Cleanup on unmount
            return () => {
                window.removeEventListener('resize', handleResize);
                map.svg.remove();
            };
        }
    }, []);

    return <div ref={mapContainer} style={{ width: '100%', height: '80vh' }} />;
};

export default CanadaMap;
