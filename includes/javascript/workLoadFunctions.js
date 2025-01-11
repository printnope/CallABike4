// workLoadFunctions.js

document.addEventListener('DOMContentLoaded', function () {
    let filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const startTime = document.getElementById('von').value;
            const endTime = document.getElementById('bis').value;

            const weekdayCheckboxes = document.querySelectorAll('input[name="wochentage"]:checked');
            const selectedWeekdays = Array.from(new Set(
                Array.from(weekdayCheckboxes)
                    .map(cb => cb.value)
                    .filter(value => value !== 'alle') // Exclude "alle"
            ));
         
            

            const buchungstypRadio = document.querySelector('input[name="buchungstyp"]:checked');
            const buchungstyp = buchungstypRadio ? buchungstypRadio.value : 'beides';

            const portalCheckboxes = document.querySelectorAll('input[name="buchungsportale"]:checked');
            const selectedPortals = Array.from(portalCheckboxes).map(cb => cb.value);

            const thresholdInput = document.getElementById('threshold');
            const threshold = parseInt(thresholdInput.value, 10);

            console.log('Selected Weekdays:', selectedWeekdays);
            console.log('Selected Portals:', selectedPortals);

            // Marker filtern
            filterMarkersByCriteria(startTime, endTime, selectedWeekdays, buchungstyp, threshold, selectedPortals);
            


            const formDiv = document.getElementById('filterForWorkload');
            if (formDiv) {
                formDiv.style.display = 'none';
            }
        });
    }

 // Select/Deselect all weekdays functionality
 const selectAllWeekdaysButton = document.getElementById('selectAllWeekdaysButton');
 if (selectAllWeekdaysButton) {
     selectAllWeekdaysButton.addEventListener('click', function () {
         const weekdayCheckboxes = document.querySelectorAll('input[name="wochentage"]');
         const allChecked = Array.from(weekdayCheckboxes).every(cb => cb.checked);

         // Toggle all checkboxes
         weekdayCheckboxes.forEach(cb => cb.checked = !allChecked);

         // Update button text
         selectAllWeekdaysButton.textContent = allChecked ? 'Alle auswählen' : 'Alle abwählen';
     });
 }
 const selectAllPortalsButton = document.getElementById('selectAllPortalsButton');
 if (selectAllPortalsButton) {
    selectAllPortalsButton.addEventListener('click', function () {
         const weekdayCheckboxes = document.querySelectorAll('input[name="buchungsportale"]:not(#buchungsportale-alle)');
         const allChecked = Array.from(weekdayCheckboxes).every(cb => cb.checked);

         // Toggle all checkboxes
         weekdayCheckboxes.forEach(cb => cb.checked = !allChecked);

         // Update button text
         selectAllPortalsButton.textContent = allChecked ? 'Alle auswählen' : 'Alle abwählen';
     });
 }

});

function filterMarkersByCriteria(startTime, endTime, weekdays, buchungstyp, threshold, selectedPortals) {
    let allMarkers = window.markerArray || [];
    console.log(`Filter wird angewendet auf ${allMarkers.length} Marker`);
        // Track the active legend type
        let activeLegend = buchungstyp === 'beides' ? 'difference' : 'starts-ends';

    allMarkers.forEach(marker => {
        let stationData = marker.stationData;
        let {startInPeriod, endInPeriod} = getStartEndInPeriod(stationData, weekdays, startTime, endTime, selectedPortals, buchungstyp);

        let totalInPeriod = startInPeriod + endInPeriod;

        let isBuchungstypMatch = (buchungstyp === 'beides') ||
            (buchungstyp === 'abholung' && startInPeriod > 0) ||
            (buchungstyp === 'abgabe' && endInPeriod > 0);

        if (selectedPortals.length > 0 && totalInPeriod === 0) {
            marker.setOpacity(0);
        } else if (totalInPeriod > 0 && isBuchungstypMatch) {
            marker.setOpacity(1);
            setMarkerColorBasedOnValue(marker, startInPeriod, endInPeriod, buchungstyp, threshold);
        } else {
            marker.setOpacity(0);
        }
        toggleLegend(activeLegend, threshold);
    });
}

function getStartEndInPeriod(stationData, weekdays, startTime, endTime, selectedPortals, buchungstyp) {
    let startInPeriod = 0;
    let endInPeriod = 0;

    function processWeekday(wochentagKurz) {
        const stundenDaten = stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde[wochentagKurz];
        const portalDaten = stationData.Buchungsportale_pro_Wochentag_und_Stunde[wochentagKurz];
        if (!stundenDaten || !portalDaten) return;

        const startHour = parseInt(startTime.split(':')[0], 10);
        const endHour = parseInt(endTime.split(':')[0], 10);

        for (let hour = startHour; hour <= endHour; hour++) {
            let stundenDataForHour = stundenDaten[hour];
            let portalDataForHour = portalDaten[hour];
            let { s, e } = accumulateHourData(stundenDataForHour, portalDataForHour, selectedPortals, buchungstyp);
            startInPeriod += s;
            endInPeriod += e;
        }
    }

    function accumulateHourData(stundenDataForHour, portalDataForHour, selectedPortals, buchungstyp) {
        let hourStart = 0;
        let hourEnd = 0;

        if (!stundenDataForHour || !portalDataForHour) {
            return { s:0, e:0 };
        }

        if (selectedPortals.length > 0) {
            selectedPortals.forEach(portal => {
                const pd = portalDataForHour[portal];
                if (pd && buchungstypFilterMatch(buchungstyp, pd)) {
                    hourStart += pd.Anzahl_Startvorgaenge;
                    hourEnd += pd.Anzahl_Endvorgaenge;
                }
            });
        } else {
            if (buchungstyp === 'abholung') {
                hourStart += stundenDataForHour.Anzahl_Startvorgaenge;
            } else if (buchungstyp === 'abgabe') {
                hourEnd += stundenDataForHour.Anzahl_Endvorgaenge;
            } else if (buchungstyp === 'beides') {
                hourStart += stundenDataForHour.Anzahl_Startvorgaenge;
                hourEnd += stundenDataForHour.Anzahl_Endvorgaenge;
            }
        }

        return { s: hourStart, e: hourEnd };
    }

    weekdays.forEach(wochentagLang => {
        if (wochentagLang.toLowerCase() === 'alle') {
            ['Mo','Di','Mi','Do','Fr','Sa','So'].forEach(wochentagKurz => {
                processWeekday(wochentagKurz);
            });
        } else {
            let wochentagKurz = getKurzWochentag(wochentagLang);
            if (wochentagKurz && stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde[wochentagKurz]) {
                processWeekday(wochentagKurz);
            }
        }
    });

    return {startInPeriod, endInPeriod};
}

function buchungstypFilterMatch(buchungstyp, portalData) {
    if (!portalData) return false;
    if (buchungstyp === 'abholung') {
        return portalData.Anzahl_Startvorgaenge > 0;
    } else if (buchungstyp === 'abgabe') {
        return portalData.Anzahl_Endvorgaenge > 0;
    } else if (buchungstyp === 'beides') {
        return (portalData.Anzahl_Startvorgaenge + portalData.Anzahl_Endvorgaenge) > 0;
    }
    return false;
}

function getKurzWochentag(wochentagLang) {
    const mapping = {
        'alle': 'Alle',
        'montag': 'Mo',
        'dienstag': 'Di',
        'mittwoch': 'Mi',
        'donnerstag': 'Do',
        'freitag': 'Fr',
        'samstag': 'Sa',
        'sonntag': 'So'
    };
    return mapping[wochentagLang.toLowerCase()];
}

function setMarkerColorBasedOnValue(marker, startInPeriod, endInPeriod, buchungstyp, threshold) {
    let difference = startInPeriod - endInPeriod;

    if (buchungstyp === 'beides') {
        // Custom logic for 'beides'
        if (Math.abs(difference) > threshold) {
            // Imbalance exceeds threshold (red)
            marker.setIcon(window.redIcon || window.defaultIcon);
        } else if (Math.abs(difference) > threshold / 2) {
            // Imbalance is between half-threshold and threshold (orange)
            marker.setIcon(window.orangeIcon || window.defaultIcon);
        } else {
            // Imbalance is below half-threshold (green)
            marker.setIcon(window.greenIcon || window.defaultIcon);
        }
    } else {
        // Logic for 'abholung' and 'abgabe' remains unchanged
        if (buchungstyp === 'abholung') {
            if (startInPeriod > threshold) {
                marker.setIcon(window.redIcon || window.defaultIcon);
            } else {
                marker.setIcon(window.greenIcon || window.defaultIcon);
            }
        } else if (buchungstyp === 'abgabe') {
            if (endInPeriod > threshold) {
                marker.setIcon(window.redIcon || window.defaultIcon);
            } else {
                marker.setIcon(window.greenIcon || window.defaultIcon);
            }
        }
    }

    // Update popup content
    marker.setPopupContent(
        `<b>${marker.stationData.station_name}</b><br>
         Startvorgaenge: ${startInPeriod}<br>
         Endvorgaenge: ${endInPeriod}<br>
         Differenz: ${difference}`
    );
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


