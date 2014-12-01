'use strict';

// Display errors
function showError(error) {
  console.log(error);
}

// Fit the map to all current layers
function calcBounds() {
  // Iterate over all layers and calculate maximum bounds
  var bounds = null;
  for (var layer in layers) {
    if (!bounds) {
      bounds = layers[layer].getBounds();
    }
    else {
      bounds.extend(layers[layer].getBounds());
    }
  }
  // Fit the map to the max bounds
  if (bounds) {
    map.fitBounds(bounds);
  }
}

// Remove a layer from the map, if it exists
function removeLayer(path) {
  if (layers[path]) {
    map.removeLayer(layers[path]);
    delete layers[path];
  }
}

// Add a layer to the map and adjust the map fit accordingly
function addLayer(path) {
  // Read the file from Dropbox
  client.readFile(path, function(error, data) {
    if(error) {
      return showError(error);
    }
    // Parse GPX into a layer
    var layer = omnivore.gpx.parse(data).bindLabel(path.substr(1));
    // Add to map
    layer.addTo(map);
    // Add to layers object
    layers[path] = layer;
    // Fit the map
    calcBounds();
  });
}

// Wait for next change and process
function poll() {
  // Long-poll for changes
  client.pollForChanges(cursorTag, function(error, result) {
    if (error) {
      return showError(error);
    }

    if (result.hasChanges) {
      // Changes detected; pull and process
      pullChanges();
    }
    else {
      // No changes detected; poll again.
      setTimeout(poll, result.retryAfter * 1000);
    }
  });
}

// Iterate through a list of changes from Dropbox, apply to map, and wait for next change
function processChanges(changes) {
  changes.forEach(function(change) {
    // Only process .gpx files
    if (change.path.substr(-4) === '.gpx') {
      if (change.wasRemoved) {
        // Remove deleted file from map and fit map
        removeLayer(change.path);
        calcBounds();
      }
      else {
        // Remove file if it already existed
        removeLayer(change.path); 
        // Add file to map and fit map
        addLayer(change.path);
      }
    }
  });

  // Wait for next change
  var interval = 0;
  if (changes.shouldBackOff) {
    interval = 5000;
  }
  setTimeout(poll, interval);
}

// Pull latest changes from Dropbox, apply to map, and wait for the next change
function pullChanges() {
  // Get changes since last call
  client.pullChanges(cursorTag, function(error, changes) {
    if (error) {
      return showError(error);
    }
    // Update the cursor for the next call
    cursorTag = changes.cursorTag;
    // Apply the changes to the map
    processChanges(changes.changes);
  });
}

// Start poll-pull-process loop
function run(newClient) {
  // Set global authenticated client
  client = newClient;
  pullChanges();
}

// Globals
var client;
var cursorTag = null;
var layers = {};
var map;

// Run when page is ready
$(function() {
  // Hack to redirect to HTTPS
  if ((window.location.host === 'emenendez.github.io') && (window.location.protocol !== 'https:')) {
    window.location.protocol = 'https';
    return;
  }

  var newClient = new Dropbox.Client({ key: '9a666eiuctz1yh4' });

  // Init map
  var defaultCenter = L.latLng(39, -78);
  map = L.map('map').setView(defaultCenter, 13);

  // Set up layers
  var baseMaps = {
    'Esri Topo Map': L.tileLayer.provider('Esri.WorldTopoMap'),
    'Esri Street Map': L.tileLayer.provider('Esri.WorldStreetMap'),
    'OpenStreetMap': L.tileLayer.provider('OpenStreetMap.Mapnik'),
    'Esri Imagery': L.tileLayer.provider('Esri.WorldImagery'),
    'MapQuest Imagery': L.tileLayer.provider('MapQuestOpen.Aerial'),
  };

  // Add first layer to map
  for(var baseMap in baseMaps) {
    baseMaps[baseMap].addTo(map);
    break;
  }

  // Add layers control
  L.control.layers(baseMaps).addTo(map);

  // Init Dropbox
  newClient.authenticate({interactive: false}, function(error, client) {
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
});