<?php
// map.php
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Call A Bike Team 4</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css">
    <!-- Leaflet Routing Machine CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css" />
    <link rel="stylesheet" href="../css/map.css">
</head>
<body>

<!-- Karte mit eingebetteter Legende -->
<div id="map">
    <div class="legend">
        <h4>Legende</h4>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png');"></i> Entspricht dem Schwellenwert<br>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png');"></i> Liegt über dem Schwellenwert<br>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png');"></i> Liegt unter dem Schwellenwert<br>
    </div>
</div>

<!-- Buttons für zusätzliche Funktionen -->
<div class="button-group">
    <button onclick="showFilterForm()">Filter Gesamtzahlen</button>
    <button onclick="resetMarkers()">Reset</button>
    <button onclick="visualizeWorkloadInTotal()">Visualize Workload</button>
    <button onclick="showSearchStation()">Search for Station</button>
    <button onclick="startRoutingFromCurrentPosition()">Routing from current position</button>
    <button onclick="showAddressSearch()">Routing from address</button>
    <!-- Button für Flow Lines -->
    <button onclick="showFlowLinesForm()">Show Flow Lines</button>
</div>

<!-- Div für die Stationssuche -->
<div id="searchForStationDiv" style="display: none;">
    <table id="stationDataTable" border="1" cellpadding="5" style="margin-top:10px;">
        <thead>
        <tr>
            <th>Key</th>
            <th>Value</th>
        </tr>
        </thead>
        <tbody>
        <tr><td>Station_ID</td><td id="Station_ID"></td></tr>
        <tr><td>station_name</td><td id="station_name"></td></tr>
        <tr><td>Latitude</td><td id="Latitude"></td></tr>
        <tr><td>Longitude</td><td id="Longitude"></td></tr>
        <tr><td>Anzahl Startvorgaenge</td><td id="Anzahl_Startvorgaenge"></td></tr>
        <tr><td>Anzahl Endvorgaenge</td><td id="Anzahl_Endvorgaenge"></td></tr>
        <tr><td>Buchungsportale sortiert nach beliebtheit</td><td id="Buchungsportale_sortiert"></td></tr>
        <tr><td>Stosszeit</td><td id="Stosszeit"></td></tr>
        <tr><td>Beliebtester_Wochentag</td><td id="Beliebtester_Wochentag"></td></tr>
        <tr><td>Beliebteste_Endstation</td><td id="Beliebteste_Endstation"></td></tr>
        <tr><td>Gesamtzahl_Fahrten</td><td id="Gesamtzahl_Fahrten"></td></tr>
        <tr><td>Beliebteste_Endstationen_sortiert</td><td id="Beliebteste_Endstationen_sortiert"></td></tr>
        <tr><td>Anzahl_Fahrten_pro_Wochentag</td><td id="Anzahl_Fahrten_pro_Wochentag"></td></tr>
        <tr><td>Anzahl_Fahrten_pro_Wochentag_und_Stunde</td><td id="Anzahl_Fahrten_pro_Wochentag_und_Stunde"></td></tr>
        <tr><td>Buchungsportale_pro_Wochentag_und_Stunde</td><td id="Buchungsportale_pro_Wochentag_und_Stunde"></td></tr>
        </tbody>
    </table>
</div>

<!-- Formular für Workload-Filter -->
<div id="filterForWorkload" style="display: none;">
    <form id="filterForm">
        <!-- Wochentage Auswahl -->
        <fieldset>
            <legend>Wochentage auswählen</legend>
            <div class="checkbox-group">
                <label><input type="checkbox" name="wochentage" value="alle" id="alle"> Alle</label>
                <label><input type="checkbox" name="wochentage" value="montag"> Montag</label>
                <label><input type="checkbox" name="wochentage" value="dienstag"> Dienstag</label>
                <label><input type="checkbox" name="wochentage" value="mittwoch"> Mittwoch</label>
                <label><input type="checkbox" name="wochentage" value="donnerstag"> Donnerstag</label>
                <label><input type="checkbox" name="wochentage" value="freitag"> Freitag</label>
                <label><input type="checkbox" name="wochentage" value="samstag"> Samstag</label>
                <label><input type="checkbox" name="wochentage" value="sonntag"> Sonntag</label>
            </div>
        </fieldset>

        <!-- Uhrzeiten Auswahl -->
        <fieldset>
            <legend>Uhrzeiten auswählen</legend>
            <div class="time-select">
                <label for="von">Von:</label>
                <select name="von" id="von" required>
                    <option value="" selected>-- Uhrzeit wählen --</option>
                    <?php for($h=0;$h<24;$h++): $hour=sprintf("%02d:00",$h); ?>
                        <option value="<?php echo $hour; ?>"><?php echo $hour; ?></option>
                    <?php endfor; ?>
                </select>

                <label for="bis">Bis:</label>
                <select name="bis" id="bis" required>
                    <option value="" selected>-- Uhrzeit wählen --</option>
                    <?php for($h=0;$h<24;$h++): $hour=sprintf("%02d:00",$h); ?>
                        <option value="<?php echo $hour; ?>"><?php echo $hour; ?></option>
                    <?php endfor; ?>
                </select>
            </div>
        </fieldset>

        <!-- Buchungen nach Abholung oder Abgabe -->
        <fieldset>
            <legend>Buchungstyp auswählen</legend>
            <div class="radio-group">
                <label><input type="radio" name="buchungstyp" value="abholung" required> Abholung</label>
                <label><input type="radio" name="buchungstyp" value="abgabe"> Abgabe</label>
                <label><input type="radio" name="buchungstyp" value="beides"> Beides</label>
            </div>
        </fieldset>

        <!-- Buchungsportale Auswahl -->
        <fieldset>
            <legend>Buchungsportale auswählen</legend>
            <div class="checkbox-group">
                <label><input type="checkbox" name="buchungsportale" value="iPhone CAB"> iPhone CAB</label>
                <label><input type="checkbox" name="buchungsportale" value="Android CAB"> Android CAB</label>
                <label><input type="checkbox" name="buchungsportale" value="IVR"> IVR</label>
                <label><input type="checkbox" name="buchungsportale" value="Windows"> Windows</label>
                <label><input type="checkbox" name="buchungsportale" value="iPhone SRH"> iPhone SRH</label>
                <label><input type="checkbox" name="buchungsportale" value="LIDL-BIKE"> LIDL-BIKE</label>
                <label><input type="checkbox" name="buchungsportale" value="Android SRH"> Android SRH</label>
                <label><input type="checkbox" name="buchungsportale" value="Techniker F_5 (-67212-)"> Techniker F_5 (-67212-)</label>
                <label><input type="checkbox" name="buchungsportale" value="iPhone KON"> iPhone KON</label>
            </div>
        </fieldset>

        <!-- Referenzwert Eingabe -->
        <fieldset>
            <legend>Schwellenwert festlegen</legend>
            <div class="threshold-group">
                <label for="threshold">Schwellenwert:</label>
                <input type="number" id="threshold" name="threshold" min="0" value="100" required>
                <small>Dieser Schwellenwert wird für Startvorgänge, Endvorgaenge und Differenz verwendet.</small>
            </div>
        </fieldset>

        <!-- Absenden Button -->
        <button type="submit" class="submit-btn">Filter anwenden</button>
    </form>
</div>

<!-- Formular für Flow Lines Filter -->
<div id="filterForFlowLines" style="display: none; margin-top:10px;">
    <form id="flowLinesForm">
        <fieldset>
            <legend>Stationen auswählen</legend>
            <p>Wählen Sie eine oder mehrere Startstationen aus.</p>
            <select id="selectedStations" name="selectedStations" multiple style="width:200px;"></select>
        </fieldset>
        <fieldset>
            <legend>Anzahl Top-Endstationen</legend>
            <p>Wie viele der beliebtesten Endstationen sollen angezeigt werden? (z. B. Top 5)</p>
            <input type="number" id="topN" name="topN" value="5" min="1" style="width:60px;">
        </fieldset>
        <button type="submit">Linien anzeigen</button>
    </form>
</div>

<!-- NEUES DIV für die Adress-Suche -->
<div id="addressSearchDiv" style="display:none; margin-top:10px;">
    <input type="text" id="addressInput" placeholder="Adresse eingeben..." style="width:200px;">
    <button onclick="searchAddressForRouting()">Adresse suchen</button>
</div>

<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js"></script>
<script src="../includes/initMap.js"></script>
<script src="../includes/workLoadFunctions.js"></script>
<script src="../includes/stationsSelector.js"></script>
<script src="../includes/routingFromCurrentPosition.js"></script>
<script src="../includes/adressSearchRouting.js"></script>
<script src="../includes/flowLinesFunctions.js"></script>
<script>
    function showFilterForm() {
        resetMarkers();
        toggleDisplay('filterForWorkload', true);
        toggleDisplay('searchForStationDiv', false);
        toggleDisplay('addressSearchDiv', false);
        toggleDisplay('filterForFlowLines', false);
    }

    function showSearchStation() {
        resetMarkers();
        toggleDisplay('filterForWorkload', false);
        toggleDisplay('searchForStationDiv', true);
        toggleDisplay('addressSearchDiv', false);
        toggleDisplay('filterForFlowLines', false);
    }

    function showAddressSearch() {
        resetMarkers();
        toggleDisplay('filterForWorkload', false);
        toggleDisplay('searchForStationDiv', false);
        toggleDisplay('addressSearchDiv', true);
        toggleDisplay('filterForFlowLines', false);
    }

    function showFlowLinesForm() {
        resetMarkers();
        populateStationsSelect();
        toggleDisplay('filterForWorkload', false);
        toggleDisplay('searchForStationDiv', false);
        toggleDisplay('addressSearchDiv', false);
        toggleDisplay('filterForFlowLines', true);
    }

    function toggleDisplay(id, show) {
        const elem = document.getElementById(id);
        if (!elem) return;
        elem.style.display = show ? 'block' : 'none';
    }

</script>

<?php
include "../includes/footer.php";
?>

</body>
</html>
