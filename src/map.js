import { Feature, View, Map, Overlay } from 'ol';
import { Style, Icon } from 'ol/style';
import Point from 'ol/geom/Point';
import { OSM, Vector } from 'ol/source';
import Tile from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { Progress } from './progress';
import { defaults as defaultControls } from 'ol/control';
import { SymbolControl, AudioRecordControl, NotificationControl } from './map_controls';
let iconName = 'marker';
let username = "test";
const db = window.db;
const progress = new Progress(document.getElementById('progress'));
const source = new OSM();
let mediaRecorder;
let chunks = [];
let audioblob = new Blob([], { type: "audio/ogg; codecs=opus" });

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

const map = new Map({
    controls: defaultControls().extend([new SymbolControl(changeIconName), new AudioRecordControl(mediaRecorder), new NotificationControl()]),
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

map.on("click", function (event) {
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
});
map.on('movestart', disposePopover);