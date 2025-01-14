    // workLoadFunctions.js
    document.addEventListener('DOMContentLoaded', function () {
        const filterForm = document.getElementById('filterForm'); 
        if (filterForm) {
            filterForm.addEventListener('submit', function (event) {
                event.preventDefault();
        
        // Retrieve currently active Filters
        
                // Retrieve time range
                const startTime = document.getElementById('startzeit')?.value || '00:00';
                const endTime = document.getElementById('endzeit')?.value || '23:59';
    
                // Parse hours
                const startHour = parseInt(startTime.split(':')[0], 10); // decimal system parse
                const endHour = parseInt(endTime.split(':')[0], 10);
    
                // Retrieve weekdays
                const weekdayCheckboxes = document.querySelectorAll(
                    '#filterForm input[name="wochentage"]:checked'
                );
                const selectedWeekdays = Array.from(weekdayCheckboxes).map(cb => cb.value);
    
                // Validate weekdays
                if (selectedWeekdays.length === 0) {
                    console.error("No weekdays selected.");
                    return;
                }
    
                // Retrieve booking type
                const buchungstypRadio = document.querySelector('input[name="buchungstyp"]:checked');
                const buchungstyp = buchungstypRadio?.value || 'beides';
    
                // Retrieve portals
                const portalCheckboxes = document.querySelectorAll('input[name="buchungsportale"]:checked');
                const selectedPortals = Array.from(portalCheckboxes).map(cb => cb.value);
    
                // Retrieve threshold
                const thresholdInput = document.getElementById('threshold');
                const threshold = parseInt(thresholdInput?.value, 10) || 0;
    
                console.log("Selected Weekdays:", selectedWeekdays);
                console.log("Start Time:", startTime);
                console.log("End Time:", endTime);
                console.log("Parsed Start Hour:", startHour);
                console.log("Parsed End Hour:", endHour);
                console.log("Booking Type:", buchungstyp);
                console.log("Selected Portals:", selectedPortals);
                console.log("Threshold:", threshold);
    
                // Validate time range
                if (isNaN(startHour) || isNaN(endHour)) {
                    console.error("Invalid time range.");
                    return;
                }
    
                // Pass the values to filterStations
                filterStations({
                    startHour,
                    endHour,
                    weekdays: selectedWeekdays,
                    buchungstyp,
                    selectedPortals,
                    threshold,
                });
    
                // Hide the form after submission
                const formDiv = document.getElementById('filterForWorkload');
                if (formDiv) {
                    formDiv.style.display = 'none';
                }
            });
        }
    });

    function filterData({ startHour, endHour, weekdays, buchungstyp, selectedPortals, threshold }) {
        const filteredData = [];
    
        window.markerArray.forEach(marker => {
            const stationData = marker.stationData;
            const portalData = stationData.Buchungsportale_pro_Wochentag_und_Stunde;
    
            let startInPeriod = 0;
            let endInPeriod = 0;
    
            weekdays.forEach(day => {
                const dailyData = portalData[day];
                if (!dailyData) return;
    
                for (let hour = startHour; hour <= endHour; hour++) {
                    const hourlyData = dailyData[hour];
                    if (!hourlyData) continue;
    
                    if (selectedPortals.length > 0) {
                        selectedPortals.forEach(portal => {
                            const portalEntry = hourlyData[portal];
                            if (portalEntry) {
                                startInPeriod += portalEntry.Anzahl_Startvorgaenge || 0;
                                endInPeriod += portalEntry.Anzahl_Endvorgaenge || 0;
                            }
                        });
                    } else {
                        for (let portal in hourlyData) {
                            const portalEntry = hourlyData[portal];
                            if (portalEntry) {
                                startInPeriod += portalEntry.Anzahl_Startvorgaenge || 0;
                                endInPeriod += portalEntry.Anzahl_Endvorgaenge || 0;
                            }
                        }
                    }
                }
            });
    
            const totalInPeriod = startInPeriod + endInPeriod;
    
            // Add station data to filtered results if it passes the threshold
            if (totalInPeriod > 0) {
                filteredData.push({
                    stationData,
                    startInPeriod,
                    endInPeriod,
                    totalInPeriod,
                });
            }
        });
    
        return filteredData;
    }
    function filterStations({ startHour, endHour, weekdays, buchungstyp, selectedPortals, threshold }) {
        console.log("Filter Stations called with:");
        console.log("Start Hour:", startHour);
        console.log("End Hour:", endHour);
        console.log("Selected Weekdays:", weekdays);
        console.log("Booking Type:", buchungstyp);
        console.log("Selected Portals:", selectedPortals);
        console.log("Threshold:", threshold);
    
        if (isNaN(startHour) || isNaN(endHour) || weekdays.length === 0) {
            console.error("Invalid filters: Missing time range or weekdays.");
            return;
        }
    
        // Get filtered data
        const filteredData = filterData({ startHour, endHour, weekdays, buchungstyp, selectedPortals, threshold });
    
        // Determine the legend type
        const legendType = buchungstyp === 'beides' ? 'difference' : 'starts-ends';
    
        // Update markers
        window.markerArray.forEach(marker => {
            const stationInfo = filteredData.find(data => data.stationData.Station_ID === marker.stationData.Station_ID);
    
            if (stationInfo) {
                marker.setOpacity(1);
                marker.setPopupContent(`
                    <b>${stationInfo.stationData.station_name}</b><br>
                    Startvorgänge: ${stationInfo.startInPeriod}<br>
                    Endvorgänge: ${stationInfo.endInPeriod}<br>
                    Gesamt: ${stationInfo.totalInPeriod}<br>
                    Differenz: ${(stationInfo.startInPeriod - stationInfo.endInPeriod)} <!-- No abs here -->
                `);
                // Apply color logic based on the legend type
                setMarkerColorBasedOnValue(
                    marker,
                    stationInfo.startInPeriod,
                    stationInfo.endInPeriod,
                    legendType,
                    threshold
                );
            } else {
                marker.setOpacity(0);
            }
        });
    
        // Toggle the legend display
        toggleLegend(legendType, threshold);
    }

    function setMarkerColorBasedOnValue(marker, startInPeriod, endInPeriod, legendType, threshold) {
        const difference = Math.abs(startInPeriod - endInPeriod); // Absolute difference for 'beides'
    
        if (legendType === 'difference') {
            // Coloring logic for 'beides' (difference-based)
            if (difference > threshold) {
                marker.setIcon(window.redIcon || window.defaultIcon);
            } else if (difference > threshold / 2) {
                marker.setIcon(window.orangeIcon || window.defaultIcon);
            } else {
                marker.setIcon(window.greenIcon || window.defaultIcon);
            }
        } else if (legendType === 'starts-ends') {
            // Coloring logic for 'starts' or 'ends' total
            const total = startInPeriod + endInPeriod;
            if (total > threshold) {
                marker.setIcon(window.redIcon || window.defaultIcon);
            } else {
                marker.setIcon(window.greenIcon || window.defaultIcon);
            }
        }
    }


    
    function toggleLegend(filterType, threshold) {
        const startsEndsLegend = document.getElementById('starts-ends-legend');
        const differenceLegend = document.getElementById('difference-legend');
        const thresholdDisplayStartsEnds = document.getElementById('threshold-display-starts-ends');
        const thresholdDisplayDifference = document.getElementById('threshold-display-difference');

        // Check if elements exist
        if (!startsEndsLegend || !differenceLegend) {
            console.error('Legend elements not found in the DOM');
            return;
        }

        // Reset visibility of legends
        startsEndsLegend.style.display = 'none';
        differenceLegend.style.display = 'none';

        if (filterType === 'starts-ends') {
            // Show Starts/Ends Legend
            startsEndsLegend.style.display = 'block';

                // Update threshold display dynamically for Starts/Ends
                if (thresholdDisplayStartsEnds) {
                    const activityType = filterType === 'abholung' ? 'Abholungen-' : 'Abgaben-';
                    thresholdDisplayStartsEnds.textContent = `${activityType}Schwellenwert: ${threshold}`;
                }

        } else if (filterType === 'difference') {
            // Show Difference Legend
            differenceLegend.style.display = 'block';

            // Update threshold display
            if (thresholdDisplayDifference) {
                thresholdDisplayDifference.textContent = `Schwellenwert: ${threshold}`;
            }
        } else {
            console.error('Unknown filterType:', filterType);
        }
    }


