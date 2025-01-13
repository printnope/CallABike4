<?php
// Enable exceptions for mysqli
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Database connection details
$server = "localhost";
$user = "root";
$pass = "";
$db = "callabiketeam4";

// File paths
$stationsCsvPath = '../data/stations.csv';
$routesCsvPath = '../data/routes.csv';
$dbConnectionPath = '../setup/db-connection.php';

try {
    // Connect to the MySQL server without specifying a database
    $conn = new mysqli($server, $user, $pass);
    $conn->set_charset("utf8");

    // Create the database if it doesn't exist
    $conn->query("CREATE DATABASE IF NOT EXISTS `$db`");

    // Close the connection to the server
    $conn->close();

    // Connect to the newly created database
    $conn = include($dbConnectionPath);
    $conn->set_charset("utf8mb4");

    // Create 'stations' table
    $conn->query("
        CREATE TABLE IF NOT EXISTS stations (
            Station_ID INT PRIMARY KEY,
            Station_Name VARCHAR(255),
            Latitude DECIMAL(10,7),
            Longitude DECIMAL(10,7),
            Startvorgaenge INT,
            Endvorgaenge INT
        )
    ");

    // Create 'routes' table
    $conn->query("
        CREATE TABLE IF NOT EXISTS routes (
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
        )
    ");

    // Prepare statement for inserting/updating stations
    $stationStmt = $conn->prepare("
        INSERT INTO stations (Station_ID, Station_Name, Latitude, Longitude, Startvorgaenge, Endvorgaenge)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            Station_Name = VALUES(Station_Name),
            Latitude = VALUES(Latitude),
            Longitude = VALUES(Longitude),
            Startvorgaenge = VALUES(Startvorgaenge),
            Endvorgaenge = VALUES(Endvorgaenge)
    ");

    // Import data into 'stations' from CSV
    if (($handle = fopen($stationsCsvPath, 'r')) !== false) {
        $headers = fgetcsv($handle, 1000, ';');
        $headerMap = array_flip($headers);

        while (($data = fgetcsv($handle, 1000, ';')) !== false) {
            if (count($data) < 6) continue;

            $stationStmt->bind_param(
                'isddii',
                $data[$headerMap['Station-ID']],
                $data[$headerMap['Station-Name']],
                $data[$headerMap['Long']], // Swap Lat with Long
                $data[$headerMap['Lat']], // Swap Long with Lat
                $data[$headerMap['Startvorgänge']],
                $data[$headerMap['Endvorgänge']]
            );
            $stationStmt->execute();
        }
        fclose($handle);
    }

    // Prepare statement for inserting/updating routes
    $routeStmt = $conn->prepare("
        INSERT INTO routes (
            Buchungs_ID, Fahrrad_ID, Nutzer_ID, Buchung_Start, Buchung_Ende, Start_Station, Start_Station_ID, 
            Start_Latitude, Start_Longitude, Ende_Station, Ende_Station_ID, Ende_Latitude, Ende_Longitude, 
            Buchungsportal, Wochentag
        )
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
            Wochentag = VALUES(Wochentag)
    ");

    // Import data into 'routes' from CSV
    if (($handle = fopen($routesCsvPath, 'r')) !== false) {
        $headers = fgetcsv($handle, 1000, ';');
        $headerMap = array_flip($headers);

        while (($data = fgetcsv($handle, 10000, ';')) !== false) {
            if (count($data) < 15) continue;

            $routeStmt->bind_param(
                'iissssiddsiddss',
                $data[$headerMap['Buchungs-ID']],
                $data[$headerMap['Fahrrad-ID']],
                $data[$headerMap['Nutzer-ID']],
                date('Y-m-d H:i:s', strtotime($data[$headerMap['Buchung-Start']])),
                date('Y-m-d H:i:s', strtotime($data[$headerMap['Buchung-Ende']])),
                $data[$headerMap['Start-Station']],
                $data[$headerMap['Start-Station-ID']],
                $data[$headerMap['Start-Long']], // Swap Long with Lat
                $data[$headerMap['Start-Lat']], // Swap Lat with Long
                $data[$headerMap['Ende-Station']],
                $data[$headerMap['Ende-Station-ID']],
                $data[$headerMap['Ende-Long']], // Swap Long with Lat
                $data[$headerMap['Ende-Lat']], // Swap Lat with Long
                $data[$headerMap['Buchungsportal']],
                $data[$headerMap['Wochentag']]
            );
            $routeStmt->execute();
        }
        fclose($handle);
    }


    $stationStmt->close();
    $routeStmt->close();
    $conn->close();

    echo "Data successfully imported.";
} catch (mysqli_sql_exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
