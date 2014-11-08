var client = new Dropbox.Client({ key: '9a666eiuctz1yh4' });

var cursorTag = null;
var layers = Array();

// Init map
var defaultCenter = L.latLng(39, -78)
var map = L.map('map').setView(defaultCenter, 13);

L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
}).addTo(map);

// Init Dropbox
client.authenticate({interactive: false}, function(error, client) {
  if (error) {
    return showError(error);
  }

  if (client.isAuthenticated()) {
  	run(client);
  }
  else {
  	client.authenticate(function(error, client) {
  		if (error) {
  			return showError(error);
  		}
  		run(client);
  	});
  }

});

function calcBounds() {
  bounds = null
  layers.forEach(function(layer) {
    if (!bounds) {
      bounds = layer.layer.getBounds();
    }
    else {
      bounds.extend(layer.layer.getBounds());
    }
  });

  if (bounds) {
    map.fitBounds(bounds);
  }
}

function pullChanges() {
  client.pullChanges(cursorTag, function(error, changes) {
    if (error) {
      return showError(error);
    }

    cursorTag = changes.cursorTag;

    processChanges(changes.changes);
  });
}


function processChanges(changes) {
  changes.forEach(function(change) {
    if (change.wasRemoved) {
      console.log('Removed: ' + change.path);
      for(i = 0; i < layers.length; i++) {
        if (layers[i].path == change.path) {
          map.removeLayer(layers[i].layer);
          layers.splice(i, 1);
          calcBounds();
          break;
        }
      }
    }
    else {
      console.log(change.path);
      if (change.path.substr(-4) == '.gpx') {
        client.readFile(change.path, function(error, data) {
          if(error) {
            return showError(error);
          }

          layer = omnivore.gpx.parse(data);
          layer.addTo(map);
          layers.push({'layer': layer, 'path': change.path});
          calcBounds();
        });
      }
    }
  });

  if (changes.shouldBackOff) {
    interval = 5000;
  }
  else {
    interval = 0;
  }

  setTimeout(poll, interval);
}

function poll() {
  console.log('Polling for changes...');
  client.pollForChanges(cursorTag, function(error, result) {
    if (error) {
      return showError(error);
    }

    if (result.hasChanges) {
      console.log('Changes detected.');
      pullChanges();
    }
    else {
      console.log('No changes detected.');
      setTimeout(poll, result.retryAfter * 1000);
    }
  });
}

function run(client) {
	console.log('running');

  pullChanges();
}

function showError(error) {
	console.log(error);
}