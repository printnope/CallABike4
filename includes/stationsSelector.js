// stationsSelector.js

// Warte bis markerArray verfügbar ist
document.addEventListener('DOMContentLoaded', () => {
    let checkInterval = setInterval(() => {
        if (window.markerArray && window.markerArray.length > 0) {
            clearInterval(checkInterval);
            initializeStationSelectionUI(window.markerArray);
        }
    }, 200);
});

function initializeStationSelectionUI(markers) {
    const searchDiv = document.getElementById('searchForStationDiv');
    if (!searchDiv) return; // Falls das Div nicht vorhanden ist

    const container = document.createElement('div');
    container.id = 'stations-select-container';
    container.style.margin = '10px 0';

    // Suchfeld
    const labelSearch = document.createElement('label');
    labelSearch.setAttribute('for', 'stationSearch');
    labelSearch.textContent = 'Station suchen:';
    container.appendChild(labelSearch);
    container.appendChild(document.createElement('br'));

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'stationSearch';
    searchInput.placeholder = 'Station eingeben...';
    searchInput.style.width = '200px';
    searchInput.style.marginBottom = '10px';
    container.appendChild(searchInput);

    container.appendChild(document.createElement('br'));

    // Select-Box
    const labelSelect = document.createElement('label');
    labelSelect.setAttribute('for', 'stationSelect');
    labelSelect.textContent = 'Station wählen:';
    container.appendChild(labelSelect);
    container.appendChild(document.createElement('br'));

    const selectElement = document.createElement('select');
    selectElement.id = 'stationSelect';
    selectElement.style.width = '200px';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Bitte eine Station wählen --';
    selectElement.appendChild(defaultOption);

    container.appendChild(selectElement);

    // Container in das searchDiv einfügen (vor die Tabelle)
    searchDiv.insertBefore(container, document.getElementById('stationDataTable'));

    // Alle Stationen aus markerArray extrahieren
    const allStations = markers.map(m => m.stationData);

    let filteredStations = allStations;
    populateStationsSelect(selectElement, filteredStations);

    // Such-Event
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        filteredStations = allStations.filter(station =>
            station.station_name.toLowerCase().includes(query)
        );
        populateStationsSelect(selectElement, filteredStations);
    });

    // Auswahl-Event
    selectElement.addEventListener('change', function() {
        const selectedValue = this.value;

        if (selectedValue) {
            const chosenStation = filteredStations.find(s => s.Station_ID.toString() === selectedValue);

            window.markerArray.forEach(marker => {
                if (marker.stationData.Station_ID.toString() === selectedValue) {
                    marker.setOpacity(1);
                    window.map.setView([marker.stationData.Latitude, marker.stationData.Longitude], 15);
                } else {
                    marker.setOpacity(0);
                }
            });

            if (chosenStation) {
                const coords = [chosenStation.Latitude, chosenStation.Longitude];
                console.log('Ausgewählte Station Koordinaten:', coords);

                // Tabelle mit Daten befüllen
                fillStationDataTable(chosenStation);
            }
        } else {
            // Keine Auswahl -> Tabelle leeren
            fillStationDataTable({});
        }
    });
}

function populateStationsSelect(selectElement, stations) {
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    stations.forEach(station => {
        const option = document.createElement('option');
        option.value = station.Station_ID;
        option.textContent = station.station_name;
        selectElement.appendChild(option);
    });
}

// Diese Funktion füllt die Tabelle mit den Daten der gewählten Station
function fillStationDataTable(stationData) {
    function setTableCellValue(id, value) {
        const cell = document.getElementById(id);
        if (cell) {
            if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                cell.innerHTML = "<pre>" + JSON.stringify(value, null, 2) + "</pre>";
            } else {
                cell.textContent = (value !== null) ? value : '';
            }
        }
    }

    setTableCellValue('Station_ID', stationData.Station_ID);
    setTableCellValue('station_name', stationData.station_name);
    setTableCellValue('Latitude', stationData.Latitude);
    setTableCellValue('Longitude', stationData.Longitude);
    setTableCellValue('Anzahl_Startvorgaenge', stationData.Anzahl_Startvorgaenge);
    setTableCellValue('Anzahl_Endvorgaenge', stationData.Anzahl_Endvorgaenge);
    setTableCellValue('Buchungsportale_sortiert', stationData.Buchungsportale_sortiert);
    setTableCellValue('Stosszeit', stationData.Stosszeit);
    setTableCellValue('Beliebtester_Wochentag', stationData.Beliebtester_Wochentag);
    setTableCellValue('Beliebteste_Endstation', stationData.Beliebteste_Endstation);
    setTableCellValue('Gesamtzahl_Fahrten', stationData.Gesamtzahl_Fahrten);
    setTableCellValue('Beliebteste_Endstationen_sortiert', stationData.Beliebteste_Endstationen_sortiert);
    setTableCellValue('Anzahl_Fahrten_pro_Wochentag', stationData.Anzahl_Fahrten_pro_Wochentag);
    setTableCellValue('Anzahl_Fahrten_pro_Wochentag_und_Stunde', stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde);
    setTableCellValue('Buchungsportale_pro_Wochentag_und_Stunde', stationData.Buchungsportale_pro_Wochentag_und_Stunde);
}
