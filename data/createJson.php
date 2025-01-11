<?php
// Aktivieren von Ausnahmen für mysqli
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    // Datenbankverbindung herstellen
    $conn = include("db-connection.php");
    $conn->set_charset("utf8");

    // Alle Stationen aus der Tabelle 'stations' abrufen
    $stations = [];
    $stationQuery = $conn->query("SELECT Station_ID, Station_Name, Latitude, Longitude, Startvorgaenge, Endvorgaenge FROM stations");

    while ($station = $stationQuery->fetch_assoc()) {
        $stationID = $station['Station_ID'];

        // Stoßzeit ermitteln
        $peakTimeStmt = $conn->prepare("
            SELECT HOUR(Buchung_Start) as Stunde, COUNT(*) as Anzahl
            FROM routes
            WHERE Start_Station_ID = ?
            GROUP BY Stunde
            ORDER BY Anzahl DESC
            LIMIT 1
        ");
        $peakTimeStmt->bind_param('i', $stationID);
        $peakTimeStmt->execute();
        $peakTimeResult = $peakTimeStmt->get_result()->fetch_assoc();
        $peakHour = isset($peakTimeResult['Stunde']) ? $peakTimeResult['Stunde'] . ":00" : null;
        $peakTimeStmt->close();

        // Beliebtester Wochentag ermitteln
        $weekdayStmt = $conn->prepare("
            SELECT Wochentag, COUNT(*) as Anzahl
            FROM routes
            WHERE Start_Station_ID = ?
            GROUP BY Wochentag
            ORDER BY Anzahl DESC
            LIMIT 1
        ");
        $weekdayStmt->bind_param('i', $stationID);
        $weekdayStmt->execute();
        $weekdayResult = $weekdayStmt->get_result()->fetch_assoc();
        $popularWeekday = isset($weekdayResult['Wochentag']) ? $weekdayResult['Wochentag'] : null;
        $weekdayStmt->close();

        // Beliebteste Endstationen ermitteln (Top 3)
        $popularDestStmt = $conn->prepare("
            SELECT Ende_Station_ID, COUNT(*) as Anzahl
            FROM routes
            WHERE Start_Station_ID = ?
            GROUP BY Ende_Station_ID
            ORDER BY Anzahl DESC
        ");
        $popularDestStmt->bind_param('i', $stationID);
        $popularDestStmt->execute();
        $popularDestResults = $popularDestStmt->get_result();
        $popularDestinations = [];
        while ($dest = $popularDestResults->fetch_assoc()) {
            $destID = $dest['Ende_Station_ID'];
            // Namen der Endstation abrufen
            $destNameStmt = $conn->prepare("SELECT Station_Name FROM stations WHERE Station_ID = ?");
            $destNameStmt->bind_param('i', $destID);
            $destNameStmt->execute();
            $destNameResult = $destNameStmt->get_result()->fetch_assoc();
            $destName = isset($destNameResult['Station_Name']) ? $destNameResult['Station_Name'] : null;
            $destNameStmt->close();

            if ($destName !== null) {
                $popularDestinations[] = $destName;
            }
        }
        $popularDestStmt->close();

        // Gesamtzahl der Fahrten
        $totalTrips = $station['Startvorgaenge'] + $station['Endvorgaenge'];

        // Anzahl der Start- und Endvorgänge pro Wochentag
        $weekdayTrips = [];
        $weekdayTripsStmt = $conn->prepare("
            SELECT Wochentag,
                SUM(CASE WHEN Start_Station_ID = ? THEN 1 ELSE 0 END) as Anzahl_Startvorgaenge,
                SUM(CASE WHEN Ende_Station_ID = ? THEN 1 ELSE 0 END) as Anzahl_Endvorgaenge
            FROM routes
            WHERE Start_Station_ID = ? OR Ende_Station_ID = ?
            GROUP BY Wochentag
        ");
        $weekdayTripsStmt->bind_param('iiii', $stationID, $stationID, $stationID, $stationID);
        $weekdayTripsStmt->execute();
        $weekdayTripsResult = $weekdayTripsStmt->get_result();
        while ($row = $weekdayTripsResult->fetch_assoc()) {
            $weekday = $row['Wochentag'];
            $weekdayTrips[$weekday] = [
                'Anzahl_Startvorgaenge' => (int)$row['Anzahl_Startvorgaenge'],
                'Anzahl_Endvorgaenge'   => (int)$row['Anzahl_Endvorgaenge']
            ];
        }
        $weekdayTripsStmt->close();

        // Anzahl der Start- und Endvorgänge pro Wochentag und Stunde
        $weekdayHourlyTrips = [];
        $weekdayHours = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        foreach ($weekdayHours as $day) {
            $weekdayHourlyTrips[$day] = [];
            for ($h = 0; $h < 24; $h++) {
                $weekdayHourlyTrips[$day][$h] = [
                    'Anzahl_Startvorgaenge' => 0,
                    'Anzahl_Endvorgaenge'   => 0
                ];
            }
        }

        // Startvorgänge pro Wochentag und Stunde
        $startTripsStmt = $conn->prepare("
            SELECT Wochentag, HOUR(Buchung_Start) as Stunde, COUNT(*) as Anzahl
            FROM routes
            WHERE Start_Station_ID = ?
            GROUP BY Wochentag, Stunde
        ");
        $startTripsStmt->bind_param('i', $stationID);
        $startTripsStmt->execute();
        $startTripsResult = $startTripsStmt->get_result();
        while ($row = $startTripsResult->fetch_assoc()) {
            $weekday = $row['Wochentag'];
            $hour = $row['Stunde'];
            $weekdayHourlyTrips[$weekday][$hour]['Anzahl_Startvorgaenge'] = (int)$row['Anzahl'];
        }
        $startTripsStmt->close();

        // Endvorgänge pro Wochentag und Stunde
        $endTripsStmt = $conn->prepare("
            SELECT Wochentag, HOUR(Buchung_Ende) as Stunde, COUNT(*) as Anzahl
            FROM routes
            WHERE Ende_Station_ID = ?
            GROUP BY Wochentag, Stunde
        ");
        $endTripsStmt->bind_param('i', $stationID);
        $endTripsStmt->execute();
        $endTripsResult = $endTripsStmt->get_result();
        while ($row = $endTripsResult->fetch_assoc()) {
            $weekday = $row['Wochentag'];
            $hour = $row['Stunde'];
            $weekdayHourlyTrips[$weekday][$hour]['Anzahl_Endvorgaenge'] = (int)$row['Anzahl'];
        }
        $endTripsStmt->close();

        // Buchungsportale pro Wochentag und Stunde erfassen
        $buchungsportaleHourly = [];
        $portale = ["iPhone CAB", "Android CAB", "IVR", "Windows", "iPhone SRH", "LIDL-BIKE", "Android SRH", "Techniker F_5 (-67212-)", "iPhone KON"];

        foreach ($weekdayHours as $day) {
            $buchungsportaleHourly[$day] = [];
            for ($h = 0; $h < 24; $h++) {
                $buchungsportaleHourly[$day][$h] = [];
                foreach ($portale as $portal) {
                    $buchungsportaleHourly[$day][$h][$portal] = [
                        'Anzahl_Startvorgaenge' => 0,
                        'Anzahl_Endvorgaenge'   => 0
                    ];
                }
            }
        }

        // Buchungen pro Wochentag, Stunde und Buchungsportal (Start)
        $startPortalStmt = $conn->prepare("
            SELECT Wochentag, HOUR(Buchung_Start) as Stunde, Buchungsportal, COUNT(*) as Anzahl
            FROM routes
            WHERE Start_Station_ID = ?
            GROUP BY Wochentag, Stunde, Buchungsportal
        ");
        $startPortalStmt->bind_param('i', $stationID);
        $startPortalStmt->execute();
        $startPortalResult = $startPortalStmt->get_result();
        while ($row = $startPortalResult->fetch_assoc()) {
            $weekday = $row['Wochentag'];
            $hour = $row['Stunde'];
            $portal = $row['Buchungsportal'];
            if (isset($buchungsportaleHourly[$weekday][$hour][$portal])) {
                $buchungsportaleHourly[$weekday][$hour][$portal]['Anzahl_Startvorgaenge'] = (int)$row['Anzahl'];
            }
        }
        $startPortalStmt->close();

        // Buchungen pro Wochentag, Stunde und Buchungsportal (Ende)
        $endPortalStmt = $conn->prepare("
            SELECT Wochentag, HOUR(Buchung_Ende) as Stunde, Buchungsportal, COUNT(*) as Anzahl
            FROM routes
            WHERE Ende_Station_ID = ?
            GROUP BY Wochentag, Stunde, Buchungsportal
        ");
        $endPortalStmt->bind_param('i', $stationID);
        $endPortalStmt->execute();
        $endPortalResult = $endPortalStmt->get_result();
        while ($row = $endPortalResult->fetch_assoc()) {
            $weekday = $row['Wochentag'];
            $hour = $row['Stunde'];
            $portal = $row['Buchungsportal'];
            if (isset($buchungsportaleHourly[$weekday][$hour][$portal])) {
                $buchungsportaleHourly[$weekday][$hour][$portal]['Anzahl_Endvorgaenge'] = (int)$row['Anzahl'];
            }
        }
        $endPortalStmt->close();

        // *** NEU: Buchungsportale sortiert ermitteln ***
        // Zunächst die Gesamtanzahl pro Portal summieren
        $portalCounts = [];
        foreach ($buchungsportaleHourly as $day => $hoursData) {
            foreach ($hoursData as $hour => $portalData) {
                foreach ($portalData as $portal => $counts) {
                    if (!isset($portalCounts[$portal])) {
                        $portalCounts[$portal] = 0;
                    }
                    $portalCounts[$portal] += $counts['Anzahl_Startvorgaenge'] + $counts['Anzahl_Endvorgaenge'];
                }
            }
        }

        // Nur verwendete Portale berücksichtigen (Portale mit mindestens 1 Buchung)
        $usedPortals = array_filter($portalCounts, function($count) {
            return $count > 0;
        });

        // In absteigender Reihenfolge sortieren
        arsort($usedPortals);

        // Portalnamen in der sortierten Reihenfolge extrahieren
        $buchungsportale_sortiert = array_keys($usedPortals);

        // Daten sammeln
        $stations[] = [
            'Station_ID'                            => $stationID,
            'station_name'                          => $station['Station_Name'],
            'Latitude'                              => (float)$station['Latitude'],
            'Longitude'                             => (float)$station['Longitude'],
            'Anzahl_Startvorgaenge'                 => (int)$station['Startvorgaenge'],
            'Anzahl_Endvorgaenge'                   => (int)$station['Endvorgaenge'],
            'Gesamtzahl_Fahrten'                    => $totalTrips,
            'Beliebteste_Endstationen_sortiert'     => $popularDestinations,
            'Anzahl_Fahrten_pro_Wochentag'          => $weekdayTrips,
            'Anzahl_Fahrten_pro_Wochentag_und_Stunde' => $weekdayHourlyTrips,
            'Buchungsportale_pro_Wochentag_und_Stunde' => $buchungsportaleHourly,
            'Buchungsportale_sortiert'              => $buchungsportale_sortiert, // Hier die neue Eigenschaft
            'Stosszeit'                             => $peakHour,
            'Beliebtester_Wochentag'                => $popularWeekday,
            'Beliebteste_Endstation'                => $popularDestinations[0]
        ];
    }

// Sort stations alphabetically by station_name
usort($stations, function($a, $b) {
    return strcmp($a['station_name'], $b['station_name']);
});

// JSON-Datei erstellen
$jsonData = json_encode($stations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

$filePath = __DIR__ . '/stations.json';
file_put_contents($filePath, $jsonData);
    echo 'Pfad zu stations.json: ' . realpath($filePath);


    // Verbindung schließen
    $conn->close();

    echo "Die JSON-Datei 'stations.json' wurde erfolgreich erstellt.";
} catch (mysqli_sql_exception $e) {
    echo "Ein Fehler ist aufgetreten: " . $e->getMessage();
}
?>
