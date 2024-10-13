import { View, Map } from "ol";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/WebGLTile";
import { Progress } from "./progress";
import { initIconMode, handleIconMode } from "./icon";
import { initRouteMode, handlemapMode } from "./route";
import {initNotificationMode} from "./notification";
import { defaults as defaultControls } from "ol/control";

const progress = new Progress(document.getElementById("progress"));
const modeToggleButton = document.getElementById("routetoggle");
const source = new OSM();
const mapModes = ["route", "marker", "notification"];
let mapMode = "route";

source.on("tileloadstart", function () {
  progress.addLoading();
});
source.on(["tileloadend", "tileloaderror"], function () {
  progress.addLoaded();
});

document
  .getElementById("notificationtoggle")
  .addEventListener("click", () => setMode("notification"));

modeToggleButton.addEventListener("click", () => {
    if(modeToggleButton.value === "route"){
        setMode("marker");
    }else{
        setMode("route");
    }
});

function changeModeDetailBar(newMode){
    document.getElementById(mapMode+"-details").hidden = true;
    document.getElementById(newMode+"-details").hidden = false;
}

function setMode(mode) {
    //change the map mode
    //show the new mode details and hide the previous mode details
    switch (mode){
        case "route":{
            modeToggleButton.value = "route";
            document.getElementById("route-symbol").hidden = false;
            document.getElementById("marker-symbol").hidden = true;
            break;
        }
        case "marker":{
            modeToggleButton.value = "marker";
            document.getElementById("marker-symbol").hidden = false;
            document.getElementById("route-symbol").hidden = true;
            break;
        }
    }
    changeModeDetailBar(mode);
    mapMode = mode;
}

const imageVariables = {
  brightness: 0,
  contrast: 0,
};

const tileLayer = new TileLayer({
  source: source,
  style: {
    contrast: ["var", "contrast"],
    brightness: ["var", "brightness"],
    variables: imageVariables,
  },
});
const map = new Map({
  target: "map",
  controls: defaultControls({ zoom: false }),
  layers: [tileLayer],
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

initIconMode(map);
initRouteMode(map);
initNotificationMode();
setMode("notification");

map.on("loadstart", function () {
  progress.show();
});
map.on("loadend", function () {
  progress.hide();
});

map.on("click", async function (event) {
  if (mapMode === "marker") {
    handleIconMode(event);
  } else if (mapMode === "route") {
    await handlemapMode(event);
  }
});

for (let variable in imageVariables) {
  const name = variable;
  const element = document.getElementById(name);
  const value = imageVariables[name];
  element.value = value.toString();
  document.getElementById(name + "-value").innerText = value.toFixed(2);
  element.addEventListener("input", function (event) {
    const value = parseFloat(event.target.value);
    document.getElementById(name + "-value").innerText = value.toFixed(2);
    const updates = {};
    updates[name] = value;
    tileLayer.updateStyleVariables(updates);
  });
}

document.getElementById("zoomin").addEventListener("click",()=>{
  let view = map.getView();
  let zoom = view.getZoom();
  view.setZoom(zoom+1);
});
document.getElementById("zoomout").addEventListener("click",()=>{
  let view = map.getView();
  let zoom = view.getZoom();
  view.setZoom(zoom-1);
});