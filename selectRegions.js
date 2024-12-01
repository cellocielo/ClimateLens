const map1 = L.map('map-1').setView([0, 0], 2);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map1);


const map2 = L.map('map-2').setView([0, 0], 2);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map2);

const drawnItems1 = new L.FeatureGroup();
const drawnItems2 = new L.FeatureGroup();
map1.addLayer(drawnItems1);
map2.addLayer(drawnItems2);

const drawControl1 = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems1
    },
    draw: {
        polygon: true,
        polyline: true,
        rectangle: true,
        circle: true,
        marker: true,
    }
});

const drawControl2 = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems2
    },
    draw: {
        polygon: true,
        polyline: true,
        rectangle: true,
        circle: true,
        marker: true,
    }
});

map1.addControl(drawControl1);
map2.addControl(drawControl2);

// Event listeners for map1
map1.on('draw:created', function (event) {
    var layer = event.layer;
    drawnItems1.addLayer(layer);
    const shapeGeoJSON = layer.toGeoJSON();
    if (!window.drawnShapes) {
        window.drawnShapes = [];
    }
    window.drawnShapes.push(shapeGeoJSON);
});

// Event listeners for map2
map2.on('draw:created', function (event) {
    var layer = event.layer;
    drawnItems2.addLayer(layer);
    const shapeGeoJSON = layer.toGeoJSON();
    if (!window.drawnShapes) {
        window.drawnShapes = [];
    }
    window.drawnShapes.push(shapeGeoJSON);
});

document.getElementById('submit').addEventListener('click', function() {
    if (drawnItems1.getLayers().length === 0) {
        alert("Please draw a shape before submitting.");
        return;
    }

    const geoJson1 = drawnItems1.toGeoJSON();
    const coordinates1 = geoJson1.features[0].geometry.coordinates;
    const innerCoordinates1 = coordinates1[0];
    const boundaryPoints1 = innerCoordinates1.map(coord => {
        return { lat: coord[1], lon: coord[0] };
    });
    boundaryPoints1.pop();
    const polygon1 = turf.polygon([innerCoordinates1]);
    const area1 = turf.area(polygon1)/1000000;
    localStorage.setItem("area1", area1);
    localStorage.setItem("boundaryPoints1", JSON.stringify(boundaryPoints1));

    if (drawnItems1.getLayers().length === 0) {
        alert("Please draw a shape before submitting.");
        return;
    }

    const geoJson2 = drawnItems2.toGeoJSON();
    const coordinates2 = geoJson2.features[0].geometry.coordinates;
    const innerCoordinates2 = coordinates2[0];
    const boundaryPoints2 = innerCoordinates2.map(coord => {
        return { lat: coord[1], lon: coord[0] };
    });
    boundaryPoints1.pop();
    const polygon2 = turf.polygon([innerCoordinates2]);
    const area2 = turf.area(polygon2)/1000000;
    localStorage.setItem("area2", area2);
    localStorage.setItem("boundaryPoints2", JSON.stringify(boundaryPoints2));
});

