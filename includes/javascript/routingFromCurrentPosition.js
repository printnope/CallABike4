window.userMarker = null;
let routeControl = null;
let nearestStation = null;

function startRoutingFromCurrentPosition() {
    const legends = document.getElementsByClassName('legend');
    Array.from(legends).forEach(legend => {
        legend.style.display = 'none';
    });
    if (!navigator.geolocation) {
        alert("Geolocation wird von deinem Browser nicht unterstützt.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            setupRouting(userLat, userLng);
        },
        error => {
            alert("Konnte deinen Standort nicht bestimmen. Bitte Standortzugriff erlauben.");
        }
    );
}

function setupRouting(userLat, userLng) {
    nearestStation = findNearestStation(userLat, userLng);
    if (!nearestStation) {
        alert("Keine Stationen gefunden.");
        return;
    }

    hideAllStationsExcept(nearestStation);

    if (userMarker) {
        window.map.removeLayer(userMarker);
    }

    // Marker mit höherem zIndex
    userMarker = L.marker([userLat, userLng], {draggable: true, zIndexOffset: 1000}).addTo(window.map);
    window.map.setView([userLat, userLng], 14);

    userMarker.on('dragend', () => {
        recalculateRoute();
    });

    createOrUpdateRoute();
}
function findNearestStation(userLat, userLng) {
    if (!window.markerArray || window.markerArray.length === 0) {
        return null;
    }

    const userPos = L.latLng(userLat, userLng);
    let nearest = null;
    let nearestDistance = Infinity;

    window.markerArray.forEach(marker => {
        const stationPos = L.latLng(marker.stationData.Latitude, marker.stationData.Longitude);
        const dist = userPos.distanceTo(stationPos);
        if (dist < nearestDistance) {
            nearestDistance = dist;
            nearest = {...marker.stationData, Distance: dist}; // Store the distance
        }
    });

    return nearest;
}


function hideAllStationsExcept(station) {
    window.markerArray.forEach(marker => {
        if (marker.stationData.Station_ID === station.Station_ID) {
            console.log("Station Data:", station);
            console.log("Marker Data:", marker.stationData);

            // Update marker appearance
            marker.setOpacity(1);

            // Use bindPopup for persistence
            marker.bindPopup(`
                <b>${station.station_name || marker.stationData.station_name || "Unbekannte Station"}</b><br>
                Entfernung: ${(station.Distance / 1000).toFixed(2)} km
            `).openPopup();
        } else {
            marker.setOpacity(0);
            marker.closePopup(); // Close popups for other markers
        }
    });
}



function createOrUpdateRoute() {
    if (routeControl) {
        window.map.removeControl(routeControl);
    }

    const userPos = userMarker.getLatLng();
    const stationPos = L.latLng(nearestStation.Latitude, nearestStation.Longitude);

    routeControl = L.Routing.control({
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

    routeControl.on('routesfound', function(e) {
        console.log('Routen gefunden:', e.routes);
    });
    routeControl.on('routingerror', function(e) {
        console.log('Routing Fehler:', e.error);
    });
}

function recalculateRoute() {
    // Bei jeder Verschiebung des Markers wird die nächste Station neu gesucht
    const userPos = userMarker.getLatLng();
    nearestStation = findNearestStation(userPos.lat, userPos.lng);
    hideAllStationsExcept(nearestStation);
    createOrUpdateRoute();
}
