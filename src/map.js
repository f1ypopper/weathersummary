import { Feature, View, Map, Overlay } from 'ol';
import { Style, Icon } from 'ol/style';
import Point from 'ol/geom/Point';
import { OSM, Vector } from 'ol/source';
import Tile from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { Progress } from './progress';

let iconName = 'marker';
let username = "test";
const db = window.db;
const progress = new Progress(document.getElementById('progress'));
const source = new OSM();
let mediaRecorder;
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log("getUsrMedia supported.");
    navigator.mediaDevices.getUserMedia({ audio: true, },).then((stream) => {
        mediaRecorder = new MediaRecorder(stream);
     }).catch((err) => {
        console.error(`The following getUserMedia error occurred: ${err}`);
    })
}else{
    console.log("getUserMedia not supported on your browser");
}
source.on('tileloadstart', function () {
    progress.addLoading();
});
source.on(['tileloadend', 'tileloaderror'], function () {
    progress.addLoaded();
});
const popOverElement = document.getElementById('popup');
const popup = new Overlay({
    element: popOverElement,
    positioning: 'bottom-center',
    stopEvent: false,
});
let map = new Map({
    target: 'map',
    layers: [
        new Tile({
            source: source,
        }),
    ],
    overlays: [popup],
    view: new View({
        center: [0, 0],
        zoom: 2,
    }),
});
export function changeIconName(name) {
    iconName = name;
}

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
    });
    iconFeature.setStyle(iconStyle);
    return iconFeature;
}

let popover;
function disposePopover() {
    if (popover) {
        popover.dispose();
        popover = undefined;
    }
}

let vectorSource = null;
let vectorLayer = null;

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
    db.addPoint(username, x, y, iconName).then((_) => {
        vectorSource.addFeature(createIcon({ username: username, x: x, y: y, icon: iconName }));
        console.log(vectorLayer.source);
        popup.setPosition(event.coordinate);
        popover = new bootstrap.Popover(popOverElement, {
            placement: 'top',
            html: true,
            content: 'HI',
        });
        popover.show();
    });
}

export function pointerDown(event){
    console.log("Pointer Down");
}

map.on("click", function (event) {
    const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => { return feature; });
    disposePopover();
    if (!feature) {
        createNewPoint(event.coordinate[0], event.coordinate[1], event);
    } else {
        popup.setPosition(event.coordinate);
        popover = new bootstrap.Popover(popOverElement, {
            placement: 'top',
            html: true,
            content: "<img src='./img/mic.png'>",
        });
        popover.show();
    }
});
map.on('movestart', disposePopover);