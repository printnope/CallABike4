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
<div id="header-div">
    <img src="../includes/images/dblogo.png" alt="DB-Logo">
    <h1 id="headline">Call A Bike</h1>
</div>

<div id="map">
    <div class="legend" id="starts-ends-legend" style="display: none;">
        <h4>Legende: Aktivitätsanalyse </h4>
        <p id="threshold-display-starts-ends"></p>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png');"></i> Stationen liegen über dem Schwellenwert<br>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png');"></i> Stationen liegen auf dem Schwellenwert<br>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png');"></i> Stationen liegen unter dem Schwellenwert<br>
    </div>
    <div class="legend" id="difference-legend" style="display: none;">
        <h4>Legende: Ungleichgewichts-Analyse</h4>
        <p id="threshold-display-difference"></p>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png');"></i> Ungleichgewicht liegt über dem Schwellenwert<br>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png');"></i> Ungleichgewicht liegt über der Hälfte des Schwellenwerts<br>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png');"></i> Ungleichgewicht liegt unter der Hälfte des Schwellenwerts<br>

    </div>
</div>


<div class="button-group">
    <div id = "visualize-map-container">
        <button onclick="showFilterForm()"> Filtern aller Stationen </button>
        <button onclick="showFlowLinesForm()">Beliebteste Verbindungen</button>
    </div>
    <div id = "routing-container">
        <button onclick="startRoutingFromCurrentPosition()">Route von aktueller Position</button>
        <button onclick="showAddressSearch()">Route von beliebiger Adresse</button>
    </div>
    <div id = "analyze-container">
        <button onclick="showSearchStation()">Details zu einer Station</button>
        <button onclick="toggleChartsDisplay()">Diagramme</button>
    </div>
    <button onclick="resetMarkers()">Karte zurücksetzen</button>
</div>

<!-- Stationssuche -->
<div id="searchForStationDiv" style="display: none;">
    <table id="stationDataTable" border="1" cellpadding="5" style="margin-top:10px;">

        <tbody>
        <tr><td>Stations-ID</td><td id="Station_ID"></td></tr>
        <tr><td>Haltestellenname</td><td id="station_name"></td></tr>
        <tr><td>Latitude</td><td id="Latitude"></td></tr>
        <tr><td>Longitude</td><td id="Longitude"></td></tr>
        <tr><td>Anzahl Startvorgaenge</td><td id="Anzahl_Startvorgaenge"></td></tr>
        <tr><td>Anzahl Endvorgaenge</td><td id="Anzahl_Endvorgaenge"></td></tr>
        <tr><td>Beliebteste Buchungsportale</td><td id="Buchungsportale_sortiert"></td></tr>
        <tr><td>Hauptverkehrszeit</td><td id="Stosszeit"></td></tr>
        <tr><td>Beliebtester Wochentag</td><td id="Beliebtester_Wochentag"></td></tr>
        <tr><td>Beliebtestes Ziel</td><td id="Beliebteste_Endstation"></td></tr>
        <tr><td>Gesamtanzahl Fahrten</td><td id="Gesamtzahl_Fahrten"></td></tr>
        <tr><td>Beliebteste Ziele</td><td id="Beliebteste_Endstationen_sortiert"></td></tr>
        </tbody>
    </table>
</div>

<!-- Filter Gesamtzahlen -->
<div id="filterForWorkload" style="display: none;">
    <form id="filterForm">
    <fieldset>
    <legend>Wochentage auswählen</legend>
    <div class="checkbox-group"> 
        <label><input type="checkbox" name="wochentage" value="montag" checked> Montag</label>
        <label><input type="checkbox" name="wochentage" value="dienstag" checked> Dienstag</label>
        <label><input type="checkbox" name="wochentage" value="mittwoch" checked> Mittwoch</label>
        <label><input type="checkbox" name="wochentage" value="donnerstag" checked> Donnerstag</label>
        <label><input type="checkbox" name="wochentage" value="freitag" checked> Freitag</label>
        <label><input type="checkbox" name="wochentage" value="samstag" checked> Samstag</label>
        <label><input type="checkbox" name="wochentage" value="sonntag" checked> Sonntag</label>
     </div>
     <button type="button" id="selectAllWeekdaysButton">Alle auswählen</button>
    </fieldset>


        <fieldset>
            <legend>Uhrzeiten auswählen</legend>
            <div class="time-select">
                <label for="von">Von:</label>
                <select name="von" id="von" required>
                    <?php for($h=0;$h<24;$h++): $hour=sprintf("%02d:00",$h); ?>
                        <option value="<?php echo $hour; ?>"><?php echo $hour; ?></option>
                    <?php endfor; ?>
                </select>

                <label for="bis">Bis:</label>
                <select name="bis" id="bis" required>
                    <?php for($h=0;$h<24;$h++): $hour=sprintf("%02d:59",$h); ?>
                        <option value="<?php echo $hour; ?>" <?php if ($h === 23){echo "selected";} ?>>
                            <?php echo $hour; ?>
                        </option>
                    <?php endfor; ?>
                </select>
            </div>
        </fieldset>

        <fieldset>
            <legend>Buchungstyp auswählen</legend>
            <div class="radio-group">
                <label><input type="radio" name="buchungstyp" value="abholung" required> Abholung</label>
                <label><input type="radio" name="buchungstyp" value="abgabe"> Abgabe</label>
                <label><input type="radio" name="buchungstyp" value="beides" checked> Beides</label>
            </div>
        </fieldset>

        <fieldset>
        <legend>Buchungsportale auswählen</legend>
        <div class="checkbox-group">
        <label><input type="checkbox" name="buchungsportale" value="iPhone CAB" checked> iPhone CAB</label>
        <label><input type="checkbox" name="buchungsportale" value="Android CAB" checked> Android CAB</label>
        <label><input type="checkbox" name="buchungsportale" value="IVR" checked> IVR</label>
        <label><input type="checkbox" name="buchungsportale" value="Windows" checked> Windows</label>
        <label><input type="checkbox" name="buchungsportale" value="iPhone SRH" checked> iPhone SRH</label>
        <label><input type="checkbox" name="buchungsportale" value="LIDL-BIKE" checked> LIDL-BIKE</label>
        <label><input type="checkbox" name="buchungsportale" value="Android SRH" checked> Android SRH</label>
        <label><input type="checkbox" name="buchungsportale" value="Techniker F_5 (-67212-)" checked> Techniker F_5 (-67212-)</label>
        <label><input type="checkbox" name="buchungsportale" value="iPhone KON" checked> iPhone KON</label>
        </div>
        <button type="button" id="selectAllPortalsButton">Alle auswählen</button> <!-- Added toggle button -->
        </fieldset>


        <fieldset>
            <legend>Schwellenwert festlegen</legend>
            <div class="threshold-group">
                <label for="threshold">Schwellenwert:</label>
                <input type="number" id="threshold" name="threshold" value="0" required>
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
        <button class="submit-btn" type="submit">Linien anzeigen</button>
    </form>
</div>

<!-- Adress-Suche (Routing von Adresse) -->
<div id="addressSearchDiv" style="display:none; margin-top:10px;">
    <input type="text" id="addressInput" placeholder="Adresse eingeben..." style="width:200px;">
    <button class="submit-btn" onclick="searchAddressForRouting()">Adresse suchen</button>
</div>

<!-- Charts Container mit Titel, Form links und Diagrammen rechts -->
<div id="chartsContainer" style="display:none;">
    <h2>Charts</h2>
    <div id="chartsInner">
        <div id="chartFilterFormContainer">
            <form id="chartFilterForm" style="margin-bottom:20px;">
            <button class="submit-btn" type="submit">Diagramme aktualisieren</button>

                <fieldset>
                    <legend>Zeitraum-Modus</legend>
                    <label><input type="radio" name="zeitraumModus" value="stunden" checked> Stundenweise Darstellung</label>
                    <label><input type="radio" name="zeitraumModus" value="tage"> Tagesweise Darstellung</label>
                </fieldset>

                <fieldset>
    <legend>Wochentage auswählen</legend>
    <div class="checkbox-group"> 
        <label><input type="checkbox" name="wochentage" value="montag" checked> Montag</label>
        <label><input type="checkbox" name="wochentage" value="dienstag" checked> Dienstag</label>
        <label><input type="checkbox" name="wochentage" value="mittwoch" checked> Mittwoch</label>
        <label><input type="checkbox" name="wochentage" value="donnerstag" checked> Donnerstag</label>
        <label><input type="checkbox" name="wochentage" value="freitag" checked> Freitag</label>
        <label><input type="checkbox" name="wochentage" value="samstag" checked> Samstag</label>
        <label><input type="checkbox" name="wochentage" value="sonntag" checked> Sonntag</label>
     </div>
     <button type="button" id="chartSelectAllWeekdaysButton">Alle auswählen</button>
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
                        <?php for($h=0;$h<24;$h++): $hour=sprintf("%02d:59",$h); ?>
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
        <label><input type="checkbox" name="chartBuchungsportale" value="iPhone CAB" checked> iPhone CAB</label>
        <label><input type="checkbox" name="chartBuchungsportale" value="Android CAB" checked> Android CAB</label>
        <label><input type="checkbox" name="chartBuchungsportale" value="IVR" checked> IVR</label>
        <label><input type="checkbox" name="chartBuchungsportale" value="Windows" checked> Windows</label>
        <label><input type="checkbox" name="chartBuchungsportale" value="iPhone SRH" checked> iPhone SRH</label>
        <label><input type="checkbox" name="chartBuchungsportale" value="LIDL-BIKE" checked> LIDL-BIKE</label>
        <label><input type="checkbox" name="chartBuchungsportale" value="Android SRH" checked> Android SRH</label>
        <label><input type="checkbox" name="chartBuchungsportale" value="Techniker F_5 (-67212-)" checked> Techniker F_5 (-67212-)</label>
        <label><input type="checkbox" name="chartBuchungsportale" value="iPhone KON" checked> iPhone KON</label>
        </div>
        <button type="button" id="chartSelectAllPortalsButton">Alle auswählen</button> <!-- Added toggle button -->
        </fieldset>

         
            </form>
        </div>

        <div id="diagramsContainer">
            <!-- Station für Markierung im Graphen auswählen -->
            <div style="margin-bottom:10px;">
                <label for="stationForChart">Station für Markierung im Graphen auswählen:</label>
                <select id="stationForChart">
                </select>
                <button class="submit-btn" onclick="highlightStationOnChart()">Station hervorheben</button>
            </div>
            <div id="lineChartContainer"></div>
            <div id="pieChartContainer"></div>
           
        </div>
    </div>
</div>

<!-- Skripte -->
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js"></script>
<script src="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"></script>
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet-polylinedecorator/1.1.0/leaflet.polylineDecorator.min.js"></script>
<script src="../includes/javascript/initMap.js"></script>
<script src="../includes/javascript/workLoadFunctions.js"></script>
<script src="../includes/javascript/stationsSelector.js"></script>
<script src="../includes/javascript/routingFromCurrentPosition.js"></script>
<script src="../includes/javascript/adressSearchRouting.js"></script>
<script src="../includes/javascript/flowLinesFunctions.js"></script>
<script src="../includes/javascript/chartFunctions.js"></script>
<script>
    let isShowAddressSearch = false;

    function showFilterForm() {
        const filterDiv = document.getElementById('filterForWorkload');
        const isVisible = filterDiv.style.display === 'block';

        if (isVisible) {
            // Wenn bereits sichtbar, ausblenden
            toggleDisplay('filterForWorkload', false);
        } else {
            // Andernfalls anzeigen und andere Bereiche ausblenden
            const legends = document.getElementsByClassName('legend');
            Array.from(legends).forEach(legend => {
                legend.style.display = 'block';
            });

            resetMarkers();
            toggleDisplay('filterForWorkload', true);
            toggleDisplay('searchForStationDiv', false);
            toggleDisplay('addressSearchDiv', false);
            toggleDisplay('filterForFlowLines', false);
            document.getElementById('chartsContainer').style.display = 'none';
            filterDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function showSearchStation() {
        const searchDiv = document.getElementById('searchForStationDiv');
        const isVisible = searchDiv.style.display === 'block';

        if (isVisible) {
            // Wenn bereits sichtbar, ausblenden
            toggleDisplay('searchForStationDiv', false);
        } else {
            // Andernfalls anzeigen und andere Bereiche ausblenden
            resetMarkers();
            toggleDisplay('filterForWorkload', false);
            toggleDisplay('searchForStationDiv', true);
            toggleDisplay('addressSearchDiv', false);
            toggleDisplay('filterForFlowLines', false);
            document.getElementById('chartsContainer').style.display = 'none';
            
            // Stationsauswahl nur einmal initialisieren
            initializeStationSelectionUI(window.markerArray);
            searchDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
           
        }
        
    }


    function showAddressSearch() {
        const div = document.getElementById('addressSearchDiv');
        const isVisible = div.style.display === 'block';

        if (isVisible) {
            // Form is visible, so hide it
            toggleDisplay('addressSearchDiv', false);
        } else {
            // Form is hidden, so show it and hide others
            resetMarkers();
            toggleDisplay('filterForWorkload', false);
            toggleDisplay('searchForStationDiv', false);
            toggleDisplay('addressSearchDiv', true);
            toggleDisplay('filterForFlowLines', false);
            document.getElementById('chartsContainer').style.display = 'none';
            addressSearchDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }


    function showFlowLinesForm() {
        const flowLinesDiv = document.getElementById('filterForFlowLines');
        const isVisible = flowLinesDiv.style.display === 'block';

        if (isVisible) {
            // Wenn bereits sichtbar, ausblenden
            toggleDisplay('filterForFlowLines', false);
        } else {
            // Andernfalls anzeigen und andere Bereiche ausblenden
            resetMarkers();
            populateStationsSelectFlowLines();
            toggleDisplay('filterForWorkload', false);
            toggleDisplay('searchForStationDiv', false);
            toggleDisplay('addressSearchDiv', false);
            toggleDisplay('filterForFlowLines', true);
            document.getElementById('chartsContainer').style.display = 'none';
            flowLinesDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
        }
    }


    function toggleDisplay(id, show) {
        resetMarkers()
        const elem = document.getElementById(id);
        if (!elem) return;
        elem.style.display = show ? 'block' : 'none';
    }
    function toggleChartsDisplay() {
    const chartsContainer = document.getElementById('chartsContainer');
    const isVisible = chartsContainer.style.display === 'block';

    if (isVisible) {
        // Hide the charts container
        toggleDisplay('chartsContainer', false);
    } else {
        // Andernfalls anzeigen und andere Bereiche ausblenden
        resetMarkers();
        toggleDisplay('filterForWorkload', false);
        toggleDisplay('searchForStationDiv', false);
        toggleDisplay('addressSearchDiv', false);
        toggleDisplay('filterForFlowLines', false);
        toggleDisplay('chartsContainer', true);

        // Simulate form submission to generate charts with current default values
        const chartFilterForm = document.getElementById('chartFilterForm');
        if (chartFilterForm) {
            chartFilterForm.dispatchEvent(new Event('submit'));
        }

        // Scroll to the charts container
        chartsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

</script>

<?php
include "../includes/footer.php";
?>

</body>
</html>