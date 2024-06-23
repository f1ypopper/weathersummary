import Feature from 'ol/Feature';
import { Style, Circle, Fill, Stroke, Icon } from 'ol/style';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { toLonLat, fromLonLat, transform as projTransform } from 'ol/proj';
import Polyline from 'ol/format/Polyline';
import LineString from 'ol/geom/LineString';
import { getVectorContext } from 'ol/render';
import Openrouteservice from 'openrouteservice-js'

let startPoint = null;
let endPoint = null;
let routeLine = null;
let routePoints = null;
let map;
let orsDirections;

let routeSource = new VectorSource();
let routeLayer = new VectorLayer({
    source: routeSource,
});
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
    routePoints = new Polyline({
        factor: 1e6,
    }).readGeometry(polyline, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
    });

    //NOTE: points seem to be scaled down by 10 in route geometry
    //hence point placed in atlanta gets a route placed in africa (near the equator)
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