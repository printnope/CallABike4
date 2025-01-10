<?php
// Aktivieren von Ausnahmen für mysqli
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Datenbank-Verbindungsinformationen
$server = "localhost";
$user   = "root";
$pass   = "";
$db     = "callabiketeam4";

try {
    // Verbindung ohne Datenbank herstellen
    $conn = new mysqli($server, $user, $pass);
    $conn->set_charset("utf8");

    // Datenbank erstellen, falls sie nicht existiert
    $conn->query("CREATE DATABASE IF NOT EXISTS `$db`");

    // Verbindung schließen
    $conn->close();

    // Jetzt die Verbindung zur neu erstellten Datenbank herstellen
    $conn = include("db-connection.php");

    // Setze den Zeichensatz
    $conn->set_charset("utf8mb4");

    $stationsCsvPath = "../data/stations.csv";
    $routesCsvPath = "../data/routes.csv";

    // Tabelle 'stations' erstellen
    $sql = "CREATE TABLE IF NOT EXISTS stations (
        Station_ID INT PRIMARY KEY,
        Station_Name VARCHAR(255),
        Latitude DECIMAL(10,7),
        Longitude DECIMAL(10,7),
        Startvorgaenge INT,
        Endvorgaenge INT
    )";
    $conn->query($sql);

    // Tabelle 'routes' erstellen
    $sql = "CREATE TABLE IF NOT EXISTS routes (
        Buchungs_ID BIGINT PRIMARY KEY,
        Fahrrad_ID INT,
        Nutzer_ID VARCHAR(255),
        Buchung_Start DATETIME,
        Buchung_Ende DATETIME,
        Start_Station VARCHAR(255),
        Start_Station_ID INT,
        Start_Latitude DECIMAL(10,7),
        Start_Longitude DECIMAL(10,7),
        Ende_Station VARCHAR(255),
        Ende_Station_ID INT,
        Ende_Latitude DECIMAL(10,7),
        Ende_Longitude DECIMAL(10,7),
        Buchungsportal VARCHAR(255),
        Wochentag VARCHAR(10)
    )";
    $conn->query($sql);

    // Prepared Statement für 'stations' vorbereiten
    $stationStmt = $conn->prepare("INSERT INTO stations (Station_ID, Station_Name, Latitude, Longitude, Startvorgaenge, Endvorgaenge)
                                   VALUES (?, ?, ?, ?, ?, ?)
                                   ON DUPLICATE KEY UPDATE
                                   Station_Name = VALUES(Station_Name),
                                   Latitude = VALUES(Latitude),
                                   Longitude = VALUES(Longitude),
                                   Startvorgaenge = VALUES(Startvorgaenge),
                                   Endvorgaenge = VALUES(Endvorgaenge)");

    // Daten aus 'stations.csv' einlesen und einfügen
    if (($handle = fopen($stationsCsvPath, 'r')) !== FALSE) {
        // Header einlesen und Spaltenindizes bestimmen
        $headers = fgetcsv($handle, 1000, ';');
        $headerMap = array_flip($headers); // Mapping von Spaltenname zu Index

        while (($data = fgetcsv($handle, 1000, ';')) !== FALSE) {
            if (count($data) < 6) continue; // Überspringe unvollständige Zeilen

            $Station_ID = $data[$headerMap['Station-ID']];
            $Station_Name = $data[$headerMap['Station-Name']];

            // Hier die Werte für Latitude und Longitude tauschen
            $Longitude = $data[$headerMap['Lat']]; // 'Lat' enthält Longitudewert
            $Latitude = $data[$headerMap['Long']]; // 'Long' enthält Latitudewert

            $Startvorgaenge = $data[$headerMap['Startvorgänge']];
            $Endvorgaenge = $data[$headerMap['Endvorgänge']];

            // Parameter binden und ausführen
            $stationStmt->bind_param('isddii', $Station_ID, $Station_Name, $Latitude, $Longitude, $Startvorgaenge, $Endvorgaenge);
            $stationStmt->execute();
        }
        fclose($handle);
    }

    // Prepared Statement für 'routes' vorbereiten
    $routeStmt = $conn->prepare("INSERT INTO routes (Buchungs_ID, Fahrrad_ID, Nutzer_ID, Buchung_Start, Buchung_Ende, Start_Station, Start_Station_ID, Start_Latitude, Start_Longitude, Ende_Station, Ende_Station_ID, Ende_Latitude, Ende_Longitude, Buchungsportal, Wochentag)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                 ON DUPLICATE KEY UPDATE
                                 Fahrrad_ID = VALUES(Fahrrad_ID),
                                 Nutzer_ID = VALUES(Nutzer_ID),
                                 Buchung_Start = VALUES(Buchung_Start),
                                 Buchung_Ende = VALUES(Buchung_Ende),
                                 Start_Station = VALUES(Start_Station),
                                 Start_Station_ID = VALUES(Start_Station_ID),
                                 Start_Latitude = VALUES(Start_Latitude),
                                 Start_Longitude = VALUES(Start_Longitude),
                                 Ende_Station = VALUES(Ende_Station),
                                 Ende_Station_ID = VALUES(Ende_Station_ID),
                                 Ende_Latitude = VALUES(Ende_Latitude),
                                 Ende_Longitude = VALUES(Ende_Longitude),
                                 Buchungsportal = VALUES(Buchungsportal),
                                 Wochentag = VALUES(Wochentag)");

    // Daten aus 'routes.csv' einlesen und einfügen
    if (($handle = fopen($routesCsvPath, 'r')) !== FALSE) {
        // Header einlesen und Spaltenindizes bestimmen
        $headers = fgetcsv($handle, 1000, ';');
        $headerMap = array_flip($headers);

        while (($data = fgetcsv($handle, 10000, ';')) !== FALSE) {
            if (count($data) < 15) continue; // Überspringe unvollständige Zeilen

            $Buchungs_ID = $data[$headerMap['Buchungs-ID']];
            $Fahrrad_ID = $data[$headerMap['Fahrrad-ID']];
            $Nutzer_ID = $data[$headerMap['Nutzer-ID']];
            $Buchung_Start = date('Y-m-d H:i:s', strtotime($data[$headerMap['Buchung-Start']]));
            $Buchung_Ende = date('Y-m-d H:i:s', strtotime($data[$headerMap['Buchung-Ende']]));
            $Start_Station = $data[$headerMap['Start-Station']];
            $Start_Station_ID = $data[$headerMap['Start-Station-ID']];

            // Hier die Start-Koordinaten tauschen
            $Start_Longitude = $data[$headerMap['Start-Lat']]; // 'Start-Lat' enthält Longitudewert
            $Start_Latitude = $data[$headerMap['Start-Long']]; // 'Start-Long' enthält Latitudewert

            $Ende_Station = $data[$headerMap['Ende-Station']];
            $Ende_Station_ID = $data[$headerMap['Ende-Station-ID']];

            // Hier die End-Koordinaten tauschen
            $Ende_Longitude = $data[$headerMap['Ende-Lat']]; // 'Ende-Lat' enthält Longitudewert
            $Ende_Latitude = $data[$headerMap['Ende-Long']]; // 'Ende-Long' enthält Latitudewert

            $Buchungsportal = $data[$headerMap['Buchungsportal']];
            $Wochentag = $data[$headerMap['Wochentag']];

            // Parameter binden und ausführen
            $routeStmt->bind_param('iissssiddsiddss', $Buchungs_ID, $Fahrrad_ID, $Nutzer_ID, $Buchung_Start, $Buchung_Ende, $Start_Station, $Start_Station_ID, $Start_Latitude, $Start_Longitude, $Ende_Station, $Ende_Station_ID, $Ende_Latitude, $Ende_Longitude, $Buchungsportal, $Wochentag);
            $routeStmt->execute();
        }
        fclose($handle);
    }

    // Statements schließen und Verbindung beenden
    $stationStmt->close();
    $routeStmt->close();
    $conn->close();

    echo "Daten wurden erfolgreich importiert.";
} catch (mysqli_sql_exception $e) {
    echo "Fatal Error: " . $e->getMessage();
}
?>
