// stationsSelector.js
// Diese Version initialisiert die Stationsauswahl NUR wenn "Search for Station" gedrückt wird.
// Der zuvor verwendete DOMContentLoaded und das Intervall wurden entfernt.

function initializeStationSelectionUI(markers) {
    const searchDiv = document.getElementById('searchForStationDiv');
    if (!searchDiv) return;

    // Ensure it only initializes once
    if (document.getElementById('station-autocomplete')) return;

    // Create container for the autocomplete input
    const container = document.createElement('div');
    container.id = 'station-autocomplete-container';
    container.style.position = 'relative';

    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.id = 'station-autocomplete';
    inputField.placeholder = 'Station eingeben...';
    inputField.style.width = '200px';
    inputField.style.marginBottom = '10px';
    container.appendChild(inputField);

    const dropdown = document.createElement('ul');
    dropdown.id = 'station-autocomplete-dropdown';
    dropdown.style.position = 'absolute';
    dropdown.style.top = '100%';
    dropdown.style.left = '0';
    dropdown.style.width = '200px';
    dropdown.style.border = '1px solid #ccc';
    dropdown.style.backgroundColor = '#fff';
    dropdown.style.listStyle = 'none';
    dropdown.style.padding = '0';
    dropdown.style.margin = '0';
    dropdown.style.display = 'none';
    dropdown.style.maxHeight = '150px';
    dropdown.style.overflowY = 'auto';
    container.appendChild(dropdown);

    searchDiv.insertBefore(container, document.getElementById('stationDataTable'));

    const allStations = markers.map(m => m.stationData);

    // Listen to input events
    inputField.addEventListener('input', function () {
        const query = this.value.toLowerCase().trim();
        dropdown.innerHTML = ''; // Clear previous suggestions
        dropdown.style.display = 'none';

        if (query.length > 0) {
            const filteredStations = allStations.filter(station =>
                station.station_name.toLowerCase().includes(query)
            );

            if (filteredStations.length > 0) {
                dropdown.style.display = 'block';
                filteredStations.forEach(station => {
                    const item = document.createElement('li');
                    item.textContent = station.station_name;
                    item.style.padding = '5px';
                    item.style.cursor = 'pointer';
                    item.style.borderBottom = '1px solid #ddd';

                    item.addEventListener('click', function () {
                        selectStation(station);
                    });

                    dropdown.appendChild(item);
                });
            }
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (event) {
        if (!container.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });

    // Handle keyboard navigation
    inputField.addEventListener('keydown', function (event) {
        const items = Array.from(dropdown.children);
        const activeItem = dropdown.querySelector('.active');
        let index = items.indexOf(activeItem);

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            index = (index + 1) % items.length;
            highlightItem(items, index);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            index = (index - 1 + items.length) % items.length;
            highlightItem(items, index);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (activeItem) {
                activeItem.click();
            }
        }
    });

    function highlightItem(items, index) {
        items.forEach(item => item.classList.remove('active'));
        if (index >= 0 && index < items.length) {
            items[index].classList.add('active');
            items[index].scrollIntoView({ block: 'nearest' });
        }
    }

    function selectStation(station) {
        inputField.value = station.station_name;
        dropdown.style.display = 'none';

        // Highlight marker and center map
        window.markerArray.forEach(marker => {
            if (marker.stationData.Station_ID === station.Station_ID) {
                marker.setOpacity(1);
                window.map.setView([marker.stationData.Latitude, marker.stationData.Longitude], 15);
            } else {
                marker.setOpacity(0);
            }
        });

        fillStationDataTable(station);
    }
}

function populateStationsSelect(selectElement, stations) {
    // Clear existing options, but keep the default one
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    // Sort stations alphabetically by station_name
    const sortedStations = stations.sort((a, b) => a.station_name.localeCompare(b.station_name));

    // Populate the dropdown with sorted stations
    sortedStations.forEach(station => {
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

