<?php
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
    <!-- Leaflet Control Geocoder CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css" />

    <!-- Highcharts (für Charts) wird per JS eingebunden -->

    <link rel="stylesheet" href="../css/map.css">
</head>
<body>

<div id="map">
    <div class="legend">
        <h4>Legende</h4>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png');"></i> Entspricht dem Schwellenwert<br>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png');"></i> Liegt über dem Schwellenwert<br>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png');"></i> Liegt unter dem Schwellenwert<br>
    </div>
</div>

<div class="button-group">
    <button onclick="showFilterForm()">Filter Gesamtzahlen</button>
    <button onclick="resetMarkers()">Reset</button>
    <button onclick="visualizeWorkloadInTotal()">Visualize Workload</button>
    <button onclick="showSearchStation()">Search for Station</button>
    <button onclick="startRoutingFromCurrentPosition()">Routing from current position</button>
    <button onclick="showAddressSearch()">Routing from address</button>
    <button onclick="showFlowLinesForm()">Show Flow Lines</button>
    <button onclick="toggleChartsDisplay()">Show Charts</button>
</div>

<!-- Stationssuche -->
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

<!-- Filter Gesamtzahlen -->
<div id="filterForWorkload" style="display: none;">
    <form id="filterForm">
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

        <fieldset>
            <legend>Buchungstyp auswählen</legend>
            <div class="radio-group">
                <label><input type="radio" name="buchungstyp" value="abholung" required> Abholung</label>
                <label><input type="radio" name="buchungstyp" value="abgabe"> Abgabe</label>
                <label><input type="radio" name="buchungstyp" value="beides"> Beides</label>
            </div>
        </fieldset>

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

        <fieldset>
            <legend>Schwellenwert festlegen</legend>
            <div class="threshold-group">
                <label for="threshold">Schwellenwert:</label>
                <input type="number" id="threshold" name="threshold" min="0" value="100" required>
                <small>Dieser Schwellenwert wird für Startvorgänge, Endvorgaenge und Differenz verwendet.</small>
            </div>
        </fieldset>

        <button type="submit" class="submit-btn">Filter anwenden</button>
    </form>
</div>

<!-- Flow Lines Formular -->
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

<!-- Adress-Suche (Routing von Adresse) -->
<div id="addressSearchDiv" style="display:none; margin-top:10px;">
    <input type="text" id="addressInput" placeholder="Adresse eingeben..." style="width:200px;">
    <button onclick="searchAddressForRouting()">Adresse suchen</button>
</div>

<!-- Charts Container mit Titel, Form links und Diagrammen rechts -->
<div id="chartsContainer" style="display:none;">
    <h2>Charts</h2>
    <div id="chartsInner">
        <div id="chartFilterFormContainer">
            <form id="chartFilterForm" style="margin-bottom:20px;">
                <fieldset>
                    <legend>Zeitraum-Modus</legend>
                    <label><input type="radio" name="zeitraumModus" value="stunden" checked> Stundenweise Darstellung</label>
                    <label><input type="radio" name="zeitraumModus" value="tage"> Tagesweise Darstellung</label>
                </fieldset>

                <fieldset>
                    <legend>Wochentage auswählen</legend>
                    <div class="checkbox-group">
                        <label><input type="checkbox" name="wochentage" value="alle" checked> Alle</label>
                        <label><input type="checkbox" name="wochentage" value="montag"> Montag</label>
                        <label><input type="checkbox" name="wochentage" value="dienstag"> Dienstag</label>
                        <label><input type="checkbox" name="wochentage" value="mittwoch"> Mittwoch</label>
                        <label><input type="checkbox" name="wochentage" value="donnerstag"> Donnerstag</label>
                        <label><input type="checkbox" name="wochentage" value="freitag"> Freitag</label>
                        <label><input type="checkbox" name="wochentage" value="samstag"> Samstag</label>
                        <label><input type="checkbox" name="wochentage" value="sonntag"> Sonntag</label>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>Uhrzeiten auswählen</legend>
                    <label for="chartVon">Von:</label>
                    <select name="chartVon" id="chartVon" required>
                        <?php for($h=0;$h<24;$h++): $hour=sprintf("%02d:00",$h); ?>
                            <option value="<?php echo $hour; ?>" <?php echo $h===0?'selected':''; ?>><?php echo $hour; ?></option>
                        <?php endfor; ?>
                    </select>

                    <label for="chartBis">Bis:</label>
                    <select name="chartBis" id="chartBis" required>
                        <?php for($h=0;$h<24;$h++): $hour=sprintf("%02d:00",$h); ?>
                            <option value="<?php echo $hour; ?>" <?php echo $h===23?'selected':''; ?>><?php echo $hour; ?></option>
                        <?php endfor; ?>
                    </select>
                </fieldset>

                <fieldset>
                    <legend>Buchungstyp auswählen</legend>
                    <div class="radio-group">
                        <label><input type="radio" name="chartBuchungstyp" value="abholung"> Abholung</label>
                        <label><input type="radio" name="chartBuchungstyp" value="abgabe"> Abgabe</label>
                        <label><input type="radio" name="chartBuchungstyp" value="beides" checked> Beides</label>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>Buchungsportale auswählen</legend>
                    <div class="checkbox-group">
                        <label><input type="checkbox" name="chartBuchungsportale" value="iPhone CAB"> iPhone CAB</label>
                        <label><input type="checkbox" name="chartBuchungsportale" value="Android CAB"> Android CAB</label>
                        <label><input type="checkbox" name="chartBuchungsportale" value="IVR"> IVR</label>
                        <label><input type="checkbox" name="chartBuchungsportale" value="Windows"> Windows</label>
                        <label><input type="checkbox" name="chartBuchungsportale" value="iPhone SRH"> iPhone SRH</label>
                        <label><input type="checkbox" name="chartBuchungsportale" value="LIDL-BIKE"> LIDL-BIKE</label>
                        <label><input type="checkbox" name="chartBuchungsportale" value="Android SRH"> Android SRH</label>
                        <label><input type="checkbox" name="chartBuchungsportale" value="Techniker F_5 (-67212-)"> Techniker F_5 (-67212-)</label>
                        <label><input type="checkbox" name="chartBuchungsportale" value="iPhone KON"> iPhone KON</label>
                    </div>
                </fieldset>

                <button type="submit">Diagramme aktualisieren</button>
            </form>

            <!-- Station für Markierung im Graphen auswählen -->
            <div style="margin-bottom:10px;">
                <label for="stationForChart">Station für Markierung im Graphen auswählen:</label>
                <select id="stationForChart">
                    <option value="">-- Bitte wählen --</option>
                </select>
                <button onclick="highlightStationOnChart()">Station hervorheben</button>
            </div>
        </div>

        <div id="diagramsContainer">
            <div id="pieChartContainer"></div>
            <div id="lineChartContainer"></div>
        </div>
    </div>
</div>

<!-- Skripte -->
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js"></script>
<script src="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"></script>
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="../includes/initMap.js"></script>
<script src="../includes/workLoadFunctions.js"></script>
<script src="../includes/stationsSelector.js"></script>
<script src="../includes/routingFromCurrentPosition.js"></script>
<script src="../includes/adressSearchRouting.js"></script>
<script src="../includes/flowLinesFunctions.js"></script>
<script src="../includes/chartFunctions.js"></script>
<script>
    function showFilterForm() {
        resetMarkers();
        toggleDisplay('filterForWorkload', true);
        toggleDisplay('searchForStationDiv', false);
        toggleDisplay('addressSearchDiv', false);
        toggleDisplay('filterForFlowLines', false);
        document.getElementById('chartsContainer').style.display = 'none';
    }

    function showSearchStation() {
        resetMarkers();
        toggleDisplay('filterForWorkload', false);
        toggleDisplay('searchForStationDiv', true);
        toggleDisplay('addressSearchDiv', false);
        toggleDisplay('filterForFlowLines', false);
        document.getElementById('chartsContainer').style.display = 'none';

        // Stationsauswahl nur einmal initialisieren
        if (!window.searchUIInitialized && window.markerArray && window.markerArray.length > 0) {
            initializeStationSelectionUI(window.markerArray);
            window.searchUIInitialized = true;
        }
    }

    function showAddressSearch() {
        resetMarkers();
        toggleDisplay('filterForWorkload', false);
        toggleDisplay('searchForStationDiv', false);
        toggleDisplay('addressSearchDiv', true);
        toggleDisplay('filterForFlowLines', false);
        document.getElementById('chartsContainer').style.display = 'none';
    }

    function showFlowLinesForm() {
        resetMarkers();
        populateStationsSelectFlowLines();
        toggleDisplay('filterForWorkload', false);
        toggleDisplay('searchForStationDiv', false);
        toggleDisplay('addressSearchDiv', false);
        toggleDisplay('filterForFlowLines', true);
        document.getElementById('chartsContainer').style.display = 'none';
    }

    function toggleDisplay(id, show) {
        const elem = document.getElementById(id);
        if (!elem) return;
        elem.style.display = show ? 'block' : 'none';
    }

    function toggleChartsDisplay(){
        const container = document.getElementById('chartsContainer');
        container.style.display = (container.style.display === 'none' || container.style.display==='') ? 'block' : 'none';

        // Wenn Charts angezeigt werden, Stationen in dropdown stationForChart füllen:
        if (container.style.display === 'block' && window.stationsData) {
            populateStationSelectForChart(window.stationsData);
        }
    }
</script>

<?php
include "../includes/footer.php";
?>

</body>
</html>
