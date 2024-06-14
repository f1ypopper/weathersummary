import { Feature, View, Map, Overlay } from 'ol';
import { Style, Icon } from 'ol/style';
import Point from 'ol/geom/Point';
import { OSM, Vector } from 'ol/source';
import Tile from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { Progress } from './progress';
import { Control, Rotate } from 'ol/control.js'
import { defaults as defaultControls } from 'ol/control';
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
} else {
    console.log("getUserMedia not supported on your browser");
}
source.on('tileloadstart', function () {
    progress.addLoading();
});
source.on(['tileloadend', 'tileloaderror'], function () {
    progress.addLoaded();
});
export function changeIconName(name) {
    iconName = name;
}
const popOverElement = document.getElementById('popup');
const popup = new Overlay({
    element: popOverElement,
    positioning: 'bottom-center',
    stopEvent: false,
});

class SymbolControl extends Control {
  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = 'Symbols';
    button.classList = ['btn', 'btn-secondary', 'dropdown-toggle'];
    button.setAttribute('data-bs-toggle', "dropdown");
    button.style.minWidth = 'fit-content';
    const element = document.createElement('div');
    element.className = 'symbol-control ol-unselectable ol-control';
    let menu = document.createElement('ul');
    menu.className = "dropdown-menu";
    menu.style.width = 'fit-content';
    menu.style.minWidth = 'fit-content';
    let icons = ['marker', 'house', 'building', 'hotel'];
    for (let icon of icons){
        let item = document.createElement('li');
        item.onclick = function(){changeIconName(icon)};
        let img = document.createElement('img');
        img.setAttribute('src', `img/${icon}.png`);
        item.appendChild(img);
        menu.appendChild(item);
    }
    element.appendChild(button);
    element.appendChild(menu);
    super({
      element: element,
      target: options.target,
    });

  }
}

class AudioRecordControl extends Control{
    constructor(opt_options){
        const options = opt_options || {};
        let span = document.createElement('span');
        span.className = "fa-stack fa-1x";
        let circle = document.createElement('i');
        circle.className = "fas fa-circle fa-stack-2x";
        circle.style.color = "white";
        let mic = document.createElement('i');
        mic.style.color = "#666666";
        mic.className = "fas fa-microphone fa-stack-1x";
        span.appendChild(circle);
        span.appendChild(mic);
        const element = document.createElement('div');
        element.className = 'audio-control ol-unselectable ol-control';
        element.style.opacity = 'transparent';
        element.appendChild(span);
        element.style.minWidth = 'fit-content';
        super({
            element: element,
            target: options.target,
        });
        this.mic = mic;
        this.circle = circle;
        this.isRecording = false;
        span.addEventListener('click', this.handleRecord.bind(this), false);
    }

    handleRecord(){
        console.log("RECORDING STARTED");
        if (!this.isRecording){
            this.mic.className = 'fas fa-pause fa-stack-1x';
            this.mic.style.color = 'white';
            this.circle.style.color = "Tomato";
            this.isRecording = true;
        }else{
            this.mic.className = 'fas fa-microphone fa-stack-1x';
            this.mic.style.color = "#666666";
            this.circle.style.color = "white";
            this.isRecording = false;
        }
    }
}

const map = new Map({
    controls: defaultControls().extend([new SymbolControl(), new AudioRecordControl()]),
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

export function pointerDown(event) {
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