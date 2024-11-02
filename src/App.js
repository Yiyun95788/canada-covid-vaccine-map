import React, { useState } from 'react';
import CanadaMap from './CanadaMap';
import './App.css';

function App() {
    const [showDescription, setShowDescription] = useState(false);

    const handleToggleDescription = () => {
        setShowDescription(!showDescription);
    };

    return (
        <div className="map-container">
            <h1 className="map-title">
                Canada COVID-19 Vaccine Map
                <button className="description-btn" onClick={handleToggleDescription}>
                    {showDescription ? 'ℹ Hide Description' : 'ℹ Show Description'}
                </button>
            </h1>
            {showDescription && (
                <p className="map-description">
                    This interactive map provides a comprehensive visualization of COVID-19 vaccination rates across Canada. Users can explore vaccination data across different provinces and territories, gaining insights into regional vaccine distribution patterns. The map aims to support data-driven decisions by displaying up-to-date information in a clear, accessible format.
                </p>
            )}
            <CanadaMap />
        </div>
    );
}

export default App;
