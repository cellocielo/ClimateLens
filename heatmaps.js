function getZoomLevel(area) {
    if (area < 1000) return 12;
    if (area < 10000) return 10;
    if (area < 100000) return 8;
    return 5;
}
let seasonal = false;
const boundaryPoints1 = JSON.parse(localStorage.getItem("boundaryPoints1")) || [];
const boundaryPoints2 = JSON.parse(localStorage.getItem("boundaryPoints2")) || [];

const area1 = localStorage.getItem("area1");
const area2 = localStorage.getItem("area2");
const zoomLevel1 = getZoomLevel(area1);
const zoomLevel2 = getZoomLevel(area2);

let unit;
function calculateCentroid(points) {
    let latSum = 0;
    let lonSum = 0;
    const numPoints = points.length;

    for (const point of points) {
        latSum += point.lat;
        lonSum += point.lon;
    }

    return {
        lat: latSum / numPoints,
        lon: lonSum / numPoints,
    };
}

const centroid1 = calculateCentroid(boundaryPoints1);
const centroid2 = calculateCentroid(boundaryPoints2);
const map1 = L.map('map-1').setView([centroid1.lat, centroid1.lon], zoomLevel1);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map1);

const map2 = L.map('map-2').setView([centroid2.lat, centroid2.lon], zoomLevel2);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map2);

const drawnItems1 = new L.FeatureGroup();
map1.addLayer(drawnItems1);
const drawnItems2 = new L.FeatureGroup();
map2.addLayer(drawnItems2);

const points1 = getPointsWithinBoundary(boundaryPoints1, area1);
const points2 = getPointsWithinBoundary(boundaryPoints2, area2);

const toggleButton = document.getElementById("toggle-sidebar");
const sidebar = document.getElementById("sidebar");

    toggleButton.addEventListener("click", () => {
        let isAnyChecked = false;
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            if (radio.checked) {
                isAnyChecked = true;
            }
        });
        if (isAnyChecked) {
            sidebar.classList.toggle("hidden");
            if (sidebar.classList.contains("hidden")) {
                const selectedRadio = document.querySelector('input[name="feature"]:checked');
                loadHeatMaps(points1, points2, selectedRadio.value, area1, area2);
                clearWarnings();

                const gradients = {
                    'temperature_2m_max': 'linear-gradient(to right, darkblue, blue, lightblue, yellow, orange, red)',
                    'temperature_2m_min': 'linear-gradient(to right, darkblue, blue, lightblue, yellow, orange, red)',
                    'precipitation_sum': 'linear-gradient(to right, white, lightblue, blue, darkblue, purple, black)',
                    'daylight_duration': 'linear-gradient(to right, #00274D, #1B6CA8, #56B4E9, #F0E442, #FFD700, #000033)',
                    'snowfall_sum': 'linear-gradient(to right, white, lightblue, blue, darkblue, purple)',
                    'sunshine_duration': 'linear-gradient(to right, lightgray, yellow, orange, red, darkred)',
                    'shortwave_radiation_sum': 'linear-gradient(to right, lightyellow, yellow, orange, red, darkred)',
                    'wind_speed_10m_max': 'linear-gradient(to right, lightblue, blue, darkblue, purple, darkviolet)',
                    'wind_gusts_10m_max': 'linear-gradient(to right, lightblue, blue, darkblue, purple, darkviolet)',
                    'et0_fao_evapotranspiration': 'linear-gradient(to right, lightgreen, green, yellow, orange, red)'
                };
                const gradientBox = document.getElementById('gradient-box');
                
                // Change the background gradient when the feature is selected
                const selectedFeature = selectedRadio.value;
                gradientBox.style.background = gradients[selectedFeature];

                const boxWidth = gradientBox.clientWidth;
                
                const units = {
                    temperature_2m_max: '°C',
                    temperature_2m_min: '°C',
                    precipitation_sum: 'mm',
                    daylight: 'seconds',
                    snowfall_sum: 'cm',
                    sunshine_duration: 'seconds',
                    shortwave_radiation_sum: 'MJ/m²',
                    wind_speed_10m_max: 'km/hr',
                    wind_gusts_10m_max: 'km/hr',
                    et0_fao_evapotranspiration: 'mm'
                };

                unit = units[selectedFeature];

                // Clear previous labels if necessary
                gradientBox.innerHTML = '';
                const valuesList = {
                    temperature_2m_max: [-20, 0, 10, 20, 30, 40, 50],
                    temperature_2m_min: [-20, 0, 10, 20, 30, 40, 50],
                    precipitation_sum: [1, 4, 8, 16, 32],
                    daylight_duration: [0, 10000, 30000, 50000, 86400],
                    snowfall_sum: [0, 10, 25, 50],
                    sunshine_duration: [7200, 21600, 43200, 86400],
                    shortwave_radiation_sum: [2, 5, 10, 20],
                    wind_speed_10m_max: [7.2, 18, 36, 54],
                    wind_gusts_10m_max: [18, 36, 72, 108],
                    et0_fao_evapotranspiration: [1, 3, 5, 7],
                };
                
                const values = valuesList[selectedFeature];
                values.forEach((value, index) => {
                    const percentage = (index / (values.length - 1)) * 100;
                    const position = (percentage / 100) * (boxWidth);
            
                    const label = document.createElement("div");
                    label.style.position = "absolute";
                    label.style.left = `${position}px`;
                    label.style.bottom = "-30px";
                    label.style.whiteSpace = "nowrap";
                    label.style.maxWidth = "120px";
                    label.style.transform = "translateX(-50%)";
                    label.innerHTML = `${value.toFixed(2)} ${unit}`;
            
                    // Styling
                    label.style.color = "white";
                    label.style.fontWeight = "bold";
                    label.style.fontSize = "12px";
                    label.style.pointerEvents = "none";
            
                    gradientBox.appendChild(label);

                    if (document.getElementById("dataset-checkbox").addEventListener("change", function(event) {
                        if (event.target.checked) {
                            seasonal = true;
                            const title2 = document.getElementById('map-title-2');
                            let day = dataset[0].day;
                            let month = dataset[0].month;
                            let year = dataset[0].year;
                            date = new Date(year, month, day);
                            month = calculateSeasonalEquivalentDay(date, centroid2.lat).month;
                            day = calculateSeasonalEquivalentDay(date, centroid2.lat).day;
                            year = calculateSeasonalEquivalentDay(date, centroid2.lat).year;
                            title2.textContent = "Region 2" + ` (${month}/${day}/${year})`;
                        }
                        else {
                            seasonal = false;
                            day = dataset[0].day;
                            month = dataset[0].month;
                            year = dataset[0].year;
                            const title2 = document.getElementById('map-title-2');
                            title2.textContent = "Region 2" + ` (${month}/${day}/${year})`;
                        }
                        loadHeatMaps(points1, points2, selectedRadio.value, area1, area2);
                    }));
                });
            }
        }
    });
let featureData1;
let featureData2;
let diversity1;
let diversity2;
async function getClimateData(points, feature, area, centroid) {
    const climateData = [];
    try {
        for (let i = 0; i < points.length; i++) {
            const data = await (loadInfo(points[i].lat, points[i].lon, feature, area, centroid));
            climateData.push(data);
        }
        console.log("Climate Data:", climateData);
        let featureData = climateData.map(row => row[feature]);
        if (area == area1) {
            featureData1 = Array.from(featureData);
            diversity1 = calculateStandardDeviation(featureData, area);
        }
        else if (area == area2) {
            featureData2 = Array.from(featureData);
            diversity2 = calculateStandardDeviation(featureData, area);
        }

        await generateHeatMapData(climateData, feature, area);
        
    } catch (error) {
        console.error("Error loading climate data:", error);
    }
}

async function loadInfo(lat, lon, feature, area, centroid) {
    let url;
    const dataset = JSON.parse(localStorage.getItem("datasets"));
    if (area == area1 || seasonal == false) {
        console.log("11111");
        let day = dataset[0].day;
        let month = dataset[0].month;
        let year = dataset[0].year;
        url = `http://127.0.0.1:5000/daily-dataframe?latitude=${lat}&longitude=${lon}&feature=${feature}&day=${day}&month=${month}&year=${year}`;
    }
    else if (seasonal|| area == area1) {
        console.log("2222");
        let day = dataset[0].day;
        let month = dataset[0].month;
        let year = dataset[0].year;
        let date = new Date(year, month, day);
        month = calculateSeasonalEquivalentDay(date, centroid2.lat).month;
        day = calculateSeasonalEquivalentDay(date, centroid2.lat).day;
        year = calculateSeasonalEquivalentDay(date, centroid2.lat).year;
        url = `http://127.0.0.1:5000/daily-dataframe?latitude=${lat}&longitude=${lon}&feature=${feature}&day=${day}&month=${month}&year=${year}`;
    }
    else if (area == area2 && seasonal) {
        console.log("33333");
        const day = dataset[0].day;
        const month = dataset[0].month;
        const year = dataset[0].year;
        url = `http://127.0.0.1:5000/daily-dataframe?latitude=${lat}&longitude=${lon}&feature=${feature}&day=${day}&month=${month}&year=${year}`;
    }
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }
        return {
            lat: lat,
            lon: lon,
            [feature]: data[feature]
        };
    } catch (error) {
        console.error("fetch weather data error:", error);
        throw error;
    }
}

async function loadHeatMaps(points1, points2, feature, area1, area2, centroid1, centroid2) {
    const loadingScreen = document.querySelector(".loading-screen");
    try {
        loadingScreen.style.display = "flex";
        const promise1 = getClimateData(points1, feature, area1, centroid1);
        const promise2 = getClimateData(points2, feature, area2, centroid2);
        await Promise.all([promise1, promise2]);
        calculateDataDifferences(featureData1, featureData2);
        
    } catch (error) {
        console.error("load heatmaps error:", error);
    } finally {
        loadingScreen.style.display = "none";
    }
}
const layerGroupMap1 = L.layerGroup().addTo(map1);
const layerGroupMap2 = L.layerGroup().addTo(map2);
async function generateHeatMapData(data, feature, area) {
    const heatmapData = [];
    if (area === area1) {
        layerGroupMap1.clearLayers();
    } else if (area === area2) {
        layerGroupMap2.clearLayers();
    }
    for (let i = 0; i<data.length; i++) {
        heatmapData.push([data[i].lat, data[i].lon, data[i][feature]]);
    }
    console.log("heatmapData: ", heatmapData);
    if (area == area1) {
        for (let i = 0; i<heatmapData.length; i++) {
            let color = getColorForValue(heatmapData[i][2], feature);
            console.log("Color: " + color);
            const marker = L.circleMarker([heatmapData[i][0], heatmapData[i][1]], {
                color: 'black',
                fillColor: color,
                fillOpacity: 1,
                opacity: 0.5,
                radius: 12,
                weight: 1,
            }).addTo(layerGroupMap1);
            marker.bindPopup(`${heatmapData[i][2].toFixed(3)} ` + unit);
            marker.addTo(layerGroupMap1);
        }
    }
    if (area == area2) {
        for (let i = 0; i<heatmapData.length; i++) {
            let color = getColorForValue(heatmapData[i][2], feature);
            const marker2 = L.circleMarker([heatmapData[i][0], heatmapData[i][1]], {
                color: 'black',
                fillColor: color,
                fillOpacity: 1,
                opacity: 0.5,
                radius: 12,
                weight: 1,
            }).addTo(layerGroupMap2);
            marker2.bindPopup(`${heatmapData[i][2].toFixed(3)} ` + unit);
            marker2.addTo(layerGroupMap2);
        }
    }
   
}

function getColorForValue(value, feature) {
    switch (feature) {
        case 'temperature_2m_max':
        case 'temperature_2m_min':
            console.log("TEMPERATURE", value);
            if (value <= -10) return 'darkblue';
            else if (value <= 10) return 'blue';
            else if (value <= 20) return 'lightblue';
            else if (value <= 30) return 'yellow';
            else if (value <= 40) return 'orange';
            else if (value <= 50) return 'red';
            return 'darkred';

            case 'precipitation_sum': // (mm)
            if (value <= 1) return 'white';
            else if (value <= 4) return 'lightblue';
            else if (value <= 8) return 'blue';
            else if (value <= 16) return 'purple';
            else if (value <= 32) return 'darkpurple';

        case 'daylight_duration': // (seconds)
            if (value <= 0) return '#00274D';
            else if (value <= 10000) return '#1B6CA8';
            else if (value <= 30000) return '#56B4E9';
            else if (value <= 50000) return '#F0E442';
            else if (value <= 86400) return '#FFD700';
            return '#000033';

        case 'snowfall_sum': // (cm)
            if (value <= 0) return 'white';
            else if (value <= 10) return 'lightblue';
            else if (value <= 25) return 'blue';
            else if (value <= 50) return 'darkblue';
            return 'purple';

        case 'sunshine_duration': // (hours)
            if (value <= 7200) return 'lightgray';
            else if (value <= 21600) return 'yellow';
            else if (value <= 43200) return 'orange';
            else if (value <= 86000) return 'red';
            return 'darkred';

        case 'shortwave_radiation_sum': // (MJ/m²)
            if (value <= 2) return 'lightyellow';
            else if (value <= 5) return 'yellow';
            else if (value <= 10) return 'orange';
            else if (value <= 20) return 'red';
            return 'darkred';        

        case 'wind_speed_10m_max':
            if (value <= 7.2) return 'lightblue';
            else if (value <= 18) return 'blue';
            else if (value <= 36) return 'darkblue';
            else if (value <= 54) return 'purple';
            return 'darkpurple';
        
        case 'wind_gusts_10m_max':
            if (value <= 18) return 'lightblue';
            else if (value <= 36) return 'blue';
            else if (value <= 72) return 'darkblue';
            else if (value <= 108) return 'purple';
            return 'darkpurple';
            
        case 'et0_fao_evapotranspiration':
            if (value <= 1) return 'lightgreen';
            else if (value <= 3) return 'green';
            else if (value <= 5) return 'yellow';
            else if (value <= 7) return 'orange';
            return 'red';

        default:
            return 'gray';
    }
}


function getPointsWithinBoundary(corners , area) {
    const minLat = Math.min(...corners.map(c => c.lat));
    const maxLat = Math.max(...corners.map(c => c.lat));
    const minLon = Math.min(...corners.map(c => c.lon));
    const maxLon = Math.max(...corners.map(c => c.lon));

    let step;
    if (area < 1000) {
        step = 0.05;
    } else if (area < 10000) {
        step = 0.1;
    } else if (area < 100000) {
        step = 0.2;
    } else if (area < 1000000) {
        step = 1;
    } else {
        step = 2;
    }
    const pointsWithinBoundary = [];
    for (let lat = minLat; lat <= maxLat; lat += step) {
        for (let lon = minLon; lon <= maxLon; lon += step) {
            pointsWithinBoundary.push({ lat: lat, lon: lon });
        }
    }
    return pointsWithinBoundary;
}

function clearWarnings() {
    const warningsContainer = document.getElementById("warning-container");

    while (warningsContainer.children.length > 2) {
        const lastChild = warningsContainer.lastChild; // Get the last child
        if (lastChild && lastChild.parentNode === warningsContainer) {
            warningsContainer.removeChild(lastChild); // Remove last child if it's a child of warningsContainer
        } else {
            console.warn('not child of warnings container:', lastChild);
            break;
        }
    }
}


function calculateStandardDeviation(values, area) {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

    const squaredDifferences = values.map(value => {
        const difference = value - mean;
        return difference * difference;
    });

    const averageSquaredDifference = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;

    let diversity = Math.sqrt(averageSquaredDifference);
    console.log("std", diversity);
    let container = document.getElementById("warning-container");
    let warningTemplate = document.getElementById('warning-template');
    let clone = document.importNode(warningTemplate.content, true);
    let div = clone.querySelector(".warning");

    if (area == area1) {
        div.querySelector(".warning-title").textContent = "Map 1 - ";
    }
    if (area == area2) {
        div.querySelector(".warning-title").textContent = "Map 2 - ";
    }
    if (0 <= diversity && diversity < 1) {
            div.querySelector(".warning-title").textContent += "Variation: Low - No Potential Issues";
            div.style.backgroundColor = "rgba(100, 149, 237, 0.7)";
            div.addEventListener('mouseenter', () => {
                div.style.backgroundColor = "rgba(100, 149, 237, 0.5)";
            });
            div.addEventListener('mouseleave', () => {
                div.style.backgroundColor = "rgba(100, 149, 237, 0.7)";
            });
            container.appendChild(clone);
            return 0;
    }
    else if (1 < diversity && diversity < 2) {
        div.querySelector(".warning-title").textContent += "Variation: Mild - Low Risk";
        div.style.backgroundColor = "rgba(144, 238, 144, 0.6)";
        div.addEventListener('mouseenter', () => {
            div.style.backgroundColor = "rgba(144, 238, 144, 0.5)";
        });
        div.addEventListener('mouseleave', () => {
            div.style.backgroundColor = "rgba(144, 238, 144, 0.6)";
        });
        container.appendChild(clone);
        return 1;
    }
    else if (2 < diversity && diversity < 4) {
        div.querySelector(".warning-title").textContent += "Variation: Moderate - Potential Risk - Consider Reducing Scope";
        div.style.backgroundColor = "rgba(255, 224, 102, 0.8)";
        div.addEventListener('mouseenter', () => {
            div.style.backgroundColor = "rgba(255, 215, 0, 0.7)";
        });
        div.addEventListener('mouseleave', () => {
            div.style.backgroundColor = "rgba(255, 224, 102, 0.8)";
        });
        container.appendChild(clone);
        return 2;
    }
    else if (4 < diversity && diversity < 8) {
        div.querySelector(".warning-title").textContent += "Variation: Significant - High Risk - Highly Reccomend Reducing Scope";
        div.style.backgroundColor = "rgba(255, 179, 102, 0.95)";
        div.addEventListener('mouseenter', () => {
            div.style.backgroundColor = "rgba(255, 179, 102, 0.7)";
        });
        div.addEventListener('mouseleave', () => {
            div.style.backgroundColor = "rgba(255, 179, 102, 0.95)";
        });
        container.appendChild(clone);
        return 3;
    }
    else {
        div.querySelector(".warning-title").textContent += "Variation: Extreme - Maximal Risk - Reduce Scope Immediately";
        div.style.backgroundColor = "rgba(255, 102, 102, 0.9)";
        div.addEventListener('mouseenter', () => {
            div.style.backgroundColor = "rgba(255, 102, 102, 0.7)";
        });
        div.addEventListener('mouseleave', () => {
            div.style.backgroundColor = "rgba(255, 102, 102, 0.9)";
        });
        container.appendChild(clone);
        return 4;
    }

}

function calculateDataDifferences(featureData1, featureData2) {
    let sum = 0;
    console.log("feturedata1", featureData1);
    console.log("featuredata2", featureData2);
    console.log('length', featureData1.length);
    for (let i = 0; i<featureData1.length; i++) {
        sum += featureData1[i];
    }
    let avg1 = sum/featureData1.length;

    sum = 0;
    for (let i = 0; i<featureData2.length; i++) {
        sum += featureData2[i];
    }
    let avg2 = sum/featureData2.length;

    largerAvg = Math.max(avg1, avg2);
    smallerAvg = Math.min(avg1, avg2);
    console.log("largerAvg", largerAvg);

    let falseAvg = 0;
    let percentDiff;
    if (smallerAvg == 0) {
        percentDiff = 0;
    }
    else {
        percentDiff = (largerAvg-smallerAvg)/smallerAvg*100;
    }
    console.log("percentDiff", percentDiff);
    let container = document.getElementById("warning-container");
    let warningTemplate = document.getElementById('warning-template');
    let clone = document.importNode(warningTemplate.content, true);
    let div = clone.querySelector(".warning");
    let diversity = Math.max(diversity1, diversity2);
    console.log("diversity", diversity);
    if (0 <= percentDiff && percentDiff < 20) {
        if (diversity > 2) {
            falseAvg = diversity;
        }
        else {
            div.querySelector(".warning-title").textContent += "Data Value Differences: Low - No Potential Issues";
            div.style.backgroundColor = "rgba(100, 149, 237, 0.7)";
            div.addEventListener('mouseenter', () => {
                div.style.backgroundColor = "rgba(100, 149, 237, 0.5)";
            });
            div.addEventListener('mouseleave', () => {
                div.style.backgroundColor = "rgba(100, 149, 237, 0.7)";
            });
            container.appendChild(clone);
        }
    }
    else if (20 < percentDiff && percentDiff < 35) {
        if (diversity > 2) {
            falseAvg = diversity;
        }
        else {
            div.querySelector(".warning-title").textContent += "Data Value Differences: Mild - Low Risk";
            div.style.backgroundColor = "rgba(144, 238, 144, 0.6)";
            div.addEventListener('mouseenter', () => {
                div.style.backgroundColor = "rgba(144, 238, 144, 0.5)";
            });
            div.addEventListener('mouseleave', () => {
                div.style.backgroundColor = "rgba(144, 238, 144, 0.6)";
            });
            container.appendChild(clone);
        }
    }
    else if (35 < percentDiff && percentDiff < 55) {
        if (diversity > 2) {
            falseAvg = diversity;
        }
        else {
            div.querySelector(".warning-title").textContent += "Data Value Differences (Map 1 vs Map 2): Moderate - Potential Risk";
            div.style.backgroundColor = "rgba(255, 224, 102, 0.8)";
            div.addEventListener('mouseenter', () => {
                div.style.backgroundColor = "rgba(255, 215, 0, 0.7)";
            });
            div.addEventListener('mouseleave', () => {
                div.style.backgroundColor = "rgba(255, 224, 102, 0.8)";
            });
            container.appendChild(clone);
        }
    }
    else if (55 < percentDiff && percentDiff < 70 || falseAvg == 3) {
        div.querySelector(".warning-title").textContent += "Data Value Differences: Significant - High Risk";
        div.style.backgroundColor = "rgba(255, 179, 102, 0.95)";
        div.addEventListener('mouseenter', () => {
            div.style.backgroundColor = "rgba(255, 179, 102, 0.7)";
        });
        div.addEventListener('mouseleave', () => {
            div.style.backgroundColor = "rgba(255, 179, 102, 0.95)";
        });
        container.appendChild(clone);
    }
    else {
        div.querySelector(".warning-title").textContent += "Data Value Differences: Extreme - Address Immediately";
        div.style.backgroundColor = "rgba(255, 102, 102, 0.9)";
        div.addEventListener('mouseenter', () => {
            div.style.backgroundColor = "rgba(255, 102, 102, 0.7)";
        });
        div.addEventListener('mouseleave', () => {
            div.style.backgroundColor = "rgba(255, 102, 102, 0.9)";
        });
        container.appendChild(clone);
    }

}

function calculateSeasonalEquivalentDay(currentDate, latitude) {
    const isSouthernHemisphere = latitude < 0;

    // Determine the start of the current season based on the hemisphere
    const seasonStart = getSeasonStart(currentDate, isSouthernHemisphere);
    const daysIntoSeason = Math.floor(
        (currentDate - seasonStart) / (1000 * 60 * 60 * 24)
    );

    // Adjust date to match an equivalent season in the opposite hemisphere
    const equivalentSeasonStart = getEquivalentSeasonStart(seasonStart, isSouthernHemisphere);
    const equivalentDate = new Date(equivalentSeasonStart);
    equivalentDate.setDate(equivalentDate.getDate() + daysIntoSeason);

    return {
        day: equivalentDate.getDate(),
        month: equivalentDate.getMonth() + 1, // Months are 0-indexed
        year: equivalentDate.getFullYear()
    };
}

function getSeasonStart(currentDate, isSouthernHemisphere) {
    const year = currentDate.getFullYear();
    if (isSouthernHemisphere) {
        return new Date(year, 8, 21); // September 21 - Spring in Southern Hemisphere
    } else {
        return new Date(year, 2, 21); // March 21 - Spring in Northern Hemisphere
    }
}

function getEquivalentSeasonStart(seasonStart, isSouthernHemisphere) {
    const year = seasonStart.getFullYear();
    if (isSouthernHemisphere) {
        return new Date(year, 2, 21); // March 21 - Spring in Northern Hemisphere
    } else {
        return new Date(year, 8, 21); // September 21 - Spring in Southern Hemisphere
    }
}
