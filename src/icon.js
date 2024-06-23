import { Feature, Overlay } from 'ol';
import { Style, Icon } from 'ol/style';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { AudioRecordControl, NotificationControl, SymbolControl } from './map_controls';

const db = window.db;
let username = "test";
let iconName = 'marker';
let popover;
let vectorSource = null;
let vectorLayer = null;
let map = null;
let chunks = [];
let audioblob = new Blob([], { type: "audio/ogg; codecs=opus" });
let mediaRecorder;
const popOverElement = document.getElementById('popup');
const popup = new Overlay({
    element: popOverElement,
    positioning: 'bottom-center',
    stopEvent: false,
});
function disposePopover() {
    if (popover) {
        popover.dispose();
        popover = undefined;
    }
}
function changeIconName(name) {
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
        audio: point.audio
    });
    iconFeature.setStyle(iconStyle);
    return iconFeature;
}
db.getPoints().then((points) => {
    let features = [];
    points.forEach((point) => {
        const iconFeature = createIcon(point);
        features.push(
            iconFeature
        );
    })

    vectorSource = new VectorSource({
        features: features,
    });

    vectorLayer = new VectorLayer({
        source: vectorSource,
    });
    map.addLayer(vectorLayer);
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

export function handleIconMode(event) {
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

export function initIconMode(m) {
    map = m;
    map.addOverlay(popup);
    setupAudio();
    map.addControl(new AudioRecordControl(mediaRecorder));
    map.addControl(new SymbolControl(changeIconName));
    map.on('movestart', disposePopover);
}

function handleRecordingStop(_) {
    audioblob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
    chunks = [];
}
function setupAudio() {
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
}