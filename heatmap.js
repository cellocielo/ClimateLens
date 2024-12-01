

function getZoomLevel(area) {
    if (area < 1000) return 12;
    if (area < 10000) return 10;
    if (area < 100000) return 8;
    return 5;
}
const boundaryPoints1 = JSON.parse(localStorage.getItem("boundaryPoints1")) || [];

const area1 = localStorage.getItem("area1");
const zoomLevel1 = getZoomLevel(area1);

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
const map1 = L.map('map-1').setView([centroid1.lat, centroid1.lon], zoomLevel1);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map1);

const drawnItems1 = new L.FeatureGroup();
map1.addLayer(drawnItems1);

const points1 = getPointsWithinBoundary(boundaryPoints1, area1);

const toggleButton = document.getElementById("toggle-sidebar");
const sidebar = document.getElementById("sidebar");
let unit;
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
                loadHeatMaps(points1, selectedRadio.value, area1);

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
                    daylight_duration: 'seconds',
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
                    precipitation_sum: [0, 4, 8, 16, 32],
                    daylight_duration: [0, 10000, 30000, 50000, 86400],
                    snowfall_sum: [0, 10, 25, 50, 75],
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
                });
            }
        }
    });
let featureData1;

async function getClimateData(points, feature) {
    const climateData = [];
    try {
        for (let i = 0; i < points.length; i++) {
            const data = await (loadInfo(points[i].lat, points[i].lon, feature));
            climateData.push(data);
        }
        console.log("Climate Data:", climateData);

        await generateHeatMapData(climateData, feature);
        
    } catch (error) {
        console.error("Error loading climate data:", error);
    }
}

async function loadInfo(lat, lon, feature) {
    let url;
    const dataset = JSON.parse(localStorage.getItem("datasets"));
    const day = dataset[0].day;
    const month = dataset[0].month;
    const year = dataset[0].year;
    url = `http://127.0.0.1:5000/daily-dataframe?latitude=${lat}&longitude=${lon}&feature=${feature}&day=${day}&month=${month}&year=${year}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to fetch data: ${errorMessage}`);
        }
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
        console.error("Error in fetchWeatherData:", error);
        throw error;
    }
}

async function loadHeatMaps(points1, feature, area1, centroid1) {
    const loadingScreen = document.querySelector(".loading-screen");
    try {
        loadingScreen.style.display = "flex";
        await getClimateData(points1, feature, area1, centroid1);
    } catch (error) {
        console.error("Error loading heatmaps:", error);
    } finally {
        loadingScreen.style.display = "none";
    }
}

async function generateHeatMapData(data, feature) {
    const heatmapData = [];
    for (let i = 0; i<data.length; i++) {
        heatmapData.push([data[i].lat, data[i].lon, data[i][feature]]);
    }
    console.log("heatmapData: ", heatmapData);
    for (let i = 0; i<heatmapData.length; i++) {
        const color = getColorForValue(heatmapData[i][2], feature);
        console.log("data:", heatmapData[i][2], "color: ", color);
        const marker = L.circleMarker([heatmapData[i][0], heatmapData[i][1]], {
            color: 'black',
            fillColor: color,
            fillOpacity: 0.5,
            opacity: 0.5,
            radius: 12,
            weight: 1,
        }).addTo(map1);
        marker.bindPopup(`${heatmapData[i][2].toFixed(3)} ` + unit);
        marker.addTo(map1);
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

function getColorForValue(value, feature) {
    value = Number(value)
    switch (feature) {
        case 'temperature_2m_max':
        case 'temperature_2m_min':
            if (value <= -20) return 'darkblue';
            else if (value <= 0) return 'blue';
            else if (value <= 10) return 'lightblue';
            else if (value <= 20) return 'yellow';
            else if (value <= 30) return 'orange';
            else if (value <= 40) return 'red';
            else if (value <= 50) return 'darkred';

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
            else if (value <= 75) return 'purple';
            return 'black';

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