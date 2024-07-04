import Feature from 'ol/Feature';
import { Style, Circle, Fill, Stroke, Icon, RegularShape } from 'ol/style';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { toLonLat, fromLonLat, transform as projTransform } from 'ol/proj';
import Polyline from 'ol/format/Polyline';
import LineString from 'ol/geom/LineString';
import { getVectorContext } from 'ol/render';
import Openrouteservice from 'openrouteservice-js'
import kompas from 'kompas';

let startPoint = null;
let endPoint = null;
let routeLine = null;
let routePoints = null;
let map;
let orsDirections;
/*
let geoMarkerStyle = new Style({
    image: new Circle({
        radius: 7,
        fill: new Fill({ color: 'green' }),
        stroke: new Stroke({
            color: 'white',
            width: 2,
        })
    })
});
*/
let geoMarkerStyle = new Style({
    image: new RegularShape({
        fill: new Fill({ color: 'green' }),
        stroke:  new Stroke({color: 'black', width: 2}),
        points: 3,
        radius: 20,
    })
});

let routeSource = new VectorSource();
let routeLayer = new VectorLayer({
    source: routeSource,
});

let route = null;
//animation variables
let geoMarker = null;
let lastTime = null;
let distance = 0;
let position = null;
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

function moveFeature(event) {
    const speed = 60;
    const time = event.frameState.time;
    const elapsedTime = time - lastTime;
    distance = (distance + (speed * elapsedTime) / 1e6) % 2;
    lastTime = time;

    const coord = distance > 1 ? 2 - distance : distance;
    const direction = distance > 1 ? -Math.PI / 2 : Math.PI / 2;
    const currentCoordinate = route.getCoordinateAt(
        coord
    );
    const angle = getAngleAt(route, coord) + direction;
    geoMarkerStyle.getImage().setRotation(angle);
    position.setCoordinates(currentCoordinate);
    const vectorContext = getVectorContext(event);
    vectorContext.setStyle(geoMarkerStyle);
    vectorContext.drawGeometry(position);
    map.render();
}

function getAngleAt(lineString, distance) {
    const length = lineString.getLength();
    const coordinates = lineString.getCoordinates();
    for (let i = 1, len = coordinates.length; i < len; ++i) {
        if (
            new LineString(coordinates.slice(0, i)).getLength() >=
            length * distance
        ) {
            return -Math.atan2(
                coordinates[i][1] - coordinates[i - 1][1],
                coordinates[i][0] - coordinates[i - 1][0]
            );
        }
    }
}

function startAnimation() {
    lastTime = Date.now();
    routeLayer.on('postrender', moveFeature);
    geoMarker.setGeometry(null);
}

function stopAnimation() {
    routeLayer.un('postrender', moveFeature);
}


function drawRoute(polyline) {
    routePoints = new Polyline({
        factor: 1e6,
    }).readGeometry(polyline, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
    });

    //NOTE: points seem to be scaled down by 10 in route geometry
    //hence point placed in atlanta gets a route placed in africa (near the equator)
    const transformedRoutePoints = routePoints.getCoordinates().map((coord) => { return toLonLat(coord).map(c => c * 10); }).map((coord) => fromLonLat(coord));

    const routeStyle = new Style({
        stroke: new Stroke({
            width: 6,
            color: "blue",
        }),
    });
    route = new LineString(transformedRoutePoints);
    routeLine = new Feature(route);
    routeLine.setStyle(routeStyle);
    routeSource.addFeature(routeLine);
    //animation starts here 
    position = startPoint.getGeometry().clone();
    geoMarker = new Feature({ geometry: position });
    geoMarker.setStyle(geoMarkerStyle);
    routeLayer.getSource().addFeature(geoMarker);
    startAnimation();
}

export async function handleDirectionMode(event) {
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
            stopAnimation();
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
function addPoint(coordinates, color) {
    const circleStyle = new Style({
        image: new Circle({
            radius: 6,
            fill: new Fill({ color: color }),
            stroke: new Stroke({ color: color === "white" ? "black" : "white", width: 2 })
        })
    });

    const circleFeature = new Feature({
        geometry: new Point(coordinates),
    });
    circleFeature.setStyle(circleStyle);
    return circleFeature;
}


export function initDirectionMode(m) {
    map = m;
    orsDirections = new Openrouteservice.Directions({ api_key: "5b3ce3597851110001cf624850a09fa01da2494b825165c544441b76" });
    map.addLayer(routeLayer);
}

function startCompass() {
    kompas()
      .watch()
      .on('heading', function (heading) {
        style.getImage().setRotation((Math.PI / 180) * heading);
      });
      console.log("test");
}
  
  if (
    window.DeviceOrientationEvent &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    locate.addEventListener('click', function () {
      DeviceOrientationEvent.requestPermission()
        .then(startCompass)
        .catch(function (error) {
          alert(`ERROR: ${error.message}`);
          console.log("test");
        });
    });
  } else if ('ondeviceorientationabsolute' in window) {
    startCompass();
    console.log("test");
  } else {
    alert('No device orientation provided by device');
    console.log("test");
  }