<?php
// map.php
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Call A Bike Team 4</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css">
    <link rel="stylesheet" href="../css/map.css">
</head>
<body>

<!-- Karte mit eingebetteter Legende -->
<div id="map">
    <!-- Legende hinzufügen -->
    <div class="legend">
        <h4>Legende</h4>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png');"></i> Entspricht den Schwellenwert<br>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png');"></i> Liegt über dem Schwellenwert<br>
        <i style="background-image: url('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png');"></i> Liegt unter dem Schwellenwert<br>
    </div>
</div>

<!-- Buttons für zusätzliche Funktionen -->
<div class="button-group">
    <button onclick="showFilterForm()">Filter Gesamtzahlen</button>
    <button onclick="resetMarkers()">Reset</button>
    <button onclick="visualizeWorkloadInTotal()">Visualize Workload</button>
</div>

<!-- Formular für Benutzereingaben -->
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
                    <!-- Optionen direkt im HTML definiert (Stundentakt) -->
                    <option value="00:00">00:00</option>
                    <option value="01:00">01:00</option>
                    <option value="02:00">02:00</option>
                    <option value="03:00">03:00</option>
                    <option value="04:00">04:00</option>
                    <option value="05:00">05:00</option>
                    <option value="06:00">06:00</option>
                    <option value="07:00">07:00</option>
                    <option value="08:00">08:00</option> <!-- Optional: Standardwert -->
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                    <option value="19:00">19:00</option>
                    <option value="20:00">20:00</option>
                    <option value="21:00">21:00</option>
                    <option value="22:00">22:00</option>
                    <option value="23:00">23:00</option>
                </select>

                <label for="bis">Bis:</label>
                <select name="bis" id="bis" required>
                    <option value="" selected>-- Uhrzeit wählen --</option>
                    <!-- Optionen direkt im HTML definiert (Stundentakt) -->
                    <option value="00:00">00:00</option>
                    <option value="01:00">01:00</option>
                    <option value="02:00">02:00</option>
                    <option value="03:00">03:00</option>
                    <option value="04:00">04:00</option>
                    <option value="05:00">05:00</option>
                    <option value="06:00">06:00</option>
                    <option value="07:00">07:00</option>
                    <option value="08:00">08:00</option> <!-- Optional: Standardwert -->
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                    <option value="19:00">19:00</option>
                    <option value="20:00">20:00</option>
                    <option value="21:00">21:00</option>
                    <option value="22:00">22:00</option>
                    <option value="23:00">23:00</option>
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
                <small>Dieser Schwellenwert wird für Startvorgänge, Endvorgänge und Differenz verwendet.</small>
            </div>
        </fieldset>

        <!-- Absenden Button -->
        <button type="submit" class="submit-btn">Filter anwenden</button>
    </form>
</div>

<!-- Skripte -->
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script src="../includes/initMap.js"></script>
<script src="../includes/workLoadFunctions.js"></script>

<?php
include '../includes/footer.php';
?>
</body>
</html>
