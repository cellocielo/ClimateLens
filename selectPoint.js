const map1 = L.map('map-1').setView([0, 0], 2);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map1);


const drawnItems1 = new L.FeatureGroup();
map1.addLayer(drawnItems1);

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

map1.addControl(drawControl1);

map1.on('draw:created', function (event) {
    var layer = event.layer;
    drawnItems1.addLayer(layer);
    const shapeGeoJSON = layer.toGeoJSON();
    if (!window.drawnShapes) {
        window.drawnShapes = [];
    }
    window.drawnShapes.push(shapeGeoJSON);
});

document.getElementById('submit').addEventListener('click', function() {
    const geoJson1 = drawnItems1.toGeoJSON();
    console.log("shape", geoJson1);
    const coordinates = geoJson1.features[0].geometry.coordinates;
    localStorage.setItem("pointCoordinate", JSON.stringify(coordinates));
});