// stationsSelector.js
// Diese Version initialisiert die Stationsauswahl NUR wenn "Search for Station" gedrückt wird.
// Der zuvor verwendete DOMContentLoaded und das Intervall wurden entfernt.

function initializeStationSelectionUI(markers) {
    const searchDiv = document.getElementById('searchForStationDiv');
    if (!searchDiv) return;

    // Only initialize once
    if (document.getElementById('stations-select-container')) return;

    const container = document.createElement('div');
    container.id = 'stations-select-container';
    container.style.margin = '10px 0';

    /*
    // Commented out "Station eingeben" search input
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
    */

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

    searchDiv.insertBefore(container, document.getElementById('stationDataTable'));

    const allStations = markers.map(m => m.stationData);
    populateStationsSelect(selectElement, allStations);

    /*
    // Commented out search input event listener
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        const filteredStations = allStations.filter(station =>
            station.station_name.toLowerCase().includes(query)
        );
        populateStationsSelect(selectElement, filteredStations);
    });
    */

    selectElement.addEventListener('change', function() {
        const selectedValue = this.value;
        if (selectedValue) {
            const chosenStation = allStations.find(s => s.Station_ID.toString() === selectedValue);

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
                fillStationDataTable(chosenStation);
            }
        } else {
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


function fillStationDataTable(stationData) {
    // Hilfsfunktion zum Setzen von Tabellenzellenwerten mit verschiedenen Formaten
    function setTableCellValue(id, value, type = 'text') {
        const cell = document.getElementById(id);
        if (cell) {
            if (type === 'list') {
                if (Array.isArray(value)) {
                    cell.innerHTML = '<ul>' + value.map(item => `<li>${item}</li>`).join('') + '</ul>';
                } else {
                    cell.textContent = '';
                }
            }            else if (type === 'sortedList') {
                if (typeof value === 'object' && value !== null) {
                    // Sort and format entries, ignoring numeric keys
                    const sorted = Object.entries(value)
                        .sort((a, b) => b[1] - a[1]) // Sort descending by value
                        .map((entry, index) => {
                            // Use the value directly for display
                            const displayValue = Array.isArray(entry[1]) ? entry[1][1] : entry[1];
                            return `${index + 1}. ${displayValue}`;
                        });
                    cell.innerHTML = '<ul>' + sorted.map(item => `${item}<br>`).join('') + '</ul>';
                } else {
                    cell.textContent = '';
                }
            
            } 
        else if (type === 'keyValueList') {
                if (typeof value === 'object' && value !== null) {
                    let listHTML = '<ul>';
                    for (const key in value) {
                        if (value.hasOwnProperty(key)) {
                            listHTML += `<li>${key}: ${value[key]}</li>`;
                        }
                    }
                    listHTML += '</ul>';
                    cell.innerHTML = listHTML;
                } else {
                    cell.textContent = '';
                }
            } else if (type === 'formattedNumber') {
                // Beispiel: Summe aller Werte in einem Array
                if (Array.isArray(value)) {
                    const sum = value.reduce((acc, curr) => acc + curr, 0);
                    cell.textContent = sum;
                } else {
                    cell.textContent = (value !== null && value !== undefined) ? value : '';
                }
            } else {
                // Standardtext
                cell.textContent = (value !== null && value !== undefined) ? value : '';
            }
        }
    }

    // Setze einfache Werte
    setTableCellValue('Station_ID', stationData.Station_ID);
    setTableCellValue('station_name', stationData.station_name);
    setTableCellValue('Latitude', stationData.Latitude);
    setTableCellValue('Longitude', stationData.Longitude);
    setTableCellValue('Anzahl_Startvorgaenge', stationData.Anzahl_Startvorgaenge);
    setTableCellValue('Anzahl_Endvorgaenge', stationData.Anzahl_Endvorgaenge);

    // Buchungsportale sortiert nach Beliebtheit
    if (stationData.Buchungsportale_sortiert && typeof stationData.Buchungsportale_sortiert === 'object') {
        setTableCellValue('Buchungsportale_sortiert', stationData.Buchungsportale_sortiert, 'sortedList');
    } else {
        setTableCellValue('Buchungsportale_sortiert', []);
    }

    setTableCellValue('Stosszeit', stationData.Stosszeit);
    setTableCellValue('Beliebtester_Wochentag', stationData.Beliebtester_Wochentag);
    setTableCellValue('Beliebteste_Endstation', stationData.Beliebteste_Endstation);
    setTableCellValue('Gesamtzahl_Fahrten', stationData.Gesamtzahl_Fahrten);

    // Beliebteste Endstationen sortiert
    if (stationData.Beliebteste_Endstationen_sortiert && typeof stationData.Beliebteste_Endstationen_sortiert === 'object') {
        setTableCellValue('Beliebteste_Endstationen_sortiert', stationData.Beliebteste_Endstationen_sortiert, 'sortedList');
    } else {
        setTableCellValue('Beliebteste_Endstationen_sortiert', []);
    }
}