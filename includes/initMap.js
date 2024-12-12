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

// Globale Variable für Stationsdaten
window.stationsData = [];

// Lade die JSON-Datei und erstelle Marker
fetch(pathToJson)
    .then(response => response.json())
    .then(data => {
        console.log(`Lade ${data.length} Stationen.`);
        window.stationsData = data;

        data.forEach(station => {
            let marker = L.marker([station.Latitude, station.Longitude], { icon: window.defaultIcon }).addTo(map);

            marker.stationData = station;

            let difference = station.Anzahl_Startvorgaenge - station.Anzahl_Endvorgaenge;

            marker.bindPopup(
                `<b>${station.station_name}</b><br>
                 Startvorgaenge: ${station.Anzahl_Startvorgaenge}<br>
                 Endvorgaenge: ${station.Anzahl_Endvorgaenge}<br>
                 Differenz: ${difference}`
            );

            window.markerArray.push(marker);
        });

        console.log(`Marker wurden geladen: ${window.markerArray.length}`);

        // Stationen-Index nach Name aufbauen für FlowLines
        window.stationIndexByName = {};
        data.forEach(st => {
            stationIndexByName[st.station_name] = {
                lat: st.Latitude,
                lng: st.Longitude
            };
        });
    })
    .catch(error => console.error('Fehler beim Laden der Stationsdaten:', error));

// Funktion zum Zurücksetzen der Marker
function resetMarkers(){
    if (typeof routeControl !== 'undefined' && routeControl) {
        window.map.removeControl(routeControl);
        window.map.removeLayer(window.userMarker);
    }
    if (typeof routeControlFromAddress !== 'undefined' && routeControlFromAddress){
        window.map.removeControl(routeControlFromAddress);
        window.map.removeLayer(addressMarker);
    }

    let allMarkers = window.markerArray;
    allMarkers.forEach(marker => {
        marker.setIcon(window.defaultIcon);
        marker.setOpacity(1);

        let difference = marker.stationData.Anzahl_Startvorgaenge - marker.stationData.Anzahl_Endvorgaenge;

        marker.setPopupContent(
            `<b>${marker.stationData.station_name}</b><br>
             Startvorgaenge: ${marker.stationData.Anzahl_Startvorgaenge}<br>
             Endvorgaenge: ${marker.stationData.Anzahl_Endvorgaenge}<br>
             Differenz: ${difference}`
        );
    });

    // Falls Flow-Linien vorhanden sind, entfernen
    if (window.drawnFlowLines && window.drawnFlowLines.length > 0) {
        window.drawnFlowLines.forEach(line => {
            window.map.removeLayer(line);
        });
        window.drawnFlowLines = [];
    }
}
