import { Feature, View, Map, Overlay } from 'ol';
import { Style, Icon, Circle, Fill, Stroke } from 'ol/style';
import Point from 'ol/geom/Point';
import { OSM, Vector } from 'ol/source';
import Tile from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { Progress } from './progress';
import { toLonLat, fromLonLat, transform as projTransform, Projection, addCoordinateTransforms, addProjection } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import Polyline from 'ol/format/Polyline';
import { SymbolControl, AudioRecordControl, NotificationControl } from './map_controls';
import Openrouteservice from 'openrouteservice-js'
import { Geometry, LineString } from 'ol/geom';
let iconName = 'marker';
let username = "test";
const db = window.db;
const progress = new Progress(document.getElementById('progress'));
const source = new OSM();
let mediaRecorder;
let chunks = [];
let audioblob = new Blob([], { type: "audio/ogg; codecs=opus" });
let directionMode = true;
function handleRecordingStop(_) {
    audioblob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
    chunks = [];
}

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log("getUsrMedia supported.");
    navigator.mediaDevices.getUserMedia({ audio: true, },).then((stream) => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
            chunks.push(e.data);
        };
        mediaRecorder.onstop = handleRecordingStop;
    }).catch((err) => {
        audioblob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        console.error(`The following getUserMedia error occurred: ${err}`);
    })
} else {
    audioblob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
    console.log("getUserMedia not supported on your browser");
}
source.on('tileloadstart', function () {
    progress.addLoading();
});
source.on(['tileloadend', 'tileloaderror'], function () {
    progress.addLoaded();
});
function changeIconName(name) {
    iconName = name;
}
const popOverElement = document.getElementById('popup');
const popup = new Overlay({
    element: popOverElement,
    positioning: 'bottom-center',
    stopEvent: false,
});
let vectorSource = null;
let vectorLayer = null;

let routeSource = new Vector();
let routeLayer = new VectorLayer({
    source: routeSource,
});
const map = new Map({
    controls: defaultControls().extend([new SymbolControl(changeIconName), new AudioRecordControl(mediaRecorder), new NotificationControl()]),
    target: 'map',
    layers: [
        new Tile({
            source: source,
        }),
        routeLayer
    ],
    overlays: [popup],
    view: new View({
        center: [0, 0],
        zoom: 2,
    }),
});

function createIcon(point) {
    const iconStyle = new Style({
        image: new Icon({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            src: `img/${point.icon}.png`,
        }),
    });
    const iconFeature = new Feature({
        geometry: new Point([point.x, point.y]),
        name: point.username,
        audio: point.audio
    });
    iconFeature.setStyle(iconStyle);
    return iconFeature;
}

function addPoint(coordinates, color) {
    const circleStyle = new Style({
        image: new Circle({
            radius: 6,
            fill: new Fill({ color: color }),
            stroke: new Stroke({ color: "black", width: 2 })
        })
    });

    const circleFeature = new Feature({
        geometry: new Point(coordinates),
    });
    circleFeature.setStyle(circleStyle);
    return circleFeature;
}

let popover;
function disposePopover() {
    if (popover) {
        popover.dispose();
        popover = undefined;
    }
}

db.getPoints().then((points) => {
    let features = [];
    points.forEach((point) => {
        const iconFeature = createIcon(point);
        features.push(
            iconFeature
        );
    })

    vectorSource = new Vector({
        features: features,
    });

    vectorLayer = new VectorLayer({
        source: vectorSource,
    });
    map.addLayer(vectorLayer);
});

map.on('loadstart', function () {
    progress.show();
});
map.on('loadend', function () {
    progress.hide();
});

function createNewPoint(x, y, event) {
    audioblob.arrayBuffer().then((audiobuffer) => {
        db.addPoint(username, x, y, iconName, audiobuffer).then((_) => {
            vectorSource.addFeature(createIcon({ username: username, x: x, y: y, icon: iconName, audio: audiobuffer }));
            popup.setPosition(event.coordinate);
            let audioUrl = window.URL.createObjectURL(audioblob);
            let audioPlayer = document.createElement('audio');
            audioPlayer.style.width = '200px';
            audioPlayer.setAttribute("controls", "");
            audioPlayer.src = audioUrl;
            popover = new bootstrap.Popover(popOverElement, {
                placement: 'top',
                html: true,
                content: audioPlayer,
            });
            popover.show();
        });
    });
}

function handleIconMode(event) {
    const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => { return feature; });
    disposePopover();
    if (!feature) {
        createNewPoint(event.coordinate[0], event.coordinate[1], event);
    } else {
        popup.setPosition(event.coordinate);
        let audiobuf = feature.get('audio');
        let blob = new Blob([audiobuf], { type: "audio/ogg; codecs=opus" });
        let audioUrl = window.URL.createObjectURL(blob);
        let audioPlayer = document.createElement('audio');
        audioPlayer.style.width = '200px';
        audioPlayer.setAttribute("controls", "");
        audioPlayer.src = audioUrl;
        popover = new bootstrap.Popover(popOverElement, {
            placement: 'top',
            html: true,
            content: audioPlayer,
        });
        popover.show();
    }
}

let startPoint = null;
let endPoint = null;
let routeLine = null;
let orsDirections = new Openrouteservice.Directions({ api_key: "5b3ce3597851110001cf624850a09fa01da2494b825165c544441b76" });

function coordsToORS(coords) {
    return toLonLat(projTransform(coords, "EPSG:3857", "EPSG:4326"), "EPSG:4326");
}

async function getRoute(startCoords, endCoords) {
    let response = await orsDirections.calculate({
        coordinates: [startCoords, endCoords],
        profile: 'driving-hgv',
        format: 'json'
    })
    return response;
}

function drawRoute(polyline) {
    let routePoints = new Polyline({
        factor: 1e6,
    }).readGeometry(polyline, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
    });

    //NOTE: points seem to be scaled down by 10 in route geometry
    //hence point placed in atlanta gets a route placed in africa
    const tranformedRoutePoints = routePoints.getCoordinates().map((coord) => { return toLonLat(coord).map(c => c * 10); }).map((coord) => fromLonLat(coord));

    const routeStyle = new Style({
        stroke: new Stroke({
            width: 6,
            color: [237, 212, 0, 0.8],
        }),
    });
    routeLine = new Feature(new LineString(tranformedRoutePoints));
    routeLine.setStyle(routeStyle);
    routeSource.addFeature(routeLine);
}

async function handleDirectionMode(event) {
    const coordinate = event.coordinate;
    if (startPoint == null) {
        startPoint = addPoint(coordinate, "white");
        routeSource.addFeature(startPoint);
    } else {
        if (endPoint == null) {
            endPoint = addPoint(coordinate, "black");
            routeSource.addFeature(endPoint);
        } else {
            routeSource.removeFeature(startPoint);
            routeSource.removeFeature(endPoint);
            startPoint = addPoint(coordinate, "white");
            routeSource.addFeature(startPoint);
            endPoint = null;
            if (routeLine != null) {
                routeSource.removeFeature(routeLine);
                routeLine = null;
            }
        }
    }
    if (startPoint !== null && endPoint !== null) {
        const orsStart = coordsToORS(startPoint.getGeometry().getCoordinates());
        const orsEnd = coordsToORS(endPoint.getGeometry().getCoordinates());
        let response = null;
        try {
            response = await getRoute(orsStart, orsEnd);
        } catch (e) {
            //console.log(`response err: ${e}`, e);
            console.log(e);
        }
        if (response === null) {
            return
        }
        let polyline = response.routes[0].geometry;
        drawRoute(polyline);
    }
}

map.on("click", async function (event) {
    if (!directionMode) {
        handleIconMode(event);
    } else {
        await handleDirectionMode(event);
    }
});

map.on('movestart', disposePopover);