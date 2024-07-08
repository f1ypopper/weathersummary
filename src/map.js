import { View, Map } from 'ol';
import OSM from 'ol/source/OSM';
//import Tile from 'ol/layer/Tile';
import TileLayer from 'ol/layer/WebGLTile';
import { Progress } from './progress';
import { NotificationControl, DirectionControl } from './map_controls';
import { initIconMode, handleIconMode } from './icon';
import { initDirectionMode, handleDirectionMode } from './route';
import { defaults as defaultControls } from 'ol/control';

const progress = new Progress(document.getElementById('progress'));
const source = new OSM();
let directionMode = false;

source.on('tileloadstart', function () {
    progress.addLoading();
});
source.on(['tileloadend', 'tileloaderror'], function () {
    progress.addLoaded();
});

function toggleMode(mode) {
    directionMode = mode;
}
const imageVariables = {
    brightness: 0,
    contrast: 0
};
const tileLayer = new TileLayer({
    source: source,
    style: {
        contrast: ['var', 'contrast'],
        brightness: ['var', 'brightness'],
        variables: imageVariables
    }
});
const map = new Map({
    target: 'map',
    controls: defaultControls().extend([new NotificationControl(), new DirectionControl(toggleMode, directionMode)]),
    layers: [
        tileLayer
    ],
    view: new View({
        center: [0, 0],
        zoom: 2,
    }),
});

initIconMode(map);
initDirectionMode(map);

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