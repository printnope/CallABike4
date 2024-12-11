
document.addEventListener('DOMContentLoaded', function () {
    let filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const startTime = document.getElementById('von').value;
            const endTime = document.getElementById('bis').value;

            const weekdayCheckboxes = document.querySelectorAll('input[name="wochentage"]:checked');
            const selectedWeekdays = Array.from(weekdayCheckboxes).map(cb => cb.value);

            const buchungstypRadio = document.querySelector('input[name="buchungstyp"]:checked');
            const buchungstyp = buchungstypRadio ? buchungstypRadio.value : 'beides';

            const portalCheckboxes = document.querySelectorAll('input[name="buchungsportale"]:checked');
            const selectedPortals = Array.from(portalCheckboxes).map(cb => cb.value);

            const thresholdInput = document.getElementById('threshold');
            const threshold = parseInt(thresholdInput.value);

            filterMarkersByCriteria(startTime, endTime, selectedWeekdays, buchungstyp, threshold, selectedPortals);

            const formDiv = document.getElementById('filterForWorkload');
            if (formDiv) {
                formDiv.style.display = 'none';
            }
        });
    }

    const alleCheckbox = document.getElementById('alle');
    if (alleCheckbox) {
        alleCheckbox.addEventListener('change', function () {
            const checkboxes = document.querySelectorAll('input[name="wochentage"]:not(#alle)');
            checkboxes.forEach(cb => cb.checked = alleCheckbox.checked);
        });
    }
});

function filterMarkersByCriteria(startTime, endTime, weekdays, buchungstyp, threshold, selectedPortals) {
    let allMarkers = window.markerArray || [];
    console.log(`Filter wird angewendet auf ${allMarkers.length} Marker`);

    allMarkers.forEach(marker => {
        let stationData = marker.stationData;
        let { startInPeriod, endInPeriod } = getStartEndInPeriod(stationData, weekdays, startTime, endTime, selectedPortals, buchungstyp);

        let totalInPeriod = startInPeriod + endInPeriod;

        let isBuchungstypMatch = (buchungstyp === 'beides') ||
            (buchungstyp === 'abholung' && startInPeriod > 0) ||
            (buchungstyp === 'abgabe' && endInPeriod > 0);

        if (selectedPortals.length > 0 && totalInPeriod === 0) {
            marker.setOpacity(0);
            return;
        }

        if (totalInPeriod > 0 && isBuchungstypMatch) {
            marker.setOpacity(1);
            setMarkerColorBasedOnValue(marker, startInPeriod, endInPeriod, buchungstyp, threshold);
        } else {
            marker.setOpacity(0);
        }
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
            let hourIndex = hour;
            if (stundenDaten[hourIndex]) {
                const { s, e } = accumulateHourData(stundenDaten[hourIndex], portalDaten[hourIndex], selectedPortals, buchungstyp);
                startInPeriod += s;
                endInPeriod += e;
            }
        }
    }

    function accumulateHourData(stundenDataForHour, portalDataForHour, selectedPortals, buchungstyp) {
        let hourStart = 0;
        let hourEnd = 0;

        if (selectedPortals.length > 0) {
            selectedPortals.forEach(portal => {
                const portalData = portalDataForHour[portal];
                if (portalData && buchungstypFilterMatch(buchungstyp, portalData)) {
                    hourStart += portalData.Anzahl_Startvorgaenge;
                    hourEnd += portalData.Anzahl_Endvorgaenge;
                }
            });
        } else {
            hourStart += stundenDataForHour.Anzahl_Startvorgaenge;
            hourEnd += stundenDataForHour.Anzahl_Endvorgaenge;
        }

        return { s: hourStart, e: hourEnd };
    }

    weekdays.forEach(wochentagLang => {
        if (wochentagLang.toLowerCase() === 'alle') {
            Object.keys(stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde).forEach(wochentagKurz => {
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
    if (buchungstyp === 'abholung') {
        return portalData.Anzahl_Startvorgaenge > 0;
    } else if (buchungstyp === 'abgabe') {
        return portalData.Anzahl_Endvorgaenge > 0;
    } else if (buchungstyp === 'beides') {
        return portalData.Anzahl_Startvorgaenge > 0 || portalData.Anzahl_Endvorgaenge > 0;
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

    if (buchungstyp === 'abholung') {
        if (startInPeriod < threshold) {
            marker.setIcon(window.redIcon);
        } else if (startInPeriod > threshold) {
            marker.setIcon(window.greenIcon);
        } else {
            marker.setIcon(window.defaultIcon);
        }
    } else if (buchungstyp === 'abgabe') {
        if (endInPeriod < threshold) {
            marker.setIcon(window.redIcon);
        } else if (endInPeriod > threshold) {
            marker.setIcon(window.greenIcon);
        } else {
            marker.setIcon(window.defaultIcon);
        }
    } else if (buchungstyp === 'beides') {
        if (difference < threshold) {
            marker.setIcon(window.redIcon);
        } else if (difference > threshold) {
            marker.setIcon(window.greenIcon);
        } else {
            marker.setIcon(window.defaultIcon);
        }
    }

    marker.setPopupContent(
        `<b>${marker.stationData.station_name}</b><br>
         Startvorgaenge: ${startInPeriod}<br>
         Endvorgaenge: ${endInPeriod}<br>
         Differenz: ${difference}`
    );
}

function visualizeWorkloadInTotal() {
    let allMarkers = window.markerArray || [];
    allMarkers.forEach(marker => {
        let difference = marker.stationData.Anzahl_Startvorgaenge - marker.stationData.Anzahl_Endvorgaenge;
        if (difference < 0) {
            marker.setIcon(window.redIcon);
        } else if (difference > 0) {
            marker.setIcon(window.greenIcon);
        } else {
            marker.setIcon(window.defaultIcon);
        }

        marker.setPopupContent(
            `<b>${marker.stationData.station_name}</b><br>
             Startvorgaenge: ${marker.stationData.Anzahl_Startvorgaenge}<br>
             Endvorgaenge: ${marker.stationData.Anzahl_Endvorgaenge}<br>
             Differenz: ${difference}`
        );
    });
}
