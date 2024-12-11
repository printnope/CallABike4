// workLoadFunctions.js

// Eventlistener für das DOMContentLoaded Event hinzufügen
document.addEventListener('DOMContentLoaded', function () {
    let filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Verhindert das Standardverhalten des Formulars (Seitenneuladen)

            // Eingabewerte abrufen
            const startTime = document.getElementById('von').value;
            const endTime = document.getElementById('bis').value;

            // Ausgewählte Wochentage abrufen
            const weekdayCheckboxes = document.querySelectorAll('input[name="wochentage"]:checked');
            const selectedWeekdays = Array.from(weekdayCheckboxes).map(cb => cb.value);

            // Ausgewählten Buchungstyp abrufen
            const buchungstypRadio = document.querySelector('input[name="buchungstyp"]:checked');
            const buchungstyp = buchungstypRadio ? buchungstypRadio.value : 'beides';

            // Ausgewählte Buchungsportale abrufen
            const portalCheckboxes = document.querySelectorAll('input[name="buchungsportale"]:checked');
            const selectedPortals = Array.from(portalCheckboxes).map(cb => cb.value);

            // Schwellenwert abrufen
            const thresholdInput = document.getElementById('threshold');
            const threshold = parseInt(thresholdInput.value);

            // Filterfunktion aufrufen und Eingabewerte übergeben
            filterMarkersByCriteria(startTime, endTime, selectedWeekdays, buchungstyp, threshold, selectedPortals);

            // Optional: Formular nach Filterung verstecken
            const formDiv = document.getElementById('filterForWorkload');
            if (formDiv) {
                formDiv.style.display = 'none'; // Formular verstecken
            }
        });
    }

    // Eventlistener für den "Alle" Checkbox hinzufügen
    const alleCheckbox = document.getElementById('alle');
    if (alleCheckbox) {
        alleCheckbox.addEventListener('change', function () {
            const checkboxes = document.querySelectorAll('input[name="wochentage"]:not(#alle)');
            checkboxes.forEach(cb => cb.checked = alleCheckbox.checked);
        });
    }
});

// Funktion zum Filtern der Marker basierend auf den Kriterien
function filterMarkersByCriteria(startTime, endTime, weekdays, buchungstyp, threshold, selectedPortals) {
    let allMarkers = window.markerArray || [];
    console.log(`Filter wird angewendet auf ${allMarkers.length} Marker`); // Debugging

    allMarkers.forEach(marker => {
        let stationData = marker.stationData;

        // Berechne die relevanten Start- und Endvorgänge im ausgewählten Zeitraum und den ausgewählten Portalen
        let {
            startInPeriod,
            endInPeriod
        } = getStartEndInPeriod(stationData, weekdays, startTime, endTime, selectedPortals, buchungstyp);

        // Überprüfen, ob die Station im angegebenen Zeitraum aktiv ist
        let totalInPeriod = startInPeriod + endInPeriod;

        // Überprüfen, ob der Buchungstyp übereinstimmt
        let isBuchungstypMatch = (buchungstyp === 'beides') ||
            (buchungstyp === 'abholung' && startInPeriod > 0) ||
            (buchungstyp === 'abgabe' && endInPeriod > 0);

        // Wenn Portale ausgewählt sind, aber keine Buchungen vorhanden sind, ausblenden
        if (selectedPortals.length > 0 && totalInPeriod === 0) {
            marker.setOpacity(0);
            return;
        }

        // Finales Filterkriterium
        if (totalInPeriod > 0 && isBuchungstypMatch) {
            marker.setOpacity(1);

            // Farbe und Popup basierend auf Buchungstyp und gefilterten Werten setzen
            setMarkerColorBasedOnValue(marker, startInPeriod, endInPeriod, buchungstyp, threshold);
        } else {
            marker.setOpacity(0);
        }
    });
}

// Modularisierte Funktion zur Berechnung der Start- und Endvorgänge
function getStartEndInPeriod(stationData, weekdays, startTime, endTime, selectedPortals, buchungstyp) {
    let startInPeriod = 0;
    let endInPeriod = 0;

    // Hilfsfunktion: Verarbeitung eines einzelnen Wochentages
    function processWeekday(wochentagKurz) {
        const stundenDaten = stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde[wochentagKurz];
        const portalDaten = stationData.Buchungsportale_pro_Wochentag_und_Stunde[wochentagKurz];
        if (!stundenDaten || !portalDaten) return;

        const startHour = parseInt(startTime.split(':')[0], 10);
        const endHour = parseInt(endTime.split(':')[0], 10);

        for (let hour = startHour; hour <= endHour; hour++) {
            let hourIndex = hour >= 24 ? 23 : hour;
            if (stundenDaten[hourIndex]) {
                const {
                    s,
                    e
                } = accumulateHourData(stundenDaten[hourIndex], portalDaten[hourIndex], selectedPortals, buchungstyp);
                startInPeriod += s;
                endInPeriod += e;
            }
        }
    }

    // Hilfsfunktion: Berechnung der Werte für eine einzelne Stunde
    function accumulateHourData(stundenDataForHour, portalDataForHour, selectedPortals, buchungstyp) {
        let hourStart = 0;
        let hourEnd = 0;

        if (selectedPortals.length > 0) {
            // Nur ausgewählte Portale summieren
            selectedPortals.forEach(portal => {
                const portalData = portalDataForHour[portal];
                if (portalData && buchungstypFilterMatch(buchungstyp, portalData)) {
                    hourStart += portalData.Anzahl_Startvorgaenge;
                    hourEnd += portalData.Anzahl_Endvorgaenge;
                }
            });
        } else {
            // Wenn keine Portale ausgewählt sind, summiere alle
            hourStart += stundenDataForHour.Anzahl_Startvorgaenge;
            hourEnd += stundenDataForHour.Anzahl_Endvorgaenge;
        }

        return {s: hourStart, e: hourEnd};
    }

    // Über die ausgewählten Wochentage iterieren
    weekdays.forEach(wochentagLang => {
        if (wochentagLang.toLowerCase() === 'alle') {
            // Alle Wochentage durchgehen
            Object.keys(stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde).forEach(wochentagKurz => {
                processWeekday(wochentagKurz);
            });
        } else {
            // Einzelnen Wochentag konvertieren und verarbeiten
            let wochentagKurz = getKurzWochentag(wochentagLang);
            if (wochentagKurz && stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde[wochentagKurz]) {
                processWeekday(wochentagKurz);
            }
        }
    });

    return {startInPeriod, endInPeriod};
}

// Funktion zur Überprüfung, ob der Buchungstyp übereinstimmt
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

// Hilfsfunktion zur Umwandlung des langen Wochentagsnamens in die Kurzform
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
    return mapping[wochentagLang.toLowerCase()] || '';
}

// Funktion zum Setzen der Markerfarbe und Aktualisieren des Popups basierend auf den gefilterten Werten
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
         Startvorgänge: ${startInPeriod}<br>
         Endvorgänge: ${endInPeriod}<br>
         Differenz: ${difference}`
    );
}

// Funktion zum Visualisieren der Gesamtarbeitsbelastung
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
             Startvorgänge: ${marker.stationData.Anzahl_Startvorgaenge}<br>
             Endvorgänge: ${marker.stationData.Anzahl_Endvorgaenge}<br>
             Differenz: ${difference}`
        );
    });
}

function showFilterForm() {
const formDiv = document.getElementById('filterForWorkload');
if (formDiv) {
formDiv.style.display = 'block'; // Formular sichtbar machen
    }
}

