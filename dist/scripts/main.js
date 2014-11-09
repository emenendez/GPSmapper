"use strict";function showError(a){console.log(a)}function calcBounds(){var a=null;for(var b in layers)a?a.extend(layers[b].getBounds()):a=layers[b].getBounds();a&&map.fitBounds(a)}function removeLayer(a){layers[a]&&(map.removeLayer(layers[a]),delete layers[a])}function addLayer(a){client.readFile(a,function(b,c){if(b)return showError(b);var d=omnivore.gpx.parse(c);d.addTo(map),layers[a]=d,calcBounds()})}function poll(){client.pollForChanges(cursorTag,function(a,b){return a?showError(a):void(b.hasChanges?pullChanges():setTimeout(poll,1e3*b.retryAfter))})}function processChanges(a){a.forEach(function(a){".gpx"===a.path.substr(-4)&&(a.wasRemoved?(removeLayer(a.path),calcBounds()):(removeLayer(a.path),addLayer(a.path)))});var b=0;a.shouldBackOff&&(b=5e3),setTimeout(poll,b)}function pullChanges(){client.pullChanges(cursorTag,function(a,b){return a?showError(a):(cursorTag=b.cursorTag,void processChanges(b.changes))})}function run(a){client=a,pullChanges()}var client,cursorTag=null,layers={},map;$(function(){var a=new Dropbox.Client({key:"9a666eiuctz1yh4"}),b=L.latLng(39,-78);map=L.map("map").setView(b,13),L.tileLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",{attribution:"Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community"}).addTo(map),a.authenticate({interactive:!1},function(a,b){return a?showError(a):void(b.isAuthenticated()?run(b):b.authenticate(function(a,b){return a?showError(a):void run(b)}))})});