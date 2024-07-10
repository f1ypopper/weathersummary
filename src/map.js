import { View, Map } from 'ol';
import OSM from 'ol/source/OSM';
//import Tile from 'ol/layer/Tile';
import TileLayer from 'ol/layer/WebGLTile';
import { Progress } from './progress';
import { NotificationControl, DirectionControl } from './map_controls';
import { initIconMode, handleIconMode } from './icon';
import { initDirectionMode, handleDirectionMode } from './route';
import { defaults as defaultControls } from 'ol/control';
import { GeoTIFF } from 'ol/source';

const progress = new Progress(document.getElementById('progress'));
let source;
async function createSourceLayer() {
    const blob = await fetch('sample.tif').then((response) => response.blob()).then((blob) => {
        return blob;
    });
    const source = new GeoTIFF({
        sources: [
            {
                blob: blob,
            }
        ],
    });
    source.on('tileloadstart', function () {
        progress.addLoading();
    });
    source.on(['tileloadend', 'tileloaderror'], function () {
        progress.addLoaded();
    });
    return source;
}

let directionMode = false;

function toggleMode(mode) {
    directionMode = mode;
}
const imageVariables = {
    brightness: 0,
    contrast: 0
};

let map;
async function createMap() {
    const view = source.getView();
    const tileLayer = new TileLayer({
        source: source,
        style: {
            contrast: ['var', 'contrast'],
            brightness: ['var', 'brightness'],
            variables: imageVariables
        }
    });
    let map = new Map({
        target: 'map',
        controls: defaultControls().extend([new NotificationControl(), new DirectionControl(toggleMode, directionMode)]),
        layers: [
            tileLayer
        ],
        view: view
    });
    map.on('loadstart', function () {
        progress.show();
    });
    map.on('loadend', function () {
        progress.hide();
    });

    map.on("click", async function (event) {
        if (!directionMode) {
            handleIconMode(event);
        } else {
            await handleDirectionMode(event);
        }
    });

    for (let variable in imageVariables) {
        const name = variable;
        const element = document.getElementById(name);
        const value = imageVariables[name];
        element.value = value.toString();
        document.getElementById(name + '-value').innerText = value.toFixed(2);
        element.addEventListener('input', function (event) {
            const value = parseFloat(event.target.value);
            document.getElementById(name + '-value').innerText = value.toFixed(2);
            const updates = {};
            updates[name] = value;
            tileLayer.updateStyleVariables(updates);
        });
    }
    return map;
}
async function initComponents() {
    source = await createSourceLayer();
    map = await createMap();
}

initComponents().then(() => {
    initIconMode(map);
    initDirectionMode(map);
});
