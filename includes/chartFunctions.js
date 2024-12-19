// chartFunctions.js
// Separiert die Chart-Logik vom Marker-Filter
// Berechnet Durchschnittswerte pro Station

document.addEventListener('DOMContentLoaded', initChartHandler);

function initChartHandler() {
    const chartFilterForm = document.getElementById('chartFilterForm');
    if (chartFilterForm) {
        chartFilterForm.addEventListener('submit', handleChartFilterSubmit);
    }
}

function handleChartFilterSubmit(event) {
    event.preventDefault();

    const mode = getRadioValue('zeitraumModus');
    const weekdays = getCheckedValues('wochentage') || ['alle'];
    const chartVon = document.getElementById('chartVon').value;
    const chartBis = document.getElementById('chartBis').value;
    const buchungstyp = getRadioValue('chartBuchungstyp') || 'beides';
    const selectedPortals = getCheckedValues('chartBuchungsportale');

    const aggregatedData = aggregateDataForCharts(
        window.stationsData, chartVon, chartBis, weekdays, buchungstyp, selectedPortals
    );

    updateCharts({ mode, data: aggregatedData });
}

function aggregateDataForCharts(stationsData, startTime, endTime, weekdays, buchungstyp, selectedPortals) {
    const weekdayShorts = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const usedWeekdays = weekdays.includes('alle') ? weekdayShorts : weekdays.map(getKurzWochentag);

    const aggregatedData = initializeAggregatedData(weekdayShorts);

    stationsData.forEach(station => {
        const stationData = getStationAggregatedData(
            station, usedWeekdays, startTime, endTime, selectedPortals, buchungstyp
        );
        mergeAggregatedData(aggregatedData, stationData);
    });

    return calculateAverages(aggregatedData, stationsData.length);
}

function getStationAggregatedData(stationData, weekdays, startTime, endTime, selectedPortals, buchungstyp) {
    const data = initializeAggregatedData(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);

    weekdays.forEach(day => {
        processStationDayData(stationData, day, startTime, endTime, selectedPortals, buchungstyp, data);
    });

    return data;
}

function processStationDayData(stationData, weekday, startTime, endTime, selectedPortals, buchungstyp, aggregatedData) {
    const hoursData = stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde[weekday];
    const portalData = stationData.Buchungsportale_pro_Wochentag_und_Stunde[weekday];

    if (!hoursData || !portalData) return;

    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);

    for (let hour = startHour; hour <= endHour; hour++) {
        accumulateHourlyData(hoursData[hour], portalData[hour], selectedPortals, buchungstyp, aggregatedData[weekday][hour]);
    }
}

function accumulateHourlyData(hourData, portalData, selectedPortals, buchungstyp, aggregatedHour) {
    if (!hourData || !portalData) return;

    const matchingPortals = selectedPortals.length ? selectedPortals : Object.keys(portalData);

    matchingPortals.forEach(portal => {
        const portalStats = portalData[portal];
        if (portalStats && buchungstypFilterMatch(buchungstyp, portalStats)) {
            aggregatedHour.start += portalStats.Anzahl_Startvorgaenge;
            aggregatedHour.end += portalStats.Anzahl_Endvorgaenge;
            aggregatedHour.portals[portal] = (aggregatedHour.portals[portal] || 0) + portalStats.Anzahl_Startvorgaenge + portalStats.Anzahl_Endvorgaenge;
        }
    });
}

function updateCharts({ mode, data }) {
    if (!data) return;

    const container = document.getElementById('chartsContainer');
    if (!container || container.style.display === 'none') return;

    const portalDataArray = Object.entries(data.portals).map(([name, value]) => ({ name, y: value }));
    const { lineCategories, lineData } = generateLineChartData(mode, data);

    createOrUpdatePieChart(portalDataArray);
    createOrUpdateLineChart(lineCategories, lineData);
}

function generateLineChartData(mode, data) {
    const lineCategories = [];
    const lineData = [];

    if (mode === 'stunden') {
        for (let hour = 0; hour < 24; hour++) {
            lineCategories.push(`${hour}:00`);
            const total = data.weekdays.reduce((sum, day) => sum + data.timeData[day][hour].start + data.timeData[day][hour].end, 0);
            lineData.push(total);
        }
    } else {
        data.weekdays.forEach(day => {
            lineCategories.push(day);
            const total = data.timeData[day].reduce((sum, hour) => sum + hour.start + hour.end, 0);
            lineData.push(total);
        });
    }

    return { lineCategories, lineData };
}

// Utility Functions
function initializeAggregatedData(weekdays) {
    const data = { portals: {}, timeData: {}, weekdays };
    weekdays.forEach(day => {
        data.timeData[day] = Array.from({ length: 24 }, () => ({ start: 0, end: 0, portals: {} }));
    });
    return data;
}

function mergeAggregatedData(target, source) {
    for (const portal in source.portals) {
        target.portals[portal] = (target.portals[portal] || 0) + source.portals[portal];
    }

    for (const day in source.timeData) {
        for (let hour = 0; hour < 24; hour++) {
            const targetHour = target.timeData[day][hour];
            const sourceHour = source.timeData[day][hour];

            targetHour.start += sourceHour.start;
            targetHour.end += sourceHour.end;

            for (const portal in sourceHour.portals) {
                targetHour.portals[portal] = (targetHour.portals[portal] || 0) + sourceHour.portals[portal];
            }
        }
    }
}

function calculateAverages(data, stationCount) {
    for (const portal in data.portals) {
        data.portals[portal] /= stationCount;
    }

    for (const day in data.timeData) {
        data.timeData[day].forEach(hour => {
            hour.start /= stationCount;
            hour.end /= stationCount;
            for (const portal in hour.portals) {
                hour.portals[portal] /= stationCount;
            }
        });
    }

    return data;
}

function getRadioValue(name) {
    const element = document.querySelector(`input[name="${name}"]:checked`);
    return element ? element.value : null;
}

function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value);
}

function getKurzWochentag(wochentagLang) {
    const mapping = {
        'alle': 'Alle',
        'montag': 'Mo',
        'dienstag': 'Di',
        'mittwoch': 'Mi',
        'donnerstag': 'Do',
        'freitag': 'Fr',
        'samstag': 'Sa',
        'sonntag': 'So'
    };
    return mapping[wochentagLang.toLowerCase()];
}

function buchungstypFilterMatch(buchungstyp, portalData) {
    if (!portalData) return false;
    switch (buchungstyp) {
        case 'abholung':
            return portalData.Anzahl_Startvorgaenge > 0;
        case 'abgabe':
            return portalData.Anzahl_Endvorgaenge > 0;
        case 'beides':
            return portalData.Anzahl_Startvorgaenge + portalData.Anzahl_Endvorgaenge > 0;
        default:
            return false;
    }
}
