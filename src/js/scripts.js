/* global mapboxgl: true; */

import $ from 'jquery';
import GeoJSON from 'geojson';
import pym from 'pym.js';

const pymChild = new pym.Child();

let mapZoom;
let mapCenter;

if ($(window).width() >= 500) {
  mapZoom = 4;
  mapCenter = [-99.9018, 30.9686];
} else {
  mapZoom = 3.5;
  mapCenter = [-99.9018, 30.9686];
}

const map = new mapboxgl.Map({
  container: 'map',
  style: 'https://maps.dallasnews.com/styles.json',
  center: mapCenter,
  zoom: mapZoom,
  attributionControl: false,
});

// disable the scroll wheel zoom
map.scrollZoom.disable();

// add navigation controls
map.addControl(new mapboxgl.NavigationControl());

// after map is loaded, go get the data
map.on('load', () => getData());

function createPopupContent(feature) {
  // grab the id property from the feature we've selected
  let content = '';
  content += `<h5>${feature.properties.name}</h5>`;
  content += `<p><strong>Location: </strong> ${feature.properties.city}</p>`;
  content += `<p><strong>Minors housed:</strong> ${feature.properties.censusjune212018}</p>`;
  const percFilled = ((feature.properties.censusjune212018 / feature.properties.uacbedsjune212018) * 100).toFixed(1);
  content += `<p><strong>Percent filled: </strong>${percFilled}%</p>`;

  return content;
}

// ***** DISPLAY MAP TOOLTIP *****
// Displays tooltip on the map when a feature is clicked on.

function displayPopup(event) {
  // collect all the features at the point of the event
  const features = map.queryRenderedFeatures(event.point, {});

  // if there are no features at that point, return out of the function
  if (!features.length) { return; }

  // else, set feature to the first feature in the list of features
  const feature = features[0];

  // construct a new mapbox popup, set it's long/lat position to the long/lat
  // of the feature and set it's html to the result of the createPopupContent function
  const popup = new mapboxgl.Popup()
    .setLngLat(feature.geometry.coordinates)
    .setHTML(createPopupContent(feature));

  // add the popup to the map
  popup.addTo(map);

  // animate the map to the coordinates of the feature
  map.flyTo({
    center: feature.geometry.coordinates,
    zoom: 8,
  });
}


// ***** CONTROL MAP CURSOR *****
// Changes cursor appearance based on if cursor is hovered over map or map feature

function updateMapCursor(event) {
  // find all features at the point of the event
  const features = map.queryRenderedFeatures(event.point, {});
  // if the first feature in the list of features as an school propoerty, set the
  // cursor to a pointer
  map.getCanvas().style.cursor = (features.length && features[0].properties.censusjune212018 !== undefined) ? 'pointer' : '';
}

function createPresentation(data) {

  map.addSource('facilities', {
    type: 'geojson',
    data,
  });

  // adds the marker layer
  map.addLayer({
    id: 'markers',
    source: 'facilities',
    type: 'circle',
    paint: {
      'circle-radius': {
        property: 'censusjune212018',
        stops: [[1, 5], [1500, 30]],
      },
      'circle-color': '#329ce8',
      'circle-opacity': 0.65,
      'circle-stroke-color': '#FFFFFF',
      'circle-stroke-width': 1,
    },
  });

  // add click event to display popups when feature is clicked
  map.on('click', event => displayPopup(event));

  // changes cursor to pointer when mousing over a feature
  map.on('mousemove', event => updateMapCursor(event));
}

function formatData(data) {

  let gros = data.filter(facility => facility.type === 'GRO');

  gros.sort((a, b) => {
    if (a.censusjune212018 < b.censusjune212018) {
      return -1;
    }
    if (a.censusjune212018 > b.censusjune212018) {
      return 1;
    }
    return 0;
  });

  gros.reverse();

  gros = gros.filter(facility => facility.censusjune212018 > 0);

  const grosData = GeoJSON.parse(gros, { Point: ['lat', 'long'] });

  createPresentation(grosData);
}

function getData() {
  $.ajax({
    dataType: 'json',
    url: 'https://interactives.dallasnews.com/data-store/2018/2018_06_orr-child-housing-facilities.json',
    success: formatData,
    cache: false,
  });
}

//https://interactives.dallasnews.com/data-store/2018/2018_06_orr-child-housing-facilities.json

pymChild.sendHeight();
