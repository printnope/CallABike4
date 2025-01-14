

let addressMarker = null;
let routeControlFromAddress = null;

function searchAddressForRouting() {
    const address = document.getElementById('addressInput').value.trim();
    if (!address) {
        alert("Bitte eine Adresse eingeben.");
        return;
    }

    // Nominatim API für Geocoding
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);

                // Wenn bereits ein Marker für Adresse existiert, entfernen wir ihn
                if (addressMarker) {
                    window.map.removeLayer(addressMarker);
                }

                // Adresse als Marker setzen
                addressMarker = L.marker([lat, lon], {icon: window.defaultIcon, draggable: true, zIndexOffset:1000}).addTo(window.map);
                addressMarker.bindPopup(`<b>Gefundene Adresse:</b><br>${data[0].display_name}`);
                window.map.setView([lat, lon], 14);

                addressMarker.on('dragend', () => {
                    recalculateRouteFromAddress();
                });

                // die nächste Station
                const nearestStation = findNearestStation(lat, lon);
                if (!nearestStation) {
                    alert("Keine Stationen gefunden.");
                    return;
                }

                hideAllStationsExcept(nearestStation);

                createOrUpdateRouteFromAddress(lat, lon, nearestStation);
            } else {
                alert("Keine Ergebnisse für diese Adresse gefunden.");
            }
        })
        .catch(err => {
            console.error("Fehler bei der Geocodierung:", err);
            alert("Es ist ein Fehler bei der Adresssuche aufgetreten.");
        });
}

function createOrUpdateRouteFromAddress(lat, lon, nearestStation) {
    if (routeControlFromAddress) {
        window.map.removeControl(routeControlFromAddress);
    }

    const userPos = L.latLng(lat, lon);
    const stationPos = L.latLng(nearestStation.Latitude, nearestStation.Longitude);

    routeControlFromAddress = L.Routing.control({
        waypoints: [userPos, stationPos],
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        addWaypoints: false,
        draggableWaypoints: false,
        lineOptions: {
            styles: [
                {color: 'blue', opacity: 0.6, weight: 4, interactive: false}
            ]
        }
    }).addTo(window.map);

    routeControlFromAddress.on('routesfound', function(e) {
        console.log('Routen gefunden:', e.routes);
    });
    routeControlFromAddress.on('routingerror', function(e) {
        console.log('Routing Fehler:', e.error);
    });
}

function recalculateRouteFromAddress() {
    // Get the new position of the marker
    const userPos = addressMarker.getLatLng();

    // Update the address using the reverse geocoding API
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userPos.lat}&lon=${userPos.lng}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Update the popup content with the new address
            const newAddress = data.display_name || "Unbekannte Adresse";
            addressMarker.bindPopup(`<b>Neue Adresse:</b><br>${newAddress}`).openPopup();

            // Find the nearest station and update the route
            const nearestStation = findNearestStation(userPos.lat, userPos.lng);
            if (!nearestStation) {
                alert("Keine Stationen gefunden.");
                return;
            }

            hideAllStationsExcept(nearestStation);
            createOrUpdateRouteFromAddress(userPos.lat, userPos.lng, nearestStation);
        })
        .catch(err => {
            console.error("Fehler bei der Rückwärts-Geocodierung:", err);
            alert("Es ist ein Fehler bei der Adressaktualisierung aufgetreten.");
        });
}

