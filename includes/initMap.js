// initMap.js

// Initialisiere das Marker-Array im globalen Scope
window.markerArray = [];

// Definiere die Icons
window.defaultIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

window.greenIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

window.redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Pfad zur JSON-Datei
let pathToJson = "../data/stations.json";

// Erstelle die Karte und zentriere sie auf Frankfurt am Main
window.map = L.map('map').setView([50.1109, 8.6821], 13);

// Füge die OpenStreetMap-Kacheln hinzu
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap-Mitwirkende',
    maxZoom: 19,
}).addTo(map);

// Lade die JSON-Datei und erstelle Marker
fetch(pathToJson)
    .then(response => response.json())
    .then(data => {
        console.log(`Lade ${data.length} Stationen.`); // Debugging

        data.forEach(station => {
            // Marker mit Standard-Icon erstellen
            let marker = L.marker([station.Latitude, station.Longitude], { icon: window.defaultIcon }).addTo(map);

            // Stationsdaten dem Marker hinzufügen
            marker.stationData = station;

            // Berechne die Differenz zwischen Start- und Endvorgängen
            let difference = station.Anzahl_Startvorgaenge - station.Anzahl_Endvorgaenge;

            // Popup hinzufügen
            marker.bindPopup(
                `<b>${station.station_name}</b><br>
                 Startvorgänge: ${station.Anzahl_Startvorgaenge}<br>
                 Endvorgänge: ${station.Anzahl_Endvorgaenge}<br>
                 Differenz: ${difference}`
            );

            // Marker dem Array hinzufügen
            window.markerArray.push(marker);
        });

        console.log(`Marker wurden geladen: ${window.markerArray.length}`); // Debugging

    })
    .catch(error => console.error('Fehler beim Laden der Stationsdaten:', error));

// Funktion zum Zurücksetzen der Marker
function resetMarkers(){
    let allMarkers = window.markerArray;
    allMarkers.forEach(marker => {
        marker.setIcon(window.defaultIcon); // Standard-Icon setzen
        marker.setOpacity(1); // Sichtbar machen

        // Berechne die Differenz zwischen Start- und Endvorgängen
        let difference = marker.stationData.Anzahl_Startvorgaenge - marker.stationData.Anzahl_Endvorgaenge;

        // Aktualisiere das Popup
        marker.setPopupContent(
            `<b>${marker.stationData.station_name}</b><br>
             Startvorgänge: ${marker.stationData.Anzahl_Startvorgaenge}<br>
             Endvorgänge: ${marker.stationData.Anzahl_Endvorgaenge}<br>
             Differenz: ${difference}`
        );
    });
}
