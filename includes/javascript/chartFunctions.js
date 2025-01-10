// chartFunctions.js
// Handhabt die Chart-Logik separat vom Marker-Filter.
// Angepasst: Anstatt akkumulierten Gesamtzahlen werden nun Durchschnittswerte pro Station dargestellt.

let pieChart;
let lineChart;
let lastChartAggregatedData = null;

document.addEventListener('DOMContentLoaded', function () {
    const chartFilterForm = document.getElementById('chartFilterForm');
    if (chartFilterForm) {
        chartFilterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const mode = document.querySelector('input[name="zeitraumModus"]:checked').value;
            const wochentageCB = document.querySelectorAll('input[name="wochentage"]:checked');
            let weekdays = Array.from(wochentageCB).map(cb => cb.value);
            if (weekdays.length === 0) weekdays = ['alle'];

            const chartVon = document.getElementById('chartVon').value;
            const chartBis = document.getElementById('chartBis').value;

            const buchungstypRadio = document.querySelector('input[name="chartBuchungstyp"]:checked');
            const buchungstyp = buchungstypRadio ? buchungstypRadio.value : 'beides';

            const portalCB = document.querySelectorAll('input[name="chartBuchungsportale"]:checked');
            const selectedPortals = Array.from(portalCB).map(cb => cb.value);

            const aggregatedData = aggregateDataForCharts(window.stationsData, chartVon, chartBis, weekdays, buchungstyp, selectedPortals);
            lastChartAggregatedData = { mode: mode, data: aggregatedData };
            updateCharts(lastChartAggregatedData);
        });
    }

    // Add Select All/Unselect All for weekdays
    const chartSelectAllWeekdaysButton = document.getElementById('chartSelectAllWeekdaysButton');
    if (chartSelectAllWeekdaysButton) {
        chartSelectAllWeekdaysButton.addEventListener('click', function () {
            const weekdayCheckboxes = document.querySelectorAll('input[name="wochentage"]');
            const allChecked = Array.from(weekdayCheckboxes).every(cb => cb.checked);

            // Toggle all checkboxes
            weekdayCheckboxes.forEach(cb => (cb.checked = !allChecked));

            // Update button text
            chartSelectAllWeekdaysButton.textContent = allChecked ? 'Alle auswählen' : 'Alle abwählen';
        });
    }

    // Add Select All/Unselect All for portals
    const chartSelectAllPortalsButton = document.getElementById('chartSelectAllPortalsButton');
    if (chartSelectAllPortalsButton) {
        chartSelectAllPortalsButton.addEventListener('click', function () {
            const portalCheckboxes = document.querySelectorAll('input[name="chartBuchungsportale"]');
            const allChecked = Array.from(portalCheckboxes).every(cb => cb.checked);

            // Toggle all checkboxes
            portalCheckboxes.forEach(cb => (cb.checked = !allChecked));

            // Update button text
            chartSelectAllPortalsButton.textContent = allChecked ? 'Alle auswählen' : 'Alle abwählen';
        });
    }
});


function aggregateDataForCharts(stationsData, startTime, endTime, weekdays, buchungstyp, selectedPortals) {
    let aggregatedPortalCounts = {};
    let aggregatedTimeData = {};
    const weekdayShorts = ['Mo','Di','Mi','Do','Fr','Sa','So'];

    weekdayShorts.forEach(wd => {
        aggregatedTimeData[wd] = [];
        for (let h=0; h<24; h++) {
            aggregatedTimeData[wd][h] = {start:0, end:0, portals:{}};
        }
    });

let usedWeekdays = weekdayShorts.filter(wd => {
    return weekdays.map(w => getKurzWochentag(w)).includes(wd);
});


    stationsData.forEach(stationData => {
        const {startInPeriod, endInPeriod, portalCounts, hourData} = getStartEndInPeriodForCharts(stationData, weekdays, startTime, endTime, selectedPortals, buchungstyp);

        // Akkumulieren der Portalcounts
        for (let p in portalCounts) {
            if (!aggregatedPortalCounts[p]) aggregatedPortalCounts[p] = 0;
            aggregatedPortalCounts[p] += portalCounts[p];
        }

        // Akkumulieren der Zeitdaten
        usedWeekdays.forEach(wd => {
            if (hourData[wd]) {
                for (let h=0; h<24; h++) {
                    aggregatedTimeData[wd][h].start += hourData[wd][h].start;
                    aggregatedTimeData[wd][h].end += hourData[wd][h].end;
                    for (let pp in hourData[wd][h].portals) {
                        if(!aggregatedTimeData[wd][h].portals[pp]) aggregatedTimeData[wd][h].portals[pp]=0;
                        aggregatedTimeData[wd][h].portals[pp]+= hourData[wd][h].portals[pp];
                    }
                }
            }
        });
    });

    // Jetzt von Summe auf Durchschnitt pro Station umrechnen
    const stationCount = stationsData.length;
    // Durchschnitt für Portalcounts
    for (let p in aggregatedPortalCounts) {
        aggregatedPortalCounts[p] /= stationCount;
    }

    // Durchschnitt für Zeitdaten
    for (let wd in aggregatedTimeData) {
        for (let h=0; h<24; h++) {
            aggregatedTimeData[wd][h].start /= stationCount;
            aggregatedTimeData[wd][h].end /= stationCount;
            for (let pp in aggregatedTimeData[wd][h].portals) {
                aggregatedTimeData[wd][h].portals[pp] /= stationCount;
            }
        }
    }

    return {
        portals: aggregatedPortalCounts,
        timeData: aggregatedTimeData,
        weekdays: usedWeekdays
    };
}

function getStartEndInPeriodForCharts(stationData, weekdays, startTime, endTime, selectedPortals, buchungstyp) {
    let startInPeriod = 0;
    let endInPeriod = 0;
    let portalCounts = {};
    let hourData = {};
    const weekdayHours = ['Mo','Di','Mi','Do','Fr','Sa','So'];

    weekdayHours.forEach(wd => {
        hourData[wd] = [];
        for (let h=0; h<24; h++){
            hourData[wd][h] = {start:0, end:0, portals:{}};
        }
    });

    function processWeekday(wochentagKurz) {
        const stundenDaten = stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde[wochentagKurz];
        const portalDaten = stationData.Buchungsportale_pro_Wochentag_und_Stunde[wochentagKurz];
        if (!stundenDaten || !portalDaten) return;

        const startHour = parseInt(startTime.split(':')[0], 10);
        const endHour = parseInt(endTime.split(':')[0], 10);

        for (let hour = startHour; hour <= endHour; hour++) {
            let stundenDataForHour = stundenDaten[hour];
            let portalDataForHour = portalDaten[hour];
            let { s, e, pData } = accumulateHourDataCharts(stundenDataForHour, portalDataForHour, selectedPortals, buchungstyp);
            startInPeriod += s;
            endInPeriod += e;

            hourData[wochentagKurz][hour].start += s;
            hourData[wochentagKurz][hour].end += e;
            for (let p in pData) {
                if (!hourData[wochentagKurz][hour].portals[p]) hourData[wochentagKurz][hour].portals[p]=0;
                hourData[wochentagKurz][hour].portals[p]+= pData[p];

                if(!portalCounts[p]) portalCounts[p]=0;
                portalCounts[p]+= pData[p];
            }
        }
    }

    weekdays.forEach(wochentagLang => {
        if (wochentagLang.toLowerCase() === 'alle') {
            Object.keys(stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde).forEach(wochentagKurz => {
                if(wochentagKurz!=='Alle') processWeekday(wochentagKurz);
            });
        } else {
            let wochentagKurz = getKurzWochentag(wochentagLang);
            if (wochentagKurz && stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde[wochentagKurz]) {
                processWeekday(wochentagKurz);
            }
        }
    });

    return {startInPeriod, endInPeriod, portalCounts, hourData};
}

function accumulateHourDataCharts(stundenDataForHour, portalDataForHour, selectedPortals, buchungstyp) {
    let hourStart = 0;
    let hourEnd = 0;
    let pData = {};

    if(!stundenDataForHour || !portalDataForHour) return {s:0,e:0,pData:{}};

    if (selectedPortals.length > 0) {
        selectedPortals.forEach(portal => {
            const pd = portalDataForHour[portal];
            if (pd && buchungstypFilterMatch(buchungstyp, pd)) {
                hourStart += pd.Anzahl_Startvorgaenge;
                hourEnd += pd.Anzahl_Endvorgaenge;
                let totalPortal = pd.Anzahl_Startvorgaenge + pd.Anzahl_Endvorgaenge;
                if (!pData[portal]) pData[portal] = 0;
                pData[portal]+= totalPortal;
            }
        });
    } else {
        for(let p in portalDataForHour) {
            const pd = portalDataForHour[p];
            if (buchungstypFilterMatch(buchungstyp, pd)) {
                hourStart += pd.Anzahl_Startvorgaenge;
                hourEnd += pd.Anzahl_Endvorgaenge;
                let totalPortal = pd.Anzahl_Startvorgaenge + pd.Anzahl_Endvorgaenge;
                if (!pData[p]) pData[p]=0;
                pData[p]+= totalPortal;
            }
        }
    }

    return { s: hourStart, e: hourEnd, pData };
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
    if (buchungstyp === 'abholung') {
        return portalData.Anzahl_Startvorgaenge > 0;
    } else if (buchungstyp === 'abgabe') {
        return portalData.Anzahl_Endvorgaenge > 0;
    } else if (buchungstyp === 'beides') {
        return (portalData.Anzahl_Startvorgaenge + portalData.Anzahl_Endvorgaenge) > 0;
    }
    return false;
}

function updateCharts(chartConfig) {
    if (!chartConfig) return;

    const { mode, data } = chartConfig;
    const container = document.getElementById('chartsContainer');
    if (container.style.display === 'none' || container.style.display === '') {
        return;
    }

    // Prepare data for the pie chart
    const portalDataArray = [];
    let totalPortalCount = 0;
    for (let p in data.portals) {
        totalPortalCount += data.portals[p];
    }
    for (let p in data.portals) {
        let perc = totalPortalCount === 0 ? 0 : (data.portals[p] / totalPortalCount) * 100;
        portalDataArray.push({ name: p, y: perc });
    }

    // Prepare data for the line chart
    let lineCategories = [];
    let lineData = [];

    if (mode === 'stunden') {
        // Hourly aggregation
        for (let h = 0; h < 24; h++) {
            let total = 0;
            data.weekdays.forEach(wd => {
                total += (data.timeData[wd][h].start + data.timeData[wd][h].end);
            });
            lineData.push(total);
            lineCategories.push(h + ":00");
        }
    } else if (mode === 'tage') {
        // Daily aggregation
        data.weekdays.forEach(wd => {
            let total = 0;
            for (let h = 0; h < 24; h++) {
                total += (data.timeData[wd][h].start + data.timeData[wd][h].end);
            }
            lineData.push(total);
            lineCategories.push(wd);
        });
    }

    // Clear all existing series except the default one
    if (lineChart) {
        while (lineChart.series.length > 1) {
            lineChart.series[lineChart.series.length - 1].remove(false);
        }
    }

    // Update or recreate the line chart
    if (!lineChart) {
        lineChart = Highcharts.chart('lineChartContainer', {
            chart: {
                type: 'line'
            },
            title: {
                text: mode === 'stunden' ? 'Hourly Chart' : 'Daily Chart'
            },
            xAxis: {
                categories: lineCategories
            },
            yAxis: {
                title: {
                    text: 'Average Bookings'
                }
            },
            series: [{
                name: 'Average',
                data: lineData
            }]
        });
    } else {
        // Update existing chart
        lineChart.setTitle({ text: mode === 'stunden' ? 'Hourly Chart' : 'Daily Chart' });
        lineChart.xAxis[0].setCategories(lineCategories, false);
        lineChart.series[0].setData(lineData, true);
    }

    // Update or recreate the pie chart
    createOrUpdatePieChart(portalDataArray);
}

function createOrUpdatePieChart(data) {
    if (!pieChart) {
        pieChart = Highcharts.chart('pieChartContainer', {
            chart: {
                type: 'pie'
            },
            title: {
                text: 'Buchungsportale (Prozentual)'
            },
            series: [{
                name: 'Prozent',
                colorByPoint: true,
                data: data
            }]
        });
    } else {
        pieChart.series[0].setData(data, true);
    }
}

function createOrUpdateLineChart(categories, data) {
    if (!lineChart) {
        lineChart = Highcharts.chart('lineChartContainer', {
            chart: {
                type: 'line'
            },
            title: {
                text: 'Auslastung der Buchungen (Durchschnitt über alle Stationen)'
            },
            xAxis: {
                categories: categories
            },
            yAxis: {
                title: {
                    text: 'Anzahl Buchungen (Durchschnitt)'
                }
            },
            series: [{
                name: 'Durchschnitt (alle Stationen)',
                data: data
            }]
        });
    } else {
        lineChart.xAxis[0].setCategories(categories, false);
        // Aktualisieren der bestehenden Serie mit neuen Durchschnittswerten
        lineChart.series[0].update({
            name: 'Durchschnitt (alle Stationen)',
            data: data
        }, true);
    }
}

function highlightStationOnChart() {
    const stationName = document.getElementById('stationForChart').value;
    if (!stationName || !lineChart || !lastChartAggregatedData) return;

    const chartFilterForm = document.getElementById('chartFilterForm');
    if (!chartFilterForm) return;
    const formData = new FormData(chartFilterForm);

    const modeVal = formData.get('zeitraumModus') || 'stunden';
    const weekdaysForm = formData.getAll('wochentage');
    const startTime = formData.get('chartVon');
    const endTime = formData.get('chartBis');
    const buchungstyp = formData.get('chartBuchungstyp') || 'beides';
    const selectedPortals = formData.getAll('chartBuchungsportale');

    let stationObj = window.stationsData.find(st => st.station_name === stationName);
    if (!stationObj) return;

    const { hourData } = getStationHourDataForCharts(
        stationObj,
        weekdaysForm.length > 0 ? weekdaysForm : ['alle'],
        startTime,
        endTime,
        selectedPortals,
        buchungstyp
    );

    // Remove previous highlighted series
    const existingSeriesIndex = lineChart.series.findIndex(s => s.name === stationName);
    if (existingSeriesIndex !== -1) {
        lineChart.series[existingSeriesIndex].remove(false);
    }

    let stationDataArray = [];
    if (modeVal === 'stunden') {
        // Hourly data
        for (let h = 0; h < 24; h++) {
            let sumHour = 0;
            weekdaysForm.forEach(wd => {
                let shortWd = getKurzWochentag(wd);
                if (hourData[shortWd]) {
                    sumHour += hourData[shortWd][h].start + hourData[shortWd][h].end;
                }
            });
            stationDataArray.push(sumHour);
        }
    } else {
        // Daily data
        weekdaysForm.forEach(wd => {
            let shortWd = getKurzWochentag(wd);
            let total = 0;
            for (let h = 0; h < 24; h++) {
                if (hourData[shortWd]) {
                    total += hourData[shortWd][h].start + hourData[shortWd][h].end;
                }
            }
            stationDataArray.push(total);
        });
    }

    // Add the new series
    lineChart.addSeries({
        name: stationName,
        data: stationDataArray,
        color: '#ff0000',
        marker: {
            symbol: 'circle'
        }
    }, true);
}   

function getStationHourDataForCharts(stationData, weekdays, startTime, endTime, selectedPortals, buchungstyp) {
    const weekdayHours = ['Mo','Di','Mi','Do','Fr','Sa','So'];
    let hourData = {};
    weekdayHours.forEach(wd => {
        hourData[wd] = [];
        for (let h=0; h<24; h++){
            hourData[wd][h] = {start:0, end:0};
        }
    });

    function processWeekday(wochentagKurz) {
        const stundenDaten = stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde[wochentagKurz];
        const portalDaten = stationData.Buchungsportale_pro_Wochentag_und_Stunde[wochentagKurz];
        if (!stundenDaten || !portalDaten) return;

        const startHour = parseInt(startTime.split(':')[0], 10);
        const endHour = parseInt(endTime.split(':')[0], 10);

        for (let hour = startHour; hour <= endHour; hour++) {
            let stundenDataForHour = stundenDaten[hour];
            let portalDataForHour = portalDaten[hour];
            let { s, e } = accumulateHourDataForStationCharts(stundenDataForHour, portalDataForHour, selectedPortals, buchungstyp);
            hourData[wochentagKurz][hour].start = s;
            hourData[wochentagKurz][hour].end = e;
        }
    }

    weekdays.forEach(wochentagLang => {
        if (wochentagLang.toLowerCase() === 'alle') {
            Object.keys(stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde).forEach(wochentagKurz => {
                if(wochentagKurz!=='Alle') processWeekday(wochentagKurz);
            });
        } else {
            let wochentagKurz = getKurzWochentag(wochentagLang);
            if (wochentagKurz && stationData.Anzahl_Fahrten_pro_Wochentag_und_Stunde[wochentagKurz]) {
                processWeekday(wochentagKurz);
            }
        }
    });

    return {hourData};
}

function accumulateHourDataForStationCharts(stundenDataForHour, portalDataForHour, selectedPortals, buchungstyp) {
    let hourStart = 0;
    let hourEnd = 0;
    if(!stundenDataForHour||!portalDataForHour)return {s:0,e:0};

    if (selectedPortals.length > 0) {
        selectedPortals.forEach(portal => {
            const pd = portalDataForHour[portal];
            if (pd && buchungstypFilterMatch(buchungstyp, pd)) {
                hourStart += pd.Anzahl_Startvorgaenge;
                hourEnd += pd.Anzahl_Endvorgaenge;
            }
        });
    } else {
        for(let p in portalDataForHour) {
            const pd = portalDataForHour[p];
            if(buchungstypFilterMatch(buchungstyp,pd)) {
                hourStart += pd.Anzahl_Startvorgaenge;
                hourEnd += pd.Anzahl_Endvorgaenge;
            }
        }
    }
    return { s: hourStart, e: hourEnd };
}

function populateStationSelectForChart(stationsData) {
    const select = document.getElementById('stationForChart');
    if(!select) return;

    while(select.children.length >1) {
        select.removeChild(select.lastChild);
    }

    stationsData.forEach(st => {
        let opt = document.createElement('option');
        opt.value=st.station_name;
        opt.textContent=st.station_name;
        select.appendChild(opt);
    });
}
