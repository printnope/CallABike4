// filterFunctions.js

// Eventlistener für das DOMContentLoaded Event hinzufügen
document.addEventListener('DOMContentLoaded', function() {
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
            const threshold = parseInt(thresholdInput.value) || 100; // Standardwert 100, falls keine Eingabe

            // Debug-Ausgaben (kann später entfernt werden)
            console.log('Startzeit:', startTime);
            console.log('Endzeit:', endTime);
            console.log('Ausgewählte Wochentage:', selectedWeekdays);
            console.log('Buchungstyp:', buchungstyp);
            console.log('Ausgewählte Buchungsportale:', selectedPortals);
            console.log('Schwellenwert:', threshold);

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
        let { startInPeriod, endInPeriod } = getStartEndInPeriod(stationData, weekdays, startTime, endTime, selectedPortals, buchungstyp);

        // Überprüfen, ob die Station im angegebenen Zeitraum aktiv ist
        let totalInPeriod = startInPeriod + endInPeriod;

        // Überprüfen, ob der Buchungstyp übereinstimmt
        let isBuchungstypMatch = (buchungstyp === 'beides') ||
            (buchungstyp === 'abholung' && startInPeriod > 0) ||
            (buchungstyp === 'abgabe' && endInPeriod > 0);

        // **Neuer Teil: Überprüfen, ob ausgewählte Portale Buchungen haben**
        if (selectedPortals.length > 0 && totalInPeriod === 0) {
            marker.setOpacity(0); // Marker ausblenden, wenn keine Buchungen in ausgewählten Portalen
            return; // Weiter zum nächsten Marker
        }

        // Finales Filterkriterium
        if (totalInPeriod > 0 && isBuchungstypMatch) {
            marker.setOpacity(1); // Marker sichtbar machen

            // Farbe und Popup basierend auf Buchungstyp und gefilterten Werten setzen
            if (buchungstyp === 'abholung') {
                setMarkerColorBasedOnValue(marker, startInPeriod, endInPeriod, 'abholung', threshold);
            } else if (buchungstyp === 'abgabe') {
                setMarkerColorBasedOnValue(marker, startInPeriod, endInPeriod, 'abgabe', threshold);
            } else if (buchungstyp === 'beides') {
                setMarkerColorBasedOnValue(marker, startInPeriod, endInPeriod, 'beides', threshold);
            }
        } else {
            marker.setOpacity(0); // Marker ausblenden
        }
    });
}

// Hilfsfunktion zur Berechnung der Start- und Endvorgänge im ausgewählten Zeitraum und Portalen
function getStartEndInPeriod(stationData, weekdays, startTime, endTime, selectedPortals, buchungstyp) {
    let startInPeriod = 0;
    let endInPeriod = 0;

    // Iteriere über die ausgewählten Wochentage
    weekdays.forEach(wochentagLang => {
        if (wochentagLang.toLowerCase() === 'alle') {
            // Wenn 'alle' ausgewählt ist, iteriere über alle Wochentage
            Object.keys(stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde).forEach(wochentagKurz => {
                let stundenDaten = stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde[wochentagKurz];
                let portalDaten = stationData.Buchungsportale_pro_Wochentag_und_Stunde[wochentagKurz];

                // Iteriere über die ausgewählten Stunden
                for (let hour = parseInt(startTime.split(':')[0]); hour <= parseInt(endTime.split(':')[0]); hour++) {
                    let hourIndex = hour >= 24 ? 23 : hour;
                    if (stundenDaten[hourIndex]) {
                        // Wenn Portale ausgewählt sind, summiere nur deren Vorgänge
                        if (selectedPortals.length > 0) {
                            selectedPortals.forEach(portal => {
                                if (portalDaten[hourIndex][portal]) {
                                    // Überprüfen, ob der Buchungstyp übereinstimmt
                                    if (buchungstypFilterMatch(buchungstyp, portalDaten[hourIndex][portal])) {
                                        startInPeriod += portalDaten[hourIndex][portal].Anzahl_Startvorgaenge;
                                        endInPeriod += portalDaten[hourIndex][portal].Anzahl_Endvorgaenge;
                                    }
                                }
                            });
                        } else {
                            // Wenn keine Portale ausgewählt sind, summiere alle
                            startInPeriod += stundenDaten[hourIndex].Anzahl_Startvorgaenge;
                            endInPeriod += stundenDaten[hourIndex].Anzahl_Endvorgaenge;
                        }
                    }
                }
            });
        } else {
            // Konvertiere den langen Wochentagsnamen in die Kurzform
            let wochentagKurz = getKurzWochentag(wochentagLang);
            if (stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde[wochentagKurz]) {
                let stundenDaten = stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde[wochentagKurz];
                let portalDaten = stationData.Buchungsportale_pro_Wochentag_und_Stunde[wochentagKurz];

                // Iteriere über die ausgewählten Stunden
                for (let hour = parseInt(startTime.split(':')[0]); hour <= parseInt(endTime.split(':')[0]); hour++) {
                    let hourIndex = hour >= 24 ? 23 : hour;
                    if (stundenDaten[hourIndex]) {
                        // Wenn Portale ausgewählt sind, summiere nur deren Vorgänge
                        if (selectedPortals.length > 0) {
                            selectedPortals.forEach(portal => {
                                if (portalDaten[hourIndex][portal]) {
                                    // Überprüfen, ob der Buchungstyp übereinstimmt
                                    if (buchungstypFilterMatch(buchungstyp, portalDaten[hourIndex][portal])) {
                                        startInPeriod += portalDaten[hourIndex][portal].Anzahl_Startvorgaenge;
                                        endInPeriod += portalDaten[hourIndex][portal].Anzahl_Endvorgaenge;
                                    }
                                }
                            });
                        } else {
                            // Wenn keine Portale ausgewählt sind, summiere alle
                            startInPeriod += stundenDaten[hourIndex].Anzahl_Startvorgaenge;
                            endInPeriod += stundenDaten[hourIndex].Anzahl_Endvorgaenge;
                        }
                    }
                }
            }
        }
    });

    return { startInPeriod, endInPeriod };
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
        'alle': 'Alle', // Hier können wir 'Alle' direkt behandeln
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

    // Bestimme die Farbe basierend auf dem Buchungstyp und den gefilterten Werten
    if (buchungstyp === 'abholung') {
        if (startInPeriod < threshold) {
            marker.setIcon(window.redIcon); // Unter dem Schwellenwert: Rot
        } else if(startInPeriod > threshold) {
            marker.setIcon(window.greenIcon); // Über dem Schwellenwert: Grün
        } else {
            marker.setIcon(window.defaultIcon);
        }
    } else if (buchungstyp === 'abgabe') {
        if (endInPeriod < threshold) {
            marker.setIcon(window.redIcon); // Unter dem Schwellenwert: Rot
        } else if(endInPeriod > threshold) {
            marker.setIcon(window.greenIcon); // Über dem Schwellenwert: Grün
        } else {
            marker.setIcon(window.defaultIcon);
        }
    } else if (buchungstyp === 'beides') {
        if (difference < threshold) {
            marker.setIcon(window.redIcon); // Unter dem Schwellenwert: Rot
        } else if (difference > threshold) {
            marker.setIcon(window.greenIcon); // Über dem Schwellenwert: Grün
        } else {
            marker.setIcon(window.defaultIcon); // Keine Differenz: Standard-Icon (Blau)
        }
    }

    // Aktualisiere das Popup mit den gefilterten Daten
    marker.setPopupContent(
        `<b>${marker.stationData.station_name}</b><br>
         Startvorgänge: ${startInPeriod}<br>
         Endvorgänge: ${endInPeriod}<br>
         Differenz: ${difference}`
    );
}

// Funktion zum Visualisieren der Arbeitsbelastung insgesamt
function visualizeWorkload(){
    let allMarkers = window.markerArray || [];
    allMarkers.forEach(marker => {
        // Berechne die Gesamt-Differenz
        let difference = marker.stationData.Anzahl_Startvorgaenge - marker.stationData.Anzahl_Endvorgaenge;

        // Setze das entsprechende Icon basierend auf der Differenz
        if (difference < 0 ){
            marker.setIcon(window.redIcon); // Negative Differenz: Rotes Icon
        } else if(difference > 0){
            marker.setIcon(window.greenIcon); // Positive Differenz: Grünes Icon
        } else{
            marker.setIcon(window.defaultIcon); // Keine Differenz: Standard-Icon (blau)
        }

        // Aktualisiere das Popup mit der Differenz
        marker.setPopupContent(
            `<b>${marker.stationData.station_name}</b><br>
             Startvorgänge: ${marker.stationData.Anzahl_Startvorgaenge}<br>
             Endvorgänge: ${marker.stationData.Anzahl_Endvorgaenge}<br>
             Differenz: ${difference}`
        );
    });
}
