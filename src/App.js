import React from 'react';
import CanadaMap from './CanadaMap';
import './App.css';

function App() {
    return (
        <div className="map-container">
            <h1 className="map-title">Canada COVID-19 Vaccine Map</h1>
            <CanadaMap />
        </div>
    );
}

export default App;
