mapboxgl.accessToken = 'pk.eyJ1IjoieWl5dW56aCIsImEiOiJjbTNxcTExM3Mwcmc4MmxxYWx4bWt3Nm5rIn0.axfTzN__b--jhdLK0EpJyQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-106.3468, 56.1304],
    zoom: 3
});

map.on('load', () => {
    map.addSource('canada', {
        type: 'geojson',
        data: './data/georef-canada-province@public.geojson'
    });

    // map.addLayer({
    //     id: 'provinces-layer',
    //     type: 'fill',
    //     source: 'canada',
    //     paint: {
    //         'fill-color': '#627BC1',
    //         'fill-opacity': 0.5
    //     }
    // });
    //
    // map.addLayer({
    //     id: 'provinces-borders',
    //     type: 'line',
    //     source: 'canada',
    //     paint: {
    //         'line-color': '#000',
    //         'line-width': 1
    //     }
    // });
});
