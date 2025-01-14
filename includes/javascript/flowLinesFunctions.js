
document.addEventListener('DOMContentLoaded', function() {
    const flowLinesForm = document.getElementById('flowLinesForm');
    if (flowLinesForm) {
        flowLinesForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const selectedStations = Array.from(document.getElementById('selectedStations').selectedOptions)
                .map(opt => opt.value);
            const topN = parseInt(document.getElementById('topN').value, 10) || 5;

            // Nur die ausgewählten Stationen werden berücksichtigt
            const filteredStations = window.stationsData.filter(st => selectedStations.includes(st.station_name));

            drawFlowLinesFromFavorites(filteredStations, topN);

            // Formular schließen (optional)
            document.getElementById('filterForFlowLines').style.display = 'none';
        });
    }
});

function populateStationsSelectFlowLines() {
    const select = document.getElementById('selectedStations');
    if (!select) return;

    // Vorhandene Optionen entfernen
    while (select.firstChild) {
        select.removeChild(select.firstChild);
    }

    // Stationen hinzufügen (hier station_name als value)
        const allStations = window.stationsData || []; // default to empty array, 'null'/'undefined' check
        allStations.forEach(st => {
        const option = document.createElement('option');
        option.value = st.station_name;
        option.textContent = st.station_name;
        select.appendChild(option);
    });
}

function drawFlowLinesFromFavorites(stationsData, topN) {
    removeExistingFlowLines();

    // Liste aller relevanten Stationen (Start + End)
    let relevantStations = new Set();

    stationsData.forEach((station) => {
        let startPos = [station.Latitude, station.Longitude];
        relevantStations.add(station.station_name); // Startstation ist relevant
        // Begrenze die Anzahl der Endstationen auf topN
        const endStations = station.Beliebteste_Endstationen_sortiert.slice(0, topN);

        endStations.forEach((endStationName, index) => {
            let endCoords = window.stationIndexByName[endStationName];
            if (!endCoords) {
                return;
            }
            // Auch Endstation ist relevant
            relevantStations.add(endStationName);

            let endPos = [endCoords.lat, endCoords.lng];
            let weight = Math.max(1, 5 - index * 0.2);

            // Create the main polyline
            let polyline = L.polyline([startPos, endPos], {
                color: 'blue',
                weight: weight,
                opacity: 0.7
            }).addTo(window.map);

            // Add an arrowhead to the polyline
            const arrowHead = L.polylineDecorator(polyline, {
                patterns: [
                    {
                        offset: '100%', // Arrowhead at the end
                        repeat: 0,
                        symbol: L.Symbol.arrowHead({
                            pixelSize: 10, 
                            polygon: true,
                            pathOptions: { fillOpacity: 1, color: 'blue' }
                        })
                    }
                ]
            }).addTo(window.map);

            // Bind popup to the polyline
            polyline.bindPopup(`
                <b>Startstation:</b> ${station.station_name}<br>
                <b>Endstation:</b> ${endStationName}<br>
                <b>Rang:</b> ${index + 1}
            `);

            if (!window.drawnFlowLines) window.drawnFlowLines = [];
            window.drawnFlowLines.push(polyline, arrowHead);
        });
    });

    hideNonRelevantStations(relevantStations);
}


function removeExistingFlowLines() {
    if (window.drawnFlowLines && window.drawnFlowLines.length > 0) {
        window.drawnFlowLines.forEach(line => {
            window.map.removeLayer(line);
        });
        window.drawnFlowLines = [];
    }
}

// Blendet alle Stationen aus, die nicht in der relevanten Liste sind
function hideNonRelevantStations(relevantStations) {
    window.markerArray.forEach(marker => {
        if (!relevantStations.has(marker.stationData.station_name)) {
            marker.setOpacity(0); // Ausblenden
        } else {
            marker.setOpacity(1); // Relevante Stationen sichtbar
        }
    });
}
